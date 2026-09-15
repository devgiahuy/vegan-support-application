import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import { AuthController } from './modules/auth/auth.controller.js';
import { AuthRepository } from './modules/auth/auth.repository.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthenticationMiddleware } from './modules/auth/authentication.middleware.js';
import { PasswordService } from './modules/auth/password.service.js';
import { TokenService } from './modules/auth/token.service.js';
import { CatalogController } from './modules/catalog/catalog.controller.js';
import { CatalogRepository } from './modules/catalog/catalog.repository.js';
import {
  createCatalogAdminRouter,
  createCategoryRouter,
  createIngredientRouter,
} from './modules/catalog/catalog.router.js';
import { CatalogService } from './modules/catalog/catalog.service.js';
import { DietController } from './modules/diet/diet.controller.js';
import { createDietRouter } from './modules/diet/diet.router.js';
import { createHealthRouter } from './modules/health/health.router.js';
import { ProfileRepository } from './modules/profile/profile.repository.js';
import { ProfileService } from './modules/profile/profile.service.js';
import { UsersController } from './modules/users/users.controller.js';
import { createUsersRouter } from './modules/users/users.router.js';
import { openApiDocument } from './openapi/document.js';

export interface AppDependencies {
  config: AppConfig;
  database: Database;
  logger: Logger;
}

export function createApp({ config, database, logger }: AppDependencies): Express {
  const app = express();
  const authRepository = new AuthRepository(database.client);
  const tokenService = new TokenService(config);
  const authService = new AuthService(authRepository, new PasswordService(), tokenService, config);
  const authController = new AuthController(authService, config);
  const authentication = new AuthenticationMiddleware(tokenService, authRepository);
  const profileService = new ProfileService(new ProfileRepository(database.client));
  const usersController = new UsersController(profileService);
  const dietController = new DietController(profileService);
  const catalogController = new CatalogController(
    new CatalogService(new CatalogRepository(database.client)),
  );

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
  app.use(cookieParser());
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.jsonBodyLimit }));

  app.get('/api-docs.json', (_request, response) => response.json(openApiDocument));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { customSiteTitle: 'Vegan Support API Docs' }),
  );
  app.use('/api/v1/health', createHealthRouter(config, database));
  app.use('/api/v1/auth', createAuthRouter(authController));
  app.use('/api/v1/users', createUsersRouter(usersController, authentication));
  app.use('/api/v1/diet-rules', createDietRouter(dietController, authentication));
  app.use('/api/v1/categories', createCategoryRouter(catalogController));
  app.use('/api/v1/ingredients', createIngredientRouter(catalogController));
  app.use('/api/v1/admin', createCatalogAdminRouter(catalogController, authentication));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
