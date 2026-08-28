import apiClient from './apiClient';

export const adminService = {
  async getMetrics() {
    return apiClient.get('/admin/metrics');
  },

  async getAllStores(params = {}) {
    return apiClient.get('/admin/stores', { params });
  },

  async toggleStoreStatus(storeId, status) {
    return apiClient.patch(`/admin/stores/${storeId}/status`, { status });
  }
};