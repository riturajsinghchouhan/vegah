import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createRateLimitRedis } from '../config/redis.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

// One connection, shared by the limiters' stores but not with BullMQ, because
// BullMQ's client is configured to wait forever on a dead Redis.
const rateLimitRedis = createRateLimitRedis();

// Each limiter needs its own store with its own key prefix. Sharing a single
// RedisStore between them is rejected outright by express-rate-limit, and even
// if it were not, both limiters would share one counter, so ordinary API
// traffic would eat into the stricter auth allowance. Returns undefined when
// Redis is off, which leaves each limiter on its own in-memory store.
const makeStore = (prefix) => (
  rateLimitRedis
    ? new RedisStore({ prefix, sendCommand: (...args) => rateLimitRedis.call(...args) })
    : undefined
);

// express-rate-limit logs to the console by default, which bypasses our logger
// and prints a full stack trace per limiter when Redis is unreachable at boot.
// The condition is already reported once by the Redis client itself, so this
// routes the message through the project logger as a single line.
let storeErrorReported = false;
const limiterLogger = {
  warn: (error, message) => logger.warn(`${message || 'rate limiter'}: ${error?.message || error}`),
  error: (error, message) => {
    if (storeErrorReported) return;
    storeErrorReported = true;
    logger.warn(
      `Rate limiting is running without Redis (${error?.message || error}). ` +
      'Limits are per-process until Redis is reachable.'
    );
  },
};

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('rl:api:'),
  // If Redis cannot be reached, serve the request rather than failing it.
  // Losing rate limiting during a Redis outage is far better than losing the API.
  passOnStoreError: true,
  logger: limiterLogger,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests, please try again later.'));
  },
});

// Auth specific rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('rl:auth:'),
  passOnStoreError: true,
  logger: limiterLogger,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts, please try again later.'));
  },
});
