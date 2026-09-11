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

  static async getStoreAuditLogs(storeId, { limit = 100, from, to } = {}) {
    const query = { storeId };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lt = new Date(to);
    }

    return AuditLog.find(query)
      .populate('actorId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(Number(limit) || 100, 1), 500));
  }
}