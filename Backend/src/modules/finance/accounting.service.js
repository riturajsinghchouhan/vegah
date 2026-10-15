import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import Expense, { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_MODES } from '../../models/Expense.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

// Admins enter expenses against Indian calendar days, so day/month boundaries
// and chart buckets are all worked out in IST rather than server time.
const TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

// Earning is read off bookings rather than Payment rows: cash is collected at
// the hub during pickup and its Payment row is never moved past PENDING, so
// counting payments alone reported zero for a fleet that is mostly cash.
//  - prepaid (ONLINE / WALLET) bookings have been paid once CONFIRMED
//  - CASH bookings are only paid once the scooty has been picked up
const PREPAID_EARNING_STATUSES = ['CONFIRMED', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE', 'COMPLETED'];
const CASH_EARNING_STATUSES = ['ACTIVE', 'PENDING_RETURN', 'OVERDUE', 'COMPLETED'];

const earningBookingsMatch = {
  $or: [
    { paymentMethod: 'CASH', status: { $in: CASH_EARNING_STATUSES } },
    { paymentMethod: { $ne: 'CASH' }, status: { $in: PREPAID_EARNING_STATUSES } },
  ],
};

// The security deposit is refundable, so it is held money, not earning.
const rentalAmountExpr = {
  $max: [0, { $subtract: [{ $ifNull: ['$totalAmount', 0] }, { $ifNull: ['$securityDeposit', 0] }] }],
};

// A bare "YYYY-MM-DD" from a date input means midnight in IST, not UTC.
const parseDate = (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00${IST_OFFSET}`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`Invalid ${field}`);
  }
  return date;
};

const startOfCurrentMonthIST = () => {
  const [year, month] = new Date()
    .toLocaleDateString('en-CA', { timeZone: TIMEZONE })
    .split('-');
  return new Date(`${year}-${month}-01T00:00:00${IST_OFFSET}`);
};

const resolveRange = (query = {}) => {
  const from = parseDate(query.from, 'from date') || startOfCurrentMonthIST();
  const to = parseDate(query.to, 'to date') || new Date();
  if (from > to) throw new BadRequestError('From date must be before to date');
  return { from, to };
};

export const getAccountingSummary = async (query = {}) => {
  const { from, to } = resolveRange(query);
  const groupBy = query.groupBy === 'month' ? 'month' : 'day';
  const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const bucketOf = (dateField) => ({ $dateToString: { format, date: dateField, timezone: TIMEZONE } });

  // Bookings are dated by when they were made, matching the admin dashboard.
  const bookingMatch = { ...earningBookingsMatch, createdAt: { $gte: from, $lte: to } };
  const expenseMatch = { date: { $gte: from, $lte: to } };

  const [[earningRow], [expenseRow], byCategory, earningTrend, expenseTrend] = await Promise.all([
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: null,
          earning: { $sum: rentalAmountExpr },
          deposits: { $sum: { $ifNull: ['$securityDeposit', 0] } },
          cashEarning: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, rentalAmountExpr, 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: bucketOf('$createdAt'), total: { $sum: rentalAmountExpr } } },
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: bucketOf('$date'), total: { $sum: '$amount' } } },
    ]),
  ]);

  const earning = earningRow?.earning || 0;
  const totalExpense = expenseRow?.total || 0;

  const trendMap = new Map();
  const bucket = (key) => {
    if (!trendMap.has(key)) trendMap.set(key, { period: key, earning: 0, expense: 0 });
    return trendMap.get(key);
  };
  earningTrend.forEach((row) => { bucket(row._id).earning += row.total; });
  expenseTrend.forEach((row) => { bucket(row._id).expense += row.total; });

  const trend = [...trendMap.values()]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((row) => ({ ...row, net: row.earning - row.expense }));

  return {
    range: { from, to, groupBy },
    summary: {
      earning,
      cashEarning: earningRow?.cashEarning || 0,
      onlineEarning: earning - (earningRow?.cashEarning || 0),
      bookingCount: earningRow?.count || 0,
      depositHeld: earningRow?.deposits || 0,
      totalExpense,
      expenseCount: expenseRow?.count || 0,
      netEarning: earning - totalExpense,
    },
    expenseByCategory: byCategory.map((row) => ({
      category: row._id,
      total: row.total,
      count: row.count,
    })),
    trend,
  };
};

export const listExpenses = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (query.from || query.to) {
    const { from, to } = resolveRange(query);
    filter.date = { $gte: from, $lte: to };
  }
  if (query.category && EXPENSE_CATEGORIES.includes(query.category)) {
    filter.category = query.category;
  }
  if (query.search) {
    const escaped = String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escaped) filter.$or = [{ title: new RegExp(escaped, 'i') }, { notes: new RegExp(escaped, 'i') }];
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  return {
    expenses,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const buildExpensePayload = (body = {}, { partial = false } = {}) => {
  const payload = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) throw new BadRequestError('Title is required');
    payload.title = title;
  }

  if (!partial || body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestError('Amount must be a positive number');
    }
    payload.amount = Math.round(amount * 100) / 100;
  }

  if (!partial || body.date !== undefined) {
    const date = parseDate(body.date, 'date');
    if (!date) throw new BadRequestError('Date is required');
    payload.date = date;
  }

  if (body.category !== undefined) {
    if (!EXPENSE_CATEGORIES.includes(body.category)) throw new BadRequestError('Invalid category');
    payload.category = body.category;
  }

  if (body.paymentMode !== undefined) {
    if (!EXPENSE_PAYMENT_MODES.includes(body.paymentMode)) throw new BadRequestError('Invalid payment mode');
    payload.paymentMode = body.paymentMode;
  }

  if (body.notes !== undefined) payload.notes = String(body.notes ?? '').trim();

  return payload;
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Expense not found');
};

export const createExpense = async (body, adminId) => {
  const payload = buildExpensePayload(body);
  return Expense.create({ ...payload, createdBy: adminId || null });
};

export const updateExpense = async (id, body, adminId) => {
  assertValidId(id);
  const payload = buildExpensePayload(body, { partial: true });
  const expense = await Expense.findByIdAndUpdate(
    id,
    { ...payload, updatedBy: adminId || null },
    { new: true, runValidators: true }
  );
  if (!expense) throw new NotFoundError('Expense not found');
  return expense;
};

export const deleteExpense = async (id) => {
  assertValidId(id);
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) throw new NotFoundError('Expense not found');
  return expense;
};

export const getExpenseMeta = () => ({
  categories: EXPENSE_CATEGORIES,
  paymentModes: EXPENSE_PAYMENT_MODES,
});
