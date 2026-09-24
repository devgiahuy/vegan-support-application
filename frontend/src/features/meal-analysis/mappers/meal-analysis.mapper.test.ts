import { describe, expect, it } from 'vitest';
import {
  MealAnalysisMapper,
  mealAnalysisMapper,
  EVIDENCE_GRADE_LABELS,
} from './meal-analysis.mapper';
import type { MealPlanAnalysisResponseDto, MealWarningDto } from '../types/meal-analysis.dto';

describe('MealAnalysisMapper', () => {
  const mapper = new MealAnalysisMapper();

  it('1. maps full response DTO correctly with camelCase fields', () => {
    const dto: MealPlanAnalysisResponseDto = {
      id: 'analysis-123',
      mealPlanId: 'plan-456',
      planLockVersion: 2,
      analysisVersion: 1,
      analyzedAt: '2026-09-23T08:30:00.000Z',
      overallConfidence: 0.95,
      hasIncompleteData: false,
      incompleteDataNotes: null,
      summary: {
        totalWarnings: 1,
        dangerCount: 1,
        warningCount: 0,
        dailyLimitViolations: 1,
        compatibilityViolations: 0,
        sameDishCount: 0,
        sameMealCount: 0,
        sameDayCount: 1,
      },
      warnings: [
        {
          id: 'warn-1',
          code: 'EXCESS_SODIUM_DAILY',
          title: 'Dư thừa Natri trong ngày',
          severity: 'DANGER',
          scope: 'SAME_DAY',
          targetDate: '2026-09-24',
          mealType: null,
          evidenceGrade: 'GRADE_A',
          evidenceSource: 'WHO Guidelines 2023',
          ruleVersion: '1.2',
          confidence: 0.95,
          measuredValue: 2850,
          limitValue: 2300,
          unit: 'mg',
          excessPercent: 24,
          explanation: 'Vượt ngưỡng an toàn',
          suggestedAdjustment: 'Nên giảm bớt muối',
          affectedItems: [
            {
              planItemId: 'slot-1',
              dishId: 'recipe-1',
              dishType: 'RECIPE',
              dishName: 'Đậu hũ sốt cay',
              ingredientId: 'ing-1',
              ingredientName: 'Nước tương',
              amount: 20,
              unit: 'ml',
            },
          ],
          suggestedSwaps: [
            {
              suggestedDishId: 'recipe-2',
              dishType: 'RECIPE',
              dishName: 'Canh bí đỏ',
              coverImageUrl: 'https://img.example/canh.jpg',
              calories: 200,
              matchReason: 'Ít muối hơn',
              resolvesWarningCodes: ['EXCESS_SODIUM_DAILY'],
            },
          ],
        },
      ],
    };

    const model = mapper.toModel(dto, 2);

    expect(model.id).toBe('analysis-123');
    expect(model.mealPlanId).toBe('plan-456');
    expect(model.planLockVersion).toBe(2);
    expect(model.isStale).toBe(false);
    expect(model.overallConfidence).toBe(0.95);
    expect(model.hasIncompleteData).toBe(false);
    expect(model.warnings).toHaveLength(1);

    const w = model.warnings[0];
    expect(w.code).toBe('EXCESS_SODIUM_DAILY');
    expect(w.severity).toBe('DANGER');
    expect(w.scope).toBe('SAME_DAY');
    expect(w.evidenceGrade).toBe('GRADE_A');
    expect(w.evidenceGradeLabel).toBe(EVIDENCE_GRADE_LABELS.GRADE_A);
    expect(w.measuredValue).toBe(2850);
    expect(w.limitValue).toBe(2300);
    expect(w.affectedItems[0].dishName).toBe('Đậu hũ sốt cay');
    expect(w.suggestedSwaps[0].dishName).toBe('Canh bí đỏ');
    expect(w.suggestedSwaps[0].resolvesWarningCodes).toEqual(['EXCESS_SODIUM_DAILY']);
  });

  it('2. maps snake_case field aliases safely', () => {
    const dto: MealPlanAnalysisResponseDto = {
      meal_plan_id: 'plan-snake',
      plan_lock_version: 5,
      analysis_version: 2,
      analyzed_at: '2026-09-23T10:00:00.000Z',
      overall_confidence: 0.85,
      has_incomplete_data: true,
      incomplete_data_notes: 'Có nguyên liệu tự do',
      warnings: [
        {
          code: 'IRON_CALCIUM_INHIBITION',
          target_date: '2026-09-25',
          meal_type: 'LUNCH',
          evidence_grade: 'GRADE_B',
          evidence_source: 'AJCN',
          rule_version: '2.0',
          measured_value: null,
          limit_value: null,
          excess_percent: null,
          suggested_adjustment: 'Uống sữa hạt cách 2 giờ',
          affected_items: [
            {
              plan_item_id: 'slot-2',
              dish_id: 'custom-1',
              dish_type: 'CUSTOM_MEAL',
              dish_name: 'Sữa mè đen',
            },
          ],
          suggested_swaps: [
            {
              suggested_dish_id: 'recipe-swap',
              dish_type: 'RECIPE',
              dish_name: 'Trà thảo mộc',
              match_reason: 'Không cản trở hấp thu sắt',
              resolves_warning_codes: ['IRON_CALCIUM_INHIBITION'],
            },
          ],
        },
      ],
    };

    const model = mapper.toModel(dto);

    expect(model.mealPlanId).toBe('plan-snake');
    expect(model.planLockVersion).toBe(5);
    expect(model.hasIncompleteData).toBe(true);
    expect(model.incompleteDataNotes).toBe('Có nguyên liệu tự do');
    expect(model.warnings[0].evidenceGrade).toBe('GRADE_B');
    expect(model.warnings[0].evidenceGradeLabel).toBe(EVIDENCE_GRADE_LABELS.GRADE_B);
    expect(model.warnings[0].affectedItems[0].dishType).toBe('CUSTOM_MEAL');
    expect(model.warnings[0].suggestedSwaps[0].dishType).toBe('RECIPE');
  });

  it('3. detects stale state when currentPlanLockVersion does not match planLockVersion', () => {
    const dto: MealPlanAnalysisResponseDto = {
      planLockVersion: 2,
    };

    // Khi thực đơn đã lên bản 3, phân tích bản 2 sẽ stale
    const model = mapper.toModel(dto, 3);
    expect(model.isStale).toBe(true);
  });

  it('4. detects non-stale state when currentPlanLockVersion matches planLockVersion', () => {
    const dto: MealPlanAnalysisResponseDto = {
      planLockVersion: 4,
    };

    const model = mapper.toModel(dto, 4);
    expect(model.isStale).toBe(false);
  });

  it('5. handles completely empty DTO safely with defaults', () => {
    const dto: MealPlanAnalysisResponseDto = {};

    const model = mapper.toModel(dto);

    expect(model.id).toBe('');
    expect(model.mealPlanId).toBe('');
    expect(model.planLockVersion).toBe(1);
    expect(model.analysisVersion).toBe(1);
    expect(model.overallConfidence).toBe(0.9);
    expect(model.hasIncompleteData).toBe(false);
    expect(model.incompleteDataNotes).toBeNull();
    expect(model.warnings).toHaveLength(0);
    expect(model.summary.totalWarnings).toBe(0);
    expect(model.summary.dangerCount).toBe(0);
    expect(model.summary.warningCount).toBe(0);
  });

  it('6. correctly computes fallback summary when BE summary is omitted', () => {
    const dto: MealPlanAnalysisResponseDto = {
      warnings: [
        {
          id: 'w1',
          severity: 'DANGER',
          scope: 'SAME_DAY',
          limitValue: 2300,
        },
        {
          id: 'w2',
          severity: 'WARNING',
          scope: 'SAME_MEAL',
        },
        {
          id: 'w3',
          severity: 'WARNING',
          scope: 'SAME_DISH',
        },
      ],
    };

    const model = mapper.toModel(dto);

    expect(model.summary.totalWarnings).toBe(3);
    expect(model.summary.dangerCount).toBe(1);
    expect(model.summary.warningCount).toBe(2);
    expect(model.summary.dailyLimitViolations).toBe(1);
    expect(model.summary.sameDayCount).toBe(1);
    expect(model.summary.sameMealCount).toBe(1);
    expect(model.summary.sameDishCount).toBe(1);
    expect(model.summary.compatibilityViolations).toBe(2); // SAME_DISH + SAME_MEAL
  });

  it('7. maps all 4 EvidenceGrade values properly', () => {
    const grades = ['GRADE_A', 'GRADE_B', 'GRADE_C', 'GRADE_D'] as const;

    for (const grade of grades) {
      const warningDto: MealWarningDto = { evidenceGrade: grade };
      const warning = mapper.mapWarning(warningDto);
      expect(warning.evidenceGrade).toBe(grade);
      expect(warning.evidenceGradeLabel).toBe(EVIDENCE_GRADE_LABELS[grade]);
    }
  });

  it('8. falls back to GRADE_B when invalid evidence grade is provided', () => {
    const warningDto: MealWarningDto = { evidenceGrade: 'UNKNOWN_GRADE' };
    const warning = mapper.mapWarning(warningDto);
    expect(warning.evidenceGrade).toBe('GRADE_B');
    expect(warning.evidenceGradeLabel).toBe(EVIDENCE_GRADE_LABELS.GRADE_B);
  });

  it('9. correctly normalizes severity (DANGER vs WARNING)', () => {
    expect(mapper.mapWarning({ severity: 'danger' }).severity).toBe('DANGER');
    expect(mapper.mapWarning({ severity: 'DANGER' }).severity).toBe('DANGER');
    expect(mapper.mapWarning({ severity: 'warning' }).severity).toBe('WARNING');
    expect(mapper.mapWarning({ severity: 'INVALID' }).severity).toBe('WARNING');
    expect(mapper.mapWarning({}).severity).toBe('WARNING');
  });

  it('10. correctly normalizes scopes (SAME_DISH, SAME_MEAL, SAME_DAY)', () => {
    expect(mapper.mapWarning({ scope: 'SAME_DISH' }).scope).toBe('SAME_DISH');
    expect(mapper.mapWarning({ scope: 'same_dish' }).scope).toBe('SAME_DISH');
    expect(mapper.mapWarning({ scope: 'SAME_DAY' }).scope).toBe('SAME_DAY');
    expect(mapper.mapWarning({ scope: 'SAME_MEAL' }).scope).toBe('SAME_MEAL');
    expect(mapper.mapWarning({}).scope).toBe('SAME_MEAL');
  });

  it('11. maps affected plan items with null safety and default fallbacks', () => {
    const item = mapper.mapAffectedItem({});
    expect(item.planItemId).toBe('');
    expect(item.dishId).toBe('');
    expect(item.dishType).toBe('RECIPE');
    expect(item.dishName).toBe('Món ăn không tên');
    expect(item.ingredientId).toBeNull();
    expect(item.ingredientName).toBeNull();
    expect(item.amount).toBeNull();
    expect(item.unit).toBeNull();
  });

  it('12. exported singleton instance mealAnalysisMapper behaves identically', () => {
    const res = mealAnalysisMapper.toModel({ id: 'singleton-test' });
    expect(res.id).toBe('singleton-test');
  });
});
