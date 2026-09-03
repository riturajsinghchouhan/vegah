import mongoose from 'mongoose';

const { Schema } = mongoose;

const walletTransactionSchema = new Schema({
  wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  referenceType: { type: String }, // "REFUND", "TOP_UP", "BOOKING"
  referenceId: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true });

walletTransactionSchema.index({ wallet: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
