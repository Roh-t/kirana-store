import { ApiError } from '../../utils/apiError.js';

export class InventoryValidator {
  static validateStockAdjustment(data) {
    const errors = [];

    if (!data.productId) {
      errors.push({ field: 'productId', message: 'Product ID is required' });
    }

    if (data.quantityDelta === undefined || typeof data.quantityDelta !== 'number' || data.quantityDelta === 0) {
      errors.push({ field: 'quantityDelta', message: 'Valid non-zero quantity shift is required' });
    }

    const validTypes = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'CORRECTION'];
    if (!data.type || !validTypes.includes(data.type.toUpperCase())) {
      errors.push({ field: 'type', message: `Type must be one of: ${validTypes.join(', ')}` });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      productId: data.productId,
      quantityDelta: Number(data.quantityDelta),
      type: data.type.toUpperCase(),
      reason: data.reason ? data.reason.trim() : null
    };
  }

  static validateUpdateThreshold(data) {
    if (data.reorderPoint === undefined || typeof data.reorderPoint !== 'number' || data.reorderPoint < 0) {
      throw ApiError.badRequest('Validation failed', [{ field: 'reorderPoint', message: 'Reorder point must be >= 0' }]);
    }
    return { reorderPoint: Number(data.reorderPoint) };
  }
}