import JournalEntry from '../../models/JournalEntry.js';
import LedgerAccount from '../../models/LedgerAccount.js';
import Booking from '../../models/Booking.js';
import * as settingsService from '../settings/settings.service.js';
import * as ledger from './ledger.service.js';
import * as map from './eventMapping.js';
import logger from '../../utils/logger.js';

/**
 * Where business events meet the ledger.
 *
 * Everything in this file is deliberately non-blocking: a booking, payment or
 * refund must succeed even if its journal entry cannot be posted. A failed
 * posting is logged as an exception for the daily check to surface, never
 * raised into the operational flow. That is the whole contract of this module,
 * so every exported function is wrapped and none of them throws.
 */

let ledgerReady = null;

/** Cached: is the chart of accounts installed? Without it, posting is skipped. */
const isLedgerReady = async () => {
  if (ledgerReady !== null) return ledgerReady;
  try {
    ledgerReady = (await LedgerAccount.estimatedDocumentCount()) > 0;
  } catch {
    ledgerReady = false;
  }
  return ledgerReady;
};

export const resetLedgerReadyCache = () => { ledgerReady = null; };

const gstRate = async () => {
  try {
    const pricing = await settingsService.getSettings('pricing');
    return Number(pricing?.gstRate ?? 0) || 0;
  } catch {
    return 0;
  }
};

const post = async (desc, label) => {
  if (!desc) return null;
  try {
    return await ledger.postEntry({ ...desc, postedByType: 'SYSTEM' });
  } catch (error) {
    logger.error(`Ledger posting failed (${label || desc.eventType}): ${error.message}`);
    return null;
  }
};

const guard = (name, fn) => async (...args) => {
  try {
    if (!(await isLedgerReady())) return;
    await fn(...args);
  } catch (error) {
    logger.error(`Ledger hook ${name} failed: ${error.message}`);
  }
};

/**
 * Revenue recognition for days that have already elapsed. Posting the whole
 * plan upfront would recognise income for days the rider has not yet had, so
 * only instalments dated on or before now are posted. Idempotency keys make
 * this safe to run repeatedly.
 */
const recogniseElapsedDays = async (booking) => {
  const now = Date.now();
  for (const day of map.recognitionSchedule(booking)) {
    if (new Date(day.date).getTime() > now) break;
    await post(day, 'E2');
  }
};

export const onBookingStatusChange = guard('onBookingStatusChange', async (booking, oldStatus, newStatus) => {
  const rate = await gstRate();

  if (newStatus === 'CONFIRMED') {
    await post(map.bookingConfirmed(booking), 'E1');
    return;
  }

  if (newStatus === 'ACTIVE' && oldStatus === 'CONFIRMED') {
    // The invoice may not have been posted if the booking skipped CONFIRMED.
    await post(map.bookingConfirmed(booking), 'E1');

    if (booking.paymentMethod === 'CASH') {
      await post(map.cashCollected({
        booking,
        amount: booking.totalAmount,
        collectedAt: booking.actualPickupAt || new Date(),
        collectedBy: booking.pickupConfirmedBy,
      }), 'E5');
    }
    await recogniseElapsedDays(booking);
    return;
  }

  if (newStatus === 'COMPLETED') {
    await recogniseElapsedDays(booking);

    const lateFee = Number(booking.lateFee) || 0;
    if (lateFee > 0) {
      await post(map.lateFeeCharged({ booking, amount: lateFee, gstRate: rate, date: booking.actualReturnAt }), 'E11');
    }

    const deposit = Number(booking.securityDeposit) || 0;
    if (deposit > 0 && booking.depositStatus === 'REFUNDED') {
      await post(map.depositSettledOnReturn({
        booking, deposit, lateFee, date: booking.actualReturnAt,
      }), 'E9b');
    }
    return;
  }

  if (newStatus.includes('CANCELLED') || newStatus === 'RESERVATION_EXPIRED') {
    // Undo the invoice by reversing it, so both the original and the reversal
    // stay on the record. Nothing is edited away.
    const invoice = await JournalEntry.findOne({
      'source.idempotencyKey': `E1:${booking._id}`,
    });
    if (invoice) {
      const alreadyReversed = await JournalEntry.findOne({ reversalOf: invoice._id });
      if (!alreadyReversed) {
        try {
          await ledger.reverseEntry({
            entryId: invoice._id,
            reason: booking.cancellationReason || `Booking ${newStatus.toLowerCase()}`,
            date: booking.cancelledAt || new Date(),
            postedByType: 'SYSTEM',
          });
        } catch (error) {
          logger.error(`Ledger could not reverse invoice for ${booking.bookingId}: ${error.message}`);
        }
      }
    }

    // No cancellation fee is posted: `cancellationFee` exists only as a setting
    // and no booking is ever actually charged it, so there is nothing to record.
    // map.cancellationFeeCharged is ready for when that is built.
  }
});

export const onPaymentSucceeded = guard('onPaymentSucceeded', async (payment, booking) => {
  const target = booking || await Booking.findById(payment.booking);
  if (!target) return;
  await post(map.onlinePaymentCaptured(payment, target), 'E3');
});

export const onBookingPaidFromWallet = guard('onBookingPaidFromWallet', async ({ booking, amount, transactionId, date }) => {
  await post(map.bookingPaidFromWallet({ booking, amount, transactionId, date }), 'E8');
});

export const onExpenseRecorded = guard('onExpenseRecorded', async (expense) => {
  await post(map.operatingExpensePaid(expense), 'E17');
});

export const onWalletToppedUp = guard('onWalletToppedUp', async ({ userId, amount, transactionId, date }) => {
  await post(map.walletTopUp({ userId, amount, transactionId, date }), 'E7');
});

export const onRefundPaid = guard('onRefundPaid', async ({ refund, userId, from = 'RIDER_WALLET' }) => {
  await post(map.refundPaidOut({ refund, userId, from, date: refund.processedAt || new Date() }), 'E13');
});

/**
 * Daily recognition sweep for trips already under way. Covers the days that
 * pass between pickup and return, which no status change would otherwise
 * trigger a posting for.
 */
export const recogniseDueRevenue = async () => {
  if (!(await isLedgerReady())) return { recognised: 0, bookings: 0 };

  const live = await Booking.find({ status: { $in: ['ACTIVE', 'PENDING_RETURN', 'OVERDUE'] } });
  let recognised = 0;
  const before = await JournalEntry.countDocuments({ eventType: 'E2_REVENUE_RECOGNISED' });

  for (const booking of live) {
    try {
      await recogniseElapsedDays(booking);
    } catch (error) {
      logger.error(`Recognition sweep failed for ${booking.bookingId}: ${error.message}`);
    }
  }

  recognised = (await JournalEntry.countDocuments({ eventType: 'E2_REVENUE_RECOGNISED' })) - before;
  logger.info(`Revenue recognition sweep: ${recognised} new entries across ${live.length} live bookings`);
  return { recognised, bookings: live.length };
};
