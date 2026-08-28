import { Inventory } from './inventory.model.js';
import { InventoryTransaction } from './inventoryTransaction.model.js';
import { Product } from '../products/product.model.js';
import { ApiError } from '../../utils/apiError.js';

export class InventoryService {
  static async getInventoryByStore(storeId, filters = {}) {
    const query = { storeId };

    if (filters.lowStock === 'true') {
      // Find items where stockQuantity <= reorderPoint
      query.$expr = { $lte: ['$stockQuantity', '$reorderPoint'] };
    }

    const inventoryRecords = await Inventory.find(query)
      .populate({
        path: 'productId',
        select: 'name regionalName unit unitQuantity mrp sellingPrice barcode isAvailable categoryId',
        populate: { path: 'categoryId', select: 'name' }
      })
      .sort({ stockQuantity: 1 });

    // Filter out deleted products if any
    return inventoryRecords.filter((inv) => inv.productId && !inv.productId.isDeleted);
  }

  static async adjustStock(storeId, userId, validatedData) {
    const { productId, quantityDelta, type, reason } = validatedData;

    // 1. Find product and verify tenant ownership
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false });
    if (!product) {
      throw ApiError.notFound('Product not found in store catalog');
    }

    // 2. Find or initialize Inventory Record
    let inventory = await Inventory.findOne({ storeId, productId });
    if (!inventory) {
      inventory = await Inventory.create({
        storeId,
        productId,
        stockQuantity: 0,
        reservedQuantity: 0,
        reorderPoint: 5
      });
    }

    const previousStock = inventory.stockQuantity;
    const newStock = previousStock + quantityDelta;

    if (newStock < 0) {
      throw ApiError.badRequest(
        `Insufficient stock for "${product.name}". Available: ${previousStock}, Requested shift: ${quantityDelta}`
      );
    }

    // 3. Update stock balance
    inventory.stockQuantity = newStock;
    if (type === 'PURCHASE') {
      inventory.lastRestockedAt = new Date();
    }
    await inventory.save();

    // 4. Record Immutable Audit Log Transaction
    const transaction = await InventoryTransaction.create({
      storeId,
      productId,
      type,
      quantityDelta,
      previousStock,
      newStock,
      reason: reason || `Manual ${type.toLowerCase()} update`,
      createdBy: userId
    });

    return {
      inventory,
      transaction
    };
  }

  static async getTransactions(storeId, productId, limit = 20) {
    const query = { storeId };
    if (productId) {
      query.productId = productId;
    }

    return InventoryTransaction.find(query)
      .populate('productId', 'name regionalName unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
}