import type { BillingProduct } from '@/features/billing/types/billing.model';

export interface AdminBillingProduct extends BillingProduct {
  active: boolean;
}
export interface AdminBillingForm {
  name: string;
  description: string;
  priceVnd: number;
  chatCredits: number;
  fridgeCredits: number;
  receiptCredits: number;
  pantrySlots: number;
  durationMonths: 1 | 3 | 12 | null;
  reason: string;
}
