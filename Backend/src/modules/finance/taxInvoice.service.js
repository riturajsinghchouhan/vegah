import TaxInvoice from '../../models/TaxInvoice.js';
import LedgerSequence from '../../models/LedgerSequence.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import * as settingsService from '../settings/settings.service.js';
import { getConfig as getZohoConfig } from '../../integrations/zoho/zoho.config.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors.js';
import {
  isValidGstin,
  stateCodeFromGstin,
  gstTreatmentOf,
  splitGst,
  splitInclusive,
} from '../../utils/gst.js';

/**
 * Issuing GST documents.
 *
 * Two rules drive everything here. A tax invoice number must be sequential and
 * gapless within a financial year, so it comes from an atomic counter and is
 * never reused. And an issued invoice is immutable, so corrections are credit
 * notes rather than edits -- there is deliberately no update function.
 */

const INVOICE_PREFIX = 'VG';
const CREDIT_NOTE_PREFIX = 'CN';
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** The Indian financial year a date falls in: April to March, labelled "2026-27". */
export const financialYearOf = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  // Months are zero-based, so 3 is April.
  const startYear = d.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
};

/**
 * The next number in the series. `findOneAndUpdate` with `$inc` is atomic, so
 * two bookings completing at the same instant cannot collide on a number.
 */
const nextNumber = async (documentType, financialYear) => {
  const prefix = documentType === 'CREDIT_NOTE' ? CREDIT_NOTE_PREFIX : INVOICE_PREFIX;
  const counter = await LedgerSequence.findOneAndUpdate(
    { name: `${prefix}:${financialYear}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  // 16 characters, which is the GST ceiling for a document number.
  return {
    sequence: counter.value,
    invoiceNumber: `${prefix}/${financialYear}/${String(counter.value).padStart(5, '0')}`,
  };
};

const customerSnapshot = (user) => {
  const billing = user?.billing || {};
  const gstin = isValidGstin(billing.gstin) ? String(billing.gstin).toUpperCase() : null;
  return {
    name: user?.fullName || 'Rider',
    phone: user?.phone || '',
    email: user?.email || '',
    gstin,
    companyName: billing.companyName || null,
    address: billing.address || '',
    city: billing.city || '',
    stateCode: stateCodeFromGstin(gstin) || String(billing.stateCode || '').toUpperCase() || '',
    pincode: billing.pincode || '',
  };
};

/**
 * Turns a booking's money fields into invoice lines.
 *
 * The component amounts on a booking are already tax-exclusive and `taxAmount`
 * is held separately, so the lines are built at net value and the tax is
 * apportioned across them in proportion to their value. The security deposit is
 * excluded: it is refundable and attracts no GST.
 */
const makeLine = ({ name, sac, unit, amount, gstRate }) => ({
  name,
  description: '',
  sac: sac || '',
  quantity: 1,
  unit,
  rate: amount,
  amount,
  taxRate: gstRate,
  cgst: 0,
  sgst: 0,
  igst: 0,
});

export const lineItemsFor = (booking, sac, gstRate) => {
  // These four are the booking's priced components. They are net of tax, and
  // the tax on all of them together is the single `taxAmount` the booking
  // carries, so their tax is apportioned rather than recomputed.
  const priced = [
    { name: 'Vehicle rental', key: 'rentalBase', sac: sac.rental, unit: 'rental' },
    { name: 'Battery swap package', key: 'batteryPackageFee', sac: sac.swap, unit: 'package' },
    { name: 'Service fee', key: 'serviceFee', sac: sac.serviceFee, unit: 'nos' },
    { name: 'Platform fee', key: 'platformFee', sac: sac.platformFee, unit: 'nos' },
  ]
    .map((item) => ({ ...item, amount: round(booking[item.key]) }))
    .filter((item) => item.amount > 0)
    .map((item) => makeLine({ ...item, gstRate }));

  // A late fee is charged after the booking was priced, so it is outside
  // `totalAmount` and `taxAmount` entirely and is held gross. The ledger treats
  // it as tax-inclusive (E11), and this must agree or the two would report
  // different output tax for the same rental.
  const lateFeeGross = round(booking.lateFee);
  if (lateFeeGross <= 0) return { priced, lateFee: null };

  const { net, tax } = splitInclusive(lateFeeGross, gstRate);
  return {
    priced,
    lateFee: {
      line: makeLine({ name: 'Late return fee', sac: sac.lateFee, unit: 'nos', amount: net, gstRate }),
      tax,
    },
  };
};

/** Splits one tax figure onto a line and reports what it added. */
const taxLine = (line, taxAmount, supplierStateCode, placeOfSupply) => {
  const split = splitGst({ taxAmount, supplierStateCode, placeOfSupply });
  line.cgst = split.cgst;
  line.sgst = split.sgst;
  line.igst = split.igst;
  return split;
};

/**
 * Assembles the invoice totals.
 *
 * The priced lines share the booking's `taxAmount`, apportioned by value with
 * the last line absorbing the rounding remainder so the parts add back exactly.
 * The late fee carries its own tax, computed from its gross.
 */
export const applyTax = ({ priced, lateFee }, bookingTax, supplierStateCode, placeOfSupply) => {
  const pricedValue = round(priced.reduce((sum, item) => sum + item.amount, 0));
  const tax = round(bookingTax);

  if (pricedValue > 0 && tax > 0) {
    let allocated = 0;
    priced.forEach((item, index) => {
      const isLast = index === priced.length - 1;
      const share = isLast ? round(tax - allocated) : round((item.amount / pricedValue) * tax);
      allocated = round(allocated + share);
      taxLine(item, share, supplierStateCode, placeOfSupply);
    });
  }

  const lineItems = [...priced];
  if (lateFee) {
    taxLine(lateFee.line, lateFee.tax, supplierStateCode, placeOfSupply);
    lineItems.push(lateFee.line);
  }

  const totals = lineItems.reduce(
    (acc, item) => ({
      taxableValue: round(acc.taxableValue + item.amount),
      cgst: round(acc.cgst + item.cgst),
      sgst: round(acc.sgst + item.sgst),
      igst: round(acc.igst + item.igst),
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
  );

  return {
    lineItems,
    ...totals,
    totalTax: round(totals.cgst + totals.sgst + totals.igst),
    isInterState: totals.igst > 0,
  };
};

/**
 * Issues the tax invoice for a completed booking.
 *
 * Idempotent by the unique index on (booking, INVOICE): if one already exists
 * it is returned untouched rather than a second one being issued, because a
 * retry must never consume another number from the series.
 */
export const issueForBooking = async (bookingOrId, { issuedBy = null } = {}) => {
  const booking = typeof bookingOrId === 'object' && bookingOrId?._id
    ? bookingOrId
    : await Booking.findById(bookingOrId);
  if (!booking) throw new NotFoundError('Booking not found');

  const existing = await TaxInvoice.findOne({ booking: booking._id, documentType: 'INVOICE' });
  if (existing) return existing;

  const [user, zohoConfig, pricing] = await Promise.all([
    User.findById(booking.user),
    getZohoConfig(),
    settingsService.getSettings('pricing'),
  ]);

  const customer = customerSnapshot(user);
  const supplierStateCode = zohoConfig.supplierStateCode;
  if (!supplierStateCode) {
    throw new BadRequestError('Supplier state is not set. Configure it under Accounting → Zoho Books.');
  }

  // Without a customer state there is nothing to evidence an inter-state
  // supply, so the supply is treated as local to the supplier.
  const placeOfSupply = customer.stateCode || supplierStateCode;
  const gstRate = Number(pricing?.gstRate ?? 18) || 0;

  const parts = lineItemsFor(booking, zohoConfig.sac || {}, gstRate);
  if (!parts.priced.length && !parts.lateFee) {
    throw new BadRequestError(`Booking ${booking.bookingId} has no chargeable amount to invoice`);
  }

  const totals = applyTax(parts, booking.taxAmount, supplierStateCode, placeOfSupply);
  const discountAmount = round(booking.discountAmount);
  const date = booking.actualReturnAt || booking.updatedAt || new Date();
  const financialYear = financialYearOf(date);
  const { sequence, invoiceNumber } = await nextNumber('INVOICE', financialYear);

  try {
    return await TaxInvoice.create({
      documentType: 'INVOICE',
      invoiceNumber,
      financialYear,
      sequence,
      booking: booking._id,
      bookingId: booking.bookingId,
      user: booking.user,
      customer,
      supplierStateCode,
      placeOfSupply,
      gstTreatment: gstTreatmentOf({ gstin: customer.gstin, isBusiness: Boolean(customer.companyName) }),
      isInterState: totals.isInterState,
      date,
      lineItems: totals.lineItems,
      discountAmount,
      taxableValue: totals.taxableValue,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      totalTax: totals.totalTax,
      totalAmount: round(totals.taxableValue + totals.totalTax - discountAmount),
      securityDeposit: round(booking.securityDeposit),
      issuedBy,
    });
  } catch (error) {
    // Two completions racing past the existence check: the index wins, and the
    // invoice the other request issued is the correct answer.
    if (error.code === 11000) {
      const raced = await TaxInvoice.findOne({ booking: booking._id, documentType: 'INVOICE' });
      if (raced) return raced;
    }
    throw error;
  }
};

/**
 * Credits an issued invoice, wholly or in part.
 *
 * This is the only way to undo an invoice. The original stays on the record
 * exactly as filed; a full credit also marks it cancelled so reports stop
 * counting it as live revenue.
 */
export const issueCreditNote = async ({ invoiceId, reason, amount = null, issuedBy = null }) => {
  const invoice = await TaxInvoice.findOne({ _id: invoiceId, documentType: 'INVOICE' });
  if (!invoice) throw new NotFoundError('Tax invoice not found');
  if (!reason || !String(reason).trim()) {
    throw new BadRequestError('A credit note needs a reason');
  }

  const alreadyCredited = await TaxInvoice.aggregate([
    { $match: { againstInvoice: invoice._id, documentType: 'CREDIT_NOTE' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const credited = round(alreadyCredited[0]?.total || 0);
  const remaining = round(invoice.totalAmount - credited);
  if (remaining <= 0) throw new ConflictError('This invoice has already been credited in full');

  const creditAmount = amount === null ? remaining : round(amount);
  if (creditAmount <= 0) throw new BadRequestError('Credit amount must be positive');
  if (creditAmount > remaining) {
    throw new BadRequestError(`Credit cannot exceed the uncredited balance of ₹${remaining}`);
  }

  // A partial credit is apportioned across the original lines so the credit
  // note carries the same SAC codes and tax split as what it reverses.
  const ratio = creditAmount / invoice.totalAmount;
  const lineItems = invoice.lineItems.map((item) => ({
    name: item.name,
    description: item.description,
    sac: item.sac,
    quantity: item.quantity,
    unit: item.unit,
    rate: round(item.rate * ratio),
    amount: round(item.amount * ratio),
    taxRate: item.taxRate,
    cgst: round(item.cgst * ratio),
    sgst: round(item.sgst * ratio),
    igst: round(item.igst * ratio),
  }));

  const totals = lineItems.reduce(
    (acc, item) => ({
      taxableValue: round(acc.taxableValue + item.amount),
      cgst: round(acc.cgst + item.cgst),
      sgst: round(acc.sgst + item.sgst),
      igst: round(acc.igst + item.igst),
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
  );

  const date = new Date();
  const financialYear = financialYearOf(date);
  const { sequence, invoiceNumber } = await nextNumber('CREDIT_NOTE', financialYear);

  const creditNote = await TaxInvoice.create({
    documentType: 'CREDIT_NOTE',
    invoiceNumber,
    financialYear,
    sequence,
    againstInvoice: invoice._id,
    reason: String(reason).trim(),
    booking: invoice.booking,
    bookingId: invoice.bookingId,
    user: invoice.user,
    customer: invoice.customer,
    supplierStateCode: invoice.supplierStateCode,
    placeOfSupply: invoice.placeOfSupply,
    gstTreatment: invoice.gstTreatment,
    isInterState: invoice.isInterState,
    date,
    lineItems,
    discountAmount: round(invoice.discountAmount * ratio),
    ...totals,
    totalTax: round(totals.cgst + totals.sgst + totals.igst),
    totalAmount: creditAmount,
    issuedBy,
  });

  if (round(credited + creditAmount) >= invoice.totalAmount) {
    invoice.status = 'CANCELLED';
    await invoice.save();
  }

  return creditNote;
};

export const listDocuments = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);

  const filter = {};
  if (query.documentType) filter.documentType = query.documentType;
  if (query.financialYear) filter.financialYear = query.financialYear;
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }
  if (query.search) {
    const escaped = String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escaped) {
      filter.$or = [
        { invoiceNumber: new RegExp(escaped, 'i') },
        { bookingId: new RegExp(escaped, 'i') },
        { 'customer.name': new RegExp(escaped, 'i') },
        { 'customer.phone': new RegExp(escaped, 'i') },
      ];
    }
  }

  const [documents, total] = await Promise.all([
    TaxInvoice.find(filter).sort({ date: -1, sequence: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    TaxInvoice.countDocuments(filter),
  ]);

  return { documents, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getDocument = async (id) => {
  const document = await TaxInvoice.findById(id).lean();
  if (!document) throw new NotFoundError('Document not found');
  return document;
};

/**
 * GSTR-1 style summary: what was supplied in a period, split B2B from B2C and
 * netted of credit notes. This is the figure the CA reconciles against.
 */
export const getGstSummary = async ({ from, to } = {}) => {
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const rows = await TaxInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: { documentType: '$documentType', isB2B: { $ne: ['$customer.gstin', null] } },
        count: { $sum: 1 },
        taxableValue: { $sum: '$taxableValue' },
        cgst: { $sum: '$cgst' },
        sgst: { $sum: '$sgst' },
        igst: { $sum: '$igst' },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);

  const blank = { count: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 };
  const summary = {
    b2bInvoices: { ...blank },
    b2cInvoices: { ...blank },
    creditNotes: { ...blank },
  };

  for (const row of rows) {
    const key = row._id.documentType === 'CREDIT_NOTE'
      ? 'creditNotes'
      : (row._id.isB2B ? 'b2bInvoices' : 'b2cInvoices');
    for (const field of Object.keys(blank)) {
      summary[key][field] = round(summary[key][field] + row[field]);
    }
  }

  const net = ['taxableValue', 'cgst', 'sgst', 'igst', 'totalAmount'].reduce((acc, field) => {
    acc[field] = round(
      summary.b2bInvoices[field] + summary.b2cInvoices[field] - summary.creditNotes[field]
    );
    return acc;
  }, {});
  net.outputTax = round(net.cgst + net.sgst + net.igst);

  return { ...summary, net };
};
