import { ApiError } from '../../utils/apiError.js';

export class ProductValidator {
  static validateCreateProduct(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Product name must be between 2 and 150 characters' });
    }

    if (!data.categoryId) {
      errors.push({ field: 'categoryId', message: 'Category selection is required' });
    }

    const validUnits = ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACKET', 'DOZEN'];
    if (!data.unit || !validUnits.includes(data.unit.toUpperCase())) {
      errors.push({ field: 'unit', message: `Unit must be one of: ${validUnits.join(', ')}` });
    }

    if (data.mrp === undefined || typeof data.mrp !== 'number' || data.mrp < 0) {
      errors.push({ field: 'mrp', message: 'Valid MRP (Maximum Retail Price) is required' });
    }

    if (data.sellingPrice === undefined || typeof data.sellingPrice !== 'number' || data.sellingPrice < 0) {
      errors.push({ field: 'sellingPrice', message: 'Valid Selling Price is required' });
    } else if (data.mrp !== undefined && data.sellingPrice > data.mrp) {
      errors.push({ field: 'sellingPrice', message: 'Selling Price cannot be greater than MRP' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      name: data.name.trim(),
      regionalName: data.regionalName ? data.regionalName.trim() : null,
      categoryId: data.categoryId,
      brand: data.brand ? data.brand.trim() : null,
      sku: data.sku ? data.sku.trim().toUpperCase() : null,
      barcode: data.barcode ? data.barcode.trim() : null,
      unit: data.unit.toUpperCase(),
      unitQuantity: data.unitQuantity ? Number(data.unitQuantity) : 1,
      mrp: Number(data.mrp),
      sellingPrice: Number(data.sellingPrice),
      purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : 0,
      taxRate: data.taxRate ? Number(data.taxRate) : 0,
      hsnCode: data.hsnCode ? data.hsnCode.trim() : null,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true
    };
  }

  static validateUpdateProduct(data) {
    if (data.sellingPrice !== undefined && data.mrp !== undefined && data.sellingPrice > data.mrp) {
      throw ApiError.badRequest('Validation failed', [{ field: 'sellingPrice', message: 'Selling price cannot exceed MRP' }]);
    }
    return data;
  }
}