# SOURCE_INVENTORY

Every tracked file, generated from `git ls-files` (lock files excluded). **read** = I opened and read the file in this handover. **listed** = present and classified by name/location but **not opened individually** in this pass (mostly presentational React components and generic Django boilerplate).


> **Bundle scope:** `PROJECT_HANDOVER_BUNDLE.zip` contains `handover/`, `server-django/`, `client/` (source + config, no images/lock files), the root `README.md`, `.env.example` and `docker-compose.yml`. It does **not** contain the legacy Node `server/` folder or `docs/` (listed below only because they are tracked in git).

## server-django

| File | Role | Inspected |
|---|---|---|
| `server-django/.env.example` | Safe env example (dev defaults) | read |
| `server-django/.gitignore` | Ignore rules | read |
| `server-django/accounts/__init__.py` | Package marker (empty) | read |
| `server-django/accounts/admin.py` | Admin registration | read |
| `server-django/accounts/apps.py` | App config | read |
| `server-django/accounts/authentication.py` | DRF JWT authentication | read |
| `server-django/accounts/denylist.py` | Redis token revocation | read |
| `server-django/accounts/jwt.py` | Issue/decode JWT | read |
| `server-django/accounts/migrations/0001_initial.py` | Creates users tables (generated) | read |
| `server-django/accounts/migrations/__init__.py` | Package marker (empty) | read |
| `server-django/accounts/models.py` | User model + manager | read |
| `server-django/accounts/permissions.py` | require_permission factory | read |
| `server-django/accounts/roles.py` | Roles to permissions map | read |
| `server-django/accounts/schema.py` | Swagger Bearer scheme | read |
| `server-django/accounts/serializers.py` | Auth serializers | read |
| `server-django/accounts/throttles.py` | Login rate limit | read |
| `server-django/accounts/urls.py` | /auth/* routes | read |
| `server-django/accounts/views.py` | register/login/logout/me | read |
| `server-django/config/__init__.py` | Loads Celery app | read |
| `server-django/config/asgi.py` | ASGI entry (standard) | read |
| `server-django/config/celery.py` | Celery app | read |
| `server-django/config/settings.py` | All configuration (env-driven) | read |
| `server-django/config/urls.py` | Root URL table + Swagger (Basic auth) | read |
| `server-django/config/wsgi.py` | WSGI entry (standard) | read |
| `server-django/core/__init__.py` | Package marker (empty) | read |
| `server-django/core/apps.py` | Config/misc | listed |
| `server-django/core/cache.py` | Redis key format | read |
| `server-django/core/docs_auth.py` | Basic auth for /api-docs | read |
| `server-django/core/exceptions.py` | Error mapping + 409/503 classes | read |
| `server-django/core/migrations/__init__.py` | Package marker (empty) | read |
| `server-django/core/responses.py` | Success/error envelopes | read |
| `server-django/core/schema.py` | Swagger envelope helpers | read |
| `server-django/core/urls.py` | /health | read |
| `server-django/core/views.py` | Health + JSON 404/500 | read |
| `server-django/dashboard/__init__.py` | Package marker (empty) | read |
| `server-django/dashboard/apps.py` | Config/misc | listed |
| `server-django/dashboard/cache.py` | Dashboard cache helpers | read |
| `server-django/dashboard/migrations/__init__.py` | Package marker (empty) | read |
| `server-django/dashboard/services.py` | Counts + last check | read |
| `server-django/dashboard/urls.py` | Route | read |
| `server-django/dashboard/views.py` | GET /dashboard/summary | read |
| `server-django/manage.py` | Django CLI entry | read |
| `server-django/requirements.txt` | Pinned Python dependencies | read |
| `server-django/service_requests/__init__.py` | Package marker (empty) | read |
| `server-django/service_requests/admin.py` | Admin registration | read |
| `server-django/service_requests/apps.py` | post_migrate group sync | read |
| `server-django/service_requests/constants.py` | OVERDUE_AFTER_HOURS=24 | read |
| `server-django/service_requests/management/__init__.py` | Package marker (empty) | read |
| `server-django/service_requests/management/commands/__init__.py` | Package marker (empty) | read |
| `server-django/service_requests/management/commands/run_overdue_check.py` | Run overdue check once | read |
| `server-django/service_requests/management/commands/seed_demo.py` | Demo data command | read |
| `server-django/service_requests/migrations/0001_initial.py` | Creates request tables (generated) | read |
| `server-django/service_requests/migrations/__init__.py` | Package marker (empty) | read |
| `server-django/service_requests/models.py` | ServiceRequest + SystemState | read |
| `server-django/service_requests/overdue.py` | Overdue check logic | read |
| `server-django/service_requests/serializers.py` | Input/output shapes + validation | read |
| `server-django/service_requests/services.py` | Business rules | read |
| `server-django/service_requests/tasks.py` | Celery task | read |
| `server-django/service_requests/tests/__init__.py` | Package marker (empty) | read |
| `server-django/service_requests/tests/test_api.py` | 10 automated tests | read |
| `server-django/service_requests/urls.py` | /requests routes | read |
| `server-django/service_requests/views.py` | Request endpoints | read |

## client

| File | Role | Inspected |
|---|---|---|
| `client/.env.example` | Client env example | read |
| `client/index.html` | Config/misc | listed |
| `client/package.json` | Frontend dependencies/scripts | read |
| `client/src/App.tsx` | Providers + routes | read |
| `client/src/assets/.gitkeep` | Config/misc | listed |
| `client/src/components/common/EmptyState.tsx` | Presentational/feature component | listed |
| `client/src/components/common/ErrorState.tsx` | Presentational/feature component | listed |
| `client/src/components/common/PageHeader.tsx` | Presentational/feature component | listed |
| `client/src/components/common/Pagination.tsx` | Pager | read |
| `client/src/components/dashboard/DashboardSkeleton.tsx` | Presentational/feature component | listed |
| `client/src/components/dashboard/StatusBreakdown.tsx` | Presentational/feature component | listed |
| `client/src/components/dashboard/SummaryCard.tsx` | Presentational/feature component | listed |
| `client/src/components/dashboard/SummaryGrid.tsx` | Six summary cards | read |
| `client/src/components/layout/AppShellSkeleton.tsx` | Presentational/feature component | listed |
| `client/src/components/layout/AuthPreview.tsx` | Presentational/feature component | listed |
| `client/src/components/layout/Brand.tsx` | Presentational/feature component | listed |
| `client/src/components/layout/MobileNav.tsx` | Presentational/feature component | listed |
| `client/src/components/layout/SidebarContent.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/NewRequestButton.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/OverdueBadge.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/PriorityBadge.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/RequestDetailsSkeleton.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/RequestFilters.tsx` | Filter controls | read |
| `client/src/components/requests/RequestForm.tsx` | Create/edit form | read |
| `client/src/components/requests/RequestTable.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/RequestTableSkeleton.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/StatusActions.tsx` | Status buttons | read |
| `client/src/components/requests/StatusBadge.tsx` | Presentational/feature component | listed |
| `client/src/components/requests/StatusStepper.tsx` | Presentational/feature component | listed |
| `client/src/components/ui/ActionMenu.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Badge.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Button.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/ButtonLink.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Card.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/ConfirmDialog.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/FilterTabs.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/FormField.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Icon.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/SegmentedRadio.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Skeleton.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/Spinner.tsx` | Presentational UI primitive | listed |
| `client/src/components/ui/TopProgress.tsx` | Presentational UI primitive | listed |
| `client/src/constants/requests.ts` | Options/labels/page size | read |
| `client/src/context/AuthContext.tsx` | Session state | read |
| `client/src/context/ToastContext.tsx` | Config/misc | listed |
| `client/src/hooks/useAsyncData.ts` | Fetch hook | read |
| `client/src/hooks/useAuth.ts` | Hook | listed |
| `client/src/hooks/useDashboardSummary.ts` | Dashboard hook | read |
| `client/src/hooks/useGoBack.ts` | Cancel/back helper | read |
| `client/src/hooks/useRequest.ts` | Single request hook | read |
| `client/src/hooks/useRequestActions.ts` | Mutations + toasts | read |
| `client/src/hooks/useRequests.ts` | List hook | read |
| `client/src/hooks/useToast.ts` | Hook | listed |
| `client/src/index.css` | Styles (Tailwind) | listed |
| `client/src/layouts/AppLayout.tsx` | Page layout | listed |
| `client/src/layouts/AuthLayout.tsx` | Page layout | listed |
| `client/src/main.tsx` | React entry | read |
| `client/src/pages/NotFoundPage.tsx` | Page | listed |
| `client/src/pages/auth/LoginPage.tsx` | Page | listed |
| `client/src/pages/auth/RegisterPage.tsx` | Page | listed |
| `client/src/pages/dashboard/DashboardPage.tsx` | Dashboard page | read |
| `client/src/pages/requests/RequestCreatePage.tsx` | Create page | read |
| `client/src/pages/requests/RequestDetailsPage.tsx` | Details page (partly read) | read |
| `client/src/pages/requests/RequestEditPage.tsx` | Edit page | read |
| `client/src/pages/requests/RequestsListPage.tsx` | List page | read |
| `client/src/routes/AppRoutes.tsx` | Route table | read |
| `client/src/routes/ProtectedRoute.tsx` | Auth guards | read |
| `client/src/services/api/ApiError.ts` | Normalised error | read |
| `client/src/services/api/auth.api.ts` | Auth API calls | read |
| `client/src/services/api/axiosInstance.ts` | HTTP client + interceptors | read |
| `client/src/services/api/dashboard.api.ts` | Dashboard API call | read |
| `client/src/services/api/request.api.ts` | Request API calls | read |
| `client/src/types/api.ts` | Envelope/pagination types | read |
| `client/src/types/auth.ts` | Auth types | read |
| `client/src/types/dashboard.ts` | Dashboard type (API contract) | read |
| `client/src/types/request.ts` | Request types | read |
| `client/src/utils/cn.ts` | Config/misc | listed |
| `client/src/utils/format.ts` | Config/misc | listed |
| `client/src/utils/permissions.ts` | canEditRequest | read |
| `client/src/utils/time.ts` | Time formatting | read |
| `client/src/utils/tokenStorage.ts` | Token in localStorage | read |
| `client/src/validations/auth.validation.ts` | Joi rules (auth) | read |
| `client/src/validations/request.validation.ts` | Joi rules (request) | read |
| `client/tsconfig.app.json` | Config/misc | listed |
| `client/tsconfig.json` | Config/misc | listed |
| `client/tsconfig.node.json` | Config/misc | listed |
| `client/vercel.json` | Vercel SPA config | read |
| `client/vite.config.ts` | Dev server + proxy | read |

## server

| File | Role | Inspected |
|---|---|---|
| `server/.env.example` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/.sequelizerc` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/.vercelignore` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/api/index.js` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/migrations/20261006100000-create-rbac-tables.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/migrations/20261006100100-create-users.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/migrations/20261006100200-create-service-requests.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/migrations/20261006110000-add-status-changed-at.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/migrations/20261007100000-add-overdue-state.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/package.json` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/public/index.html` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/seeders/20261006101000-rbac-reference-data.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/seeders/20261006102000-demo-users.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/seeders/20261006103000-demo-requests.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/app.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/config/database.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/config/env.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/config/redis.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/config/sequelize-cli.cjs` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/config/swagger.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/constants/index.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/controllers/auth.controller.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/controllers/dashboard.controller.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/controllers/request.controller.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/.gitkeep` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/overdue/overdue.queue.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/overdue/overdue.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/overdue/overdue.worker.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/overdue/run-once.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/jobs/scheduler.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/authenticate.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/authorize.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/cronAuth.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/docsAuth.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/errorHandler.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/notFound.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/rateLimiter.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/middlewares/validate.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/models/Permission.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/models/Role.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/models/ServiceRequest.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/models/User.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/models/index.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/repositories/dashboard.repository.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/repositories/overdue.sql.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/repositories/request.repository.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/repositories/systemState.repository.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/repositories/user.repository.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/routes/auth.routes.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/routes/dashboard.routes.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/routes/index.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/routes/internal.routes.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/routes/request.routes.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/server.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/auth.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/cache.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/dashboard.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/dashboardCache.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/request.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/services/tokenDenylist.service.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/types/.gitkeep` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/types/auth.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/types/dashboard.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/types/express.d.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/types/request.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/utils/AppError.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/utils/apiResponse.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/utils/jwt.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/utils/logger.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/utils/pagination.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/validations/auth.validation.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/validations/request.validation.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/src/worker.ts` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/tsconfig.json` | Legacy Node/Express backend file | not re-read in this pass (legacy) |
| `server/vercel.json` | Legacy Node/Express backend file | not re-read in this pass (legacy) |

## docs

| File | Role | Inspected |
|---|---|---|
| `docs/deploy-to-vercel.html` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/learn-django.html` | Django learning guide (written this session) | not re-read in this pass |
| `docs/learn-docker-redis-bullmq.html` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/learn-docker-redis-bullmq.md` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/README.md` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/add-jobs.js` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/board.js` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/cache-demo.js` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/package.json` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/queue.js` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/live-demo/worker.js` | Documentation / learning material (Node-oriented) | not re-read in this pass |
| `docs/redis-and-bullmq.md` | Documentation / learning material (Node-oriented) | not re-read in this pass |

## handover

| File | Role | Inspected |
|---|---|---|
| `handover/API_REFERENCE.md` | Handover document (deliverable) | written in this pass |
| `handover/DATABASE_AND_BUSINESS_LOGIC.md` | Handover document (deliverable) | written in this pass |
| `handover/PROJECT_HANDOVER.md` | Handover document (deliverable) | written in this pass |
| `handover/REDIS_AND_BACKGROUND_JOBS.md` | Handover document (deliverable) | written in this pass |
| `handover/SETUP_AND_DEPLOYMENT.md` | Handover document (deliverable) | written in this pass |

## (root)

| File | Role | Inspected |
|---|---|---|
| `.env.example` | Root config/overview | read (relevant parts) |
| `.gitignore` | Root config/overview | listed |
| `README.md` | Root README (Django quick start added in this pass) | read (relevant parts) |
| `docker-compose.yml` | Root config/overview | read (relevant parts) |
