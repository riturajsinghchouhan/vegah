import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentTransactionSchema = new Schema({
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  eventType: { type: String, required: true }, // INITIATED, WEBHOOK_RECEIVED, VERIFIED, FAILED
  eventData: { type: Schema.Types.Mixed, default: null },
  requestId: { type: String, default: null },
}, { timestamps: true });

paymentTransactionSchema.index({ payment: 1, createdAt: -1 });

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
export default PaymentTransaction;
