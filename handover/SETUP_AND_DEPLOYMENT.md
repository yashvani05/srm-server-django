# SETUP_AND_DEPLOYMENT

Secrets policy: this file lists variable **names** only. Real values live in your untracked `.env` files. The repo's `*.env.example` files contain development defaults (including demo-account credentials under `SEED_*`); look there, they are intentionally not copied here.

Evidence labels: **[ran]** I executed it in this environment; **[code]** from files only; **[not run]**.
Working directory is stated for every command. `ROOT` = the repository root `self-assesment-project/`.

## 1. Prerequisites
| Need | Notes |
|---|---|
| Python 3.10+ | the existing virtualenv was built with Python 3.13.7 [ran] (Django 5.2 supports 3.10–3.13) |
| Node.js 20+ and npm | for the client |
| PostgreSQL | local server on port 5432 [ran: user `reyna`, database `srm_django`] |
| Redis | easiest via Docker; the container name used here is `srm-redis`, port 6379 [ran] |
| Docker (only for Redis) | optional if you already have Redis |

## 2. One-time setup
```bash
# ROOT: Redis (Docker). Creates/starts the container from docker-compose.yml (defines service "redis", container srm-redis)
docker compose up -d redis            # or: docker start srm-redis   (if the container already exists)

# ROOT: create the Django database
createdb srm_django                   # [ran] needs a local Postgres user that can create databases

# server-django/: Python environment and dependencies
cd server-django
python3 -m venv .venv                 # [ran earlier: creates .venv]
source .venv/bin/activate
pip install -r requirements.txt       # installs the pinned dependencies

# server-django/: configuration (edit values; never commit .env)
cp .env.example .env
```
Environment variables (names; defaults in `.env.example` / `config/settings.py`):
`DJANGO_DEBUG`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ORIGIN`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DATABASE_URL` (replaces the `DB_*` set), `DB_SSL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_SECONDS`, `LOGIN_RATE_LIMIT_MAX`, `TRUST_PROXY`, `DASHBOARD_CACHE_TTL_SECONDS`, `OVERDUE_CHECK_INTERVAL_SECONDS`, `SWAGGER_USER`, `SWAGGER_PASS`, `LOG_LEVEL`, and the optional `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_EMPLOYEE_EMAIL`, `SEED_EMPLOYEE_PASSWORD`.
Client: `client/.env` — `VITE_API_BASE_URL` (default `/api/v1`), `VITE_PROXY_TARGET` (dev proxy target), `VITE_ALLOWED_HOSTS`.

```bash
# server-django/ (venv active, Postgres + Redis running)
python manage.py migrate        # [ran] creates all tables and the ADMIN/EMPLOYEE groups. Expect "Applying … OK" lines.
python manage.py seed_demo      # [ran] "Seed complete: 12 new request(s)." Safe to re-run (skips existing).

# client/
cd ../client
npm install
```

## 3. Running (three terminals; Postgres and Redis must already be running)
```bash
# Terminal 1 — server-django/ (venv active): the API on http://localhost:8000/api/v1
python manage.py runserver 8000                 # [ran]

# Terminal 2 — server-django/ (venv active): worker + scheduler together (development)
celery -A config worker -B -l info --pool=solo  # [ran] expect "Overdue check finished: marked=… " about once a minute

# Terminal 3 — client/: the UI. IMPORTANT: point the dev proxy at Django (the default target is the Node server on :4000)
VITE_PROXY_TARGET=http://localhost:8000 npm run dev      # [ran: used --port 5175]; opens on http://localhost:5173 by default
```
Other useful URLs: Swagger UI `http://localhost:8000/api-docs/` (Basic auth with `SWAGGER_USER`/`SWAGGER_PASS`) [ran]; Django admin `http://localhost:8000/admin/` (needs a staff user; `createsuperuser` or the seeded admin account, which has `is_staff=True`) [code]; health `GET /api/v1/health` [ran].
Run the overdue check once without Celery: `python manage.py run_overdue_check` (server-django/) [ran].
Separate scheduler and worker (production style): `celery -A config worker -l info` and `celery -A config beat -l info` [code; `--pool=solo` is used above for macOS dev simplicity].

## 4. Tests, type checks, lint
| What | Command (directory) | Result |
|---|---|---|
| Django tests | `python manage.py test` (server-django/, venv) | **10 tests OK** [ran, this inspection] |
| Client type check | `npm run typecheck` or `npx tsc --noEmit -p .` (client/) | `tsc --noEmit` passed after the last UI change [ran] |
| Client build | `npm run build` (client/) | script exists (`tsc -b && vite build`); **not run in this pass** |
| Lint | none configured (no ESLint config; the `eslint-disable` comment in `useAsyncData.ts` is a leftover) | – |
| Client tests | none (`npm test` is a placeholder) | – |
| OpenAPI generation check | `python manage.py spectacular --file /tmp/openapi.yml` (server-django/) | no warnings [ran] |
Earlier in the session a browser-driven UI suite and an OpenAPI contract test were run against the **Node** backend [memory]; they have **not** been re-run against Django.

## 5. Local vs production differences
| Setting | Local | Production |
|---|---|---|
| `DJANGO_DEBUG` | `true` | must be `false`; then `DJANGO_SECRET_KEY` and `SWAGGER_PASS` become mandatory (the app raises `ImproperlyConfigured` at start without them) [code] |
| `ALLOWED_HOSTS` | defaults incl. localhost | set `DJANGO_ALLOWED_HOSTS` to your domain(s) |
| CORS | `CORS_ORIGIN=http://localhost:5173` | set to the real front-end origin(s), comma-separated |
| Database | `DB_*` | `DATABASE_URL` (+ `DB_SSL=true` for most hosted databases) |
| Redis | `REDIS_URL=redis://localhost:6379` (code appends `/1` for cache, `/2` for Celery) | hosted Redis URL. **Risk [not verified]:** some hosted Redis products (e.g. Upstash) expose only database 0, so the `/1` and `/2` suffixes may fail; this would need a code/config change (`CACHES` and `CELERY_BROKER_URL` in `settings.py`). |
| Proxy | `TRUST_PROXY=0` | number of reverse-proxy hops (so the login throttle sees the real client IP) |
| Static files | – | `python manage.py collectstatic` (settings: `STATIC_ROOT=server-django/staticfiles`, WhiteNoise serves it) [code, not run] |
| App server | `runserver` | `gunicorn config.wsgi` (gunicorn is in requirements) [not run] |
| Celery | worker `-B` in one process | one worker process + **exactly one** beat process, kept running by a process manager |

## 6. Deployment status (honest)
- **No Django deployment configuration exists in the repo** (no Dockerfile, Procfile, platform config or CI). Only `gunicorn`, `whitenoise` and `dj-database-url` are prepared in requirements/settings.
- Client: `client/vercel.json` exists (Vite build, SPA rewrite). Set `VITE_API_BASE_URL` to the deployed API's full `/api/v1` URL and rebuild [README for the Node variant; same mechanism].
- The earlier Vercel work (`server/vercel.json`, serverless entry, Vercel Cron for overdue) applies only to the **Node** backend [README].
- Celery cannot run on serverless platforms; a Django deployment needs an always-on host (VM, container platform) for the API, the worker and Beat, plus managed PostgreSQL and Redis.
- No git remote is configured; commits are local only [ran: `git log`].

## 7. Troubleshooting seen during development
- UI shows "Unable to reach the server" or 404s on `/api`: the Vite proxy is pointing at `:4000` (Node) — start Vite with `VITE_PROXY_TARGET=http://localhost:8000`.
- Port in use: another Vite/API instance is running; use `--port` or stop the old process.
- Login returns 401 after many attempts: the throttle (10 per 15 min per IP). Wait, or set `LOGIN_RATE_LIMIT_MAX` higher in `.env` and restart.
- Dashboard "worker has not run yet": Celery worker/beat not running or Redis down.
