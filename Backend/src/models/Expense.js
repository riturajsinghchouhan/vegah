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

  // What an expense needs before the GST on it can be claimed back.
  //
  // Input tax credit is only available against a registered vendor's tax
  // invoice, so without the vendor's GSTIN the tax on this spend is simply
  // lost. `amount` always means the gross actually paid, and `taxableValue`
  // and `inputTax` are derived from it, so the three can never disagree.
  vendorName: { type: String, trim: true, maxlength: 150, default: '' },
  vendorGstin: { type: String, trim: true, uppercase: true, default: null },
  taxRate: { type: Number, min: 0, max: 100, default: 0 },
  taxableValue: { type: Number, min: 0, default: 0 },
  inputTax: { type: Number, min: 0, default: 0 },
  isItcEligible: { type: Boolean, default: false, index: true },
  sac: { type: String, trim: true, default: '' },
  placeOfSupply: { type: String, trim: true, uppercase: true, default: '' },
  referenceNumber: { type: String, trim: true, maxlength: 60, default: '' },

  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
