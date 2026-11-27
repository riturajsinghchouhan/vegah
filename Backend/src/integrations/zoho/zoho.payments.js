import ZohoSync from '../../models/ZohoSync.js';
import TaxInvoice from '../../models/TaxInvoice.js';
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import * as client from './zoho.client.js';
import * as customers from './zoho.customers.js';
import * as invoices from './zoho.invoices.js';
import { getConfig, assertReadyFor } from './zoho.config.js';

/**
 * Money received, and deposits returned.
 *
 * Zoho draws a hard line that the rest of this app does not: a payment against
 * an invoice is revenue collection, while a security deposit is an advance --
 * a liability that attracts no GST until it is either refunded or forfeited.
 * They go through the same endpoint and are told apart by `is_advance_payment`,
 * so keeping them in one module keeps that distinction in one place.
 */

const toZohoDate = (date) => new Date(date).toISOString().slice(0, 10);
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Our payment vocabulary mapped onto Zoho's fixed list.
const PAYMENT_MODE = {
  UPI: 'banktransfer',
  CARD: 'creditcard',
  NET_BANKING: 'banktransfer',
  ONLINE: 'banktransfer',
  BANK_TRANSFER: 'banktransfer',
  CHEQUE: 'check',
  CASH: 'cash',
  WALLET: 'others',
};

const zohoModeOf = (method) => PAYMENT_MODE[String(method || '').toUpperCase()] || 'others';

/**
 * Which Zoho account the money landed in. Cash collected at a hub is not in the
 * bank yet, and wallet credit never was, so neither may be booked to bank.
 */
const depositAccountFor = (method, config) => {
  const normalised = String(method || '').toUpperCase();
  if (normalised === 'CASH') return config.accounts?.cash;
  if (normalised === 'WALLET') return config.accounts?.wallet || config.accounts?.bank;
  return config.accounts?.bank;
};

const recordFor = async (entity, localId, localModel) => {
  const existing = await ZohoSync.findOne({ entity, localId });
  return existing || new ZohoSync({ entity, localModel, localId });
};

/**
 * Applies a payment against the booking's tax invoice.
 *
 * The invoice must already be in Zoho, so it is pushed first if needed -- a
 * payment that applied to nothing would sit as an unallocated credit and the
 * invoice would still read as unpaid.
 */
export const pushPayment = async (paymentOrId, { force = false } = {}) => {
  const payment = typeof paymentOrId === 'object' && paymentOrId?._id
    ? paymentOrId
    : await Payment.findById(paymentOrId);
  if (!payment) throw new NotFoundError('Payment not found');

  const localId = String(payment._id);
  const record = await recordFor('PAYMENT', localId, 'Payment');
  if (record.zohoId && !force) return record.zohoId;

  const config = await getConfig();
  assertReadyFor(config, 'PAYMENT');

  const taxInvoice = await TaxInvoice.findOne({ booking: payment.booking, documentType: 'INVOICE' });
  if (!taxInvoice) {
    throw new BadRequestError('The booking has no tax invoice yet, so the payment cannot be applied');
  }

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    const zohoInvoiceId = await invoices.pushDocument(taxInvoice);
    const customerId = await customers.customerIdFor(taxInvoice.user);

    const accountId = depositAccountFor(payment.method, config);
    if (!accountId) throw new BadRequestError(`No Zoho account mapped for payment method ${payment.method}`);

    // Zoho rejects an application larger than the invoice balance, and a
    // booking can be paid in instalments, so never apply more than is due.
    const amount = round(payment.amount);
    const applied = Math.min(amount, round(taxInvoice.totalAmount));

    const payload = {
      customer_id: customerId,
      payment_mode: zohoModeOf(payment.method),
      amount,
      date: toZohoDate(payment.paidAt || payment.updatedAt || new Date()),
      reference_number: payment.razorpayPaymentId || String(payment._id),
      account_id: accountId,
      invoices: [{ invoice_id: zohoInvoiceId, amount_applied: applied }],
      description: `Booking ${taxInvoice.bookingId || ''}`.trim(),
    };

    const data = await client.post('/customerpayments', payload);
    record.zohoId = data.payment.payment_id;
    record.zohoNumber = data.payment.payment_number || null;
    record.status = 'SYNCED';
    record.syncedAt = new Date();
    record.lastError = null;
    record.payload = payload;
    await record.save();
    return record.zohoId;
  } catch (error) {
    record.status = 'FAILED';
    record.lastError = error.message;
    await record.save();
    throw error;
  }
};

/**
 * Records a security deposit as a customer advance.
 *
 * Sent with no `invoices` and `is_advance_payment`, so Zoho holds it as a
 * liability rather than income. This is the single correction that most changes
 * the filed numbers: a deposit booked as revenue would be taxed, and it is not
 * a supply at all until it is forfeited.
 */
export const pushDeposit = async (bookingOrId, { force = false } = {}) => {
  const booking = typeof bookingOrId === 'object' && bookingOrId?._id
    ? bookingOrId
    : await Booking.findById(bookingOrId);
  if (!booking) throw new NotFoundError('Booking not found');

  const amount = round(booking.securityDeposit);
  if (amount <= 0) return null;

  const localId = String(booking._id);
  const record = await recordFor('DEPOSIT', localId, 'Booking');
  if (record.zohoId && !force) return record.zohoId;

  const config = await getConfig();
  assertReadyFor(config, 'DEPOSIT');

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    const customerId = await customers.customerIdFor(booking.user);
    const accountId = depositAccountFor(booking.paymentMethod, config);
    if (!accountId) throw new BadRequestError(`No Zoho account mapped for ${booking.paymentMethod}`);

    const payload = {
      customer_id: customerId,
      payment_mode: zohoModeOf(booking.paymentMethod),
      amount,
      date: toZohoDate(booking.actualPickupAt || booking.startDate || new Date()),
      reference_number: `DEP-${booking.bookingId}`,
      account_id: accountId,
      is_advance_payment: true,
      description: `Security deposit, booking ${booking.bookingId}`,
    };

    const data = await client.post('/customerpayments', payload);
    record.zohoId = data.payment.payment_id;
    record.zohoNumber = data.payment.payment_number || null;
    record.status = 'SYNCED';
    record.syncedAt = new Date();
    record.lastError = null;
    record.payload = payload;
    await record.save();
    return record.zohoId;
  } catch (error) {
    record.status = 'FAILED';
    record.lastError = error.message;
    await record.save();
    throw error;
  }
};

/**
 * Refunds a deposit against the advance it was collected as.
 *
 * Keyed by booking rather than by any refund row, because a deposit is settled
 * once per rental; `amount` is whatever survived a late fee or damage netting.
 */
export const refundDeposit = async ({ bookingId, amount, date, reason, mode = 'CASH' }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  const value = round(amount);
  if (value <= 0) throw new BadRequestError('Refund amount must be positive');

  const depositRecord = await ZohoSync.findOne({ entity: 'DEPOSIT', localId: String(booking._id) });
  if (!depositRecord?.zohoId) {
    throw new BadRequestError('The deposit was never pushed to Zoho, so there is nothing to refund against');
  }

  const localId = String(booking._id);
  const record = await recordFor('DEPOSIT_REFUND', localId, 'Booking');
  if (record.zohoId) return record.zohoId;

  const config = await getConfig();
  assertReadyFor(config, 'DEPOSIT_REFUND');

  record.attempts += 1;
  record.lastAttemptAt = new Date();

  try {
    const fromAccountId = depositAccountFor(mode, config);
    if (!fromAccountId) throw new BadRequestError(`No Zoho account mapped for ${mode}`);

    const payload = {
      date: toZohoDate(date || new Date()),
      amount: value,
      refund_mode: zohoModeOf(mode),
      from_account_id: fromAccountId,
      reference_number: `REF-DEP-${booking.bookingId}`,
      description: reason || 'Deposit returned at checkout',
    };

    const data = await client.post(`/customerpayments/${depositRecord.zohoId}/refunds`, payload);
    record.zohoId = data.refund?.payment_refund_id || data.payment_refund?.payment_refund_id || depositRecord.zohoId;
    record.status = 'SYNCED';
    record.syncedAt = new Date();
    record.lastError = null;
    record.payload = payload;
    await record.save();
    return record.zohoId;
  } catch (error) {
    record.status = 'FAILED';
    record.lastError = error.message;
    await record.save();
    throw error;
  }
};

/** Pushes successful payments that have an invoice in Zoho but no payment yet. */
export const pushPendingPayments = async ({ limit = 50 } = {}) => {
  const synced = await ZohoSync.find({ entity: 'PAYMENT', status: 'SYNCED' }).distinct('localId');
  const invoicedBookings = await TaxInvoice.find({ documentType: 'INVOICE' }).distinct('booking');

  const payments = await Payment.find({
    _id: { $nin: synced },
    status: 'SUCCESS',
    booking: { $in: invoicedBookings },
  }).sort({ paidAt: 1 }).limit(limit);

  const result = { attempted: payments.length, synced: 0, failed: 0, errors: [] };
  for (const payment of payments) {
    try {
      await pushPayment(payment);
      result.synced += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ paymentId: String(payment._id), message: error.message });
    }
  }
  return result;
};
