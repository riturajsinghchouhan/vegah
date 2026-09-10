import admin from 'firebase-admin';
import firebaseApp from '../config/firebase.js';
import logger from '../utils/logger.js';

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
