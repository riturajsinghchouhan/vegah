import admin from 'firebase-admin';
import firebaseApp from '../config/firebase.js';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';

import { sendNotificationToOwner, sendPushNotification as sendRawPush } from './firebase.service.js';

export const sendPushNotification = async ({ targetToken, topic, title, body, data = {} }) => {
  const payload = { title, body, data: { ...data, click_action: '/admin/bookings' } };
  
  if (targetToken) {
    return sendRawPush([targetToken], payload);
  } else if (topic) {
    if (!admin) return null;
    try {
      const message = { notification: { title, body }, data: payload.data, topic };
      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent to topic ${topic}`);
      return response;
    } catch (err) {
      logger.error(`Error sending push to topic: ${err.message}`);
      return null;
    }
  } else {
    // default to admin_bookings topic
    return sendPushNotification({ topic: 'admin_bookings', title, body, data });
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

  // Use the advanced sendNotificationToOwner which handles multiple tokens and cleanup
  await sendNotificationToOwner({
    ownerType: 'USER',
    ownerId: userIdStr,
    payload: {
      title,
      body,
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
    }
  });
};

export const notifyAdmins = async ({ event, title, body, payload = {} }) => {
  try {
    const io = getIO();
    if (io) {
      io.to('admin_room').emit(event || 'ADMIN_ALERT', { title, body, ...payload });
    }
  } catch (err) {
    logger.error(`Socket admin notification failed: ${err.message}`);
  }

  // Currently admins are notified via global topic. 
  // We can leave this as topic broadcast or update to target actual admin documents.
  // For now, keeping the topic backward compatibility
  try {
    await sendPushNotification({ 
      topic: 'admin_bookings', 
      title, 
      body, 
      data: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) 
    });
  } catch (err) {
    logger.error(`Admin push notification failed: ${err.message}`);
  }
};
