# REDIS_AND_BACKGROUND_JOBS (Django backend)

Evidence labels: **[code]**, **[ran]** (executed during this inspection or earlier in this session and observed), **[test]** (automated test; note tests use an in-memory cache and eager Celery, **not real Redis/worker**), **[not verified]**.

## 1. Is Redis used? For what?
Yes — Redis is **required** by this backend (cache, auth revocation list, Celery broker). It is **not** used as a Celery result backend (`CELERY_TASK_IGNORE_RESULT = True`).

| Purpose | Redis DB | Exact key (as stored) | Value / TTL | Code |
|---|---|---|---|---|
| Dashboard cache | 1 | `srmdj:dashboard:summary` | a dict of the six counts (`totalRequests` … `overdueRequests`), pickled by django-redis; TTL `DASHBOARD_CACHE_TTL_SECONDS` = 60 s [ran: `TTL` showed 49 s] | `dashboard/cache.py`, `dashboard/views.py` |
| JWT revocation list (logout) | 1 | `srmdj:auth:denylist:<jti>` | `1`; TTL = remaining token lifetime [ran: key present after a logout] | `accounts/denylist.py` |
| Login rate limit | 1 | `srmdj:throttle_login_<ip>` | list of attempt timestamps; 15 min [ran: key present] | `accounts/throttles.py` (DRF throttle uses the default cache) |
| Swagger password-attempt counter | 1 | `srmdj:docs-auth-failures:<ip>` | integer, 15 min | `core/docs_auth.py` |
| Celery broker (queue) | 2 | kombu keys such as `_kombu.binding.celery` [ran]; queued task messages in list `celery` | task messages | `config/settings.py` `CELERY_BROKER_URL` |

Key prefix: `settings.CACHES["default"]["KEY_PREFIX"]="srmdj"` and `KEY_FUNCTION=core.cache.make_key` (→ `prefix:key`, no version number). The `srmdj` prefix keeps these apart from anything else in the same Redis.
Redis DB 0 held `bull:overdue-check:*` keys **from the old Node/BullMQ worker** [ran: `--scan`]; the Django backend never touches DB 0.

## 2. Dashboard cache logic (`dashboard/views.py::SummaryView.get`)
1. `cache.get()` (key `dashboard:summary`). Hit → use it; header `X-Cache: HIT`.
2. Miss → `services.build_summary()` (one SQL aggregate) → `cache.put()` with TTL 60 s; header `X-Cache: MISS`.
3. Always add `lastOverdueCheckAt`, read from PostgreSQL every time (**not** part of the cached value, so it is always current).
Verified [ran]: first call MISS, second HIT; after deleting a request the next call was MISS with the count reduced from 16 to 15.

**Invalidation** (`dashboard.cache.invalidate()` deletes the key):
- `services.create_request`, `update_request`, `change_status` (only when the status really changed), `delete_request` — after the write [code].
- `overdue.run_overdue_check` — when it marked or cleared at least one row [code].
- `seed_demo` — at the end [code].
Note: invalidation runs right after the database write, not in `transaction.on_commit`; the views are not wrapped in an explicit transaction, so each write has already committed by then [code]. The worker invalidates after its `with transaction.atomic()` block has exited, i.e. after commit [code].
Test: `DashboardTests.test_counts_cache_and_invalidation` [test].

**If Redis fails:** `dashboard/cache.py` catches every exception and logs a warning, so the dashboard falls back to the database [code; **not verified** for Django — the Node version's equivalent was exercised earlier [memory]]. Authentication, however, **fails closed**: `accounts/denylist.py::is_denied` raises `ServiceUnavailable` (HTTP 503) if the cache errors, so authenticated requests return 503 while Redis is down [code; **not verified** for Django].

## 3. Background overdue job

### Components
| Piece | File | Role |
|---|---|---|
| Celery app | `config/celery.py` | `Celery("config")`, reads `CELERY_*` settings, discovers tasks |
| Schedule | `config/settings.py` `CELERY_BEAT_SCHEDULE` | task `service_requests.tasks.check_overdue` every `OVERDUE_CHECK_INTERVAL_SECONDS` (default **60 s**) |
| Task | `service_requests/tasks.py::check_overdue` | thin wrapper; `autoretry_for=(Exception,)`, `retry_backoff=5`, `max_retries=3` |
| Work | `service_requests/overdue.py::run_overdue_check` | the actual logic |
| Manual run | `manage.py run_overdue_check` | calls the same function once, no Celery |

### How it runs
- **Beat** (scheduler) pushes a `check_overdue` message onto the Redis queue (DB 2) every 60 s.
- A **worker** process pops it and calls `run_overdue_check()`.
- Start both in one process for development: `celery -A config worker -B -l info --pool=solo` (from `server-django/`, venv active, Redis running). In production run them as two processes (`celery -A config worker` and `celery -A config beat`) — **never two Beat processes**.
[ran] During this session I started `celery -A config worker -B`, set one request's `status_changed_at` to 30 h ago with the flag false, and within about a minute the log showed `Task service_requests.tasks.check_overdue[…] received`, `Overdue check finished: marked=1 cleared=0 in 24ms`, `… succeeded`, and the row's `overdue` became true.
[test] The task function logic is tested by calling `run_overdue_check()` directly; **the Beat schedule and the real queue are not covered by automated tests.**

### `run_overdue_check()` step by step (all inside one `transaction.atomic()`)
1. **Mark**: `ServiceRequest.objects.filter(overdue=False).filter(qualifies_as_overdue()).update(overdue=True, overdue_at=Now())` — rows OPEN/IN_PROGRESS with `status_changed_at` older than 24 h that are not flagged yet. Returns the count `marked`.
2. **Heal**: `ServiceRequest.objects.filter(overdue=True).exclude(qualifies_as_overdue()).update(overdue=False, overdue_at=None)` — any flagged row that no longer qualifies (e.g. RESOLVED, or clock reset) is un-flagged. Returns `cleared`.
3. **Record success**: `SystemState.objects.update_or_create(key="overdue_check.last_success_at", defaults={"value": "ok", "updated_at": Now()})`.
4. After the transaction: if `marked or cleared`, `dashboard.cache.invalidate()`; log `Overdue check finished: marked=… cleared=… in …ms`.

### Failure, retry, double-run behaviour
- **Failure:** any exception inside the `atomic` block rolls back all three steps, so a failed run **never records a success time** [code]. Celery then retries (5 s, 10 s, 20 s backoff, up to 3 retries) [code, not exercised]. A dedicated rollback test does **not** exist [gap].
- **Run twice:** idempotent — step 1 only touches rows with `overdue=False`, step 2 only rows that should not be flagged; a second run gives `marked=0, cleared=0` [test: `OverdueTests.test_boundaries_and_idempotence`]. Concurrent runs by two workers: PostgreSQL row locks serialise the updates, the second finds nothing to change [opinion; not tested].
- **Worker down:** flags simply go stale (new overdue requests are not flagged), `lastOverdueCheckAt` stops advancing and the dashboard shows "checked X ago" growing — that is the visible signal. A status change still clears a flag immediately because `change_status` does it directly [code, test].
- **Database flag vs dynamic:** the job **updates a persisted flag** (`overdue`, `overdue_at`); nothing recomputes overdue at read time.

### Last successful run
`system_state` row `overdue_check.last_success_at`; its `updated_at` is the timestamp, exposed as `lastOverdueCheckAt` in `GET /dashboard/summary` and displayed on the Overdue card in the UI (`SummaryGrid.tsx`, "checked 3m ago" / "worker has not run yet").

## 4. Does the app need Redis to run?
Yes for normal operation (login → every authenticated request checks the denylist). Tests do not (in-memory cache). Without a Celery worker the API still works; only the overdue flags stop being refreshed.

## 5. Observing it (commands)
```bash
docker exec -it srm-redis redis-cli -n 1 --scan           # cache keys (DB 1)
docker exec srm-redis redis-cli -n 1 ttl srmdj:dashboard:summary
docker exec -it srm-redis redis-cli monitor               # live command stream (Ctrl-C to stop)
cd server-django && source .venv/bin/activate && python manage.py run_overdue_check
psql srm_django -c "select key, value, updated_at from system_state"
```
Optional Celery UI: `flower` is in `requirements.txt` but I have **not** run or verified it (`celery -A config flower` would serve it on port 5555 by default [not verified]).

## 6. Deployment constraint
Celery needs a long-running process; serverless hosts such as Vercel cannot run it. The Node variant solved that with a daily Vercel Cron endpoint [README, Node only]. **No Django deployment configuration exists in the repo yet** (only `gunicorn` and `whitenoise` in requirements; no Procfile/Dockerfile/vercel.json for Django).
