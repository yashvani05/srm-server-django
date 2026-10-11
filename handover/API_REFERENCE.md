# API_REFERENCE — Django backend (`server-django/`)

Base URL (dev): `http://localhost:8000/api/v1` (the React dev server proxies `/api` to it). All bodies are JSON.
Evidence: **[ran]** = I called the live server during this inspection (script output recorded, 2026-10-11) and saw the status/body quoted. **[test]** = covered by an automated test in `service_requests/tests/test_api.py`. **[code]** = read from source only (not exercised).

## Envelopes (`core/responses.py`, `core/exceptions.py`)
```json
success: { "success": true,  "message": "…", "data": <object | null> }
error:   { "success": false, "message": "…", "errors": [ { "field": "title", "message": "…" } ] }
```
`errors` is `[]` for non-validation errors. Dates are ISO-8601 UTC with microseconds, e.g. `2026-10-09T05:29:47.242442Z`.

## Authentication
`Authorization: Bearer <JWT>` (HS256, 1 h by default). Missing/invalid token → 401. No role is trusted from the token: permissions come from the user's Django group in the database on every request.

## Endpoint table
Frontend caller = file/function in `client/src/services/api/`.

| # | Method & path | Purpose | Auth / permission | Query / body | Success | Errors seen | Backend handler | Frontend caller |
|---|---|---|---|---|---|---|---|---|
| 1 | `GET /health` | Liveness + DB check | none | – | 200 `{status:"ok", uptime}` [ran] | – | `core/views.py` `HealthView.get` | none |
| 2 | `POST /auth/register` | Create an EMPLOYEE account and sign in | none | `{name (2–100), email, password (8–72)}`; any `role` is ignored | 201 `{token, user}` [ran] (verified: I registered with `role:"ADMIN"` in the body and that account then got 403 on the admin-only status endpoint, so the role is ignored) | 400 validation [ran]; 409 `"An account with this email already exists"` [ran] | `accounts/views.py` `RegisterView.post` | `authApi.register` |
| 3 | `POST /auth/login` | Sign in | none; rate limited 10/15 min/IP (`LoginThrottle`) [code] | `{email, password}` | 200 `{token, user{id,name,email,role,permissions[]}}` [ran, test] | 401 `"Invalid email or password"` [ran]; 400; 429 (throttle) [code, not run] | `LoginView.post` | `authApi.login` |
| 4 | `POST /auth/logout` | Revoke the current token (Redis denylist) | Bearer | – | 200 `data:null` [ran] | 401; 503 if Redis unreachable [code, not run] | `LogoutView.post` | `authApi.logout` |
| 5 | `GET /auth/me` | Current user + permissions | Bearer | – | 200 `{user{…}}` [ran] | 401 `"Authentication required"` (no token) [ran]; 401 `"Invalid token"` [ran]; 401 `"Token has been revoked"` after logout [ran]; 401 `"Token expired"` [code] | `MeView.get` | `authApi.getMe` |
| 6 | `GET /requests` | Paginated list, newest first | `requests.read`. Employee: own only; Admin: all | `status`, `priority` (case-insensitive), `overdue=true`, `page` ≥1 (default 1), `limit` 1–100 (default 10) | 200 `{items[], pagination{page,limit,totalItems,totalPages}}` [ran, test] | 400 `"\"BAD\" is not a valid choice."` for bad status [ran]; 400 for `limit=500` [test] | `service_requests/views.py` `RequestCollectionView.get` → `services.list_requests` | `requestApi.getRequests` |
| 7 | `POST /requests` | Create | `requests.create` | `{title (3–150), description (≤5000), category: IT\|MAINTENANCE\|GENERAL, priority?: LOW\|MEDIUM\|HIGH (default MEDIUM)}` | 201 request object, status `OPEN` [ran] | 400 validation [ran]; 400 if `status` is sent: `"status cannot be set here; use PATCH /requests/:id/status"` [ran] | `RequestCollectionView.post` → `services.create_request` | `requestApi.createRequest` |
| 8 | `GET /requests/{id}` | One request | `requests.read` (employee: own only) | – | 200 request [ran] | 400 `"id must be a valid UUID"` [ran]; 404 `"Service request not found"` — also for other people's requests [ran, test] | `RequestDetailView.get` → `services.get_request` | `requestApi.getRequestById` |
| 9 | `PATCH /requests/{id}` | Partial edit (not status) | `requests.update`; employee: own **and** status OPEN | any of title/description/category/priority; ≥1 field | 200 request [ran] | 400 `"At least one field is required"` (field `body`) [ran]; 403 `"Only open requests can be edited"` [ran]; 404 | `RequestDetailView.patch` → `services.update_request` | `requestApi.updateRequest` |
| 10 | `PATCH /requests/{id}/status` | Change status (any transition allowed) | `requests.status.update` (**admin only**) | `{status: OPEN\|IN_PROGRESS\|RESOLVED}` | 200 request with `isOverdue:false` after a change [ran, test] | 403 `"You do not have permission to perform this action"` for employees [ran]; 400; 404 | `RequestStatusView.patch` → `services.change_status` | `requestApi.updateStatus` |
| 11 | `DELETE /requests/{id}` | Delete | `requests.delete` (**admin only**) | – | 200 `data:null` [ran] | 403 for employee [ran]; 404 | `RequestDetailView.delete` → `services.delete_request` | `requestApi.deleteRequest` |
| 12 | `GET /dashboard/summary` | Six counts + last overdue check time | `dashboard.read` (both roles; org-wide counts) | – | 200 (below); header `X-Cache: MISS` then `HIT` [ran] | 401/403 | `dashboard/views.py` `SummaryView.get` | `dashboardApi.getSummary` |
| 13 | `GET /api-docs/`, `GET /api-docs.json` | Swagger UI / OpenAPI JSON | HTTP **Basic** (`SWAGGER_USER`/`SWAGGER_PASS`), 20 failed tries/15 min → 429 | – | UI: 401 without credentials, 200 with [ran]; JSON content not re-fetched in this pass | 401, 429 [code] | `core/docs_auth.py` wrapping drf-spectacular views (`config/urls.py`) | none |
| 14 | `GET /admin/` | Django admin site | Django session login (staff) | – | not exercised | – | Django admin | none |
| – | any other `/api/...` | JSON 404 | – | – | 404 `"Route not found: GET /api/v1/nope"` [ran] | – | `core.views.api_not_found` | – |

Notes: there is no trailing slash on any API path (`APPEND_SLASH=False`). Only `/api-docs/` has one.

## Response shapes (actual, from [ran] output)

**Login / register** (`data`):
```json
{ "token": "<JWT>", "user": { "id": "uuid", "name": "Employee User", "email": "employee@company.com",
  "role": "EMPLOYEE", "permissions": ["requests.read","requests.create","requests.update","dashboard.read"] } }
```
ADMIN permissions: all six: `requests.read`, `requests.create`, `requests.update`, `requests.delete`, `requests.status.update`, `dashboard.read` [code: `accounts/roles.py`].

**Service request** (`data`, or each element of `items`) — keys observed [ran]:
`id, title, description, category, priority, status, isOverdue, statusChangedAt, createdAt, updatedAt, createdBy{id, name}`.

**List** (`data`):
```json
{ "items": [ <service request>, … ],
  "pagination": { "page": 1, "limit": 2, "totalItems": 16, "totalPages": 8 } }
```

**Dashboard summary** (`data`) — keys verified equal to `client/src/types/dashboard.ts` [ran]:
```json
{ "totalRequests": 16, "openRequests": 9, "inProgressRequests": 4, "resolvedRequests": 3,
  "highPriorityRequests": 4, "overdueRequests": 5, "lastOverdueCheckAt": "2026-10-09T05:31:43.2…Z" }
```
`lastOverdueCheckAt` is `null` until the job has succeeded once.

## Status code summary
200/201 success · 400 validation (incl. malformed UUID, bad query) · 401 unauthenticated/invalid/expired/revoked token · 403 not permitted · 404 not found (or not yours) · 409 duplicate email · 429 login throttle / docs throttle · 503 Redis unavailable during token check · 500 unexpected.

## Not verified in this inspection
429 behaviour of the login throttle; 503 when Redis is down; expired-token message; the OpenAPI JSON body at `/api-docs.json` (generation was verified with `python manage.py spectacular`, which reported no warnings).
