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
  const existing = await Coupon.findById(id);
  if (!existing) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.code) {
    data.code = data.code.toUpperCase();
    const clash = await Coupon.findOne({ code: data.code, _id: { $ne: id } });
    if (clash) {
      const error = new Error('Coupon code already exists');
      error.statusCode = 400;
      throw error;
    }
  }
  if (data.type) {
    data.type = data.type.toUpperCase();
  }
  if (data.status) {
    data.status = data.status.toUpperCase();
  }

  // A partial update can change one half of a pair, so the rules are checked
  // against the merged result rather than against the payload alone.
  const merged = { ...existing.toObject(), ...data };

  if (new Date(merged.expiryDate) <= new Date(merged.startDate)) {
    const error = new Error('expiryDate must be after startDate');
    error.statusCode = 400;
    throw error;
  }

  if (merged.type === 'PERCENTAGE' && Number(merged.value) > 100) {
    const error = new Error('value for a PERCENTAGE coupon cannot be more than 100');
    error.statusCode = 400;
    throw error;
  }

  // Lowering the cap below what has already been redeemed would leave the
  // coupon in a state validateCoupon reads as "limit reached" with no way back.
  if (merged.totalUsageLimit != null && merged.totalUsageLimit < existing.usedCount) {
    const error = new Error(`This coupon has already been used ${existing.usedCount} times, so the total usage limit cannot be lower than that`);
    error.statusCode = 400;
    throw error;
  }

  Object.assign(existing, data);
  return await existing.save();
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

export const validateCoupon = async (code, bookingAmount, userId, options = {}) => {
  const { session = null } = options;

  if (!code || typeof code !== 'string') {
    const error = new Error('Coupon code is required');
    error.statusCode = 400;
    throw error;
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).session(session);

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
    const userUsageCount = await CouponUsage.countDocuments({ coupon: coupon._id, user: userId }).session(session);
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

/**
 * Claim one use of a coupon. Called from inside the booking transaction so a
 * booking and its coupon usage either both land or neither does.
 *
 * The `usedCount` bump is done with a conditional `$inc` rather than a
 * read-modify-write: two users redeeming the last remaining use at the same
 * time would otherwise both pass the `validateCoupon` check and push
 * `usedCount` past `totalUsageLimit`.
 */
export const recordCouponUsage = async ({ couponId, userId, bookingId, discountApplied, session = null }) => {
  const claimed = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [
        { totalUsageLimit: null },
        { $expr: { $lt: ['$usedCount', '$totalUsageLimit'] } },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true, session }
  );

  if (!claimed) {
    const error = new Error('Coupon total usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  await CouponUsage.create([{
    coupon: couponId,
    user: userId,
    booking: bookingId,
    discountApplied,
  }], { session });

  return claimed;
};

/**
 * Give a use back when a booking that held a coupon never goes through
 * (expired reservation, cancellation). Without this a coupon with a usage
 * limit slowly burns down on bookings that were never honoured.
 */
export const releaseCouponUsage = async ({ couponId, bookingId, session = null }) => {
  const usage = await CouponUsage.findOneAndDelete({ coupon: couponId, booking: bookingId }, { session });
  if (!usage) return false;

  await Coupon.updateOne(
    { _id: couponId, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
    { session }
  );
  return true;
};
