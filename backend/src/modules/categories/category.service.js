import { Category } from './category.model.js';
import { ApiError } from '../../utils/apiError.js';

export class CategoryService {
  static generateCategorySlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  static async createCategory(storeId, validatedData) {
    const slug = this.generateCategorySlug(validatedData.name);

    // Check slug collision within the SAME store tenant
    const existing = await Category.findOne({ storeId, slug, isDeleted: false });
    if (existing) {
      throw ApiError.conflict(`Category "${validatedData.name}" already exists in your store.`);
    }

    const category = await Category.create({
      storeId,
      name: validatedData.name,
      slug,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      sortOrder: validatedData.sortOrder,
      isActive: true,
      isDeleted: false
    });

    return category;
  }

  static async getCategoriesByStore(storeId, includeInactive = true) {
    const query = { storeId, isDeleted: false };
    if (!includeInactive) {
      query.isActive = true;
    }

    return Category.find(query).sort({ sortOrder: 1, createdAt: 1 });
  }

  static async getCategoryById(storeId, categoryId) {
    const category = await Category.findOne({ _id: categoryId, storeId, isDeleted: false });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    return category;
  }

  static async updateCategory(storeId, categoryId, updateData) {
    const category = await Category.findOne({ _id: categoryId, storeId, isDeleted: false });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (updateData.name && updateData.name !== category.name) {
      const newSlug = this.generateCategorySlug(updateData.name);
      const duplicate = await Category.findOne({ storeId, slug: newSlug, _id: { $ne: categoryId }, isDeleted: false });
      if (duplicate) {
        throw ApiError.conflict(`Category "${updateData.name}" already exists in your store.`);
      }
      category.name = updateData.name.trim();
      category.slug = newSlug;
    }

    if (updateData.description !== undefined) category.description = updateData.description;
    if (updateData.imageUrl !== undefined) category.imageUrl = updateData.imageUrl;
    if (updateData.sortOrder !== undefined) category.sortOrder = updateData.sortOrder;
    if (updateData.isActive !== undefined) category.isActive = updateData.isActive;

    await category.save();
    return category;
  }

  static async deleteCategory(storeId, categoryId) {
    const category = await Category.findOne({ _id: categoryId, storeId, isDeleted: false });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    category.isDeleted = true;
    await category.save();
    return { id: categoryId, deleted: true };
  }
}