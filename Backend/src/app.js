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

// API Routes
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import zonesRoutes from './modules/zones/zones.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import vehiclesRoutes from './modules/vehicles/vehicles.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import inspectionsRoutes from './modules/inspections/inspections.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/zones', zonesRoutes);
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/inspections', inspectionsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
