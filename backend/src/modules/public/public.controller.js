import { PublicService } from './public.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class PublicController {
  static async getPublicStore(req, res, next) {
    try {
      const store = await PublicService.getPublicStore(req.params.slug);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Public store profile retrieved',
        data: store
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicCategories(req, res, next) {
    try {
      const categories = await PublicService.getPublicCategories(req.params.slug);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Active categories retrieved',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicCatalog(req, res, next) {
    try {
      const data = await PublicService.getPublicCatalog(req.params.slug, req.query);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Public catalog loaded successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerOrders(req, res, next) {
    try {
      const history = await PublicService.getCustomerOrderHistory(req.params.slug, req.params.phone);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Customer order history retrieved',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}