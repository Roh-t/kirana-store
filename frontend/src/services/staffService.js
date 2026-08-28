import apiClient from './apiClient';

export const staffService = {
  async getStaff(storeId) {
    return apiClient.get(`/stores/${storeId}/staff`, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async addStaff(storeId, data) {
    return apiClient.post(`/stores/${storeId}/staff`, data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async removeStaff(storeId, staffUserId) {
    return apiClient.delete(`/stores/${storeId}/staff/${staffUserId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};