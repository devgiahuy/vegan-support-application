import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import { governanceAuditQuerySchema, governanceControlAuditSchema, governanceControlEnvelopeSchema, governanceControlSchema, governanceControlsSchema, governanceFeatureParamsSchema, governanceFlagQuerySchema, governanceFlagsSchema, governanceHealthSchema, governanceListQuerySchema, governanceMetricsQuerySchema, governanceMetricsSchema, governancePageSchema } from './ai-governance.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });

export function registerAiGovernanceOpenApi(registry: OpenAPIRegistry, error: z.ZodTypeAny): void {
  const page = registry.register('AiGovernanceRequestsResponse', governancePageSchema);
  const metrics = registry.register('AiGovernanceMetricsResponse', governanceMetricsSchema);
  const flags = registry.register('AiGovernanceFlagsResponse', governanceFlagsSchema);
  const features = registry.register('AiGovernanceControlsResponse', governanceControlsSchema);
  const feature = registry.register('AiGovernanceControlResponse', governanceControlEnvelopeSchema);
  const audit = registry.register('AiGovernanceControlAuditResponse', governanceControlAuditSchema);
  const health = registry.register('AiGovernanceHealthResponse', governanceHealthSchema);
  const errors = { 401: { description: 'Authentication required', content: json(error) }, 403: { description: 'Administrator role required', content: json(error) }, 422: { description: 'Invalid input or AI_GOVERNANCE_WINDOW_INVALID / AI_PROVIDER_NOT_CONFIGURED', content: json(error) } };
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/requests', tags: ['AI Governance Admin'], operationId: 'listAiGovernanceRequests', summary: 'Paginated redacted capability logs; 90-day maximum range', security, request: { query: governanceListQuerySchema }, responses: { 200: { description: 'Redacted logs; never contains prompts, health data, images, receipts, or provider payloads', content: json(page) }, ...errors } });
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/metrics', tags: ['AI Governance Admin'], operationId: 'getAiGovernanceMetrics', summary: 'Aggregated request, quality, correction, and review signals', security, request: { query: governanceMetricsQuerySchema }, responses: { 200: { description: 'Aggregate metrics; unavailable values are null', content: json(metrics) }, ...errors } });
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/flags', tags: ['AI Governance Admin'], operationId: 'listAiGovernanceFlags', summary: 'Paginated AI moderation signals without source content', security, request: { query: governanceFlagQuerySchema }, responses: { 200: { description: 'Redacted moderation flags', content: json(flags) }, ...errors } });
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/features', tags: ['AI Governance Admin'], operationId: 'listAiGovernanceFeatures', summary: 'Configured capability/provider states and fallbacks', security, responses: { 200: { description: 'Effective controls, without secrets', content: json(features) }, ...errors } });
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/features/audit', tags: ['AI Governance Admin'], operationId: 'listAiGovernanceControlAudit', summary: 'Paginated Admin toggle reasons and versions', security, request: { query: governanceAuditQuerySchema }, responses: { 200: { description: 'Allowlisted reasons, actors, versions and timestamps', content: json(audit) }, ...errors } });
  registry.registerPath({ method: 'patch', path: '/api/v1/admin/ai/features/{feature}', tags: ['AI Governance Admin'], operationId: 'setAiGovernanceFeature', summary: 'Versioned audited provider toggle; reason required', security, request: { params: governanceFeatureParamsSchema, body: { content: json(governanceControlSchema) } }, responses: { 200: { description: 'Updated effective control', content: json(feature) }, 409: { description: 'AI_CONFIG_CONFLICT; refresh and retry', content: json(error) }, ...errors } });
  registry.registerPath({ method: 'get', path: '/api/v1/admin/ai/health', tags: ['AI Governance Admin'], operationId: 'getAiGovernanceHealth', summary: 'Last 24 hours failures, fallback, provider availability and controls', security, responses: { 200: { description: 'Operational summary', content: json(health) }, ...errors } });
}
