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

  async uploadLibraryImage(imageData, label, aliases) {
    return apiClient.post('/image-library', { imageData, label, aliases });
  },

  async deleteLibraryImage(imageId) {
    return apiClient.delete(`/image-library/${imageId}`);
  }
};