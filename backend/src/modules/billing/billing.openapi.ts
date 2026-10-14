import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../../common/validation/zod.js';
import {
  billingCatalogSchema,
  billingEnvelope,
  billingIdSchema,
  billingListQuerySchema,
  billingOrderSchema,
  billingOrdersSchema,
  createBillingOrderSchema,
  entitlementSchema,
  payosWebhookSchema,
} from './billing.schemas.js';

export function registerBillingOpenApi(registry: OpenAPIRegistry, errorSchema: z.ZodType): void {
  const json = (schema: z.ZodType) => ({ 'application/json': { schema } });
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 422, 429, 503].map((code) => [
      code,
      { description: 'Typed billing/allowance business error', content: json(errorSchema) },
    ]),
  );
  const schemas = {
    catalog: registry.register('BillingCatalogEnvelope', billingEnvelope(billingCatalogSchema)),
    order: registry.register('BillingOrderEnvelope', billingEnvelope(billingOrderSchema)),
    orders: registry.register('BillingOrdersEnvelope', billingEnvelope(billingOrdersSchema)),
    entitlement: registry.register('EntitlementEnvelope', billingEnvelope(entitlementSchema)),
  };
  for (const operation of [
    {
      method: 'get' as const,
      path: '/billing/products',
      summary: 'List packages and payOS checkout availability',
      response: schemas.catalog,
    },
    {
      method: 'get' as const,
      path: '/entitlements/me',
      summary: 'Owned allowances, Pantry capacity and recent ledger',
      response: schemas.entitlement,
    },
    {
      method: 'get' as const,
      path: '/billing/orders',
      summary: 'Paginated owned payment history',
      response: schemas.orders,
      request: { query: billingListQuerySchema },
    },
    {
      method: 'post' as const,
      path: '/billing/orders',
      summary: 'Create idempotent package order; server snapshots price and benefits',
      response: schemas.order,
      request: { body: { content: json(createBillingOrderSchema) } },
    },
    {
      method: 'get' as const,
      path: '/billing/orders/{id}',
      summary: 'Read owned order; return page does not settle it',
      response: schemas.order,
      request: { params: billingIdSchema },
    },
    {
      method: 'post' as const,
      path: '/billing/orders/{id}/reconcile',
      summary: 'Recover same payOS checkout if needed, verify query and settle once; 30-second throttle',
      response: schemas.order,
      request: { params: billingIdSchema },
    },
  ]) {
    registry.registerPath({
      method: operation.method,
      summary: operation.summary,
      ...(operation.request ? { request: operation.request } : {}),
      path: '/api/v1' + operation.path,
      tags: ['Billing'],
      security: [{ bearerAuth: [] }],
      responses: {
        [operation.method === 'post' && operation.path === '/billing/orders' ? 201 : 200]: {
          description: 'Success',
          content: json(operation.response),
        },
        ...errors,
      },
    });
  }
  registry.registerPath({
    method: 'post',
    path: '/api/v1/billing/payos/webhook',
    tags: ['Billing'],
    summary: 'Verify signed payOS notification and authoritative payment query; grant once',
    security: [],
    request: { body: { content: json(payosWebhookSchema) } },
    responses: {
      200: {
        description: 'Accepted, replay or signed unknown confirmation sample; no unverified grant',
        content: json(z.object({ success: z.literal(true) })),
      },
      ...errors,
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/billing/payos/return/{id}',
    tags: ['Billing'],
    summary:
      'Display-only browser return/cancel redirect; never grant or trust query payment claims',
    security: [],
    request: { params: billingIdSchema },
    responses: {
      303: { description: 'Configured application billing URL with local orderId' },
      ...errors,
    },
  });
}
