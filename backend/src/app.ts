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
import { CommunityController } from './modules/community/community.controller.js';
import { CommunityRepository } from './modules/community/community.repository.js';
import {
  createCommentsRouter,
  createCommunityPostsRouter,
  createCommunityUsersRouter,
} from './modules/community/community.router.js';
import { CommunityService } from './modules/community/community.service.js';
import { ContributorApplicationStateMachine } from './modules/contributors/contributor-application.state-machine.js';
import { ContributorController } from './modules/contributors/contributor.controller.js';
import { ContributorRepository } from './modules/contributors/contributor.repository.js';
import {
  createContributorAdminRouter,
  createContributorApplicationsRouter,
} from './modules/contributors/contributor.router.js';
import { ContributorService } from './modules/contributors/contributor.service.js';
import { ContentController } from './modules/content/content.controller.js';
import { ModeratedPublicationPolicy } from './modules/content/content-publication.policy.js';
import { ContentRepository } from './modules/content/content.repository.js';
import { createPostsRouter } from './modules/content/content.router.js';
import { ContentService } from './modules/content/content.service.js';
import { MediaService } from './modules/content/media.service.js';
import { ModerationController } from './modules/moderation/moderation.controller.js';
import { ModerationRepository } from './modules/moderation/moderation.repository.js';
import {
  createModerationAdminRouter,
  createReportsRouter,
  createReviewQueueRouter,
} from './modules/moderation/moderation.router.js';
import { ModerationService } from './modules/moderation/moderation.service.js';
import { RuleModerationService } from './modules/moderation/rule-moderation.service.js';
import { DietController } from './modules/diet/diet.controller.js';
import { createDietRouter } from './modules/diet/diet.router.js';
import { createHealthRouter } from './modules/health/health.router.js';
import { ProfileRepository } from './modules/profile/profile.repository.js';
import { ProfileService } from './modules/profile/profile.service.js';
import { UsersController } from './modules/users/users.controller.js';
import { createUsersRouter } from './modules/users/users.router.js';
import { RecommendationController } from './modules/recommendations/recommendation.controller.js';
import { RecommendationRepository } from './modules/recommendations/recommendation.repository.js';
import {
  createBehaviorEventsRouter,
  createPersonalizationRouter,
  createRecommendationRouter,
} from './modules/recommendations/recommendation.router.js';
import { RecommendationService } from './modules/recommendations/recommendation.service.js';
import { MealPlanController } from './modules/meal-plans/meal-plan.controller.js';
import { MealPlanRepository } from './modules/meal-plans/meal-plan.repository.js';
import { createMealPlanRouter } from './modules/meal-plans/meal-plan.router.js';
import { MealPlanService } from './modules/meal-plans/meal-plan.service.js';
import { MealAnalysisController } from './modules/meal-analysis/meal-analysis.controller.js';
import { MealAnalysisRepository } from './modules/meal-analysis/meal-analysis.repository.js';
import { createMealAnalysisRouter } from './modules/meal-analysis/meal-analysis.router.js';
import { MealAnalysisService } from './modules/meal-analysis/meal-analysis.service.js';
import { createAiProvider } from './modules/chat/ai-provider.js';
import { ChatController } from './modules/chat/chat.controller.js';
import { ChatIdentityService } from './modules/chat/chat.identity.js';
import { ChatRepository } from './modules/chat/chat.repository.js';
import { createChatRouter } from './modules/chat/chat.router.js';
import { ChatService } from './modules/chat/chat.service.js';
import { FoodDataController } from './modules/food-data/food-data.controller.js';
import { FoodDataRepository } from './modules/food-data/food-data.repository.js';
import {
  createFoodDataAdminRouter,
  createFoodDataRouter,
} from './modules/food-data/food-data.router.js';
import { FoodDataService } from './modules/food-data/food-data.service.js';
import { RecipeNutritionController } from './modules/recipe-nutrition/recipe-nutrition.controller.js';
import { RecipeNutritionRepository } from './modules/recipe-nutrition/recipe-nutrition.repository.js';
import { createRecipeNutritionRouter } from './modules/recipe-nutrition/recipe-nutrition.router.js';
import { RecipeNutritionService } from './modules/recipe-nutrition/recipe-nutrition.service.js';
import { CloudinaryMediaProvider } from './modules/storage/cloudinary.provider.js';
import { StorageController } from './modules/storage/storage.controller.js';
import { StorageRepository } from './modules/storage/storage.repository.js';
import {
  createStorageAdminRouter,
  createStorageRouter,
  createStorageUploadsRouter,
} from './modules/storage/storage.router.js';
import { StorageService } from './modules/storage/storage.service.js';
import { CustomMealController } from './modules/custom-meals/custom-meal.controller.js';
import { CustomMealRepository } from './modules/custom-meals/custom-meal.repository.js';
import { createCustomMealRouter } from './modules/custom-meals/custom-meal.router.js';
import { CustomMealService } from './modules/custom-meals/custom-meal.service.js';
import { openApiDocument } from './openapi/document.js';

export interface AppDependencies {
  config: AppConfig;
  database: Database;
  logger: Logger;
}

export function createApp({ config, database, logger }: AppDependencies): Express {
  const app = express();
  const contributorStateMachine = new ContributorApplicationStateMachine();
  const authRepository = new AuthRepository(database.client, contributorStateMachine);
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
  const storageRepository = new StorageRepository(database.client);
  const cloudinaryProvider = new CloudinaryMediaProvider(config);
  const storageService = new StorageService(storageRepository, cloudinaryProvider, config);
  const storageController = new StorageController(storageService);
  const mediaService = new MediaService(storageRepository);
  const ruleModerationService = new RuleModerationService();
  const contentRepository = new ContentRepository(database.client);
  const contentController = new ContentController(
    new ContentService(
      contentRepository,
      mediaService,
      new ModeratedPublicationPolicy(ruleModerationService),
    ),
  );
  const communityController = new CommunityController(
    new CommunityService(new CommunityRepository(database.client)),
  );
  const contributorController = new ContributorController(
    new ContributorService(new ContributorRepository(database.client), contributorStateMachine),
  );
  const moderationController = new ModerationController(
    new ModerationService(new ModerationRepository(database.client)),
  );
  const recommendationService = new RecommendationService(
    new RecommendationRepository(database.client),
    contentRepository,
  );
  const recommendationController = new RecommendationController(recommendationService);
  const mealAnalysisService = new MealAnalysisService(new MealAnalysisRepository(database.client));
  const mealAnalysisController = new MealAnalysisController(mealAnalysisService);
  const mealPlanController = new MealPlanController(
    new MealPlanService(
      new MealPlanRepository(database.client),
      contentRepository,
      recommendationService,
      config,
      mealAnalysisService,
    ),
  );
  const aiProvider = createAiProvider(config);
  const chatController = new ChatController(
    new ChatService(new ChatRepository(database.client), aiProvider, recommendationService, config),
    new ChatIdentityService(config),
  );
  const foodDataController = new FoodDataController(
    new FoodDataService(new FoodDataRepository(database.client)),
  );
  const recipeNutritionController = new RecipeNutritionController(
    new RecipeNutritionService(new RecipeNutritionRepository(database.client), aiProvider),
  );
  const customMealController = new CustomMealController(
    new CustomMealService(new CustomMealRepository(database.client), storageRepository),
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
  app.use(
    '/api/v1/contributor-applications',
    createContributorApplicationsRouter(contributorController, authentication),
  );
  app.use('/api/v1/users', createUsersRouter(usersController, authentication));
  app.use(
    '/api/v1/users/me',
    createPersonalizationRouter(recommendationController, authentication),
  );
  app.use('/api/v1/users', createCommunityUsersRouter(communityController, authentication));
  app.use('/api/v1/diet-rules', createDietRouter(dietController, authentication));
  app.use('/api/v1/categories', createCategoryRouter(catalogController));
  app.use('/api/v1/ingredients', createIngredientRouter(catalogController));
  app.use('/api/v1/food-data', createFoodDataRouter(foodDataController));
  app.use('/api/v1/admin', createCatalogAdminRouter(catalogController, authentication));
  app.use('/api/v1/admin', createFoodDataAdminRouter(foodDataController, authentication));
  app.use('/api/v1/admin', createContributorAdminRouter(contributorController, authentication));
  app.use('/api/v1/admin', createModerationAdminRouter(moderationController, authentication));
  app.use('/api/v1/admin', createStorageAdminRouter(storageController, authentication));
  app.use('/api/v1/review-queue', createReviewQueueRouter(moderationController, authentication));
  app.use('/api/v1/reports', createReportsRouter(moderationController, authentication));
  app.use(
    '/api/v1/behavior-events',
    createBehaviorEventsRouter(recommendationController, authentication),
  );
  app.use(
    '/api/v1/recommendations',
    createRecommendationRouter(recommendationController, authentication),
  );
  app.use('/api/v1/meal-plans', createMealPlanRouter(mealPlanController, authentication));
  app.use('/api/v1/meal-plans', createMealAnalysisRouter(mealAnalysisController, authentication));
  app.use('/api/v1/chat', createChatRouter(chatController, authentication));
  app.use('/api/v1/posts', createRecipeNutritionRouter(recipeNutritionController, authentication));
  app.use('/api/v1/posts', createPostsRouter(contentController, authentication));
  app.use('/api/v1/posts', createCommunityPostsRouter(communityController, authentication));
  app.use('/api/v1/comments', createCommentsRouter(communityController, authentication));
  app.use('/api/v1/storage', createStorageRouter(storageController, authentication));
  app.use('/api/v1/uploads', createStorageUploadsRouter(storageController, authentication));
  app.use('/api/v1/custom-meals', createCustomMealRouter(customMealController, authentication));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
