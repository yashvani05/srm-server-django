import { ROLES, type RequestStatus } from '../constants';
import type { ServiceRequest } from '../models';
import { requestRepository } from '../repositories/request.repository';
import type { AuthUser } from '../types/auth';
import type {
  CreateRequestInput,
  ListRequestsQuery,
  ServiceRequestDto,
  UpdateRequestInput,
} from '../types/request';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { runOverdueCheckIfStale } from '../jobs/overdue/overdue.service';
import { dashboardCache } from './dashboardCache';
import { buildPagination } from '../utils/pagination';

function toDto(r: ServiceRequest): ServiceRequestDto {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority,
    status: r.status,
    isOverdue: r.overdue,
    statusChangedAt: r.statusChangedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    createdBy: { id: r.creator!.id, name: r.creator!.name },
  };
}

const isAdmin = (user: AuthUser) => user.role === ROLES.ADMIN;

/** Admins see everything; employees only their own. Others' records answer 404 so they aren't leaked. */
async function getAccessible(user: AuthUser, id: string): Promise<ServiceRequest> {
  const record = await requestRepository.findById(id);
  if (!record || (!isAdmin(user) && record.createdBy !== user.id)) throw AppError.notFound('Service request not found');
  return record;
}

export const requestService = {
  async list(user: AuthUser, query: ListRequestsQuery) {
    await runOverdueCheckIfStale(env.OVERDUE_ON_DEMAND_SECONDS); // no-op when a worker is doing this
    const { rows, count } = await requestRepository.findPage(
      { status: query.status, priority: query.priority, overdue: query.overdue, createdBy: isAdmin(user) ? undefined : user.id },
      query.page,
      query.limit,
    );
    return { items: rows.map(toDto), pagination: buildPagination(query.page, query.limit, count) };
  },

  async getById(user: AuthUser, id: string) {
    return toDto(await getAccessible(user, id));
  },

  async create(user: AuthUser, input: CreateRequestInput) {
    const created = await requestRepository.create({ ...input, createdBy: user.id });
    await dashboardCache.invalidate();
    return toDto(created);
  },

  async update(user: AuthUser, id: string, input: UpdateRequestInput) {
    const record = await getAccessible(user, id);
    if (!isAdmin(user) && record.status !== 'OPEN') {
      throw AppError.forbidden('Only open requests can be edited');
    }
    await requestRepository.update(record, input);
    await dashboardCache.invalidate();
    return toDto(record);
  },

  async updateStatus(user: AuthUser, id: string, status: RequestStatus) {
    const record = await getAccessible(user, id);
    if (record.status === status) return toDto(record); // nothing changed, so nothing to invalidate
    const updated = await requestRepository.changeStatus(record, status);
    await dashboardCache.invalidate();
    return toDto(updated);
  },

  async remove(user: AuthUser, id: string) {
    await requestRepository.remove(await getAccessible(user, id));
    await dashboardCache.invalidate();
  },
};
