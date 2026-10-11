# PROJECT_HANDOVER — Service Request Management System

> Evidence labels used in every handover file: **[code]** read from the source in this inspection · **[ran]** I executed it and saw the result · **[README]** a claim in a README, not independently verified · **[memory]** my recollection of earlier work in the conversation · **[opinion]** my current assessment.

## 1. What this project is
An internal tool for submitting and tracking service requests (IT / Maintenance / General), with roles (ADMIN, EMPLOYEE), a dashboard, Redis caching and a periodic background "overdue" job. The repository (`self-assesment-project/`, a git repo with local commits only, **no remote**) contains **two interchangeable backends** and one frontend:

| Folder | What | Status |
|---|---|---|
| `client/` | React 19 + Vite + Tailwind 4 + TypeScript SPA | Used with either backend |
| `server-django/` | **Python Django 5 + DRF + Celery backend — the primary backend** (the client's assessment brief says "Backend: Django") | Built and tested (see below) |
| `server/` | Node/Express/TypeScript/Sequelize/BullMQ backend (the first implementation) | Kept for reference, not modified. **Not re-read line by line in this handover**; described from [memory] and its README. |
| `docs/` | Beginner guides (HTML/MD), Vercel deployment guide, live-demo kit | Mostly about the Node backend, except `docs/learn-django.html` |
| `handover/` | These documents | — |

The Django backend was written to be a **drop-in replacement**: same URLs under `/api/v1`, same JSON envelope, same field names, so the React client runs unchanged against it [code][ran].

**Stack facts verified from manifests [code]**
- Client (`client/package.json`): react ^19.3.0, react-router-dom ^7, axios, react-hook-form + Joi (`@hookform/resolvers/joi`), `@tanstack/react-table` ^9 (listed; see note in §6), Tailwind 4 via `@tailwindcss/vite`, TypeScript ^7, Vite ^8.
- Django (`server-django/requirements.txt`, pinned): Django 5.2.18, djangorestframework 3.18.3, celery 5.6.3, redis 6.4.0, django-redis 7.0.0, PyJWT 2.15.1, drf-spectacular 0.30.0 (+ sidecar), django-cors-headers 4.9.0, whitenoise 6.12.0, dj-database-url 3.1.2, python-dotenv 1.2.4, psycopg 3.3.6 (+ binary), gunicorn 26.2.0, flower 2.2.0 (installed but **not run/verified**).
- Database: PostgreSQL. Redis. Celery with Celery Beat. No Docker file exists for Django; the repo-root `docker-compose.yml` (for the Node setup) starts Redis (+ optional Postgres) [README].

## 2. Architecture
```
Browser (React SPA, :5173/5174/5175)
   │  axios  baseURL=/api/v1   (Authorization: Bearer <JWT>)
   ▼
Vite dev server ── proxy /api ──▶ Django (runserver :8000)         [VITE_PROXY_TARGET=http://localhost:8000]
                                   │ config/urls.py → app urls.py → DRF view → serializer → services.py → ORM
                                   ├──────────────▶ PostgreSQL  (db srm_django: users, service_requests, system_state + Django tables)
                                   └──────────────▶ Redis
                                                     DB 1  Django cache: dashboard summary, JWT denylist, login throttle, docs-auth counter
                                                     DB 2  Celery broker (queue)
Celery Beat  (every OVERDUE_CHECK_INTERVAL_SECONDS = 60s) ─ puts "check_overdue" on the queue (Redis DB 2)
Celery worker ─ takes the task ─ run_overdue_check() ─▶ PostgreSQL (flags rows, records last success) ─▶ clears dashboard cache
```
Responsibilities: the **client** renders, validates form input (Joi) for UX, and hides controls by permission; the **backend** is the security boundary (authentication, role permissions, ownership, validation, business rules). [code]

## 3. Folder tree (tracked files; generated/ignored folders excluded)
See `SOURCE_INVENTORY.md` for the full list with roles. Ignored/generated, mentioned because they affect setup: `server-django/.venv/` (Python virtualenv), `client/node_modules/`, `server/node_modules/`, `server/dist/`, `server-django/staticfiles/` (created by collectstatic, ignored), `server-django/.env` and `server/.env`, `client/.env` (real values, not included in the bundle), `celerybeat-schedule*` (Beat state file, ignored).

## 4. Django backend — file by file (`server-django/`)

### 4.1 `manage.py`, `config/`
- **`manage.py`** — Django's command-line entry (`runserver`, `migrate`, `test`, custom commands). Sets `DJANGO_SETTINGS_MODULE=config.settings`.
- **`config/settings.py`** — all configuration, read from environment variables (via `python-dotenv` loading `server-django/.env`). Key parts, in order:
  - Helpers `env`, `env_bool`, `env_int`.
  - `DEBUG` ← `DJANGO_DEBUG`; `TESTING = "test" in sys.argv` (used to swap Redis for in-memory cache and run Celery tasks inline); `SECRET_KEY` required unless DEBUG/TESTING (raises `ImproperlyConfigured`).
  - `ALLOWED_HOSTS` default `localhost,127.0.0.1,.trycloudflare.com`.
  - `INSTALLED_APPS`: django contrib apps, `rest_framework`, `corsheaders`, `drf_spectacular`, `drf_spectacular_sidecar`, and ours: `core`, `accounts`, `service_requests`, `dashboard`.
  - `MIDDLEWARE` includes `WhiteNoiseMiddleware` and `CorsMiddleware`. `APPEND_SLASH = False` because the React app calls `/requests` without a trailing slash.
  - `DATABASES`: if `DATABASE_URL` is set → `dj_database_url.parse(..., conn_max_age=60, ssl_require=DB_SSL)`; else `DB_NAME` (default `srm_django`), `DB_USER` (default `postgres`), `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
  - `AUTH_USER_MODEL = "accounts.User"`; `AUTH_PASSWORD_VALIDATORS = []` (password length is enforced by the serializers instead).
  - `REDIS_URL` (default `redis://localhost:6379`); `CACHES["default"]` = `django_redis` at `{REDIS_URL}/1`, `KEY_PREFIX "srmdj"`, `KEY_FUNCTION core.cache.make_key`, 2-second socket timeouts; **in tests** an in-memory `LocMemCache`.
  - `DASHBOARD_CACHE_TTL_SECONDS` (default 60); `JWT_SECRET` (falls back to `SECRET_KEY`), `JWT_EXPIRES_SECONDS` (default 3600), `LOGIN_RATE_LIMIT_MAX` (default 10).
  - `REST_FRAMEWORK`: default authentication `accounts.authentication.JWTAuthentication`; default permission `IsAuthenticated`; JSON-only renderer/parser; custom `EXCEPTION_HANDLER = core.exceptions.api_exception_handler`; `DATETIME_FORMAT "%Y-%m-%dT%H:%M:%S.%fZ"`; throttle rate `login: "<N>/15min"`; `NUM_PROXIES` ← `TRUST_PROXY`; `UNAUTHENTICATED_USER = None`.
  - `CORS_ALLOWED_ORIGINS` ← `CORS_ORIGIN` (default `http://localhost:5173`).
  - `SWAGGER_USER` (default `apidocs`) / `SWAGGER_PASS` (required unless DEBUG/TESTING) and `SPECTACULAR_SETTINGS` (title, description, tags, sidecar assets).
  - Celery: `OVERDUE_CHECK_INTERVAL_SECONDS` (60), `CELERY_BROKER_URL = {REDIS_URL}/2`, `CELERY_TASK_IGNORE_RESULT = True`, `CELERY_BEAT_SCHEDULE["overdue-check"] = {task: "service_requests.tasks.check_overdue", schedule: 60.0}`; in tests `CELERY_TASK_ALWAYS_EAGER = True`.
  - `USE_TZ = True`, `TIME_ZONE = "UTC"`; logging to console; in tests `PASSWORD_HASHERS = [MD5]` for speed.
- **`config/__init__.py`**, **`config/celery.py`** — create the Celery app `app = Celery("config")`, load every `CELERY_*` Django setting, `autodiscover_tasks()` (finds each app's `tasks.py`).  Note: `config/__init__.py` also imports the app so Celery is loaded when Django starts [code: 4 lines].
- **`config/urls.py`** — URL table: `admin/`; `api/v1/` ← includes `core.urls`, `accounts.urls`, `service_requests.urls`, `dashboard.urls`; `api-docs.json` (OpenAPI document) and `api-docs/` (Swagger UI), **both wrapped in `basic_auth_required`**; a catch-all `^api/.*$` → `core.views.api_not_found` (JSON 404). `handler404`/`handler500` → JSON handlers.
- **`config/wsgi.py`, `config/asgi.py`** — standard entry points for production servers (not used by `runserver` dev flow beyond Django internals).

### 4.2 `core/` — shared plumbing
- **`responses.py`** — `success(message, data=None, status=200, headers=None)` returns `{success: true, message, data}`; `error_body(message, errors=None)` returns `{success: false, message, errors: []}`. Every view uses these.
- **`exceptions.py`** — `Conflict` (409) and `ServiceUnavailable` (503) exception classes; `api_exception_handler(exc, context)`: converts Django's `Http404`/`PermissionDenied`, calls DRF's `exception_handler` (imported **inside** the function to avoid a circular import at startup), then rewrites the body into our error envelope: validation errors → `"Validation failed"` + flattened `errors[{field, message}]` (`non_field_errors` is renamed `body`); `ParseError` → "Malformed JSON in request body"; `NotAuthenticated` → "Authentication required"; throttled → "Too many login attempts. Please try again later."; permission denied → default text unless a custom message was given; default `NotFound` → "Resource not found". Forces status **401** for `AuthenticationFailed`/`NotAuthenticated` (DRF otherwise downgrades to 403 on views without an auth header). Unknown exceptions → logged, `500 "Internal server error"`.
- **`cache.py`** — `make_key(key, key_prefix, version)` → `"{prefix}:{key}"`, producing readable Redis keys such as `srmdj:dashboard:summary`.
- **`schema.py`** — helpers that describe our envelopes to Swagger: `FieldErrorSerializer`, `ErrorEnvelopeSerializer`, `PaginationSerializer` (declares `totalItems`), `envelope(name, data_serializer=None, many=False)` (cached factory of `{success,message,data}` serializers), and the `ERRORS` dict (400/401/403/404).
- **`docs_auth.py`** — `basic_auth_required(view)` decorator: constant-time comparison of SHA-256 digests with `SWAGGER_USER`/`SWAGGER_PASS`; counts failed attempts per IP in the cache (`docs-auth-failures:<ip>`, max 20 per 15 min → 429); answers `401` with `WWW-Authenticate: Basic realm="API Documentation"` so the browser shows the password prompt. Cache errors are swallowed (limiter skipped).
- **`views.py`** — `HealthView` (GET, no auth, runs `SELECT 1`, returns status + uptime); `api_not_found` and `server_error` JSON handlers.
- **`urls.py`** — `health`.

### 4.3 `accounts/` — users, login, roles
- **`models.py`** — `UserManager.create_user(email, name, password=None, role=EMPLOYEE, **extra)`: lowercases the email, sets the hashed password, `is_staff` for ADMIN, creates/gets the role's `Group` and adds the user to it. `User(AbstractBaseUser, PermissionsMixin)`: `id` UUID PK, `name`, `email` (unique + a case-insensitive `UniqueConstraint(Lower("email"))`), `is_active`, `is_staff`, `created_at`, `updated_at`; `db_table="users"`; properties `role` (ADMIN if in the ADMIN group, else EMPLOYEE — **a database query each time it is read**) and `api_permissions` (maps Django permissions held back to API names).
- **`roles.py`** — constants `ADMIN`, `EMPLOYEE`; `API_PERMISSIONS` (API name → Django permission, e.g. `requests.read` → `service_requests.read_requests`); `ROLE_PERMISSIONS` (ADMIN all six; EMPLOYEE `requests.read`, `requests.create`, `requests.update`, `dashboard.read`).
- **`jwt.py`** — `issue_token(user)` (claims `sub`, `role`, `jti`, `iat`, `exp`; HS256 with `JWT_SECRET`); `decode_token(token)` (algorithm pinned to HS256; requires `exp`, `sub`, `jti`; raises `AuthenticationFailed("Token expired")` or `("Invalid token")`).
- **`denylist.py`** — `deny(jti, expires_at)` stores `auth:denylist:<jti>` in the Django cache (Redis) with a TTL equal to the token's remaining life; `is_denied(jti)`; if the cache raises, **fails closed** with `ServiceUnavailable` (503).
- **`authentication.py`** — `JWTAuthentication.authenticate(request)`: no `Bearer` header → anonymous (returns `None`); else decode, check denylist (→ "Token has been revoked"), load active user (→ "Invalid token" if missing), return `(user, claims)` so `request.user` and `request.auth` are set. `authenticate_header` returns `"Bearer"` (so missing auth gives 401).
- **`permissions.py`** — `require_permission("requests.read")` builds a DRF permission class that calls `request.user.has_perm(<django permission>)`.
- **`throttles.py`** — `LoginThrottle(SimpleRateThrottle)`: `scope="login"`, parses `"10/15min"` as 10 per 900 s, keyed by client IP.
- **`serializers.py`** — `RegisterSerializer` (name 2–100, email, password 8–72, no whitespace trimming), `LoginSerializer`, `UserSerializer` (`id,name,email,role,permissions`), `AuthResultSerializer`, `CurrentUserSerializer`.
- **`views.py`** — `RegisterView` (public; **ignores any `role` in the body**; 409 on duplicate email, also on `IntegrityError` for a race), `LoginView` (public, throttled; looks the user up case-insensitively; always runs one password hash check — against a dummy hash if the user is unknown — to even out timing; 401 "Invalid email or password"), `LogoutView` (adds the token's `jti` to the denylist), `MeView`.
- **`urls.py`** — `auth/register`, `auth/login`, `auth/logout`, `auth/me`.
- **`schema.py`** — registers the Bearer-token scheme (`bearerAuth`) with Swagger.
- **`admin.py`, `apps.py`, `migrations/0001_initial.py`** — Django admin registration for users; app config (imports `schema` in `ready()`); the generated initial migration (creates `users` and the group/permission links).

### 4.4 `service_requests/` — the core domain
- **`models.py`** — `ServiceRequest` (table `service_requests`, see DATABASE doc): UUID `id`, `title` (≤150), `description`, `category` (IT/MAINTENANCE/GENERAL), `priority` (LOW/MEDIUM/HIGH, default MEDIUM), `status` (OPEN/IN_PROGRESS/RESOLVED, default OPEN), `status_changed_at`, `overdue`, `overdue_at`, `created_by` (FK→users, `PROTECT`), `created_at`, `updated_at`. `default_permissions=()` and a custom permission list (`read_requests`, `create_requests`, `update_requests`, `delete_requests`, `update_request_status`, `read_dashboard`). Indexes + CHECK constraints. `SystemState(key PK, value, updated_at)` (table `system_state`).
- **`constants.py`** — `OVERDUE_AFTER_HOURS = 24` — the single place the 24-hour threshold lives in the backend.
- **`services.py`** — business logic (views contain no rules):
  - `_is_admin(user)`, `_visible_to(user)` (admin: all rows; employee: `created_by=user`).
  - `list_requests(user, *, status, priority, overdue, page, limit)` → `(items, total)`, ordered `-created_at, -id`, sliced by `(page-1)*limit`.
  - `get_request(user, pk)` → `NotFound("Service request not found")` for missing **or someone else's** requests (existence is not leaked).
  - `create_request(user, data)`; `update_request(user, pk, data)` — non-admins may edit only while status is OPEN (else `PermissionDenied("Only open requests can be edited")`); saves only the sent fields + `updated_at`.
  - `change_status(user, pk, status)` — if unchanged, returns without touching anything; else sets `status`, `status_changed_at=Now()`, `overdue=False`, `overdue_at=None`.
  - `delete_request(user, pk)`.
  - Every write calls `dashboard_cache.invalidate()`.
- **`serializers.py`** — `ServiceRequestSerializer` (output with camelCase names `isOverdue`, `statusChangedAt`, `createdAt`, `updatedAt`, nested `createdBy{id,name}`); `RequestFieldsSerializer` (title 3–150, description ≤5000, category choice, priority choice default MEDIUM); `StrictRequestFieldsSerializer` (adds `status` that always raises "status cannot be set here; use PATCH /requests/:id/status"; for partial updates requires ≥1 field → "At least one field is required"); `StatusInputSerializer`; `ListQuerySerializer` (status/priority upper-cased first so they are case-insensitive; `page` ≥1 default 1; `limit` 1–100 default 10; `overdue` boolean); `PaginatedRequestsSerializer` (for docs).
- **`views.py`** — `RequestCollectionView` (GET list / POST create), `RequestDetailView` (GET / PATCH / DELETE), `RequestStatusView` (PATCH). Permissions per method through `require_permission`. Helpers `_check_id` (malformed UUID → 400 `{field:"id"}`) and `_body`. The list view builds `{items, pagination:{page, limit, totalItems, totalPages}}`. For PATCH, `priority` is dropped from the data unless it was actually sent (so its serializer default does not overwrite the stored value).
- **`urls.py`** — `requests`, `requests/<str:pk>`, `requests/<str:pk>/status`.
- **`overdue.py`** — see REDIS_AND_BACKGROUND_JOBS.md. Functions `qualifies_as_overdue()` and `run_overdue_check()` (returns `OverdueCheckResult(marked, cleared, duration_ms)`).
- **`tasks.py`** — Celery task `service_requests.tasks.check_overdue` (autoretry on any exception, backoff 5 s, max 3 retries) wrapping `run_overdue_check()`.
- **`apps.py`** — connects `sync_role_groups` to Django's `post_migrate` signal: after migrating the `service_requests` app, it creates the ADMIN/EMPLOYEE groups and **sets** each group's permissions to exactly those in `roles.ROLE_PERMISSIONS`.
- **`management/commands/seed_demo.py`** — creates the two demo users (emails/passwords from `SEED_*` env vars, defaults documented in the setup file) and 12 sample requests (skips any whose title already exists), with `created_at`/`status_changed_at` set in the past and the `overdue` flag preset for non-resolved items older than 24 h; clears the dashboard cache.
- **`management/commands/run_overdue_check.py`** — runs `run_overdue_check()` once, prints `marked/cleared/ms`.
- **`admin.py`** — registers `ServiceRequest` and `SystemState` in the Django admin.
- **`migrations/0001_initial.py`** — creates `system_state` and `service_requests` (+ indexes/constraints).
- **`tests/test_api.py`** — 10 tests (see §8).

### 4.5 `dashboard/`
- **`cache.py`** — `get()`, `put(value)`, `invalidate()` around the key **`dashboard:summary`** (stored in Redis as `srmdj:dashboard:summary`), TTL `DASHBOARD_CACHE_TTL_SECONDS`. All three catch exceptions and log a warning — a Redis problem degrades to "no cache", it never breaks the dashboard.
- **`services.py`** — `build_summary()` (one `aggregate()` with six `Count(..., filter=Q(...))`) and `last_overdue_check_at()` (reads `system_state` fresh each time).
- **`views.py`** — `SummaryView.get`: `cache.get()`; on miss, `build_summary()` then `cache.put()`; then adds `lastOverdueCheckAt` (always read fresh, never cached); response header `X-Cache: HIT|MISS`. Requires `dashboard.read`.
- **`urls.py`** — `dashboard/summary`.

## 5. React client — file by file (`client/src/`)
Entry: `index.html` → `src/main.tsx` (StrictMode + `BrowserRouter`) → `App.tsx` (`ToastProvider` → `AuthProvider` → `AppRoutes`).

### 5.1 Routing and auth state
- **`routes/AppRoutes.tsx`** — routes: public-only `/login`, `/register` (inside `AuthLayout`); protected, inside `AppLayout`: `/dashboard`, `/requests`, `/requests/new`, `/requests/:id`, `/requests/:id/edit`; `/` redirects to `/dashboard`; `*` → `NotFoundPage`.
- **`routes/ProtectedRoute.tsx`** — `ProtectedRoute` (shows `AppShellSkeleton` while the stored token is being validated; no user → redirect to `/login` with `state.from`), `PublicOnlyRoute` (signed-in users are bounced to `/dashboard`).
- **`context/AuthContext.tsx`** — `AuthProvider` state `user`, `isLoading`; on load, if `localStorage` has a token it calls `GET /auth/me`; listens for the `auth:expired` window event raised by the axios interceptor; `login`, `register`, `logout` (calls the API, always clears the local token), `hasPermission(permission)` (UI only).
- **`utils/tokenStorage.ts`** — get/set/clear of the JWT under the key `srm.token` in `localStorage`, every access wrapped in `try/catch`.
- **`context/ToastContext.tsx`** + `hooks/useToast.ts` — success/error/info toasts.
- **`hooks/useAuth.ts`** — reads the context.

### 5.2 API layer
- **`services/api/axiosInstance.ts`** — axios instance with `baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"`, 15 s timeout; request interceptor adds `Authorization: Bearer <token>`; response interceptor: a 401 on anything except login/register clears the token and dispatches `auth:expired`; network/timeout errors become `ApiError("Unable to reach the server." | "The request timed out.")`; otherwise an `ApiError(message, status, errors[])` built from the response envelope. `unwrap<T>()` returns `response.data.data`.
- **`services/api/ApiError.ts`** — `ApiError` (message, status, errors, `isNotFound`) and `toErrorMessage`.
- **`auth.api.ts`**, **`request.api.ts`**, **`dashboard.api.ts`** — thin typed functions; the exact endpoints are listed in API_REFERENCE.md.
- **`types/*.ts`** — TypeScript shapes of the API (`ServiceRequest`, `Paginated<T>`, `DashboardSummary`, `User`, …). **These types are the contract the Django backend must match** (two Django response shapes did not match them until fixed during this inspection — see ASSIGNMENT_GAP_ANALYSIS.md).

### 5.3 Data hooks
- **`hooks/useAsyncData.ts`** — generic fetch-on-mount/deps hook with `AbortController` cancellation, a minimum 450 ms first-load time (so the skeleton does not flicker), `isLoading` (true only until the first result), `isFetching`, `reload`, `setData`.
- **`useRequests.ts`** (list with filters), **`useRequest.ts`** (one), **`useDashboardSummary.ts`**.
- **`useRequestActions.ts`** — `create`, `update`, `remove`, `changeStatus`; each tracks `pending`, shows a success/error toast, and **resolves to `{data}` or `{error}` (never throws)**.
- **`useGoBack.ts`** — Cancel goes back in history, falling back to a fixed path when the page was opened directly.

### 5.4 Pages
- **`pages/dashboard/DashboardPage.tsx`** — `useDashboardSummary`; states: skeleton (`isLoading`), error card with Retry, empty state when `totalRequests === 0`, else `SummaryGrid` (six cards, each a link to a pre-filtered list, the overdue card also shows "checked X ago" from `lastOverdueCheckAt`) and `StatusBreakdown`.
- **`pages/requests/RequestsListPage.tsx`** — filters/page live in the URL query string (`status`, `priority`, `overdue`, `page`), validated with `oneOf`; `useRequests` with `PAGE_SIZE = 10`; `RequestFilters`, `RequestTable` (TanStack table, kebab `ActionMenu` per row), `Pagination`, `ConfirmDialog` for delete; empty states differ for "no data" vs "no match for filters"; steps back a page when the last row of the last page is deleted.
- **`pages/requests/RequestCreatePage.tsx`** — `RequestForm` → `create()` → on success `navigate('/requests')`.
- **`pages/requests/RequestDetailsPage.tsx`** — shows badges, overdue banner, `StatusStepper`, description, metadata; admin-only `StatusActions` (buttons from a fixed transition table; **the API allows any transition, the UI offers sensible ones**); Edit/Delete in an `ActionMenu` (Edit only if `canEditRequest`, Delete only with `requests.delete`); delete confirm dialog; 404 → "not found" empty state.
- **`pages/requests/RequestEditPage.tsx`** — loads the request; blocks the form with "This request can't be edited." when `canEditRequest` is false; on success `navigate('/requests')`.
- **`pages/auth/LoginPage.tsx`, `RegisterPage.tsx`**, **`pages/NotFoundPage.tsx`**.
- **`components/requests/RequestForm.tsx`** — react-hook-form + Joi (`validations/request.validation.ts`); `mode: "onTouched"`; **maps server-side field errors (`errors[]`) back onto the matching form fields**.
- **`utils/permissions.ts`** — `canEditRequest(user, request)`: UI mirror of the backend rule (admin: yes; employee: own and OPEN).
- Remaining `components/ui/*`, `components/layout/*`, `components/common/*`, skeleton components and `index.css` are presentational (buttons, badges, menus, dialog, skeletons, Tailwind theme). Listed in SOURCE_INVENTORY.md.
- **`vite.config.ts`** — port 5173; `allowedHosts` includes `.trycloudflare.com` + `VITE_ALLOWED_HOSTS`; dev proxy `/api` (and `/admin/queues`, a Node/Bull Board leftover) → `VITE_PROXY_TARGET` **defaulting to `http://localhost:4000` (the Node server)**. For Django you must set `VITE_PROXY_TARGET=http://localhost:8000`.
- **`vercel.json`** — SPA rewrite for Vercel.

## 6. Observations about the client [code]
- `RequestTable.tsx` imports `createColumnHelper, tableFeatures, useTable` from `@tanstack/react-table` (v9) — the list table is built with TanStack Table.
- There are **no frontend tests** (`npm test` is a placeholder script). `npm run typecheck` and `npm run build` exist.

## 7. End-to-end flows (traced)

**App start** — `main.tsx` → `App` → `AuthProvider` reads token → if present `GET /auth/me`; routes render: `ProtectedRoute` waits (`AppShellSkeleton`) then renders `AppLayout` + page or redirects to `/login`.

**Login** — `LoginPage` → `AuthContext.login` → `POST /auth/login` → Django: `config/urls.py` → `accounts/urls.py` → `LoginView.post` (throttle → `LoginSerializer` → user lookup → password check → `issue_token`) → response `{token, user{...permissions}}` → token saved in `localStorage` → `navigate(from or /dashboard)`.

**Dashboard load** — `DashboardPage` → `dashboardApi.getSummary` → `GET /dashboard/summary` → `JWTAuthentication` → `require_permission("dashboard.read")` → `SummaryView.get` → Redis `srmdj:dashboard:summary` hit or `build_summary()` (one SQL aggregate) → merge fresh `lastOverdueCheckAt` → `X-Cache`.

**List + filters** — URL `?status=OPEN&priority=HIGH&overdue=true&page=2` → `useRequests` → `GET /requests?...&limit=10` → `ListQuerySerializer` → `services.list_requests` (ownership scoping, filters, order, slice) → `{items, pagination}`.

**Create** — `RequestForm` (Joi) → `useRequestActions.create` → `POST /requests` → `StrictRequestFieldsSerializer` → `services.create_request` (+ cache invalidate) → 201 → toast → `/requests`. Server-side validation errors are shown next to fields.

**Details / edit / status / delete** — `GET /requests/<id>`; `PATCH /requests/<id>` (partial); `PATCH /requests/<id>/status` (admin); `DELETE /requests/<id>` (admin). See API_REFERENCE.md for payloads and codes.

**Overdue** — see REDIS_AND_BACKGROUND_JOBS.md.

## 8. Tests [ran]
`cd server-django && source .venv/bin/activate && python manage.py test` → **10 tests, OK** (last run during this inspection, after the fixes). They cover: login/logout token revocation; bad password & missing token; create + validation + `status` rejection; employee ownership scoping and 404s; edit rules and admin-only actions; filters and pagination; overdue boundaries (23 h / 25 h / 30 h in progress / resolved), idempotence, status change resets the clock, stale-flag healing; dashboard counts, cache MISS→HIT and invalidation on write. They run on an in-memory cache with Celery in eager mode, so **they do not exercise real Redis or a real Celery worker** — those were checked by hand (see REDIS doc). Not covered by tests: Redis-down behaviour, login rate limiting, Swagger Basic auth, the `seed_demo` command, the Celery schedule itself.

## 9. Known limitations / honest notes [opinion]
- `User.role` runs a query on each access; `UserSerializer` and `issue_token` each read it (a few extra small queries per login/`me`). Acceptable at this scale.
- `ServiceRequestSerializer` uses `select_related("created_by")` in services, so list is not N+1; `change_status` and `update_request` re-read only when needed.
- The 24-hour threshold exists in the backend (`constants.py`) and, for display text only, in the client (`constants/requests.ts`).
- Swagger tags/responses were cleaned during this inspection; `python manage.py spectacular` now produces no warnings [ran].
- The Node README at the repo root describes the Node backend only (see ASSIGNMENT_GAP_ANALYSIS.md, "Documentation discrepancies").
