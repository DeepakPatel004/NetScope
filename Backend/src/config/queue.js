import { Queue } from 'bullmq';
import redisConnection from './redis.js';

// 1. Define the queue name as a constant to avoid typos later
export const QUEUE_NAMES = {
  HEALTH_CHECK: 'health-check-queue',
};

// 2. Create the queue instance
export const healthQueue = new Queue(QUEUE_NAMES.HEALTH_CHECK, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s...
    },
    removeOnComplete: true, // Keep Redis memory clean
    removeOnFail: false,    // Keep failed jobs for debugging
  },
});