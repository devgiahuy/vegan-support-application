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
export interface EntitlementDto extends BillingBenefitsDto {
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
