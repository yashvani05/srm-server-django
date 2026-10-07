// STEP 2 - the worker (the person who takes jobs off the list and does them).
const { Worker } = require('bullmq');
const { connection } = require('./queue');

const worker = new Worker(
  'demo-jobs',
  async (job) => {
    console.log(`▶ started  job ${job.id} "${job.name}" ${JSON.stringify(job.data)}  (attempt ${job.attemptsMade + 1})`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // pretend the work takes 2 seconds
    if (job.data.shouldFail) throw new Error('simulated failure');
    console.log(`✔ finished job ${job.id}`);
    return { handledAt: new Date().toISOString() }; // shows up as the job's "result" in the web UI
  },
  { connection },
);

worker.on('failed', (job, err) =>
  console.log(`✘ failed   job ${job.id}: ${err.message}  -> ${job.attemptsMade < job.opts.attempts ? 'will retry' : 'giving up'}`),
);
console.log('Worker is running. Waiting for jobs...');
