# Service Request Management System

Internal tool for submitting and tracking service requests (IT, Maintenance, General).

**Two interchangeable backends serve the same React app and the same API (`/api/v1`):**

| Backend | Folder | Stack | Use it when |
|---|---|---|---|
| **Django (primary)** | [`server-django/`](server-django/) | Python, Django 5, Django REST Framework, Celery + Celery Beat, PostgreSQL, Redis | The client brief asks for Django. **This is the one to run and demo.** |
| Node (reference) | [`server/`](server/) | Node.js, Express, TypeScript, Sequelize, BullMQ, PostgreSQL, Redis | The first implementation; unchanged, kept for reference. The sections further down describe it. |

Frontend: React 19 + Vite + Tailwind (`client/`), unchanged for both.

> Status: Questions 1 and 2 implemented (API, UI, RBAC, Swagger docs, Redis dashboard cache, overdue background job) in both backends.

## Quick start: Django backend (primary)

Prerequisites: Python 3.10+, Node 20+, PostgreSQL running locally, Redis (Docker is the easiest way).

```bash
# 1. Redis (from the repo root)
docker compose up -d redis

# 2. Backend setup (once)
createdb srm_django
cd server-django
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit DB_USER / DB_PASSWORD for your local Postgres
python manage.py migrate      # creates tables + ADMIN / EMPLOYEE role groups
python manage.py seed_demo    # demo users (see SEED_* in .env.example) + 12 sample requests

# 3. Run (three terminals)
python manage.py runserver 8000                   # API   -> http://localhost:8000/api/v1   (in server-django/)
celery -A config worker -B -l info --pool=solo    # overdue worker + scheduler               (in server-django/)
cd client && npm install && VITE_PROXY_TARGET=http://localhost:8000 npm run dev   # UI -> http://localhost:5173
```

| What | Where / command |
|---|---|
| Swagger UI (HTTP Basic auth: `SWAGGER_USER` / `SWAGGER_PASS`) | http://localhost:8000/api-docs/ |
| Django admin | http://localhost:8000/admin/ |
| Tests | `cd server-django && python manage.py test` |
| Run the overdue check once, right now | `python manage.py run_overdue_check` |
| Health | `GET /api/v1/health` |

How it maps to the requirements: roles are Django Groups + Permissions (`accounts/roles.py`); the dashboard summary is cached in Redis for 60 s and cleared on every write (`dashboard/`); the overdue job is a Celery task (`service_requests/tasks.py`) scheduled by Celery Beat every 60 s, flags requests that have been OPEN / IN_PROGRESS for more than 24 h in their current status, and records the last success time (`system_state`). New to Django? Open [docs/learn-django.html](docs/learn-django.html). A full technical handover is in [handover/](handover/PROJECT_HANDOVER.md).

> The rest of this README (from "Prerequisites" down) documents the **Node** backend in `server/`. The API contract, roles, overdue rule and dashboard behaviour it describes are the same in Django.

## Prerequisites (Node backend)
- Node.js 20+ (developed on 22)
- PostgreSQL running locally (developed on 14)
- Docker (only for Redis, or for Postgres too if you don't have it locally)

## Setup

```bash
# 1. Environment files
cp server/.env.example server/.env      # edit DB_USER / DB_PASSWORD for your local Postgres
cp client/.env.example client/.env

# 2. Database (local PostgreSQL)
createdb service_requests

# 3. Redis (Docker)
docker compose up -d redis
#    No local Postgres? also start the optional one (host port 5433, set DB_PORT=5433):
#    docker compose --profile with-db up -d

# 4. Install dependencies
(cd server && npm install)
(cd client && npm install)
```

## Run

| What | Command |
|---|---|
| Backend API (http://localhost:4000/api/v1) | `cd server && npm run dev` |
| Frontend (http://localhost:5173) | `cd client && npm run dev` |
| Redis | `docker compose up -d redis` |
| API docs (Swagger UI) | http://localhost:4000/api-docs (raw spec: `/api-docs.json`) |
| Migrations | `cd server && npm run db:migrate` |
| Seeders | `cd server && npm run db:seed` |
| Background worker / scheduler | `cd server && npm run worker` (compiled: `npm run build && npm run start:worker`) |
| Run one overdue check now (no queue) | `cd server && npm run overdue:check` |

Health check: `GET /api/v1/health`

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 4000 | API port |
| `CORS_ORIGIN` | http://localhost:5173 | Allowed browser origin(s), comma separated |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | localhost / 5432 / – / – / empty | PostgreSQL connection |
| `REDIS_HOST` `REDIS_PORT` | localhost / 6379 | Redis connection |
| `JWT_SECRET` | – (required, ≥16 chars) | JWT signing secret |
| `JWT_EXPIRES_IN` | 1h | Token lifetime |
| `LOGIN_RATE_LIMIT_MAX` | 10 | Login attempts per IP per 15 minutes |
| `SWAGGER_USER` / `SWAGGER_PASS` | apidocs / ApiDocs@12345 (dev only) | Basic-auth credentials for `/api-docs`; `SWAGGER_PASS` is required in production |
| `VITE_ALLOWED_HOSTS` (client) | – | Extra dev-server hostnames (comma separated), e.g. `.ngrok-free.app`. `*.trycloudflare.com` is allowed by default |
| `VITE_PROXY_TARGET` (client) | http://localhost:4000 | Where the dev server proxies `/api` |
| `VITE_API_BASE_URL` (client) | /api/v1 | API base URL; dev server proxies `/api` to :4000 |

## Database
The schema is managed **only through migrations** (`server/migrations`). `sequelize.sync()` is never used.

```bash
cd server
npm run db:migrate           # apply all migrations
npm run db:seed              # roles + permissions reference data (idempotent, safe to re-run)
npm run db:migrate:undo:all  # roll everything back
```

Tables: `roles`, `permissions`, `role_permissions`, `users`, `service_requests`.
Enum-like columns (category, priority, status) are `VARCHAR` with `CHECK` constraints; primary keys for users and requests are UUIDs.

## Deploying to Vercel
Step-by-step guide (with the exact settings, a troubleshooting table and a security checklist): **[docs/deploy-to-vercel.html](docs/deploy-to-vercel.html)**.
In short: the React app and the API are two Vercel projects (`client/` and `server/`); PostgreSQL is hosted on **Neon** and Redis on **Upstash**
(Vercel cannot run either). Vercel also cannot run the long-lived BullMQ worker, so there the overdue check runs as a **Vercel Cron Job every 24 hours** (`server/vercel.json`, calling the secured endpoint `/api/v1/internal/cron/overdue-check` with `CRON_SECRET`). Status changes still clear overdue flags immediately. For fresher flags, optionally set `OVERDUE_ON_DEMAND_SECONDS` (runs the check when the dashboard or list is opened and the last run is older than that), use an external scheduler, or run the worker elsewhere. The BullMQ worker itself (`npm run start:worker`) is unchanged and can run on any always-on host.

## Authentication
JWT (HS256, `JWT_EXPIRES_IN`, default 1h) with bcrypt-hashed passwords.

| Endpoint | Notes |
|---|---|
| `POST /api/v1/auth/register` | Always creates an `EMPLOYEE` (a `role` in the body is ignored) |
| `POST /api/v1/auth/login` | Rate limited: 10 attempts / 15 min / IP |
| `POST /api/v1/auth/logout` | Real logout: the token's `jti` goes on a Redis denylist until it expires |
| `GET /api/v1/auth/me` | Current user, role and permissions |

If Redis is unreachable, authenticated requests fail closed with `503`.

`npm run db:seed` also loads 12 sample requests (including overdue examples) so a fresh install has data to look at.

Demo accounts created by `npm run db:seed` (override with `SEED_*` env vars; development only):

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@company.com | Admin@12345 |
| EMPLOYEE | employee@company.com | Employee@12345 |

## API documentation (Swagger / OpenAPI)
Interactive docs: **http://localhost:4000/api-docs** (raw OpenAPI JSON: `/api-docs.json`). Also reachable through the Vite dev server and tunnels.

**The docs are password protected** (HTTP Basic auth: your browser shows an ID / password prompt).
Set `SWAGGER_USER` / `SWAGGER_PASS` in `server/.env`. Development defaults are `apidocs` / `ApiDocs@12345`;
in production `SWAGGER_PASS` is required (≥ 8 chars) and the server refuses to start without it. Failed attempts are rate limited.

To try protected endpoints inside the UI: `POST /auth/login`, copy the `token`, click **Authorize**, paste it.

**How it is written:** with `swagger-jsdoc`. Every route has its own `@openapi` YAML block directly above it in
`server/src/routes/*.routes.ts` (each route file also declares its tag at the top). Shared pieces (API info, Bearer scheme,
models such as `ServiceRequest`, common error responses, tag order) live in `server/src/config/swagger.ts`.
To document a new route, add an `@openapi` block above it; no other file needs to change.

Verified against the running API: the spec is valid OpenAPI 3, 43 of the 44 documented responses were exercised live and matched
their schemas (the 44th is the Redis-down 503), and the code's 12 routes match the spec's 12 operations.

## Service request API
All endpoints require `Authorization: Bearer <token>`. Responses use `{ success, message, data }`; errors use `{ success: false, message, errors[] }`.

| Method & path | Permission | Notes |
|---|---|---|
| `GET /api/v1/requests` | `requests.read` | `?status=&priority=&page=1&limit=10` (limit max 100), newest first |
| `GET /api/v1/requests/:id` | `requests.read` | 404 if missing, or not yours (employees) |
| `POST /api/v1/requests` | `requests.create` | `title`, `description`, `category`, optional `priority` (default `MEDIUM`); new requests are `OPEN` |
| `PATCH /api/v1/requests/:id` | `requests.update` | Partial update; `status` is rejected here. Employees: own requests, `OPEN` only (else 403) |
| `PATCH /api/v1/requests/:id/status` | `requests.status.update` | `{ "status": "OPEN" \| "IN_PROGRESS" \| "RESOLVED" }`, any transition allowed (including reopening) |
| `DELETE /api/v1/requests/:id` | `requests.delete` | Admin only |

Status codes: 200/201 success · 400 validation · 401 unauthenticated · 403 not permitted · 404 not found · 409 conflict · 429 rate limited.

## Authorization (RBAC)
Permissions are stored in the database (`roles` → `role_permissions` → `permissions`) and loaded per request, so the database role is always authoritative, never a claim inside the token.
Routes are guarded with `authenticate` followed by `requirePermission(...)` or `requireRole(...)` (`src/middlewares/authorize.ts`).

| Permission | ADMIN | EMPLOYEE |
|---|---|---|
| `requests.read` | all requests | own requests only* |
| `requests.create` | ✅ | ✅ |
| `requests.update` | all requests | own requests, while `OPEN`* |
| `requests.delete` | ✅ | ❌ |
| `requests.status.update` | ✅ | ❌ |
| `dashboard.read` | ✅ | ✅ (org-wide summary) |

\* Ownership scoping is enforced in the service layer when the request endpoints are added. Backend checks are the security boundary; the frontend only hides controls.

## Dashboard
`GET /api/v1/dashboard/summary` (permission `dashboard.read`, org-wide) returns:

```json
{ "totalRequests": 0, "openRequests": 0, "inProgressRequests": 0,
  "resolvedRequests": 0, "highPriorityRequests": 0, "overdueRequests": 0 }
```
Every figure is a `COUNT(*) FILTER (...)` over `service_requests` in a single query; `/dashboard` renders them as six cards.
Redis caching of this endpoint is added in the caching phase.

## Redis: what it is used for
Redis is required (start it with `docker compose up -d redis`). It does three jobs:

| Job | Key / queue | Behaviour |
|---|---|---|
| Real logout | `auth:denylist:<token-id>` | Logout stores the token's id until it would have expired; every authenticated request checks it. If Redis is down, authenticated requests fail closed (503). |
| Dashboard cache | `dashboard:summary` | `GET /dashboard/summary` returns the six counts from Redis if present, otherwise reads PostgreSQL and caches them for 60s (`DASHBOARD_CACHE_TTL_SECONDS`). The `X-Cache: HIT / MISS` response header shows which. The key is deleted whenever a request is **created, edited, deleted or changes status**, and whenever the overdue worker changes anything. |
| Overdue job queue | BullMQ queue `overdue-check` | The worker's schedule and job state. |

Test it:
```bash
docker exec srm-redis redis-cli --scan                 # see the keys
docker exec srm-redis redis-cli ttl dashboard:summary  # seconds left (60 max)
curl -i -u ... /api/v1/dashboard/summary               # look at the X-Cache header: MISS, then HIT
# create / edit / delete a request (or change a status) in the UI, then --scan again: the key is gone
```

**New to Docker / Redis / BullMQ?** Open **[docs/learn-docker-redis-bullmq.html](docs/learn-docker-redis-bullmq.html)** in a browser (an illustrated beginner guide with three interactive simulators; the same content is in [learn-docker-redis-bullmq.md](docs/learn-docker-redis-bullmq.md)) (from zero, with a live-demo plan and a ready-made kit in [docs/live-demo/](docs/live-demo/README.md)). Then read [docs/redis-and-bullmq.md](docs/redis-and-bullmq.md): a plain-language walkthrough with diagrams,
a real recording of Redis commands, and five experiments. To *see* it: Bull Board at `http://localhost:4000/admin/queues`
(same ID / password as `/api-docs`) shows the job queue; `docker compose --profile tools up -d redisinsight` then
`http://localhost:5540` shows every Redis key and its countdown timer.

## Background overdue worker (BullMQ)
Run it as its own process next to the API: `cd server && npm run worker`.
- **Schedule:** every `OVERDUE_CHECK_INTERVAL_MS` (default **60000 = 1 minute**) plus once immediately on start. The schedule is registered idempotently, so restarting the worker never creates duplicates.
- **Each run** (one database transaction): flags requests that are `OPEN`/`IN_PROGRESS` for more than 24h in their current status (`overdue = true`, `overdue_at = now()`), clears any flag that should not be set (e.g. `RESOLVED`), then records the success time in `system_state` (`overdue_check.last_success_at`). If anything fails the whole run rolls back, so a failed run never records success. BullMQ retries it up to 3 times.
- **Idempotent:** it only touches rows whose flag is wrong, so running it twice changes nothing the second time.
- **Resolved never stays overdue:** any status change (including resolving) clears the flag immediately, without waiting for the worker.
- The dashboard and request list read the persisted flag, so overdue shown in the UI can lag by at most one interval. The dashboard shows when the worker last ran; `GET /dashboard/summary` returns it as `lastOverdueCheckAt`.

## Overdue rule (interpretation)
A request is **overdue** when its status is `OPEN` or `IN_PROGRESS` **and it has been in that status for more than 24 hours**.
The clock is `service_requests.status_changed_at`, which is set at creation and **restarted only when the status actually changes**
(editing a request, or re-submitting the same status, does not restart it).

- `RESOLVED` requests are never overdue.
- Changing `OPEN` → `IN_PROGRESS` restarts the 24h clock (it is a new status).
- A reopened request starts a fresh clock and becomes overdue again after another 24h in `OPEN`/`IN_PROGRESS`.
- "More than 24 hours" is strict: exactly 24h is not overdue.
- Rows that existed before `status_changed_at` was introduced were backfilled with `created_at` (no earlier history exists).
- All timestamps are compared with the database clock (`now()`).
- The result is stored as a flag (`overdue`, `overdue_at`) maintained by the worker described above.
