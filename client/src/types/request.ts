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
  isOverdue: boolean;
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
