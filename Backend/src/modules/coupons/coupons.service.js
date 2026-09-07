import Coupon from '../../models/Coupon.js';
import CouponUsage from '../../models/CouponUsage.js';

export const listCoupons = async (query = {}) => {
  const { page = 1, limit = 20, search, status } = query;
  const filter = {};

  if (status) {
    filter.status = status.toUpperCase();
  }

  if (search) {
    filter.code = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Coupon.countDocuments(filter),
  ]);

  return {
    coupons,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const createCoupon = async (data) => {
  const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    const error = new Error('Coupon code already exists');
    error.statusCode = 400;
    throw error;
  }

  const coupon = new Coupon({
    ...data,
    code: data.code.toUpperCase(),
    type: (data.type || 'percentage').toUpperCase(),
    status: (data.status || 'ACTIVE').toUpperCase(),
  });

  return await coupon.save();
};

export const updateCoupon = async (id, data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  if (data.type) {
    data.type = data.type.toUpperCase();
  }
  if (data.status) {
    data.status = data.status.toUpperCase();
  }

  const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!coupon) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }
  return coupon;
};

export const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }
  return true;
};

export const toggleCouponStatus = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }
  coupon.status = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  return await coupon.save();
};

export const validateCoupon = async (code, bookingAmount, userId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    const error = new Error('Invalid coupon code');
    error.statusCode = 404;
    throw error;
  }

  if (coupon.status !== 'ACTIVE') {
    const error = new Error('Coupon is inactive');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (now < new Date(coupon.startDate) || now > new Date(coupon.expiryDate)) {
    const error = new Error('Coupon has expired or is not active yet');
    error.statusCode = 400;
    throw error;
  }

  if (bookingAmount < coupon.minBookingAmount) {
    const error = new Error(`Minimum booking amount for this coupon is ₹${coupon.minBookingAmount}`);
    error.statusCode = 400;
    throw error;
  }

  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
    const error = new Error('Coupon total usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  if (userId && coupon.usageLimitPerUser) {
    const userUsageCount = await CouponUsage.countDocuments({ coupon: coupon._id, user: userId });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      const error = new Error('You have reached the usage limit for this coupon');
      error.statusCode = 400;
      throw error;
    }
  }

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (bookingAmount * coupon.value) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = coupon.value;
  }

  discountAmount = Math.min(discountAmount, bookingAmount);

  return {
    coupon,
    discountAmount,
    finalAmount: bookingAmount - discountAmount,
  };
};
