import express from 'express';
import * as authController from './auth.controller.js';
import * as authValidation from './auth.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/request-otp',
  authLimiter,
  validate(authValidation.requestOtpSchema),
  authController.requestOtp
);

router.post(
  '/verify-otp',
  authLimiter,
  validate(authValidation.verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  '/refresh-token',
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);

export default router;
