import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';
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

  if (
    booking.status !== BOOKING_STATUS.RESERVED &&
    booking.status !== BOOKING_STATUS.PENDING_VERIFICATION &&
    booking.status !== BOOKING_STATUS.PAYMENT_INITIATED &&
    booking.status !== BOOKING_STATUS.PAYMENT_FAILED
  ) {
    throw new BadRequestError(`Cannot initiate payment for a booking with status: ${booking.status}`);
  }

  const razorpay = getRazorpayInstance();

  let razorpayOrderId = null;
  let razorpayKeyId = null;

  if (razorpay) {
    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: Math.round(booking.totalAmount * 100), // Amount in paise
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
    amount: booking.totalAmount,
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
    amount: booking.totalAmount,
    currency: 'INR',
    bookingId: booking.bookingId,
  };
};

export const verifyPayment = async ({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  const paymentQuery = razorpayOrderId 
    ? { booking: bookingId, razorpayOrderId }
    : { booking: bookingId };
    
  const payment = await Payment.findOne(paymentQuery).sort({ createdAt: -1 }).select('+razorpaySignature');
  if (!payment) throw new NotFoundError('Payment record not found');

  let signatureVerified = false;

  if (razorpayOrderId && razorpayPaymentId && razorpaySignature && env.RAZORPAY_KEY_SECRET) {
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
    signatureVerified = true;
  }

  payment.status = 'SUCCESS';
  payment.razorpayOrderId = razorpayOrderId || payment.razorpayOrderId;
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.signatureVerified = signatureVerified;
  payment.method = method || payment.method;
  payment.paidAt = new Date();
  await payment.save();

  const updatedBooking = await handleStatusTransition(bookingId, BOOKING_STATUS.PENDING_VERIFICATION);

  return { payment, booking: updatedBooking };
};

export const payWithWallet = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.user.toString() !== userId) {
    throw new BadRequestError('Unauthorized access to this booking');
  }

  if (
    booking.status !== BOOKING_STATUS.RESERVED &&
    booking.status !== BOOKING_STATUS.PENDING_VERIFICATION &&
    booking.status !== BOOKING_STATUS.PAYMENT_INITIATED &&
    booking.status !== BOOKING_STATUS.PAYMENT_FAILED
  ) {
    throw new BadRequestError(`Cannot pay for a booking with status: ${booking.status}`);
  }

  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  if (wallet.balance < booking.totalAmount) {
    throw new BadRequestError(`Insufficient wallet balance (₹${wallet.balance}). Booking total is ₹${booking.totalAmount}. Please add funds to your wallet.`);
  }

  // Deduct amount from wallet
  wallet.balance -= booking.totalAmount;
  await wallet.save();

  // Create Wallet Transaction
  await WalletTransaction.create({
    wallet: wallet._id,
    type: 'DEBIT',
    amount: booking.totalAmount,
    description: `Paid for Booking #${booking.bookingId}`,
    referenceType: 'BOOKING_PAYMENT',
    referenceId: booking._id,
  });

  // Create Payment record
  const payment = await Payment.create({
    booking: booking._id,
    amount: booking.totalAmount,
    method: 'WALLET',
    status: 'SUCCESS',
    paidAt: new Date(),
    idempotencyKey: `pay-wallet-${booking._id}-${Date.now()}`,
  });

  // Transition Booking to PENDING_VERIFICATION
  const updatedBooking = await handleStatusTransition(bookingId, BOOKING_STATUS.PENDING_VERIFICATION);

  return { payment, booking: updatedBooking };
};
