import apiClient from './apiClient';

export const storeService = {
  async createStore(data) {
    return apiClient.post('/stores', data);
  },

  async getMyStores() {
    return apiClient.get('/stores/mine');
  },

  async getStoreById(storeId) {
    return apiClient.get(`/stores/${storeId}`);
  },

  async getPublicStore(slug) {
    return apiClient.get(`/stores/public/${slug}`);
  },

  async updateStore(storeId, data) {
    return apiClient.patch(`/stores/${storeId}`, data);
  }
};