import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { OVERDUE_AFTER_HOURS, PERMISSIONS, REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES, ROLES } from '../constants';

// Shared pieces only (info, security scheme, models, common error responses).
// Each route documents itself with an `@openapi` YAML block directly above it in src/routes/*.routes.ts.

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
});

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Service Request Management API',
      version: '1.0.0',
      description: [
        'Internal service request tracking: submit requests, move them through Open → In Progress → Resolved, and monitor them on a dashboard.',
        '',
        '**Authentication.** Call `POST /auth/login`, then click **Authorize** and paste the returned `token` (Bearer JWT).',
        '',
        '**Roles & permissions.**',
        `- \`${ROLES.ADMIN}\`: full access.`,
        `- \`${ROLES.EMPLOYEE}\`: can create requests, and can read/edit **only their own** requests (editing only while \`OPEN\`). Cannot delete, change status, or see others' requests (those return 404).`,
        '',
        `**Overdue.** A request is overdue when it has been \`OPEN\` or \`IN_PROGRESS\` for more than ${OVERDUE_AFTER_HOURS} hours *in its current status* (\`statusChangedAt\`). Resolved requests are never overdue.`,
        '',
        '**Envelope.** Success: `{ success: true, message, data }`. Error: `{ success: false, message, errors[] }`.',
      ].join('\n'),
    },
    servers: [{ url: '/api/v1', description: 'This server' }],
    // Fixes the order of the groups in the UI; each route file also declares its own tag next to its routes.
    tags: [
      { name: 'Auth', description: 'Registration, login, logout and the current user' },
      { name: 'Service Requests', description: 'Create, read, update, delete and change the status of requests' },
      { name: 'Dashboard', description: 'Summary figures' },
      { name: 'System', description: 'Health check' },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT from `POST /auth/login`. Expires after 1 hour.' },
        cronSecret: { type: 'http', scheme: 'bearer', description: 'The CRON_SECRET environment variable (used by schedulers, not users).' },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          required: ['success', 'message'],
          properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Operation completed successfully' } },
        },
        FieldError: {
          type: 'object',
          required: ['message'],
          properties: { field: { type: 'string', example: 'title' }, message: { type: 'string', example: '"title" length must be at least 3 characters long' } },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'message', 'errors'],
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: { type: 'array', items: { $ref: '#/components/schemas/FieldError' } },
          },
        },
        RequestCategory: { type: 'string', enum: [...REQUEST_CATEGORIES] },
        RequestPriority: { type: 'string', enum: [...REQUEST_PRIORITIES] },
        RequestStatus: { type: 'string', enum: [...REQUEST_STATUSES] },
        User: {
          type: 'object',
          required: ['id', 'name', 'email', 'role', 'permissions'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Demo Employee' },
            email: { type: 'string', format: 'email', example: 'employee@company.com' },
            role: { type: 'string', enum: Object.values(ROLES) },
            permissions: { type: 'array', items: { type: 'string', enum: Object.values(PERMISSIONS) } },
          },
        },
        AuthResult: {
          type: 'object',
          required: ['token', 'user'],
          properties: { token: { type: 'string', description: 'Bearer JWT' }, user: { $ref: '#/components/schemas/User' } },
        },
        ServiceRequest: {
          type: 'object',
          required: ['id', 'title', 'description', 'category', 'priority', 'status', 'isOverdue', 'statusChangedAt', 'createdAt', 'updatedAt', 'createdBy'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Laptop screen flickers' },
            description: { type: 'string' },
            category: { $ref: '#/components/schemas/RequestCategory' },
            priority: { $ref: '#/components/schemas/RequestPriority' },
            status: { $ref: '#/components/schemas/RequestStatus' },
            isOverdue: { type: 'boolean', description: `OPEN/IN_PROGRESS for more than ${OVERDUE_AFTER_HOURS}h in the current status` },
            statusChangedAt: { type: 'string', format: 'date-time', description: 'When the current status began (the overdue clock)' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'object', required: ['id', 'name'], properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } } },
          },
        },
        Pagination: {
          type: 'object',
          required: ['page', 'limit', 'totalItems', 'totalPages'],
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        DashboardSummary: {
          type: 'object',
          required: ['totalRequests', 'openRequests', 'inProgressRequests', 'resolvedRequests', 'highPriorityRequests', 'overdueRequests', 'lastOverdueCheckAt'],
          properties: {
            totalRequests: { type: 'integer', description: 'All requests' },
            openRequests: { type: 'integer', description: 'Status OPEN' },
            inProgressRequests: { type: 'integer', description: 'Status IN_PROGRESS' },
            resolvedRequests: { type: 'integer', description: 'Status RESOLVED' },
            highPriorityRequests: { type: 'integer', description: 'Priority HIGH (any status)' },
            overdueRequests: { type: 'integer', description: `Requests flagged overdue by the overdue worker (OPEN or IN_PROGRESS for more than ${OVERDUE_AFTER_HOURS}h in the current status)` },
            lastOverdueCheckAt: { type: 'string', format: 'date-time', nullable: true, description: 'When the overdue worker last completed successfully; null if it has never run. Always read fresh (not cached).' },
          },
        },
      },
      responses: {
        ValidationError: errorResponse('Validation failed (body, query or path parameters). `errors` lists each problem.'),
        Unauthorized: errorResponse('Missing, invalid, expired or revoked token'),
        Forbidden: errorResponse('Authenticated, but not permitted to do this'),
        NotFound: errorResponse('No such request (or not visible to the caller)'),
        TooManyRequests: errorResponse('Too many login attempts'),
        ServiceUnavailable: errorResponse('Redis (token denylist) is unavailable; the request fails closed'),
      },
    },
  },
  // Route files carry the per-route YAML. Both .ts (dev) and .js (compiled) are scanned.
  apis: [
    path.join(__dirname, '../routes/**/*.ts').replace(/\\/g, '/'),
    path.join(__dirname, '../routes/**/*.js').replace(/\\/g, '/'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
