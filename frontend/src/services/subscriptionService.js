import apiClient from './apiClient';

export const subscriptionService = {
  async getSubscription(storeId) {
    return apiClient.get('/subscriptions', {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async upgradePlan(storeId, plan = 'PRO') {
    return apiClient.patch('/subscriptions/upgrade', { plan }, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};