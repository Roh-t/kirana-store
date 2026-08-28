import { CategoryService } from './category.service.js';
import { CategoryValidator } from './category.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class CategoryController {
  static async createCategory(req, res, next) {
    try {
      const validatedData = CategoryValidator.validateCreateCategory(req.body);
      const category = await CategoryService.createCategory(req.storeId, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const categories = await CategoryService.getCategoriesByStore(req.storeId, includeInactive);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Category details retrieved',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const validatedData = CategoryValidator.validateUpdateCategory(req.body);
      const updated = await CategoryService.updateCategory(req.storeId, req.params.id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Category updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const result = await CategoryService.deleteCategory(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Category soft-deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}