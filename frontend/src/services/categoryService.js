import apiClient from './apiClient';

export const categoryService = {
  async getCategories(storeId) {
    return apiClient.get('/categories', {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async createCategory(storeId, data) {
    return apiClient.post('/categories', data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async updateCategory(storeId, categoryId, data) {
    return apiClient.patch(`/categories/${categoryId}`, data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async deleteCategory(storeId, categoryId) {
    return apiClient.delete(`/categories/${categoryId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};