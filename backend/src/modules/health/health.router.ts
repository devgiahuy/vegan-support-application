import { Router } from 'express';
import type { AppConfig } from '../../config/env.js';
import type { Database } from '../../database/database.js';
import { healthResponseSchema, healthUnavailableResponseSchema } from './health.schemas.js';
import { HealthService } from './health.service.js';

export function createHealthRouter(config: AppConfig, database: Database): Router {
  const router = Router();
  const healthService = new HealthService(database);

  router.get('/', async (request, response) => {
    const databaseAvailable = await healthService.isDatabaseAvailable();

    if (!databaseAvailable) {
      const body = healthUnavailableResponseSchema.parse({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Dịch vụ cơ sở dữ liệu hiện không khả dụng',
          fields: { database: ['down'] },
          requestId: request.requestId,
        },
      });
      response.status(503).json(body);
      return;
    }

    const body = healthResponseSchema.parse({
      success: true,
      data: {
        status: 'ok',
        database: { status: 'up' },
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        uptimeSeconds: process.uptime(),
        requestId: request.requestId,
      },
      meta: null,
    });
    response.status(200).json(body);
  });

  return router;
}
