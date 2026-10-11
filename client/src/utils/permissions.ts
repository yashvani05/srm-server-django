import type { User } from '../types/auth';
import type { ServiceRequest } from '../types/request';

export function canEditRequest(user: User | null, request: ServiceRequest): boolean {
  if (!user || !user.permissions.includes('requests.update')) return false;
  if (user.role === 'ADMIN') return true;
  return request.createdBy.id === user.id && request.status === 'OPEN';
}
