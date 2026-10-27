export type BillingProvider = 'payos' | 'sandbox' | 'vnpay' | 'UNKNOWN';
export type BillingStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'EXPIRED' | 'UNKNOWN';
export interface BillingBenefits {
  chatCredits: number;
  fridgeCredits: number;
  receiptCredits: number;
  pantrySlots: number;
  benefitLabels: string[];
}
export interface BillingProduct extends BillingBenefits {
  id: string;
  name: string;
  description: string;
  version: number;
  priceVnd: number;
  priceLabel: string;
  canBuy: boolean;
  /** null = gói lẻ cộng dồn vĩnh viễn; số chu kỳ cho gói tiện ích theo thời hạn. */
  durationMonths: number | null;
  durationLabel: string;
  periodDays: number | null;
  monthlyPriceLabel: string;
  /** Quyền lợi theo chu kỳ cho gói theo thời hạn; rỗng với gói lẻ. */
  periodBenefitLabels: string[];
  /** Phần trăm tiết kiệm so với gói 1 tháng cùng loại; 0 khi không giảm. */
  savingsPercent: number;
}
export interface BillingCatalog {
  enabled: boolean;
  provider: BillingProvider;
  providerLabel: string;
  simulated: boolean;
  products: BillingProduct[];
  oneTimeProducts: BillingProduct[];
  /** Các lựa chọn thời hạn của gói tiện ích, tăng dần theo số tháng. */
  durationPlans: BillingProduct[];
}
export interface BillingOrder extends BillingBenefits {
  id: string;
  productId: string;
  productName: string;
  durationLabel: string;
  provider: BillingProvider;
  priceLabel: string;
  providerLabel: string;
  simulated: boolean;
  status: BillingStatus;
  statusLabel: string;
  checkoutUrl: string | null;
  createdAtLabel: string;
  expiresAtLabel: string;
  paidAtLabel: string;
  pending: boolean;
}
export interface BillingOrders {
  items: BillingOrder[];
  page: number;
  totalPages: number;
  total: number;
}
export interface EntitlementLedger {
  id: string;
  featureLabel: string;
  deltaLabel: string;
  reasonLabel: string;
  createdAtLabel: string;
}
export interface Entitlements extends BillingBenefits {
  enabled: boolean;
  simulated: boolean;
  providerLabel: string;
  usageRows: { label: string; value: string; note: string }[];
  pantryUsed: number;
  pantryLimit: number | null;
  pantryFull: boolean;
  pantryLabel: string;
  scanPolicyLabel: string;
  /** Tổng lượt dùng được = lượt chu kỳ gói tiện ích + lượt cộng dồn. */
  chatAvailable: number;
  fridgeAvailable: number;
  receiptAvailable: number;
  subscription: EntitlementSubscription | null;
  ledger: EntitlementLedger[];
}
export interface EntitlementSubscription {
  productId: string;
  endsAtLabel: string;
  periodEndsAtLabel: string;
  periodDays: number;
  chatCredits: number;
  fridgeCredits: number;
  receiptCredits: number;
  pantrySlots: number;
  periodRows: { label: string; value: string }[];
}
