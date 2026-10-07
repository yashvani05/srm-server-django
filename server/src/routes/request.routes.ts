import { Router } from 'express';
import { PERMISSIONS } from '../constants';
import { requestController } from '../controllers/request.controller';
import { authenticate } from '../middlewares/authenticate';
import { requirePermission } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createRequestSchema,
  idParamSchema,
  listRequestsSchema,
  updateRequestSchema,
  updateStatusSchema,
} from '../validations/request.validation';

/**
 * @openapi
 * tags:
 *   - name: Service Requests
 *     description: Create, read, update, delete and change the status of requests
 */

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /requests:
 *   get:
 *     tags: [Service Requests]
 *     summary: List service requests
 *     description: "Requires `requests.read`. Admins see all requests; employees see only their own. Newest first. Filters combine with AND."
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Filter by status (case-insensitive)
 *         schema:
 *           $ref: '#/components/schemas/RequestStatus'
 *       - in: query
 *         name: priority
 *         description: Filter by priority (case-insensitive)
 *         schema:
 *           $ref: '#/components/schemas/RequestPriority'
 *       - in: query
 *         name: overdue
 *         description: "`true` returns only overdue requests (OPEN or IN_PROGRESS for more than 24h in the current status)"
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         description: Page number (1-based)
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         description: Items per page
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: A page of requests
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
 *                       required: [items, pagination]
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ServiceRequest'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', requirePermission(PERMISSIONS.REQUESTS_READ), validate(listRequestsSchema), requestController.list);

/**
 * @openapi
 * /requests:
 *   post:
 *     tags: [Service Requests]
 *     summary: Create a service request
 *     description: "Requires `requests.create`. The request starts as OPEN and is owned by the caller. `status` cannot be supplied."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category]
 *             additionalProperties: false
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150, example: Request access to the finance drive }
 *               description: { type: string, minLength: 1, maxLength: 5000, example: I have moved to the finance team and need read access. }
 *               category:
 *                 $ref: '#/components/schemas/RequestCategory'
 *               priority:
 *                 allOf:
 *                   - $ref: '#/components/schemas/RequestPriority'
 *                 default: MEDIUM
 *     responses:
 *       201:
 *         description: Request created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requirePermission(PERMISSIONS.REQUESTS_CREATE), validate(createRequestSchema), requestController.create);

/**
 * @openapi
 * /requests/{id}:
 *   get:
 *     tags: [Service Requests]
 *     summary: Get one service request
 *     description: "Requires `requests.read`. An employee asking for someone else's request gets 404 (its existence is not revealed)."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Service request id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The request
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', requirePermission(PERMISSIONS.REQUESTS_READ), validate(idParamSchema), requestController.getById);

/**
 * @openapi
 * /requests/{id}:
 *   patch:
 *     tags: [Service Requests]
 *     summary: Edit a service request
 *     description: >
 *       Requires `requests.update`. Partial update (at least one field). Employees may edit only their own requests,
 *       and only while OPEN (otherwise 403). Use `PATCH /requests/{id}/status` to change the status.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Service request id
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, minLength: 1, maxLength: 5000 }
 *               category:
 *                 $ref: '#/components/schemas/RequestCategory'
 *               priority:
 *                 $ref: '#/components/schemas/RequestPriority'
 *     responses:
 *       200:
 *         description: Updated request
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', requirePermission(PERMISSIONS.REQUESTS_UPDATE), validate(updateRequestSchema), requestController.update);

/**
 * @openapi
 * /requests/{id}/status:
 *   patch:
 *     tags: [Service Requests]
 *     summary: Change a request's status
 *     description: >
 *       Requires `requests.status.update` (admin only). Any transition is allowed, including reopening a resolved request.
 *       A real change restarts the overdue clock; re-submitting the current status changes nothing.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Service request id
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/RequestStatus'
 *     responses:
 *       200:
 *         description: Request with its new status
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.REQUESTS_STATUS_UPDATE),
  validate(updateStatusSchema),
  requestController.updateStatus,
);

/**
 * @openapi
 * /requests/{id}:
 *   delete:
 *     tags: [Service Requests]
 *     summary: Delete a service request
 *     description: "Requires `requests.delete` (admin only)."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Service request id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   required: [data]
 *                   properties:
 *                     data: { type: object, nullable: true, example: null }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', requirePermission(PERMISSIONS.REQUESTS_DELETE), validate(idParamSchema), requestController.remove);

export default router;
