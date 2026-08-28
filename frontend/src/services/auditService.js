import apiClient from './apiClient';

export const auditService = {
  async getAuditLogs(storeId) {
    return apiClient.get('/audit-logs', {
      headers: { 'X-Store-Id': storeId }
    });
  }
};