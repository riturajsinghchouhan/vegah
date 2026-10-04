import mongoose from 'mongoose';

const { Schema } = mongoose;

// One row per battery swap the rider actually initiated through our app.
// This is the source of truth for "how many times has this user swapped" -
// Electica's own /swaps API never carries a userId, so it cannot answer that.
const batterySwapLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  stationId: { type: String, required: true },
  electicaSwapId: { type: String, default: null },
  status: { type: String, default: 'initiated' },
  initiatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

batterySwapLogSchema.index({ user: 1, initiatedAt: -1 });

const BatterySwapLog = mongoose.model('BatterySwapLog', batterySwapLogSchema);
export default BatterySwapLog;
