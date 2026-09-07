import * as couponsService from './coupons.service.js';
import { sendSuccess } from '../../utils/response.js';

export const listCoupons = async (req, res, next) => {
  try {
    const result = await couponsService.listCoupons(req.query);
    sendSuccess(res, 200, 'Coupons fetched successfully', result.coupons, result.meta);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponsService.createCoupon(req.body);
    sendSuccess(res, 201, 'Coupon created successfully', coupon);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponsService.updateCoupon(req.params.id, req.body);
    sendSuccess(res, 200, 'Coupon updated successfully', coupon);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await couponsService.deleteCoupon(req.params.id);
    sendSuccess(res, 200, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await couponsService.toggleCouponStatus(req.params.id);
    sendSuccess(res, 200, 'Coupon status updated successfully', coupon);
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const userId = req.user?._id;
    const result = await couponsService.validateCoupon(code, amount, userId);
    sendSuccess(res, 200, 'Coupon validated successfully', result);
  } catch (error) {
    next(error);
  }
};
