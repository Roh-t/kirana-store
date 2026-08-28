import { AuditLog } from './auditLog.model.js';

export class AuditService {
  static async recordLog(storeId, actorId, action, entityType, entityId, metadata = null) {
    try {
      await AuditLog.create({
        storeId,
        actorId,
        action: action.toUpperCase(),
        entityType,
        entityId,
        metadata
      });
    } catch (err) {
      console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    }
  }

  static async getStoreAuditLogs(storeId, limit = 30) {
    return AuditLog.find({ storeId })
      .populate('actorId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
}