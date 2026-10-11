import type { RequestCategory, RequestPriority, RequestStatus } from '../types/request';

export const CATEGORY_OPTIONS: { value: RequestCategory; label: string }[] = [
  { value: 'IT', label: 'IT' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'GENERAL', label: 'General' },
];

export const PRIORITY_OPTIONS: { value: RequestPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label])) as Record<
  RequestCategory,
  string
>;

export const PAGE_SIZE = 10;

export const OVERDUE_AFTER_HOURS = 24;
