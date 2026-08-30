import { RazorpayService } from './razorpay.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class RazorpayController {
  static async createOrder(req, res, next) {
    try {
      const plan = req.body?.plan || 'PRO';
      const orderData = await RazorpayService.createSubscriptionOrder(req.storeId, req.user._id, plan);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Razorpay payment order created',
        data: orderData
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req, res, next) {
    try {
      const result = await RazorpayService.verifyPaymentAndActivateSubscription(
        req.storeId,
        req.user._id,
        req.body
      );

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Payment verified and SaaS subscription activated!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await RazorpayService.handleRazorpayWebhook(req.body, signature);

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
}