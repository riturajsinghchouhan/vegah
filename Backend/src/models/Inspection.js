import mongoose from 'mongoose';

const { Schema } = mongoose;

const inspectionSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  type: { type: String, enum: ['PICKUP', 'RETURN'], required: true },
  status: { type: String, enum: ['PASSED', 'DAMAGE_FOUND', 'NEEDS_MAINTENANCE'], required: true },
  inspector: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  findings: { type: Schema.Types.Mixed, default: null },
  photos: [{ type: String }], // Cloudinary URLs
  notes: { type: String, default: null },
  inspectedAt: { type: Date, default: Date.now },
}, { timestamps: true });

inspectionSchema.index({ booking: 1 });

const Inspection = mongoose.model('Inspection', inspectionSchema);
export default Inspection;
