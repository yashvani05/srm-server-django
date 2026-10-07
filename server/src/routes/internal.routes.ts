import { Router } from 'express';
import { runOverdueCheck } from '../jobs/overdue/overdue.service';
import { cronAuth } from '../middlewares/cronAuth';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

/**
 * @openapi
 * /internal/cron/overdue-check:
 *   get:
 *     tags: [System]
 *     summary: Run the overdue check now (for schedulers)
 *     description: >
 *       Runs the same overdue check the background worker runs: flags requests that have been OPEN or IN_PROGRESS for more
 *       than 24h, clears flags that should not be set, records the last successful run, and refreshes the dashboard cache.
 *       Meant for hosts with no worker process (Vercel Cron, or any external scheduler). Authenticated with the
 *       `CRON_SECRET` environment variable, not a user token. If `CRON_SECRET` is not configured the endpoint does not exist (404).
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: The check ran
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       type: object
 *                       required: [marked, cleared, durationMs]
 *                       properties:
 *                         marked: { type: integer, description: Requests newly flagged overdue }
 *                         cleared: { type: integer, description: Stale overdue flags cleared }
 *                         durationMs: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/cron/overdue-check', cronAuth, async (_req, res) => {
  sendSuccess(res, 'Overdue check completed', await runOverdueCheck());
});

export default router;
