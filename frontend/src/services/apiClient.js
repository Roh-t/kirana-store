import axios from 'axios';

// 1. PASTE YOUR EXACT LIVE RENDER BACKEND URL HERE
const LIVE_BACKEND_URL = 'https://kirana-store-backend-ula5.onrender.com/api/v1'; 

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || LIVE_BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request Interceptor: Automatically attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Formats errors and handles token expiry
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kf_token');
    }
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.error?.details || []
    };
    return Promise.reject(customError);
  }
);

export default apiClient;