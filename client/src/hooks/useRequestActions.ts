import { useCallback, useState } from 'react';
import { ApiError, toErrorMessage } from '../services/api/ApiError';
import { requestApi } from '../services/api/request.api';
import type { RequestFormValues, RequestStatus, ServiceRequest } from '../types/request';
import { useToast } from './useToast';

type ActionKind = 'create' | 'update' | 'delete' | 'status';
export type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: ApiError | Error };

export function useRequestActions() {
  const toast = useToast();
  const [pending, setPending] = useState<ActionKind | null>(null);

  const run = useCallback(
    async <T>(kind: ActionKind, action: () => Promise<T>, successMessage: string): Promise<ActionResult<T>> => {
      setPending(kind);
      try {
        const data = await action();
        toast.success(successMessage);
        return { data };
      } catch (err) {
        toast.error(toErrorMessage(err));
        return { error: err as Error };
      } finally {
        setPending(null);
      }
    },
    [toast],
  );

  return {
    pending,
    create: (values: RequestFormValues) =>
      run('create', () => requestApi.createRequest(values), 'Service request created'),
    update: (id: string, values: Partial<RequestFormValues>) =>
      run<ServiceRequest>('update', () => requestApi.updateRequest(id, values), 'Service request updated'),
    remove: (id: string) => run('delete', () => requestApi.deleteRequest(id), 'Service request deleted'),
    changeStatus: (id: string, status: RequestStatus) =>
      run('status', () => requestApi.updateStatus(id, status), 'Status updated'),
  };
}
