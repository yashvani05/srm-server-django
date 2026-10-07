import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { getOverdueQueue } from './jobs/overdue/overdue.queue';
import { docsAuth } from './middlewares/docsAuth';
import routes from './routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

export function createApp() {
  const app = express();
  // Behind a reverse proxy (Vercel) the real client IP is in X-Forwarded-For; rate limiting needs it.
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  // API docs (Basic-auth protected) are mounted first with their own helmet policy: Swagger UI needs same-origin scripts/inline styles,
  // and `upgrade-insecure-requests` would break asset loading over plain http in development.
  const docsHelmet = helmet({
    contentSecurityPolicy: {
      directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'upgrade-insecure-requests': env.NODE_ENV === 'production' ? [] : null },
    },
  });
  app.get('/api-docs.json', ...docsAuth, docsHelmet, (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    '/api-docs',
    ...docsAuth,
    docsHelmet,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Service Requests API', swaggerOptions: { persistAuthorization: true, docExpansion: 'list', displayRequestDuration: true } }),
  );

  // Bull Board: a web page showing the background-job queue (same ID / password as the API docs).
  // Disabled on serverless hosts (ENABLE_BULL_BOARD=false) where there is no worker and no long-lived connection.
  if (env.ENABLE_BULL_BOARD) {
    const queueBoard = new ExpressAdapter();
    queueBoard.setBasePath('/admin/queues');
    createBullBoard({ queues: [new BullMQAdapter(getOverdueQueue())], serverAdapter: queueBoard, options: { uiConfig: { boardTitle: 'Background jobs' } } });
    app.use('/admin/queues', ...docsAuth, docsHelmet, queueBoard.getRouter());
  }

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
