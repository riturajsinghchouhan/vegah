import mongoose from 'mongoose';

const { Schema } = mongoose;

const refundSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'], default: 'PENDING' },
  razorpayRefundId: { type: String, default: null },
  processedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  idempotencyKey: { type: String, unique: true, sparse: true },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
