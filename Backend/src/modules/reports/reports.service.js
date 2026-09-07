import Booking from '../../models/Booking.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import Vehicle from '../../models/Vehicle.js';

export const getReportsData = async (query = {}) => {
  const { range = '30d' } = query;

  let days = 30;
  if (range === '7d') days = 7;
  if (range === '90d') days = 90;
  if (range === '365d' || range === '1y') days = 365;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 1. Total revenue & count in date range
  const paymentsAgg = await Payment.aggregate([
    { $match: { status: 'COMPLETED', createdAt: { $gte: startDate } } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalPayments: { $sum: 1 } } }
  ]);

  const totalRevenue = paymentsAgg[0]?.totalRevenue || 0;
  const totalPayments = paymentsAgg[0]?.totalPayments || 0;

  // 2. Bookings breakdown by status
  const bookingStatusAgg = await Booking.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 3. User growth in period
  const totalUsers = await User.countDocuments({ role: 'USER' });
  const newUsersInPeriod = await User.countDocuments({ role: 'USER', createdAt: { $gte: startDate } });

  // 4. Vehicle utilization
  const totalVehicles = await Vehicle.countDocuments();
  const activeVehicles = await Vehicle.countDocuments({ status: 'AVAILABLE' });
  const inUseVehicles = await Vehicle.countDocuments({ status: 'BOOKED' });

  // 5. Daily Revenue Breakdown for chart
  const dailyRevenue = await Payment.aggregate([
    { $match: { status: 'COMPLETED', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return {
    range,
    summary: {
      totalRevenue,
      totalPayments,
      totalUsers,
      newUsersInPeriod,
      totalVehicles,
      activeVehicles,
      inUseVehicles,
    },
    bookingStatusBreakdown: bookingStatusAgg.map(b => ({ status: b._id, count: b.count })),
    dailyRevenueChart: dailyRevenue.map(d => ({ date: d._id, revenue: d.revenue, count: d.count })),
  };
};
