import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';
import Refund from '../../models/Refund.js';

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
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  wallet.balance += Number(amount);
  await wallet.save();

  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    type: 'CREDIT',
    amount: Number(amount),
    description,
    referenceType: 'TOP_UP',
  });

  return { wallet, transaction };
};

export const getAdminWalletSummary = async (query = {}) => {
  const { page = 1, limit = 20, type, search } = query;

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
        populate: { path: 'user', select: 'name email phone' }
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

export const listRefunds = async (query = {}) => {
  const { page = 1, limit = 20, status } = query;
  const filter = {};

  if (status) {
    filter.status = status.toUpperCase();
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate({
        path: 'booking',
        populate: { path: 'user', select: 'name email phone' }
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
