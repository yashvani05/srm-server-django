import { Router } from 'express';
import { sequelize } from '../config/database';
import { sendSuccess } from '../utils/apiResponse';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import internalRoutes from './internal.routes';
import requestRoutes from './request.routes';

/**
 * @openapi
 * tags:
 *   - name: System
 *     description: Health check
 */

const router = Router();

router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/internal', internalRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Confirms the API is up and can reach PostgreSQL.
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                       properties:
 *                         status: { type: string, example: ok }
 *                         uptime: { type: number, description: Seconds since process start }
 */
router.get('/health', async (_req, res) => {
  await sequelize.query('SELECT 1');
  sendSuccess(res, 'Service is healthy', { status: 'ok', uptime: process.uptime() });
});

export default router;
