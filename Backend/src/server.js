import app from './app.js';
import config from './config/env.js';
import prisma from './config/database.js';
import { startScheduler } from './workers/scheduler.worker.js';
import { startHealthWorker } from './workers/health.worker.js';
import { startSSLWorker } from './workers/ssl.worker.js';
import { startPortScannerWorker } from './workers/port.worker.js';
import { startNotificationWorker } from './workers/notification.worker.js';
import { startAssignmentScheduler } from './modules/probe/assignmentScheduler.js';

const StartServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database Connected');

    // Start workers alongside database
    startScheduler();
    startHealthWorker();
    startSSLWorker();
    startPortScannerWorker();
    startNotificationWorker();
    startAssignmentScheduler();


    const server = app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
    });

    const shutdown = async () => {
      console.log('\nShutting down gracefully');
      await prisma.$disconnect();
      server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

StartServer();
