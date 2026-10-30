import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as ledgerController from './ledger.controller.js';

const router = express.Router();

const guard = [authenticate, authorize('ADMIN', 'SUPER_ADMIN')];
// Closing a period, approving a voucher and reversing an entry change the books,
// so they are kept to SUPER_ADMIN.
const approver = [authenticate, authorize('SUPER_ADMIN')];

// --- Reports (read-only) ---
router.get('/balance-sheet', ...guard, ledgerController.getBalanceSheet);
router.get('/profit-loss', ...guard, ledgerController.getProfitAndLoss);
router.get('/receipts-payments', ...guard, ledgerController.getReceiptsAndPayments);
router.get('/trial-balance', ...guard, ledgerController.getTrialBalance);
router.get('/daily-check', ...guard, ledgerController.getDailyCheck);
router.get('/journal', ...guard, ledgerController.listJournalEntries);
router.get('/accounts', ...guard, ledgerController.listAccounts);
router.get('/periods', ...guard, ledgerController.listPeriods);
router.get('/export/:report', ...guard, ledgerController.exportCsv);
router.get('/pending-money', ...guard, ledgerController.getPendingMoney);

// --- Controls ---
// There is deliberately no route that posts an automatic event: those come only
// from the event mapping. The only hand-written entry allowed is a voucher.
// How money reaches the bank: cash banked from the hub, and Razorpay remitting
// online payments net of its fees. Both are the admin recording a real event.
router.post('/cash-handover', ...approver, ledgerController.recordCashHandover);
router.post('/gateway-settlement', ...approver, ledgerController.recordGatewaySettlement);

router.post('/voucher', ...approver, ledgerController.postVoucher);
router.post('/journal/:id/reverse', ...approver, ledgerController.reverseEntry);
router.post('/periods/close', ...approver, ledgerController.closePeriod);
router.post('/periods/reopen', ...approver, ledgerController.reopenPeriod);
router.post('/install-chart', ...approver, ledgerController.installChart);

export default router;
