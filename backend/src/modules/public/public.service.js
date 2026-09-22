import { Store } from '../stores/store.model.js';
import { Category } from '../categories/category.model.js';
import { Product } from '../products/product.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { Order } from '../orders/order.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/apiError.js';
import { getStoreAvailability } from '../stores/storeHours.util.js';
import {
  getOrLoadProductSearchIndex,
  prepareProductSearchIndex,
  rankProducts
} from '../../utils/productSearch.util.js';

export class PublicService {
  static async getPublicStore(slug) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' })
      .select('name slug phone logoUrl address businessConfig qrConfig ownerId')
      .populate('ownerId', 'phone');

    if (!store) {
      throw ApiError.notFound('Kirana store not found or currently offline');
    }

    // ownerPhone is the store owner's actual login account number, used for
    // owner-facing notifications (e.g. WhatsApp new-order alerts). This is
    // more reliable than the free-text "phone" field which can be mistyped
    // or duplicated across stores.
    const ownerPhone = store.ownerId?.phone || null;

    return {
      ...store.toObject(),
      ownerId: store.ownerId?._id,
      ownerPhone,
      availability: getStoreAvailability(store)
    };
  }

  static async getPublicCategories(slug) {
    const store = await this.getPublicStore(slug);

    return Category.find({ storeId: store._id, isActive: true, isDeleted: false })
      .select('name slug description imageUrl sortOrder')
      .sort({ sortOrder: 1, name: 1 });
  }

  static async getPublicCatalog(slug, options = {}) {
    const { categorySlug, search } = options;
    const store = await this.getPublicStore(slug);

    const query = { storeId: store._id, isActive: true, isAvailable: true, isDeleted: false };

    if (categorySlug) {
      const category = await Category.findOne({ storeId: store._id, slug: categorySlug, isDeleted: false });
      if (category) {
        query.categoryId = category._id;
      }
    }

    const products = await Product.find(query)
      .select('name catalogName regionalName sourceName exactCategory subCategory sourceCategory hindiName hinglishName indianCategory indianSubCategory brand unit unitQuantity allowPartialSale mrp sellingPrice taxRate imageUrl categoryId barcode')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    const productIds = products.map((p) => p._id);
    const inventories = await Inventory.find({ storeId: store._id, productId: { $in: productIds } }).select(
      'productId stockQuantity reorderPoint'
    );

    const stockMap = new Map();
    inventories.forEach((inv) => {
      stockMap.set(inv.productId.toString(), inv.stockQuantity);
    });

    const searchableProducts = products.map((product) => ({
      ...product.toObject(),
      categoryName: product.categoryId?.name || null
    }));
    const rankedProducts = rankProducts(searchableProducts, search);
    const catalog = rankedProducts.map((p) => {
      const stock = stockMap.get(p._id.toString()) ?? 0;
      return {
        ...p,
        stockQuantity: stock,
        inStock: stock > 0
      };
    }).filter((product) => product.stockQuantity > 0);

    return {
      store,
      catalog
    };
  }

  static async getPublicCatalogSuggestions(slug, query = '', limit = 8) {
    const store = await this.getPublicStore(slug);
    const searchableProducts = await getOrLoadProductSearchIndex(store._id, async () => {
      const products = await Product.find({ storeId: store._id, isDeleted: false })
        .select('name catalogName regionalName sourceName exactCategory subCategory sourceCategory hindiName hinglishName indianCategory indianSubCategory brand unit unitQuantity imageUrl sellingPrice mrp categoryId isActive isAvailable')
        .populate('categoryId', 'name slug')
        .lean();
      return prepareProductSearchIndex(
        products.map((product) => ({ ...product, categoryName: product.categoryId?.name || null }))
      );
    });

    const availableProducts = searchableProducts.filter((product) => product.isActive !== false && product.isAvailable !== false);
    const rankedProducts = rankProducts(availableProducts, query);
    if (rankedProducts.length === 0) return [];

    const inventories = await Inventory.find({
      storeId: store._id,
      stockQuantity: { $gt: 0 },
      productId: { $in: rankedProducts.map((product) => product._id) }
    }).select('productId stockQuantity').lean();
    const stockMap = new Map(inventories.map((inventory) => [inventory.productId.toString(), inventory.stockQuantity]));

    return rankedProducts
      .filter((product) => stockMap.has(product._id.toString()))
      .slice(0, Math.min(Math.max(Number(limit) || 8, 1), 10))
      .map((product) => ({
        _id: product._id,
        name: product.name,
        catalogName: product.catalogName,
        categoryName: product.categoryName,
        imageUrl: product.imageUrl,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp,
        stockQuantity: stockMap.get(product._id.toString())
      }));
  }

  static async getCustomerOrderHistory(slug, rawPhone) {
    const store = await this.getPublicStore(slug);

    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.length === 10) cleaned = `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = `+${cleaned}`;

    const customer = await Customer.findOne({ storeId: store._id, phone: cleaned });
    if (!customer) {
      return { orders: [], customer: null };
    }

    const orders = await Order.find({ storeId: store._id, customerId: customer._id })
      .select('orderNumber orderType items subTotal grandTotal orderStatus paymentStatus estimatedReadyAt createdAt')
      .populate({
        path: 'items.productId',
        select: 'name regionalName unit unitQuantity allowPartialSale sellingPrice mrp isAvailable isDeleted'
      })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      customer: {
        name: customer.name,
        phone: customer.phone,
        totalOrders: customer.totalOrders
      },
      orders
    };
  }
}