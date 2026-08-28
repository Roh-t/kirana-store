import { ProductService } from './product.service.js';
import { ProductValidator } from './product.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ProductController {
  static async createProduct(req, res, next) {
    try {
      const validatedData = ProductValidator.validateCreateProduct(req.body);
      const product = await ProductService.createProduct(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Product added to catalog successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req, res, next) {
    try {
      const { products, pagination } = await ProductService.getProductsByStore(req.storeId, req.query);

      return ApiResponse.paginated(res, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: products,
        pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Product details retrieved',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const validatedData = ProductValidator.validateUpdateProduct(req.body);
      const updated = await ProductService.updateProduct(req.storeId, req.user._id, req.params.id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Product updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const result = await ProductService.deleteProduct(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Product soft-deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}