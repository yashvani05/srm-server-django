export type RequestCategory = 'IT' | 'MAINTENANCE' | 'GENERAL';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  /** OPEN/IN_PROGRESS for more than 24h in the current status (computed by the server). */
  isOverdue: boolean;
  /** When the current status began. */
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

export interface RequestFormValues {
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
}

export interface RequestListParams {
  status?: RequestStatus;
  priority?: RequestPriority;
  overdue?: boolean;
  page?: number;
  limit?: number;
}
