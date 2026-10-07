import type { RequestCategory, RequestPriority, RequestStatus } from '../constants';

export interface ServiceRequestDto {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  /** OPEN/IN_PROGRESS for more than the overdue threshold (computed by the database). */
  isOverdue: boolean;
  /** When the current status began; the overdue clock runs from here. */
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string };
}

export interface CreateRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  priority?: RequestPriority;
}

export type UpdateRequestInput = Partial<CreateRequestInput>;

export interface ListRequestsQuery {
  status?: RequestStatus;
  priority?: RequestPriority;
  overdue?: boolean;
  page: number;
  limit: number;
}
