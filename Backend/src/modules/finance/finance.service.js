import mongoose from 'mongoose';
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import Refund from '../../models/Refund.js';
import Invoice, { INVOICE_STATUSES, INVOICE_PAYMENT_MODES } from '../../models/Invoice.js';
import * as settingsService from '../settings/settings.service.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export const getFinanceSummary = async (query = {}) => {
  const grossPaymentAgg = await Payment.aggregate([
    { $match: { status: { $in: ['SUCCESS', 'COMPLETED'] } } },
    { $group: { _id: null, totalGross: { $sum: '$amount' } } }
  ]);
  const grossRevenue = grossPaymentAgg[0]?.totalGross || 0;

  const refundAgg = await Refund.aggregate([
    { $match: { status: { $in: ['SUCCESS', 'COMPLETED'] } } },
    { $group: { _id: null, totalRefunded: { $sum: '$amount' } } }
  ]);
  const totalRefunded = refundAgg[0]?.totalRefunded || 0;

  const netRevenue = grossRevenue - totalRefunded;
  
  // Dynamic GST from settings
  const pricingSettings = await settingsService.getSettings('pricing');
  const gstRate = Number(pricingSettings.gstRate ?? 18);
  const estimatedTax = netRevenue * (gstRate / 100);

  const recentTransactions = await Payment.find()
    .populate({
      path: 'booking',
      select: 'bookingId user',
      populate: { path: 'user', select: 'name fullName email' }
    })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    summary: {
      grossRevenue,
      totalRefunded,
      netRevenue,
      estimatedTax,
    },
    recentTransactions,
  };
};

export const getSettlements = async (query = {}) => {
  const { page = 1, limit = 20, status } = query;
  const filter = { status: { $in: ['SUCCESS', 'COMPLETED'] } };

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  const totalSettled = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return {
    settlements: payments.map(p => ({
      id: p._id,
      paymentId: p.razorpayPaymentId || p._id,
      amount: p.amount,
      gatewayFee: (p.amount * 0.02).toFixed(2), // 2% gateway fee standard
      netSettlement: (p.amount * 0.98).toFixed(2),
      status: 'Settled',
      date: p.createdAt,
    })),
    totalSettled,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

// Invoices derived from payments and bookings. They have no row of their own;
// see models/Invoice.js for how deleted ones are tracked.
const buildSystemInvoices = async (pricingSettings) => {
  const gstRateNum = Number(pricingSettings.gstRate ?? 18);
  const gstDivisor = 1 + (gstRateNum / 100);

  // 1. Fetch successful payments
  const payments = await Payment.find({ status: { $in: ['SUCCESS', 'COMPLETED'] } })
    .populate({
      path: 'booking',
      select: 'bookingId user vehicle rentalBase serviceFee platformFee taxAmount totalAmount paymentMethod status createdAt',
      populate: [
        { path: 'user', select: 'fullName name email phone' },
        { path: 'vehicle', select: 'name brand model plateNumber' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(100);

  const paymentBookingIds = payments.map(p => p.booking?._id?.toString()).filter(Boolean);

  // 2. Fetch completed/confirmed bookings (e.g. CASH or WALLET) that may not be in payments collection
  const additionalBookings = await Booking.find({
    _id: { $nin: paymentBookingIds },
    status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
    totalAmount: { $gt: 0 }
  })
    .populate('user', 'fullName name email phone')
    .populate('vehicle', 'name brand model plateNumber')
    .sort({ createdAt: -1 })
    .limit(50);

  const invoicesFromPayments = payments.map(p => {
    const booking = p.booking;
    const totalAmount = p.amount || booking?.totalAmount || 0;
    const taxAmount = booking?.taxAmount != null && booking.taxAmount > 0
      ? booking.taxAmount
      : +(totalAmount - (totalAmount / gstDivisor)).toFixed(2);
    const baseAmount = booking?.rentalBase != null && booking.rentalBase > 0
      ? booking.rentalBase
      : +(totalAmount - taxAmount).toFixed(2);

    const invoiceNumber = booking?.bookingId
      ? `INV-${booking.bookingId}`
      : `INV-${p._id.toString().slice(-6).toUpperCase()}`;

    return {
      id: p._id,
      invoiceId: invoiceNumber,
      bookingId: booking?.bookingId || null,
      bookingDbId: booking?._id || null,
      customerName: booking?.user?.fullName || booking?.user?.name || 'Customer',
      customerEmail: booking?.user?.email || '',
      customerPhone: booking?.user?.phone || '',
      vehicleName: booking?.vehicle ? `${booking.vehicle.brand || ''} ${booking.vehicle.model || booking.vehicle.name || ''}`.trim() : 'EV Rental',
      plateNumber: booking?.vehicle?.plateNumber || '',
      date: p.paidAt || p.createdAt,
      totalAmount,
      baseAmount,
      taxAmount,
      serviceFee: booking?.serviceFee || 0,
      platformFee: booking?.platformFee || Number(pricingSettings.platformFee ?? 20),
      gstRate: `${gstRateNum}%`,
      status: 'Paid',
      paymentMethod: p.method || booking?.paymentMethod || 'ONLINE',
      source: 'SYSTEM',
    };
  });

  const invoicesFromBookings = additionalBookings.map(b => {
    const totalAmount = b.totalAmount || 0;
    const taxAmount = b.taxAmount != null && b.taxAmount > 0
      ? b.taxAmount
      : +(totalAmount - (totalAmount / gstDivisor)).toFixed(2);
    const baseAmount = b.rentalBase != null && b.rentalBase > 0
      ? b.rentalBase
      : +(totalAmount - taxAmount).toFixed(2);

    return {
      id: b._id,
      invoiceId: `INV-${b.bookingId || b._id.toString().slice(-6).toUpperCase()}`,
      bookingId: b.bookingId,
      bookingDbId: b._id,
      customerName: b.user?.fullName || b.user?.name || 'Customer',
      customerEmail: b.user?.email || '',
      customerPhone: b.user?.phone || '',
      vehicleName: b.vehicle ? `${b.vehicle.brand || ''} ${b.vehicle.model || b.vehicle.name || ''}`.trim() : 'EV Rental',
      plateNumber: b.vehicle?.plateNumber || '',
      date: b.createdAt,
      totalAmount,
      baseAmount,
      taxAmount,
      serviceFee: b.serviceFee || 0,
      platformFee: b.platformFee || Number(pricingSettings.platformFee ?? 20),
      gstRate: `${gstRateNum}%`,
      status: b.status === 'COMPLETED' ? 'Paid' : 'Confirmed',
      paymentMethod: b.paymentMethod || 'CASH',
      source: 'SYSTEM',
    };
  });

  return [...invoicesFromPayments, ...invoicesFromBookings];
};

const toInvoiceView = (doc) => ({
  id: doc._id,
  invoiceId: doc.invoiceId,
  bookingId: doc.bookingId || null,
  customerName: doc.customerName,
  customerEmail: doc.customerEmail || '',
  customerPhone: doc.customerPhone || '',
  vehicleName: doc.vehicleName || '',
  description: doc.description || '',
  date: doc.date,
  totalAmount: doc.totalAmount,
  baseAmount: doc.baseAmount,
  taxAmount: doc.taxAmount,
  serviceFee: doc.serviceFee,
  platformFee: doc.platformFee,
  gstRate: doc.gstRate,
  status: doc.status,
  paymentMethod: doc.paymentMethod,
  notes: doc.notes || '',
  source: doc.source,
  deletedAt: doc.deletedAt,
});

export const getTaxBilling = async (query = {}) => {
  const pricingSettings = await settingsService.getSettings('pricing');
  const gstRateNum = Number(pricingSettings.gstRate ?? 18);

  const [systemInvoices, storedInvoices] = await Promise.all([
    buildSystemInvoices(pricingSettings),
    Invoice.find({ $or: [{ source: 'SYSTEM' }, { source: 'MANUAL', deletedAt: null }] }).lean(),
  ]);

  // Every SYSTEM row is a deleted (binned or purged) derived invoice.
  const hiddenKeys = new Set(
    storedInvoices.filter((inv) => inv.source === 'SYSTEM').map((inv) => inv.sourceKey)
  );
  const manualInvoices = storedInvoices
    .filter((inv) => inv.source === 'MANUAL')
    .map(toInvoiceView);

  const allInvoices = [
    ...systemInvoices.filter((inv) => !hiddenKeys.has(String(inv.id))),
    ...manualInvoices,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    taxRate: gstRateNum,
    currency: 'INR',
    settings: {
      gstRate: gstRateNum,
      platformFee: Number(pricingSettings.platformFee ?? 20),
      serviceCharge: Number(pricingSettings.serviceCharge || 5),
      cancellationFee: Number(pricingSettings.cancellationFee || 100),
    },
    invoices: allInvoices,
  };
};

// --- Invoice create / delete / bin ---

const toAmount = (value, field) => {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) throw new BadRequestError(`${field} must be a positive number`);
  return Math.round(num * 100) / 100;
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid invoice id');
};

const generateManualInvoiceId = () => {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-M-${day}-${suffix}`;
};

export const createInvoice = async (body = {}, adminId) => {
  const customerName = String(body.customerName || '').trim();
  if (!customerName) throw new BadRequestError('Customer name is required');

  const baseAmount = toAmount(body.baseAmount, 'Base amount');
  if (baseAmount <= 0) throw new BadRequestError('Base amount must be greater than 0');
  const serviceFee = toAmount(body.serviceFee, 'Service fee');
  const platformFee = toAmount(body.platformFee, 'Platform fee');

  let gstRateNum = body.gstRate;
  if (gstRateNum === undefined || gstRateNum === null || gstRateNum === '') {
    const pricingSettings = await settingsService.getSettings('pricing');
    gstRateNum = Number(pricingSettings.gstRate ?? 18);
  }
  gstRateNum = toAmount(gstRateNum, 'GST rate');
  if (gstRateNum > 100) throw new BadRequestError('GST rate cannot be more than 100%');

  const taxable = baseAmount + serviceFee + platformFee;
  const taxAmount = Math.round(taxable * gstRateNum) / 100;
  const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

  const status = INVOICE_STATUSES.includes(body.status) ? body.status : 'Paid';
  const paymentMethod = INVOICE_PAYMENT_MODES.includes(body.paymentMethod) ? body.paymentMethod : 'CASH';

  let date = new Date();
  if (body.date) {
    const raw = String(body.date).trim();
    date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00+05:30`) : new Date(raw);
    if (Number.isNaN(date.getTime())) throw new BadRequestError('Invalid invoice date');
  }

  const invoice = await Invoice.create({
    source: 'MANUAL',
    invoiceId: generateManualInvoiceId(),
    bookingId: String(body.bookingId || '').trim() || null,
    customerName,
    customerEmail: String(body.customerEmail || '').trim(),
    customerPhone: String(body.customerPhone || '').trim(),
    vehicleName: String(body.vehicleName || '').trim(),
    description: String(body.description || '').trim(),
    date,
    baseAmount,
    serviceFee,
    platformFee,
    taxAmount,
    totalAmount,
    gstRate: `${gstRateNum}%`,
    status,
    paymentMethod,
    notes: String(body.notes || '').trim(),
    createdBy: adminId || null,
  });

  return toInvoiceView(invoice);
};

/**
 * Moves an invoice to the bin. `id` is a manual invoice's _id, or the
 * payment/booking id a system invoice is derived from. The payment or booking
 * itself is never modified.
 */
export const deleteInvoice = async (id, adminId) => {
  assertValidId(id);

  const manual = await Invoice.findOne({ _id: id, source: 'MANUAL', deletedAt: null });
  if (manual) {
    manual.deletedAt = new Date();
    manual.deletedBy = adminId || null;
    await manual.save();
    return toInvoiceView(manual);
  }

  const pricingSettings = await settingsService.getSettings('pricing');
  const systemInvoices = await buildSystemInvoices(pricingSettings);
  const target = systemInvoices.find((inv) => String(inv.id) === String(id));
  if (!target) throw new NotFoundError('Invoice not found');

  const existing = await Invoice.findOne({ source: 'SYSTEM', sourceKey: String(id) });
  if (existing) throw new BadRequestError('This invoice is already deleted');

  const marker = await Invoice.create({
    source: 'SYSTEM',
    sourceKey: String(id),
    invoiceId: target.invoiceId,
    bookingId: target.bookingId,
    customerName: target.customerName || 'Customer',
    customerEmail: target.customerEmail,
    customerPhone: target.customerPhone,
    vehicleName: target.vehicleName,
    date: target.date || new Date(),
    baseAmount: Math.max(0, Number(target.baseAmount) || 0),
    serviceFee: Math.max(0, Number(target.serviceFee) || 0),
    platformFee: Math.max(0, Number(target.platformFee) || 0),
    taxAmount: Math.max(0, Number(target.taxAmount) || 0),
    totalAmount: Math.max(0, Number(target.totalAmount) || 0),
    gstRate: target.gstRate,
    status: INVOICE_STATUSES.includes(target.status) ? target.status : 'Paid',
    paymentMethod: target.paymentMethod,
    deletedAt: new Date(),
    deletedBy: adminId || null,
  });
  return toInvoiceView(marker);
};

export const listDeletedInvoices = async () => {
  const docs = await Invoice.find({ deletedAt: { $ne: null }, purgedAt: null })
    .sort({ deletedAt: -1 })
    .lean();
  return docs.map(toInvoiceView);
};

// `id` here is the bin row's own _id.
export const restoreInvoice = async (id) => {
  assertValidId(id);
  const doc = await Invoice.findOne({ _id: id, deletedAt: { $ne: null }, purgedAt: null });
  if (!doc) throw new NotFoundError('Invoice not found in bin');

  if (doc.source === 'SYSTEM') {
    // Dropping the marker lets the derived invoice show up again.
    await Invoice.deleteOne({ _id: doc._id });
  } else {
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save();
  }
  return { id: doc._id, invoiceId: doc.invoiceId };
};

export const purgeInvoice = async (id) => {
  assertValidId(id);
  const doc = await Invoice.findOne({ _id: id, deletedAt: { $ne: null }, purgedAt: null });
  if (!doc) throw new NotFoundError('Invoice not found in bin');

  if (doc.source === 'SYSTEM') {
    // Keep the marker so the derived invoice stays hidden for good.
    doc.purgedAt = new Date();
    await doc.save();
  } else {
    await Invoice.deleteOne({ _id: doc._id });
  }
  return { id: doc._id, invoiceId: doc.invoiceId };
};
