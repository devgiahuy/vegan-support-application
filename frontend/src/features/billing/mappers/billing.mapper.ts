import { BaseMapper } from '@/lib/mapper/base-mapper';
import {
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeNumber,
  safeString,
} from '@/lib/mapper/field-helpers';
import { formatCurrency } from '@/lib/utils';
import type {
  BillingBenefitsDto,
  BillingCatalogDto,
  BillingOrderDto,
  BillingOrdersDto,
  BillingProductDto,
  EntitlementDto,
  EntitlementLedgerDto,
  EntitlementSubscriptionDto,
} from '@/features/billing/types/billing.dto';
import type {
  BillingBenefits,
  BillingCatalog,
  BillingOrder,
  BillingOrders,
  BillingProduct,
  BillingProvider,
  BillingStatus,
  EntitlementSubscription,
  Entitlements,
} from '@/features/billing/types/billing.model';

const count = (value: unknown) => Math.max(0, Math.floor(safeNumber(value)));
const dateLabel = (value: unknown) => {
  const date = safeDate(value);
  return date
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : 'Chưa có';
};
const dayLabel = (value: unknown) => {
  const date = safeDate(value);
  return date
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
    : 'Chưa có';
};
const durationMonths = (value: unknown): number | null => {
  const months = count(value ?? 0);
  return months > 0 ? months : null;
};
export const durationLabel = (months: number | null) =>
  months === null ? 'Mua một lần' : months % 12 === 0 ? months / 12 + ' năm' : months + ' tháng';
const provider = (value: unknown): BillingProvider =>
  value === 'payos' || value === 'sandbox' || value === 'vnpay' ? value : 'UNKNOWN';
const providerLabel = (value: BillingProvider) =>
  value === 'payos'
    ? 'payOS · Chuyển khoản / QR'
    : value === 'sandbox'
      ? 'Mô phỏng cũ · Chỉ xem'
      : value === 'vnpay'
        ? 'VNPAY Sandbox cũ · Chỉ xem'
        : 'Chưa xác định provider';
const statuses: Record<BillingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã cấp quyền lợi',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
  UNKNOWN: 'Chưa xác định',
};
const status = (value: string): BillingStatus =>
  Object.hasOwn(statuses, value) ? (value as BillingStatus) : 'UNKNOWN';
function benefits(dto: BillingBenefitsDto | null | undefined): BillingBenefits {
  const chatCredits = count(pickField(dto, ['chatCredits'], 0));
  const fridgeCredits = count(pickField(dto, ['fridgeCredits'], 0));
  const receiptCredits = count(pickField(dto, ['receiptCredits'], 0));
  const pantrySlots = count(pickField(dto, ['pantrySlots'], 0));
  return {
    chatCredits,
    fridgeCredits,
    receiptCredits,
    pantrySlots,
    benefitLabels: [
      chatCredits ? chatCredits + ' lượt chat AI' : '',
      fridgeCredits ? fridgeCredits + ' lượt quét tủ lạnh' : '',
      receiptCredits ? receiptCredits + ' lượt phân tích hóa đơn' : '',
      pantrySlots ? pantrySlots + ' ô tủ đồ ăn' : '',
    ].filter(Boolean),
  };
}
function checkoutUrl(value: unknown): string | null {
  const text = safeString(value);
  try {
    const url = new URL(text);
    return url.protocol === 'https:' &&
      url.hostname === 'pay.payos.vn' &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/web\/[a-f0-9]{32}$/i.test(url.pathname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
class ProductMapper extends BaseMapper<BillingProductDto, BillingProduct> {
  toModel(dto: BillingProductDto | null | undefined): BillingProduct {
    const id = safeString(pickField(dto, ['id'], ''));
    const priceVnd = count(pickField(dto, ['priceVnd'], 0));
    const allowance = benefits(dto);
    const months = durationMonths(pickField(dto, ['durationMonths'], null));
    const periodDays = months ? count(pickField(dto, ['periodDays'], 30)) || 30 : null;
    return {
      ...allowance,
      id,
      name: safeString(pickField(dto, ['name'], 'Gói quyền lợi')),
      description: safeString(pickField(dto, ['description'], '')),
      version: count(pickField(dto, ['version'], 0)),
      priceVnd,
      priceLabel: formatCurrency(priceVnd),
      canBuy: Boolean(id && priceVnd > 0 && allowance.benefitLabels.length),
      durationMonths: months,
      durationLabel: durationLabel(months),
      periodDays,
      monthlyPriceLabel: months ? formatCurrency(Math.round(priceVnd / months)) : '',
      periodBenefitLabels: months
        ? [
            allowance.chatCredits ? allowance.chatCredits + ' lượt chat AI' : '',
            allowance.fridgeCredits ? allowance.fridgeCredits + ' lượt quét tủ lạnh' : '',
            allowance.receiptCredits ? allowance.receiptCredits + ' lượt phân tích hóa đơn' : '',
          ]
            .filter(Boolean)
            .map((label) => label + ' mỗi ' + periodDays + ' ngày')
            .concat(
              allowance.pantrySlots ? ['+' + allowance.pantrySlots + ' ô tủ đồ ăn khi còn hạn'] : []
            )
        : [],
      savingsPercent: 0,
    };
  }
}
export class CatalogMapper extends BaseMapper<BillingCatalogDto, BillingCatalog> {
  toModel(dto: BillingCatalogDto | null | undefined): BillingCatalog {
    const source = provider(safeString(pickField(dto, ['provider'], '')));
    const products = productMapper.toModelList(pickField(dto, ['products'], []));
    const plans = products
      .filter((product) => product.durationMonths !== null)
      .sort((a, b) => (a.durationMonths ?? 0) - (b.durationMonths ?? 0));
    const monthly = plans.find((plan) => plan.durationMonths === 1);
    const durationPlans = plans.map((plan) => {
      const fullPrice = monthly ? monthly.priceVnd * (plan.durationMonths ?? 1) : 0;
      return {
        ...plan,
        savingsPercent:
          fullPrice > plan.priceVnd ? Math.round((1 - plan.priceVnd / fullPrice) * 100) : 0,
      };
    });
    return {
      enabled:
        safeBoolean(pickField(dto, ['enabled'], false)) &&
        source === 'payos' &&
        !safeBoolean(pickField(dto, ['simulated'], false)),
      provider: source,
      providerLabel: providerLabel(source),
      simulated:
        source === 'sandbox' ||
        source === 'UNKNOWN' ||
        safeBoolean(pickField(dto, ['simulated'], false)),
      products,
      oneTimeProducts: products.filter((product) => product.durationMonths === null),
      durationPlans,
    };
  }
}
export class OrderMapper extends BaseMapper<BillingOrderDto, BillingOrder> {
  toModel(dto: BillingOrderDto | null | undefined): BillingOrder {
    const currentStatus = status(safeString(pickField(dto, ['status'], '')));
    const source = provider(safeString(pickField(dto, ['provider'], '')));
    return {
      ...benefits(dto),
      id: safeString(pickField(dto, ['id'], '')),
      productId: safeString(pickField(dto, ['productId'], '')),
      productName: safeString(pickField(dto, ['productName'], 'Gói quyền lợi')),
      durationLabel: durationLabel(durationMonths(pickField(dto, ['durationMonths'], null))),
      provider: source,
      priceLabel: formatCurrency(count(pickField(dto, ['priceVnd'], 0))),
      providerLabel: providerLabel(source),
      simulated:
        source === 'sandbox' ||
        source === 'UNKNOWN' ||
        safeBoolean(pickField(dto, ['simulated'], false)),
      status: currentStatus,
      statusLabel: statuses[currentStatus],
      pending: currentStatus === 'PENDING' && source === 'payos',
      checkoutUrl:
        currentStatus === 'PENDING' && source === 'payos'
          ? checkoutUrl(pickField(dto, ['checkoutUrl'], null))
          : null,
      createdAtLabel: dateLabel(pickField(dto, ['createdAt'], null)),
      expiresAtLabel: dateLabel(pickField(dto, ['expiresAt'], null)),
      paidAtLabel: dateLabel(pickField(dto, ['paidAt'], null)),
    };
  }
  toOrders(dto: BillingOrdersDto | null | undefined): BillingOrders {
    return {
      items: this.toModelList(pickField(dto, ['items'], [])),
      page: Math.max(1, count(pickField(dto, ['page'], 1))),
      totalPages: count(pickField(dto, ['totalPages'], 0)),
      total: count(pickField(dto, ['total'], 0)),
    };
  }
}
export class EntitlementMapper extends BaseMapper<EntitlementDto, Entitlements> {
  toModel(dto: EntitlementDto | null | undefined): Entitlements {
    const allowance = benefits(dto);
    const pantryUsed = count(pickField(dto, ['pantryUsed'], 0));
    const rawLimit: unknown = pickField(dto, ['pantryLimit'], null);
    const pantryLimit = rawLimit === null || rawLimit === undefined ? null : count(rawLimit);
    const chatReserved = count(pickField(dto, ['chatReserved'], 0));
    const fridgeReserved = count(pickField(dto, ['fridgeReserved'], 0));
    const receiptReserved = count(pickField(dto, ['receiptReserved'], 0));
    const source = provider(safeString(pickField(dto, ['provider'], '')));
    const fridgeMax = count(pickField(dto, ['fridgeMaxImages'], 0));
    const receiptMax = count(pickField(dto, ['receiptMaxImages'], 0));
    const attempts = count(pickField(dto, ['scanMaxAttempts'], 0));
    const pantryLabel =
      pantryLimit === null
        ? pantryUsed + ' item · Chưa giới hạn'
        : pantryUsed + ' / ' + pantryLimit + ' ô';
    const featureLabels: Record<string, string> = {
      CHAT: 'Chat AI',
      FRIDGE: 'Quét tủ lạnh',
      RECEIPT: 'Phân tích hóa đơn',
      PANTRY: 'Ô tủ đồ ăn',
    };
    const reasons: Record<string, string> = {
      TRIAL_GRANT: 'Cấp lượt dùng thử',
      PACKAGE_PURCHASE: 'Mua gói',
      USAGE_RESERVED: 'Giữ chỗ cho tác vụ',
      USAGE_COMPLETED: 'Hoàn tất sử dụng',
      USAGE_RELEASED: 'Trả lại lượt',
      USAGE_RELEASED_PERIOD_EXPIRED: 'Không hoàn lượt của chu kỳ đã hết',
      SUBSCRIPTION_PERIOD_GRANT: 'Cấp lượt chu kỳ gói tiện ích',
      SUBSCRIPTION_PERIOD_EXPIRED: 'Lượt chu kỳ cũ hết hạn',
    };
    const subscription = subscriptionModel(pickField(dto, ['subscription'], null));
    const chatAvailable = allowance.chatCredits + (subscription?.chatCredits ?? 0);
    const fridgeAvailable = allowance.fridgeCredits + (subscription?.fridgeCredits ?? 0);
    const receiptAvailable = allowance.receiptCredits + (subscription?.receiptCredits ?? 0);
    const periodNote = (credits: number | undefined) =>
      subscription ? ' · gồm ' + (credits ?? 0) + ' lượt chu kỳ gói' : '';
    return {
      ...allowance,
      enabled: safeBoolean(pickField(dto, ['enabled'], false)),
      providerLabel: providerLabel(source),
      simulated:
        source === 'sandbox' ||
        source === 'UNKNOWN' ||
        safeBoolean(pickField(dto, ['simulated'], false)),
      pantryUsed,
      pantryLimit,
      pantryFull: pantryLimit !== null && pantryUsed >= pantryLimit,
      pantryLabel,
      scanPolicyLabel:
        'Một job tính một lượt: tối đa ' +
        fridgeMax +
        ' ảnh tủ lạnh hoặc ' +
        receiptMax +
        ' ảnh hóa đơn; tối đa ' +
        attempts +
        ' lần xử lý.',
      usageRows: [
        {
          label: 'Chat mua thêm',
          value: chatAvailable + ' lượt',
          note:
            'Dùng sau lượt miễn phí · ' +
            chatReserved +
            ' đang giữ chỗ' +
            periodNote(subscription?.chatCredits),
        },
        {
          label: 'Quét tủ lạnh',
          value: fridgeAvailable + ' lượt',
          note: fridgeReserved + ' đang giữ chỗ' + periodNote(subscription?.fridgeCredits),
        },
        {
          label: 'Phân tích hóa đơn',
          value: receiptAvailable + ' lượt',
          note: receiptReserved + ' đang giữ chỗ' + periodNote(subscription?.receiptCredits),
        },
        { label: 'Tủ đồ ăn', value: pantryLabel, note: 'Xóa hoặc gộp item sẽ giải phóng ô' },
      ],
      chatAvailable,
      fridgeAvailable,
      receiptAvailable,
      subscription,
      ledger: safeArray<EntitlementLedgerDto, Entitlements['ledger'][number]>(
        pickField(dto, ['ledger'], []),
        (entry) => {
          const delta = Math.trunc(safeNumber(pickField(entry, ['delta'], 0)));
          const feature = safeString(pickField(entry, ['feature'], ''));
          const reason = safeString(pickField(entry, ['reason'], ''));
          return {
            id: safeString(pickField(entry, ['id'], '')),
            featureLabel: featureLabels[feature] ?? 'Quyền lợi',
            deltaLabel: (delta > 0 ? '+' : '') + delta,
            reasonLabel: reasons[reason] ?? 'Điều chỉnh quyền lợi',
            createdAtLabel: dateLabel(pickField(entry, ['createdAt'], null)),
          };
        }
      ),
    };
  }
}
function subscriptionModel(
  dto: EntitlementSubscriptionDto | null | undefined
): EntitlementSubscription | null {
  if (!dto || typeof dto !== 'object' || !safeDate(pickField(dto, ['endsAt'], null))) return null;
  const chatCredits = count(pickField(dto, ['chatCredits'], 0));
  const fridgeCredits = count(pickField(dto, ['fridgeCredits'], 0));
  const receiptCredits = count(pickField(dto, ['receiptCredits'], 0));
  const pantrySlots = count(pickField(dto, ['pantrySlots'], 0));
  const per = (field: keyof EntitlementSubscriptionDto) => count(pickField(dto, [field], 0));
  return {
    productId: safeString(pickField(dto, ['productId'], '')),
    endsAtLabel: dayLabel(pickField(dto, ['endsAt'], null)),
    periodEndsAtLabel: dateLabel(pickField(dto, ['periodEndsAt'], null)),
    periodDays: count(pickField(dto, ['periodDays'], 30)) || 30,
    chatCredits,
    fridgeCredits,
    receiptCredits,
    pantrySlots,
    periodRows: [
      { label: 'Chat AI', value: chatCredits + ' / ' + per('chatPerPeriod') },
      { label: 'Quét tủ lạnh', value: fridgeCredits + ' / ' + per('fridgePerPeriod') },
      { label: 'Phân tích hóa đơn', value: receiptCredits + ' / ' + per('receiptPerPeriod') },
      { label: 'Ô tủ đồ ăn thêm', value: '+' + pantrySlots },
    ],
  };
}
export const productMapper = new ProductMapper();
export const catalogMapper = new CatalogMapper();
export const orderMapper = new OrderMapper();
export const entitlementMapper = new EntitlementMapper();
