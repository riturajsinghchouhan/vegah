import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';
import Payment from '../../models/Payment.js';
import Refund from '../../models/Refund.js';

export const getReportsData = async (query = {}) => {
  const { range = '30d' } = query;
  
  const now = new Date();
  let startDate = new Date();
  if (range === '7d') startDate.setDate(now.getDate() - 7);
  else if (range === '365d') startDate.setDate(now.getDate() - 365);
  else startDate.setDate(now.getDate() - 30);
  
  // 1. Booking Counts & Vehicle/User Totals
  const [
    totalBookings,
    completedBookings,
    cancelledBookings,
    ongoingBookings,
    totalUsers,
    activeUsers,
    newUsersInPeriod,
    bannedUsers,
    totalFleet,
    activeRentals,
    underMaintenance
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: 'COMPLETED', createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: { $in: ['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_SYSTEM', 'REJECTED', 'RESERVATION_EXPIRED'] }, createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: { $in: ['ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'CONFIRMED', 'RESERVED'] }, createdAt: { $gte: startDate } }),
    User.countDocuments({ role: 'USER' }),
    Booking.distinct('user', { createdAt: { $gte: startDate } }).then(res => res.length),
    User.countDocuments({ role: 'USER', createdAt: { $gte: startDate } }),
    User.countDocuments({ role: 'USER', isBlocked: true }),
    Vehicle.countDocuments({ deletedAt: null }),
    Vehicle.countDocuments({ deletedAt: null, status: { $in: ['BOOKED', 'RESERVED'] } }),
    Vehicle.countDocuments({ deletedAt: null, status: 'MAINTENANCE' })
  ]);

  // Financial aggregates from Booking
  const revenueAgg = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'PENDING_RETURN', 'OVERDUE'] }, createdAt: { $gte: startDate } } },
    { 
      $group: { 
        _id: null, 
        total: { $sum: '$totalAmount' }, 
        rentals: { $sum: '$rentalBase' }, 
        lateFees: { $sum: '$lateFee' },
        discounts: { $sum: '$discountAmount' },
        serviceFees: { $sum: '$serviceFee' }
      } 
    }
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const rentalRevenue = revenueAgg[0]?.rentals || 0;
  const lateFeesCollected = revenueAgg[0]?.lateFees || 0;
  const couponDiscounts = revenueAgg[0]?.discounts || 0;
  const otherCharges = revenueAgg[0]?.serviceFees || 0;

  // Refund aggregates from Refund model
  const refundAgg = await Refund.aggregate([
    { $match: { status: { $in: ['COMPLETED', 'PROCESSING', 'PENDING'] }, createdAt: { $gte: startDate } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  const totalRefunds = refundAgg[0]?.total || 0;
  const pendingRefundsCount = await Refund.countDocuments({ status: 'PENDING' });

  // Payment aggregates from Payment model
  const paymentsAgg = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  let successfulPaymentsCount = 0;
  let failedPaymentsCount = 0;
  let totalPaymentsCollected = 0;

  paymentsAgg.forEach(p => {
    if (p._id === 'SUCCESS') {
      successfulPaymentsCount += p.count;
      totalPaymentsCollected += p.total;
    } else if (p._id === 'FAILED') {
      failedPaymentsCount += p.count;
    }
  });
  if (totalPaymentsCollected === 0) {
    totalPaymentsCollected = totalRevenue;
  }

  // 2. Daily Revenue Chart
  const formatStr = range === '365d' ? '%Y-%m' : '%d %b';
  const dailyRevenueRaw = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'PENDING_RETURN', 'OVERDUE'] }, createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: formatStr, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } }
  ]);
  const dailyRevenueChart = dailyRevenueRaw.map(d => ({ date: d._id, revenue: d.revenue }));

  // 3. Bookings Status Data
  const bookingsStatusData = [
    { name: "Completed", value: completedBookings, color: "#3b82f6" },
    { name: "Cancelled", value: cancelledBookings, color: "#f97316" },
    { name: "Ongoing", value: ongoingBookings, color: "#22c55e" },
  ];

  // 4. Revenue Source Data
  const revenueSourceData = [
    { name: "Scooty Rentals", value: rentalRevenue || (totalRevenue - lateFeesCollected), color: "#3b82f6" },
    { name: "Late Fees", value: lateFeesCollected, color: "#22c55e" },
    { name: "Coupons Discount", value: Math.abs(couponDiscounts), color: "#a855f7" },
    { name: "Other Charges", value: otherCharges, color: "#f97316" },
  ];

  // 5. Recent Bookings
  const recentBookingsRaw = await Booking.find()
    .populate('user', 'fullName phone')
    .populate('vehicle', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentBookings = recentBookingsRaw.map(b => ({
    id: b.bookingId || b._id.toString().substring(0,8).toUpperCase(),
    customer: b.user?.fullName || 'Customer',
    scooty: b.vehicle?.name || 'EV Scooter',
    pickup: b.startDate ? new Date(b.startDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
    returnDate: b.endDate ? new Date(b.endDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
    amount: `₹${b.totalAmount || 0}`,
    status: (b.status === 'ACTIVE' || b.status === 'OVERDUE' || b.status === 'PENDING_RETURN') ? 'Ongoing' : 
            (b.status === 'COMPLETED' ? 'Completed' : 
            (['CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_USER', 'REJECTED', 'RESERVATION_EXPIRED'].includes(b.status) ? 'Cancelled' : 'Pending')),
    payment: (b.paymentStatus === 'SUCCESS' || b.depositStatus === 'COLLECTED') ? 'Paid' : 'Pending'
  }));

  // 6. Top Scooties
  const topScootiesRaw = await Booking.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'PENDING_RETURN', 'OVERDUE'] } } },
    { $group: { _id: '$vehicle', bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { bookings: -1 } },
    { $limit: 5 }
  ]);
  const vehicleIds = topScootiesRaw.map(s => s._id);
  const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } }).select('name');
  
  const topScooties = topScootiesRaw.map(s => {
    const v = vehicles.find(v => v._id.toString() === s._id?.toString());
    return {
      scooty: v?.name || 'EV Scooter',
      bookings: s.bookings,
      revenue: `₹${s.revenue}`
    };
  });

  // 7. Zone Bookings Breakdown
  const zoneBookingsRaw = await Booking.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $lookup: { from: 'vehicles', localField: 'vehicle', foreignField: '_id', as: 'v' } },
    { $unwind: '$v' },
    { $lookup: { from: 'zones', localField: 'v.zone', foreignField: '_id', as: 'z' } },
    { $unwind: '$z' },
    { $group: { _id: '$z.name', bookings: { $sum: 1 } } },
    { $sort: { bookings: -1 } }
  ]);
  const zoneBookings = zoneBookingsRaw.map(z => ({
    zone: z._id || 'Main Zone',
    bookings: z.bookings
  }));

  // 8. Top Spenders (Customers)
  const topSpendersRaw = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'PENDING_RETURN', 'OVERDUE'] } } },
    { $group: { _id: '$user', bookings: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 }
  ]);
  const spenderUserIds = topSpendersRaw.map(s => s._id);
  const spenderUsers = await User.find({ _id: { $in: spenderUserIds } }).select('fullName');
  const topSpenders = topSpendersRaw.map((s, idx) => {
    const u = spenderUsers.find(u => u._id.toString() === s._id?.toString());
    return {
      rank: idx + 1,
      name: u?.fullName || 'User',
      bookings: s.bookings,
      spent: `₹${s.totalSpent}`
    };
  });

  // 9. Recent Transactions (Payments)
  const recentPaymentsRaw = await Payment.find()
    .populate({ path: 'booking', select: 'bookingId user', populate: { path: 'user', select: 'fullName' } })
    .sort({ createdAt: -1 })
    .limit(10);
  const recentTransactions = recentPaymentsRaw.map(p => ({
    tid: p.razorpayPaymentId || p._id.toString().substring(0, 8).toUpperCase(),
    bid: p.booking?.bookingId || '-',
    date: p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
    method: p.method || 'UPI',
    amt: `₹${p.amount || 0}`,
    status: p.status === 'SUCCESS' ? 'Success' : 'Failed'
  }));

  // 10. Refund Requests
  const refundRequestsRaw = await Refund.find()
    .populate({ path: 'booking', select: 'bookingId user', populate: { path: 'user', select: 'fullName' } })
    .sort({ createdAt: -1 })
    .limit(10);
  const refundRequests = refundRequestsRaw.map(r => ({
    bid: r.booking?.bookingId || '-',
    customer: r.booking?.user?.fullName || 'Customer',
    reason: r.reason || 'User Request',
    amt: `₹${r.amount || 0}`,
    status: r.status === 'COMPLETED' ? 'Processed' : 'Pending'
  }));

  const avgOrderValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const utilization = totalFleet > 0 ? Math.round((activeRentals / totalFleet) * 100) : 0;

  return {
    range,
    summary: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      ongoingBookings,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      totalRefunds: `₹${totalRefunds.toLocaleString('en-IN')}`,
      activeCustomers: activeUsers,
      totalCustomers: totalUsers,
      newSignups: newUsersInPeriod,
      bannedAccounts: bannedUsers,
      totalFleet,
      activeRentals,
      underMaintenance,
      utilization: `${utilization}%`,
      avgOrderValue: `₹${avgOrderValue.toLocaleString('en-IN')}`,
      couponDiscounts: `₹${couponDiscounts.toLocaleString('en-IN')}`,
      lateFeesCollected: `₹${lateFeesCollected.toLocaleString('en-IN')}`,
      totalPaymentsCollected: `₹${totalPaymentsCollected.toLocaleString('en-IN')}`,
      successfulPaymentsCount,
      failedPaymentsCount,
      pendingRefundsCount
    },
    dailyRevenueChart,
    bookingsStatusData,
    revenueSourceData,
    recentBookings,
    topScooties,
    zoneBookings,
    topSpenders,
    recentTransactions,
    refundRequests
  };
};
