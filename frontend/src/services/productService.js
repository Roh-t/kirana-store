import apiClient from './apiClient';

export const productService = {
  async getProducts(storeId, params = {}) {
    return apiClient.get('/products', {
      headers: { 'X-Store-Id': storeId },
      params
    });
  },

  async createProduct(storeId, data) {
    return apiClient.post('/products', data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async updateProduct(storeId, productId, data) {
    return apiClient.patch(`/products/${productId}`, data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async deleteProduct(storeId, productId) {
    return apiClient.delete(`/products/${productId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};