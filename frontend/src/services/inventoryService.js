import apiClient from './apiClient';

export const inventoryService = {
  async getInventorySummary(storeId) {
    return apiClient.get('/inventory/summary', {
      headers: { 'X-Store-Id': storeId },
      timeout: 120000
    });
  },

  async getInventory(storeId, params = {}, config = {}) {
    return apiClient.get('/inventory', {
      headers: { 'X-Store-Id': storeId },
      params,
      timeout: 120000,
      ...config
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