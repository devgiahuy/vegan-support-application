import { randomInt } from 'node:crypto';
import type { PaymentOrder, PrismaClient } from '@prisma/client';
import type { AppConfig } from '../../config/env.js';
import { lockDocument } from '../../database/locking.js';
import type { EntitlementService } from '../entitlements/entitlement.service.js';
import { BillingProviders, paymentError, type VerifiedPayment } from './billing.providers.js';

export class BillingService {
  readonly providers: BillingProviders;
  constructor(
    private readonly prisma: PrismaClient,
    readonly entitlements: EntitlementService,
    readonly config: AppConfig,
  ) {
    this.providers = new BillingProviders(config);
  }

  async products() {
    return {
      enabled: this.config.billing.enabled && this.providers.configured,
      provider: this.config.billing.provider,
      simulated: false,
      products: (
        await this.prisma.billingProduct.findMany({
          where: { active: true },
          orderBy: { priceVnd: 'asc' },
        })
      ).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        version: p.version,
        priceVnd: p.priceVnd,
        chatCredits: p.chatCredits,
        fridgeCredits: p.fridgeCredits,
        receiptCredits: p.receiptCredits,
        pantrySlots: p.pantrySlots,
      })),
    };
  }

  async create(ownerId: string, input: { productId: string; idempotencyKey: string }, ip: string) {
    this.ensureEnabled();
    if (!this.providers.configured)
      throw paymentError(
        'BILLING_PROVIDER_UNAVAILABLE',
        'Thanh toán payOS chưa được cấu hình.',
        503,
      );
    const order = await this.prisma.$transaction(async (tx) => {
      await lockDocument(tx, 'user', { id: ownerId });
      const existing = await tx.paymentOrder.findUnique({
        where: { ownerId_idempotencyKey: { ownerId, idempotencyKey: input.idempotencyKey } },
      });
      if (existing) {
        if (existing.productId !== input.productId)
          throw paymentError(
            'BILLING_IDEMPOTENCY_CONFLICT',
            'Mã yêu cầu đã dùng cho gói khác.',
            409,
          );
        return existing;
      }
      const product = await tx.billingProduct.findUnique({ where: { id: input.productId } });
      if (!product?.active)
        throw paymentError('BILLING_PRODUCT_UNAVAILABLE', 'Gói không còn được bán.', 422);
      if (
        (await tx.paymentOrder.count({
          where: { ownerId, status: 'PENDING', expiresAt: { gt: new Date() } },
        })) >= 5
      )
        throw paymentError(
          'BILLING_PENDING_LIMIT',
          'Bạn đang có nhiều đơn chờ thanh toán. Hoàn tất một đơn trước.',
          429,
        );
      return tx.paymentOrder.create({
        data: {
          ownerId,
          productId: product.id,
          productName: product.name,
          productVersion: product.version,
          priceVnd: product.priceVnd,
          chatCredits: product.chatCredits,
          fridgeCredits: product.fridgeCredits,
          receiptCredits: product.receiptCredits,
          pantrySlots: product.pantrySlots,
          provider: this.config.billing.provider,
          providerOrderCode: String(randomInt(1, 2 ** 48 - 1)),
          providerLinkId: null,
          providerCheckoutUrl: null,
          lastQueriedAt: null,
          idempotencyKey: input.idempotencyKey,
          expiresAt: new Date(Date.now() + this.config.billing.orderTtlMinutes * 60000),
        },
      });
    });
    const current = await this.expire(order);
    if (current.provider !== 'payos' || current.status !== 'PENDING' || current.providerCheckoutUrl)
      return this.serialize(current, ip);
    const checkout = await this.providers.checkout(current);
    await this.prisma.paymentOrder.updateMany({
      where: { id: current.id, providerCheckoutUrl: null },
      data: { providerLinkId: checkout.linkId, providerCheckoutUrl: checkout.url },
    });
    return this.get(ownerId, current.id, ip);
  }

  async owned(ownerId: string, id: string): Promise<PaymentOrder> {
    const order = await this.prisma.paymentOrder.findFirst({ where: { id, ownerId } });
    if (!order) throw paymentError('BILLING_ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);
    return order;
  }

  async get(ownerId: string, id: string, ip: string) {
    return this.serialize(await this.expire(await this.owned(ownerId, id)), ip);
  }

  async list(ownerId: string, page: number, ip: string) {
    const [orders, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: (page - 1) * 20,
      }),
      this.prisma.paymentOrder.count({ where: { ownerId } }),
    ]);
    return {
      items: orders.map((order) => this.serialize(order, ip)),
      page,
      totalPages: Math.ceil(total / 20),
      total,
    };
  }

  async settle(provider: string, payment: VerifiedPayment): Promise<{ alreadyPaid: boolean }> {
    this.ensureEnabled();
    if (provider !== 'payos' || (payment.status === 'PAID' && !payment.transactionId))
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Provider thanh toán không hợp lệ.');
    return this.prisma.$transaction(async (tx) => {
      const initial = await tx.paymentOrder.findUnique({ where: { id: payment.orderId } });
      if (!initial) throw paymentError('BILLING_ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);
      await lockDocument(tx, 'user', { id: initial.ownerId });
      const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: initial.id } });
      if (order.provider !== provider || order.priceVnd !== payment.amountVnd)
        throw paymentError('BILLING_PAYMENT_MISMATCH', 'Giao dịch không khớp đơn hàng.');
      if (payment.status !== 'PAID') {
        if (order.status === 'PENDING' && payment.status !== 'PENDING')
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: { status: payment.status },
          });
        return { alreadyPaid: order.status === 'PAID' };
      }
      const transactionKey = provider + ':' + payment.transactionId;
      const event = await tx.paymentEvent.findUnique({ where: { transactionKey } });
      if (event && event.orderId !== order.id)
        throw paymentError('BILLING_PAYMENT_MISMATCH', 'Giao dịch đã được dùng cho đơn khác.');
      if (order.status === 'PAID') return { alreadyPaid: true };
      if (!event)
        await tx.paymentEvent.create({
          data: { transactionKey, orderId: order.id, provider, amountVnd: payment.amountVnd },
        });
      await this.entitlements.grant(tx, order.ownerId, order.id, order);
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      return { alreadyPaid: false };
    });
  }

  async reconcile(ownerId: string, id: string, ip: string) {
    this.ensureEnabled();
    let order = await this.owned(ownerId, id);
    if (order.status === 'PAID' || order.provider !== 'payos') return this.get(ownerId, id, ip);
    const claimed = await this.prisma.paymentOrder.updateMany({
      where: {
        id,
        OR: [{ lastQueriedAt: null }, { lastQueriedAt: { lt: new Date(Date.now() - 30000) } }],
      },
      data: { lastQueriedAt: new Date() },
    });
    if (!claimed.count)
      throw paymentError(
        'BILLING_RECONCILE_COOLDOWN',
        'Vui lòng đợi ít nhất 30 giây giữa hai lần kiểm tra thanh toán.',
        429,
      );
    // Recover a checkout whose provider create succeeded but local persistence/response failed.
    // The same persisted provider code is reused; no second application order is allocated.
    if (order.status === 'PENDING' && order.expiresAt > new Date() && !order.providerCheckoutUrl) {
      const checkout = await this.providers.checkout(order);
      await this.prisma.paymentOrder.updateMany({
        where: { id: order.id, providerCheckoutUrl: null },
        data: { providerLinkId: checkout.linkId, providerCheckoutUrl: checkout.url },
      });
      order = await this.owned(ownerId, id);
    }
    await this.settle('payos', await this.providers.query(order));
    return this.get(ownerId, id, ip);
  }

  async webhook(input: unknown): Promise<void> {
    this.ensureEnabled();
    const data = await this.providers.verifyWebhook(input);
    const order = await this.prisma.paymentOrder.findUnique({
      where: { providerOrderCode: String(data.orderCode) },
    });
    // payOS confirm-webhook sends a signed example, not an application purchase.
    if (!order) return;
    if (
      order.provider !== 'payos' ||
      data.currency !== 'VND' ||
      (order.providerLinkId && order.providerLinkId !== data.paymentLinkId)
    )
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Thông báo payOS không khớp đơn hàng.');
    if (data.code !== '00') return;
    const verified = await this.providers.query(order);
    if (verified.transactionId !== data.paymentLinkId)
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Thông báo và kết quả payOS không khớp.');
    await this.settle('payos', verified);
  }

  returnUrl(id: string): string {
    const url = new URL(this.config.billing.returnUrl);
    url.searchParams.set('orderId', id);
    return url.toString();
  }

  serialize(order: PaymentOrder, _ip = '127.0.0.1') {
    const status =
      order.status === 'PENDING' && order.expiresAt <= new Date() ? 'EXPIRED' : order.status;
    return {
      id: order.id,
      productId: order.productId,
      productName: order.productName,
      priceVnd: order.priceVnd,
      chatCredits: order.chatCredits,
      fridgeCredits: order.fridgeCredits,
      receiptCredits: order.receiptCredits,
      pantrySlots: order.pantrySlots,
      provider: order.provider,
      simulated: order.provider === 'sandbox',
      status,
      checkoutUrl:
        status === 'PENDING' &&
        this.config.billing.enabled &&
        order.provider === this.config.billing.provider &&
        this.providers.configured
          ? order.providerCheckoutUrl
          : null,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
    };
  }

  private async expire(order: PaymentOrder): Promise<PaymentOrder> {
    if (order.status === 'PENDING' && order.expiresAt <= new Date()) {
      await this.prisma.paymentOrder.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      return this.prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    }
    return order;
  }

  private ensureEnabled(): void {
    if (!this.config.billing.enabled || this.config.nodeEnv === 'production')
      throw paymentError('BILLING_DISABLED', 'Thanh toán demo chưa được bật trên máy chủ.', 503);
  }
}
