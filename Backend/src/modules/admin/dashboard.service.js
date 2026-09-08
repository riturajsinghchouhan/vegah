import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';

export const getDashboardStats = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    totalBookings,
    todaysBookings,
    pendingApprovals,
    cancelledToday,
    todaysRevenue,
  ] = await Promise.all([
    User.countDocuments({}),
    Booking.countDocuments({}),
    Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ status: 'PENDING_VERIFICATION' }),
    Booking.countDocuments({
      status: { $in: ['CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_SYSTEM'] },
      cancelledAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Booking.aggregate([
      {
        $match: {
          status: 'CONFIRMED',
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  return {
    totalUsers,
    totalBookings,
    todaysBookings,
    pendingApprovals,
    cancelledToday,
    todaysRevenue: todaysRevenue[0]?.total || 0,
  };
};

export const getChartData = async (query = {}) => {
  const { period = 'week' } = query;

  const now = new Date();
  let startDate;
  let groupBy;
  let format;

  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    format = 'daily';
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    format = 'daily';
  } else {
    // year
    startDate = new Date(now.getFullYear(), 0, 1);
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    format = 'monthly';
  }

  const [revenueData, bookingData] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: groupBy,
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    period,
    format,
    revenueChart: revenueData.map(d => ({ date: d._id, revenue: d.revenue, bookings: d.count })),
    bookingChart: bookingData.map(d => ({ date: d._id, bookings: d.bookings })),
  };
};
