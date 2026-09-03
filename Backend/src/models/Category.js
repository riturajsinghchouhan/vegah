import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true }, // e.g. "Two-Wheeler"
  basePricePerKm: { type: Number, default: null },
  basePricePerMin: { type: Number, default: null },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
