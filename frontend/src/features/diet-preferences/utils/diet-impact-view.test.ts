import { describe, expect, it } from 'vitest';
import { compatibilityCounts, impactMealViews, repairOutcome } from './diet-impact-view';
import type { DietaryImpact, DietaryImpactItem } from '../types/diet-impact.model';

const item: DietaryImpactItem = {
  itemId: 'meal',
  date: '2026-11-18',
  dateLabel: '18/11/2026',
  mealType: 'BREAKFAST',
  mealTypeLabel: 'Bữa sáng',
  name: 'Bánh trứng',
  reasons: ['FOOD_GROUP_EXCLUSION'],
  reasonLabels: ['Có nhóm thực phẩm bạn kiêng'],
  unverified: false,
};

describe('dietary impact presentation', () => {
  it('does not duplicate one underlying meal when repeated in impact references', () => {
    const plan: DietaryImpact['plans'][number] = {
      planId: 'plan',
      weekStart: '2026-11-16',
      weekLabel: '16/11/2026',
      expectedVersion: 1,
      status: 'NEEDS_REVIEW',
      canRepair: true,
      programs: [],
      items: [item, item],
    };
    expect(
      impactMealViews({
        dietaryRevision: 2,
        assessedFrom: '2026-11-18',
        affectedPlanCount: 1,
        affectedMealCount: 1,
        plans: [plan, plan],
      })
    ).toHaveLength(1);
  });

  it('separates uncertain meals from known incompatible meals', () => {
    expect(
      compatibilityCounts({
        status: 'NEEDS_REVIEW',
        dietaryRevision: 2,
        assessedFrom: '2026-11-18',
        affectedMealCount: 2,
        items: [item, { ...item, itemId: 'unknown', unverified: true }],
      })
    ).toEqual({
      affectedCount: 1,
      unverifiedCount: 1,
    });
    expect(
      compatibilityCounts({
        status: 'HISTORICAL',
        dietaryRevision: 2,
        assessedFrom: '2026-11-18',
        affectedMealCount: 1,
        items: [item],
      })
    ).toEqual({
      affectedCount: 0,
      unverifiedCount: 0,
    });
  });

  it('never reports overall success for mixed repair outcomes', () => {
    const outcome = repairOutcome({
      dietaryRevision: 2,
      results: [
        { planId: 'one', status: 'UPDATED', message: '', remainingAffectedMeals: 0 },
        { planId: 'two', status: 'FAILED', message: 'Không có món', remainingAffectedMeals: 3 },
      ],
    });
    expect(outcome.success).toBe(false);
    expect(outcome.message).toContain('3 bữa');
    expect(outcome.message).toContain('1 thực đơn chưa điều chỉnh được');
  });

  it('keeps revision-required results unresolved even if the response omits a positive remaining count', () => {
    expect(
      repairOutcome({
        dietaryRevision: 2,
        results: [
          {
            planId: 'plan',
            status: 'PROGRAM_REVISION_REQUIRED',
            message: '',
            remainingAffectedMeals: 0,
          },
        ],
      }).success
    ).toBe(false);
  });
});
