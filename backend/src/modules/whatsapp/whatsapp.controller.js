import { WhatsAppService } from './whatsapp.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class WhatsAppController {
  static async getOrderWhatsAppLink(req, res, next) {
    try {
      const data = await WhatsAppService.getOrderWhatsAppLink(req.storeId, req.params.orderId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'WhatsApp order link generated',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUdharWhatsAppLink(req, res, next) {
    try {
      const data = await WhatsAppService.getUdharWhatsAppLink(req.storeId, req.params.customerId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'WhatsApp Udhar reminder link generated',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}