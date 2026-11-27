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
 * A connection for callers that must never be made to wait.
 *
 * The shared client above queues commands forever while Redis is down, which
 * is right for a job queue and wrong for anything sitting in a request path:
 * the command neither succeeds nor fails, so a `catch` around it never runs
 * and the caller hangs. With offline queueing off a command rejects at once,
 * and the caller is free to fall back.
 *
 * Use this for any cache where a miss is recoverable. Only BullMQ should hold
 * the shared client.
 */
export const createNonBlockingRedis = (label) => {
  if (!env.REDIS_ENABLED) return null;

  const client = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  });

  attachErrorLogging(client, label);
  return client;
};

/** Rate limiting, which must let a request through rather than hold it. */
export const createRateLimitRedis = () => createNonBlockingRedis('Redis (rate limiting)');

export default redisClient;
