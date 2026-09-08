import express from 'express';
import * as paymentsController from './payments.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

// All payment routes require user authentication
router.use(authenticate);

// POST /api/payments/initiate — Create payment order for a booking
router.post('/initiate', paymentsController.initiatePayment);

// POST /api/payments/verify — Verify payment signature and confirm booking
router.post('/verify', paymentsController.verifyPayment);

export default router;
