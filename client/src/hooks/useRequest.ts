import { requestApi } from '../services/api/request.api';
import { useAsyncData } from './useAsyncData';

export function useRequest(id: string) {
  return useAsyncData((signal) => requestApi.getRequestById(id, signal), [id]);
}
