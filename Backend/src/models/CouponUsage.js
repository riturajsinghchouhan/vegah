import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponUsageSchema = new Schema({
  coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  discountApplied: { type: Number, required: true },
}, { timestamps: true });

couponUsageSchema.index({ coupon: 1, user: 1 });

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
export default CouponUsage;
