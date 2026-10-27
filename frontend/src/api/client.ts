import axios, { AxiosInstance } from 'axios';
import { config } from '@/lib/config';

/**
 * Axios HTTP Client Template
 * Preconfigured for future Backend API connection with HTTP-only cookies and JSON headers.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  timeout: config.defaultTimeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (requestConfig) => {
    try {
      let token: string | null = null;
      const stored = localStorage.getItem('pujacircle-auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.token || null;
      }
      if (!token) {
        token = localStorage.getItem('pujacircle_token');
      }
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore parse failure
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with strict error sanitization
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 1. Sanitized server-returned operational message
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
      return Promise.reject(new Error(error.response.data.message));
    }

    // 2. Network connectivity issue
    if (!error.response) {
      return Promise.reject(
        new Error('Unable to connect to the PujaCircle server. Please check your internet connection.')
      );
    }

    // 3. Fallback for 500 or unexpected exceptions
    return Promise.reject(
      new Error('An unexpected server error occurred. Please try again in a few moments.')
    );
  }
);
