import mongoose from 'mongoose';
import { ACCOUNT_TYPES, SUB_LEDGERS } from '../modules/ledger/chartOfAccounts.js';

const { Schema } = mongoose;

const ledgerAccountSchema = new Schema({
  // Posting rules reference `key`, so renumbering `code` is a cosmetic change.
  key: { type: String, required: true, unique: true, uppercase: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ACCOUNT_TYPES, required: true, index: true },
  normalSide: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
  statement: { type: String, enum: ['BALANCE_SHEET', 'PROFIT_LOSS'], required: true, index: true },
  isContra: { type: Boolean, default: false },
  isCash: { type: Boolean, default: false, index: true },
  // When set, this account is a control account and its balance must equal the
  // total of the named sub-ledger. Checked by the daily balance report.
  subLedger: { type: String, enum: [...SUB_LEDGERS, null], default: null },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

const LedgerAccount = mongoose.model('LedgerAccount', ledgerAccountSchema);
export default LedgerAccount;
