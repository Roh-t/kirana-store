import apiClient from './apiClient';

export const orderService = {
  async createPublicOrder(slug, orderData) {
    return apiClient.post(`/public/stores/${slug}/orders`, orderData);
  },

  async getOrderById(orderId) {
    return apiClient.get(`/public/orders/${orderId}`);
  },

  async getOrderQueue(storeId, params = {}) {
    return apiClient.get('/orders/queue', {
      headers: { 'X-Store-Id': storeId },
      params
    });
  },

  async updateOrderStatus(storeId, orderId, status, cancellationReason = '') {
    return apiClient.patch(
      `/orders/${orderId}/status`,
      { status, cancellationReason },
      { headers: { 'X-Store-Id': storeId } }
    );
  }
};