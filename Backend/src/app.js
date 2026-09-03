import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import env from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import requestId from './middleware/requestId.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID & Logging
app.use(requestId);

const morganFormat = env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Rate limiting (Global)
if (env.RATE_LIMIT_ENABLED) {
  app.use('/api', apiLimiter);
}

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running', timestamp: new Date() });
});

// TODO: Mount API Routes here
// app.use('/api/auth', authRoutes);
// app.use('/api/admin/auth', adminAuthRoutes);
// etc...

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
