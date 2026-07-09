import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { QUEUE_NAMES } from "../config/queue.js";
import { monitorService } from "../modules/monitoring/monitor.service.js";
import { healthService } from "../modules/health/health.service.js";

export const startHealthWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.HEALTH_CHECK,
    async (job) => {
      const { deviceId, host, type } = job.data;

      try {
        // Fixed typo: monitorService instead of monitorSerices
        const checkResult = await monitorService.checkDevice(type, host);
        
        await healthService.saveHealthLog(deviceId, checkResult);

        return checkResult;
      } catch (e) {
        console.error(`[Worker] Critical error checking ${host} : `, e.message);
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

  console.log('Health worker initialized and waiting for jobs.');
};