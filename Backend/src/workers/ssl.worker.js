import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';
import { QUEUE_NAMES } from '../config/queue.js';
import { sslService } from '../modules/ssl/ssl.service.js';

export const startSSLWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.CERT_FETCH,
    async (job) => {
      const { deviceId, host, type } = job.data;

      // We only check SSL for Websites and APIs. IP addresses usually don't have standard SSL certs.
      if (type === 'IP') {
        return { skipped: true, reason: 'IP addresses skipped for SSL check' };
      }

      try {
        // 1. Fetch certificate from the internet
        const sslData = await sslService.fetchCertificate(host);
        
        // 2. Save it to the database
        await sslService.saveSSLStatus(deviceId, sslData);
        
        return sslData;
      } catch (error) {
        // If it fails (timeout, no SSL, bad domain), log it as INVALID
        await sslService.saveSSLStatus(deviceId, {
          status: 'INVALID',
          issuer: null, subject: null, validFrom: null, validTo: null, 
          daysRemaining: null, serialNumber: null, fingerprint: null
        });
        
        console.error(`[SSL Worker] Error checking ${host}:`, error.message);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // SSL checks can be slightly slower, 5 concurrent is safe
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[SSL Worker] Job failed for device ${job?.data?.deviceId}:`, err.message);
  });

  console.log('SSL worker initialized and waiting for jobs.');
};