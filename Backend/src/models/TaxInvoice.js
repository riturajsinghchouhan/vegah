import mongoose from 'mongoose';

const { Schema } = mongoose;

export const DOCUMENT_TYPES = ['INVOICE', 'CREDIT_NOTE'];
export const TAX_INVOICE_STATUSES = ['ISSUED', 'CANCELLED'];

/**
 * The GST document of record.
 *
 * This is deliberately not the same thing as the `Invoice` collection, which
 * derives a printable summary from a booking on the fly and can be binned. A
 * tax invoice cannot work that way: once issued it carries a number that is
 * filed with the GST portal, so it is written once and never edited. A mistake
 * is corrected by issuing a credit note against it, which is why both documents
 * share this schema and are told apart by `documentType`.
 *
 * Every amount here is a rupee figure exclusive of tax except `totalAmount`,
 * and the customer block is a snapshot: if a rider later changes their GSTIN,
 * the invoice that was already filed must keep saying what it said.
 */

const lineItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  // Services, so SAC rather than HSN. Mandatory on the face of the invoice.
  sac: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'nos' },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },

  taxRate: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
}, { _id: false });

const taxInvoiceSchema = new Schema({
  documentType: { type: String, enum: DOCUMENT_TYPES, required: true, index: true },
  // Gapless per financial year, from an atomic counter. Unique across the org.
  invoiceNumber: { type: String, required: true, unique: true },
  financialYear: { type: String, required: true, index: true },
  sequence: { type: Number, required: true },

  // A credit note is always raised against exactly one invoice.
  againstInvoice: { type: Schema.Types.ObjectId, ref: 'TaxInvoice', default: null },
  reason: { type: String, default: null },

  booking: { type: Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  bookingId: { type: String, default: null },
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

  customer: {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    gstin: { type: String, default: null },
    companyName: { type: String, default: null },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },

  // The pair that decides whether tax splits into CGST+SGST or lands as IGST.
  supplierStateCode: { type: String, default: '' },
  placeOfSupply: { type: String, default: '' },
  gstTreatment: { type: String, default: 'consumer' },
  isInterState: { type: Boolean, default: false },

  date: { type: Date, required: true },
  lineItems: { type: [lineItemSchema], default: [] },

  discountAmount: { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },

  // Held money, shown on the invoice for the rider's benefit but outside the
  // taxable value -- a deposit is a liability, not a supply.
  securityDeposit: { type: Number, default: 0 },

  status: { type: String, enum: TAX_INVOICE_STATUSES, default: 'ISSUED', index: true },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true });

// One tax invoice per booking. A second one would mean the same supply filed
// twice, so the uniqueness is enforced here rather than trusted to callers.
taxInvoiceSchema.index(
  { booking: 1, documentType: 1 },
  { unique: true, partialFilterExpression: { booking: { $type: 'objectId' }, documentType: 'INVOICE' } }
);
taxInvoiceSchema.index({ financialYear: 1, sequence: 1 });
taxInvoiceSchema.index({ date: -1 });

const TaxInvoice = mongoose.model('TaxInvoice', taxInvoiceSchema);
export default TaxInvoice;
