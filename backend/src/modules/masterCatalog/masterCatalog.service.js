import { MasterProduct } from './masterProduct.model.js';
import { transliterateHindi } from '../../utils/indianSearch.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class MasterCatalogService {
  static async searchProducts(search = '', limit = 8) {
    const normalizedSearch = String(search).trim();
    if (normalizedSearch.length < 2) return [];

    const searchValues = [...new Set([normalizedSearch, transliterateHindi(normalizedSearch)])
      .map((value) => value.trim())
      .filter(Boolean)];
    const searchRegexes = searchValues.map((value) => new RegExp(escapeRegex(value), 'i'));
    return MasterProduct.find({
      isActive: true,
      $or: [
        ...searchRegexes.flatMap((searchRegex) => [
          { name: searchRegex },
          { catalogName: searchRegex },
          { hindiName: searchRegex },
          { hinglishName: searchRegex },
          { alias: searchRegex },
          { categoryName: searchRegex },
          { indianCategory: searchRegex },
          { indianSubCategory: searchRegex },
          { searchText: searchRegex }
        ])
      ]
    })
      .select('name catalogName hindiName hinglishName alias categoryId categoryName indianCategory indianSubCategory imageUrl unit unitQuantity sellingPrice mrp')
      .sort({ name: 1 })
      .limit(Math.min(Math.max(Number(limit) || 8, 1), 20))
      .lean();
  }
}
