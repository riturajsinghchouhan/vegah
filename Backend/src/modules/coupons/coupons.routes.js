import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import * as couponsController from './coupons.controller.js';
import * as couponsValidation from './coupons.validation.js';

const router = express.Router();

// User Route: Validate coupon
router.post(
  '/validate',
  authenticate,
  validate(couponsValidation.validateCouponSchema),
  couponsController.validateCoupon
);

// User Route: Get active/public coupons.
// Deliberately empty: coupons are not advertised on the user side, they are
// typed in at checkout and checked by POST /validate. Left in place so the
// home page's banner call keeps working.
router.get('/active', authenticate, (req, res) => {
  res.json({ success: true, data: [] });
});

// Admin Routes: Manage coupons
router.get(
  '/admin',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(couponsValidation.listCouponsSchema),
  couponsController.listCoupons
);

router.post(
  '/admin',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(couponsValidation.createCouponSchema),
  couponsController.createCoupon
);

router.put(
  '/admin/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(couponsValidation.updateCouponSchema),
  couponsController.updateCoupon
);

router.delete(
  '/admin/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(couponsValidation.idParamSchema),
  couponsController.deleteCoupon
);

router.patch(
  '/admin/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(couponsValidation.idParamSchema),
  couponsController.toggleCouponStatus
);

export default router;
