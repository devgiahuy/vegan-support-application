import { describe, it, expect } from 'vitest';
import { RecipeDifficulty } from '@/common/enums';
import { recipeMapper } from '../mappers/recipe.mapper';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';
import type { Recipe } from '../types/recipe.model';
import { recipeFormToRecipe, recipeToFormValues } from './recipe-form-values';

const formValues: RecipeFormValues = {
  title: 'Đậu hũ sốt cà',
  categoryId: 'cat-xao',
  coverImageUrl: '',
  coverMedia: null,
  difficulty: RecipeDifficulty.EASY,
  servings: 2,
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  description: 'Món chay thanh đạm',
  ingredients: [{ ingredientId: null, name: 'Đậu hũ', amount: 300, unit: 'g' }],
  steps: [
    { stepNumber: 3, instruction: 'Chiên vàng đậu hũ.' },
    { stepNumber: 7, instruction: 'Rưới sốt cà chua.' },
  ],
};

describe('recipeFormToRecipe', () => {
  it('renumbers steps by position and keeps description as the excerpt', () => {
    const recipe = recipeFormToRecipe(formValues);
    expect(recipe.steps?.map((s) => s.stepNumber)).toEqual([1, 2]);

    const dto = recipeMapper.toCreateDto(recipe);
    expect(dto.excerpt).toBe('Món chay thanh đạm');
    expect(dto.body).toBe('## Bước 1\nChiên vàng đậu hũ.\n\n## Bước 2\nRưới sốt cà chua.');
    expect(dto.categoryIds).toEqual(['cat-xao']);
  });
});

describe('recipeToFormValues', () => {
  it('splits body into steps instead of copying it into the description', () => {
    const recipe: Recipe = {
      ...recipeMapper.toModel(null),
      title: 'Đậu hũ sốt cà',
      category: { id: 'cat-xao', name: 'Món xào' },
      description: 'Món chay thanh đạm',
      body: '## Bước 1\nChiên vàng đậu hũ.\n\n## Bước 2\nRưới sốt cà chua.',
      steps: [],
      ingredients: [{ ingredientId: 'ing-1', name: 'Đậu hũ', amount: 300, unit: 'g', notes: '' }],
    };

    const values = recipeToFormValues(recipe);
    expect(values.description).toBe('Món chay thanh đạm');
    expect(values.categoryId).toBe('cat-xao');
    expect(values.steps).toEqual([
      { stepNumber: 1, instruction: 'Chiên vàng đậu hũ.', imageUrl: null },
      { stepNumber: 2, instruction: 'Rưới sốt cà chua.', imageUrl: null },
    ]);
    expect(values.ingredients).toEqual([
      { ingredientId: 'ing-1', name: 'Đậu hũ', amount: 300, unit: 'g' },
    ]);
  });
});
