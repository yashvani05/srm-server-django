// STEP 4 - the web page. Bull Board is a ready-made library: we only hand it the queue.
const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { queue } = require('./queue');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/board');
createBullBoard({ queues: [new BullMQAdapter(queue)], serverAdapter }); // <- these two lines ARE the whole "UI feature"

const app = express();
app.use('/board', serverAdapter.getRouter());
app.listen(3010, () => console.log('Open http://localhost:3010/board'));
