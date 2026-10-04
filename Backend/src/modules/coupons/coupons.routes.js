import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as couponsController from './coupons.controller.js';
import * as couponsService from './coupons.service.js';

const router = express.Router();

// User Route: Validate coupon
router.post('/validate', authenticate, couponsController.validateCoupon);

// User Route: Get active/public coupons
router.get('/active', authenticate, async (req, res, next) => {
  try {
    // Hidden from user side as requested
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// Admin Routes: Manage coupons
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponsController.listCoupons);
router.post('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponsController.createCoupon);
router.put('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponsController.updateCoupon);
router.delete('/admin/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponsController.deleteCoupon);
router.patch('/admin/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponsController.toggleCouponStatus);

export default router;
