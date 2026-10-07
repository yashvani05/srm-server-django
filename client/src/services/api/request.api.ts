import type { Paginated } from '../../types/api';
import type { RequestFormValues, RequestListParams, RequestStatus, ServiceRequest } from '../../types/request';
import { api, unwrap } from './axiosInstance';

export const requestApi = {
  getRequests: (params: RequestListParams = {}, signal?: AbortSignal) =>
    unwrap<Paginated<ServiceRequest>>(api.get('/requests', { params, signal })),

  getRequestById: (id: string, signal?: AbortSignal) => unwrap<ServiceRequest>(api.get(`/requests/${id}`, { signal })),

  createRequest: (payload: RequestFormValues) => unwrap<ServiceRequest>(api.post('/requests', payload)),

  updateRequest: (id: string, payload: Partial<RequestFormValues>) =>
    unwrap<ServiceRequest>(api.patch(`/requests/${id}`, payload)),

  deleteRequest: (id: string) => unwrap<null>(api.delete(`/requests/${id}`)),

  updateStatus: (id: string, status: RequestStatus) =>
    unwrap<ServiceRequest>(api.patch(`/requests/${id}/status`, { status })),
};
