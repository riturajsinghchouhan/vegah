import Payment from '../../models/Payment.js';
import TaxInvoice from '../../models/TaxInvoice.js';
import * as taxInvoiceService from '../../modules/finance/taxInvoice.service.js';
import logger from '../../utils/logger.js';
import * as client from './zoho.client.js';
import * as invoices from './zoho.invoices.js';
import * as payments from './zoho.payments.js';
import * as expenses from './zoho.expenses.js';

/**
 * Where business events reach Zoho.
 *
 * Same contract as the ledger hooks: nothing here may throw. A rider returning
 * a scooter must not fail because an accounting API is down, and every push is
 * idempotent, so anything missed is picked up by the retry endpoint rather
 * than being lost. That is the whole reason this file exists instead of the
 * services calling the push modules directly.
 */

const guard = (name, fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (error) {
    logger.error(`Zoho hook ${name} failed: ${error.message}`);
  }
};

/**
 * Wraps a push so an unconfigured Zoho is a no-op rather than an error. Used
 * around the push half of each hook only: issuing a GST document is a legal
 * obligation that stands whether or not anyone connected an accounting tool,
 * so that half always runs.
 */
const push = async (label, fn) => {
  if (!client.isConfigured()) return;
  try {
    await fn();
  } catch (error) {
    logger.error(`Zoho push ${label} failed: ${error.message}`);
  }
};

/**
 * A completed booking is the point at which the supply is final: the rental
 * ran its course, late fees and damage are known, and nothing more will change
 * the amount. Invoicing earlier would mean voiding documents every time a
 * booking was cancelled, and a void leaves a gap in the filed series.
 */
export const onBookingCompleted = guard('onBookingCompleted', async (booking) => {
  const taxInvoice = await taxInvoiceService.issueForBooking(booking);

  // The deposit is pushed first so it lands as an advance rather than being
  // swept into the invoice payment that follows.
  if (Number(booking.securityDeposit) > 0) {
    await push('deposit', () => payments.pushDeposit(booking));
  }

  await push('invoice', () => invoices.pushDocument(taxInvoice));

  // Payments collected before completion have no invoice to apply to at the
  // time they are taken, so they are applied here, once there is one.
  const successful = await Payment.find({ booking: booking._id, status: 'SUCCESS' });
  for (const payment of successful) {
    await push(`payment ${payment._id}`, () => payments.pushPayment(payment));
  }
});

/**
 * A cancelled booking that was never invoiced needs nothing: there is no
 * document to undo. One that was invoiced is credited, never deleted.
 */
export const onBookingCancelled = guard('onBookingCancelled', async (booking, reason) => {
  const invoice = await TaxInvoice.findOne({
    booking: booking._id,
    documentType: 'INVOICE',
    status: 'ISSUED',
  });
  if (!invoice) return;

  const creditNote = await taxInvoiceService.issueCreditNote({
    invoiceId: invoice._id,
    reason: reason || 'Booking cancelled',
  });
  await push('credit note', () => invoices.pushDocument(creditNote));
});

export const onDepositRefunded = guard('onDepositRefunded', async ({ booking, amount, date, reason, mode }) => {
  await push('deposit refund', () => payments.refundDeposit({
    bookingId: booking._id,
    amount,
    date,
    reason,
    mode: mode || booking.paymentMethod,
  }));
});

export const onExpenseRecorded = guard('onExpenseRecorded', async (expense) => {
  await push('expense', () => expenses.pushExpense(expense));
});

export const onExpenseUpdated = guard('onExpenseUpdated', async (expense) => {
  await push('expense update', () => expenses.pushExpense(expense, { allowUpdate: true }));
});
