import { AuditService } from './audit.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AuditController {
  static async getAuditLogs(req, res, next) {
    try {
      const logs = await AuditService.getStoreAuditLogs(req.storeId, req.query.limit);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store security audit logs retrieved',
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}