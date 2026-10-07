/** The six counts. These are what gets cached. */
export interface DashboardCounts {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  highPriorityRequests: number;
  overdueRequests: number;
}

export interface DashboardSummary extends DashboardCounts {
  /** When the overdue worker last completed successfully (null if it has never run). Not cached: always read fresh. */
  lastOverdueCheckAt: string | null;
}
