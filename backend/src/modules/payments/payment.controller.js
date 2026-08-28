import { PaymentService } from './payment.service.js';
import { PaymentValidator } from './payment.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class PaymentController {
  static async recordPayment(req, res, next) {
    try {
      const validatedData = PaymentValidator.validateRecordPayment(req.body);
      const result = await PaymentService.recordPayment(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Payment recorded successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUpiQrPayload(req, res, next) {
    try {
      const upiData = await PaymentService.generateStoreUpiQrPayload(req.storeId, req.params.orderId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store UPI QR details generated',
        data: upiData
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentsByOrder(req, res, next) {
    try {
      const payments = await PaymentService.getPaymentsByOrder(req.storeId, req.params.orderId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Payment logs retrieved',
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }
}