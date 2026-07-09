import cron from 'node-cron';
import prisma from '../config/database.js'
import { healthQueue, QUEUE_NAMES } from '../config/queue.js';

export const startScheduler = () => {
    cron.schedule('* * * * *', async () => {
    try {
      console.log('[Scheduler] Waking up...');
      
      // THIS IS THE MISSING PIECE: You must fetch the devices from the DB first!
      const activeDevices = await prisma.device.findMany({
        where: { enabled: true }
      });

      if (activeDevices.length === 0) {
        console.log('[Scheduler] No active devices to monitor.');
        return;
      }

      const jobs = activeDevices.map((device) => ({
        name: 'check-health',
        data: { 
          deviceId: device.id, 
          host: device.host, 
          type: device.type 
        },
        opts: {
          removeOnComplete: true,
          removeOnFail: false,
        }
      }));

      await healthQueue.addBulk(jobs);
      console.log(`[Scheduler] Queued ${jobs.length} devices for health checks.`);

    } catch (error) {
      console.error('[Scheduler] Failed to queue jobs', error);
    }
  });
}