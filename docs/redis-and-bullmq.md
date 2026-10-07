# Redis and BullMQ, explained through this project

> Brand new to all of this? Read [learn-docker-redis-bullmq.md](learn-docker-redis-bullmq.md) first.

## 1. The idea in one minute

**Redis** is a very fast, shared **notice board that lives in memory**. Any program can pin a note
(`key` → `value`), read it back, or throw it away. A note can carry a **timer** ("tear this down in 60 seconds").
PostgreSQL is our filing cabinet (permanent, organised, slower). Redis is the whiteboard next to it (temporary, instant).

**BullMQ** is a **to-do list with an alarm clock**, built on top of Redis. One program writes jobs onto the list
("check for overdue requests"); a different program, the **worker**, picks them up and does them. The scheduler is the
alarm clock that adds a job every minute.

```
   our API  ─────────────┐
   (answers the browser) │        ┌─────────────── Redis (in memory) ───────────────┐
                         ├──────► │  auth:denylist:<id>   "logged-out tokens"        │
   our WORKER ───────────┤        │  dashboard:summary    "cached dashboard numbers" │
   (runs in background)  │        │  bull:overdue-check:* "the job list + schedule"  │
                         │        └───────────────────────────────────────────────────┘
                         └──────► PostgreSQL (permanent data: requests, users, flags)
```

## 2. Why this app needs them (three jobs)

| # | Problem | Redis solution | Key |
|---|---|---|---|
| 1 | A login token can't be "un-issued", so logout needs a memory | Store the token's id until it would have expired | `auth:denylist:<token-id>` |
| 2 | The dashboard counts rows on every page view | Keep the answer for 60s, throw it away when data changes | `dashboard:summary` |
| 3 | "Overdue" must be re-checked as time passes, even when nobody clicks anything | A background job on a schedule | BullMQ queue `overdue-check` |

## 3. Redis in five commands

Open a Redis prompt: `docker exec -it srm-redis redis-cli`

```
SET hello world        -> OK              (write a note)
GET hello              -> "world"         (read it)
EXPIRE hello 30        -> 1               (tear it down in 30 seconds)
TTL hello              -> 27              (seconds left; -2 means it's gone)
DEL hello              -> 1               (throw it away now)
```
`EXISTS key` tells you if a note is there. `--scan` (or `KEYS *` in the prompt) lists them. That's all our app uses.

## 4. Job 1: logout (token denylist)

```
POST /auth/logout   ->  SET auth:denylist:<token-id> 1 EX 3595      (remember it for the rest of its life)
any later request   ->  EXISTS auth:denylist:<token-id>  ==  1  ->  401 "Token has been revoked"
after ~1 hour       ->  Redis deletes the key by itself (the token would have expired anyway)
```
Only the token's *id* is stored, never the token. If Redis is down we answer **503** instead of guessing.

## 5. Job 2: the dashboard cache

```
   GET /dashboard/summary
          │
          ▼
   Redis has dashboard:summary? ──yes──► return it            (X-Cache: HIT, ~instant)
          │ no
          ▼
   count rows in PostgreSQL ─► SET dashboard:summary … EX 60 ─► return it   (X-Cache: MISS)

   create / edit / delete / change status / worker flags something  ──►  DEL dashboard:summary
```
**Real recording** of Redis while using the app (`redis-cli monitor`):

```
[1. open the dashboard (first time)]   get dashboard:summary            <- nothing there
                                       set dashboard:summary {"totalRequests":13,...} EX 60    <- stored   (MISS)
[2. open the dashboard again]          get dashboard:summary            <- found, no database work   (HIT)
[3. create a request]                  del dashboard:summary            <- numbers are now out of date
[4. open the dashboard again]          get dashboard:summary            <- gone
                                       set dashboard:summary {"totalRequests":14,...} EX 60    <- fresh   (MISS)
[5. log out]                           set auth:denylist:<token-id> 1 EX 3595    <- job 1
```
(Every request also starts with `exists auth:denylist:…` — the logout check from job 1.)

Two safety nets: the 60-second timer (even if an invalidation were missed) and, if Redis is unreachable, reads just
fall back to PostgreSQL.

## 6. Job 3: BullMQ and the overdue worker

### The vocabulary
| Word | Meaning here |
|---|---|
| **Queue** | The to-do list in Redis, named `overdue-check` |
| **Job** | One item on it: "run the overdue check" |
| **Scheduler** | The alarm clock: *"add a job every 60 seconds"* (registered once; restarts don't duplicate it) |
| **Worker** | The person who takes jobs off the list and does them (`npm run worker`) |
| **Delayed** | A job waiting for its time (there is always exactly one: the next run) |
| **Completed / Failed** | History. Failed jobs are retried up to 3 times with growing pauses |

### One cycle
```
 ┌──────────┐ every 60s   ┌──────────────────┐   picks up    ┌──────────────────────────────┐
 │Scheduler │ ──────────► │ Queue (in Redis) │ ────────────► │ Worker                        │
 └──────────┘  add job    │ overdue-check    │               │ BEGIN transaction             │
                          └──────────────────┘               │  1. flag: OPEN/IN_PROGRESS    │
                                                             │     for > 24h  → overdue=true │
                                                             │  2. un-flag rows that no      │
                                                             │     longer qualify (RESOLVED) │
                                                             │  3. save "last success" time  │
                                                             │ COMMIT                        │
                                                             │ if anything changed:          │
                                                             │   DEL dashboard:summary       │
                                                             └──────────────────────────────┘
```

### Why it is built this way
* **Separate process.** Web traffic and background work don't slow each other down; you can restart one without the other.
* **One transaction.** Either the whole check happens and success is recorded, or none of it does. A crash never leaves a
  false "last ran at 10:05".
* **Idempotent.** The worker only changes rows whose flag is *wrong*. Running it twice (or two workers at once) changes nothing the second time.
* **Resolved can't stay overdue.** Changing status clears the flag instantly in the API; the worker is the safety net.
* **If the worker is not running** nothing breaks, but overdue flags stop updating, and the dashboard's Overdue card shows
  the last time it ran ("checked 12m ago").

## 7. See it with your own eyes

| Tool | Open | What you'll see |
|---|---|---|
| **Bull Board** (the job list) | http://localhost:4000/admin/queues (user/password = the API-docs ones: `apidocs` / `ApiDocs@12345`) | the `overdue-check` queue: Completed count growing every minute, 1 Delayed (the next run), Failed = 0. Click *Schedulers* to see the alarm clock. Click a job to see its result `{marked, cleared, durationMs}` |
| **RedisInsight** (inside Redis) | `docker compose --profile tools up -d redisinsight`, then http://localhost:5540 → open *Service Requests (local Redis)* | every key, its value, and its **TTL counting down**. Find `dashboard:summary` |
| **Live command stream** | `docker exec -it srm-redis redis-cli monitor` | every command, as it happens. Click around the app and watch (BullMQ is chatty; add `\| grep -E "dashboard\|denylist"`) |
| **Swagger** | http://localhost:4000/api-docs | `GET /dashboard/summary` → run it twice and compare the `X-Cache` header: `MISS` then `HIT` |

### Experiments (5 minutes, in this order)
1. **Cache:** in RedisInsight find `dashboard:summary`. Reload the dashboard: nothing changes. Create a request in the UI, then refresh RedisInsight: the key has **vanished**. Reload the dashboard: it is back, with the new total and a fresh 60s TTL.
2. **Logout:** log out, refresh RedisInsight: a new `auth:denylist:…` key appears with a TTL near 3600.
3. **Worker:** create a request in the UI titled `Aging test` (it starts *not* overdue). Pretend it has been waiting 30 hours:
   `psql -d service_requests -c "update service_requests set status_changed_at = now() - interval '30 hours' where title = 'Aging test'"`.
   Now watch: within a minute Bull Board shows a new *Completed* job, the request gets the red **Overdue** badge, and the dashboard's Overdue count goes up by one.
4. **No worker:** stop the worker (Ctrl+C in its terminal). Create and age a second request the same way (`Aging test 2`). Wait two minutes: it is *not* flagged, and the dashboard says "checked 3m ago". Start the worker: it catches up immediately.
5. **Redis down:** `docker stop srm-redis`. Every logged-in click now gives 503 ("fail closed"). `docker start srm-redis`: everything recovers by itself.

## 8. Questions people ask

* **Is Redis my database?** No. PostgreSQL is. Redis only holds things we can afford to lose or rebuild (cache, a timer, a job list). If Redis were wiped, the app would rebuild the cache and the worker would re-register its schedule on start; only "logged-out" tokens would be forgotten until they expire (≤ 1 hour).
* **Why not just a cron job?** A queue gives retries, history, visibility (Bull Board), and works the same on any machine.
* **Why cache for only 60 seconds?** It bounds how stale the numbers can be even if something goes wrong; invalidation makes it correct in normal use.
* **Where is the code?** `server/src/services/cache.service.ts`, `dashboard.service.ts`, `jobs/overdue/*`, `jobs/scheduler.ts`, `worker.ts`, `middlewares/authenticate.ts`, `services/tokenDenylist.service.ts`.
