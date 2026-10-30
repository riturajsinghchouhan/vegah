import mongoose from 'mongoose';
import JournalEntry from '../../models/JournalEntry.js';
import LedgerAccount from '../../models/LedgerAccount.js';
import LedgerSequence from '../../models/LedgerSequence.js';
import AccountingPeriod from '../../models/AccountingPeriod.js';
import { CHART_OF_ACCOUNTS, normalSideOf, statementOf } from './chartOfAccounts.js';
import * as eventMapping from './eventMapping.js';
import { toRupees, toPaise } from './money.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';

const TIMEZONE = 'Asia/Kolkata';

// The books are kept in Indian calendar days, so an entry's period is decided
// by the IST date, not by the server's timezone.
export const periodKeyOf = (date) => new Date(date)
  .toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  .slice(0, 7);

export const assertPeriodOpen = async (date, session = null) => {
  const periodKey = periodKeyOf(date);
  const period = await AccountingPeriod.findOne({ periodKey }).session(session);
  if (period?.status === 'CLOSED') {
    throw new ConflictError(`Accounting period ${periodKey} is closed. Post to an open period instead.`);
  }
  return periodKey;
};

const nextEntryNo = async (periodKey, session = null) => {
  const name = `journalEntry:${periodKey}`;
  const counter = await LedgerSequence.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { returnDocument: 'after', upsert: true, session, setDefaultsOnInsert: true }
  );
  return `JV-${periodKey.replace('-', '')}-${String(counter.value).padStart(5, '0')}`;
};

const loadAccountsByKey = async (keys, session = null) => {
  const unique = [...new Set(keys)];
  const accounts = await LedgerAccount.find({ key: { $in: unique } }).session(session);
  const byKey = new Map(accounts.map((account) => [account.key, account]));

  const missing = unique.filter((key) => !byKey.has(key));
  if (missing.length) {
    throw new NotFoundError(`Ledger accounts not found: ${missing.join(', ')}. Install the chart of accounts first.`);
  }
  const inactive = unique.filter((key) => byKey.get(key).active === false);
  if (inactive.length) {
    throw new BadRequestError(`Ledger accounts are inactive: ${inactive.join(', ')}`);
  }
  return byKey;
};

const normaliseLines = (lines, byKey) => {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new BadRequestError('A journal entry needs at least two lines');
  }

  return lines.map((line, index) => {
    const label = `Line ${index + 1}`;
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);

    if (!Number.isInteger(debit) || !Number.isInteger(credit)) {
      throw new BadRequestError(`${label}: amounts must be whole paise`);
    }
    if (debit < 0 || credit < 0) {
      throw new BadRequestError(`${label}: amounts cannot be negative`);
    }
    if ((debit > 0) === (credit > 0)) {
      throw new BadRequestError(`${label}: must carry either a debit or a credit, not both and not neither`);
    }

    const account = byKey.get(line.accountKey);
    if (account.subLedger && !line.subLedgerId) {
      throw new BadRequestError(
        `${label}: ${account.key} is a ${account.subLedger} control account and needs a subLedgerId`
      );
    }

    return {
      account: account._id,
      accountKey: account.key,
      accountCode: account.code,
      debit,
      credit,
      subLedgerType: account.subLedger || null,
      subLedgerId: line.subLedgerId || null,
      memo: line.memo || '',
    };
  });
};

/**
 * The only way anything enters the ledger. Rejects an entry that does not
 * balance, that names an unknown account, or that is dated into a closed
 * period. Replaying the same `source.idempotencyKey` returns the entry that
 * was already posted rather than posting a duplicate.
 */
export const postEntry = async ({
  date,
  eventType,
  narration,
  lines,
  source = {},
  postedBy = null,
  postedByType = 'SYSTEM',
  session = null,
}) => {
  if (!date) throw new BadRequestError('Posting date is required');
  if (!eventType) throw new BadRequestError('Event type is required');
  if (!narration) throw new BadRequestError('Narration is required');

  if (source.idempotencyKey) {
    const existing = await JournalEntry.findOne({ 'source.idempotencyKey': source.idempotencyKey }).session(session);
    if (existing) return existing;
  }

  const periodKey = await assertPeriodOpen(date, session);
  const byKey = await loadAccountsByKey(lines.map((line) => line.accountKey), session);
  const normalised = normaliseLines(lines, byKey);

  const totalDebit = normalised.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = normalised.reduce((sum, line) => sum + line.credit, 0);

  if (totalDebit !== totalCredit) {
    throw new BadRequestError(
      `Entry does not balance: debits ${toRupees(totalDebit)} against credits ${toRupees(totalCredit)}`
    );
  }
  if (totalDebit === 0) {
    throw new BadRequestError('Entry has no value');
  }

  const entryNo = await nextEntryNo(periodKey, session);

  const [entry] = await JournalEntry.create([{
    entryNo,
    date: new Date(date),
    periodKey,
    eventType,
    narration,
    lines: normalised,
    totalDebit,
    totalCredit,
    source: {
      model: source.model || null,
      id: source.id || null,
      idempotencyKey: source.idempotencyKey || null,
    },
    postedBy,
    postedByType,
  }], { session, ordered: true });

  return entry;
};

/**
 * Corrections never edit the original. This posts a mirror image of it, which
 * leaves both the mistake and the fix visible in the ledger.
 */
export const reverseEntry = async ({
  entryId,
  reason,
  date = new Date(),
  postedBy = null,
  postedByType = 'ADMIN',
  session = null,
}) => {
  if (!mongoose.Types.ObjectId.isValid(entryId)) throw new NotFoundError('Journal entry not found');
  if (!reason) throw new BadRequestError('A reversal needs a reason');

  const original = await JournalEntry.findById(entryId).session(session);
  if (!original) throw new NotFoundError('Journal entry not found');
  if (original.reversalOf) throw new BadRequestError('A reversing entry cannot itself be reversed');

  const alreadyReversed = await JournalEntry.findOne({ reversalOf: original._id }).session(session);
  if (alreadyReversed) {
    throw new ConflictError(`Entry ${original.entryNo} was already reversed by ${alreadyReversed.entryNo}`);
  }

  const periodKey = await assertPeriodOpen(date, session);
  const entryNo = await nextEntryNo(periodKey, session);

  const [reversal] = await JournalEntry.create([{
    entryNo,
    date: new Date(date),
    periodKey,
    eventType: `REVERSAL:${original.eventType}`,
    narration: `Reversal of ${original.entryNo} — ${reason}`,
    lines: original.lines.map((line) => ({
      account: line.account,
      accountKey: line.accountKey,
      accountCode: line.accountCode,
      debit: line.credit,
      credit: line.debit,
      subLedgerType: line.subLedgerType,
      subLedgerId: line.subLedgerId,
      memo: line.memo,
    })),
    totalDebit: original.totalCredit,
    totalCredit: original.totalDebit,
    reversalOf: original._id,
    reversalReason: reason,
    source: { model: original.source?.model || null, id: original.source?.id || null, idempotencyKey: null },
    postedBy,
    postedByType,
  }], { session, ordered: true });

  return reversal;
};

/**
 * The one sanctioned way to put a hand-written entry into the ledger. It goes
 * through exactly the same validation as an automatic posting, and is stamped
 * with the admin who approved it.
 */
export const postManualVoucher = async ({ date, narration, lines, adminId }) => {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new BadRequestError('A journal voucher needs at least two lines');
  }
  if (!adminId) throw new BadRequestError('A journal voucher must be approved by an admin');

  // Amounts arrive from the UI in rupees; the ledger stores paise.
  const converted = lines.map((line) => ({
    accountKey: String(line.accountKey || '').toUpperCase().trim(),
    debit: line.debit ? toPaise(line.debit) : 0,
    credit: line.credit ? toPaise(line.credit) : 0,
    subLedgerId: line.subLedgerId || null,
    memo: line.memo || '',
  }));

  return postEntry({
    date: date || new Date(),
    eventType: 'MANUAL_VOUCHER',
    narration: String(narration || '').trim() || 'Manual journal voucher',
    lines: converted,
    postedBy: adminId,
    postedByType: 'ADMIN',
  });
};

/** Current balance of one account, in paise, signed to its normal side. */
export const getAccountBalance = async (accountKey) => {
  const account = await LedgerAccount.findOne({ key: accountKey });
  if (!account) throw new NotFoundError(`Ledger account ${accountKey} not found`);

  const [row] = await JournalEntry.aggregate([
    { $unwind: '$lines' },
    { $match: { 'lines.account': account._id } },
    { $group: { _id: null, debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);
  const debit = row?.debit || 0;
  const credit = row?.credit || 0;
  return account.normalSide === 'DEBIT' ? debit - credit : credit - debit;
};

/**
 * E6 - hub cash banked.
 *
 * Most riders pay cash at the hub, so this is the main route by which money
 * reaches the bank. Refuses to bank more than the ledger says is in hand,
 * which is what catches a miscount or a missing collection entry.
 */
export const recordCashHandover = async ({ amount, date, reference, adminId }) => {
  const paise = toPaise(amount);
  if (paise <= 0) throw new BadRequestError('Handover amount must be positive');

  const inHand = await getAccountBalance('CASH_IN_HAND');
  if (paise > inHand) {
    throw new BadRequestError(
      `Cannot bank ₹${toRupees(paise)}: only ₹${toRupees(inHand)} is recorded as cash in hand`
    );
  }

  return postEntry({
    ...eventMapping.cashHandover({ amount, date, reference }),
    postedBy: adminId || null,
    postedByType: 'ADMIN',
  });
};

/**
 * E4 - Razorpay settlement.
 *
 * Online payments sit in the gateway receivable until Razorpay remits them,
 * net of its commission and the GST on it. Recording the settlement is what
 * turns that receivable into real bank money and books the gateway fee as an
 * expense. Figures come from the Razorpay settlement report.
 */
export const recordGatewaySettlement = async ({ grossSettled, gatewayFee = 0, gstOnFee = 0, date, reference, adminId }) => {
  const gross = toPaise(grossSettled);
  const fee = toPaise(gatewayFee);
  const gst = toPaise(gstOnFee);

  if (gross <= 0) throw new BadRequestError('Settlement amount must be positive');
  if (fee + gst > gross) throw new BadRequestError('Fees cannot exceed the amount settled');

  const outstanding = await getAccountBalance('GATEWAY_RECEIVABLE');
  if (gross > outstanding) {
    throw new BadRequestError(
      `Cannot settle ₹${toRupees(gross)}: only ₹${toRupees(outstanding)} is awaiting settlement from the gateway`
    );
  }

  return postEntry({
    ...eventMapping.gatewaySettlement({ grossSettled, gatewayFee, gstOnFee, date, reference }),
    postedBy: adminId || null,
    postedByType: 'ADMIN',
  });
};

export const listPeriods = async () => {
  const periods = await AccountingPeriod.find({}).sort({ periodKey: -1 }).lean();
  const earliest = await JournalEntry.findOne({}).sort({ date: 1 }).select('periodKey').lean();
  const known = new Set(periods.map((p) => p.periodKey));

  // A month with entries but no row is open by default; show it as such.
  const rows = [...periods];
  if (earliest && !known.has(earliest.periodKey)) {
    rows.push({ periodKey: earliest.periodKey, status: 'OPEN' });
  }
  return rows.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
};

export const closePeriod = async (periodKey, adminId) => {
  if (!/^\d{4}-\d{2}$/.test(String(periodKey || ''))) {
    throw new BadRequestError('Period must be in YYYY-MM form');
  }
  const current = periodKeyOf(new Date());
  if (periodKey > current) throw new BadRequestError('A future period cannot be closed');

  return AccountingPeriod.findOneAndUpdate(
    { periodKey },
    { status: 'CLOSED', closedBy: adminId || null, closedAt: new Date(), reopenedBy: null, reopenedAt: null },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const reopenPeriod = async (periodKey, adminId, reason) => {
  if (!reason) throw new BadRequestError('Reopening a closed period needs a reason');
  const period = await AccountingPeriod.findOne({ periodKey });
  if (!period || period.status !== 'CLOSED') throw new BadRequestError(`Period ${periodKey} is not closed`);

  period.status = 'OPEN';
  period.reopenedBy = adminId || null;
  period.reopenedAt = new Date();
  period.reopenReason = String(reason).trim();
  await period.save();
  return period;
};

export const getTrialBalance = async ({ from = null, to = new Date() } = {}) => {
  const match = { date: { $lte: new Date(to) } };
  if (from) match.date.$gte = new Date(from);

  const rows = await JournalEntry.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.account',
        debit: { $sum: '$lines.debit' },
        credit: { $sum: '$lines.credit' },
      },
    },
    { $lookup: { from: 'ledgeraccounts', localField: '_id', foreignField: '_id', as: 'account' } },
    { $unwind: '$account' },
    { $sort: { 'account.code': 1 } },
  ]);

  const accounts = rows.map((row) => {
    const signed = row.account.normalSide === 'DEBIT' ? row.debit - row.credit : row.credit - row.debit;
    return {
      code: row.account.code,
      key: row.account.key,
      name: row.account.name,
      type: row.account.type,
      statement: row.account.statement,
      normalSide: row.account.normalSide,
      debit: toRupees(row.debit),
      credit: toRupees(row.credit),
      balance: toRupees(signed),
    };
  });

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);

  return {
    range: { from, to },
    accounts,
    totals: {
      debit: toRupees(totalDebit),
      credit: toRupees(totalCredit),
      difference: toRupees(totalDebit - totalCredit),
      balanced: totalDebit === totalCredit,
    },
  };
};

/**
 * Writes the chart of accounts into the database, adding what is missing and
 * refreshing names on what is already there. Never deletes an account, because
 * an account with history cannot be removed without orphaning entries.
 *
 * This is a deliberate, opt-in operation. It is not registered with the seed
 * runner, so `npm run seed` will not touch the ledger.
 */
export const installChartOfAccounts = async () => {
  const results = { created: 0, updated: 0 };

  for (const definition of CHART_OF_ACCOUNTS) {
    const payload = {
      code: definition.code,
      name: definition.name,
      type: definition.type,
      normalSide: normalSideOf(definition),
      statement: statementOf(definition),
      isContra: Boolean(definition.isContra),
      isCash: Boolean(definition.isCash),
      subLedger: definition.subLedger || null,
    };

    const existing = await LedgerAccount.findOne({ key: definition.key });
    if (existing) {
      await LedgerAccount.updateOne({ _id: existing._id }, payload);
      results.updated += 1;
    } else {
      await LedgerAccount.create({ key: definition.key, active: true, ...payload });
      results.created += 1;
    }
  }

  return results;
};
