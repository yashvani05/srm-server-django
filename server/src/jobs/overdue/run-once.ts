// `npm run overdue:check` - runs a single overdue check immediately (handy for demos and tests, no queue involved).
import { connectDatabase, sequelize } from '../../config/database';
import { connectRedis, redis } from '../../config/redis';
import { runOverdueCheck } from './overdue.service';

(async () => {
  await connectDatabase();
  await connectRedis();
  const result = await runOverdueCheck();
  console.log(JSON.stringify(result));
  await sequelize.close();
  redis.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
