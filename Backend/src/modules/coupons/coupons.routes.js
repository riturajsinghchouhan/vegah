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
    const result = await couponsService.listCoupons({ status: 'ACTIVE', limit: 20 });
    // Filter to only return fields safe for public consumption
    const publicCoupons = result.coupons.map(c => ({
      _id: c._id,
      code: c.code,
      type: c.type,
      value: c.value,
      description: c.description,
      minBookingAmount: c.minBookingAmount,
      maxDiscountAmount: c.maxDiscountAmount,
      expiryDate: c.expiryDate,
    }));
    res.json({ success: true, data: publicCoupons });
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
