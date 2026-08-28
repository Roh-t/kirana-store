import apiClient from './apiClient';

export const customerService = {
  async getCustomers(storeId, params = {}) {
    return apiClient.get('/customers', {
      headers: { 'X-Store-Id': storeId },
      params
    });
  },

  async createCustomer(storeId, data) {
    return apiClient.post('/customers', data, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async updateUdhar(storeId, customerId, amountDelta, notes = '') {
    return apiClient.patch(`/customers/${customerId}/udhar`, { amountDelta, notes }, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};