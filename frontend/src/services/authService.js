import apiClient from './apiClient';

export const authService = {
  async register(data) {
    return apiClient.post('/auth/register', data);
  },

  async login(data) {
    return apiClient.post('/auth/login', data);
  },

  async getMe() {
    return apiClient.get('/auth/me');
  },

  async switchStore(storeId) {
    return apiClient.patch('/auth/switch-store', { storeId });
  }
};