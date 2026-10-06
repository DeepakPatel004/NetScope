import { Queue } from 'bullmq';
import redisConnection from './redis.js';

export const QUEUE_NAMES = { NOTIFICATION: 'notification-queue' };

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 50,
    },
  },
});