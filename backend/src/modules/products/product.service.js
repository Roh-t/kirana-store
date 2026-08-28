import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { SubscriptionService } from '../subscriptions/subscription.service.js';
import { ApiError } from '../../utils/apiError.js';

export class ProductService {
  static async createProduct(storeId, userId, validatedData) {
    // ENFORCE SAAS PRODUCT LIMIT
    await SubscriptionService.enforceProductLimit(storeId);

    const category = await Category.findOne({ _id: validatedData.categoryId, storeId, isDeleted: false });
    if (!category) {
      throw ApiError.notFound('Selected category does not exist in your store');
    }

    if (validatedData.barcode) {
      const existingBarcode = await Product.findOne({ storeId, barcode: validatedData.barcode, isDeleted: false });
      if (existingBarcode) {
        throw ApiError.conflict(`Product with barcode "${validatedData.barcode}" already exists.`);
      }
    }

    const product = await Product.create({
      storeId,
      ...validatedData,
      isActive: true,
      isDeleted: false,
      createdBy: userId,
      updatedBy: userId
    });

    await Inventory.create({
      storeId,
      productId: product._id,
      stockQuantity: 0,
      reservedQuantity: 0,
      reorderPoint: 5,
      trackInventory: true
    });

    return product;
  }

  static async getProductsByStore(storeId, options = {}) {
    const { page = 1, limit = 20, categoryId, search, isAvailable } = options;
    const query = { storeId, isDeleted: false };

    if (categoryId) query.categoryId = categoryId;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { regionalName: searchRegex },
        { brand: searchRegex },
        { barcode: searchRegex },
        { sku: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;

    const [products, totalRecords] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      products,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages,
        pageSize: Number(limit),
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    };
  }

  static async getProductById(storeId, productId) {
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false }).populate(
      'categoryId',
      'name slug'
    );
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    return product;
  }

  static async updateProduct(storeId, userId, productId, updateData) {
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false });
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (updateData.categoryId) {
      const category = await Category.findOne({ _id: updateData.categoryId, storeId, isDeleted: false });
      if (!category) throw ApiError.notFound('Selected category does not exist');
      product.categoryId = updateData.categoryId;
    }

    if (updateData.barcode && updateData.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({
        storeId,
        barcode: updateData.barcode,
        _id: { $ne: productId },
        isDeleted: false
      });
      if (existingBarcode) {
        throw ApiError.conflict(`Barcode "${updateData.barcode}" is already assigned to another product.`);
      }
      product.barcode = updateData.barcode;
    }

    if (updateData.name) product.name = updateData.name.trim();
    if (updateData.regionalName !== undefined) product.regionalName = updateData.regionalName;
    if (updateData.brand !== undefined) product.brand = updateData.brand;
    if (updateData.sku !== undefined) product.sku = updateData.sku;
    if (updateData.unit) product.unit = updateData.unit.toUpperCase();
    if (updateData.unitQuantity !== undefined) product.unitQuantity = Number(updateData.unitQuantity);
    if (updateData.mrp !== undefined) product.mrp = Number(updateData.mrp);
    if (updateData.sellingPrice !== undefined) product.sellingPrice = Number(updateData.sellingPrice);
    if (updateData.purchasePrice !== undefined) product.purchasePrice = Number(updateData.purchasePrice);
    if (updateData.taxRate !== undefined) product.taxRate = Number(updateData.taxRate);
    if (updateData.hsnCode !== undefined) product.hsnCode = updateData.hsnCode;
    if (updateData.isAvailable !== undefined) product.isAvailable = updateData.isAvailable;

    product.updatedBy = userId;
    await product.save();

    return product;
  }

  static async deleteProduct(storeId, productId) {
    const product = await Product.findOne({ _id: productId, storeId, isDeleted: false });
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    return { id: productId, deleted: true };
  }
}