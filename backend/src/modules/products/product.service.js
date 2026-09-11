import mongoose from 'mongoose';
import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { CategoryService } from '../categories/category.service.js';
import { ProductValidator } from './product.validator.js';
import { Inventory } from '../inventory/inventory.model.js';
import { SubscriptionService } from '../subscriptions/subscription.service.js';
import { MasterProduct } from '../masterCatalog/masterProduct.model.js';
import { ApiError } from '../../utils/apiError.js';

const normalizeImportPrice = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getImportProductKey = (product) => {
  const barcode = String(product.barcode || '').trim().toLowerCase();
  if (barcode) return `barcode:${barcode}`;

  return [
    String(product.name || '').trim().toLowerCase(),
    String(product.unit || '').trim().toUpperCase(),
    Number(product.unitQuantity) || 1
  ].join('|');
};

export class ProductService {
  static async importCatalog(storeId, userId, payload) {
    const categoryRows = Array.isArray(payload?.categories) ? payload.categories : [];
    const productRows = Array.isArray(payload?.products) ? payload.products : [];
    if (categoryRows.length === 0 && productRows.length === 0) {
      throw ApiError.badRequest('The import file has no category or product rows');
    }

    const existingCategories = await Category.find({ storeId });
    const categoryByName = new Map(existingCategories.map((category) => [category.name.trim().toLowerCase(), category]));
    const categoryBySlug = new Map(existingCategories.map((category) => [category.slug.trim().toLowerCase(), category]));
    const productNames = productRows.map((row) => String(row.name || '').trim()).filter(Boolean);
    const masterProducts = productNames.length
      ? await MasterProduct.find({ isActive: true, $or: [{ name: { $in: productNames } }, { alias: { $in: productNames } }] })
        .select('name alias categoryName imageUrl')
        .lean()
      : [];
    const masterByName = new Map();
    masterProducts.forEach((product) => {
      masterByName.set(product.name.trim().toLowerCase(), product);
      if (product.alias) masterByName.set(product.alias.trim().toLowerCase(), product);
    });
    const categoriesToCreate = [];
    const categoriesToRestore = new Set();

    const ensureCategory = (rawName, details = {}) => {
      const name = String(rawName || 'General').trim();
      const key = name.toLowerCase();
      const slug = CategoryService.generateCategorySlug(name);
      const existing = categoryByName.get(key) || categoryBySlug.get(slug);
      if (existing) {
        categoryByName.set(key, existing);
        categoryBySlug.set(slug, existing);
        if (existing.isDeleted) categoriesToRestore.add(existing._id);
        return existing;
      }

      const category = {
        _id: new mongoose.Types.ObjectId(),
        storeId,
        name,
        slug,
        description: details.description || null,
        sortOrder: Number(details.sortOrder) || existingCategories.length + categoriesToCreate.length,
        isActive: true,
        isDeleted: false
      };
      categoriesToCreate.push(category);
      categoryByName.set(key, category);
      categoryBySlug.set(slug, category);
      return category;
    };

    for (const [index, row] of categoryRows.entries()) {
      const name = String(row.name || '').trim();
      if (name.length < 2 || name.length > 50) {
        throw ApiError.badRequest(`Category row ${index + 2}: name must be between 2 and 50 characters`);
      }
      ensureCategory(name, {
        description: row.description ? String(row.description).trim() : null,
        sortOrder: row.sortOrder
      });
    }

    const skippedRows = [];
    const validatedProducts = productRows.reduce((validProducts, row, index) => {
      const masterProduct = masterByName.get(String(row.name || '').trim().toLowerCase());
      const categoryName = String(
        row.categoryName || row.category || (categoryByName.has(String(row.regionalName || '').trim().toLowerCase())
          ? row.regionalName
          : masterProduct?.categoryName || row.regionalName || 'General')
      ).trim();
      const category = ensureCategory(categoryName);
      try {
        validProducts.push({
          row: index + 2,
          product: ProductValidator.validateCreateProduct({
            ...row,
            categoryId: category._id,
            imageUrl: row.imageUrl || masterProduct?.imageUrl || '',
            unit: row.unit || 'PIECE',
            unitQuantity: row.unitQuantity || 1,
            mrp: normalizeImportPrice(row.mrp),
            sellingPrice: normalizeImportPrice(row.sellingPrice),
            purchasePrice: row.purchasePrice || 0,
            taxRate: row.taxRate || 0
          })
        });
      } catch (error) {
        const details = error.errors?.map((detail) => detail.message).join('; ') || error.message;
        skippedRows.push({ row: index + 2, reason: details });
      }
      return validProducts;
    }, []);

    if (validatedProducts.length === 0 && productRows.length > 0 && categoriesToCreate.length === 0) {
      throw ApiError.badRequest('No valid product rows were found', skippedRows);
    }

    const existingProducts = validatedProducts.length > 0
      ? await Product.find({ storeId, isDeleted: false })
        .select('_id name categoryId unit unitQuantity barcode')
        .lean()
      : [];
    const existingProductByKey = new Map(existingProducts.map((product) => [getImportProductKey(product), product]));
    const importProductKeys = new Set();
    const categoryUpdates = [];
    const newProducts = validatedProducts
      .filter(({ product, row }) => {
        const key = getImportProductKey(product);
        const existingProduct = existingProductByKey.get(key);
        if (existingProduct || importProductKeys.has(key)) {
          if (existingProduct && String(existingProduct.categoryId) !== String(product.categoryId)) {
            categoryUpdates.push({
              updateOne: {
                filter: { _id: existingProduct._id, storeId, isDeleted: false },
                update: { $set: { categoryId: product.categoryId, updatedBy: userId } }
              }
            });
          }
          skippedRows.push({
            row,
            reason: existingProduct
              ? 'Already in catalog; category refreshed from Excel.'
              : 'Duplicate row skipped; product is already included in this import.'
          });
          return false;
        }
        importProductKeys.add(key);
        return true;
      })
      .map(({ product }) => product);

    if (newProducts.length > 0) {
      const { usage } = await SubscriptionService.getStoreSubscription(storeId);
      if (usage.products.max !== -1 && usage.products.current + newProducts.length > usage.products.max) {
        throw ApiError.forbidden(
          `Import exceeds product limit (${usage.products.current + newProducts.length}/${usage.products.max}). Please upgrade your plan.`
        );
      }
    }

    if (categoriesToCreate.length > 0) {
      await Category.insertMany(categoriesToCreate, { ordered: true });
    }
    if (categoriesToRestore.size > 0) {
      await Category.updateMany(
        { storeId, _id: { $in: [...categoriesToRestore] } },
        { $set: { isDeleted: false, isActive: true } }
      );
    }
    if (categoryUpdates.length > 0) {
      await Product.bulkWrite(categoryUpdates, { ordered: false });
    }

    const productsToCreate = newProducts.map((product) => ({
      storeId,
      ...product,
      isActive: true,
      isDeleted: false,
      createdBy: userId,
      updatedBy: userId
    }));
    const createdProducts = productsToCreate.length ? await Product.insertMany(productsToCreate, { ordered: true }) : [];
    if (createdProducts.length > 0) {
      await Inventory.insertMany(createdProducts.map((product) => ({
        storeId,
        productId: product._id,
        stockQuantity: 0,
        reservedQuantity: 0,
        reorderPoint: 5,
        trackInventory: true
      })));
    }

    return {
      categoriesCreated: categoriesToCreate.length,
      productsCreated: createdProducts.length,
      skippedRows
    };
  }

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
    if (updateData.allowPartialSale !== undefined) product.allowPartialSale = Boolean(updateData.allowPartialSale);
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