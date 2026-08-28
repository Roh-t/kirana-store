import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminController {
  static async getMetrics(req, res, next) {
    try {
      const metrics = await AdminService.getPlatformMetrics();

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Platform metrics loaded',
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStores(req, res, next) {
    try {
      const { stores, pagination } = await AdminService.getAllStores(req.query);

      return ApiResponse.paginated(res, {
        statusCode: 200,
        message: 'All platform stores retrieved',
        data: stores,
        pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await AdminService.toggleStoreStatus(req.params.id, status);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: `Store status updated to ${status}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}