import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../config/queue.js';
import { portService } from '../modules/port/port.service.js';

export const startPortScannerWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.PORT_SCAN,
    async (job) => {
      const { deviceId, host } = job.data;

      try {
        // 1. Scan the target host for open ports
        const openPorts = await portService.scanHost(host);
        
        // 2. Save the array of open ports to the database
        await portService.saveScanResult(deviceId, openPorts);
        
        return openPorts;
      } catch (error) {
        console.error(`[Port Worker] Error scanning ${host}:`, error.message);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Port scanning opens multiple sockets; keep concurrency moderate
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Port Worker] Job failed for device ${job?.data?.deviceId}:`, err.message);
  });

  console.log('Port scanner worker initialized and waiting for jobs.');
};