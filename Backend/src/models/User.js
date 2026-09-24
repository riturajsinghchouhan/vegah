import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: { type: String, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  avatarUrl: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  membership: { type: String, enum: ['standard', 'premium'], default: 'standard' },
  savedLocations: [{ 
    label: String, 
    latitude: Number, 
    longitude: Number 
  }],
  refreshTokenHash: { type: String, default: null, select: false },
  fcmTokens: [{ type: String }],
  fcmTokenMobile: [{ type: String }],
  lastLoginAt: { type: Date, default: null },
  kycDetails: {
    aadharNumber: { type: String, default: null },
    aadharFrontImage: { type: String, default: null },
    aadharBackImage: { type: String, default: null },
    licenseNumber: { type: String, default: null },
    licenseFrontImage: { type: String, default: null },
    licenseBackImage: { type: String, default: null },
    isVerified: { type: Boolean, default: false }
  },
}, { timestamps: true });

userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
