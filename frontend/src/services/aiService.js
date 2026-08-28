import apiClient from './apiClient';

export const aiService = {
  async parseVoiceOrder(slug, rawText) {
    return apiClient.post('/ai/parse-order', { slug, rawText });
  }
};