import winston from 'winston';
import env from '../config/env.js';

const { combine, timestamp, printf, colorize, errors, uncolorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let metaStr = '';
  if (Object.keys(meta).length) {
    metaStr = ` ${JSON.stringify(meta)}`;
  }
  return `${timestamp} ${level}: ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(uncolorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(uncolorize(), logFormat),
    }),
  ],
});

export default logger;
