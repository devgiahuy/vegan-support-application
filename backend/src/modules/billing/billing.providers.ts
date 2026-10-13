import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { PaymentOrder } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';

export interface VerifiedPayment {
  orderId: string;
  transactionId: string;
  amountVnd: number;
  status: 'PAID' | 'CANCELLED' | 'FAILED' | 'EXPIRED' | 'PENDING';
}

const queryRequestFields = [
  'vnp_RequestId',
  'vnp_Version',
  'vnp_Command',
  'vnp_TmnCode',
  'vnp_TxnRef',
  'vnp_TransactionDate',
  'vnp_CreateDate',
  'vnp_IpAddr',
  'vnp_OrderInfo',
];
const queryResponseFields = [
  'vnp_ResponseId',
  'vnp_Command',
  'vnp_ResponseCode',
  'vnp_Message',
  'vnp_TmnCode',
  'vnp_TxnRef',
  'vnp_Amount',
  'vnp_BankCode',
  'vnp_PayDate',
  'vnp_TransactionNo',
  'vnp_TransactionType',
  'vnp_TransactionStatus',
  'vnp_OrderInfo',
  'vnp_PromotionCode',
  'vnp_PromotionAmount',
];
const encode = (value: string) =>
  encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
export const vnpayCanonical = (values: Record<string, string>) =>
  Object.keys(values)
    .filter((key) => key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && values[key] !== '')
    .sort()
    .map((key) => encode(key) + '=' + encode(values[key]!))
    .join('&');
export const paymentHmac = (secret: string, value: string) =>
  createHmac('sha512', secret).update(value, 'utf8').digest('hex');
const reference = (id: string) => id.replaceAll('-', '');
const orderIdFromReference = (value: string) =>
  /^[a-f0-9]{32}$/i.test(value)
    ? value.slice(0, 8) +
      '-' +
      value.slice(8, 12) +
      '-' +
      value.slice(12, 16) +
      '-' +
      value.slice(16, 20) +
      '-' +
      value.slice(20)
    : value;
export function equalHash(expected: string, received: string): boolean {
  return (
    /^[a-f0-9]{128}$/i.test(received) &&
    timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
  );
}
export function vnpayDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return ['year', 'month', 'day', 'hour', 'minute', 'second']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('');
}
export function flatPaymentFields(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw paymentError('BILLING_SIGNATURE_INVALID', 'Thông báo thanh toán không hợp lệ.');
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!/^vnp_[A-Za-z]+$/.test(key) || typeof value !== 'string' || value.length > 2000)
      throw paymentError('BILLING_SIGNATURE_INVALID', 'Tham số thanh toán không hợp lệ.');
    output[key] = value;
  }
  return output;
}
export function paymentError(code: string, message: string, statusCode = 400): AppError {
  return new AppError({ code, message, statusCode });
}

export class BillingProviders {
  constructor(private readonly config: AppConfig) {}

  sandboxToken(order: PaymentOrder): string {
    return paymentHmac(
      this.config.billing.sandboxSecret,
      'sandbox:' + order.id + ':' + order.expiresAt.toISOString(),
    );
  }

  verifySandbox(order: PaymentOrder, token: string): void {
    if (
      !this.config.billing.enabled ||
      this.config.billing.provider !== 'sandbox' ||
      this.config.nodeEnv === 'production' ||
      order.provider !== 'sandbox' ||
      !equalHash(this.sandboxToken(order), token) ||
      order.expiresAt <= new Date()
    ) {
      throw paymentError(
        'BILLING_SIGNATURE_INVALID',
        'Phiên thanh toán mô phỏng không hợp lệ hoặc đã hết hạn.',
        403,
      );
    }
  }

  checkout(order: PaymentOrder, ip: string): string {
    if (order.provider === 'sandbox')
      return (
        this.config.billing.publicUrl +
        '/api/v1/billing/sandbox/' +
        order.id +
        '?token=' +
        this.sandboxToken(order)
      );
    this.ensureVnpay();
    const values = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.billing.vnpayMerchant!,
      vnp_Amount: String(order.priceVnd * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: reference(order.id),
      vnp_OrderInfo: 'VeggieConnect ' + reference(order.id),
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.config.billing.publicUrl + '/api/v1/billing/vnpay/return',
      vnp_IpAddr: this.ip(ip),
      vnp_CreateDate: vnpayDate(order.createdAt),
      vnp_ExpireDate: vnpayDate(order.expiresAt),
    };
    const query = vnpayCanonical(values);
    return (
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?' +
      query +
      '&vnp_SecureHash=' +
      paymentHmac(this.config.billing.vnpaySecret!, query)
    );
  }

  verifyIpn(input: unknown): VerifiedPayment {
    this.ensureVnpay();
    const fields = flatPaymentFields(input);
    if (
      !equalHash(
        paymentHmac(this.config.billing.vnpaySecret!, vnpayCanonical(fields)),
        fields.vnp_SecureHash ?? '',
      )
    )
      throw paymentError('BILLING_SIGNATURE_INVALID', 'Chữ ký thanh toán không hợp lệ.');
    return this.payment(fields);
  }

  async query(order: PaymentOrder, ip: string): Promise<VerifiedPayment> {
    this.ensureVnpay();
    const fields: Record<string, string> = {
      vnp_RequestId: randomUUID().replaceAll('-', ''),
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: this.config.billing.vnpayMerchant!,
      vnp_TxnRef: reference(order.id),
      vnp_TransactionDate: vnpayDate(order.createdAt),
      vnp_CreateDate: vnpayDate(new Date()),
      vnp_IpAddr: this.ip(ip),
      vnp_OrderInfo: 'Query VeggieConnect ' + reference(order.id),
    };
    fields.vnp_SecureHash = paymentHmac(
      this.config.billing.vnpaySecret!,
      queryRequestFields.map((key) => fields[key] ?? '').join('|'),
    );
    let raw: unknown;
    try {
      const response = await fetch('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('VNPAY_HTTP_ERROR');
      raw = await response.json();
    } catch {
      throw paymentError(
        'BILLING_PROVIDER_UNAVAILABLE',
        'Chưa đối soát được với VNPAY. Vui lòng thử lại sau.',
        503,
      );
    }
    const result = flatPaymentFields(raw);
    const expected = paymentHmac(
      this.config.billing.vnpaySecret!,
      queryResponseFields.map((key) => result[key] ?? '').join('|'),
    );
    if (
      !equalHash(expected, result.vnp_SecureHash ?? '') ||
      (result.vnp_Command && result.vnp_Command !== 'querydr')
    )
      throw paymentError('BILLING_SIGNATURE_INVALID', 'Kết quả đối soát không hợp lệ.');
    if (result.vnp_ResponseCode !== '00') {
      throw paymentError(
        'BILLING_PROVIDER_UNAVAILABLE',
        'VNPAY chưa có kết quả đối soát cuối cùng. Thử lại sau ít nhất 5 phút.',
        503,
      );
    }
    if (result.vnp_TransactionType !== '01' || result.vnp_TxnRef !== reference(order.id))
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Kết quả đối soát không khớp đơn hàng.');
    return this.payment(result);
  }

  private payment(fields: Record<string, string>): VerifiedPayment {
    if (
      fields.vnp_TmnCode !== this.config.billing.vnpayMerchant ||
      (fields.vnp_CurrCode && fields.vnp_CurrCode !== 'VND') ||
      !/^\d+$/.test(fields.vnp_Amount ?? '')
    )
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Thông tin thanh toán không khớp.');
    const amount = Number(fields.vnp_Amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount % 100 !== 0)
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Số tiền thanh toán không hợp lệ.');
    const response = fields.vnp_ResponseCode;
    const status =
      response === '00' && fields.vnp_TransactionStatus === '00'
        ? 'PAID'
        : response === '24'
          ? 'CANCELLED'
          : response === '11'
            ? 'EXPIRED'
            : fields.vnp_TransactionStatus === '02'
              ? 'FAILED'
              : 'PENDING';
    const transactionId = fields.vnp_TransactionNo ?? '';
    if (status === 'PAID' && (!transactionId || transactionId === '0'))
      throw paymentError('BILLING_PAYMENT_MISMATCH', 'Thiếu mã giao dịch.');
    return {
      orderId: orderIdFromReference(fields.vnp_TxnRef ?? ''),
      transactionId,
      amountVnd: amount / 100,
      status,
    };
  }

  private ensureVnpay(): void {
    if (
      !this.config.billing.enabled ||
      this.config.billing.provider !== 'vnpay' ||
      !this.config.billing.vnpayMerchant ||
      !this.config.billing.vnpaySecret
    )
      throw paymentError('BILLING_PROVIDER_UNAVAILABLE', 'VNPAY Sandbox chưa được cấu hình.', 503);
  }

  private ip(value: string): string {
    const candidate = value.startsWith('::ffff:') ? value.slice(7) : value;
    return isIP(candidate) === 4 ? candidate : '127.0.0.1';
  }
}
