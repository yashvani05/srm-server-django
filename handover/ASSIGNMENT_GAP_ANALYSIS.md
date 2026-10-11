# ASSIGNMENT_GAP_ANALYSIS (Django backend + React client)

Status words: **Implemented** (verified in code and, where stated, by running/testing) · **Partial** · **Missing** · **Unverified**.
Evidence labels: **[code] [ran] [test]** as in the other handover files. README claims are not used as evidence.

## 1. Requirement-by-requirement
| # | Requirement | Status | Evidence (files / functions) | Actual behaviour | Remaining problem / risk |
|---|---|---|---|---|---|
| 1 | Request fields: title, description, category, priority, status, creation date | Implemented | `service_requests/models.py::ServiceRequest`; migration `0001_initial.py`; DB table inspected [ran] | All present; `createdAt` returned as ISO UTC. Extra fields: `statusChangedAt`, `overdue`, `overdue_at`, `updatedAt`, `createdBy` | — |
| 2 | CRUD + request details | Implemented | `service_requests/views.py`, `services.py`; client pages in `client/src/pages/requests/` | POST/GET list/GET one/PATCH/DELETE all exercised live [ran]; UI create/edit/details/delete pages exist [code] | UI itself was not re-driven in a browser against Django in this pass (see §3) |
| 3 | Status & priority filters | Implemented | `ListQuerySerializer`, `services.list_requests`; `RequestFilters.tsx`, `RequestsListPage.tsx` | `status`, `priority`, `overdue`, paging; case-insensitive; invalid values → 400 [ran, test]. Filters stored in URL query string | Offset pagination (fine for this size) |
| 4 | Dashboard counts: total, open, in-progress, resolved, high-priority, overdue | Implemented | `dashboard/services.py::build_summary`, `dashboard/views.py` | Six counts from one aggregate query; keys match `client/src/types/dashboard.ts` [ran] | Counts are org-wide for employees too (a product decision; stated in docs). **Bug found and fixed during this handover:** the Django API originally returned `total/open/...` while the client reads `totalRequests/openRequests/...`, which would have broken the Dashboard page; fixed and committed, and the existing tests were updated (they had encoded the wrong shape) |
| 5 | Overdue = Open/In Progress for >24 h; Resolved never overdue | Implemented (with an interpretation) | `service_requests/overdue.py::qualifies_as_overdue`, `constants.py`, `services.change_status` | "More than 24 h **in the current status**" (`status_changed_at`), strict `<`; resolved excluded; status change clears flag at once [test: boundaries 23 h / 25 h / 30 h, resolved, reset] | If the evaluator means "24 h since creation", behaviour differs for requests moved OPEN→IN_PROGRESS. One-line change described in DATABASE doc §4 |
| 6 | Redis caching for dashboard, with invalidation/refresh after create, update, delete, status change | Implemented | `dashboard/cache.py`, `dashboard/views.py`, `services.py` (`invalidate()` after each write), `overdue.py` | MISS→HIT→MISS-after-write observed against real Redis [ran]; invalidation on create tested [test] | Redis-down fallback for the dashboard exists in code but was **not exercised** for Django. Update/status-change invalidation is covered by code reading, and status change by test only indirectly |
| 7 | Periodic background job checking overdue requests | Implemented | `config/celery.py`, `settings.CELERY_BEAT_SCHEDULE`, `service_requests/tasks.py`, `overdue.py` | Real worker+Beat run flagged a request within ~1 min [ran] | Beat/queue not covered by automated tests; no Django deployment of the worker |
| 8 | Record last successful job execution time | Implemented | `overdue.py` (`SystemState` upsert in the same transaction), `dashboard/services.py::last_overdue_check_at`, shown in `SummaryGrid.tsx` | `lastOverdueCheckAt` returned and rendered as "checked X ago" [ran: value present] | Rollback-on-failure is by construction (single `atomic` block) but **no test forces a failure** |
| 9 | React/Next.js frontend with loading, empty, success, error states | Implemented | `client/src/hooks/useAsyncData.ts`, `components/*/…Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `ToastContext.tsx`, `RequestForm.tsx` (server field errors) | Skeletons, empty states (different for filters vs no data), error + retry, toasts, validation errors | No frontend automated tests; UI was verified against the Node backend with a browser script earlier [memory], not yet against Django |
| 10 | Database migrations | Implemented | `accounts/migrations/0001_initial.py`, `service_requests/migrations/0001_initial.py` | `showmigrations` shows both applied [ran] | — |
| 11 | Sensible project structure | Implemented [opinion] | see PROJECT_HANDOVER §4–5 | Views thin; rules in `services.py`; cross-cutting code in `core/` | The repo holds two backends; the Node one adds clutter for a Django-only submission |
| 12 | Documented setup | Implemented (after fix) | root `README.md`, `server-django/.env.example`, `docs/learn-django.html`, `handover/SETUP_AND_DEPLOYMENT.md` | Root README originally described **only** the Node backend; a Django quick-start section was added during this handover | The detailed README sections below the quick start are Node-specific (flagged in the README) |
| 13 | Backend in Django (client brief) | Implemented | `server-django/` | Django 5.2 + DRF + Celery | — |
| 14 | Auth / authorization (assessment extras) | Implemented | `accounts/*` | JWT login/register/logout (denylist), roles via Groups, ownership scoping | Login throttle, 503 fail-closed and expired-token paths not exercised in this pass |
| 15 | API documentation | Implemented | drf-spectacular; `config/urls.py`, `core/docs_auth.py` | Swagger UI behind Basic auth: 401 without, 200 with [ran]; `manage.py spectacular` has no warnings [ran] | Responses for 409/429 in the schema reuse the 400 error shape (`accounts/views.py`) — cosmetic. The earlier contract test (spec vs live responses) was done on Node only |
| 16 | Tests | Partial | `service_requests/tests/test_api.py` — 10 tests passing [ran] | Covers auth, CRUD rules, filters, overdue logic, dashboard cache | Uses in-memory cache and eager Celery; no real-Redis test, no throttle/503 test, no seed test, no frontend tests |
| 17 | Deployment | Missing (Django) | – | Only the Node backend had Vercel setup | No Dockerfile/Procfile/CI for Django. Celery needs an always-on host. Hosted Redis that only supports DB 0 would need a settings change (see SETUP doc §5) |

## 2. Documentation discrepancies found
- Root `README.md` (before this handover) and root `.env.example` described the Node backend only → README now has a Django quick start; **root `.env.example` still lists only the Node variables** (Django's are in `server-django/.env.example`).
- `client/vite.config.ts` still defaults `VITE_PROXY_TARGET` to `http://localhost:4000` (Node) and proxies `/admin/queues` (Bull Board, Node only). Running against Django requires `VITE_PROXY_TARGET=http://localhost:8000`.
- `docs/` guides (Vercel, Docker/Redis/BullMQ, live demo) describe the Node/BullMQ setup; `docs/learn-django.html` describes Django. The `docs/learn-django.html` guide shows demo credentials (development defaults).
- Swagger tag spelling had differed ("Service requests" vs "Service Requests") and two OpenAPI warnings existed (logout body, duplicate operationId) → fixed during this handover.

## 3. What was **not** re-verified for Django in this pass
Browser UI flows; the OpenAPI contract test; login throttling (429); Redis-down behaviours (dashboard fallback, 503); Celery task retry; two concurrent workers; Flower; `collectstatic`/gunicorn; `npm run build`.

## 4. Code changes made during the handover (disclosure)
You asked for no silent changes. Source changes made while preparing this handover, each committed separately in git:
1. `dashboard/services.py`, `dashboard/views.py` — dashboard JSON keys renamed to match the client; single DB read for `lastOverdueCheckAt`.
2. `service_requests/views.py` — pagination key `total` → `totalItems`; Swagger tag spelling; unique operation id.
3. `accounts/views.py` — logout schema `request=None`.
4. `service_requests/tests/test_api.py` — assertions updated to the corrected keys.
5. `README.md` — Django quick start section.
These were bugs/omissions in my earlier work, not behaviour changes you requested; they are listed here so ChatGPT's explanation matches the final code.

## 5. Biggest risks to be ready for in an interview [opinion]
1. "24 hours" interpretation (current-status clock vs creation).
2. Persisted overdue flag lags up to one interval; dashboard cache adds up to 60 s on counts (but is cleared on writes).
3. No Django deployment yet; Celery requires a long-running host.
4. Test suite does not use real Redis/Celery.
