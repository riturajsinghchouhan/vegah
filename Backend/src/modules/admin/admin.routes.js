import express from 'express';
import adminAuthRoutes from './adminAuth.routes.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import { sendSuccess } from '../../utils/response.js';
import * as adminController from './admin.controller.js';
import * as dashboardService from './dashboard.service.js';

const router = express.Router();

// Mount Admin Auth Routes
router.use('/auth', adminAuthRoutes);

// Protect all following admin routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// Fleet timeline route
router.get('/fleet-timeline', adminController.getFleetTimeline);

// Dashboard Stats — Total counts + Today's revenue
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    sendSuccess(res, 200, 'Dashboard stats fetched successfully', stats);
  } catch (error) {
    next(error);
  }
});

// Dashboard Charts — Revenue & booking time-series
router.get('/dashboard/charts', async (req, res, next) => {
  try {
    const charts = await dashboardService.getChartData(req.query);
    sendSuccess(res, 200, 'Chart data fetched successfully', charts);
  } catch (error) {
    next(error);
  }
});

// Example Admin Profile
router.get('/profile', (req, res) => {
  sendSuccess(res, 200, 'Admin profile fetched', req.user);
});

export default router;
