import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';
import env from '../config/env.js';
import { ApiError } from '../utils/errors.js';

let store;

if (env.REDIS_ENABLED && redisClient) {
  store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
}

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store,
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
  store: store,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts, please try again later.'));
  },
});
