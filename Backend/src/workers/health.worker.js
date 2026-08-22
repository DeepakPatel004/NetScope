import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../config/queue.js';
import { monitorService } from '../modules/monitoring/monitor.service.js';
import { healthService } from '../modules/health/health.service.js';
import { incidentService } from '../modules/incident/incident.service.js';
import { eventBus } from '../events/eventBus.js';
import { aiClient } from '../utils/aiClient.js';
import prisma from '../config/database.js';

export const startHealthWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.HEALTH_CHECK,
    async (job) => {
      const { deviceId, host, type } = job.data;

      try {
        // 1. Perform device health check
        const checkResult = await monitorService.checkDevice(type, host);

        // 2. State change detection in Redis
        const redisKey = `device_status:${deviceId}`;
        const previousStatus = await redisConnection.get(redisKey);
        const currentStatus = checkResult.status;

        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`🔄 State Change Detected! ${host}: ${previousStatus} ➔ ${currentStatus}`);
          eventBus.emit('device_status_changed', {
            deviceId,
            previousStatus,
            currentStatus,
            errorMsg: checkResult.message,
          });
        }

        await redisConnection.set(redisKey, currentStatus);

        // 3. Save Health Log to Postgres
        await healthService.saveHealthLog(deviceId, checkResult);

        // 4. Fetch device details & recent history for AI Anomaly Detection
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
          select: { id: true, name: true, host: true },
        });

        if (device) {
          const history = await healthService.getDeviceHealthHistory(deviceId, 30);
          
          // Re-order history to chronological order (oldest to newest) for model vectorization
          const chronHistory = [...history].reverse();

          // 5. Call Python AI Microservice for Anomaly Detection
          const anomalyRes = await aiClient.detectAnomaly(device, chronHistory);

          let anomalyRecord = null;
          if (anomalyRes.is_anomaly || anomalyRes.anomaly_score > 0.40) {
            anomalyRecord = await prisma.anomaly.create({
              data: {
                deviceId,
                anomalyScore: anomalyRes.anomaly_score,
                severity: anomalyRes.severity || 'MEDIUM',
                detectionReason: anomalyRes.detection_reason,
                metrics: anomalyRes.metrics_evaluated || {},
              },
            });
            console.log(`🤖 [AI ANOMALY] ${host} | Score: ${anomalyRes.anomaly_score} | Severity: ${anomalyRes.severity}`);
          }

          // 6. Alert Prioritization & LLM Incident Analysis for severe issues or DOWN status
          if (currentStatus === 'DOWN' || (anomalyRes.is_anomaly && ['HIGH', 'CRITICAL'].includes(anomalyRes.severity))) {
            const downCount = chronHistory.filter((h) => h.status === 'DOWN').length;
            const errorRate = chronHistory.length > 0 
              ? chronHistory.filter((h) => h.status === 'DOWN' || (h.responseCode && h.responseCode >= 400)).length / chronHistory.length 
              : 0.5;

            const priorityRes = await aiClient.prioritizeAlert(
              anomalyRes.severity,
              chronHistory.length,
              downCount,
              errorRate,
              downCount,
              device.name,
              anomalyRes.anomaly_score
            );

            const llmAnalysis = await aiClient.analyzeIncident(
              device,
              anomalyRes.anomaly_score,
              priorityRes.priority,
              anomalyRes.detection_reason,
              chronHistory.slice(-10),
              anomalyRes.metrics_evaluated
            );

            await incidentService.openIncident(
              deviceId,
              currentStatus === 'DOWN' ? 'DOWNTIME' : 'ANOMALY',
              checkResult.message || anomalyRes.detection_reason,
              {
                ...llmAnalysis,
                severity: priorityRes.priority,
                priorityScore: priorityRes.priority_score,
                priorityReason: priorityRes.priority_reason,
                anomalyId: anomalyRecord?.id || null,
              }
            );
          } else if (currentStatus === 'UP' && previousStatus === 'DOWN') {
            await incidentService.resolveIncident(deviceId);
          }
        }

        return checkResult;
      } catch (e) {
        console.error(`[Worker] Error checking ${host}:`, e.message);
        throw e;
      }
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job failed for device ${job?.data?.deviceId}:`, err.message);
  });

  console.log('Health worker initialized with AI Anomaly Detector & Incident Analyzer.');
};