export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface FieldError {
  field?: string;
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}
