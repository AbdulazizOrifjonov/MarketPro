import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('marketpro_token') || sessionStorage.getItem('marketpro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Network error';
    return Promise.reject(Object.assign(error, { friendlyMessage: message }));
  }
);
