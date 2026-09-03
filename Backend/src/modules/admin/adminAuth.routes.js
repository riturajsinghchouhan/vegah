import express from 'express';
import * as adminAuthController from './adminAuth.controller.js';
import * as adminAuthValidation from './adminAuth.validation.js';
import validate from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  validate(adminAuthValidation.loginSchema),
  adminAuthController.login
);

router.post(
  '/register',
  authLimiter,
  validate(adminAuthValidation.registerSchema),
  adminAuthController.register
);

// We can reuse the refresh-token endpoint from user auth, or implement one here if we want completely separate tokens
// For now, let's keep it simple

export default router;
