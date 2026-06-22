import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WITH_CREDENTIALS = String(import.meta.env.VITE_API_WITH_CREDENTIALS || '').toLowerCase() === 'true';

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: WITH_CREDENTIALS,
});

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const { logout } = useAuthStore.getState();
      logout();
      // Show toast only on 401
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      }
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } else if (error.response?.status === 429) {
      const waitTime = error.response?.headers?.['x-rate-limit-retry-after-seconds'];
      if (waitTime) {
        toast.error(`Too many requests. Please wait ${waitTime} seconds and try again.`);
      } else {
        toast.error('Too many requests. Please slow down and try again.');
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
