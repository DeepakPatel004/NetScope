import { Queue } from 'bullmq';
import redisConnection from './redis.js';

// 1. Define the queue name as a constant to avoid typos later
export const QUEUE_NAMES = {
  HEALTH_CHECK: 'health-check-queue',
  CERT_FETCH: 'cert-fetch-queue',
  PORT_SCAN: 'port-scan'
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

export const certQueue = new Queue(QUEUE_NAMES.CERT_FETCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: {    // keep last 100 failed jobs(just use diff. thing here from above....)
      count: 100,
    }
  }
})

export const portScanQueue = new Queue(QUEUE_NAMES.PORT_SCAN, {
  connection: redisConnection,
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: {    // keep last 100 failed jobs(just use diff. thing here from above....)
      count: 100,
    }
  }
}); 