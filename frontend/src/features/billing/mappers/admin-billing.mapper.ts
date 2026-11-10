import { productMapper } from '@/features/billing/mappers/billing.mapper';
import type {
  AdminBillingCreateDto,
  AdminBillingProductDto,
  AdminBillingUpdateDto,
} from '@/features/billing/types/admin-billing.dto';
import type {
  AdminBillingForm,
  AdminBillingProduct,
} from '@/features/billing/types/admin-billing.model';

export const adminBillingMapper = {
  toModel(dto: AdminBillingProductDto): AdminBillingProduct {
    return { ...productMapper.toModel(dto), active: dto.active === true };
  },
  toCreateDto(form: AdminBillingForm): AdminBillingCreateDto {
    return { ...form };
  },
  toUpdateDto(form: AdminBillingForm, expectedVersion: number): AdminBillingUpdateDto {
    return {
      name: form.name,
      description: form.description,
      priceVnd: form.priceVnd,
      chatCredits: form.chatCredits,
      fridgeCredits: form.fridgeCredits,
      receiptCredits: form.receiptCredits,
      pantrySlots: form.pantrySlots,
      ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
      expectedVersion,
    };
  },
  toAvailabilityDto(active: boolean, expectedVersion: number, reason: string) {
    return { active, expectedVersion, reason: reason.trim() };
  },
};
