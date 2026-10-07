export interface DashboardSummary {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  highPriorityRequests: number;
  overdueRequests: number;
  /** When the overdue worker last completed successfully (ISO time), or null if it has never run. */
  lastOverdueCheckAt: string | null;
}
