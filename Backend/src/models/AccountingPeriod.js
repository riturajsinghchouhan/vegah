import mongoose from 'mongoose';

const { Schema } = mongoose;

// Absence of a row means the period is open. A row with status CLOSED blocks
// every posting dated into that month until it is explicitly reopened, and both
// the close and the reopen are recorded here.
const accountingPeriodSchema = new Schema({
  periodKey: { type: String, required: true, unique: true }, // "YYYY-MM" in IST
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN', index: true },
  closedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  closedAt: { type: Date, default: null },
  reopenedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  reopenedAt: { type: Date, default: null },
  reopenReason: { type: String, trim: true, maxlength: 300, default: null },
}, { timestamps: true });

const AccountingPeriod = mongoose.model('AccountingPeriod', accountingPeriodSchema);
export default AccountingPeriod;
