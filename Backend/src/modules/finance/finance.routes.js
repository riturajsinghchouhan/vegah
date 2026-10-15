import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as financeController from './finance.controller.js';

const router = express.Router();

router.get('/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getFinanceSummary);
router.get('/settlements', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getSettlements);
router.get('/tax-billing', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getTaxBilling);

// Accounting: manual expenses against booking earnings
router.get('/accounting/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getAccountingSummary);
router.get('/expenses/meta', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.getExpenseMeta);
router.get('/expenses', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.listExpenses);
router.post('/expenses', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.createExpense);
router.put('/expenses/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.updateExpense);
router.delete('/expenses/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), financeController.deleteExpense);

export default router;
