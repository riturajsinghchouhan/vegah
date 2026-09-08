import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import env from '../../config/env.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { handleStatusTransition } from '../bookings/bookings.service.js';
import { BOOKING_STATUS } from '../bookings/bookings.constants.js';

const getRazorpayInstance = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export const initiatePayment = async (bookingId, userId, method = 'UPI') => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.user.toString() !== userId) {
    throw new BadRequestError('Unauthorized access to this booking');
  }

  if (booking.status !== BOOKING_STATUS.RESERVED && booking.status !== BOOKING_STATUS.PENDING_VERIFICATION) {
    throw new BadRequestError(`Cannot initiate payment for a booking with status: ${booking.status}`);
  }

  const razorpay = getRazorpayInstance();

  let razorpayOrderId = null;
  let razorpayKeyId = null;

  if (razorpay) {
    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: Math.round(booking.total * 100), // Amount in paise
      currency: 'INR',
      receipt: booking.bookingId,
      notes: { bookingId: booking._id.toString(), userId },
    });
    razorpayOrderId = order.id;
    razorpayKeyId = env.RAZORPAY_KEY_ID;
  }

  // Create a Payment record
  const payment = await Payment.create({
    booking: booking._id,
    amount: booking.total,
    method,
    status: 'INITIATED',
    razorpayOrderId,
    idempotencyKey: `pay-${booking._id}-${Date.now()}`,
  });

  // Update booking status
  await handleStatusTransition(bookingId, BOOKING_STATUS.PAYMENT_INITIATED);

  return {
    payment,
    razorpayOrderId,
    razorpayKeyId,
    amount: booking.total,
    currency: 'INR',
    bookingId: booking.bookingId,
  };
};

export const verifyPayment = async ({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  const payment = await Payment.findOne({ booking: bookingId }).select('+razorpaySignature');
  if (!payment) throw new NotFoundError('Payment record not found');

  let signatureVerified = false;

  if (razorpayOrderId && razorpayPaymentId && razorpaySignature && env.RAZORPAY_KEY_SECRET) {
    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    signatureVerified = expectedSignature === razorpaySignature;

    if (!signatureVerified) {
      payment.status = 'FAILED';
      await payment.save();
      await handleStatusTransition(bookingId, BOOKING_STATUS.PAYMENT_FAILED);
      throw new BadRequestError('Payment verification failed: Invalid signature');
    }
  } else {
    // Dev mode: no Razorpay configured, auto-verify
    signatureVerified = true;
  }

  // Update payment record
  payment.status = 'SUCCESS';
  payment.razorpayOrderId = razorpayOrderId || payment.razorpayOrderId;
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.signatureVerified = signatureVerified;
  payment.method = method || payment.method;
  payment.paidAt = new Date();
  await payment.save();

  // Confirm the booking
  const confirmedBooking = await handleStatusTransition(bookingId, BOOKING_STATUS.CONFIRMED);

  return { payment, booking: confirmedBooking };
};
