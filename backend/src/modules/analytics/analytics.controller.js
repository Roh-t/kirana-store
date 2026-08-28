import { AnalyticsService } from './analytics.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AnalyticsController {
  static async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await AnalyticsService.getDashboardMetrics(req.storeId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store analytics retrieved successfully',
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}