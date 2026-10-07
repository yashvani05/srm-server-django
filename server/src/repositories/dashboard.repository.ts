import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import type { DashboardCounts } from '../types/dashboard';

// One pass over the table: every metric is a FILTERed COUNT, so a request is counted once per metric
// (a HIGH + OPEN + overdue request legitimately contributes to three metrics, but never twice to one).
// Overdue counts the persisted flag, which the overdue worker maintains (see jobs/overdue).
const COUNTS_SQL = `
  SELECT
    COUNT(*)::int                                        AS "totalRequests",
    COUNT(*) FILTER (WHERE status = 'OPEN')::int         AS "openRequests",
    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int  AS "inProgressRequests",
    COUNT(*) FILTER (WHERE status = 'RESOLVED')::int     AS "resolvedRequests",
    COUNT(*) FILTER (WHERE priority = 'HIGH')::int       AS "highPriorityRequests",
    COUNT(*) FILTER (WHERE overdue)::int                 AS "overdueRequests"
  FROM service_requests
`;

export const dashboardRepository = {
  async getCounts(): Promise<DashboardCounts> {
    const [row] = await sequelize.query<DashboardCounts>(COUNTS_SQL, { type: QueryTypes.SELECT });
    return row;
  },
};
