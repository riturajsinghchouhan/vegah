import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import Refund from '../../models/Refund.js';

export const getFinanceSummary = async (query = {}) => {
  const grossPaymentAgg = await Payment.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: null, totalGross: { $sum: '$amount' } } }
  ]);
  const grossRevenue = grossPaymentAgg[0]?.totalGross || 0;

  const refundAgg = await Refund.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: null, totalRefunded: { $sum: '$amount' } } }
  ]);
  const totalRefunded = refundAgg[0]?.totalRefunded || 0;

  const netRevenue = grossRevenue - totalRefunded;
  const estimatedTax = netRevenue * 0.18; // 18% GST estimate

  const recentTransactions = await Payment.find()
    .populate({
      path: 'booking',
      select: 'bookingId user',
      populate: { path: 'user', select: 'name email' }
    })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    summary: {
      grossRevenue,
      totalRefunded,
      netRevenue,
      estimatedTax,
    },
    recentTransactions,
  };
};

export const getSettlements = async (query = {}) => {
  const { page = 1, limit = 20, status } = query;
  const filter = { status: 'COMPLETED' };

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  const totalSettled = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return {
    settlements: payments.map(p => ({
      id: p._id,
      paymentId: p.razorpayPaymentId || p._id,
      amount: p.amount,
      gatewayFee: (p.amount * 0.02).toFixed(2), // 2% gateway fee standard
      netSettlement: (p.amount * 0.98).toFixed(2),
      status: 'Settled',
      date: p.createdAt,
    })),
    totalSettled,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getTaxBilling = async (query = {}) => {
  const payments = await Payment.find({ status: 'COMPLETED' }).sort({ createdAt: -1 }).limit(50);
  
  const invoices = payments.map(p => {
    const baseAmount = +(p.amount / 1.18).toFixed(2);
    const taxAmount = +(p.amount - baseAmount).toFixed(2);
    return {
      invoiceId: `INV-${p._id.toString().slice(-6).toUpperCase()}`,
      date: p.createdAt,
      totalAmount: p.amount,
      baseAmount,
      taxAmount,
      gstRate: "18%",
      status: "Paid",
    };
  });

  return {
    taxRate: 18,
    currency: "INR",
    invoices,
  };
};
