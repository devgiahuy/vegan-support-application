import { describe, it, expect } from 'vitest';
import type { FieldErrors } from 'react-hook-form';
import { RecipeDifficulty } from '@/common/enums';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';
import {
  collectFieldIssues,
  fieldDomId,
  issueLocation,
  issuesFromValues,
} from './recipe-editor-steps';

const emptyValues: RecipeFormValues = {
  title: '',
  categoryId: '',
  coverImageUrl: '',
  difficulty: RecipeDifficulty.MEDIUM,
  servings: Number.NaN,
  prepTimeMinutes: 10,
  cookTimeMinutes: 10,
  description: '',
  ingredients: [{ name: 'Đậu hũ', ingredientId: null, amount: Number.NaN, unit: '' }],
  steps: [{ stepNumber: 1, instruction: '' }],
};

describe('issuesFromValues', () => {
  it('requires all six nutrition values only for Contributor/Admin', () => {
    const filled: RecipeFormValues = {
      ...emptyValues,
      title: 'Canh nấm đậu hũ',
      categoryId: 'cat-1',
      servings: 2,
      ingredients: [{ name: 'Đậu hũ', ingredientId: null, amount: 200, unit: 'g' }],
      steps: [{ stepNumber: 1, instruction: 'Nấu sôi rồi cho đậu vào' }],
      nutrition: { calories: 250, proteinGrams: 12 },
    };
    expect(issuesFromValues(filled)).toEqual([]);
    const required = issuesFromValues(filled, { requireNutrition: true });
    expect(required.map((i) => i.path)).toEqual([
      'nutrition.carbsGrams',
      'nutrition.fatGrams',
      'nutrition.fiberGrams',
      'nutrition.vitaminB12Mcg',
    ]);
    expect(required.every((i) => i.step === 'classify')).toBe(true);
  });

  it('orders issues by step and row as shown in the form', () => {
    const issues = issuesFromValues(emptyValues);
    expect(issues.map((i) => i.path)).toEqual([
      'title',
      'servings',
      'ingredients.0.amount',
      'ingredients.0.unit',
      'steps.0.instruction',
      'categoryId',
    ]);
    expect(issues.map((i) => i.step)).toEqual([
      'basics',
      'basics',
      'ingredients',
      'ingredients',
      'steps',
      'classify',
    ]);
  });
});

describe('collectFieldIssues', () => {
  it('flattens nested and array-root react-hook-form errors', () => {
    const errors = {
      categoryId: { type: 'too_small', message: 'Chọn danh mục món ăn' },
      steps: { root: { type: 'too_small', message: 'Cần ít nhất 1 bước nấu' } },
      ingredients: [undefined, { name: { type: 'too_small', message: 'Nhập tên nguyên liệu' } }],
    } as unknown as FieldErrors<RecipeFormValues>;

    expect(collectFieldIssues(errors)).toEqual([
      { path: 'ingredients.1.name', step: 'ingredients', message: 'Nhập tên nguyên liệu' },
      { path: 'steps', step: 'steps', message: 'Cần ít nhất 1 bước nấu' },
      { path: 'categoryId', step: 'classify', message: 'Chọn danh mục món ăn' },
    ]);
  });
});

describe('helpers', () => {
  it('builds DOM ids and human-readable locations', () => {
    expect(fieldDomId('ingredients.0.name')).toBe('recipe-ingredients-0-name');
    expect(issueLocation('ingredients.1.unit')).toBe('Nguyên liệu 2');
    expect(issueLocation('steps.0.instruction')).toBe('Bước nấu 1');
    expect(issueLocation('title')).toBeNull();
  });
});
