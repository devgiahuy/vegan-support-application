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
  sandboxBodySchema,
  sandboxQuerySchema,
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
  const expiredCheckout = {
    410: {
      description:
        'Valid local checkout capability has expired (BILLING_CHECKOUT_EXPIRED); browser HTML offers a return link, API callers receive the typed JSON error. No grant.',
      content: { ...json(errorSchema), 'text/html': { schema: z.string() } },
    },
  };
  const callbackQuery = z
    .object({
      vnp_TxnRef: z.string(),
      vnp_Amount: z.string(),
      vnp_TmnCode: z.string(),
      vnp_ResponseCode: z.string(),
      vnp_TransactionStatus: z.string(),
      vnp_TransactionNo: z.string(),
      vnp_SecureHash: z.string(),
    })
    .passthrough();
  for (const operation of [
    {
      method: 'get' as const,
      path: '/billing/products',
      summary: 'List demo packages and configured provider',
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
      summary: 'Verify provider query and settle once; 5-minute throttle',
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
    method: 'get',
    path: '/api/v1/billing/vnpay/ipn',
    tags: ['Billing'],
    summary: 'VNPAY Sandbox signed server notification; grants once',
    request: { query: callbackQuery },
    responses: {
      200: {
        description:
          'Provider acknowledgement: 00 accepted, 02 replay, 97 signature, 01 order, 04 mismatch, 99 retry',
        content: json(z.object({ RspCode: z.string(), Message: z.string() })),
      },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/billing/vnpay/return',
    tags: ['Billing'],
    summary: 'Verify browser return and redirect; never grant',
    request: { query: callbackQuery },
    responses: { 303: { description: 'Configured application return URL' }, ...errors },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/billing/sandbox/{id}',
    tags: ['Billing'],
    summary: 'Development-only simulated checkout, expiring order-bound capability',
    request: { params: billingIdSchema, query: sandboxQuerySchema },
    responses: {
      200: { description: 'Explicit local simulation HTML' },
      ...errors,
      ...expiredCheckout,
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/billing/sandbox/{id}',
    tags: ['Billing'],
    summary: 'Development-only simulated settlement; no real money',
    request: {
      params: billingIdSchema,
      body: { content: { 'application/x-www-form-urlencoded': { schema: sandboxBodySchema } } },
    },
    responses: { 303: { description: 'Application return URL' }, ...errors, ...expiredCheckout },
  });
}
