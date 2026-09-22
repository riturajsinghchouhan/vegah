import Booking from '../models/Booking.js';
import { handleStatusTransition } from '../modules/bookings/bookings.service.js';
import { BOOKING_STATUS, RENTAL_REMINDER_LEAD_MS } from '../modules/bookings/bookings.constants.js';
import { notifyUser } from '../services/notification.service.js';
import logger from '../utils/logger.js';

/**
 * Step 6 of the rental flow: warn the user shortly before their rental time
 * runs out so they can start heading to the drop hub.
 */
export const rentalReminderProcessor = async (job) => {
  const { bookingId } = job.data;

  const booking = await Booking.findById(bookingId)
    .populate('vehicle', 'name plateNumber')
    .populate('user', 'fullName');

  if (!booking) {
    logger.warn(`Job rental-reminder: Booking ${bookingId} not found`);
    return;
  }

  // Only a running trip needs the reminder. A trip that already ended, was
  // returned, or was cancelled must not be nagged.
  if (booking.status !== BOOKING_STATUS.ACTIVE) {
    logger.debug(`Job rental-reminder: Booking ${bookingId} is ${booking.status}, skipping`);
    return;
  }

  if (booking.reminderSentAt) {
    logger.debug(`Job rental-reminder: Booking ${bookingId} already reminded, skipping`);
    return;
  }

  if (!booking.tripEndsAt) {
    logger.warn(`Job rental-reminder: Booking ${bookingId} has no tripEndsAt, skipping`);
    return;
  }

  const remainingMs = new Date(booking.tripEndsAt).getTime() - Date.now();

  // The deadline may have been pushed out by an extension after this job was
  // queued; in that case the rescheduled job will handle it.
  if (remainingMs > RENTAL_REMINDER_LEAD_MS) {
    logger.debug(`Job rental-reminder: Booking ${bookingId} deadline moved, skipping`);
    return;
  }

  const remainingMins = Math.max(0, Math.round(remainingMs / (1000 * 60)));

  await notifyUser({
    userId: booking.user?._id || booking.user,
    title: `Rental ends in ${remainingMins} min`,
    body: `Your rental of ${booking.vehicle?.name || 'the EV'} ends soon. Please head to the drop hub to return it on time.`,
    type: 'BOOKING',
    referenceId: booking._id,
    event: 'RENTAL_EXPIRING_SOON',
    data: {
      bookingId: booking.bookingId,
      status: booking.status,
      remainingMs,
      remainingMins,
      tripEndsAt: booking.tripEndsAt,
    },
  });

  booking.reminderSentAt = new Date();
  await booking.save();

  logger.info(`Job rental-reminder: Reminded user about booking ${booking.bookingId} (${remainingMins} min left)`);
};

/**
 * Flags a trip that blew past its deadline (plus grace) so the admin panel can
 * see it and the late fee starts accruing.
 */
export const rentalOverdueProcessor = async (job) => {
  const { bookingId } = job.data;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    logger.warn(`Job rental-overdue: Booking ${bookingId} not found`);
    return;
  }

  if (booking.status !== BOOKING_STATUS.ACTIVE) {
    logger.debug(`Job rental-overdue: Booking ${bookingId} is ${booking.status}, skipping`);
    return;
  }

  // An extension may have moved the deadline into the future after queueing.
  if (booking.tripEndsAt && new Date(booking.tripEndsAt) > new Date()) {
    logger.debug(`Job rental-overdue: Booking ${bookingId} deadline moved, skipping`);
    return;
  }

  logger.info(`Job rental-overdue: Flagging booking ${booking.bookingId} as overdue`);
  await handleStatusTransition(bookingId, BOOKING_STATUS.OVERDUE, {
    actorRole: 'SYSTEM',
    note: 'Return deadline passed',
  });
};
