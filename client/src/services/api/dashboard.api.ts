import type { DashboardSummary } from '../../types/dashboard';
import { api, unwrap } from './axiosInstance';

export const dashboardApi = {
  getSummary: (signal?: AbortSignal) => unwrap<DashboardSummary>(api.get('/dashboard/summary', { signal })),
};
