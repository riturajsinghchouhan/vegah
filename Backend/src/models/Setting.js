import mongoose from 'mongoose';

const { Schema } = mongoose;

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String }, // "general", "booking", "pricing", "notifications"
  updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
