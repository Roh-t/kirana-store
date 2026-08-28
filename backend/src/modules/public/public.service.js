import { Store } from '../stores/store.model.js';
import { Category } from '../categories/category.model.js';
import { Product } from '../products/product.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { Order } from '../orders/order.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/apiError.js';

export class PublicService {
  static async getPublicStore(slug) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' }).select(
      'name slug phone logoUrl address businessConfig qrConfig'
    );

    if (!store) {
      throw ApiError.notFound('Kirana store not found or currently offline');
    }

    return store;
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

    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { regionalName: searchRegex }, { brand: searchRegex }];
    }

    const products = await Product.find(query)
      .select('name regionalName brand unit unitQuantity mrp sellingPrice taxRate imageUrl categoryId barcode')
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

    const catalog = products.map((p) => {
      const stock = stockMap.get(p._id.toString()) ?? 0;
      return {
        ...p.toObject(),
        stockQuantity: stock,
        inStock: stock > 0
      };
    });

    return {
      store,
      catalog
    };
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
      .select('orderNumber orderType items subTotal grandTotal orderStatus createdAt')
      .populate({
        path: 'items.productId',
        select: 'name regionalName unit unitQuantity sellingPrice mrp isAvailable isDeleted'
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