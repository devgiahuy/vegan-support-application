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
}
export interface BillingCatalog {
  enabled: boolean;
  provider: BillingProvider;
  providerLabel: string;
  simulated: boolean;
  products: BillingProduct[];
}
export interface BillingOrder extends BillingBenefits {
  id: string;
  productId: string;
  productName: string;
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
  ledger: EntitlementLedger[];
}
