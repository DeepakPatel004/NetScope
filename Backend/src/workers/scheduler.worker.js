import cron from 'node-cron';
import prisma from '../config/database.js';
import { healthQueue, certQueue, portScanQueue } from '../config/queue.js';
import { healthIntervalMs, supportsTls } from './schedule-policy.js';

export const startScheduler = () => {
  const scheduled = new Map();
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const devices = await prisma.device.findMany({ where: { enabled: true } });
      const activeIds = new Set(devices.map(device => device.id));
      for (const id of scheduled.keys()) if (!activeIds.has(id)) scheduled.delete(id);
      const now = Date.now();
      for (const device of devices) {
        const last = scheduled.get(device.id) || {};
        const data = { deviceId: device.id, host: device.host, type: device.type };
        const jobs = [
          ['health', healthQueue, healthIntervalMs(device), true],
          ['ssl', certQueue, 3600000, supportsTls(device)],
          ['ports', portScanQueue, 900000, true],
        ];
        for (const [kind, queue, interval, enabled] of jobs) {
          if (enabled && (!last[kind] || now - last[kind] >= interval)) {
            await queue.add(`check-${kind}`, data, { jobId: `${kind}-${device.id}`, removeOnComplete: true, removeOnFail: true });
            last[kind] = now;
          }
        }
        scheduled.set(device.id, last);
      }
    } catch (error) { console.error('[Scheduler] Failed to queue checks:', error.message); }
    finally { running = false; }
  };
  tick();
  return cron.schedule('*/5 * * * * *', tick);
};
