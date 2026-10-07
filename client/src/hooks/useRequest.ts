import { requestApi } from '../services/api/request.api';
import { useAsyncData } from './useAsyncData';

/** A single request by id. Use `setData` to apply a mutation result without refetching. */
export function useRequest(id: string) {
  return useAsyncData((signal) => requestApi.getRequestById(id, signal), [id]);
}
