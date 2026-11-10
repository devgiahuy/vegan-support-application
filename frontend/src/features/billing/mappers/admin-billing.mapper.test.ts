import { describe, expect, it } from 'vitest';
import { adminBillingMapper } from '@/features/billing/mappers/admin-billing.mapper';

describe('admin billing mapper', () => {
  it('maps inactive status and excludes immutable duration from updates', () => {
    const product = adminBillingMapper.toModel({
      id: 'x',
      active: false,
      priceVnd: 2000,
      version: 2,
    });
    expect(product).toMatchObject({ id: 'x', active: false, priceVnd: 2000, version: 2 });
    const dto = adminBillingMapper.toUpdateDto(
      {
        name: 'X',
        description: '',
        priceVnd: 2000,
        chatCredits: 1,
        fridgeCredits: 0,
        receiptCredits: 0,
        pantrySlots: 0,
        durationMonths: 1,
        reason: 'Điều chỉnh',
      },
      2
    );
    expect(dto).not.toHaveProperty('durationMonths');
    expect(dto.expectedVersion).toBe(2);
    expect(
      adminBillingMapper.toUpdateDto(
        {
          name: 'X',
          description: '',
          priceVnd: 2000,
          chatCredits: 1,
          fridgeCredits: 0,
          receiptCredits: 0,
          pantrySlots: 0,
          durationMonths: 1,
          reason: '  ',
        },
        2
      )
    ).not.toHaveProperty('reason');
    expect(adminBillingMapper.toAvailabilityDto(false, 2, '  Cập nhật  ')).toEqual({
      active: false,
      expectedVersion: 2,
      reason: 'Cập nhật',
    });
  });
});
