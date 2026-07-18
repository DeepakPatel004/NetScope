import cron from 'node-cron';
import prisma from '../config/database.js'
import { healthQueue, certQueue, portScanQueue } from '../config/queue.js';

export const startScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('[Scheduler] Waking up...');

      // THIS IS THE MISSING PIECE: You must fetch the devices from the DB first!
      const activeDevices = await prisma.device.findMany({
        where: { enabled: true }
      });

      if (activeDevices.length === 0) {
        console.log('[Health Scheduler] No active devices to monitor.');
        return;
      }

      const healthJobs = activeDevices.map((device) => ({
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
      await healthQueue.addBulk(healthJobs);
      console.log(`[Scheduler] Queued ${healthJobs.length} devices for health checks.`);

      const sslTargets = activeDevices.filter(d => d.type !== 'IP');

      const sslJobs = activeDevices.map((device) => ({
        name: 'check-cert',
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
      if (sslJobs.length > 0) {
        await certQueue.addBulk(sslJobs);
        console.log(`[Scheduler] Queued ${sslJobs.length} devices for SSL checks.`);
      }

      const portJobs = activeDevices.map((device) => ({
        name: 'scan-ports',
        data: { deviceId: device.id, host: device.host },
        opts: { removeOnComplete: true, removeOnFail: false }
      }));

      if (portJobs.length > 0) {
        await portScanQueue.addBulk(portJobs);
        console.log(`[Scheduler] Queued ${portJobs.length} devices for Port Scanning.`);
      }


    } catch (error) {
      console.error('[Scheduler] Failed to queue jobs', error);
    }
  });
}