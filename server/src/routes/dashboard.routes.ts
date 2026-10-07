import { Router } from 'express';
import { PERMISSIONS } from '../constants';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';
import { requirePermission } from '../middlewares/authorize';

/**
 * @openapi
 * tags:
 *   - name: Dashboard
 *     description: Summary figures
 */

const router = Router();

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Dashboard summary
 *     description: >
 *       Requires `dashboard.read`. Organisation-wide counts (the same for every user). The counts are cached in Redis
 *       (key `dashboard:summary`, 60s) and the cache is cleared whenever a request is created, edited, deleted or changes
 *       status, and whenever the overdue worker changes anything. `overdueRequests` counts the flag maintained by the
 *       overdue worker; `lastOverdueCheckAt` says when that worker last ran successfully.
 *     responses:
 *       200:
 *         description: Summary counts
 *         headers:
 *           X-Cache:
 *             description: HIT when served from the Redis cache, MISS when read from PostgreSQL (and then cached).
 *             schema: { type: string, enum: [HIT, MISS] }
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/summary', authenticate, requirePermission(PERMISSIONS.DASHBOARD_READ), dashboardController.getSummary);

export default router;
