import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';

export const getReportsData = async (query = {}) => {
  const { range = '30d' } = query;
  
  const now = new Date();
  let startDate = new Date();
  if (range === '7d') startDate.setDate(now.getDate() - 7);
  else if (range === '365d') startDate.setDate(now.getDate() - 365);
  else startDate.setDate(now.getDate() - 30);
  
  // 1. Summary
  const [
    totalBookings,
    completedBookings,
    cancelledBookings,
    ongoingBookings,
    totalUsers,
    activeUsers
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: 'COMPLETED', createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: { $in: ['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'REJECTED', 'RESERVATION_EXPIRED'] }, createdAt: { $gte: startDate } }),
    Booking.countDocuments({ status: { $in: ['ACTIVE', 'OVERDUE', 'PENDING_RETURN'] }, createdAt: { $gte: startDate } }),
    User.countDocuments({ createdAt: { $gte: startDate } }),
    Booking.distinct('user', { createdAt: { $gte: startDate } }).then(res => res.length)
  ]);

  const revenueAgg = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] }, createdAt: { $gte: startDate } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, lateFees: { $sum: '$lateFee' } } }
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;
  const lateFeesCollected = revenueAgg[0]?.lateFees || 0;

  // 2. Daily Revenue Chart
  const formatStr = range === '365d' ? '%Y-%m' : '%d %b';
  const dailyRevenueRaw = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] }, createdAt: { $gte: startDate } } },
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
    { name: "Scooty Rentals", value: totalRevenue - lateFeesCollected, color: "#3b82f6" },
    { name: "Late Fees", value: lateFeesCollected, color: "#22c55e" },
    { name: "Other Charges", value: 0, color: "#f97316" },
  ];

  // 5. Recent Bookings
  const recentBookingsRaw = await Booking.find()
    .populate('user', 'fullName phone')
    .populate('vehicle', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentBookings = recentBookingsRaw.map(b => ({
    id: b.bookingId || b._id.toString().substring(0,8).toUpperCase(),
    customer: b.user?.fullName || 'Unknown',
    scooty: b.vehicle?.name || 'EV Scooter',
    pickup: b.startDate ? new Date(b.startDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
    returnDate: b.endDate ? new Date(b.endDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
    amount: `₹${b.totalAmount || 0}`,
    status: (b.status === 'ACTIVE' || b.status === 'OVERDUE') ? 'Ongoing' : 
            (b.status === 'COMPLETED' ? 'Completed' : 
            (['CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_USER', 'REJECTED'].includes(b.status) ? 'Cancelled' : 'Pending')),
    payment: (b.paymentStatus === 'SUCCESS' || b.depositStatus === 'COLLECTED') ? 'Paid' : 'Pending'
  }));

  // 6. Top Scooties
  const topScootiesRaw = await Booking.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } } },
    { $group: { _id: '$vehicle', bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { bookings: -1 } },
    { $limit: 5 }
  ]);
  const vehicleIds = topScootiesRaw.map(s => s._id);
  const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } }).select('name');
  
  const topScooties = topScootiesRaw.map(s => {
    const v = vehicles.find(v => v._id.toString() === s._id?.toString());
    return {
      scooty: v?.name || 'Unknown EV',
      bookings: s.bookings,
      revenue: `₹${s.revenue}`
    };
  });

  return {
    summary: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      ongoingBookings,
      totalRevenue: `₹${totalRevenue}`,
      totalRefunds: `₹0`, // Implement logic if refunds exist
      activeCustomers: activeUsers,
      totalCustomers: totalUsers
    },
    dailyRevenueChart,
    bookingsStatusData,
    revenueSourceData,
    recentBookings,
    topScooties,
    zoneBookings: [],
    customerGrowthChart: [],
    topSpenders: []
  };
};
