import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../config/queue.js';
import { notificationService } from '../modules/notification/notification.service.js';

export const startNotificationWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.NOTIFICATION,
    async (job) => {
      try {
        console.log(`[NotificationWorker] Processing job ${job.id} type: ${job.data.type}`);
        return await notificationService.processNotificationJob(job.data);
      } catch (err) {
        console.error(`[NotificationWorker] Error processing job ${job.id}:`, err.message);
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log('Notification worker initialized for async alert delivery.');
};
