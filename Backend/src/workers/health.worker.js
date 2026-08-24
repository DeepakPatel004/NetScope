import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../config/queue.js';
import { monitorService } from '../modules/monitoring/monitor.service.js';
import { healthService } from '../modules/health/health.service.js';
import { statisticalAnomalyService } from '../modules/anomaly/statisticalAnomaly.service.js';
import { incidentEngine } from '../modules/incident/incident.engine.js';
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

        // 4. Fetch device details, health history, and latest agent metrics
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
          select: { id: true, name: true, host: true, userId: true, agentStatus: true, metricsSource: true },
        });

        if (device) {
          const history = await healthService.getDeviceHealthHistory(deviceId, 30);
          const chronHistory = [...history].reverse();

          const latestAgentMetric = await prisma.agentMetric.findFirst({
            where: { deviceId },
            orderBy: { checkedAt: 'desc' },
          });

          // 5. Run Independent Statistical Anomaly Detection (Local Node.js Engine)
          const statAnomaly = statisticalAnomalyService.detectStatisticalAnomaly(device, chronHistory, latestAgentMetric);

          // 6. Call Python AI Microservice for AI Anomaly Vectorization (Fallback Safe)
          let aiAnomaly = { is_anomaly: false, anomaly_score: 0.0, severity: 'LOW', detection_reason: '' };
          try {
            aiAnomaly = await aiClient.detectAnomaly(device, chronHistory);
          } catch (err) {
            console.warn(`[HealthWorker] AI Anomaly Detection fallback to statistical engine: ${err.message}`);
          }

          // 7. Process through Smart Incident Engine (Debounced, Deduplicated, Correlated State Machine)
          await incidentEngine.processTelemetrySample(device, checkResult, statAnomaly, aiAnomaly, latestAgentMetric);
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

  console.log('Health worker initialized with Smart Incident Engine & Statistical Anomaly Detector.');
};