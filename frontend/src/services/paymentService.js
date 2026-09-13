import apiClient from './apiClient';

export const paymentService = {
  async recordPayment(storeId, data) {
    return apiClient.post('/payments', data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getUpiQrPayload(storeId, orderId) {
    return apiClient.get(`/payments/upi-qr/${orderId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getPaymentsByOrder(storeId, orderId) {
    return apiClient.get(`/payments/order/${orderId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async verifyPayment(storeId, paymentId) {
    return apiClient.patch(`/payments/${paymentId}/verify`, null, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getPublicUpiQr(slug, orderId) {
    return apiClient.get(`/public/stores/${slug}/orders/${orderId}/upi-qr`);
  },

  async submitPublicPaymentProof(slug, orderId, data) {
    return apiClient.post(`/public/stores/${slug}/orders/${orderId}/payment-proof`, data);
  }
};