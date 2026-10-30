import Redis from 'ioredis';
import env from './env.js';
import logger from '../utils/logger.js';

let redisClient = null;

/**
 * Logs the first connection error and then goes quiet until Redis recovers.
 * ioredis retries continuously, so logging every attempt buried the real
 * startup output under hundreds of identical stack traces.
 */
const attachErrorLogging = (client, label) => {
  let reported = false;
  client.on('error', (err) => {
    if (reported) return;
    reported = true;
    logger.error(`${label} unavailable (${err.code || err.message}). Further errors suppressed until it reconnects.`);
  });
  client.on('ready', () => {
    if (reported) logger.info(`${label} reconnected`);
    reported = false;
  });
};

if (env.REDIS_ENABLED) {
  // maxRetriesPerRequest: null is required by BullMQ, which needs a command to
  // wait indefinitely rather than fail.
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  attachErrorLogging(redisClient, 'Redis');
}

/**
 * A separate connection for rate limiting, which must never make a request
 * wait. The shared client above queues commands forever while Redis is down,
 * so using it for rate limiting hangs every incoming request. Here offline
 * queueing is off, so a command rejects at once and the limiter is free to let
 * the request through instead.
 */
export const createRateLimitRedis = () => {
  if (!env.REDIS_ENABLED) return null;

  const client = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  });

  attachErrorLogging(client, 'Redis (rate limiting)');
  return client;
};

export default redisClient;
