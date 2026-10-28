export interface BillingBenefitsDto {
  chatCredits?: number | string;
  fridgeCredits?: number | string;
  receiptCredits?: number | string;
  pantrySlots?: number | string;
}
export interface BillingProductDto extends BillingBenefitsDto {
  id?: string;
  name?: string;
  description?: string;
  version?: number | string;
  priceVnd?: number | string;
  /** null/thiếu = gói lẻ cộng dồn vĩnh viễn; số chu kỳ cho combo theo thời hạn. */
  durationMonths?: number | string | null;
  periodDays?: number | string | null;
}
export interface BillingCatalogDto {
  enabled?: boolean;
  provider?: string;
  simulated?: boolean;
  products?: BillingProductDto[];
}
export interface BillingOrderDto extends BillingBenefitsDto {
  id?: string;
  productId?: string;
  productName?: string;
  durationMonths?: number | string | null;
  priceVnd?: number | string;
  provider?: string;
  simulated?: boolean;
  status?: string;
  checkoutUrl?: string | null;
  createdAt?: string;
  expiresAt?: string;
  paidAt?: string | null;
}
export interface BillingOrdersDto {
  items?: BillingOrderDto[];
  page?: number | string;
  totalPages?: number | string;
  total?: number | string;
}
export interface EntitlementLedgerDto {
  id?: string;
  feature?: string;
  delta?: number | string;
  reason?: string;
  createdAt?: string;
}
export interface EntitlementSubscriptionDto {
  productId?: string;
  startsAt?: string;
  endsAt?: string;
  periodEndsAt?: string;
  periodDays?: number | string;
  chatCredits?: number | string;
  fridgeCredits?: number | string;
  receiptCredits?: number | string;
  pantrySlots?: number | string;
  chatPerPeriod?: number | string;
  fridgePerPeriod?: number | string;
  receiptPerPeriod?: number | string;
}
export interface EntitlementDto extends BillingBenefitsDto {
  /** null khi không có combo theo thời hạn đang hoạt động. */
  subscription?: EntitlementSubscriptionDto | null;
  enabled?: boolean;
  provider?: string;
  simulated?: boolean;
  chatReserved?: number | string;
  fridgeReserved?: number | string;
  receiptReserved?: number | string;
  pantryUsed?: number | string;
  pantryLimit?: number | string | null;
  fridgeMaxImages?: number | string;
  receiptMaxImages?: number | string;
  scanMaxAttempts?: number | string;
  ledger?: EntitlementLedgerDto[];
}
export interface CreateBillingOrderRequestDto {
  productId: string;
  idempotencyKey: string;
}
export interface BillingOrdersRequestDto {
  page: number;
}
export interface BillingCatalogResponseDto {
  success: boolean;
  data: BillingCatalogDto;
}
export interface BillingOrderResponseDto {
  success: boolean;
  data: BillingOrderDto;
}
export interface BillingOrdersResponseDto {
  success: boolean;
  data: BillingOrdersDto;
}
export interface EntitlementResponseDto {
  success: boolean;
  data: EntitlementDto;
}
