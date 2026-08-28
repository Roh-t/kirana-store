import apiClient from './apiClient';

export const analyticsService = {
  async getDashboardMetrics(storeId) {
    return apiClient.get('/analytics/dashboard', {
      headers: { 'X-Store-Id': storeId }
    });
  }
};