import mongoose from 'mongoose';

const { Schema } = mongoose;

const documentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['AADHAR', 'DRIVING_LICENSE', 'SELFIE'], required: true },
  documentNumber: { type: String, default: null },
  fileUrl: { type: String, required: true }, // Cloudinary URL
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
}, { timestamps: true });

documentSchema.index({ user: 1, type: 1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;
