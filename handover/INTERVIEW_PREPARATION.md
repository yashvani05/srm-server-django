# INTERVIEW_PREPARATION — answers grounded in this codebase

Every answer points to the real file. Where something is a limitation, the honest answer is given — interviewers respect that more than a bluff. (No credentials appear here; demo accounts are in the seed command defaults.)

## A. Architecture
**Q1. Describe the architecture in 30 seconds.**
React SPA → Vite dev proxy → Django REST API → PostgreSQL. Redis does three jobs: dashboard cache, JWT revocation list, and Celery's queue. Celery Beat schedules an overdue check every 60 s; a Celery worker runs it and writes a flag + last-success time to PostgreSQL. (`PROJECT_HANDOVER.md` §2)

**Q2. Why a separate Django folder next to a Node one?**
The first implementation was Node; the client's brief required Django, so I built `server-django/` as a drop-in replacement with the same URLs and JSON, leaving Node untouched. The React app needed no changes. (The honest follow-up: two bugs in the response shapes were found only when comparing against the client's TypeScript types — see ASSIGNMENT_GAP_ANALYSIS §4.)

**Q3. How are responsibilities split between frontend and backend?**
Frontend: rendering, form UX validation (Joi), hiding controls via `hasPermission`/`canEditRequest`. Backend: authentication, permissions, ownership, validation, business rules. The UI checks are explicitly *not* the security boundary (`AuthContext.tsx` comment; `services.py` enforces).

**Q4. Why is there a `services.py`?**
So views only translate HTTP ↔ Python and the rules (ownership scoping, "edit only while OPEN", resetting the overdue clock) live in one testable place: `service_requests/services.py`.

## B. Django / DRF
**Q5. Request lifecycle in Django REST Framework?**
`config/urls.py` → app `urls.py` → a class-based `APIView` → DRF runs authentication (`JWTAuthentication`), permission classes (`require_permission`), throttles → the view validates with a serializer → calls `services.*` → returns `success(...)`. Exceptions pass through `core/exceptions.py::api_exception_handler`, which formats the error envelope.

**Q6. Why a custom user model?**
To log in with email and use a UUID primary key (`accounts/models.py::User`, `USERNAME_FIELD="email"`). Django recommends deciding this before the first migration.

**Q7. How does RBAC work?**
Roles are Django Groups (ADMIN, EMPLOYEE). Permissions are declared on `ServiceRequest.Meta.permissions` and assigned to groups after every `migrate` (`service_requests/apps.py::sync_role_groups`) from the table in `accounts/roles.py`. Views declare what they need: `require_permission("requests.delete")` → `user.has_perm(...)`. The role is read from the database on each request, never trusted from the token.

**Q8. What does a serializer do vs. a model?**
Model = database table. Serializer = validates incoming data and shapes outgoing JSON (`ServiceRequestSerializer` maps `overdue`→`isOverdue`, `status_changed_at`→`statusChangedAt`, etc., because the React app expects camelCase).

**Q9. Why `APPEND_SLASH=False`?**
The React app calls `/requests`, Django normally wants `/requests/`. Kept the client unchanged.

**Q10. How do you hide that an employee can't see someone else's request?**
`services.get_request` filters by owner and raises 404 "Service request not found" for both missing and foreign rows, so existence isn't leaked.

## C. Authentication & security
**Q11. How does login/JWT work?**
`LoginView` validates, finds the user by case-insensitive email, checks the password hash, and returns an HS256 JWT with `sub`, `role`, `jti`, `iat`, `exp` (`accounts/jwt.py`). The client stores it in `localStorage` (`utils/tokenStorage.ts`) and sends `Authorization: Bearer`.
*Trade-off:* `localStorage` is readable by injected scripts (XSS); httpOnly cookies are safer but need CSRF handling. [opinion]

**Q12. How does logout work with a stateless JWT?**
The token's `jti` is stored in Redis (`auth:denylist:<jti>`) until the token would have expired; every request checks it (`accounts/authentication.py` → `denylist.is_denied`). Verified live: after logout `/auth/me` returns 401 "Token has been revoked".

**Q13. What if Redis is down?**
Authenticated requests fail closed with 503 (can't prove the token wasn't revoked). The dashboard cache, by contrast, degrades to the database. (Both are in code; I did not exercise them for Django.)

**Q14. Brute-force protection?**
`LoginThrottle`: 10 attempts / 15 min / IP (configurable), plus a dummy password hash for unknown emails so response time doesn't reveal which emails exist.

**Q15. Can a user register as admin?**
No — `RegisterView` always creates an EMPLOYEE and ignores `role`. Verified live: an account registered with `role:"ADMIN"` got 403 on admin-only actions.

## D. PostgreSQL
**Q16. Walk me through the schema and why those indexes.**
`service_requests`: UUID PK, CHECK constraints on category/priority/status, FK to users. Indexes: status, priority, `created_at DESC` (list order), partial index on `status_changed_at` for rows OPEN/IN_PROGRESS and not yet flagged (what the worker scans), partial index on overdue rows (dashboard count and the overdue filter). See DATABASE_AND_BUSINESS_LOGIC.md §2.

**Q17. How are dashboard counts computed efficiently?**
One query: `aggregate()` with six `Count("id", filter=Q(...))` → a single `COUNT(*) FILTER (WHERE …)` per metric in one scan (`dashboard/services.py`).

**Q18. How are migrations handled?**
Django migrations only (`makemigrations`/`migrate`); no auto-sync. Group/permission data is re-synced by a `post_migrate` handler.

## E. Redis & background processing
**Q19. How does the dashboard cache work, and when is it invalidated?**
Key `dashboard:summary` (stored `srmdj:dashboard:summary`), TTL 60 s, response header `X-Cache: HIT/MISS`. Deleted after create, update, delete, a real status change, and when the worker changes any flag. `lastOverdueCheckAt` is intentionally outside the cache so it's always fresh.

**Q20. Explain Celery vs Celery Beat vs the worker.**
Beat = clock that enqueues `check_overdue` every 60 s. Redis (DB 2) = the queue. Worker = process that executes the task. Run `-B` for dev; in production run one worker and exactly one Beat.

**Q21. What does the overdue job do, and why is it safe to run twice?**
`run_overdue_check()` in a single transaction: (1) flag rows OPEN/IN_PROGRESS with `status_changed_at` older than 24 h that aren't flagged; (2) un-flag any flagged row that no longer qualifies; (3) upsert `overdue_check.last_success_at`. Each step only touches rows whose state is wrong, so a second run changes nothing (tested). A failure rolls everything back, so success is never recorded falsely.

**Q22. Why store a flag instead of computing overdue on read?**
The assignment asks for a background job that checks overdue requests, and the flag makes the dashboard count and the overdue filter a cheap indexed read. Cost: the flag can lag by up to a minute; status changes clear it immediately to limit confusing results.

**Q23. What happens if the worker is down?**
New overdue requests aren't flagged and "last checked" on the dashboard stops advancing; the API and everything else keep working.

**Q24. How is "24 hours" defined?**
In the current status (`status_changed_at`), strict greater-than, not for RESOLVED; changing status restarts the clock. If asked about "since creation", say it's a deliberate interpretation and show the one-line change.

## F. API design
**Q25. Why `PATCH /requests/:id/status` as a separate endpoint?**
Status changes have different permissions (admin only) and side effects (reset clock, clear flag), so they're not accepted on the general edit endpoint — sending `status` there returns 400 with a message pointing to the right route.

**Q26. Response format?**
Always `{success, message, data}` or `{success:false, message, errors:[{field,message}]}`; the React `axiosInstance.ts` unwraps it and turns failures into `ApiError`, and `RequestForm.tsx` maps `errors[].field` onto form fields.

## G. React
**Q27. How does the frontend handle loading, empty, error and success states?**
`useAsyncData` (abort on supersede, min first-load time) feeds pages that render skeletons, empty states (different for filters vs no data), `ErrorState` with retry, and toasts from `useRequestActions` (which never throws; returns `{data}` or `{error}`).

**Q28. Why do filters live in the URL?**
`RequestsListPage.tsx` uses `useSearchParams`, so views are shareable, survive refresh, and dashboard cards can deep-link (`/requests?overdue=true`).

**Q29. Where is auth state handled?**
`AuthContext.tsx` restores the session via `/auth/me`, and listens for an `auth:expired` event the axios interceptor fires on any 401 (except login/register).

## H. Debugging / "what would you improve"
**Q30. A bug you found late?** The Django dashboard keys and pagination key didn't match the client's types (`total` vs `totalRequests`, `total` vs `totalItems`); tests passed because they asserted my own shape. Lesson: contract tests against the client's types or the OpenAPI spec. *(Fixed; see gap analysis.)*

**Q31. Improvements?** Real-Redis/Celery integration test; rollback test; Dockerfile + deployment for API/worker/beat; keyset pagination for large tables; httpOnly-cookie auth; make the dashboard scope per-user if the product wants it; support Redis providers that only offer DB 0.

**Q32. How would you deploy it?** Managed Postgres + Redis, API under gunicorn behind a proxy (`TRUST_PROXY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ORIGIN`, `collectstatic`), a separate worker and a single Beat process, static React build on a CDN/Vercel with `VITE_API_BASE_URL` pointing at the API. (Not yet implemented in the repo.)
