export interface DashboardSummary {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  highPriorityRequests: number;
  overdueRequests: number;
  lastOverdueCheckAt: string | null;
}
