import apiClient from './apiClient';

export const auditService = {
  async getAuditLogs(storeId, params = {}) {
    return apiClient.get('/audit-logs', {
      headers: { 'X-Store-Id': storeId },
      params
    });
  }
};