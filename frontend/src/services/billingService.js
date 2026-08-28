import apiClient from './apiClient';

export const billingService = {
  async generateInvoice(storeId, orderId, paymentMethod = 'CASH', paidAmount = null) {
    return apiClient.post(
      '/billing/generate',
      { orderId, paymentMethod, paidAmount },
      { headers: { 'X-Store-Id': storeId } }
    );
  },

  async getInvoices(storeId) {
    return apiClient.get('/billing/invoices', {
      headers: { 'X-Store-Id': storeId }
    });
  }
};