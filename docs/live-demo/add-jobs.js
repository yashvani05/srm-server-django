// STEP 3 - the producer (whoever adds items to the list). In our real app this is the scheduler.
const { queue } = require('./queue');

(async () => {
  await queue.add('say-hello', { who: 'the client' });                                   // runs straight away
  await queue.add('delayed-hello', { who: 'later' }, { delay: 10_000 });                 // waits 10 seconds first
  await queue.add('always-fails', { shouldFail: true }, { attempts: 3, backoff: { type: 'fixed', delay: 3000 } }); // retried 3 times
  await queue.upsertJobScheduler('every-15-seconds', { every: 15_000 }, { name: 'scheduled-hello', data: { who: 'the clock' } }); // the alarm clock
  console.log('Added 3 jobs + 1 repeating schedule.');
  await queue.close();
})();
