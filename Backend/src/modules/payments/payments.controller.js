import * as paymentsService from './payments.service.js';
import { sendSuccess } from '../../utils/response.js';

export const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { method } = req.body;
    const result = await paymentsService.initiatePayment(bookingId, req.user.id || req.user._id, method);
    sendSuccess(res, 200, 'Payment initiated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const result = await paymentsService.verifyPayment(req.body);
    sendSuccess(res, 200, 'Payment verified and booking confirmed', result);
  } catch (error) {
    next(error);
  }
};

export const payWithCash = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = (req.user.id || req.user._id).toString();
    const result = await paymentsService.payWithCash(bookingId, userId);
    sendSuccess(res, 200, 'Cash payment selected. Pay at the hub during pickup.', result);
  } catch (error) {
    next(error);
  }
};

export const payWithWallet = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = (req.user.id || req.user._id).toString();
    const result = await paymentsService.payWithWallet(bookingId, userId);
    sendSuccess(res, 200, 'Paid with wallet successfully', result);
  } catch (error) {
    next(error);
  }
};
