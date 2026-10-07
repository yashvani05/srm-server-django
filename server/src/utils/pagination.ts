import type { Pagination } from './apiResponse';

export function buildPagination(page: number, limit: number, totalItems: number): Pagination {
  return { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) };
}
