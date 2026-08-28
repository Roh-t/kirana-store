import apiClient from './apiClient';

export const publicService = {
  async getPublicStore(slug) {
    return apiClient.get(`/public/stores/${slug}`);
  },

  async getPublicCategories(slug) {
    return apiClient.get(`/public/stores/${slug}/categories`);
  },

  async getPublicCatalog(slug, params = {}) {
    return apiClient.get(`/public/stores/${slug}/catalog`, { params });
  },

  async getCustomerOrders(slug, phone) {
    return apiClient.get(`/public/stores/${slug}/customer-orders/${phone}`);
  }
};