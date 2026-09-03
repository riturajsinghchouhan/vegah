import express from 'express';
import adminAuthRoutes from './adminAuth.routes.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import { sendSuccess } from '../../utils/response.js';

const router = express.Router();

// Mount Admin Auth Routes
router.use('/auth', adminAuthRoutes);

// Protect all following admin routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// Example Admin Profile
router.get('/profile', (req, res) => {
  // We can fetch from DB if we need full details, but JWT has basic info
  // For now, simple return
  sendSuccess(res, 200, 'Admin profile fetched', req.user);
});

export default router;
