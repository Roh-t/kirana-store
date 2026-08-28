import apiClient from './apiClient';

export const whatsappService = {
  async getOrderWhatsAppLink(storeId, orderId) {
    return apiClient.get(`/whatsapp/order-link/${orderId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getUdharWhatsAppLink(storeId, customerId) {
    return apiClient.get(`/whatsapp/udhar-link/${customerId}`, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};