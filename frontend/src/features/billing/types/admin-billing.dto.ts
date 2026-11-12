import type { BillingProductDto } from '@/features/billing/types/billing.dto';

export interface AdminBillingProductDto extends BillingProductDto {
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface AdminBillingFieldsDto {
  name: string;
  description: string;
  priceVnd: number;
  chatCredits: number;
  fridgeCredits: number;
  receiptCredits: number;
  pantrySlots: number;
}
export interface AdminBillingCreateDto extends AdminBillingFieldsDto {
  durationMonths: 1 | 3 | 12 | null;
  reason: string;
}
export interface AdminBillingUpdateDto extends AdminBillingFieldsDto {
  expectedVersion: number;
  reason?: string;
}
export interface AdminBillingAvailabilityDto {
  active: boolean;
  expectedVersion: number;
  reason: string;
}
