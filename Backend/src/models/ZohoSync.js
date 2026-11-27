import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ZOHO_ENTITIES = [
  'CONTACT', 'VENDOR', 'INVOICE', 'CREDIT_NOTE',
  'PAYMENT', 'DEPOSIT', 'DEPOSIT_REFUND', 'EXPENSE',
];
export const ZOHO_SYNC_STATUSES = ['PENDING', 'SYNCED', 'FAILED', 'SKIPPED'];

/**
 * One row per local record that belongs in Zoho Books.
 *
 * This is what makes pushing safe to repeat. Zoho has no notion of "the record
 * I already sent", so without a local map a retry after a timeout would create
 * a second invoice for the same booking -- which, once numbered and filed, is
 * not something you can quietly delete. Every push looks here first.
 *
 * `localId` is the _id of the Booking, Payment, Expense or User the row tracks.
 * It is kept as a string so entities that have no Mongo document of their own
 * (a deposit refund keyed by booking, say) can share the collection.
 */
const zohoSyncSchema = new Schema({
  entity: { type: String, enum: ZOHO_ENTITIES, required: true },
  localModel: { type: String, required: true },
  localId: { type: String, required: true },

  zohoId: { type: String, default: null },
  // Kept alongside zohoId so the admin screen can show the real invoice number
  // without a round trip, and so a filed number survives even if the row is
  // later re-synced.
  zohoNumber: { type: String, default: null },

  status: { type: String, enum: ZOHO_SYNC_STATUSES, default: 'PENDING', index: true },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: null },
  syncedAt: { type: Date, default: null },
  lastError: { type: String, default: null },

  // The payload as it was accepted by Zoho. An auditor asking why a filed
  // invoice says what it says is answered from here, not from today's booking.
  payload: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

// The idempotency guarantee: one Zoho record per entity per local record.
zohoSyncSchema.index({ entity: 1, localId: 1 }, { unique: true });
zohoSyncSchema.index({ status: 1, updatedAt: -1 });

const ZohoSync = mongoose.model('ZohoSync', zohoSyncSchema);
export default ZohoSync;
