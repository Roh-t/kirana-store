import { MasterCatalogService } from './masterCatalog.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class MasterCatalogController {
  static async searchProducts(req, res, next) {
    try {
      const products = await MasterCatalogService.searchProducts(req.query.search, req.query.limit);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Master catalog suggestions retrieved',
        data: products
      });
    } catch (error) {
      next(error);
    }
  }
}
