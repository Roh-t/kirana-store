import { AiOrderService } from './aiOrder.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AiOrderController {
  static async parseOrder(req, res, next) {
    try {
      const { slug, rawText } = req.body;
      if (!slug || !rawText) {
        return res.status(400).json({ success: false, message: 'slug and rawText are required' });
      }

      const result = await AiOrderService.parseVoiceOrTextOrder(slug, rawText);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Voice/Text grocery order parsed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}