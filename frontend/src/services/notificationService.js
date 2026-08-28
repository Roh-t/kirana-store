import apiClient from './apiClient';

export const notificationService = {
  async getNotifications(storeId, unreadOnly = false) {
    return apiClient.get('/notifications', {
      headers: { 'X-Store-Id': storeId },
      params: { unreadOnly }
    });
  },

  async markAsRead(storeId, notificationId) {
    return apiClient.patch(`/notifications/${notificationId}/read`, {}, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async markAllAsRead(storeId) {
    return apiClient.patch('/notifications/read-all', {}, {
      headers: { 'X-Store-Id': storeId }
    });
  }
};