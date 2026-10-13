import { Router, urlencoded } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/validation/validate-request.js';
import type { AuthenticationMiddleware } from '../auth/authentication.middleware.js';
import {
  billingIdSchema,
  billingListQuerySchema,
  createBillingOrderSchema,
  sandboxBodySchema,
  sandboxQuerySchema,
} from './billing.schemas.js';
import type { BillingService } from './billing.service.js';

const htmlEscape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );

export function createBillingRouter(
  service: BillingService,
  authentication: AuthenticationMiddleware,
): Router {
  const router = Router();
  router.get('/billing/products', authentication.authenticate, async (_req, res) => {
    res.json({ success: true, data: await service.products() });
  });
  router.get('/entitlements/me', authentication.authenticate, async (req, res) => {
    res.json({ success: true, data: await service.entitlements.overview(req.auth!.userId) });
  });
  router.post(
    '/billing/orders',
    authentication.authenticate,
    validateBody(createBillingOrderSchema),
    async (req, res) => {
      const input = getValidatedBody<{ productId: string; idempotencyKey: string }>(req);
      res
        .status(201)
        .json({ success: true, data: await service.create(req.auth!.userId, input, req.ip ?? '') });
    },
  );
  router.get(
    '/billing/orders',
    authentication.authenticate,
    validateQuery(billingListQuerySchema),
    async (req, res) => {
      const { page } = getValidatedQuery<{ page: number }>(req);
      res.json({ success: true, data: await service.list(req.auth!.userId, page, req.ip ?? '') });
    },
  );
  router.get(
    '/billing/orders/:id',
    authentication.authenticate,
    validateParams(billingIdSchema),
    async (req, res) => {
      res.json({
        success: true,
        data: await service.get(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          req.ip ?? '',
        ),
      });
    },
  );
  router.post(
    '/billing/orders/:id/reconcile',
    authentication.authenticate,
    validateParams(billingIdSchema),
    async (req, res) => {
      res.json({
        success: true,
        data: await service.reconcile(
          req.auth!.userId,
          getValidatedParams<{ id: string }>(req).id,
          req.ip ?? '',
        ),
      });
    },
  );
  router.get('/billing/vnpay/ipn', async (req, res) => {
    try {
      const result = await service.settle('vnpay', service.providers.verifyIpn(req.query));
      res.json({
        RspCode: result.alreadyPaid ? '02' : '00',
        Message: result.alreadyPaid ? 'Already confirmed' : 'Confirm success',
      });
    } catch (error) {
      const codes: Record<string, string> = {
        BILLING_SIGNATURE_INVALID: '97',
        BILLING_ORDER_NOT_FOUND: '01',
        BILLING_PAYMENT_MISMATCH: '04',
      };
      res.json({
        RspCode: error instanceof AppError ? (codes[error.code] ?? '99') : '99',
        Message: 'Cannot confirm payment',
      });
    }
  });
  router.get('/billing/vnpay/return', (req, res) => {
    const payment = service.providers.verifyIpn(req.query);
    // Browser returns never grant benefits. IPN or verified query performs settlement.
    res.redirect(303, service.returnUrl(payment.orderId));
  });
  router.get(
    '/billing/sandbox/:id',
    validateParams(billingIdSchema),
    validateQuery(sandboxQuerySchema),
    async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      const { token } = getValidatedQuery<{ token: string }>(req);
      const order = await service.sandboxOrder(id, token);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
      // Browsers also check form-action across 303 redirects.
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' " +
          new URL(service.config.billing.returnUrl).origin,
      );
      res
        .type('html')
        .send(
          '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thanh toán mô phỏng</title><style>body{font:16px system-ui;background:#f6faf7;color:#18382a;margin:0;padding:24px}main{max-width:520px;margin:8vh auto;background:#fff;padding:32px;border:1px solid #dce9df;border-radius:16px}button,a{display:block;padding:14px;margin:12px 0;border-radius:8px;font:inherit}button{width:100%;border:1px solid #2f6d4c;cursor:pointer;background:#edf6ef}button:first-of-type{background:#2f6d4c;color:#fff}small{color:#536458}</style></head><body><main><small>VeggieConnect · Sandbox nội bộ</small><h1>Thanh toán mô phỏng</h1><p>Không chuyển tiền thật. Đây không phải trang thanh toán của VNPAY.</p><h2>' +
            htmlEscape(order.productName) +
            '</h2><p>' +
            order.priceVnd.toLocaleString('vi-VN') +
            ' đ · Giá minh họa</p><p>Trạng thái: ' +
            htmlEscape(order.status) +
            '</p><form method="post"><input type="hidden" name="token" value="' +
            htmlEscape(token) +
            '"><button name="outcome" value="PAID">Mô phỏng thanh toán thành công</button><button name="outcome" value="CANCELLED">Mô phỏng hủy thanh toán</button><button name="outcome" value="FAILED">Mô phỏng giao dịch thất bại</button></form><a href="' +
            htmlEscape(service.returnUrl(id)) +
            '">Quay lại ứng dụng</a><p><small>Nếu mở từ mobile, đóng trình duyệt và trở lại ứng dụng để xem hạn mức.</small></p></main></body></html>',
        );
    },
  );
  router.post(
    '/billing/sandbox/:id',
    urlencoded({ extended: false, limit: '4kb' }),
    validateParams(billingIdSchema),
    validateBody(sandboxBodySchema),
    async (req, res) => {
      const { id } = getValidatedParams<{ id: string }>(req);
      const { token, outcome } = getValidatedBody<{
        token: string;
        outcome: 'PAID' | 'CANCELLED' | 'FAILED';
      }>(req);
      await service.sandboxSettle(id, token, outcome);
      res.redirect(303, service.returnUrl(id));
    },
  );
  return router;
}
