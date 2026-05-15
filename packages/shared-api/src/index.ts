import axios, { type AxiosInstance } from 'axios';
import type { AuthmeClient } from 'authme-sdk';

const BASE_URL = import.meta.env.VITE_API_URL;

export const createApiClient = (authme: AuthmeClient): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor — inject Bearer token + remap pageSize→limit
  apiClient.interceptors.request.use(
    (config) => {
      const token = authme.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // API uses 'limit' not 'pageSize' for pagination
      if (config.params?.pageSize != null) {
        config.params.limit = config.params.pageSize;
        delete config.params.pageSize;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor — attempt token refresh on 401 before redirecting
  let isRefreshing = false;
  let pendingRequests: ((token: string) => void)[] = [];

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            pendingRequests.push((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            });
          });
        }
        original._retry = true;
        isRefreshing = true;
        try {
          const refreshed = await Promise.race([
            authme.refreshTokens(),
            new Promise<false>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]);
          if (refreshed) {
            const newToken = authme.getAccessToken()!;
            pendingRequests.forEach((cb) => cb(newToken));
            pendingRequests = [];
            isRefreshing = false;
            original.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          }
        } catch {
          // refresh failed or timed out
        }
        isRefreshing = false;
        pendingRequests = [];
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return apiClient;
};

export type { AxiosInstance };
