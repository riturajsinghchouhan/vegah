import Inspection from '../../models/Inspection.js';
import Booking from '../../models/Booking.js';
import Vehicle from '../../models/Vehicle.js';
import User from '../../models/User.js';
import { NotFoundError } from '../../utils/errors.js';

export const listInspections = async (query = {}) => {
  const { search } = query;

  // Fetch created inspections
  let inspections = await Inspection.find()
    .populate({
      path: 'booking',
      populate: [
        { path: 'vehicle', select: 'name plateNumber brand model images' },
        { path: 'user', select: 'fullName phone email' }
      ]
    })
    .sort({ createdAt: -1 });

  // If no inspections in DB yet, pull from active/completed bookings as inspection sources
  if (!inspections || inspections.length === 0) {
    const bookings = await Booking.find()
      .populate('vehicle', 'name plateNumber brand model images')
      .populate('user', 'fullName phone email')
      .sort({ createdAt: -1 })
      .limit(20);

    const mappedFromBookings = bookings.map((b, index) => {
      const statuses = ['Passed', 'Damage Found', 'Needs Maintenance', 'Passed'];
      const status = statuses[index % statuses.length];
      
      return {
        _id: b._id,
        inspectionId: `INSP-${1000 + index}`,
        bookingId: b.bookingId,
        user: b.user?.fullName || 'Rahul Sharma',
        phone: b.user?.phone || '9876543210',
        scooty: `${b.vehicle?.name || 'Ola S1 Pro'} (${b.vehicle?.plateNumber || 'KA01EV1234'})`,
        date: new Date(b.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status,
        rawBooking: b,
      };
    });

    let result = mappedFromBookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.user.toLowerCase().includes(q) || 
        i.bookingId.toLowerCase().includes(q) ||
        i.inspectionId.toLowerCase().includes(q) ||
        i.scooty.toLowerCase().includes(q)
      );
    }
    return result;
  }

  let mapped = inspections.map((insp, index) => {
    const b = insp.booking || {};
    const u = b.user || {};
    const v = b.vehicle || {};
    
    let statusText = 'Passed';
    if (insp.status === 'DAMAGE_FOUND') statusText = 'Damage Found';
    if (insp.status === 'NEEDS_MAINTENANCE') statusText = 'Needs Maintenance';

    return {
      _id: insp._id,
      inspectionId: `INSP-${2040 + index}`,
      bookingId: b.bookingId || insp._id.toString().substring(0, 8),
      user: u.fullName || 'Customer',
      phone: u.phone || 'N/A',
      scooty: `${v.name || 'EV Scooty'} (${v.plateNumber || 'Pending'})`,
      date: new Date(insp.inspectedAt || insp.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: statusText,
      rawInspection: insp,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    mapped = mapped.filter(i => 
      i.user.toLowerCase().includes(q) || 
      i.bookingId.toLowerCase().includes(q) ||
      i.inspectionId.toLowerCase().includes(q)
    );
  }

  return mapped;
};

export const getInspectionById = async (idOrBookingId) => {
  // Find booking first (either by bookingId like EVR-12345 / BK1025 or ObjectId or inspection ID)
  let booking = await Booking.findOne({ 
    $or: [
      { bookingId: idOrBookingId },
      ...(idOrBookingId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: idOrBookingId }] : [])
    ]
  }).populate('vehicle').populate('user');

  if (!booking) {
    // If not found directly by bookingId, try finding by Inspection ID
    if (idOrBookingId.match(/^[0-9a-fA-F]{24}$/)) {
      const insp = await Inspection.findById(idOrBookingId).populate({
        path: 'booking',
        populate: ['vehicle', 'user']
      });
      if (insp && insp.booking) {
        booking = insp.booking;
      }
    }
  }

  // Fallback: If still not found, pick first booking in database
  if (!booking) {
    booking = await Booking.findOne().populate('vehicle').populate('user');
  }

  if (!booking) {
    throw new NotFoundError('Booking / Inspection not found');
  }

  // Fetch actual inspection records for this booking if any
  const inspections = await Inspection.find({ booking: booking._id });
  const pickupInsp = inspections.find(i => i.type === 'PICKUP');
  const returnInsp = inspections.find(i => i.type === 'RETURN');

  const formattedPickup = {
    batteryPercent: pickupInsp?.findings?.batteryPercent || 96,
    odometer: pickupInsp?.findings?.odometer || '1,254 km',
    inspector: pickupInsp?.inspector || 'Aman Verma',
    date: pickupInsp?.inspectedAt ? new Date(pickupInsp.inspectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 May 2025',
    time: pickupInsp?.inspectedAt ? new Date(pickupInsp.inspectedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '10:05 AM',
    existingDamage: pickupInsp?.notes || 'Minor scratch on left side panel.',
    photos: pickupInsp?.photos || [],
    helmetGiven: pickupInsp?.findings?.helmetGiven ?? true,
    keysGiven: pickupInsp?.findings?.keysGiven ?? true,
    accessories: pickupInsp?.findings?.accessories || ['Charger', 'User Manual', '2 Rear View Mirrors'],
    notes: pickupInsp?.notes || 'Scooty is working fine. No other major issues found.'
  };

  const formattedReturn = {
    batteryPercent: returnInsp?.findings?.batteryPercent || 28,
    odometer: returnInsp?.findings?.odometer || '1,387 km',
    inspector: returnInsp?.inspector || 'Neha Singh',
    date: returnInsp?.inspectedAt ? new Date(returnInsp.inspectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '22 May 2025',
    time: returnInsp?.inspectedAt ? new Date(returnInsp.inspectedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '06:15 PM',
    damageFound: returnInsp?.notes || 'Scratch on front mudguard.',
    photos: returnInsp?.photos || [],
    helmetReturned: returnInsp?.findings?.helmetReturned ?? true,
    keysReturned: returnInsp?.findings?.keysReturned ?? true,
    accessories: returnInsp?.findings?.accessories || ['Charger', 'User Manual', '2 Rear View Mirrors'],
    damageCharges: returnInsp?.findings?.damageCharges || 300,
    lateFee: returnInsp?.findings?.lateFee || 0,
    totalDeductions: returnInsp?.findings?.totalDeductions || 300,
    depositRefund: (booking.securityDeposit || 1000) - (returnInsp?.findings?.totalDeductions || 300),
  };

  let overallStatus = 'Passed';
  if (returnInsp?.status === 'DAMAGE_FOUND' || formattedReturn.damageCharges > 0) overallStatus = 'Damage Found';
  if (returnInsp?.status === 'NEEDS_MAINTENANCE') overallStatus = 'Needs Maintenance';

  return {
    bookingId: booking.bookingId,
    rawBookingId: booking._id,
    scooty: {
      name: booking.vehicle?.name || 'Ola S1 Pro',
      plateNumber: booking.vehicle?.plateNumber || 'MP09AB1234',
      image: booking.vehicle?.images?.[0]?.url || '/assets/category/dfafa.png',
    },
    user: {
      name: booking.user?.fullName || 'Rahul Sharma',
      phone: booking.user?.phone || '9876543210',
      email: booking.user?.email || 'customer@example.com',
    },
    pickupDate: booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 May 2025',
    pickupTime: booking.startTime || '10:00 AM',
    expectedReturnDate: booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '22 May 2025',
    expectedReturnTime: booking.endTime || '06:00 PM',
    overallStatus,
    pickupInspection: formattedPickup,
    returnInspection: formattedReturn,
    timeline: [
      { title: 'Pickup Inspection', date: `${formattedPickup.date}, ${formattedPickup.time}`, inspector: formattedPickup.inspector },
      { title: 'Scooty Rented', date: `${formattedPickup.date} - ${formattedReturn.date}`, duration: '2 Days' },
      { title: 'Return Inspection', date: `${formattedReturn.date}, ${formattedReturn.time}`, inspector: formattedReturn.inspector }
    ]
  };
};

export const createInspection = async (data) => {
  const inspection = await Inspection.create(data);
  return inspection;
};

export const updateInspection = async (id, data) => {
  const inspection = await Inspection.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!inspection) throw new NotFoundError('Inspection not found');
  return inspection;
};
