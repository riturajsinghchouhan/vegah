import Vehicle from '../../models/Vehicle.js';
import Booking from '../../models/Booking.js';

export const getFleetTimeline = async (query = {}) => {
  // Determine reference date (default: today or query.date)
  const refDate = query.date ? new Date(query.date) : new Date();
  
  // Calculate start of week (Monday)
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (dayOfWeek + 6) % 7; // distance from Monday
  
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const daysOfWeek = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    daysOfWeek.push({
      day: dayNames[i],
      date: dayStr,
      isoDate: d.toISOString().split('T')[0],
      rawDate: d,
    });
  }

  const sunday = new Date(daysOfWeek[6].rawDate);
  sunday.setHours(23, 59, 59, 999);

  // Fetch all active (non-deleted) vehicles
  const vehicles = await Vehicle.find({
    status: { $ne: 'INACTIVE' }
  }).populate('category', 'name').populate('zone', 'name');

  // Fetch all relevant bookings intersecting [monday, sunday]
  const bookings = await Booking.find({
    status: { $nin: ['CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_SYSTEM', 'RESERVATION_EXPIRED', 'PAYMENT_FAILED'] },
    startDate: { $lte: sunday },
    endDate: { $gte: monday }
  }).populate('user', 'fullName phone email');

  // Map events to vehicles
  const vehicleTimeline = vehicles.map((v, index) => {
    const vBookings = bookings.filter(b => b.vehicle && b.vehicle.toString() === v._id.toString());
    const events = [];

    vBookings.forEach(b => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);

      let startDay = 0;
      let endDay = 6;

      for (let i = 0; i < 7; i++) {
        const currentDay = daysOfWeek[i].rawDate;
        const nextDay = new Date(currentDay);
        nextDay.setDate(currentDay.getDate() + 1);

        if (bStart >= currentDay && bStart < nextDay) {
          startDay = i;
        }
        if (bEnd >= currentDay && bEnd < nextDay) {
          endDay = i;
        }
      }

      if (bEnd < monday) return;
      if (bStart > sunday) return;

      if (bStart < monday) startDay = 0;
      if (bEnd > sunday) endDay = 6;

      const userName = b.user?.fullName || 'Customer';
      const timeStr = `${bStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${bEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

      events.push({
        id: b._id,
        type: 'booked',
        startDay,
        endDay: Math.max(startDay, endDay),
        user: userName,
        phone: b.user?.phone || '',
        time: timeStr,
        status: b.status,
      });
    });

    if (v.status === 'MAINTENANCE' && events.length === 0) {
      events.push({
        id: `maint-${v._id}`,
        type: 'maintenance',
        startDay: 0,
        endDay: 6,
        text: 'Scheduled Maintenance',
        time: 'Full Week',
      });
    }

    return {
      id: v._id,
      name: v.name,
      reg: v.plateNumber,
      category: v.category?.name || 'Scooter',
      zone: v.zone?.name || 'N/A',
      status: v.status,
      image: v.images?.[0]?.url || (index % 2 === 0 ? '/assets/category/dfafa.png' : '/assets/category/image.png'),
      events,
    };
  });

  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const bookedCount = vehicles.filter(v => v.status === 'BOOKED' || v.status === 'RESERVED').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'MAINTENANCE').length;

  return {
    daysOfWeek: daysOfWeek.map(d => ({ day: d.day, date: d.date, isoDate: d.isoDate })),
    rangeLabel: `${daysOfWeek[0].date} — ${daysOfWeek[6].date} ${daysOfWeek[0].rawDate.getFullYear()}`,
    scooties: vehicleTimeline,
    metrics: {
      totalFleet: vehicles.length,
      availableCount,
      bookedCount,
      maintenanceCount,
      conflictCount: 0,
    }
  };
};
