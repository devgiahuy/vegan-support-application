import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { createErrorHandler } from './common/middleware/error-handler.js';
import { notFoundHandler } from './common/middleware/not-found.js';
import { requestIdMiddleware } from './common/middleware/request-id.js';
import type { AppConfig } from './config/env.js';
import type { Database } from './database/database.js';
import { createHealthRouter } from './modules/health/health.router.js';
import { openApiDocument } from './openapi/document.js';

export interface AppDependencies {
  config: AppConfig;
  database: Database;
  logger: Logger;
}

export function createApp({ config, database, logger }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || config.frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp<Request, Response>({
      logger,
      genReqId: (request) => request.requestId,
    }),
  );
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.jsonBodyLimit }));

  app.get('/api-docs.json', (_request, response) => response.json(openApiDocument));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { customSiteTitle: 'Vegan Support API Docs' }),
  );
  app.use('/api/v1/health', createHealthRouter(config, database));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
