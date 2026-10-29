import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  revenueQuerySchema,
  revenueStatsEnvelopeSchema,
  usageQuerySchema,
  usageTracePageSchema,
} from './admin-insights.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });

export function registerAdminInsightsOpenApi(registry: OpenAPIRegistry, error: z.ZodTypeAny): void {
  const revenue = registry.register('AdminBillingRevenueResponse', revenueStatsEnvelopeSchema);
  const usage = registry.register('AdminAiUsageTraceResponse', usageTracePageSchema);
  const errors = {
    401: { description: 'Authentication required', content: json(error) },
    403: { description: 'Administrator role required', content: json(error) },
    422: {
      description: 'Invalid input or ADMIN_STATS_WINDOW_INVALID',
      content: json(error),
    },
  };
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/billing/revenue',
    tags: ['Admin Insights'],
    operationId: 'getAdminBillingRevenue',
    summary: 'Revenue from AI allowance purchases: overview, time series and order statuses',
    description:
      'Default window is the last 30 days, maximum 731 days. Revenue counts PAID orders by paidAt; status counts use createdAt. Buckets use Asia/Ho_Chi_Minh, weeks start Monday. Simulated sandbox orders are excluded.',
    security,
    request: { query: revenueQuerySchema },
    responses: { 200: { description: 'Revenue statistics', content: json(revenue) }, ...errors },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/ai/usage',
    tags: ['Admin Insights'],
    operationId: 'listAdminAiUsage',
    summary: 'Paginated per-user AI usage trace with allowance source and outcome',
    description:
      'Rows combine signed-in chat requests (including free daily chat) with fridge/receipt allowance reservations, newest first. `user` matches email or display name. Prompts, images, receipts and provider payloads are never returned. Chat rows follow AI request-log retention.',
    security,
    request: { query: usageQuerySchema },
    responses: { 200: { description: 'Usage trace page', content: json(usage) }, ...errors },
  });
}
