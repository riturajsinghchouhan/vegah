import connectDB from './config/db.js';
import { initWorkers } from './jobs/index.js';
import logger from './utils/logger.js';

const startWorkerServer = async () => {
  try {
    logger.info('Starting standalone worker process...');
    
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Background Workers
    await initWorkers();

    logger.info('Worker process initialized and running.');

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection in Worker: ${err.message}`);
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception in Worker: ${err.message}`);
      process.exit(1);
    });

  } catch (error) {
    logger.error(`Failed to start worker process: ${error.message}`);
    process.exit(1);
  }
};

startWorkerServer();
