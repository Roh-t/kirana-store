import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, uppercase: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Object, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ storeId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);