import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import Refund from '../../models/Refund.js';
import * as settingsService from '../settings/settings.service.js';

export const getFinanceSummary = async (query = {}) => {
  const grossPaymentAgg = await Payment.aggregate([
    { $match: { status: { $in: ['SUCCESS', 'COMPLETED'] } } },
    { $group: { _id: null, totalGross: { $sum: '$amount' } } }
  ]);
  const grossRevenue = grossPaymentAgg[0]?.totalGross || 0;

  const refundAgg = await Refund.aggregate([
    { $match: { status: { $in: ['SUCCESS', 'COMPLETED'] } } },
    { $group: { _id: null, totalRefunded: { $sum: '$amount' } } }
  ]);
  const totalRefunded = refundAgg[0]?.totalRefunded || 0;

  const netRevenue = grossRevenue - totalRefunded;
  
  // Dynamic GST from settings
  const pricingSettings = await settingsService.getSettings('pricing');
  const gstRate = Number(pricingSettings.gstRate || 18);
  const estimatedTax = netRevenue * (gstRate / 100);

  const recentTransactions = await Payment.find()
    .populate({
      path: 'booking',
      select: 'bookingId user',
      populate: { path: 'user', select: 'name fullName email' }
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
  const filter = { status: { $in: ['SUCCESS', 'COMPLETED'] } };

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
  const pricingSettings = await settingsService.getSettings('pricing');
  const gstRateNum = Number(pricingSettings.gstRate || 18);
  const gstDivisor = 1 + (gstRateNum / 100);

  // 1. Fetch successful payments
  const payments = await Payment.find({ status: { $in: ['SUCCESS', 'COMPLETED'] } })
    .populate({
      path: 'booking',
      select: 'bookingId user vehicle rentalBase serviceFee platformFee taxAmount totalAmount paymentMethod status createdAt',
      populate: [
        { path: 'user', select: 'fullName name email phone' },
        { path: 'vehicle', select: 'name brand model plateNumber' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(100);

  const paymentBookingIds = payments.map(p => p.booking?._id?.toString()).filter(Boolean);

  // 2. Fetch completed/confirmed bookings (e.g. CASH or WALLET) that may not be in payments collection
  const additionalBookings = await Booking.find({
    _id: { $nin: paymentBookingIds },
    status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
    totalAmount: { $gt: 0 }
  })
    .populate('user', 'fullName name email phone')
    .populate('vehicle', 'name brand model plateNumber')
    .sort({ createdAt: -1 })
    .limit(50);

  const invoicesFromPayments = payments.map(p => {
    const booking = p.booking;
    const totalAmount = p.amount || booking?.totalAmount || 0;
    const taxAmount = booking?.taxAmount != null && booking.taxAmount > 0
      ? booking.taxAmount
      : +(totalAmount - (totalAmount / gstDivisor)).toFixed(2);
    const baseAmount = booking?.rentalBase != null && booking.rentalBase > 0
      ? booking.rentalBase
      : +(totalAmount - taxAmount).toFixed(2);

    const invoiceNumber = booking?.bookingId
      ? `INV-${booking.bookingId}`
      : `INV-${p._id.toString().slice(-6).toUpperCase()}`;

    return {
      id: p._id,
      invoiceId: invoiceNumber,
      bookingId: booking?.bookingId || null,
      bookingDbId: booking?._id || null,
      customerName: booking?.user?.fullName || booking?.user?.name || 'Customer',
      customerEmail: booking?.user?.email || '',
      customerPhone: booking?.user?.phone || '',
      vehicleName: booking?.vehicle ? `${booking.vehicle.brand || ''} ${booking.vehicle.model || booking.vehicle.name || ''}`.trim() : 'EV Rental',
      plateNumber: booking?.vehicle?.plateNumber || '',
      date: p.paidAt || p.createdAt,
      totalAmount,
      baseAmount,
      taxAmount,
      serviceFee: booking?.serviceFee || 0,
      platformFee: booking?.platformFee || Number(pricingSettings.platformFee || 20),
      gstRate: `${gstRateNum}%`,
      status: 'Paid',
      paymentMethod: p.method || booking?.paymentMethod || 'ONLINE',
    };
  });

  const invoicesFromBookings = additionalBookings.map(b => {
    const totalAmount = b.totalAmount || 0;
    const taxAmount = b.taxAmount != null && b.taxAmount > 0
      ? b.taxAmount
      : +(totalAmount - (totalAmount / gstDivisor)).toFixed(2);
    const baseAmount = b.rentalBase != null && b.rentalBase > 0
      ? b.rentalBase
      : +(totalAmount - taxAmount).toFixed(2);

    return {
      id: b._id,
      invoiceId: `INV-${b.bookingId || b._id.toString().slice(-6).toUpperCase()}`,
      bookingId: b.bookingId,
      bookingDbId: b._id,
      customerName: b.user?.fullName || b.user?.name || 'Customer',
      customerEmail: b.user?.email || '',
      customerPhone: b.user?.phone || '',
      vehicleName: b.vehicle ? `${b.vehicle.brand || ''} ${b.vehicle.model || b.vehicle.name || ''}`.trim() : 'EV Rental',
      plateNumber: b.vehicle?.plateNumber || '',
      date: b.createdAt,
      totalAmount,
      baseAmount,
      taxAmount,
      serviceFee: b.serviceFee || 0,
      platformFee: b.platformFee || Number(pricingSettings.platformFee || 20),
      gstRate: `${gstRateNum}%`,
      status: b.status === 'COMPLETED' ? 'Paid' : 'Confirmed',
      paymentMethod: b.paymentMethod || 'CASH',
    };
  });

  const allInvoices = [...invoicesFromPayments, ...invoicesFromBookings].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return {
    taxRate: gstRateNum,
    currency: 'INR',
    settings: {
      gstRate: gstRateNum,
      platformFee: Number(pricingSettings.platformFee || 20),
      serviceCharge: Number(pricingSettings.serviceCharge || 5),
      cancellationFee: Number(pricingSettings.cancellationFee || 100),
    },
    invoices: allInvoices,
  };
};
