import * as walletService from './wallet.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getUserWallet = async (req, res, next) => {
  try {
    const result = await walletService.getUserWallet(req.user._id);
    sendSuccess(res, 200, 'User wallet fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const addFunds = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    const result = await walletService.addFundsToWallet(req.user._id, amount, description);
    sendSuccess(res, 200, 'Funds added to wallet successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getAdminWalletSummary = async (req, res, next) => {
  try {
    const result = await walletService.getAdminWalletSummary(req.query);
    sendSuccess(res, 200, 'Wallet summary fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const listRefunds = async (req, res, next) => {
  try {
    const result = await walletService.listRefunds(req.query);
    sendSuccess(res, 200, 'Refunds list fetched successfully', result.refunds, result.meta);
  } catch (error) {
    next(error);
  }
};

export const updateRefundStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const adminId = req.user._id;
    const refund = await walletService.updateRefundStatus(req.params.id, status, adminId);
    sendSuccess(res, 200, 'Refund status updated successfully', refund);
  } catch (error) {
    next(error);
  }
};
