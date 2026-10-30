import JournalEntry from '../../models/JournalEntry.js';
import LedgerAccount from '../../models/LedgerAccount.js';
import Wallet from '../../models/Wallet.js';
import Booking from '../../models/Booking.js';
import Refund from '../../models/Refund.js';
import { toRupees } from './money.js';
import { BadRequestError } from '../../utils/errors.js';

const TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

const parseDate = (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00${IST_OFFSET}`) : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new BadRequestError(`Invalid ${field}`);
  return date;
};

const startOfCurrentMonthIST = () => {
  const [year, month] = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }).split('-');
  return new Date(`${year}-${month}-01T00:00:00${IST_OFFSET}`);
};

const resolveRange = (query = {}) => {
  const from = parseDate(query.from, 'from date') || startOfCurrentMonthIST();
  const to = parseDate(query.to, 'to date') || new Date();
  if (from > to) throw new BadRequestError('From date must be before to date');
  return { from, to };
};

/**
 * Signed movement per account over a date window.
 *
 * Debits and credits are returned raw and the caller decides the sign, which is
 * what keeps contra accounts honest: accumulated depreciation carries a credit
 * balance, so summing (debit - credit) across asset accounts reduces the asset
 * total automatically, with no special case for it.
 */
const movementsByAccount = async ({ from = null, to = new Date() } = {}) => {
  const match = { date: { $lte: new Date(to) } };
  if (from) match.date.$gte = new Date(from);

  const rows = await JournalEntry.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $group: { _id: '$lines.account', debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);

  const accounts = await LedgerAccount.find({}).lean();
  const movement = new Map(rows.map((row) => [String(row._id), row]));

  return accounts.map((account) => {
    const row = movement.get(String(account._id)) || { debit: 0, credit: 0 };
    return {
      key: account.key,
      code: account.code,
      name: account.name,
      type: account.type,
      isCash: account.isCash,
      isContra: account.isContra,
      debit: row.debit,
      credit: row.credit,
      debitLessCredit: row.debit - row.credit,
      creditLessDebit: row.credit - row.debit,
    };
  }).sort((a, b) => a.code.localeCompare(b.code));
};

const presentGroup = (rows, signField) => rows
  .filter((row) => row.debit !== 0 || row.credit !== 0)
  .map((row) => ({
    code: row.code,
    key: row.key,
    name: row.name,
    amount: toRupees(row[signField]),
  }));

const sumOf = (rows, signField) => rows.reduce((total, row) => total + row[signField], 0);

/** Income less expenses, in paise, for everything up to `to`. */
const surplusUpTo = (all) => {
  const income = sumOf(all.filter((r) => r.type === 'INCOME'), 'creditLessDebit');
  const expense = sumOf(all.filter((r) => r.type === 'EXPENSE'), 'debitLessCredit');
  return income - expense;
};

export const getBalanceSheet = async (query = {}) => {
  const asOf = parseDate(query.asOf, 'as-of date') || new Date();
  const all = await movementsByAccount({ to: asOf });

  const assets = all.filter((row) => row.type === 'ASSET');
  const liabilities = all.filter((row) => row.type === 'LIABILITY');
  const equity = all.filter((row) => row.type === 'EQUITY');

  const totalAssets = sumOf(assets, 'debitLessCredit');
  const totalLiabilities = sumOf(liabilities, 'creditLessDebit');
  const equityPosted = sumOf(equity, 'creditLessDebit');
  const surplus = surplusUpTo(all);
  const totalEquity = equityPosted + surplus;

  const difference = totalAssets - (totalLiabilities + totalEquity);

  return {
    asOf,
    assets: presentGroup(assets, 'debitLessCredit'),
    liabilities: presentGroup(liabilities, 'creditLessDebit'),
    equity: [
      ...presentGroup(equity, 'creditLessDebit'),
      { code: '3030', key: 'CURRENT_SURPLUS', name: 'Surplus / Deficit for the period', amount: toRupees(surplus) },
    ],
    totals: {
      assets: toRupees(totalAssets),
      liabilities: toRupees(totalLiabilities),
      equity: toRupees(totalEquity),
      liabilitiesAndEquity: toRupees(totalLiabilities + totalEquity),
      difference: toRupees(difference),
      balanced: difference === 0,
    },
  };
};

export const getProfitAndLoss = async (query = {}) => {
  const { from, to } = resolveRange(query);
  const all = await movementsByAccount({ from, to });

  const income = all.filter((row) => row.type === 'INCOME');
  const directCosts = all.filter((row) => row.type === 'EXPENSE' && row.code.startsWith('5'));
  const operating = all.filter((row) => row.type === 'EXPENSE' && !row.code.startsWith('5'));

  const totalIncome = sumOf(income, 'creditLessDebit');
  const totalDirect = sumOf(directCosts, 'debitLessCredit');
  const totalOperating = sumOf(operating, 'debitLessCredit');
  const grossProfit = totalIncome - totalDirect;
  const netProfit = grossProfit - totalOperating;

  return {
    range: { from, to },
    income: presentGroup(income, 'creditLessDebit'),
    directCosts: presentGroup(directCosts, 'debitLessCredit'),
    operatingExpenses: presentGroup(operating, 'debitLessCredit'),
    totals: {
      income: toRupees(totalIncome),
      directCosts: toRupees(totalDirect),
      grossProfit: toRupees(grossProfit),
      operatingExpenses: toRupees(totalOperating),
      netProfit: toRupees(netProfit),
    },
  };
};

/**
 * The cash view. Only movements on accounts flagged isCash appear, classified
 * by the other side of each entry, so the opening balance plus receipts less
 * payments always explains the closing balance.
 */
export const getReceiptsAndPayments = async (query = {}) => {
  const { from, to } = resolveRange(query);

  const cashAccounts = await LedgerAccount.find({ isCash: true }).lean();
  const cashIds = cashAccounts.map((account) => account._id);
  if (!cashIds.length) {
    return {
      range: { from, to },
      opening: 0, receipts: [], payments: [],
      totals: { opening: 0, receipts: 0, payments: 0, closing: 0, movement: 0, reconciles: true },
    };
  }

  const openingRows = await JournalEntry.aggregate([
    { $match: { date: { $lt: from } } },
    { $unwind: '$lines' },
    { $match: { 'lines.account': { $in: cashIds } } },
    { $group: { _id: null, debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);
  const opening = (openingRows[0]?.debit || 0) - (openingRows[0]?.credit || 0);

  const classified = await JournalEntry.aggregate([
    { $match: { date: { $gte: from, $lte: to }, 'lines.account': { $in: cashIds } } },
    {
      $project: {
        other: { $filter: { input: '$lines', as: 'l', cond: { $not: [{ $in: ['$$l.account', cashIds] }] } } },
      },
    },
    { $unwind: '$other' },
    {
      $group: {
        _id: '$other.accountKey',
        accountCode: { $first: '$other.accountCode' },
        received: { $sum: '$other.credit' },
        paid: { $sum: '$other.debit' },
      },
    },
    { $sort: { accountCode: 1 } },
  ]);

  const names = new Map((await LedgerAccount.find({}).lean()).map((a) => [a.key, a.name]));

  const receipts = classified
    .filter((row) => row.received > 0)
    .map((row) => ({ code: row.accountCode, key: row._id, name: names.get(row._id) || row._id, amount: toRupees(row.received) }));
  const payments = classified
    .filter((row) => row.paid > 0)
    .map((row) => ({ code: row.accountCode, key: row._id, name: names.get(row._id) || row._id, amount: toRupees(row.paid) }));

  const movementRows = await JournalEntry.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $unwind: '$lines' },
    { $match: { 'lines.account': { $in: cashIds } } },
    { $group: { _id: null, debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);
  const movement = (movementRows[0]?.debit || 0) - (movementRows[0]?.credit || 0);

  const totalReceipts = classified.reduce((sum, row) => sum + row.received, 0);
  const totalPayments = classified.reduce((sum, row) => sum + row.paid, 0);

  return {
    range: { from, to },
    cashAccounts: cashAccounts.map((a) => ({ code: a.code, name: a.name })),
    receipts,
    payments,
    totals: {
      opening: toRupees(opening),
      receipts: toRupees(totalReceipts),
      payments: toRupees(totalPayments),
      movement: toRupees(movement),
      closing: toRupees(opening + movement),
      // The classification must explain the actual cash movement exactly.
      reconciles: totalReceipts - totalPayments === movement,
    },
  };
};

export const listAccounts = async () => {
  const accounts = await LedgerAccount.find({}).sort({ code: 1 }).lean();
  return accounts.map((a) => ({
    code: a.code, key: a.key, name: a.name, type: a.type,
    normalSide: a.normalSide, statement: a.statement,
    isContra: a.isContra, isCash: a.isCash, subLedger: a.subLedger, active: a.active,
  }));
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const toCsv = (rows) => rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

/** Builds one of the reports as CSV, for export to Excel. */
export const buildCsv = async (report, query = {}) => {
  const stamp = new Date().toISOString().slice(0, 10);

  if (report === 'balance-sheet') {
    const d = await getBalanceSheet(query);
    const rows = [['Section', 'Code', 'Account', 'Amount']];
    d.assets.forEach((r) => rows.push(['Assets', r.code, r.name, r.amount]));
    rows.push(['', '', 'Total assets', d.totals.assets]);
    d.liabilities.forEach((r) => rows.push(['Liabilities', r.code, r.name, r.amount]));
    d.equity.forEach((r) => rows.push(['Equity', r.code, r.name, r.amount]));
    rows.push(['', '', 'Total liabilities and equity', d.totals.liabilitiesAndEquity]);
    return { filename: `balance-sheet-${stamp}.csv`, csv: toCsv(rows) };
  }

  if (report === 'profit-loss') {
    const d = await getProfitAndLoss(query);
    const rows = [['Section', 'Code', 'Account', 'Amount']];
    d.income.forEach((r) => rows.push(['Income', r.code, r.name, r.amount]));
    rows.push(['', '', 'Total income', d.totals.income]);
    d.directCosts.forEach((r) => rows.push(['Direct costs', r.code, r.name, r.amount]));
    rows.push(['', '', 'Gross profit', d.totals.grossProfit]);
    d.operatingExpenses.forEach((r) => rows.push(['Operating expenses', r.code, r.name, r.amount]));
    rows.push(['', '', 'Net profit', d.totals.netProfit]);
    return { filename: `profit-loss-${stamp}.csv`, csv: toCsv(rows) };
  }

  if (report === 'receipts-payments') {
    const d = await getReceiptsAndPayments(query);
    const rows = [['Section', 'Code', 'Account', 'Amount']];
    rows.push(['', '', 'Opening balance', d.totals.opening]);
    d.receipts.forEach((r) => rows.push(['Receipts', r.code, r.name, r.amount]));
    rows.push(['', '', 'Total receipts', d.totals.receipts]);
    d.payments.forEach((r) => rows.push(['Payments', r.code, r.name, r.amount]));
    rows.push(['', '', 'Total payments', d.totals.payments]);
    rows.push(['', '', 'Closing balance', d.totals.closing]);
    return { filename: `receipts-payments-${stamp}.csv`, csv: toCsv(rows) };
  }

  if (report === 'trial-balance') {
    const { getTrialBalance } = await import('./ledger.service.js');
    const d = await getTrialBalance(query);
    const rows = [['Code', 'Account', 'Type', 'Debit', 'Credit', 'Balance']];
    d.accounts.forEach((r) => rows.push([r.code, r.name, r.type, r.debit, r.credit, r.balance]));
    rows.push(['', 'Totals', '', d.totals.debit, d.totals.credit, '']);
    return { filename: `trial-balance-${stamp}.csv`, csv: toCsv(rows) };
  }

  if (report === 'journal') {
    const d = await listJournalEntries({ ...query, limit: 100 });
    const rows = [['Entry', 'Date', 'Period', 'Event', 'Narration', 'Code', 'Account', 'Debit', 'Credit']];
    for (const e of d.entries) {
      for (const l of e.lines) {
        rows.push([
          e.entryNo, new Date(e.date).toISOString().slice(0, 10), e.periodKey, e.eventType,
          e.narration, l.accountCode, l.accountKey, l.debit || '', l.credit || '',
        ]);
      }
    }
    return { filename: `journal-${stamp}.csv`, csv: toCsv(rows) };
  }

  throw new BadRequestError(`Unknown report "${report}"`);
};

export const listJournalEntries = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (query.from || query.to) {
    const { from, to } = resolveRange(query);
    filter.date = { $gte: from, $lte: to };
  }
  if (query.eventType) filter.eventType = query.eventType;
  if (query.periodKey) filter.periodKey = query.periodKey;

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).sort({ date: -1, entryNo: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    JournalEntry.countDocuments(filter),
  ]);

  const reversedIds = new Set(
    (await JournalEntry.find({ reversalOf: { $in: entries.map((e) => e._id) } }, 'reversalOf').lean())
      .map((e) => String(e.reversalOf))
  );

  return {
    entries: entries.map((entry) => ({
      _id: entry._id,
      entryNo: entry.entryNo,
      date: entry.date,
      periodKey: entry.periodKey,
      eventType: entry.eventType,
      narration: entry.narration,
      totalDebit: toRupees(entry.totalDebit),
      totalCredit: toRupees(entry.totalCredit),
      isReversal: Boolean(entry.reversalOf),
      isReversed: reversedIds.has(String(entry._id)),
      postedByType: entry.postedByType,
      lines: entry.lines.map((line) => ({
        accountCode: line.accountCode,
        accountKey: line.accountKey,
        debit: toRupees(line.debit),
        credit: toRupees(line.credit),
        memo: line.memo,
      })),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

/**
 * The daily balance check from the brief. Returns either "balanced" or only the
 * exceptions, each with a reason.
 */
export const getDailyCheck = async (query = {}) => {
  const asOf = parseDate(query.asOf, 'as-of date') || new Date();
  const exceptions = [];

  const all = await movementsByAccount({ to: asOf });
  const totalDebit = sumOf(all, 'debit');
  const totalCredit = sumOf(all, 'credit');
  if (totalDebit !== totalCredit) {
    exceptions.push({
      check: 'Double entry',
      reason: `Debits ${toRupees(totalDebit)} do not equal credits ${toRupees(totalCredit)}`,
    });
  }

  const sheet = await getBalanceSheet({ asOf });
  if (!sheet.totals.balanced) {
    exceptions.push({
      check: 'Accounting equation',
      reason: `Assets differ from liabilities plus equity by ₹${sheet.totals.difference}`,
    });
  }

  const suspense = all.find((row) => row.key === 'SUSPENSE');
  if (suspense && suspense.debitLessCredit !== 0) {
    exceptions.push({
      check: 'Suspense account',
      reason: `Suspense holds ₹${toRupees(suspense.debitLessCredit)} and must be cleared to zero`,
    });
  }

  const cash = await getReceiptsAndPayments({ from: new Date(asOf).toISOString().slice(0, 10), to: asOf });
  if (!cash.totals.reconciles) {
    exceptions.push({
      check: 'Cash movement',
      reason: 'Classified receipts less payments do not explain the change in cash and bank',
    });
  }

  // Control accounts against the operational records they are meant to mirror.
  // This is the check that actually catches drift, because it compares the
  // ledger against a different source of truth rather than against itself.
  const balanceOf = (key) => {
    const row = all.find((r) => r.key === key);
    return row ? row.creditLessDebit : 0;
  };

  const [walletRows, depositRows, refundRows] = await Promise.all([
    Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    // The liability arises when the booking is invoiced, not when the cash is
    // taken at the hub, and it closes when the deposit is refunded. So the
    // comparison has to span every invoiced booking whose deposit is still
    // outstanding, not only the ones already marked COLLECTED.
    Booking.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMED', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE', 'COMPLETED'] },
          depositStatus: { $ne: 'REFUNDED' },
        },
      },
      { $group: { _id: null, total: { $sum: '$securityDeposit' } } },
    ]),
    Refund.aggregate([
      { $match: { status: { $in: ['PENDING', 'PROCESSING'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const subLedgers = [
    { check: 'Rider wallet control', key: 'RIDER_WALLET', actual: walletRows[0]?.total || 0, source: 'wallet balances' },
    { check: 'Deposit control', key: 'RIDER_DEPOSITS', actual: depositRows[0]?.total || 0, source: 'deposits held on live bookings' },
    { check: 'Refunds payable control', key: 'REFUNDS_PAYABLE', actual: refundRows[0]?.total || 0, source: 'unpaid refunds' },
  ];

  for (const sub of subLedgers) {
    const ledgerPaise = balanceOf(sub.key);
    const actualPaise = Math.round(Number(sub.actual) * 100);
    if (ledgerPaise !== actualPaise) {
      exceptions.push({
        check: sub.check,
        reason: `Ledger shows ₹${toRupees(ledgerPaise)} but ${sub.source} total ₹${sub.actual} — a difference of ₹${toRupees(ledgerPaise - actualPaise)}`,
      });
    }
  }

  return {
    asOf,
    status: exceptions.length ? 'EXCEPTIONS' : 'BALANCED',
    exceptions,
    checked: [
      'Double entry',
      'Accounting equation',
      'Suspense account',
      'Cash movement',
      ...subLedgers.map((s) => s.check),
    ],
  };
};
