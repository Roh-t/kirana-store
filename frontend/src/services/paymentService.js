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
  }
};