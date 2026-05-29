import axios from 'axios';
import { triggerUnauthorizedLogout } from './auth';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000',
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('Token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      triggerUnauthorizedLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
