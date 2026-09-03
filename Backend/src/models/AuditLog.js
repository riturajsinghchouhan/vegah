import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, default: null },
  actorType: { type: String, enum: ['USER', 'ADMIN', 'SYSTEM'], required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: null },
  requestId: { type: String, default: null },
}, { timestamps: true });

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
