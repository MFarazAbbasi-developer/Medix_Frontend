import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { authStorage } from './auth-storage';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  correlationId: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  correlationId: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | unknown[];
  };
}

export const apiClient: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: dynamically attach current baseURL, correlation ID, and Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const currentBaseUrl = useAppStore.getState().apiBaseUrl;
    config.baseURL = currentBaseUrl;

    if (!config.headers['x-correlation-id']) {
      config.headers['x-correlation-id'] = crypto.randomUUID();
    }

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap standard response data and handle silent 401 refresh rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // If response matches backend contract { success: true, data: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      return response.data;
    }
    return response.data;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 on normal requests (excluding login or refresh itself), attempt token rotation
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const token = useAuthStore.getState().accessToken;
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await authStorage.getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Request token refresh using raw fetch or unintercepted call
        const currentBaseUrl = useAppStore.getState().apiBaseUrl;
        const refreshResponse = await axios.post(
          `${currentBaseUrl}/auth/refresh`,
          {
            refreshToken: storedRefreshToken,
            deviceInfo: 'Medix Desktop Station',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-correlation-id': crypto.randomUUID(),
            },
          },
        );

        const newTokens = refreshResponse.data?.data;
        if (!newTokens?.accessToken || !newTokens?.refreshToken) {
          throw new Error('Invalid refresh response payload');
        }

        // Store new access token in memory & new refresh token in OS-protected storage
        useAuthStore.getState().setAccessToken(newTokens.accessToken);
        await authStorage.setRefreshToken(newTokens.refreshToken);

        processQueue(null);

        // Retry original request with newly issued access token
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        await useAuthStore.getState().logout();
        return Promise.reject(
          new Error('Session has expired. Please log in again.'),
        );
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.data) {
      const serverError = error.response.data;
      const message =
        serverError.error?.message ||
        `Server returned status ${error.response.status}`;
      return Promise.reject(new Error(message));
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(
        new Error(
          'Cannot connect to Medix backend server. Check server status or LAN connection.',
        ),
      );
    }

    return Promise.reject(error);
  },
);
