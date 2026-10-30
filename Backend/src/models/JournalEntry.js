import mongoose from 'mongoose';
import { SUB_LEDGERS } from '../modules/ledger/chartOfAccounts.js';

const { Schema } = mongoose;

// All amounts are whole paise. See modules/ledger/money.js.
const journalLineSchema = new Schema({
  _id: false,
  account: { type: Schema.Types.ObjectId, ref: 'LedgerAccount', required: true },
  accountKey: { type: String, required: true },
  accountCode: { type: String, required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  subLedgerType: { type: String, enum: [...SUB_LEDGERS, null], default: null },
  subLedgerId: { type: Schema.Types.ObjectId, default: null },
  memo: { type: String, trim: true, maxlength: 200, default: '' },
});

const journalEntrySchema = new Schema({
  entryNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true, index: true },
  periodKey: { type: String, required: true, index: true }, // "YYYY-MM" in IST
  eventType: { type: String, required: true, index: true },
  narration: { type: String, required: true, trim: true, maxlength: 300 },
  lines: { type: [journalLineSchema], required: true },
  totalDebit: { type: Number, required: true, min: 0 },
  totalCredit: { type: Number, required: true, min: 0 },

  // A reversal is a new entry mirroring an older one. Nothing is written back
  // onto the original, so "is this reversed?" is answered by looking for an
  // entry whose reversalOf points at it. The unique index makes it impossible
  // to reverse the same entry twice.
  reversalOf: { type: Schema.Types.ObjectId, ref: 'JournalEntry', default: null },
  reversalReason: { type: String, trim: true, maxlength: 300, default: null },

  source: {
    model: { type: String, default: null },
    id: { type: Schema.Types.ObjectId, default: null },
    idempotencyKey: { type: String, default: null },
  },

  postedBy: { type: Schema.Types.ObjectId, default: null },
  postedByType: { type: String, enum: ['ADMIN', 'SYSTEM'], required: true },
}, { timestamps: true });

journalEntrySchema.index({ 'lines.account': 1, date: 1 });
journalEntrySchema.index({ 'source.model': 1, 'source.id': 1 });
journalEntrySchema.index(
  { 'source.idempotencyKey': 1 },
  { unique: true, partialFilterExpression: { 'source.idempotencyKey': { $type: 'string' } } }
);
journalEntrySchema.index(
  { reversalOf: 1 },
  { unique: true, partialFilterExpression: { reversalOf: { $type: 'objectId' } } }
);

// --- Immutability ---
// A posted entry is never edited or deleted. Corrections are reversing entries.
// This is enforced here rather than in the service so that no caller anywhere,
// including a future one, can quietly rewrite history.
const IMMUTABLE = 'Journal entries are immutable. Post a reversing entry instead.';

// Declared with no parameters so Mongoose treats these as promise-returning
// hooks and a throw rejects the operation. Taking a `next` callback here is a
// trap: Mongoose 8 does not always supply one, and the hook then fails with a
// TypeError instead of blocking the write.
const blockMutation = function blockMutation() {
  throw new Error(IMMUTABLE);
};

[
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
].forEach((op) => journalEntrySchema.pre(op, blockMutation));

journalEntrySchema.pre('save', function blockResave() {
  if (!this.isNew) throw new Error(IMMUTABLE);
});

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
