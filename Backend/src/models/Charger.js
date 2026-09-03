import mongoose from 'mongoose';

const { Schema } = mongoose;

const chargerSchema = new Schema({
  station: { type: Schema.Types.ObjectId, ref: 'ChargingStation', required: true },
  name: { type: String, required: true },
  speed: { type: String },
  connector: { type: String },
  status: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'AVAILABLE' },
  price: { type: Number },
}, { timestamps: true });

chargerSchema.index({ station: 1 });

const Charger = mongoose.model('Charger', chargerSchema);
export default Charger;
