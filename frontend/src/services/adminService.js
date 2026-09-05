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
  },

  async getImageLibrary(search = '') {
    return apiClient.get('/image-library', { params: { search } });
  },

  async searchMasterProducts(search = '') {
    return apiClient.get('/master-catalog/products', { params: { search, limit: 8 } });
  },

  async checkImageLibraryConnection() {
    return apiClient.get('/image-library/connection');
  },

  async uploadLibraryImage(imageData, label, aliases) {
    return apiClient.post('/image-library', { imageData, label, aliases });
  },

  async deleteLibraryImage(imageId) {
    return apiClient.delete(`/image-library/${imageId}`);
  }
};