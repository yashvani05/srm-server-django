# Docker, Redis and BullMQ from zero (for this project)

> **Easier to read:** open [learn-docker-redis-bullmq.html](learn-docker-redis-bullmq.html) in your browser (diagrams + three interactive simulators). In VS Code you can also press `Cmd+Shift+V` to see this file formatted instead of as raw text.

How to use this guide: read sections 1-3 once, then do the hands-on parts with a terminal open. Section 8 is your
"the client asked me to build it live" plan, and `docs/live-demo/` is a ready-made kit for it.

---

## 1. The whole story in one picture (a restaurant)

| In the restaurant | In our project | Real name |
|---|---|---|
| A **sealed lunch box** with a ready-to-use kitchen corner inside | A packaged program you can run without installing anything | **Docker container** |
| The whiteboard in the kitchen: quick notes anyone can read or wipe | A fast shared memory | **Redis** |
| The **order tickets** on the rail, and a bell that rings every minute to add "check the fridge" | A list of jobs, plus a scheduler that adds one on a timer | **BullMQ** (queue + scheduler) |
| The cook who takes tickets and does them | A background program that does the jobs | **Worker** (`npm run worker`) |
| A screen that shows how many tickets are waiting / done / failed | A web page showing the job list | **Bull Board** |
| The big filing cabinet with all the permanent records | Users, requests, flags | **PostgreSQL** |
| The waiter talking to customers | Our website's server | **API** (Express) |

Three different problems, three different tools:
* *"I don't want to install and configure Redis by hand"* -> **Docker**.
* *"I need a very fast place to keep temporary things"* -> **Redis**.
* *"I need something to happen later or repeatedly, in the background"* -> **BullMQ** (which keeps its list **inside Redis**).

That last line is the connection: **Docker runs Redis. BullMQ stores its job list in Redis. Bull Board draws a page from that list.**

---

## 2. Docker from zero

**The problem:** software needs the right version, settings and files. "It works on my machine" is a classic failure.
**Docker's answer:** package the program with everything it needs. You run the package; it behaves the same everywhere.

| Word | Meaning | Analogy |
|---|---|---|
| **Image** | The packaged program, read-only (`redis:7-alpine`) | A recipe + ingredients, frozen |
| **Container** | A running copy of an image | A dish made from the recipe |
| **Port mapping** `6379:6379` | `your computer's port : the container's port` | A door cut from your house into the lunch box |
| **Volume** | Storage that survives when the container is deleted | A shelf outside the lunch box |
| **Docker Compose** | One file (`docker-compose.yml`) that describes several containers | A menu for the whole meal |

### Our `docker-compose.yml`, line by line
```yaml
services:
  redis:                               # a service called "redis"
    image: redis:7-alpine              # use the official Redis, version 7, small "alpine" build
    container_name: srm-redis          # the container's name (used in our commands)
    ports:
      - "6379:6379"                    # your computer's :6379  ->  the container's :6379
    volumes:
      - redis_data:/data               # keep Redis's data on a named shelf so a restart doesn't lose it
    healthcheck:                       # Docker asks "are you alive?" every 5s by running `redis-cli ping`
      test: ["CMD", "redis-cli", "ping"]

  redisinsight:                        # OPTIONAL: someone else's web tool for looking inside Redis
    image: redis/redisinsight:latest
    profiles: ["tools"]                # only starts when you ask for the "tools" profile
    ports: ["5540:5540"]               # -> http://localhost:5540
```
(PostgreSQL is **not** in Docker for you: it is installed on your Mac. Redis is the only thing you run through Docker.)

### The Docker commands you will actually use
```bash
docker ps                                   # what is running right now
docker ps -a                                # everything, including stopped
docker compose up -d redis                  # start Redis from our compose file (-d = in the background)
docker compose stop                         # stop everything we started (data is kept)
docker compose down                         # stop AND delete the containers (the volume/data is kept)
docker logs -f srm-redis                    # watch a container's output (Ctrl+C to leave)
docker exec -it srm-redis redis-cli         # open a terminal INSIDE the container, running Redis's prompt
docker images                               # downloaded images
docker run -d --name demo-redis -p 6380:6379 redis:7-alpine   # start Redis WITHOUT a compose file
docker rm -f demo-redis                     # delete that container
```
`docker exec -it <name> <command>` means "run this command inside that container". The `-it` makes it interactive.

---

## 3. Redis from zero

Redis stores **keys and values** in memory. Try it now:
```bash
docker exec -it srm-redis redis-cli
```
```
SET city Johannesburg      -> OK
GET city                   -> "Johannesburg"
EXPIRE city 30             -> 1        (delete it automatically in 30 seconds)
TTL city                   -> 27       (seconds left; -2 = already gone)
EXISTS city                -> 1
DEL city                   -> 1
KEYS *                     -> everything (careful on big systems; fine here)
```
In our project Redis holds three things: the logout list (`auth:denylist:*`), the dashboard cache
(`dashboard:summary`) and BullMQ's job list (`bull:overdue-check:*`). Deeper explanation with a real recording of
the commands: `docs/redis-and-bullmq.md`.

---

## 4. BullMQ from zero

Four words:
* **Queue**: the to-do list (stored in Redis).
* **Job**: one item on the list ("run the overdue check").
* **Worker**: a program that takes jobs one at a time and does them. If it crashes, the job is not lost; it goes back.
* **Scheduler**: adds a job on a timer ("every 60 seconds").

Minimum code (this is exactly `docs/live-demo/`):
```js
const queue  = new Queue('demo-jobs', { connection });                  // 1. make the list
await queue.add('say-hello', { who: 'client' });                        // 2. put a job on it
new Worker('demo-jobs', async (job) => { /* do the work */ }, { connection }); // 3. someone does it
```
Why not just do the work inside the API? Because (a) nobody is clicking when a timer fires, (b) a slow job would slow
down website visitors, (c) if it fails we want automatic retries (our worker retries 3 times) and a record of what happened.

---

## 5. "Where does that web page come from?" (Bull Board and RedisInsight)

I did **not** design either of those screens. They are ready-made:

* **Bull Board** is an npm library (`@bull-board/express`). Inside the package is a finished web app. Our server only
  does this (in `server/src/app.ts`):
  ```ts
  createBullBoard({ queues: [new BullMQAdapter(overdueQueue)], serverAdapter: queueBoard });   // "here is my queue"
  app.use('/admin/queues', ...docsAuth, docsHelmet, queueBoard.getRouter());                  // "serve the page here, behind a password"
  ```
  The page asks our server for the queue's numbers; the library reads them from Redis and answers. You can look at the
  packaged web app yourself: `ls server/node_modules/@bull-board/ui`.
* **RedisInsight** is a program made by the Redis company, delivered as a Docker image. We only run it. Nothing in our code uses it.

Plain truth for the client: *"The queue and worker are our code. The dashboards are standard open-source tools that read what is in Redis."*

---

## 6. How everything connects in our project

```
 Browser ─► client  (Vite, :5173) ─proxy /api─►  API  (Express, :4000) ─► PostgreSQL (:5432, installed on the Mac)
                                                  │  ▲                       ▲
                                                  │  │ reads/writes          │ reads/writes
                                                  ▼  │                       │
                                              Redis (Docker container, :6379) ◄── Worker (separate process)
                                                  ▲                                   (runs every 60s)
                       Bull Board page ──────────┘   (served by the API at :4000/admin/queues)
                       RedisInsight  (Docker :5540, optional, only for looking)
```

| Program | Start command | Address |
|---|---|---|
| Redis (Docker) | `docker compose up -d redis` | `localhost:6379` |
| API | `cd server && npm run dev` | http://localhost:4000 (docs at `/api-docs`, jobs at `/admin/queues`) |
| Worker | `cd server && npm run worker` | no page; look at Bull Board |
| Website | `cd client && npm run dev` | http://localhost:5173 |
| RedisInsight (optional) | `docker compose --profile tools up -d redisinsight` | http://localhost:5540 |

**A full trip, step by step.** You click *Create request*:
1. Browser -> Vite -> **API** `POST /requests`. The API first asks **Redis** `EXISTS auth:denylist:<id>` (is this login still valid?).
2. API saves the request in **PostgreSQL**.
3. API tells **Redis** `DEL dashboard:summary` (the cached numbers are now wrong).
4. You open the dashboard: API asks Redis for `dashboard:summary` -> not found -> counts in PostgreSQL -> stores it in Redis for 60s -> answers.
5. Meanwhile, every 60s the **scheduler** drops a job into the **BullMQ queue** (in Redis). The **Worker** takes it, flags requests that have been open/in-progress for more than 24h in PostgreSQL, saves the "last run" time, and deletes the cached summary if anything changed.

---

## 7. Starting and stopping everything (daily routine)
```bash
open -a Docker                      # 1. start Docker Desktop (wait for the whale icon to settle)
docker compose up -d redis          # 2. Redis
cd server && npm run dev            # 3. API         (terminal 1)
cd server && npm run worker         # 4. Worker      (terminal 2)
cd client && npm run dev            # 5. Website     (terminal 3)
```
Stop: `Ctrl+C` in each terminal, then `docker compose stop`.
If something looks wrong: `docker ps` (is Redis up?), then check each terminal for errors.

---

## 8. "Build it in front of us"

If the client asks you to create it live, use **`docs/live-demo/README.md`**: about 10 minutes, one Redis container,
five small files, and it shows caching, jobs, delays, retries, failures, the alarm clock, and the web page.
Practise it twice before the meeting so you can type it without looking.

### The 2-minute explanation of our architecture
> "Employees submit service requests through a React app. An Express API stores them in PostgreSQL. I use Redis for three
> things: caching the dashboard numbers for 60 seconds, remembering logged-out tokens so logout really works, and as the
> storage for a BullMQ job queue. A separate worker process runs every minute, finds requests that have been open or in
> progress for more than 24 hours, and marks them overdue. I run Redis in Docker so it installs with one command."

### Questions the client may ask (and honest answers)
* **Why Redis, not just PostgreSQL?** It's much faster for small, temporary data, and its timers delete things automatically.
* **What if Redis goes down?** Logins are refused with a 503 (deliberately: we can't check for revoked tokens), the dashboard cache is skipped, and the queue pauses. When Redis returns, everything resumes by itself.
* **What if the worker stops?** The website keeps working. Overdue flags just stop updating, and the dashboard shows "checked X minutes ago". Starting it again catches up.
* **Why a separate worker?** Web traffic and background work don't affect each other, and each can be restarted or scaled alone.
* **What stops two workers doing the same thing twice?** The queue hands each job to one worker, and the work itself is idempotent (it only changes rows that are wrong).
* **How does cache invalidation work?** Every create / edit / delete / status change (and the worker) deletes `dashboard:summary`; the 60s timer is the safety net.
* **Is Bull Board your own UI?** No, it's an open-source library; we mount it and protect it with a password.
* **Why Docker?** One command gives everyone the same Redis, no installation.

---

## 9. A study plan that works
* **Day 1 (45 min):** Docker commands from section 2 and the Redis prompt from section 3. Delete the Redis container and recreate it; notice your data is gone or kept depending on the volume.
* **Day 2 (60 min):** Run `docs/live-demo/` step by step, then **delete the files and retype them** from the README without copying.
* **Day 3 (45 min):** Explain section 6 out loud, pointing at the real files. Run the five experiments in `docs/redis-and-bullmq.md`.
* **Break things on purpose:** stop Redis, stop the worker, change `OVERDUE_CHECK_INTERVAL_MS`, and predict what you will see before you look.

## 10. Glossary
**Image / container**: packaged program / its running copy. **Compose**: one file describing containers. **Port mapping**: door between your computer and a container.
**Volume**: storage that outlives a container. **Key / value**: label / content in Redis. **TTL**: seconds until a key deletes itself.
**Cache**: remembered answer. **Invalidate**: throw the remembered answer away. **Queue / job / worker / scheduler**: to-do list / item / doer / timer.
**Idempotent**: safe to repeat. **Transaction**: all-or-nothing group of database changes.
