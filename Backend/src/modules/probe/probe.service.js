import prisma from '../../config/database.js';
import { generateProbeToken, hashProbeToken } from './probe.auth.js';
import { multiProbeVerifier } from '../verification/multiProbeVerifier.js';

export const probeService = {
  /**
   * Leases pending or expired assignments to the requesting probe.
   */
  async leaseAssignments(probeId, limit = 10, leaseTtlMs = 30000) {
    const now = new Date();
    const expiry = new Date(now.getTime() + leaseTtlMs);

    // 1. Find candidates: PENDING, or LEASED but expired
    const candidates = await prisma.checkAssignment.findMany({
      where: {
        probeId,
        OR: [
          { status: 'PENDING' },
          { status: 'LEASED', leaseExpiresAt: { lt: now } },
        ],
      },
      take: Math.min(limit, 50),
      orderBy: [
        { kind: 'desc' }, // Prioritize DIAGNOSTIC_CONFIRMATION / CONTROL_CHECK over ROUTINE
        { createdAt: 'asc' },
      ],
      include: {
        device: {
          select: {
            id: true,
            name: true,
            host: true,
            timeoutMs: true,
            type: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      return [];
    }

    const assignmentIds = candidates.map(c => c.id);

    // 2. Atomically mark as LEASED
    await prisma.checkAssignment.updateMany({
      where: { id: { in: assignmentIds } },
      data: {
        status: 'LEASED',
        leasedAt: now,
        leaseExpiresAt: expiry,
        attemptCount: { increment: 1 },
      },
    });

    // Return sanitized assignment payloads
    return candidates.map(c => ({
      assignmentId: c.id,
      monitorId: c.monitorId,
      monitorName: c.device.name,
      targetUrl: c.targetUrl,
      kind: c.kind,
      timeoutMs: c.device.timeoutMs || 10000,
      leaseExpiresAt: expiry.toISOString(),
    }));
  },

  /**
   * Submits a check observation from a probe with lease validation,
   * idempotency, and routing into the multi-probe verification engine.
   */
  async recordResult(probe, assignmentId, data) {
    const now = new Date();

    // 1. Find the assignment
    const assignment = await prisma.checkAssignment.findUnique({
      where: { id: assignmentId },
      include: { device: true },
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Validate ownership (Reject submission from an unauthorized probe)
    if (assignment.probeId !== probe.id) {
      const error = new Error('Forbidden: Assignment was leased to a different probe identity');
      error.statusCode = 403;
      throw error;
    }

    // 3. Idempotency Check (Duplicate submissions must not duplicate results or inflations)
    if (assignment.status === 'COMPLETED') {
      const existing = await prisma.checkResult.findUnique({
        where: { assignmentId },
      });
      return {
        success: true,
        isDuplicate: true,
        message: 'Observation already processed for this assignment (idempotent)',
        result: existing,
      };
    }

    // 4. Lease expiration validation
    const isLate = assignment.leaseExpiresAt && now > assignment.leaseExpiresAt;

    // 5. Create CheckResult record
    const checkResult = await prisma.checkResult.create({
      data: {
        assignmentId,
        kind: assignment.kind,
        monitorId: assignment.monitorId,
        probeId: probe.id,
        status: data.status === 'UP' ? 'UP' : 'DOWN',
        latency: typeof data.latency === 'number' ? data.latency : null,
        dnsTime: typeof data.dnsTime === 'number' ? data.dnsTime : null,
        tcpTime: typeof data.tcpTime === 'number' ? data.tcpTime : null,
        tlsTime: typeof data.tlsTime === 'number' ? data.tlsTime : null,
        ttfbTime: typeof data.ttfbTime === 'number' ? data.ttfbTime : null,
        responseCode: typeof data.responseCode === 'number' ? data.responseCode : null,
        failureStage: data.failureStage || null,
        message: data.message || null,
        resolvedIp: data.resolvedIp || null,
        tlsCert: data.tlsCert || null,
        isLate,
        observedAt: data.observedAt ? new Date(data.observedAt) : now,
        receivedAt: now,
      },
    });

    // 6. Mark assignment as completed
    await prisma.checkAssignment.update({
      where: { id: assignmentId },
      data: { status: 'COMPLETED' },
    });

    // 7. Save backwards-compatible HealthLog for dashboard metrics & charts
    if (!isLate && assignment.device && assignment.kind !== 'CONTROL_CHECK') {
      await prisma.healthLog.create({
        data: {
          deviceId: assignment.monitorId,
          status: checkResult.status,
          latency: checkResult.latency,
          dnsTime: checkResult.dnsTime || 0,
          tcpTime: checkResult.tcpTime || 0,
          tlsTime: checkResult.tlsTime || 0,
          ttfbTime: checkResult.ttfbTime || 0,
          responseCode: checkResult.responseCode,
          message: checkResult.message,
          checkedAt: checkResult.observedAt,
        },
      });
    }

    // 8. Feed into Multi-Probe Verification Engine (Exclude late results from active diagnosis)
    let verificationOutcome = null;
    if (!isLate && assignment.device) {
      verificationOutcome = await multiProbeVerifier.processObservation({
        device: assignment.device,
        probe,
        checkResult,
        assignment,
      });
    }

    return {
      success: true,
      isDuplicate: false,
      isLate,
      result: checkResult,
      verification: verificationOutcome,
    };
  },

  /**
   * Records monitoring-process heartbeat from a probe.
   */
  async recordHeartbeat(probeId, { version, activeLeases = 0 }) {
    return prisma.probe.update({
      where: { id: probeId },
      data: {
        lastHeartbeatAt: new Date(),
        status: 'ONLINE',
        version: version || '1.0.0',
      },
    });
  },

  /**
   * Enrolls a new probe and returns the one-time raw bearer token.
   */
  async enrollProbe({ name, region }) {
    if (!name || !region) {
      throw new Error('Probe name and region are required');
    }

    const rawToken = generateProbeToken();
    const tokenHash = hashProbeToken(rawToken);

    const probe = await prisma.probe.create({
      data: {
        name,
        region,
        tokenHash,
        status: 'ONLINE',
      },
    });

    return {
      probe: {
        id: probe.id,
        name: probe.name,
        region: probe.region,
        status: probe.status,
        createdAt: probe.createdAt,
      },
      rawToken, // Provided ONCE for probe host configuration
    };
  },

  /**
   * Rotates a probe's secret token.
   */
  async rotateToken(probeId) {
    const rawToken = generateProbeToken();
    const tokenHash = hashProbeToken(rawToken);

    await prisma.probe.update({
      where: { id: probeId },
      data: {
        tokenHash,
        isRevoked: false,
        status: 'ONLINE',
      },
    });

    return { rawToken };
  },

  /**
   * Revokes a probe's credentials.
   */
  async revokeProbe(probeId) {
    return prisma.probe.update({
      where: { id: probeId },
      data: {
        isRevoked: true,
        status: 'REVOKED',
      },
    });
  },

  /**
   * Lists all probes in the fleet.
   */
  async listProbes() {
    const now = Date.now();
    const probes = await prisma.probe.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            assignments: { where: { status: 'LEASED' } },
            checkResults: true,
          },
        },
      },
    });

    return probes.map(p => {
      const isFresh = p.lastHeartbeatAt && (now - new Date(p.lastHeartbeatAt).getTime() < 60000); // 60s freshness
      const effectiveStatus = p.isRevoked ? 'REVOKED' : isFresh ? 'ONLINE' : 'OFFLINE';

      return {
        id: p.id,
        name: p.name,
        region: p.region,
        status: effectiveStatus,
        isRevoked: p.isRevoked,
        version: p.version,
        lastHeartbeatAt: p.lastHeartbeatAt,
        activeLeases: p._count.assignments,
        totalChecks: p._count.checkResults,
        createdAt: p.createdAt,
      };
    });
  },

  /**
   * Returns fleet overview statistics.
   */
  async getFleetOverview() {
    const probes = await this.listProbes();
    const onlineCount = probes.filter(p => p.status === 'ONLINE').length;
    const offlineCount = probes.filter(p => p.status === 'OFFLINE').length;
    const revokedCount = probes.filter(p => p.status === 'REVOKED').length;

    const regions = [...new Set(probes.map(p => p.region))];

    return {
      totalProbes: probes.length,
      onlineProbes: onlineCount,
      offlineProbes: offlineCount,
      revokedProbes: revokedCount,
      regions,
      probes,
    };
  },
};
