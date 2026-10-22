import mongoose from 'mongoose';

const { Schema } = mongoose;

export const INVOICE_STATUSES = ['Paid', 'Unpaid', 'Confirmed'];
export const INVOICE_PAYMENT_MODES = ['ONLINE', 'CASH', 'WALLET', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

/**
 * Tax & Billing invoices are mostly derived on the fly from payments and
 * bookings, so they have no row of their own. This collection stores:
 *  - MANUAL invoices an admin creates by hand, and
 *  - SYSTEM rows that only exist to mark a derived invoice as deleted (binned).
 *    `sourceKey` is the derived invoice's id (payment or booking _id) and the
 *    snapshot fields keep it viewable in the bin. Deleting an invoice never
 *    touches the underlying payment or booking.
 */
const invoiceSchema = new Schema({
  source: { type: String, enum: ['SYSTEM', 'MANUAL'], required: true, index: true },
  sourceKey: { type: String, default: null },
  invoiceId: { type: String, required: true, trim: true },

  bookingId: { type: String, trim: true, default: null },
  customerName: { type: String, trim: true, required: true, maxlength: 120 },
  customerEmail: { type: String, trim: true, default: '' },
  customerPhone: { type: String, trim: true, default: '' },
  vehicleName: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, maxlength: 200, default: '' },

  date: { type: Date, required: true },
  baseAmount: { type: Number, min: 0, default: 0 },
  serviceFee: { type: Number, min: 0, default: 0 },
  platformFee: { type: Number, min: 0, default: 0 },
  taxAmount: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, min: 0, default: 0 },
  gstRate: { type: String, default: '' },
  status: { type: String, enum: INVOICE_STATUSES, default: 'Paid' },
  paymentMethod: { type: String, default: 'CASH' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },

  // Bin: deletedAt set = in the bin. purgedAt set = permanently deleted; a
  // SYSTEM row is kept after purge so the derived invoice stays hidden.
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  purgedAt: { type: Date, default: null },

  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true });

invoiceSchema.index({ sourceKey: 1 }, { unique: true, partialFilterExpression: { sourceKey: { $type: 'string' } } });
invoiceSchema.index({ invoiceId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
