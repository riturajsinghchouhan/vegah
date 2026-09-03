import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
  value: { type: Number, required: true },
  minBookingAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: null },
  usageLimitPerUser: { type: Number, default: 1 },
  totalUsageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ startDate: 1, expiryDate: 1, status: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
