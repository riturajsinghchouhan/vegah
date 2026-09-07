import express from 'express';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import * as walletController from './wallet.controller.js';

const router = express.Router();

// User Wallet Routes
router.get('/user', authenticate, walletController.getUserWallet);
router.post('/user/add-funds', authenticate, walletController.addFunds);

// Admin Wallet & Refund Routes
router.get('/admin/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), walletController.getAdminWalletSummary);
router.get('/admin/refunds', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), walletController.listRefunds);
router.patch('/admin/refunds/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), walletController.updateRefundStatus);

export default router;
