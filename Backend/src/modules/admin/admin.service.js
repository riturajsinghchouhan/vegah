import Vehicle from '../../models/Vehicle.js';
import Booking from '../../models/Booking.js';

const VIEW_MODES = ['day', 'week', 'month'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// How many hours one column covers in the Day view. Twelve columns stay wide
// enough for the booking bars to still show a name.
const DAY_VIEW_SLOT_HOURS = 2;

/**
 * "2026-03-12" is parsed by `new Date()` as UTC midnight, which in IST lands on
 * the same calendar day only by luck of the offset. The timeline is a local
 * calendar, so the date parts are read straight into a local date.
 */
const parseRefDate = (value) => {
  if (!value) return new Date();
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const shortDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const hourLabel = (hour) => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
};

/**
 * Builds the column strip the grid is drawn on, one entry per cell, each with
 * the exact [start, end) window it covers. Everything downstream (bar
 * positions, the range label, the booking query) is derived from this, so the
 * three views differ only here.
 */
const buildColumns = (refDate, view) => {
  const columns = [];

  if (view === 'day') {
    const dayStart = new Date(refDate);
    dayStart.setHours(0, 0, 0, 0);

    for (let hour = 0; hour < 24; hour += DAY_VIEW_SLOT_HOURS) {
      const start = new Date(dayStart);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + DAY_VIEW_SLOT_HOURS, 0, 0, 0);
      columns.push({ day: hourLabel(hour), date: '', isoDate: toIsoDate(start), start, end });
    }

    const rangeLabel = refDate.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    return { columns, rangeLabel };
  }

  if (view === 'month') {
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();

    for (let i = 0; i < daysInMonth; i += 1) {
      const start = new Date(monthStart);
      start.setDate(monthStart.getDate() + i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      columns.push({
        day: String(start.getDate()),
        date: DAY_NAMES[start.getDay()],
        isoDate: toIsoDate(start),
        start,
        end,
      });
    }

    const rangeLabel = refDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return { columns, rangeLabel };
  }

  // Week (default): Monday -> Sunday around the reference date.
  const distanceToMonday = (refDate.getDay() + 6) % 7;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i += 1) {
    const start = new Date(monday);
    start.setDate(monday.getDate() + i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    columns.push({ day: DAY_NAMES[start.getDay()], date: shortDate(start), isoDate: toIsoDate(start), start, end });
  }

  const rangeLabel = `${shortDate(columns[0].start)} — ${shortDate(columns[6].start)} ${columns[6].start.getFullYear()}`;
  return { columns, rangeLabel };
};

/**
 * Maps a [start, end] interval onto the column strip. Returns null when the
 * interval does not overlap the visible range at all.
 */
const spanToColumns = (columns, start, end) => {
  const rangeStart = columns[0].start;
  const rangeEnd = columns[columns.length - 1].end;
  if (end < rangeStart || start >= rangeEnd) return null;

  let startIndex = columns.findIndex((col) => col.end > start);
  if (startIndex === -1) startIndex = columns.length - 1;

  let endIndex = startIndex;
  for (let i = startIndex; i < columns.length; i += 1) {
    if (columns[i].start < end) endIndex = i;
  }

  return { startDay: startIndex, endDay: Math.max(startIndex, endIndex) };
};

export const getFleetTimeline = async (query = {}) => {
  const view = VIEW_MODES.includes(String(query.view || '').toLowerCase())
    ? String(query.view).toLowerCase()
    : 'week';

  const refDate = parseRefDate(query.date);
  const { columns, rangeLabel } = buildColumns(refDate, view);

  const rangeStart = columns[0].start;
  const rangeEnd = columns[columns.length - 1].end;

  // Fetch all active (non-deleted) vehicles
  const vehicles = await Vehicle.find({
    status: { $ne: 'INACTIVE' }
  }).populate('category', 'name').populate('zone', 'name');

  // Fetch all relevant bookings intersecting the visible range
  const bookings = await Booking.find({
    status: { $nin: ['CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_SYSTEM', 'RESERVATION_EXPIRED', 'PAYMENT_FAILED'] },
    startDate: { $lt: rangeEnd },
    endDate: { $gte: rangeStart }
  }).populate('user', 'fullName phone email');

  // In the Day view the bars carry clock times; the wider views carry dates.
  const eventTimeLabel = (start, end) => (
    view === 'day'
      ? `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
      : `${shortDate(start)} - ${shortDate(end)}`
  );

  const maintenanceTime = view === 'day' ? 'All day' : view === 'month' ? 'Full month' : 'Full Week';

  // Map events to vehicles
  const vehicleTimeline = vehicles.map((v, index) => {
    const vBookings = bookings.filter(b => b.vehicle && b.vehicle.toString() === v._id.toString());
    const events = [];

    vBookings.forEach(b => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);

      const span = spanToColumns(columns, bStart, bEnd);
      if (!span) return;

      events.push({
        id: b._id,
        type: 'booked',
        startDay: span.startDay,
        endDay: span.endDay,
        user: b.user?.fullName || 'Customer',
        phone: b.user?.phone || '',
        time: eventTimeLabel(bStart, bEnd),
        status: b.status,
      });
    });

    if (v.status === 'MAINTENANCE' && events.length === 0) {
      events.push({
        id: `maint-${v._id}`,
        type: 'maintenance',
        startDay: 0,
        endDay: columns.length - 1,
        text: 'Scheduled Maintenance',
        time: maintenanceTime,
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

  const publicColumns = columns.map(c => ({ day: c.day, date: c.date, isoDate: c.isoDate }));

  return {
    view,
    columns: publicColumns,
    // Kept under the old name so a cached client bundle still renders.
    daysOfWeek: publicColumns,
    rangeLabel,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
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
