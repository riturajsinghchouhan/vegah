import { Queue, Worker } from 'bullmq';
import redisClient from './redis.js';
import env from './env.js';
import logger from '../utils/logger.js';

const queues = {};

export const createQueue = (queueName) => {
  if (!env.BULLMQ_ENABLED || !redisClient) {
    logger.warn(`BullMQ is disabled or Redis not connected. Queue ${queueName} not created.`);
    return null;
  }
  
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, { connection: redisClient });
    logger.info(`Queue ${queueName} initialized.`);
  }
  
  return queues[queueName];
};

export const createWorker = (queueName, processor, options = {}) => {
  if (!env.BULLMQ_ENABLED || !redisClient) {
    logger.warn(`BullMQ is disabled or Redis not connected. Worker for ${queueName} not created.`);
    return null;
  }

  const worker = new Worker(queueName, processor, {
    connection: redisClient,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with ${err.message}`);
  });

  logger.info(`Worker for ${queueName} initialized.`);
  return worker;
};

// Define queues
export const bookingQueue = createQueue('bookings');
export const paymentQueue = createQueue('payments');
export const notificationQueue = createQueue('notifications');
export const systemQueue = createQueue('system');
