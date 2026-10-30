import { toPaise, splitEvenly } from './money.js';
import { BadRequestError } from '../../utils/errors.js';

// The event-to-journal mapping from the accounting brief, draft 1.
//
// Every function here is pure: it takes a domain record and returns an entry
// description for ledger.service.postEntry. Amounts arrive in rupees and leave
// in paise. Nothing here reads or writes the database, so the whole mapping can
// be checked against the accountant's table without a connection.
//
// Tax treatment on late fees, damage recovery and cancellation fees is still
// awaiting the accountant's answer (D5, D7). Rather than block those events, the
// GST rate is passed in by the caller from settings, so the rule is configurable
// and a change needs no code edit.
//
// Still not implemented, for want of data rather than a decision:
//   E18 swap station charges     - partner billing is not ingested anywhere
//   E21 challan paid for a rider - the app holds no challan record

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const line = (accountKey, side, paise, extra = {}) => ({
  accountKey,
  [side]: paise,
  ...extra,
});

const dr = (accountKey, paise, extra) => line(accountKey, 'debit', paise, extra);
const cr = (accountKey, paise, extra) => line(accountKey, 'credit', paise, extra);

const rider = (userId) => ({ subLedgerId: userId });

// Drops the lines that came out at zero -- a booking with no coupon should not
// carry an empty discount line into the ledger.
const used = (lines) => lines.filter((entry) => (entry.debit || 0) + (entry.credit || 0) > 0);

/** How many days of plan a booking was charged for. */
export const planDaysOf = (booking) => {
  if (booking.rentalType === 'HOURLY') return 1;
  const start = new Date(booking.startDate).getTime();
  const end = new Date(booking.endDate).getTime();
  const days = Math.ceil((end - start) / MS_PER_DAY);
  return Math.max(1, days);
};

/**
 * E1 - Booking confirmed, plan invoiced.
 * The rider owes the full amount. Plan value goes to deferred revenue; only the
 * service and platform fees are earned at this point. The deposit is a liability.
 */
export const bookingConfirmed = (booking) => {
  const swapFee = toPaise(booking.batteryPackageFee || 0);
  const swapLine = booking.batteryPackage === 'UNLIMITED'
    ? cr('DEFERRED_REVENUE_SWAP', swapFee)
    : cr('SWAP_INCOME', swapFee);

  return {
    eventType: 'E1_BOOKING_CONFIRMED',
    date: booking.confirmedAt || booking.updatedAt || new Date(),
    narration: `Booking ${booking.bookingId} invoiced`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E1:${booking._id}` },
    lines: used([
      dr('TRADE_RECEIVABLE_RIDERS', toPaise(booking.totalAmount), rider(booking.user)),
      dr('DISCOUNTS_ALLOWED', toPaise(booking.discountAmount || 0)),
      cr('DEFERRED_REVENUE_RENTAL', toPaise(booking.rentalBase)),
      swapLine,
      cr('SERVICE_FEE_INCOME', toPaise(booking.serviceFee || 0)),
      cr('PLATFORM_FEE_INCOME', toPaise(booking.platformFee || 0)),
      cr('GST_OUTPUT_PAYABLE', toPaise(booking.taxAmount || 0)),
      cr('RIDER_DEPOSITS', toPaise(booking.securityDeposit || 0), rider(booking.user)),
    ]),
  };
};

/**
 * E2 - Daily revenue recognition.
 * Returns one entry description per day of the plan. The last day carries the
 * rounding remainder, so both deferred balances close at exactly zero.
 */
export const recognitionSchedule = (booking) => {
  const days = planDaysOf(booking);
  const rentalParts = splitEvenly(toPaise(booking.rentalBase), days);
  const isUnlimited = booking.batteryPackage === 'UNLIMITED';
  const swapParts = isUnlimited
    ? splitEvenly(toPaise(booking.batteryPackageFee || 0), days)
    : new Array(days).fill(0);

  const start = new Date(booking.actualPickupAt || booking.startDate).getTime();

  return rentalParts.map((rentalPaise, index) => ({
    eventType: 'E2_REVENUE_RECOGNISED',
    date: new Date(start + index * MS_PER_DAY),
    narration: `Booking ${booking.bookingId} — day ${index + 1} of ${days} recognised`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E2:${booking._id}:${index}` },
    lines: used([
      dr('DEFERRED_REVENUE_RENTAL', rentalPaise),
      cr('RENTAL_INCOME', rentalPaise),
      dr('DEFERRED_REVENUE_SWAP', swapParts[index]),
      cr('SWAP_INCOME', swapParts[index]),
    ]),
  }));
};

/** E3 - Online payment captured. Moves the debt from the rider to the gateway. */
export const onlinePaymentCaptured = (payment, booking) => ({
  eventType: 'E3_PAYMENT_CAPTURED',
  date: payment.paidAt || payment.updatedAt || new Date(),
  narration: `Booking ${booking.bookingId} — ${payment.razorpayPaymentId || 'online payment'} captured`,
  source: { model: 'Payment', id: payment._id, idempotencyKey: `E3:${payment._id}` },
  lines: used([
    dr('GATEWAY_RECEIVABLE', toPaise(payment.amount)),
    cr('TRADE_RECEIVABLE_RIDERS', toPaise(payment.amount), rider(booking.user)),
  ]),
});

/**
 * E4 - Gateway settlement, net of fees.
 * Needs figures from a settlement statement: what was captured, what the
 * gateway kept, and what reached the bank.
 */
export const gatewaySettlement = ({ grossSettled, gatewayFee, gstOnFee, date, reference }) => {
  const gross = toPaise(grossSettled);
  const fee = toPaise(gatewayFee);
  const gst = toPaise(gstOnFee);
  const net = gross - fee - gst;
  if (net < 0) throw new BadRequestError('Settlement fees exceed the gross amount settled');

  return {
    eventType: 'E4_GATEWAY_SETTLEMENT',
    date: date || new Date(),
    narration: `Gateway settlement ${reference || ''}`.trim(),
    source: { model: 'GatewaySettlement', id: null, idempotencyKey: reference ? `E4:${reference}` : null },
    lines: used([
      dr('BANK_CURRENT', net),
      dr('GATEWAY_CHARGES', fee),
      dr('GST_INPUT_CREDIT', gst),
      cr('GATEWAY_RECEIVABLE', gross),
    ]),
  };
};

/** E5 - Cash collected at the hub on pickup. */
export const cashCollected = ({ booking, amount, collectedAt, collectedBy }) => ({
  eventType: 'E5_CASH_COLLECTED',
  date: collectedAt || new Date(),
  narration: `Booking ${booking.bookingId} — cash collected at hub`,
  source: { model: 'Booking', id: booking._id, idempotencyKey: `E5:${booking._id}` },
  postedBy: collectedBy || null,
  lines: used([
    dr('CASH_IN_HAND', toPaise(amount)),
    cr('TRADE_RECEIVABLE_RIDERS', toPaise(amount), rider(booking.user)),
  ]),
});

/** E6 - Hub cash deposited into the bank. */
export const cashHandover = ({ amount, date, reference }) => ({
  eventType: 'E6_CASH_HANDOVER',
  date: date || new Date(),
  narration: `Cash deposited to bank ${reference || ''}`.trim(),
  source: { model: 'CashHandover', id: null, idempotencyKey: reference ? `E6:${reference}` : null },
  lines: used([
    dr('BANK_CURRENT', toPaise(amount)),
    cr('CASH_IN_HAND', toPaise(amount)),
  ]),
});

/** E7 - Rider tops up their wallet. Held money, not income. */
export const walletTopUp = ({ userId, amount, transactionId, date }) => ({
  eventType: 'E7_WALLET_TOP_UP',
  date: date || new Date(),
  narration: 'Rider wallet top-up',
  source: { model: 'WalletTransaction', id: transactionId, idempotencyKey: `E7:${transactionId}` },
  lines: used([
    dr('GATEWAY_RECEIVABLE', toPaise(amount)),
    cr('RIDER_WALLET', toPaise(amount), rider(userId)),
  ]),
});

/** E8 - Booking settled out of existing wallet credit. No new money arrives. */
export const bookingPaidFromWallet = ({ booking, amount, transactionId, date }) => ({
  eventType: 'E8_PAID_FROM_WALLET',
  date: date || new Date(),
  narration: `Booking ${booking.bookingId} — settled from wallet`,
  source: { model: 'WalletTransaction', id: transactionId, idempotencyKey: `E8:${transactionId}` },
  lines: used([
    dr('RIDER_WALLET', toPaise(amount), rider(booking.user)),
    cr('TRADE_RECEIVABLE_RIDERS', toPaise(amount), rider(booking.user)),
  ]),
});

/** E9 - Security deposit released on a clean return. Never touched income. */
export const depositRefunded = ({ booking, amount, to = 'BANK_CURRENT', date }) => {
  if (!['BANK_CURRENT', 'RIDER_WALLET', 'CASH_IN_HAND'].includes(to)) {
    throw new BadRequestError('A deposit can only be refunded to bank, cash or wallet');
  }
  const paise = toPaise(amount);
  const creditExtra = to === 'RIDER_WALLET' ? rider(booking.user) : {};

  return {
    eventType: 'E9_DEPOSIT_REFUNDED',
    date: date || new Date(),
    narration: `Booking ${booking.bookingId} — security deposit released`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E9:${booking._id}` },
    lines: used([
      dr('RIDER_DEPOSITS', paise, rider(booking.user)),
      cr(to, paise, creditExtra),
    ]),
  };
};

/**
 * Splits a gross, tax-inclusive amount into net consideration and GST.
 * `gstRate` is a percentage; 0 means the charge is outside GST.
 */
const splitTax = (grossPaise, gstRate) => {
  const rate = Number(gstRate) || 0;
  if (rate <= 0) return { net: grossPaise, tax: 0 };
  const net = Math.round(grossPaise / (1 + rate / 100));
  return { net, tax: grossPaise - net };
};

/** E10 - Part of the deposit retained against damage found on return. */
export const depositAdjustedForDamage = ({ booking, amount, gstRate = 0, date, note }) => {
  const gross = toPaise(amount);
  const { net, tax } = splitTax(gross, gstRate);

  return {
    eventType: 'E10_DAMAGE_RECOVERED',
    date: date || new Date(),
    narration: `Booking ${booking.bookingId} — damage recovered from deposit${note ? ` (${note})` : ''}`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E10:${booking._id}` },
    lines: used([
      dr('RIDER_DEPOSITS', gross, rider(booking.user)),
      cr('DAMAGE_RECOVERY_INCOME', net),
      cr('GST_OUTPUT_PAYABLE', tax),
    ]),
  };
};

/** E11 - Late fee on an overdue return. */
export const lateFeeCharged = ({ booking, amount, gstRate = 0, date }) => {
  const gross = toPaise(amount);
  const { net, tax } = splitTax(gross, gstRate);

  return {
    eventType: 'E11_LATE_FEE',
    date: date || new Date(),
    narration: `Booking ${booking.bookingId} — late fee charged`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E11:${booking._id}` },
    lines: used([
      dr('TRADE_RECEIVABLE_RIDERS', gross, rider(booking.user)),
      cr('LATE_FEE_INCOME', net),
      cr('GST_OUTPUT_PAYABLE', tax),
    ]),
  };
};

/**
 * E12 - Cancellation fee retained.
 *
 * The invoice itself is undone by reversing the original E1 entry, not by a
 * bespoke credit note, so the original and its reversal both stay visible. This
 * entry covers only the fee the business keeps.
 */
export const cancellationFeeCharged = ({ booking, amount, gstRate = 0, date, fromDeposit = false }) => {
  const gross = toPaise(amount);
  const { net, tax } = splitTax(gross, gstRate);

  return {
    eventType: 'E12_CANCELLATION_FEE',
    date: date || new Date(),
    narration: `Booking ${booking.bookingId} — cancellation fee retained`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E12:${booking._id}` },
    lines: used([
      dr(fromDeposit ? 'RIDER_DEPOSITS' : 'TRADE_RECEIVABLE_RIDERS', gross, rider(booking.user)),
      cr('CANCELLATION_FEE_INCOME', net),
      cr('GST_OUTPUT_PAYABLE', tax),
    ]),
  };
};

/** E14 - Capital purchase of a vehicle, battery pack or station equipment. */
export const assetPurchased = ({ asset, costAccountKey, cost, inputGst = 0, paidFrom = 'BANK_CURRENT', date, reference }) => {
  const net = toPaise(cost);
  const gst = toPaise(inputGst);

  return {
    eventType: 'E14_ASSET_PURCHASED',
    date: date || new Date(),
    narration: `${asset?.label || 'Asset'} purchased${reference ? ` (${reference})` : ''}`,
    source: { model: 'FixedAsset', id: asset?._id || null, idempotencyKey: asset?._id ? `E14:${asset._id}` : null },
    lines: used([
      dr(costAccountKey, net, asset?.subLedgerId ? { subLedgerId: asset.subLedgerId } : {}),
      dr('GST_INPUT_CREDIT', gst),
      cr(paidFrom, net + gst),
    ]),
  };
};

/** E15 - Monthly depreciation charge for one asset. */
export const depreciationCharged = ({ asset, expenseAccountKey, accumulatedAccountKey, amount, periodKey }) => {
  const paise = toPaise(amount);
  const extra = asset?.subLedgerId ? { subLedgerId: asset.subLedgerId } : {};

  return {
    eventType: 'E15_DEPRECIATION',
    date: asset?.chargeDate || new Date(),
    narration: `Depreciation ${periodKey} — ${asset?.label || 'asset'}`,
    source: { model: 'FixedAsset', id: asset?._id || null, idempotencyKey: `E15:${asset?._id}:${periodKey}` },
    lines: used([
      dr(expenseAccountKey, paise, extra),
      cr(accumulatedAccountKey, paise, extra),
    ]),
  };
};

/** E19 - Asset lost, stolen or written off. */
export const assetWrittenOff = ({ asset, costAccountKey, accumulatedAccountKey, cost, accumulated, recoverable = 0, recoverableAccountKey = 'INSURANCE_CLAIMS_RECEIVABLE', date, reason }) => {
  const costPaise = toPaise(cost);
  const accumPaise = toPaise(accumulated);
  const claimPaise = toPaise(recoverable);
  const loss = costPaise - accumPaise - claimPaise;
  if (loss < 0) throw new BadRequestError('Recovery exceeds the asset written-down value');
  const extra = asset?.subLedgerId ? { subLedgerId: asset.subLedgerId } : {};

  return {
    eventType: 'E19_ASSET_WRITTEN_OFF',
    date: date || new Date(),
    narration: `${asset?.label || 'Asset'} written off${reason ? ` — ${reason}` : ''}`,
    source: { model: 'FixedAsset', id: asset?._id || null, idempotencyKey: `E19:${asset?._id}` },
    lines: used([
      dr(accumulatedAccountKey, accumPaise, extra),
      dr(recoverableAccountKey, claimPaise),
      dr('LOSS_ON_WRITE_OFF', loss),
      cr(costAccountKey, costPaise, extra),
    ]),
  };
};

/**
 * E9b - Deposit settled when a return is signed off.
 *
 * This is how returns actually work here: the deposit is not handed straight
 * back. Any late fee is netted off it and the remainder becomes a refund
 * payable, which is discharged later by E13. So the deposit liability closes
 * here while the cash leaves the business only when the refund is paid.
 */
export const depositSettledOnReturn = ({ booking, deposit, lateFee = 0, date }) => {
  const held = toPaise(deposit);
  const netted = Math.min(toPaise(lateFee), held);
  const refundable = held - netted;

  return {
    eventType: 'E9_DEPOSIT_SETTLED',
    date: date || new Date(),
    narration: `Booking ${booking.bookingId} — deposit settled on return`,
    source: { model: 'Booking', id: booking._id, idempotencyKey: `E9b:${booking._id}` },
    lines: used([
      dr('RIDER_DEPOSITS', held, rider(booking.user)),
      cr('REFUNDS_PAYABLE', refundable, rider(booking.user)),
      cr('TRADE_RECEIVABLE_RIDERS', netted, rider(booking.user)),
    ]),
  };
};

/** E13 - Approved refund actually disbursed. */
export const refundPaidOut = ({ refund, userId, from = 'BANK_CURRENT', date }) => {
  if (!['BANK_CURRENT', 'GATEWAY_RECEIVABLE', 'RIDER_WALLET', 'CASH_IN_HAND'].includes(from)) {
    throw new BadRequestError('A refund can only be paid from bank, cash, the gateway or rider wallet');
  }
  const paise = toPaise(refund.amount);

  return {
    eventType: 'E13_REFUND_PAID',
    date: date || refund.processedAt || new Date(),
    narration: `Refund ${refund.razorpayRefundId || refund._id} paid out`,
    source: { model: 'Refund', id: refund._id, idempotencyKey: `E13:${refund._id}` },
    lines: used([
      dr('REFUNDS_PAYABLE', paise, rider(userId)),
      cr(from, paise, from === 'RIDER_WALLET' ? rider(userId) : {}),
    ]),
  };
};

// Which expense account each existing expense category posts to. Categories the
// accountant may want split between capital and revenue are flagged in the
// brief; until an expense record carries that tag, everything here is revenue.
const EXPENSE_ACCOUNT_BY_CATEGORY = {
  CHARGING: 'ELECTRICITY_CHARGING',
  MAINTENANCE: 'MAINTENANCE_REPAIRS',
  REPAIR: 'MAINTENANCE_REPAIRS',
  SALARY: 'SALARIES',
  RENT: 'RENT',
  UTILITIES: 'ELECTRICITY_CHARGING',
  INSURANCE: 'INSURANCE_FLEET',
  MARKETING: 'MARKETING',
  TRANSPORT: 'TRANSPORT_LOGISTICS',
  OFFICE: 'OFFICE_ADMIN',
  OTHER: 'OFFICE_ADMIN',
};

const PAYMENT_MODE_ACCOUNT = {
  CASH: 'CASH_IN_HAND',
  UPI: 'BANK_CURRENT',
  BANK_TRANSFER: 'BANK_CURRENT',
  CARD: 'BANK_CURRENT',
  CHEQUE: 'BANK_CURRENT',
  OTHER: 'BANK_CURRENT',
};

/** E17 - Operating expense paid. */
export const operatingExpensePaid = (expense) => {
  const expenseAccount = EXPENSE_ACCOUNT_BY_CATEGORY[expense.category] || 'OFFICE_ADMIN';
  const paidFrom = PAYMENT_MODE_ACCOUNT[expense.paymentMode] || 'BANK_CURRENT';
  const paise = toPaise(expense.amount);

  return {
    eventType: 'E17_EXPENSE_PAID',
    date: expense.date,
    narration: `${expense.title} (${expense.category})`,
    source: { model: 'Expense', id: expense._id, idempotencyKey: `E17:${expense._id}` },
    postedBy: expense.createdBy || null,
    lines: used([
      dr(expenseAccount, paise),
      cr(paidFrom, paise),
    ]),
  };
};

/** E20 - Rider receivable judged unrecoverable. */
export const badDebtWriteOff = ({ userId, amount, date, note }) => ({
  eventType: 'E20_BAD_DEBT',
  date: date || new Date(),
  narration: `Bad debt written off${note ? ` — ${note}` : ''}`,
  source: { model: 'User', id: userId, idempotencyKey: null },
  lines: used([
    dr('BAD_DEBTS', toPaise(amount)),
    cr('TRADE_RECEIVABLE_RIDERS', toPaise(amount), rider(userId)),
  ]),
});

/** E22 - Money in the bank that cannot be matched. Must be cleared to zero. */
export const unidentifiedReceipt = ({ amount, date, reference }) => ({
  eventType: 'E22_UNMATCHED_RECEIPT',
  date: date || new Date(),
  narration: `Unmatched receipt ${reference || ''}`.trim(),
  source: { model: 'BankStatement', id: null, idempotencyKey: reference ? `E22:${reference}` : null },
  lines: used([
    dr('BANK_CURRENT', toPaise(amount)),
    cr('SUSPENSE', toPaise(amount)),
  ]),
});
