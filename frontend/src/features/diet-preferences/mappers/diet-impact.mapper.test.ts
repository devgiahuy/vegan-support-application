import { describe, expect, it } from 'vitest';
import { dietImpactMapper } from './diet-impact.mapper';

describe('DietImpactMapper', () => {
  it('maps affected meal locations, known reasons and confirmed program versions', () => {
    const result = dietImpactMapper.impact({
      dietaryRevision: 4,
      assessedFrom: '2026-11-18',
      affectedPlanCount: 1,
      affectedMealCount: 1,
      plans: [
        {
          planId: 'plan',
          weekStart: '2026-11-16',
          expectedVersion: 3,
          status: 'NEEDS_REVIEW',
          canRepair: false,
          programs: [{ id: 'program', title: 'Lộ trình', status: 'CONFIRMED', expectedVersion: 5 }],
          items: [
            {
              itemId: 'meal',
              date: '2026-11-18',
              mealType: 'BREAKFAST',
              name: 'Bánh trứng',
              reasons: ['FOOD_GROUP_EXCLUSION', 'ALLERGY'],
              unverified: false,
            },
          ],
        },
      ],
    });
    expect(result.plans[0].programs[0].expectedVersion).toBe(5);
    expect(result.plans[0].items[0].dateLabel).toBe('18/11/2026');
    expect(result.plans[0].items[0].mealTypeLabel).toBe('Bữa sáng');
    expect(result.plans[0].items[0].reasonLabels).toEqual([
      'Có nhóm thực phẩm bạn chọn kiêng',
      'Có thành phần gây dị ứng đã khai báo',
    ]);
  });
  it('does not turn unknown compatibility into a positive clearance', () => {
    expect(dietImpactMapper.compatibility(null).status).toBe('UNKNOWN');
    expect(dietImpactMapper.compatibility({ status: 'NEW_STATUS' }).status).toBe('UNKNOWN');
  });
  it('keeps unverified classification separate from known incompatibility', () => {
    const result = dietImpactMapper.compatibility({
      status: 'NEEDS_REVIEW',
      items: [{ itemId: 'one', reasons: ['INGREDIENT_DIETARY_UNCERTAIN'], unverified: true }],
    });
    expect(result.items[0].unverified).toBe(true);
    expect(result.items[0].reasonLabels[0]).toContain('Chưa xác minh');
  });
  it('preserves explicit null and missing nutrition instead of displaying zero', () => {
    const result = dietImpactMapper.proposal({
      data: {
        proposalId: 'proposal',
        plans: [
          {
            status: 'READY',
            replacements: [{ itemId: 'meal', calories: null }],
            beforeNutrition: { calories: null },
            afterNutrition: { calories: 0 },
          },
        ],
      },
    });
    expect(result.plans[0].beforeNutrition.calories).toBeNull();
    expect(result.plans[0].beforeNutrition.proteinGrams).toBeNull();
    expect(result.plans[0].afterNutrition.calories).toBe(0);
    expect(result.plans[0].replacements[0].calories).toBeNull();
  });
  it('retains no-candidate, revision-required and unchanged statuses', () => {
    const result = dietImpactMapper.proposal({
      data: {
        plans: [
          { status: 'NO_CANDIDATES' },
          { status: 'PROGRAM_REVISION_REQUIRED' },
          { status: 'UNCHANGED' },
          { status: 'BAD' },
        ],
      },
    });
    expect(result.plans.map((plan) => plan.status)).toEqual([
      'NO_CANDIDATES',
      'PROGRAM_REVISION_REQUIRED',
      'UNCHANGED',
      'UNKNOWN',
    ]);
  });
});
