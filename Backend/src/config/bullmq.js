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
    const queue = new Queue(queueName, { connection: redisClient });

    // Without a listener, a queue whose Redis is down dumps a full stack trace
    // on every reconnection attempt and buries the rest of the startup output.
    // Reported once, then quiet until it recovers.
    let reported = false;
    queue.on('error', (err) => {
      if (reported) return;
      reported = true;
      logger.error(`Queue ${queueName} error (${err.code || err.message}). Further errors suppressed.`);
    });

    queues[queueName] = queue;
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

const ENQUEUE_TIMEOUT_MS = 5000;

/**
 * Adds a job without letting a dead Redis hang the caller.
 *
 * BullMQ's connection sets `maxRetriesPerRequest: null` because its workers
 * need a command to wait rather than fail. The side effect is that `queue.add`
 * against an unreachable Redis never settles, so an HTTP request that enqueues
 * a job hangs forever instead of erroring. This bounds the wait and throws, so
 * callers can log it or fall back.
 */
export const queueOp = async (label, run) => {
  let timer;
  try {
    return await Promise.race([
      run(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ENQUEUE_TIMEOUT_MS}ms: queue unreachable`)),
          ENQUEUE_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const enqueue = async (queue, name, data, opts = {}) => {
  if (!queue) return null;
  return queueOp(`Enqueue of "${name}"`, () => queue.add(name, data, opts));
};

// Define queues
export const bookingQueue = createQueue('bookings');
export const paymentQueue = createQueue('payments');
export const notificationQueue = createQueue('notifications');
export const systemQueue = createQueue('system');
