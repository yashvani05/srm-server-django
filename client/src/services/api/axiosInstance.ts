import axios, { AxiosError } from 'axios';
import type { ApiEnvelope } from '../../types/api';
import { tokenStorage } from '../../utils/tokenStorage';
import { ApiError } from './ApiError';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

const isCredentialCall = (url?: string) => /\/auth\/(login|register)$/.test(url ?? '');

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ApiEnvelope<null>> & { errors?: { field?: string; message: string }[] }>) => {
    if (error.response?.status === 401 && !isCredentialCall(error.config?.url)) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    if (!error.response) {
      const message = error.code === 'ECONNABORTED' ? 'The request timed out.' : 'Unable to reach the server.';
      return Promise.reject(new ApiError(message, null));
    }
    const body = error.response.data;
    return Promise.reject(new ApiError(body?.message ?? 'Request failed.', error.response.status, body?.errors ?? []));
  },
);

export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  return (await promise).data.data;
}
