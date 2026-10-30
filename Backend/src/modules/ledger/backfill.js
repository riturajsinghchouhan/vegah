import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import Expense from '../../models/Expense.js';
import Refund from '../../models/Refund.js';
import Wallet from '../../models/Wallet.js';
import JournalEntry from '../../models/JournalEntry.js';
import * as settingsService from '../settings/settings.service.js';
import * as ledger from './ledger.service.js';
import * as map from './eventMapping.js';
import logger from '../../utils/logger.js';

// Bookings that have been invoiced to the rider. Anything still reserved,
// awaiting verification, cancelled or expired was never a sale.
const INVOICED_STATUSES = ['CONFIRMED', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE', 'COMPLETED'];

const PRODUCTION_HOST = /vegah\.lx1h6fg/;

const assertNotProduction = () => {
  const host = mongoose.connection.host || '';
  const name = mongoose.connection.client?.s?.url || '';
  if (PRODUCTION_HOST.test(host) || PRODUCTION_HOST.test(name)) {
    throw new Error('Refusing to backfill against the production cluster');
  }
};

/**
 * Posts historical events into the ledger so the reports have something to show
 * before live posting is wired in. Safe to re-run: every entry carries an
 * idempotency key, so a second pass posts nothing new.
 *
 * Deliberately not registered with the seed runner.
 */
export const backfillLedger = async ({ dryRun = false } = {}) => {
  assertNotProduction();

  const stats = { bookingsInvoiced: 0, recognitionDays: 0, paymentsCaptured: 0, cashCollected: 0, depositsRefunded: 0, refundsPaid: 0, lateFees: 0, openingBalances: 0, expenses: 0, skipped: [] };
  const now = Date.now();
  const earliest = await Booking.findOne({}).sort({ createdAt: 1 }).select("createdAt").lean();
  const openingDate = earliest ? new Date(earliest.createdAt) : new Date();
  // Same GST rate the live hook uses, so a backfilled late fee is taxed identically.
  const rate = Number((await settingsService.getSettings("pricing"))?.gstRate ?? 0) || 0;

  const post = async (desc) => {
    if (dryRun) return null;
    try {
      return await ledger.postEntry({ ...desc, postedByType: 'SYSTEM' });
    } catch (err) {
      stats.skipped.push(`${desc.eventType} ${desc.narration}: ${err.message}`);
      return null;
    }
  };

  const bookings = await Booking.find({ status: { $in: INVOICED_STATUSES } }).sort({ createdAt: 1 });

  for (const booking of bookings) {
    // E1 - the invoice itself.
    if (await post(map.bookingConfirmed(booking))) stats.bookingsInvoiced += 1;

    // E2 - only days that have actually elapsed. Recognising revenue for days
    // still in the future would overstate income.
    for (const day of map.recognitionSchedule(booking)) {
      if (new Date(day.date).getTime() > now) continue;
      if (await post(day)) stats.recognitionDays += 1;
    }

    // E5 - cash bookings are settled at the hub on handover.
    if (booking.paymentMethod === 'CASH' && booking.actualPickupAt) {
      const entry = await post(map.cashCollected({
        booking,
        amount: booking.totalAmount,
        collectedAt: booking.actualPickupAt,
        collectedBy: booking.pickupConfirmedBy,
      }));
      if (entry) stats.cashCollected += 1;
    }

    // E11 - late fee charged. This has to come before the deposit is settled:
    // settling nets the late fee off the deposit by crediting the rider's
    // receivable, so without the charge that created it the receivable goes
    // negative and the late fee income never appears at all.
    const lateFee = Number(booking.lateFee) || 0;
    if (lateFee > 0) {
      const entry = await post(map.lateFeeCharged({
        booking,
        amount: lateFee,
        gstRate: rate,
        date: booking.actualReturnAt || booking.updatedAt,
      }));
      if (entry) stats.lateFees += 1;
    }

    // E9b - deposit settled on return.
    //
    // This must be the same event the live hook posts, not a direct
    // cash-back entry: a deposit here is never handed straight over, it is
    // netted against any late fee and the remainder becomes a refund payable.
    // Using a different event would also mean a different idempotency key, so
    // a booking the live hook had already settled would have its deposit
    // released a second time.
    if (booking.depositStatus === 'REFUNDED' && booking.securityDeposit > 0) {
      const entry = await post(map.depositSettledOnReturn({
        booking,
        deposit: booking.securityDeposit,
        lateFee: Number(booking.lateFee) || 0,
        date: booking.actualReturnAt || booking.updatedAt,
      }));
      if (entry) stats.depositsRefunded += 1;
    }
  }

  // E3 - gateway captures.
  const payments = await Payment.find({ status: 'SUCCESS' }).populate('booking');
  for (const payment of payments) {
    if (!payment.booking) continue;
    if (!INVOICED_STATUSES.includes(payment.booking.status)) continue;
    if (await post(map.onlinePaymentCaptured(payment, payment.booking))) stats.paymentsCaptured += 1;
  }

  // E13 - refunds already paid out. Without these, every settled deposit would
  // leave a balance sitting in Refunds Payable that was in fact discharged.
  const refunds = await Refund.find({ status: 'COMPLETED' }).populate('booking');
  for (const refund of refunds) {
    if (!refund.booking?.user) continue;
    const entry = await post(map.refundPaidOut({
      refund,
      userId: refund.booking.user,
      from: 'RIDER_WALLET', // completing a refund credits the rider's wallet
      date: refund.processedAt || refund.updatedAt,
    }));
    if (entry) stats.refundsPaid += 1;
  }

  // E17 - operating expenses.
  for (const expense of await Expense.find({})) {
    if (await post(map.operatingExpensePaid(expense))) stats.expenses += 1;
  }

  // Opening balances for rider wallets.
  //
  // Wallets carry credit that predates the ledger and, in most cases, predates
  // any WalletTransaction record, so no sequence of events can reconstruct it.
  // A cut-over has to take the liability on directly, with the other side
  // parked in Opening Balance Equity for the accountant to reclassify.
  // Without this the wallet control check reports a difference for ever.
  const wallets = await Wallet.find({ balance: { $gt: 0 } });
  for (const w of wallets) {
    const posted = await JournalEntry.aggregate([
      { $unwind: '$lines' },
      { $match: { 'lines.accountKey': 'RIDER_WALLET', 'lines.subLedgerId': w.user } },
      { $group: { _id: null, cr: { $sum: '$lines.credit' }, dr: { $sum: '$lines.debit' } } },
    ]);
    const ledgerPaise = (posted[0]?.cr || 0) - (posted[0]?.dr || 0);
    const actualPaise = Math.round(Number(w.balance) * 100);
    const gap = actualPaise - ledgerPaise;
    if (gap === 0) continue;

    const entry = await post({
      eventType: 'OPENING_BALANCE',
      date: openingDate,
      narration: 'Opening balance — rider wallet credit carried in at cut-over',
      source: { model: 'Wallet', id: w._id, idempotencyKey: `OPENING:WALLET:${w._id}` },
      lines: gap > 0
        ? [
          { accountKey: 'OPENING_BALANCE_EQUITY', debit: gap },
          { accountKey: 'RIDER_WALLET', credit: gap, subLedgerId: w.user },
        ]
        : [
          { accountKey: 'RIDER_WALLET', debit: -gap, subLedgerId: w.user },
          { accountKey: 'OPENING_BALANCE_EQUITY', credit: -gap },
        ],
    });
    if (entry) stats.openingBalances += 1;
  }

  logger.info(`Ledger backfill: ${JSON.stringify(stats)}`);
  return stats;
};
