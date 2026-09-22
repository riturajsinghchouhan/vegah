import admin from 'firebase-admin';
import firebaseApp from '../config/firebase.js';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';

export const sendPushNotification = async ({ targetToken, topic, title, body, data = {} }) => {
  if (!firebaseApp) {
    logger.debug('Push Notification skipped: Firebase Admin SDK not initialized.');
    return null;
  }

  try {
    const payload = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: '/admin/bookings',
      },
    };

    if (targetToken) {
      payload.token = targetToken;
    } else if (topic) {
      payload.topic = topic;
    } else {
      payload.topic = 'admin_bookings';
    }

    const response = await admin.messaging().send(payload);
    logger.info(`Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending push notification: ${error.message}`);
    return null;
  }
};

export const sendAdminBookingNotification = async (booking) => {
  const vehicleName = booking.vehicle?.name || 'EV Scooter';
  const amount = booking.totalAmount || booking.amount || 0;
  const bookingId = booking.bookingId || booking._id || 'EVR-NEW';

  return sendPushNotification({
    topic: 'admin_bookings',
    title: '🚀 New EV Booking Received!',
    body: `Booking ID: ${bookingId} for ${vehicleName} (₹${amount})`,
    data: {
      bookingId: String(bookingId),
      type: 'NEW_BOOKING',
      vehicleName,
      amount: String(amount),
    },
  });
};

/**
 * Deliver a message to one user across every channel we have:
 * persisted (so it survives an offline app), socket (live in-app), and FCM push
 * (targeted at the user's own device token, not a broadcast topic).
 *
 * Never throws - notification delivery must not roll back the booking action
 * that triggered it.
 */
export const notifyUser = async ({ userId, title, body, type = 'BOOKING', referenceId = null, event, data = {} }) => {
  const userIdStr = String(userId);

  try {
    await Notification.create({ user: userIdStr, title, body, type, referenceId });
  } catch (err) {
    logger.error(`Failed to persist notification for user ${userIdStr}: ${err.message}`);
  }

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userIdStr}`).emit(event || 'NOTIFICATION', { title, body, type, referenceId, ...data });
    }
  } catch (err) {
    logger.error(`Socket notification failed for user ${userIdStr}: ${err.message}`);
  }

  try {
    const user = await User.findById(userIdStr).select('fcmToken');
    if (user?.fcmToken) {
      await sendPushNotification({
        targetToken: user.fcmToken,
        title,
        body,
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    }
  } catch (err) {
    logger.error(`Push notification failed for user ${userIdStr}: ${err.message}`);
  }
};

/**
 * Tell every admin in the panel that a booking needs their attention
 * (a user has dropped a vehicle and is waiting for return verification).
 */
export const notifyAdmins = async ({ event, title, body, payload = {} }) => {
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit(event || 'ADMIN_ALERT', { title, body, ...payload });
    }
  } catch (err) {
    logger.error(`Socket admin notification failed: ${err.message}`);
  }

  try {
    await sendPushNotification({ topic: 'admin_bookings', title, body, data: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) });
  } catch (err) {
    logger.error(`Admin push notification failed: ${err.message}`);
  }
};
