import mongoose from 'mongoose';

const { Schema } = mongoose;

const zoneSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  subtitle: { type: String, default: '' },
  unit: { type: String, default: 'kilometer' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  boundary: { type: Schema.Types.Mixed, default: null }, // GeoJSON polygon
  pickupLocation: {
    address: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  dropLocation: {
    address: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

zoneSchema.index({ status: 1 });

const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
