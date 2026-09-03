import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'CARD', 'NET_BANKING', 'WALLET', null], default: null },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'INITIATED',
  },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpaySignature: { type: String, default: null, select: false },
  razorpayResponse: { type: Schema.Types.Mixed, default: null, select: false },
  signatureVerified: { type: Boolean, default: false },
  idempotencyKey: { type: String, unique: true, sparse: true },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
