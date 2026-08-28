import apiClient from './apiClient';

export const inventoryService = {
  async getInventory(storeId, params = {}) {
    return apiClient.get('/inventory', {
      headers: { 'X-Store-Id': storeId },
      params
    });
  },

  async adjustStock(storeId, data) {
    return apiClient.post('/inventory/adjust', data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getTransactions(storeId, productId = '') {
    return apiClient.get(`/inventory/transactions/${productId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};