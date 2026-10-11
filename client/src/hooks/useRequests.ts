import { requestApi } from '../services/api/request.api';
import type { RequestListParams } from '../types/request';
import { useAsyncData } from './useAsyncData';

export function useRequests({ status, priority, overdue, page, limit }: RequestListParams) {
  return useAsyncData((signal) => requestApi.getRequests({ status, priority, overdue: overdue || undefined, page, limit }, signal), [
    status,
    priority,
    overdue,
    page,
    limit,
  ]);
}
