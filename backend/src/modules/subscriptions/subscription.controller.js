import { SubscriptionService } from './subscription.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class SubscriptionController {
  static async getSubscription(req, res, next) {
    try {
      const data = await SubscriptionService.getStoreSubscription(req.storeId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Subscription plan and usage limits retrieved',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async upgradePlan(req, res, next) {
    try {
      const { plan } = req.body;
      const updated = await SubscriptionService.upgradePlan(req.storeId, plan || 'PRO');

      return ApiResponse.success(res, {
        statusCode: 200,
        message: `SaaS plan upgraded to ${plan}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}