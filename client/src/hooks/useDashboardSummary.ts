import { dashboardApi } from '../services/api/dashboard.api';
import { useAsyncData } from './useAsyncData';

export function useDashboardSummary() {
  return useAsyncData((signal) => dashboardApi.getSummary(signal), []);
}
