import assert from 'node:assert/strict';
import { FoodRuleSeverity, InteractionScope, MealType } from '@prisma/client';
import { mealAnalysisWarningSchema } from './meal-analysis.schemas.js';
import {
  incompleteIngredientMessage,
  incompleteNutritionMessage,
  macroWarningCopy,
  mealLocation,
  scopeLabel,
  severityLabel,
} from './meal-warning-copy.js';

const highFat = macroWarningCopy('FAT', 'ABOVE', '2026-09-30');
assert.equal(highFat.title, 'Chất béo ước tính đang cao hơn mục tiêu');
assert.match(highFat.detail, /Cả ngày Thứ Tư \(30\/09\)/);
assert.match(highFat.detail, /ước tính/);
assert.match(highFat.suggestion, /ít dầu hơn/);

const lowFiber = macroWarningCopy('FIBER', 'BELOW', '2026-10-01');
assert.equal(lowFiber.title, 'Chất xơ ước tính còn thấp');
assert.match(lowFiber.suggestion, /rau xanh/);
assert.match(lowFiber.suggestion, /các loại đậu/);

assert.equal(severityLabel(FoodRuleSeverity.INFO), 'Thông tin');
assert.equal(severityLabel(FoodRuleSeverity.CAUTION), 'Nên lưu ý');
assert.equal(severityLabel(FoodRuleSeverity.HIGH), 'Nên lưu ý');
assert.equal(scopeLabel(InteractionScope.SAME_MEAL), 'Trong cùng bữa');
assert.match(
  mealLocation(
    [{ date: '2026-10-02', mealType: MealType.DINNER, name: 'Đậu hũ sốt nấm' }],
    InteractionScope.SAME_DISH,
  ),
  /Món Đậu hũ sốt nấm trong bữa tối Thứ Sáu \(02\/10\)/,
);

const incompleteMessages = [
  incompleteNutritionMessage('Bún rau củ'),
  incompleteIngredientMessage('Bún rau củ', 'rau theo mùa'),
];
for (const message of incompleteMessages) {
  assert.match(message, /có thể|ước tính|tham khảo/);
  assert.doesNotMatch(
    message,
    /cooking-aware|canonical|provenance|nutrient coverage|incomplete micronutrient data|Recipe item|Custom meal item/i,
  );
}

const warning = mealAnalysisWarningSchema.parse({
  code: 'MACRO_TARGET_EXCEEDED',
  severity: 'CAUTION',
  scope: 'SAME_DAY',
  evidenceGrade: 'INSUFFICIENT',
  source: {
    code: 'MEAL_PLAN_ESTIMATED_MACRO_TARGET',
    name: 'Internal estimate configuration',
    version: 'meal-analysis-v3-user-facing-warnings',
    recordId: '2026-09-30:FAT',
    url: null,
  },
  applicability: { date: '2026-09-30', macro: 'FAT', direction: 'ABOVE' },
  affectedItems: [
    {
      itemId: '10000000-0000-4000-8000-000000000001',
      date: '2026-09-30',
      mealType: 'DINNER',
      sourceType: 'RECIPE',
      name: 'Đậu hũ sốt nấm',
      servings: 1,
    },
  ],
  affectedIngredients: [],
  measured: { value: 80, unit: 'g' },
  limit: { value: 76.67, unit: 'g' },
  explanation: highFat.detail,
  suggestedAdjustment: highFat.suggestion,
  confidence: 0.8,
  advisory: true,
  incompleteDataNotes: [],
  title: highFat.title,
  detail: highFat.detail,
  suggestion: highFat.suggestion,
  severityLabel: 'Nên lưu ý',
  scopeLabel: 'Trong cùng ngày',
  targetDate: '2026-09-30',
  mealType: null,
  targetComparison: 'ABOVE',
});
assert.equal(warning.advisory, true);
assert.equal(warning.title, highFat.title);

process.stdout.write('Meal-analysis user-facing warning acceptance checks passed.\n');
