# Live demo kit: Redis + BullMQ + Bull Board in 10 minutes

A tiny stand-alone project (about 40 lines of code) that shows the same ideas our real app uses.
Everything here runs on its own Redis container on **port 6380**, so it never touches the project's Redis (6379).

## Setup (do this once, before the client arrives)
```bash
cd docs/live-demo
npm install                 # downloads the libraries (bullmq, ioredis, express, bull-board)
```

## The live script

**1. Start a Redis (Docker).** Say: *"Docker lets me run Redis without installing it. One command."*
```bash
docker run -d --name demo-redis -p 6380:6379 redis:7-alpine
docker ps                                   # shows it running
docker exec -it demo-redis redis-cli        # open Redis's own prompt
```
Inside the prompt (type `exit` to leave):
```
SET greeting hello          # pin a note on the board
GET greeting                # read it back  -> "hello"
EXPIRE greeting 20          # give it a 20-second timer
TTL greeting                # seconds left; run it a few times and watch it count down
KEYS *                      # list all notes
```

**2. Show caching.** Say: *"Slow work done once, remembered for 10 seconds."*
```bash
npm run cache
```
You will see `MISS (database) ~1500 ms`, then `HIT (Redis) ~1 ms`, then after "someone creates a request" a `MISS` again.

**3. Show the job queue.** Open three terminals in `docs/live-demo`:
```bash
npm run board        # terminal 1 -> open http://localhost:3010/board  (empty queue)
npm run worker       # terminal 2 -> prints "Worker is running. Waiting for jobs..."
npm run add          # terminal 3 -> adds 3 jobs + 1 repeating schedule
```
Watch the worker terminal and refresh the browser. Point out:
* `say-hello` runs immediately -> **Completed**
* `delayed-hello` waits 10 seconds -> sits under **Delayed**, then runs
* `always-fails` is tried 3 times, 3 seconds apart, then lands in **Failed** (click it to see the error)
* `scheduled-hello` appears every 15 seconds on its own -> **Schedulers** tab shows the "alarm clock"

**4. Show that Redis really holds it all.**
```bash
docker exec -it demo-redis redis-cli KEYS "bull:*"
```
Say: *"The queue is not magic: it is just notes in Redis. Any program that can reach Redis can add or take jobs."*

**5. Prove the worker is separate.** Stop the worker (Ctrl+C), run `npm run add` again: the jobs pile up in **Waiting**.
Start the worker again: it clears the pile. Say: *"That is why our overdue check lives in its own process."*

**Clean up**
```bash
docker rm -f demo-redis
```

## What each file does
| File | Role | Lines that matter |
|---|---|---|
| `queue.js` | creates the queue and says where Redis is | `new Queue('demo-jobs', { connection })` |
| `add-jobs.js` | the **producer**: puts jobs on the list | `queue.add(...)`, `upsertJobScheduler(...)` |
| `worker.js` | the **worker**: takes jobs and does them | `new Worker('demo-jobs', async (job) => {...})` |
| `board.js` | the web page (Bull Board library) | `createBullBoard({ queues: [...] })` |
| `cache-demo.js` | the caching idea with `get / set EX / del` | `redis.get`, `redis.set(..., 'EX', 10)`, `redis.del` |

Our real project does the same things, in these files:
`server/src/jobs/overdue/overdue.queue.ts` (queue), `jobs/scheduler.ts` (producer / alarm clock),
`jobs/overdue/overdue.worker.ts` + `overdue.service.ts` (worker), `app.ts` (Bull Board), `services/dashboard.service.ts` (cache).
