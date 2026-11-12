import mongoose from 'mongoose';

const { Schema } = mongoose;

export const EXTENSION_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

/**
 * A rider's request to extend a rental and pay cash at the hub. The rental is
 * only extended once an admin approves, so the time and the CASH payment row
 * are both created at approval time, not when the request is raised.
 */
const extensionRequestSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  planId: { type: String, required: true },
  planName: { type: String, default: '' },
  durationDays: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 },

  status: { type: String, enum: EXTENSION_REQUEST_STATUSES, default: 'PENDING', index: true },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  decidedAt: { type: Date, default: null },
  rejectionReason: { type: String, trim: true, maxlength: 300, default: null },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
}, { timestamps: true });

// A booking may only ever have one request awaiting a decision.
extensionRequestSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

const ExtensionRequest = mongoose.model('ExtensionRequest', extensionRequestSchema);
export default ExtensionRequest;
