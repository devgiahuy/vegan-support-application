import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { errorResponseSchema } from '../common/schemas/api-envelope.schemas.js';
import {
  healthResponseSchema,
  healthUnavailableResponseSchema,
} from '../modules/health/health.schemas.js';

const registry = new OpenAPIRegistry();

registry.register('ErrorResponse', errorResponseSchema);
const registeredHealthResponse = registry.register('HealthResponse', healthResponseSchema);
const registeredHealthUnavailableResponse = registry.register(
  'HealthUnavailableResponse',
  healthUnavailableResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  tags: ['Foundation'],
  summary: 'Kiểm tra trạng thái API và PostgreSQL',
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'API và PostgreSQL hoạt động bình thường',
      content: { 'application/json': { schema: registeredHealthResponse } },
    },
    503: {
      description: 'PostgreSQL không khả dụng',
      content: { 'application/json': { schema: registeredHealthUnavailableResponse } },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Vegan Support Application API',
    version: '0.1.0',
    description: 'REST API contract for the Vegan Support Application.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development' }],
  tags: [{ name: 'Foundation', description: 'Service health and foundation contract' }],
});
