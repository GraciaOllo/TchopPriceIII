import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for better error handling
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Price API calls
export const priceAPI = {
  getAll: (params?: any) => authAPI.get('/prices', { params }),
  getLatest: (params?: any) => authAPI.get('/prices/latest', { params }),
  getHistory: (productId: string, params?: any) => 
    authAPI.get(`/prices/history/${productId}`, { params }),
  create: (data: any) => authAPI.post('/prices', data),
  vote: (priceId: string, type: 'upvote' | 'downvote') => 
    authAPI.post(`/prices/${priceId}/vote`, { type }),
  verify: (priceId: string) => authAPI.patch(`/prices/${priceId}/verify`),
  delete: (priceId: string) => authAPI.delete(`/prices/${priceId}`),
  getStats: () => authAPI.get('/prices/stats')
};

// Product API calls
export const productAPI = {
  getAll: (params?: Record<string, unknown>) => authAPI.get('/products', { params }),
  create: (data: Record<string, unknown>) => authAPI.post('/products', data)
};

// User API calls
export const userAPI = {
  getAll: (params?: any) => authAPI.get('/users', { params }),
  create: (data: Record<string, unknown>) => authAPI.post('/users', data),
  update: (userId: string, data: Record<string, unknown>) => authAPI.put(`/users/${userId}`, data),
  delete: (userId: string) => authAPI.delete(`/users/${userId}`),
  verify: (userId: string) => authAPI.patch(`/users/${userId}/verify`),
  block: (userId: string, data: Record<string, unknown>) => authAPI.patch(`/users/${userId}/block`, data),
  unblock: (userId: string) => authAPI.patch(`/users/${userId}/unblock`),
  getStats: () => authAPI.get('/users/stats'),
  updateProfile: (data: { name?: string; email?: string; password?: string }) => authAPI.put('/users/profile', data)
};

// Region API calls
export const regionAPI = {
  getAll: () => authAPI.get('/regions')
};

// Notification API calls
export const notificationAPI = {
  getAll: (params?: Record<string, unknown>) => authAPI.get('/notifications', { params }),
  markAsRead: (notificationId: string) => authAPI.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => authAPI.patch('/notifications/mark-all-read')
};

// Market Data API calls
export const marketDataAPI = {
  getCashCropPrices: (params?: Record<string, unknown>) => authAPI.get('/market-data/cash-crops', { params }),
  getTrends: (crop: string, params?: Record<string, unknown>) => authAPI.get(`/market-data/trends/${crop}`, { params }),
  getSummary: () => authAPI.get('/market-data/summary')
};

export default authAPI;