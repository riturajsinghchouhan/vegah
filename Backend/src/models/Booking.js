import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema({
  bookingId: { type: String, required: true, unique: true }, // "EVR-12345"
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  rentalType: { type: String, enum: ['HOURLY', 'DAILY'], required: true },
  startDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endDate: { type: Date, required: true },
  endTime: { type: String, required: true },
  actualReturnAt: { type: Date, default: null },
  pickupLocation: { type: String, required: true },
  batteryPackage: { type: String, enum: ['NONE', 'SINGLE', 'UNLIMITED'], default: 'SINGLE' },

  rentalBase: { type: Number, required: true },
  batteryPackageFee: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  securityDeposit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },

  status: {
    type: String,
    enum: [
      'RESERVED',
      'PENDING_VERIFICATION',
      'PAYMENT_INITIATED',
      'CONFIRMED',
      'ACTIVE',
      'COMPLETED',
      'OVERDUE',
      'CANCELLED_BY_USER',
      'CANCELLED_BY_ADMIN',
      'CANCELLED_BY_SYSTEM',
      'PAYMENT_FAILED',
      'RESERVATION_EXPIRED',
    ],
    required: true,
    index: true,
  },

  reservationExpiresAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, enum: ['USER', 'ADMIN', 'SYSTEM'], default: null },
  cancelledAt: { type: Date, default: null },
  notes: { type: String, default: null },
  idempotencyKey: { type: String, unique: true, sparse: true },
  depositStatus: { type: String, enum: ['PENDING', 'COLLECTED', 'REFUNDED'], default: 'PENDING' },
}, { timestamps: true });

bookingSchema.index({ user: 1, status: 1, createdAt: -1 });
bookingSchema.index({ vehicle: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
// TTL index for informational purposes, actual expiry handled by BullMQ
bookingSchema.index(
  { reservationExpiresAt: 1 }, 
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'RESERVED' } }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
