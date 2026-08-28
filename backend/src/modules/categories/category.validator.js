import { ApiError } from '../../utils/apiError.js';

export class CategoryValidator {
  static validateCreateCategory(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 50) {
      errors.push({ field: 'name', message: 'Category name must be between 2 and 50 characters long' });
    }

    if (data.description && data.description.length > 200) {
      errors.push({ field: 'description', message: 'Description cannot exceed 200 characters' });
    }

    if (data.sortOrder !== undefined && (typeof data.sortOrder !== 'number' || data.sortOrder < 0)) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be a positive number' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      imageUrl: data.imageUrl || null,
      sortOrder: data.sortOrder || 0
    };
  }

  static validateUpdateCategory(data) {
    if (data.name !== undefined && (data.name.trim().length < 2 || data.name.trim().length > 50)) {
      throw ApiError.badRequest('Validation failed', [{ field: 'name', message: 'Category name must be 2-50 chars' }]);
    }
    return data;
  }
}