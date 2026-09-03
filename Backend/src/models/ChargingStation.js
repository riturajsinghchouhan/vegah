import mongoose from 'mongoose';

const { Schema } = mongoose;

const chargingStationSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  status: { type: String, enum: ['AVAILABLE', 'BUSY', 'UNAVAILABLE'], default: 'AVAILABLE' },
  openStatus: { type: String },
  chargingType: { type: String },
  speedLabel: { type: String },
  connector: { type: String },
  connectorTypes: [{ type: String }],
  pricePerKwh: { type: Number },
  availablePorts: { type: Number, default: 0 },
  totalPorts: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  amenities: [{ type: String }],
  supportedVehicles: [{ type: String }],
  paymentMethods: [{ type: String }],
  operatingHours: { type: String },
  imageUrl: { type: String },
}, { timestamps: true });

chargingStationSchema.index({ 'coordinates': '2dsphere' });
chargingStationSchema.index({ status: 1 });

const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);
export default ChargingStation;
