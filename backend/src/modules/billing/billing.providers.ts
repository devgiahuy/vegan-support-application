import { PayOS, type PaymentLink, type WebhookData } from '@payos/node';
import type { PaymentOrder } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { payosWebhookSchema } from './billing.schemas.js';

export interface VerifiedPayment {
  orderId: string;
  transactionId: string;
  amountVnd: number;
  status: 'PAID' | 'CANCELLED' | 'FAILED' | 'EXPIRED' | 'PENDING';
}

export function paymentError(code: string, message: string, statusCode = 400): AppError {
  return new AppError({ code, message, statusCode });
}

export class BillingProviders {
  private readonly client: PayOS | null;
  constructor(private readonly config: AppConfig) {
    const b = config.billing;
    this.client =
      b.payosClientId && b.payosApiKey && b.payosChecksumKey
        ? new PayOS({
            clientId: b.payosClientId,
            apiKey: b.payosApiKey,
            checksumKey: b.payosChecksumKey,
            baseURL: 'https://api-merchant.payos.vn',
            partnerCode: null,
            timeout: 10000,
            maxRetries: 0,
            logLevel: 'off',
          })
        : null;
  }

  get configured(): boolean {
    return this.client !== null;
  }

  async checkout(order: PaymentOrder): Promise<{ linkId: string; url: string }> {
    const client = this.ensurePayos();
    const orderCode = this.orderCode(order);
    const returnUrl = this.config.billing.publicUrl + '/api/v1/billing/payos/return/' + order.id;
    let result;
    try {
      result = await client.paymentRequests.create({
        orderCode,
        amount: order.priceVnd,
        description: 'VC' + String(orderCode).slice(-7),
        items: [{ name: order.productName, quantity: 1, price: order.priceVnd }],
        returnUrl,
        cancelUrl: returnUrl,
        expiredAt: Math.floor(order.expiresAt.getTime() / 1000),
      });
    } catch (error) {
      if (error instanceof PayOS.InvalidSignatureError) throw this.providerError(error);
      // A timed-out create can already exist remotely. Never allocate a new code on retry.
      const existing = await this.queryLink(order);
      return { linkId: existing.id, url: 'https://pay.payos.vn/web/' + existing.id };
    }
    if (
      result.currency !== 'VND' ||
      result.orderCode !== orderCode ||
      result.amount !== order.priceVnd
    )
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Checkout payOS không khớp đơn hàng.');
    this.linkId(result.paymentLinkId, order.providerLinkId);
    const url = new URL(result.checkoutUrl);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'pay.payos.vn' ||
      url.username ||
      url.password ||
      url.pathname !== '/web/' + result.paymentLinkId
    )
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Đường dẫn checkout payOS không hợp lệ.');
    return { linkId: result.paymentLinkId, url: url.toString() };
  }

  async verifyWebhook(input: unknown): Promise<WebhookData> {
    const parsed = payosWebhookSchema.safeParse(input);
    if (!parsed.success)
      throw paymentError('BILLING_SIGNATURE_INVALID', 'Thông báo payOS không hợp lệ.');
    try {
      // SDK types require success although verification only uses data + signature.
      // Never use this unsigned envelope hint as evidence of settlement.
      return await this.ensurePayos().webhooks.verify({
        ...parsed.data,
        success: parsed.data.success ?? false,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw paymentError('BILLING_SIGNATURE_INVALID', 'Chữ ký thông báo payOS không hợp lệ.');
    }
  }

  async query(order: PaymentOrder): Promise<VerifiedPayment> {
    const result = await this.queryLink(order);
    const amounts = [result.amount, result.amountPaid, result.amountRemaining];
    if (!amounts.every((amount) => Number.isSafeInteger(amount) && amount >= 0))
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Số tiền đối soát không hợp lệ.');
    const status =
      result.status === 'PAID'
        ? result.amountPaid >= order.priceVnd
          ? 'PAID'
          : 'PENDING'
        : result.status === 'CANCELLED' || result.status === 'EXPIRED' || result.status === 'FAILED'
          ? result.status
          : 'PENDING';
    return {
      orderId: order.id,
      transactionId: result.id,
      amountVnd: result.amount,
      status,
    };
  }

  async queryLink(order: PaymentOrder): Promise<PaymentLink> {
    let result;
    try {
      result = await this.ensurePayos().paymentRequests.get(this.orderCode(order));
    } catch (error) {
      throw this.providerError(error);
    }
    if (result.orderCode !== this.orderCode(order) || result.amount !== order.priceVnd)
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Kết quả payOS không khớp đơn hàng.');
    this.linkId(result.id, order.providerLinkId);
    return result;
  }

  private linkId(id: string, expected: string | null): void {
    if (!/^[a-f0-9]{32}$/i.test(id) || (expected && id !== expected))
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Mã link payOS không khớp.');
  }

  private orderCode(order: PaymentOrder): number {
    const code = Number(order.providerOrderCode);
    if (order.provider !== 'payos' || !Number.isSafeInteger(code) || code <= 0)
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Mã đơn payOS không hợp lệ.');
    return code;
  }

  private ensurePayos(): PayOS {
    if (!this.config.billing.enabled || this.config.nodeEnv === 'production' || !this.client)
      throw paymentError(
        'BILLING_PROVIDER_UNAVAILABLE',
        'Thanh toán payOS chưa được cấu hình.',
        503,
      );
    return this.client;
  }

  private providerError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof PayOS.InvalidSignatureError)
      return paymentError('BILLING_SIGNATURE_INVALID', 'Chữ ký kết quả payOS không hợp lệ.');
    return paymentError(
      'BILLING_PROVIDER_UNAVAILABLE',
      'Chưa kết nối được payOS. Vui lòng thử lại sau.',
      503,
    );
  }
}
