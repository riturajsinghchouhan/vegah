import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as financeController from './finance.controller.js';

const router = express.Router();

router.get('/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getFinanceSummary);
router.get('/settlements', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getSettlements);
router.get('/tax-billing', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getTaxBilling);

export default router;
