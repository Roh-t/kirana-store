import { AuditLog } from './auditLog.model.js';

export class AuditService {
  static buildActorLabel(actor = {}) {
    const name = actor?.name?.trim();
    const phone = actor?.phone?.trim();
    const email = actor?.email?.trim();

    if (!name && !phone && !email) return 'System';

    const details = [phone, email].filter(Boolean);
    return details.length ? `${name || 'Unknown User'} (${details.join(' • ')})` : (name || 'Unknown User');
  }

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
      .populate('actorId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
}