import mongoose from 'mongoose';

const { Schema } = mongoose;

const vehicleSchema = new Schema({
  plateNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  type: { type: String, required: true }, // "Scoots", "Bikes"
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  rangeKm: { type: Number, required: true },
  batteryCapacity: { type: String, required: true }, // "3.7 kWh"
  batteryPercent: { type: Number, default: 100, min: 0, max: 100 },
  chargeTime: { type: String },
  chargingInfo: { type: String },
  seats: { type: Number, default: 2 },
  features: [{ type: String }],
  location: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  pickupNote: { type: String, default: '' },
  pricePerHour: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  securityDeposit: { type: Number, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'RESERVED', 'MAINTENANCE', 'INACTIVE'],
    default: 'AVAILABLE',
    index: true,
  },
  images: [{ 
    url: String, 
    isPrimary: { type: Boolean, default: false } 
  }],
  deletedAt: { type: Date, default: null },
  __v_lock: { type: Number, default: 0 }, // Optimistic locking
}, { timestamps: true });

vehicleSchema.index({ zone: 1, status: 1 });
vehicleSchema.index({ type: 1, status: 1 });
vehicleSchema.index({ category: 1, status: 1 });
vehicleSchema.index({ pricePerDay: 1 });
vehicleSchema.index({ pricePerHour: 1 });
vehicleSchema.index({ 'coordinates': '2dsphere' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
