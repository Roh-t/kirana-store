import { MasterProduct } from './masterProduct.model.js';

export class MasterCatalogService {
  static async searchProducts(search = '', limit = 8) {
    const normalizedSearch = String(search).trim();
    if (normalizedSearch.length < 2) return [];

    const searchRegex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return MasterProduct.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { alias: searchRegex },
        { categoryName: searchRegex }
      ]
    })
      .select('name alias categoryId categoryName imageUrl sellingPrice mrp')
      .sort({ name: 1 })
      .limit(Math.min(Math.max(Number(limit) || 8, 1), 20))
      .lean();
  }
}
