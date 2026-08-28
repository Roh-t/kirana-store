import { Product } from '../products/product.model.js';
import { Store } from '../stores/store.model.js';
import { AiOrderParserUtil } from '../../utils/aiOrderParser.util.js';
import { ApiError } from '../../utils/apiError.js';

export class AiOrderService {
  static async parseVoiceOrTextOrder(slug, rawText) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' });
    if (!store) {
      throw ApiError.notFound('Store not found');
    }

    const products = await Product.find({ storeId: store._id, isActive: true, isAvailable: true, isDeleted: false })
      .select('name regionalName unit unitQuantity mrp sellingPrice barcode categoryId')
      .lean();

    const parsed = AiOrderParserUtil.parseTextToListItems(rawText, products);

    return {
      store: { id: store._id, name: store.name, slug: store.slug },
      matchedItems: parsed.matchedItems,
      unmatchedNotes: parsed.unmatchedNotes,
      totalEstimate: parsed.matchedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    };
  }
}