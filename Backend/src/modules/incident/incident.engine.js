import redisConnection from '../../config/redis.js';
import prisma from '../../config/database.js';
import { incidentService } from './incident.service.js';
import { notificationService } from '../notification/notification.service.js';
import { aiClient } from '../../utils/aiClient.js';

const DEBOUNCE_THRESHOLD = 3; // Requires 3 consecutive samples before incident creation / resolution

export const incidentEngine = {
  /**
   * Process a telemetry check sample through the Smart Incident Engine state machine:
   * TELEMETRY ➔ ANOMALY ➔ PERSISTENT THRESHOLD ➔ INCIDENT ➔ DEBOUNCED RESOLUTION
   */
  async processTelemetrySample(device, checkResult, statAnomaly, aiAnomaly, latestAgentMetric) {
    const deviceId = device.id;
    const currentStatus = checkResult.status;

    // Keys for Redis consecutive counters
    const keyDown = `consecutive_down:${deviceId}`;
    const keyAnomaly = `consecutive_anomaly:${deviceId}`;
    const keyHealthy = `consecutive_healthy:${deviceId}`;

    // 1. Evaluate Anomaly Score
    const combinedScore = Math.max(statAnomaly?.anomalyScore || 0.0, aiAnomaly?.anomaly_score || 0.0);
    const combinedSeverity = combinedScore >= 0.75 ? 'CRITICAL' : combinedScore >= 0.60 ? 'HIGH' : combinedScore >= 0.40 ? 'MEDIUM' : 'LOW';
    const isAnomalyDetected = statAnomaly?.isAnomaly || aiAnomaly?.is_anomaly || combinedScore >= 0.40;

    // Record Anomaly in Postgres without immediately sending email or creating incident
    let anomalyRecord = null;
    if (isAnomalyDetected) {
      anomalyRecord = await prisma.anomaly.create({
        data: {
          deviceId,
          anomalyScore: combinedScore,
          severity: combinedSeverity,
          detectionReason: statAnomaly?.detectionReason || aiAnomaly?.detection_reason || 'Telemetry anomaly recorded',
          metrics: {
            ...statAnomaly?.metrics,
            aiEvaluated: aiAnomaly?.metrics_evaluated || {},
          },
        },
      });
      console.log(`📊 [TELEMETRY ANOMALY RECORDED] ${device.name} (${device.host}) | Score: ${combinedScore} | Severity: ${combinedSeverity} (No immediate email alert)`);
    }

    // 2. Update Consecutive Counter Samples in Redis
    let consecutiveDown = 0;
    let consecutiveAnomaly = 0;
    let consecutiveHealthy = 0;

    if (currentStatus === 'DOWN') {
      consecutiveDown = await redisConnection.incr(keyDown);
      await redisConnection.set(keyHealthy, 0);
    } else {
      await redisConnection.set(keyDown, 0);
    }

    if (['HIGH', 'CRITICAL'].includes(combinedSeverity)) {
      consecutiveAnomaly = await redisConnection.incr(keyAnomaly);
    } else {
      await redisConnection.set(keyAnomaly, 0);
    }

    if (currentStatus === 'UP' && combinedScore < 0.40) {
      consecutiveHealthy = await redisConnection.incr(keyHealthy);
    } else {
      await redisConnection.set(keyHealthy, 0);
    }

    // Read current state of counters
    consecutiveDown = Number(await redisConnection.get(keyDown)) || 0;
    consecutiveAnomaly = Number(await redisConnection.get(keyAnomaly)) || 0;
    consecutiveHealthy = Number(await redisConnection.get(keyHealthy)) || 0;

    // 3. Check for Active Incident in DB (Deduplication Check)
    const activeIncident = await prisma.incident.findFirst({
      where: {
        deviceId,
        status: { in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED', 'RECOVERING'] },
      },
      orderBy: { openedAt: 'desc' },
    });

    // 4. Evaluate Incident Creation Criteria
    const isCorrelatedSpike = (latestAgentMetric?.cpuPercent >= 90) && (checkResult.latency >= 800);
    const requiresIncident = (consecutiveDown >= DEBOUNCE_THRESHOLD) || (consecutiveAnomaly >= DEBOUNCE_THRESHOLD) || isCorrelatedSpike;

    if (requiresIncident) {
      // LLM Token & Cost Protection: Only invoke LLM API on NEW incident creation or when severity escalates!
      const isSeverityEscalation = activeIncident && combinedSeverity !== activeIncident.priority;
      const shouldInvokeLLM = !activeIncident || isSeverityEscalation;

      let priorityRes = { priority: combinedSeverity, priority_score: 5.0, priority_reason: 'Consecutive threshold met' };
      let llmAnalysis = null;

      if (shouldInvokeLLM) {
        // Fetch 30-check health history for grounding
        const history = await prisma.healthLog.findMany({
          where: { deviceId },
          orderBy: { checkedAt: 'desc' },
          take: 30,
        });

        const downCount = history.filter((h) => h.status === 'DOWN').length;
        const errorRate = history.length > 0 ? history.filter((h) => h.status === 'DOWN' || (h.responseCode && h.responseCode >= 400)).length / history.length : 0.5;

        try {
          priorityRes = await aiClient.prioritizeAlert(
            combinedSeverity,
            history.length,
            downCount,
            errorRate,
            consecutiveDown,
            device.name,
            combinedScore
          );

          llmAnalysis = await aiClient.analyzeIncident(
            device,
            combinedScore,
            priorityRes.priority,
            statAnomaly?.detectionReason || checkResult.message,
            history.slice(-10),
            statAnomaly?.metrics
          );
        } catch (err) {
          console.warn(`[IncidentEngine] AI analysis fallback: ${err.message}`);
          llmAnalysis = {
            incident_summary: `Persistent degradation on ${device.name} (${device.host}). ${checkResult.message || statAnomaly?.detectionReason}`,
            severity: priorityRes.priority,
            observations: [
              `Consecutive failed checks: ${consecutiveDown}`,
              `Consecutive anomaly samples: ${consecutiveAnomaly}`,
            ],
            possible_causes: ['Sustained network latency or application process exhaustion'],
            recommended_investigations: ['Inspect host process logs and network socket health'],
            confidence: 0.85,
          };
        }
      }

      // Grounded SRE Recovery Recommendation Safety Rule
      // Do NOT recommend restart_service merely for high CPU if service is healthy (HTTP 200)
      if (latestAgentMetric?.cpuPercent >= 85 && checkResult.status === 'UP' && (!checkResult.responseCode || checkResult.responseCode < 400)) {
        if (llmAnalysis && Array.isArray(llmAnalysis.recommended_investigations)) {
          llmAnalysis.recommended_investigations = llmAnalysis.recommended_investigations.map((rec) =>
            rec.includes('restart_service') ? 'inspect_processes: Inspect CPU-consuming processes (top/htop)' : rec
          );
        }
      }

      const incidentType = currentStatus === 'DOWN' ? 'DOWNTIME' : isCorrelatedSpike ? 'SERVICE_DEGRADATION' : 'ANOMALY';

      if (activeIncident) {
        // DEDUPLICATION: Update existing incident instead of creating duplicates!
        const updatedIncident = await prisma.incident.update({
          where: { id: activeIncident.id },
          data: {
            error: checkResult.message || statAnomaly?.detectionReason || activeIncident.error,
            priority: priorityRes.priority,
            priorityScore: priorityRes.priority_score,
            summary: llmAnalysis?.incident_summary || activeIncident.summary,
            possibleCauses: llmAnalysis?.possible_causes || activeIncident.possibleCauses,
            recommendedActions: llmAnalysis?.recommended_investigations || activeIncident.recommendedActions,
            evidence: {
              consecutiveDown,
              consecutiveAnomaly,
              latestLatency: checkResult.latency,
              cpuPercent: latestAgentMetric?.cpuPercent || null,
            },
          },
        });
        console.log(`🚨 [INCIDENT UPDATED (DEDUPLICATED)] ID: ${activeIncident.id} | Device: ${device.name} | Samples Down: ${consecutiveDown}`);
        return updatedIncident;
      } else {
        // Create new Incident (Only when threshold is met)
        const newIncident = await prisma.incident.create({
          data: {
            deviceId,
            type: incidentType,
            status: 'OPEN',
            error: checkResult.message || statAnomaly?.detectionReason || 'Persistent threshold violation',
            priority: priorityRes.priority,
            priorityScore: priorityRes.priority_score,
            priorityReason: priorityRes.priority_reason,
            summary: llmAnalysis?.incident_summary || `Persistent operational incident detected on ${device.name}`,
            possibleCauses: llmAnalysis?.possible_causes || [],
            recommendedActions: llmAnalysis?.recommended_investigations || [],
            evidence: {
              consecutiveDown,
              consecutiveAnomaly,
              latestLatency: checkResult.latency,
              cpuPercent: latestAgentMetric?.cpuPercent || null,
            },
            confidence: llmAnalysis?.confidence || 0.85,
            anomalyId: anomalyRecord?.id || null,
            openedAt: new Date(),
          },
        });

        console.log(`🔥 [INCIDENT CREATED (THRESHOLD MET)] ID: ${newIncident.id} | Device: ${device.name} | Priority: ${newIncident.priority}`);

        // Dispatch 1 Incident Email Notification
        await notificationService.dispatchNotification({
          userId: device.userId,
          deviceId,
          incidentId: newIncident.id,
          type: 'INCIDENT',
          title: `[${priorityRes.priority}] Incident on ${device.name}`,
          message: llmAnalysis?.incident_summary || checkResult.message || 'Sustained service degradation detected',
          severity: priorityRes.priority,
        });

        return newIncident;
      }
    }

    // 5. Evaluate Incident Recovery / Resolution Criteria (Requires 3 consecutive healthy samples)
    if (activeIncident && consecutiveHealthy >= DEBOUNCE_THRESHOLD) {
      const resolvedIncident = await prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      console.log(`✅ [INCIDENT RECOVERED & RESOLVED] Device: ${device.name} | Incident ID: ${activeIncident.id} (After ${consecutiveHealthy} healthy checks)`);

      // Dispatch 1 Recovery Notification
      await notificationService.dispatchNotification({
        userId: device.userId,
        deviceId,
        incidentId: activeIncident.id,
        type: 'RECOVERY',
        title: `Service Recovered: ${device.name}`,
        message: `${device.name} (${device.host}) is back online and responding normally (${checkResult.latency || 0}ms).`,
        severity: 'LOW',
      });

      await redisConnection.set(keyHealthy, 0);
      return resolvedIncident;
    }

    return null;
  },
};
