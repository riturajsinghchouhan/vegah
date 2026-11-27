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

  // What a GST invoice needs that a rider profile otherwise has no reason to
  // carry. `stateCode` decides whether a booking attracts CGST+SGST or IGST, so
  // it is the one field here that changes the tax on the invoice; when it is
  // blank the business's own state is assumed and the rider is billed as an
  // unregistered consumer.
  billing: {
    gstin: { type: String, trim: true, uppercase: true, default: null },
    companyName: { type: String, trim: true, maxlength: 150, default: null },
    stateCode: { type: String, trim: true, uppercase: true, default: null },
    address: { type: String, trim: true, maxlength: 200, default: null },
    city: { type: String, trim: true, maxlength: 80, default: null },
    pincode: { type: String, trim: true, maxlength: 10, default: null },
  },
}, { timestamps: true });

userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
