import { Queue } from 'bullmq';
import redisConnection from './redis.js';

export const QUEUE_NAMES = {
  HEALTH_CHECK: 'health-check-queue',
  CERT_FETCH: 'cert-fetch-queue',
  PORT_SCAN: 'port-scan',
  NOTIFICATION: 'notification-queue',
};

export const healthQueue = new Queue(QUEUE_NAMES.HEALTH_CHECK, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
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
    removeOnFail: {
      count: 100,
    },
  },
});

export const portScanQueue = new Queue(QUEUE_NAMES.PORT_SCAN, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 100,
    },
  },
});

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