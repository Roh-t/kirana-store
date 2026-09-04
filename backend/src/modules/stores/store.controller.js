import { StoreService } from './store.service.js';
import { StoreValidator } from './store.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class StoreController {
  static async createStore(req, res, next) {
    try {
      const validatedData = StoreValidator.validateCreateStore(req.body);
      const store = await StoreService.createStore(req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Store created successfully',
        data: store
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyStores(req, res, next) {
    try {
      const stores = await StoreService.getMyStores(req.user._id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Retrieved stores successfully',
        data: stores
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStoreById(req, res, next) {
    try {
      const store = await StoreService.getStoreById(req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store details retrieved',
        data: store
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicStoreBySlug(req, res, next) {
    try {
      const store = await StoreService.getPublicStoreBySlug(req.params.slug);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Public store storefront data retrieved',
        data: store
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStore(req, res, next) {
    try {
      const validatedData = StoreValidator.validateUpdateStore(req.body);
      const updatedStore = await StoreService.updateStore(req.params.id, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store configuration updated',
        data: updatedStore
      });
    } catch (error) {
      next(error);
    }
  }
}