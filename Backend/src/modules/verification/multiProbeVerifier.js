import prisma from '../../config/database.js';

let _notificationService = null;
async function getNotificationService() {
  if (!_notificationService) {
    const mod = await import('../notification/notification.service.js');
    _notificationService = mod.notificationService;
  }
  return _notificationService;
}

let _redis = null;
async function getRedis() {
  if (!_redis) {
    const mod = await import('../../config/redis.js');
    _redis = mod.default;
  }
  return _redis;
}

const INVESTIGATION_COOLDOWN_SECONDS = 30;
const MAX_FOLLOW_UPS_PER_INVESTIGATION = 3;
const FRESHNESS_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

export const multiProbeVerifier = {
  /**
   * Evaluates an incoming check result from a probe, coordinates diagnostic follow-ups,
   * classifies the situation across probes, and maintains incident state.
   */
  async processObservation({ device, probe, checkResult, assignment }) {
    const deviceId = device.id;
    const probeId = probe.id;

    // 1. If this was a control check, record control health and exit
    if (assignment?.kind === 'CONTROL_CHECK') {
      await this.recordControlCheckObservation(probe, checkResult);
      return { type: 'CONTROL_RECORDED' };
    }

    const isAbnormal = (
      checkResult.status === 'DOWN' ||
      ['DNS_RESOLUTION', 'TCP_CONNECTION', 'TLS_VERIFICATION', 'TIMEOUT', 'SSRF_BLOCKED'].includes(checkResult.failureStage) ||
      (checkResult.latency && device.baselineLatency && checkResult.latency > device.baselineLatency * 3)
    );

    // 2. Fetch active incident for this device
    const activeIncident = await prisma.incident.findFirst({
      where: {
        deviceId,
        status: { in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] },
      },
      orderBy: { openedAt: 'desc' },
    });

    // 3. Handle Healthy Observation Path (Confirmed Recovery)
    if (!isAbnormal && checkResult.status === 'UP') {
      if (activeIncident) {
        return await this.evaluateRecovery(device, activeIncident);
      }
      return { type: 'HEALTHY_OBSERVATION' };
    }

    // 4. Abnormal Observation Path: Schedule Bounded Follow-ups if not in cooldown
    const cooldownKey = `investigation_cooldown:${deviceId}`;
    const redis = await getRedis();
    const isInCooldown = await redis.get(cooldownKey);

    if (!isInCooldown) {
      await redis.set(cooldownKey, 'active', 'EX', INVESTIGATION_COOLDOWN_SECONDS);
      await this.scheduleDiagnosticFollowUps(device, probe, checkResult);
    }

    // 5. Gather fresh observations across participating probes
    const sinceTime = new Date(Date.now() - FRESHNESS_WINDOW_MS);
    const recentResults = await prisma.checkResult.findMany({
      where: {
        monitorId: deviceId,
        observedAt: { gte: sinceTime },
        isLate: false,
      },
      include: { probe: true },
      orderBy: { observedAt: 'desc' },
      take: 20,
    });

    // Gather probe control checks
    const recentControls = await this.getRecentControlStatus(recentResults.map(r => r.probeId));

    // 6. Run Deterministic Multi-Probe Assessment
    const assessmentData = this.classifySituation({
      device,
      reportingProbe: probe,
      reportingResult: checkResult,
      recentResults,
      controlStatus: recentControls,
    });

    // 7. Open or Update Incident
    if (activeIncident) {
      const updatedIncident = await prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          status: 'INVESTIGATING',
          assessment: assessmentData.assessment,
          failedStage: assessmentData.failedStage,
          affectedLocations: assessmentData.affectedLocations,
          supportingEvidence: assessmentData.evidence,
          uncertainties: assessmentData.uncertainties,
          summary: assessmentData.summary,
          error: checkResult.message || assessmentData.summary,
          priority: assessmentData.priority,
          priorityReason: assessmentData.priorityReason,
          timeline: [
            ...(Array.isArray(activeIncident.timeline) ? activeIncident.timeline : []),
            {
              timestamp: new Date().toISOString(),
              event: `Assessment updated to ${assessmentData.assessment} by probe ${probe.name} (${probe.region})`,
              stage: checkResult.failureStage,
            },
          ],
        },
      });

      return { type: 'INCIDENT_UPDATED', incident: updatedIncident };
    } else {
      // Create new incident
      const newIncident = await prisma.incident.create({
        data: {
          deviceId,
          type: assessmentData.assessment === 'LATENCY_DEGRADATION' ? 'LATENCY_SPIKE' : 'DOWNTIME',
          status: 'OPEN',
          assessment: assessmentData.assessment,
          failedStage: assessmentData.failedStage,
          affectedLocations: assessmentData.affectedLocations,
          supportingEvidence: assessmentData.evidence,
          uncertainties: assessmentData.uncertainties,
          summary: assessmentData.summary,
          error: checkResult.message || assessmentData.summary,
          priority: assessmentData.priority,
          priorityScore: assessmentData.priorityScore,
          priorityReason: assessmentData.priorityReason,
          openedAt: new Date(),
          timeline: [
            {
              timestamp: new Date().toISOString(),
              event: `Incident opened: ${assessmentData.assessment} detected by probe ${probe.name} (${probe.region})`,
              stage: checkResult.failureStage,
            },
          ],
        },
      });

      // Dispatch 1 Incident Notification
      const notifier = await getNotificationService();
      await notifier.dispatchNotification({
        userId: device.userId,
        deviceId,
        incidentId: newIncident.id,
        type: 'INCIDENT',
        title: `[${assessmentData.priority}] ${assessmentData.assessment.replace(/_/g, ' ')} on ${device.name}`,
        message: assessmentData.summary,
        severity: assessmentData.priority,
      });

      return { type: 'INCIDENT_OPENED', incident: newIncident };
    }
  },

  /**
   * Deterministic decision logic mapping multi-probe observations to honest assessments.
   */
  classifySituation({ device, reportingProbe, reportingResult, recentResults, controlStatus }) {
    const resultsByProbe = new Map();
    for (const res of recentResults) {
      if (!resultsByProbe.has(res.probeId)) {
        resultsByProbe.set(res.probeId, res);
      }
    }

    // Ensure the current reporting result is present
    if (!resultsByProbe.has(reportingProbe.id)) {
      resultsByProbe.set(reportingProbe.id, { ...reportingResult, probe: reportingProbe });
    }

    const participatingProbes = Array.from(resultsByProbe.values());
    const downProbes = participatingProbes.filter(p => p.status === 'DOWN');
    const upProbes = participatingProbes.filter(p => p.status === 'UP');
    const affectedLocations = [...new Set(downProbes.map(p => p.probe?.region || 'unknown'))];

    // Check control endpoint health for the reporting probe
    const reportingProbeControl = controlStatus[reportingProbe.id];
    const isReportingProbeControlFailing = reportingProbeControl && reportingProbeControl.status === 'DOWN';

    let assessment = 'INSUFFICIENT_EVIDENCE';
    let failedStage = reportingResult.failureStage || 'UNKNOWN';
    let summary = '';
    let priority = 'MEDIUM';
    let priorityScore = 5.0;
    let priorityReason = '';

    // Standardized uncertainty disclaimers
    const uncertainties = [
      `Observations derived from ${participatingProbes.length} participating probe location(s); does not represent global internet routing.`,
      `Control endpoint checks confirm probe local egress, but cannot guarantee absence of upstream transit peering impairments.`,
    ];

    if (participatingProbes.length < 2) {
      uncertainties.push('Single active probe observation; awaiting independent cross-region confirmation.');
    }

    // 1. Probe/Connectivity Problem Suspected
    // Target fails AND the reporting probe's control check also fails!
    if (isReportingProbeControlFailing) {
      assessment = 'PROBE_CONNECTIVITY_SUSPECTED';
      summary = `Failures on ${device.name} cluster at probe ${reportingProbe.name} (${reportingProbe.region}) alongside control endpoint failures. Probe egress or connectivity degradation suspected.`;
      priority = 'LOW';
      priorityScore = 3.0;
      priorityReason = 'Target failure correlates with probe local control failure.';
      uncertainties.push(`Target may be healthy; probe ${reportingProbe.name} failed connectivity to control target (${reportingProbeControl.url}).`);
    }
    // 2. DNS Resolution Failure
    else if (reportingResult.failureStage === 'DNS_RESOLUTION') {
      assessment = 'DNS_FAILURE';
      summary = `DNS resolution failure observed on ${device.name} (${device.host}) from ${reportingProbe.region}: ${reportingResult.message}`;
      priority = 'HIGH';
      priorityScore = 7.5;
      priorityReason = 'Target hostname could not be resolved to a valid IP address.';
      failedStage = 'DNS_RESOLUTION';
    }
    // 3. TLS / Certificate Verification Failure
    else if (reportingResult.failureStage === 'TLS_VERIFICATION') {
      assessment = 'TLS_CERTIFICATE_FAILURE';
      const certNote = reportingResult.tlsCert ? ` (Issuer: ${reportingResult.tlsCert.issuer}, Days left: ${reportingResult.tlsCert.daysRemaining})` : '';
      summary = `TLS certificate verification failure on ${device.name}: ${reportingResult.message}${certNote}`;
      priority = 'HIGH';
      priorityScore = 8.0;
      priorityReason = 'TLS handshake or certificate trust validation failed.';
      failedStage = 'TLS_VERIFICATION';
    }
    // 4. SSRF Blocked Destination
    else if (reportingResult.failureStage === 'SSRF_BLOCKED') {
      assessment = 'LOCATION_SPECIFIC_FAILURE';
      summary = `Execution-time SSRF security guard blocked request to ${device.name}: ${reportingResult.message}`;
      priority = 'CRITICAL';
      priorityScore = 9.0;
      priorityReason = 'Target destination resolved to forbidden private/cloud metadata address.';
      failedStage = 'SSRF_BLOCKED';
    }
    // 5. Widespread Failure Observed (All participating probes observed DOWN)
    else if (participatingProbes.length >= 2 && downProbes.length === participatingProbes.length) {
      assessment = 'WIDESPREAD_FAILURE';
      summary = `Widespread failure confirmed on ${device.name} across ${participatingProbes.length} independent probe locations (${affectedLocations.join(', ')}).`;
      priority = 'CRITICAL';
      priorityScore = 9.5;
      priorityReason = 'Target confirmed unreachable from all independent participating probe locations.';
    }
    // 6. Location-Specific Failure Observed (One probe fails, another succeeds, control passes)
    else if (downProbes.length > 0 && upProbes.length > 0) {
      assessment = 'LOCATION_SPECIFIC_FAILURE';
      const healthyRegions = upProbes.map(p => p.probe?.region || 'unknown').join(', ');
      summary = `Location-specific failure observed on ${device.name}: failing in ${affectedLocations.join(', ')}, but succeeding from ${healthyRegions}.`;
      priority = 'MEDIUM';
      priorityScore = 6.0;
      priorityReason = 'Target reachable from some regions but failing from others; control endpoints healthy.';
    }
    // 7. Latency Degradation
    else if (reportingResult.status === 'UP' && device.baselineLatency && reportingResult.latency > device.baselineLatency * 2.5) {
      assessment = 'LATENCY_DEGRADATION';
      summary = `Elevated latency observed on ${device.name}: ${reportingResult.latency}ms (baseline: ${device.baselineLatency}ms).`;
      priority = 'LOW';
      priorityScore = 4.0;
      priorityReason = 'Response latency exceeds baseline threshold.';
      failedStage = 'HTTP_STATUS';
    }
    // 8. Insufficient Evidence
    else {
      assessment = 'INSUFFICIENT_EVIDENCE';
      summary = `Abnormal observation recorded on ${device.name} (${device.host}); awaiting additional cross-location evidence.`;
      priority = 'LOW';
      priorityScore = 3.0;
      priorityReason = 'Awaiting confirmation checks from independent probes.';
    }

    const evidence = {
      reportingProbe: { id: reportingProbe.id, name: reportingProbe.name, region: reportingProbe.region },
      participatingProbesCount: participatingProbes.length,
      affectedLocations,
      probeVerdicts: participatingProbes.map(p => ({
        probeId: p.probeId,
        probeName: p.probe?.name,
        region: p.probe?.region,
        status: p.status,
        latency: p.latency,
        failureStage: p.failureStage,
        observedAt: p.observedAt,
      })),
      controlEndpointVerdict: reportingProbeControl || { status: 'UNKNOWN', reason: 'No recent control check recorded' },
      diagnosticDetails: {
        stage: failedStage,
        resolvedIp: reportingResult.resolvedIp,
        httpStatus: reportingResult.responseCode,
        tlsCert: reportingResult.tlsCert,
        message: reportingResult.message,
      },
    };

    return {
      assessment,
      failedStage,
      affectedLocations,
      evidence,
      uncertainties,
      summary,
      priority,
      priorityScore,
      priorityReason,
    };
  },

  /**
   * Evaluates if an active incident has recovered across participating probes.
   */
  async evaluateRecovery(device, activeIncident) {
    const sinceTime = new Date(Date.now() - FRESHNESS_WINDOW_MS);
    const recentResults = await prisma.checkResult.findMany({
      where: {
        monitorId: device.id,
        observedAt: { gte: sinceTime },
        isLate: false,
      },
      include: { probe: true },
      orderBy: { observedAt: 'desc' },
      take: 10,
    });

    if (recentResults.length < 2) {
      return { type: 'AWAITING_RECOVERY_SAMPLES' };
    }

    // Check if ALL recent results across all probes in the window are UP
    const hasAnyFailure = recentResults.some(r => r.status === 'DOWN');
    if (hasAnyFailure) {
      return { type: 'RECOVERY_NOT_CONFIRMED' };
    }

    // Confirmed Recovery across participating probes!
    const resolvedIncident = await prisma.incident.update({
      where: { id: activeIncident.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        timeline: [
          ...(Array.isArray(activeIncident.timeline) ? activeIncident.timeline : []),
          {
            timestamp: new Date().toISOString(),
            event: `Incident resolved: confirmed healthy observations from ${recentResults.length} checks across participating probes.`,
          },
        ],
      },
    });

    // Dispatch recovery notification
    const notifier = await getNotificationService();
    await notifier.dispatchNotification({
      userId: device.userId,
      deviceId: device.id,
      incidentId: activeIncident.id,
      type: 'RECOVERY',
      title: `Confirmed Recovery: ${device.name}`,
      message: `${device.name} (${device.host}) is healthy across all participating probe locations.`,
      severity: 'LOW',
    });

    return { type: 'INCIDENT_RESOLVED', incident: resolvedIncident };
  },

  /**
   * Schedules bounded diagnostic follow-ups (confirmation on another probe + control check).
   */
  async scheduleDiagnosticFollowUps(device, reportingProbe, checkResult) {
    try {
      // 1. Find eligible other probes
      const otherProbes = await prisma.probe.findMany({
        where: {
          id: { not: reportingProbe.id },
          status: 'ONLINE',
          isRevoked: false,
        },
        take: MAX_FOLLOW_UPS_PER_INVESTIGATION - 1,
      });

      // Schedule high-priority confirmation check on other probes
      for (const probe of otherProbes) {
        await prisma.checkAssignment.create({
          data: {
            monitorId: device.id,
            probeId: probe.id,
            kind: 'DIAGNOSTIC_CONFIRMATION',
            targetUrl: device.host,
            status: 'PENDING',
          },
        });
      }

      // 2. Schedule control check for the reporting probe
      const controlEndpoint = await prisma.controlEndpoint.findFirst({
        where: { enabled: true },
      });

      if (controlEndpoint) {
        await prisma.checkAssignment.create({
          data: {
            monitorId: device.id,
            probeId: reportingProbe.id,
            kind: 'CONTROL_CHECK',
            targetUrl: controlEndpoint.url,
            status: 'PENDING',
          },
        });
      }
    } catch (err) {
      console.warn(`[MultiProbeVerifier] Failed to schedule diagnostic follow-up: ${err.message}`);
    }
  },

  /**
   * Stores control check result in Redis for rapid cross-checking.
   */
  async recordControlCheckObservation(probe, checkResult) {
    const redis = await getRedis();
    const key = `probe_control_health:${probe.id}`;
    const payload = JSON.stringify({
      status: checkResult.status,
      latency: checkResult.latency,
      url: checkResult.message,
      observedAt: new Date().toISOString(),
    });
    await redis.set(key, payload, 'EX', 300); // 5 minute TTL
  },

  /**
   * Fetches recent control check status for a list of probe IDs.
   */
  async getRecentControlStatus(probeIds) {
    const redis = await getRedis();
    const statusMap = {};
    for (const id of probeIds) {
      const data = await redis.get(`probe_control_health:${id}`);
      if (data) {
        try {
          statusMap[id] = JSON.parse(data);
        } catch {
          statusMap[id] = null;
        }
      }
    }
    return statusMap;
  },
};
