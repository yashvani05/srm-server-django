// The caching idea in 25 lines: "check Redis first; if it's not there, do the slow work and remember the answer".
const Redis = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6380 });

async function slowDatabaseCount() {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // pretend the database is slow
  return { totalRequests: 42 };
}

async function getSummary() {
  const started = Date.now();
  const cached = await redis.get('dashboard:summary');                  // 1. look on the notice board
  if (cached) return { data: JSON.parse(cached), from: 'HIT  (Redis)', ms: Date.now() - started };

  const data = await slowDatabaseCount();                               // 2. not there: do the slow work
  await redis.set('dashboard:summary', JSON.stringify(data), 'EX', 10); // 3. pin the answer for 10 seconds
  return { data, from: 'MISS (database)', ms: Date.now() - started };
}

(async () => {
  console.log('1st call :', await getSummary());
  console.log('2nd call :', await getSummary());
  console.log('...someone creates a request, so we throw the old answer away');
  await redis.del('dashboard:summary');
  console.log('3rd call :', await getSummary());
  console.log('TTL left (seconds):', await redis.ttl('dashboard:summary'));
  redis.disconnect();
})();
