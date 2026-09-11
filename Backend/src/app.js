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
  origin: true, // Allow all origins for dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

import path from 'path';

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
import walletsRoutes from './modules/wallet/wallet.routes.js';
import couponsRoutes from './modules/coupons/coupons.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import inspectionsRoutes from './modules/inspections/inspections.routes.js';
import chargingStationsRoutes from './modules/charging-stations/chargingStations.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import electicaRoutes from './modules/electica/electica.routes.js';
import { BATTERY_PACKAGES } from './modules/bookings/bookings.constants.js';

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin/zones', zonesRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/inspections', inspectionsRoutes);
app.use('/api/admin/finance', financeRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/wallet', walletsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/charging-stations', chargingStationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/electica', electicaRoutes);

// Battery Packages — static but served via API for frontend consistency
app.get('/api/battery-packages', (req, res) => {
  const packages = Object.values(BATTERY_PACKAGES).map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    price: pkg.price,
    description: pkg.id === 'NONE' 
      ? 'No charging package included'
      : pkg.id === 'SINGLE' 
        ? 'One full charge included during your rental'
        : 'Unlimited battery swaps during your rental period',
  }));
  res.json({ success: true, message: 'Battery packages fetched', data: packages });
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;

