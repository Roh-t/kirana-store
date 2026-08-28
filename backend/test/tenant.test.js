import { describe, it, expect } from 'vitest';
import { CategoryService } from '../src/modules/categories/category.service.js';

describe('Multi-Tenant Category Slug Generation', () => {
  it('should convert raw category names into lower-case kebab-case slugs', () => {
    const slug1 = CategoryService.generateCategorySlug('Atta & Dals');
    expect(slug1).toBe('atta-dals');

    const slug2 = CategoryService.generateCategorySlug('Oil & Ghee 1L');
    expect(slug2).toBe('oil-ghee-1l');
  });
});