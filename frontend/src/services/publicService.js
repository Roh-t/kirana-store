import apiClient from './apiClient';

const PUBLIC_REQUEST_TIMEOUT_MS = 45000;

const publicGet = (url, config = {}) => apiClient.get(url, {
  ...config,
  timeout: PUBLIC_REQUEST_TIMEOUT_MS
});

export const publicService = {
  async getPublicStore(slug) {
    return publicGet(`/public/stores/${slug}`);
  },

  async getPublicCategories(slug, config = {}) {
    return publicGet(`/public/stores/${slug}/categories`, config);
  },

  async getPublicCatalog(slug, params = {}, config = {}) {
    return publicGet(`/public/stores/${slug}/catalog`, { params, ...config });
  },

  async getCustomerOrders(slug, phone) {
    return publicGet(`/public/stores/${slug}/customer-orders/${phone}`);
  }
};