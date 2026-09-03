import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'SUPER_ADMIN'], default: 'ADMIN' },
  avatarUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  refreshTokenHash: { type: String, default: null, select: false },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
