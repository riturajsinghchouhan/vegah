import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';
import Refund from '../../models/Refund.js';
import User from '../../models/User.js';
import { BadRequestError } from '../../utils/errors.js';

export const getUserWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  const transactions = await WalletTransaction.find({ wallet: wallet._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return {
    wallet,
    transactions,
  };
};

export const addFundsToWallet = async (userId, amount, description = 'Wallet Top Up') => {
  // The endpoint took whatever it was given: a negative or NaN amount silently
  // corrupted the balance instead of being rejected.
  const credit = Number(amount);
  if (!Number.isFinite(credit) || credit <= 0) {
    throw new BadRequestError('Top-up amount must be a positive number');
  }
  if (credit > 100000) {
    throw new BadRequestError('Top-up amount cannot exceed Rs 1,00,000 in one transaction');
  }

  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  wallet.balance += credit;
  await wallet.save();

  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    type: 'CREDIT',
    amount: credit,
    description,
    referenceType: 'TOP_UP',
  });

  return { wallet, transaction };
};

export const getAdminWalletSummary = async (query = {}) => {
  const { page = 1, limit = 50, type, search } = query;

  const totalWallets = await Wallet.countDocuments();
  const balanceAgg = await Wallet.aggregate([
    { $group: { _id: null, totalBalance: { $sum: '$balance' } } }
  ]);
  const totalWalletBalance = balanceAgg[0]?.totalBalance || 0;

  const txFilter = {};
  if (type) {
    txFilter.type = type.toUpperCase();
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, totalTx] = await Promise.all([
    WalletTransaction.find(txFilter)
      .populate({
        path: 'wallet',
        populate: { path: 'user', select: 'fullName name email phone' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WalletTransaction.countDocuments(txFilter),
  ]);

  return {
    summary: {
      totalWallets,
      totalWalletBalance,
    },
    transactions,
    meta: {
      total: totalTx,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(totalTx / Number(limit)) || 1,
    },
  };
};

export const listCustomerWallets = async (query = {}) => {
  const { search } = query;

  const filter = {};
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).select('fullName name email phone isBlocked createdAt').sort({ createdAt: -1 });

  const customerWallets = await Promise.all(
    users.map(async (u) => {
      let wallet = await Wallet.findOne({ user: u._id });
      if (!wallet) {
        wallet = await Wallet.create({ user: u._id, balance: 0 });
      }
      return {
        userId: u._id,
        name: u.fullName || u.name || 'User',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        isBlocked: Boolean(u.isBlocked),
        walletId: wallet._id,
        balance: wallet.balance,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      };
    })
  );

  return {
    customers: customerWallets,
    meta: {
      total: customerWallets.length,
    },
  };
};

export const adminAdjustWallet = async ({ userId, amount, type, description }, adminId) => {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    const error = new Error('Amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const adjType = String(type).toUpperCase();
  if (!['CREDIT', 'DEBIT'].includes(adjType)) {
    const error = new Error('Invalid transaction type. Must be CREDIT or DEBIT.');
    error.statusCode = 400;
    throw error;
  }

  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  if (adjType === 'DEBIT' && wallet.balance < numAmount) {
    const error = new Error(`Insufficient wallet balance. Current balance is ₹${wallet.balance}`);
    error.statusCode = 400;
    throw error;
  }

  if (adjType === 'CREDIT') {
    wallet.balance += numAmount;
  } else {
    wallet.balance -= numAmount;
  }

  await wallet.save();

  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    type: adjType,
    amount: numAmount,
    description: description || (adjType === 'CREDIT' ? 'Added by Admin' : 'Deducted by Admin'),
    referenceType: 'MANUAL_ADJUSTMENT',
    referenceId: adminId,
  });

  return { wallet, transaction };
};

export const listRefunds = async (query = {}) => {
  const { page = 1, limit = 50, status } = query;
  const filter = {};

  if (status) {
    filter.status = status.toUpperCase();
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate({
        path: 'booking',
        populate: { path: 'user', select: 'fullName name email phone' }
      })
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Refund.countDocuments(filter),
  ]);

  return {
    refunds,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const updateRefundStatus = async (refundId, status, adminId) => {
  const refund = await Refund.findById(refundId).populate('booking');
  if (!refund) {
    const error = new Error('Refund request not found');
    error.statusCode = 404;
    throw error;
  }

  refund.status = status.toUpperCase();
  refund.processedBy = adminId;
  refund.processedAt = new Date();
  await refund.save();

  // If completed, credit refund amount to user's wallet
  if (refund.status === 'COMPLETED' && refund.booking?.user) {
    const userId = refund.booking.user;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    wallet.balance += refund.amount;
    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      type: 'CREDIT',
      amount: refund.amount,
      description: `Refund for booking #${refund.booking._id}`,
      referenceType: 'REFUND',
      referenceId: refund._id,
    });
  }

  return refund;
};
