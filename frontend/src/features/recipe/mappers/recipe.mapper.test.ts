import { describe, it, expect } from 'vitest';
import { recipeMapper, stepsToBody } from './recipe.mapper';
import { PostStatus, RecipeDifficulty } from '@/common/enums';
import type { RecipeDetailDto } from '../types/recipe.dto';

function backendRecipeDto(): RecipeDetailDto {
  return {
    id: 'rec-101',
    type: 'RECIPE',
    slug: 'dau-hu-sot-ca',
    status: 'PUBLISHED',
    version: 3,
    publishedAt: '2026-09-10T08:30:00Z',
    author: { id: 'usr-1', displayName: 'Đầu bếp An', avatarUrl: null },
    revision: {
      id: 'rev-101',
      version: 3,
      status: 'PUBLISHED',
      title: 'Đậu hũ sốt cà',
      excerpt: 'Món chay thanh đạm',
      body: '## Bước 1\nCắt đậu và chiên vàng.',
      tags: ['dau-hu'],
      createdAt: '2026-09-10T08:00:00Z',
    },
    categories: [{ id: 'cat-xao', name: 'Món xào', slug: 'mon-xao', type: 'RECIPE_GROUP' }],
    media: [
      {
        id: 'med-101',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl: 'https://example.com/tofu.jpg',
        mimeType: 'image/jpeg',
        bytes: 100000,
      },
    ],
    recipe: {
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: 'EASY',
      nutrition: {
        calories: 250,
        proteinGrams: 15,
        carbsGrams: 10,
        fatGrams: 8,
        fiberGrams: 4,
        vitaminB12Mcg: 0,
      },
      mealPlannerEligible: true,
      allergenCodes: [],
      traditionWarnings: [],
      dietCompatibilities: [],
      ingredients: [
        {
          id: 'ri-1',
          ingredientId: 'ing-tofu',
          displayName: 'Đậu hũ',
          amount: 2,
          unit: 'miếng',
          optional: false,
          resolutionStatus: 'EXACT',
        },
      ],
    },
  };
}

describe('RecipeMapper', () => {
  it('maps backend postSchema recipe to Recipe Model correctly', () => {
    const model = recipeMapper.toModel(backendRecipeDto());

    expect(model.id).toBe('rec-101');
    expect(model.title).toBe('Đậu hũ sốt cà');
    expect(model.status).toBe(PostStatus.PUBLISHED);
    expect(model.statusLabel).toBe('Đã xuất bản');
    expect(model.version).toBe(3);
    expect(model.author.name).toBe('Đầu bếp An');
    expect(model.servings).toBe(4);
    expect(model.prepTimeMinutes).toBe(10);
    expect(model.cookTimeMinutes).toBe(15);
    expect(model.totalTimeMinutes).toBe(25);
    expect(model.difficulty).toBe(RecipeDifficulty.EASY);
    expect(model.difficultyLabel).toBe('Dễ làm');
    expect(model.mealPlannerEligible).toBe(true);

    expect(model.nutrition?.calories).toBe(250);
    expect(model.nutrition?.protein).toBe(15);

    expect(model.ingredients?.length).toBe(1);
    expect(model.ingredients?.[0].name).toBe('Đậu hũ');
    expect(model.ingredients?.[0].amount).toBe(2);
    expect(model.ingredients?.[0].ingredientId).toBe('ing-tofu');

    expect(model.body).toContain('Cắt đậu và chiên vàng.');

    // Legacy fields
    expect(model.image).toBe('https://example.com/tofu.jpg');
    expect(model.minutes).toBe(25);
    expect(model.kcal).toBe(250);
  });

  it('handles null dto and missing fields gracefully', () => {
    const model = recipeMapper.toModel(null);

    expect(model.id).toBe('');
    expect(model.title).toBe('Công thức chưa có tên');
    expect(model.status).toBe(PostStatus.DRAFT);
    expect(model.difficulty).toBe(RecipeDifficulty.EASY);
    expect(model.difficultyLabel).toBe('Dễ làm');
    expect(model.servings).toBe(2);
    expect(model.nutrition?.calories).toBe(0);
    expect(model.ingredients).toEqual([]);
    expect(model.steps).toEqual([]);
    expect(model.mealPlannerEligible).toBe(false);
  });

  it('builds backend live-shape CreateRecipeRequestDto', () => {
    const createDto = recipeMapper.toCreateDto({
      title: 'Canh chua',
      category: { id: 'cat-canh', name: 'Canh' },
      servings: 3,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: RecipeDifficulty.MEDIUM,
      nutrition: {
        calories: 120,
        protein: 5,
        carbs: 15,
        fat: 2,
        fiber: 3,
        vitaminB12: 0,
      },
      ingredients: [{ ingredientId: 'ing-1', name: 'Nấm', amount: 100, unit: 'g', notes: '' }],
      steps: [{ stepNumber: 1, instruction: 'Nấu sôi nước', imageUrl: null }],
    });

    expect(createDto.type).toBe('RECIPE');
    expect(createDto.title).toBe('Canh chua');
    expect(createDto.categoryIds).toEqual(['cat-canh']);
    expect(createDto.recipe.servings).toBe(3);
    expect(createDto.recipe.prepTimeMinutes).toBe(10);
    expect(createDto.recipe.ingredients[0].displayName).toBe('Nấm');
    expect(createDto.recipe.ingredients[0].ingredientId).toBe('ing-1');
    expect(createDto.recipe.nutrition?.proteinGrams).toBe(5);
    expect(createDto.body).toContain('Nấu sôi nước');
  });

  it('stepsToBody falls back when steps are empty', () => {
    expect(stepsToBody([], 'Mô tả món')).toBe('Mô tả món');
    expect(stepsToBody([{ stepNumber: 1, instruction: 'Sơ chế' }], 'fallback')).toContain(
      '## Bước 1'
    );
  });
});
