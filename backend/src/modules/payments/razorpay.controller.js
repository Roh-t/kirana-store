import { RazorpayService } from './razorpay.service.js';
import { PayoutValidator } from './payout.validator.js';
import { PublicService } from '../public/public.service.js';
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

  static async onboardPayoutAccount(req, res, next) {
    try {
      const validatedData = PayoutValidator.validateOnboarding(req.body);
      const payoutAccount = await RazorpayService.createLinkedAccount(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Payout account submitted for verification',
        data: payoutAccount
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayoutAccountStatus(req, res, next) {
    try {
      const payoutAccount = await RazorpayService.getPayoutAccountStatus(req.storeId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Payout account status retrieved',
        data: payoutAccount
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Public (unauthenticated) customer order payment endpoints ---

  static async createPublicOrderPaymentIntent(req, res, next) {
    try {
      const store = await PublicService.getPublicStore(req.params.slug);
      const intent = await RazorpayService.createOrderPaymentIntent(store._id, req.params.orderId);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Online payment order created',
        data: intent
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPublicOrderPayment(req, res, next) {
    try {
      const store = await PublicService.getPublicStore(req.params.slug);
      const result = await RazorpayService.verifyOrderPayment(store._id, req.params.orderId, req.body);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Payment verified successfully',
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