import { describe, expect, it } from 'vitest';
import { groupConstraintDetails } from './constraint-details';
import { mealPlanMapper } from '@/features/meal-plan/mappers/meal-plan.mapper';

describe('constraint details', () => {
  it('maps and groups identical dishes while preserving each meal location', () => {
    const plan = mealPlanMapper.toModel({
      userSummary: {
        status: 'HARD_CONSTRAINT_BLOCKED',
        hardConstraintsPreserved: false,
        hardViolations: [
          {
            itemId: '1',
            name: 'Yến mạch',
            date: '2026-11-17',
            mealType: 'BREAKFAST',
            reasons: [{ code: 'ALLERGY', detail: 'có đậu phộng khớp dị ứng đã khai báo' }],
          },
          {
            itemId: '2',
            name: 'Yến mạch',
            date: '2026-11-22',
            mealType: 'BREAKFAST',
            reasons: [{ code: 'ALLERGY', detail: 'có đậu phộng khớp dị ứng đã khai báo' }],
          },
          {
            itemId: '3',
            name: 'Cháo nấm',
            date: '2026-11-19',
            mealType: 'DINNER',
            reasons: [{ code: 'ALLERGY', detail: 'có nấm hương khớp dị ứng đã khai báo' }],
          },
        ],
      },
    });
    const groups = groupConstraintDetails(plan.userSummary!.hardViolations);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      name: 'Yến mạch',
      details: ['có đậu phộng khớp dị ứng đã khai báo'],
      locations: ['Sáng 17/11', 'Sáng 22/11'],
    });
    expect(groups[1]?.locations).toEqual(['Tối 19/11']);
  });

  it('handles older responses without structured details', () => {
    expect(
      mealPlanMapper.toModel({ userSummary: { detail: 'Cảnh báo cũ' } }).userSummary?.hardViolations
    ).toEqual([]);
  });
});
