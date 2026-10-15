import mongoose from 'mongoose';

const { Schema } = mongoose;

export const EXPENSE_CATEGORIES = [
  'CHARGING',
  'MAINTENANCE',
  'REPAIR',
  'SALARY',
  'RENT',
  'UTILITIES',
  'INSURANCE',
  'MARKETING',
  'TRANSPORT',
  'OFFICE',
  'OTHER',
];

export const EXPENSE_PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER'];

const expenseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, enum: EXPENSE_CATEGORIES, default: 'OTHER', index: true },
  paymentMode: { type: String, enum: EXPENSE_PAYMENT_MODES, default: 'CASH' },
  date: { type: Date, required: true, index: true },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
