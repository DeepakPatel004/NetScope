import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { QUEUE_NAMES } from "../config/queue.js";
import { monitorService } from "../modules/monitoring/monitor.service.js";
import { healthService } from "../modules/health/health.service.js";
import { pingServices } from "../modules/monitoring/ping.service.js"; 
import { httpService } from "../modules/monitoring/http.service.js";
import { eventBus } from "../events/eventBus.js"; // 1. IMPORT EVENT BUS

export const startHealthWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.HEALTH_CHECK,
    async (job) => {
      const { deviceId, host, type } = job.data;

      try {
        // Perform the actual HTTP/Ping check
        const checkResult = await monitorService.checkDevice(type, host);
        
        // 2. REDIS STATE MACHINE LOGIC
        const redisKey = `device_status:${deviceId}`;
        const previousStatus = await redisConnection.get(redisKey);
        const currentStatus = checkResult.status;

        // Compare old state vs new state
        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`🔄 State Change Detected! ${host}: ${previousStatus} ➔ ${currentStatus}`);
          
          // Emit the event to trigger incidents/emails
          eventBus.emit('device_status_changed', {
            deviceId,
            previousStatus,
            currentStatus,
            errorMsg: checkResult.message
          });
        }

        // 3. UPDATE CACHE
        await redisConnection.set(redisKey, currentStatus);

        // Save historical log to PostgreSQL (unchanged)
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