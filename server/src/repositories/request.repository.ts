import { fn, type WhereOptions } from 'sequelize';
import type { RequestPriority, RequestStatus } from '../constants';
import { ServiceRequest } from '../models';
import type { CreateRequestInput } from '../types/request';

const withCreator = [{ association: 'creator', attributes: ['id', 'name'] }];

export interface RequestFilters {
  createdBy?: string;
  status?: RequestStatus;
  priority?: RequestPriority;
  overdue?: boolean;
}

function toWhere(filters: RequestFilters): WhereOptions {
  const where: Record<string, unknown> = {};
  if (filters.createdBy) where.createdBy = filters.createdBy;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  // `overdue` is the persisted flag maintained by the overdue worker (see jobs/overdue).
  if (filters.overdue) where.overdue = true;
  return where;
}

export const requestRepository = {
  findPage(filters: RequestFilters, page: number, limit: number) {
    return ServiceRequest.findAndCountAll({
      where: toWhere(filters),
      include: withCreator,
      // `id` breaks ties so pages stay stable when several rows share a timestamp.
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });
  },

  findById(id: string) {
    return ServiceRequest.findByPk(id, { include: withCreator });
  },

  async create(data: CreateRequestInput & { createdBy: string }) {
    const created = await ServiceRequest.create(data);
    return (await this.findById(created.id))!;
  },

  async update(record: ServiceRequest, changes: Partial<Pick<ServiceRequest, 'title' | 'description' | 'category' | 'priority' | 'status'>>) {
    await record.update(changes);
    return record;
  },

  /** Changes status and restarts the "time in current status" clock using the database clock. */
  async changeStatus(record: ServiceRequest, status: RequestStatus) {
    // A new status starts a new clock, so any overdue flag is cleared right away (a resolved request can never stay
    // overdue); the worker re-flags it if it again spends more than 24h open / in progress.
    await record.update({ status, statusChangedAt: fn('now'), overdue: false, overdueAt: null });
    return (await this.findById(record.id))!; // re-read: statusChangedAt was set by the database, not by us
  },

  async remove(record: ServiceRequest) {
    await record.destroy();
  },
};
