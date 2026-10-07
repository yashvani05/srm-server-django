// STEP 1 - the queue (the "to-do list" stored in Redis).
const { Queue } = require('bullmq');

// Where Redis lives. The demo Redis container is published on port 6380 (so it never clashes with the project's 6379).
const connection = { host: 'localhost', port: 6380 };

const queue = new Queue('demo-jobs', { connection });

module.exports = { queue, connection };
