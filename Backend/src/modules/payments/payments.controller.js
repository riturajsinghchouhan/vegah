import * as paymentsService from './payments.service.js';
import { sendSuccess } from '../../utils/response.js';

export const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const result = await paymentsService.initiatePayment(bookingId, req.user.id, method);
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
