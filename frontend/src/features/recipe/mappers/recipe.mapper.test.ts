import { describe, it, expect } from 'vitest';
import { bodyToSteps, recipeMapper, stepsToBody } from './recipe.mapper';
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
    // Calculated/published `nutrition` is never echoed back; only `authorNutrition` is sent.
    expect('nutrition' in createDto.recipe).toBe(false);
    expect(createDto.body).toContain('Nấu sôi nước');
  });

  it('sends only author-entered nutrition, rounding calories and dropping blanks', () => {
    const createDto = recipeMapper.toCreateDto({
      title: 'Canh chua',
      servings: 2,
      difficulty: RecipeDifficulty.EASY,
      authorNutrition: {
        calories: 120.6,
        proteinGrams: 5,
        carbsGrams: null,
        fatGrams: 0,
        fiberGrams: null,
        vitaminB12Mcg: 0,
      },
      ingredients: [{ ingredientId: 'ing-1', name: 'Nấm', amount: 100, unit: 'g', notes: '' }],
      steps: [{ stepNumber: 1, instruction: 'Nấu sôi nước', imageUrl: null }],
    });
    expect(createDto.recipe.nutrition).toEqual({
      calories: 121,
      proteinGrams: 5,
      fatGrams: 0,
      vitaminB12Mcg: 0,
    });
  });

  it('maps authorNutrition keeping blanks as null and zero as zero', () => {
    const dto = backendRecipeDto();
    const model = recipeMapper.toModel({
      ...dto,
      recipe: {
        ...dto.recipe,
        authorNutrition: {
          calories: 300,
          proteinGrams: null,
          carbsGrams: null,
          fatGrams: null,
          fiberGrams: null,
          vitaminB12Mcg: 0,
        },
      },
    });
    expect(model.authorNutrition).toEqual({
      calories: 300,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      fiberGrams: null,
      vitaminB12Mcg: 0,
    });
    expect(recipeMapper.toModel(backendRecipeDto()).authorNutrition?.calories).toBeNull();
  });

  it('stepsToBody falls back when steps are empty', () => {
    expect(stepsToBody([], 'Mô tả món')).toBe('Mô tả món');
    expect(stepsToBody([{ stepNumber: 1, instruction: 'Sơ chế' }], 'fallback')).toContain(
      '## Bước 1'
    );
  });

  it('omits ingredientId key when null (backend strict optional UUID)', () => {
    const createDto = recipeMapper.toCreateDto({
      title: 'Rau xào',
      category: { id: 'cat-xao', name: 'Xào' },
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      difficulty: RecipeDifficulty.EASY,
      ingredients: [
        { ingredientId: null, name: 'Rau muống', amount: 300, unit: 'gram', notes: '' },
      ],
      steps: [{ stepNumber: 1, instruction: 'Xào nhanh tay', imageUrl: null }],
    });

    expect(createDto.recipe.ingredients).toHaveLength(1);
    expect(createDto.recipe.ingredients[0]).not.toHaveProperty('ingredientId');
    expect(createDto.recipe.ingredients[0].displayName).toBe('Rau muống');
  });

  it('leaves rating undefined and maps real compatibility data', () => {
    const dto = backendRecipeDto();
    if (dto.recipe) {
      dto.recipe.allergenCodes = ['SOY'];
      dto.recipe.mealPlannerEligible = false;
      dto.recipe.traditionWarnings = [
        { tradition: 'BUDDHIST', warningCode: 'W1', label: 'Kiêng ngũ vị tân' },
      ];
      dto.recipe.dietCompatibilities = [
        { dietPattern: 'VEGAN', compatible: false, reasonCodes: ['UNRESOLVED_INGREDIENT'] },
      ];
    }
    const model = recipeMapper.toModel(dto);

    // Không số giả: UI tự ẩn khối rating.
    expect(model.rating).toBeUndefined();
    expect(model.ratingCount).toBeUndefined();
    expect(model.expertVerified).toBe(false);
    expect(model.author.verified).toBe(false);
    expect(model.allergenCodes).toEqual(['SOY']);
    expect(model.allergens).toEqual([{ code: 'SOY', name: 'Đậu nành' }]);
    expect(model.mealPlannerEligible).toBe(false);
    expect(model.traditionWarnings?.[0].label).toBe('Kiêng ngũ vị tân');
    expect(model.traditionWarnings?.[0].traditionName).toBe('Phật giáo');
    expect(model.traditionWarnings?.[0].traditionLabel).toBe('Phật giáo');
    expect(model.dietCompatibilities?.[0].compatible).toBe(false);
    expect(model.dietCompatibilities?.[0].dietPatternName).toBe('Thuần chay');
    expect(model.dietCompatibilities?.[0].reasonLabels).toEqual([
      'Nguyên liệu chưa được chuẩn hóa',
    ]);
  });

  it('includes ingredientId when provided as valid UUID string', () => {
    const validUuid = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
    const createDto = recipeMapper.toCreateDto({
      title: 'Đậu hũ chiên sả',
      category: 'cat-chien',
      servings: 2,
      ingredients: [{ ingredientId: validUuid, name: 'Đậu hũ', amount: 200, unit: 'g', notes: '' }],
      steps: [{ stepNumber: 1, instruction: 'Chiên vàng đều' }],
    });

    expect(createDto.recipe.ingredients).toHaveLength(1);
    expect(createDto.recipe.ingredients[0].ingredientId).toBe(validUuid);
    expect(createDto.recipe.ingredients[0].displayName).toBe('Đậu hũ');
  });

  it('maps appliedConstraints in toPaginationFromEnvelope', () => {
    const pagination = recipeMapper.toPaginationFromEnvelope([backendRecipeDto()], {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      appliedConstraints: {
        authenticated: true,
        dietPattern: 'VEGAN',
        allergyCount: 2,
        ingredientExclusionCount: 1,
        traditions: ['BUDDHIST'],
        forDate: '2026-09-17',
      },
    });

    expect(pagination.items).toHaveLength(1);
    expect(pagination.metadata.appliedConstraints).toBeDefined();
    expect(pagination.metadata.appliedConstraints?.authenticated).toBe(true);
    expect(pagination.metadata.appliedConstraints?.dietPattern).toBe('VEGAN');
    expect(pagination.metadata.appliedConstraints?.allergyCount).toBe(2);
    expect(pagination.metadata.appliedConstraints?.ingredientExclusionCount).toBe(1);
    expect(pagination.metadata.appliedConstraints?.traditions).toEqual(['BUDDHIST']);
  });

  it('maps eligibility reasons only when backend returns them', () => {
    expect(recipeMapper.toModel(backendRecipeDto()).ineligibilityReasons).toBeUndefined();

    const dto = backendRecipeDto();
    dto.recipe = {
      ...dto.recipe,
      eligibility: {
        eligible: false,
        reasons: [
          { code: 'INGREDIENT_COMPOSITION_UNCERTAIN', ingredientNames: ['Đậu hũ', ''] },
          { code: 'DIET_PATTERN', ingredientNames: [] },
          { code: 'NEW_BACKEND_CODE' },
        ],
      },
    };
    expect(recipeMapper.toModel(dto).ineligibilityReasons).toEqual([
      {
        code: 'INGREDIENT_COMPOSITION_UNCERTAIN',
        label: 'Chưa xác minh đủ thành phần nguyên liệu',
        ingredientNames: ['Đậu hũ'],
      },
      { code: 'DIET_PATTERN', label: 'Không hợp kiểu ăn của bạn', ingredientNames: [] },
      { code: 'NEW_BACKEND_CODE', label: 'Không đạt ràng buộc hồ sơ', ingredientNames: [] },
    ]);
  });

  it('maps usageCount defaulting to 0 when missing or null in DTO', () => {
    const dto = backendRecipeDto();
    const model = recipeMapper.toModel(dto);
    expect(model.usageCount).toBe(0);
  });

  it('maps usageCount correctly when provided in DTO', () => {
    const dto = backendRecipeDto();
    dto.recipe = {
      ...dto.recipe,
      usageCount: 42,
    };
    const model = recipeMapper.toModel(dto);
    expect(model.usageCount).toBe(42);
  });

  it('maps the backend statistics.usageUserCount field', () => {
    const dto = backendRecipeDto();
    dto.recipe = {
      ...dto.recipe,
      statistics: {
        usageUserCount: 42,
        usageTracking: 'MEAL_PLAN_ADDITION',
        cookedUserCount: null,
        limitation: 'Số người đã thêm công thức vào thực đơn.',
      },
    };
    const model = recipeMapper.toModel(dto);
    expect(model.usageCount).toBe(42);
  });

  it('maps isExpertAuthor to true when author role is NUTRITION_EXPERT or EXPERIENCED_COOK', () => {
    const dto = backendRecipeDto();
    dto.author = {
      ...dto.author,
      role: 'NUTRITION_EXPERT',
    } as unknown as RecipeDetailDto['author'];
    const model = recipeMapper.toModel(dto);
    expect(model.isExpertAuthor).toBe(true);
    expect(model.author.isExpert).toBe(true);
  });

  it('maps isExpertAuthor to false for regular users without verified status', () => {
    const dto = backendRecipeDto();
    const model = recipeMapper.toModel(dto);
    expect(model.isExpertAuthor).toBe(false);
    expect(model.author.isExpert).toBe(false);
  });
});

describe('bodyToSteps', () => {
  it('round-trips the markdown produced by stepsToBody', () => {
    const steps = [
      { stepNumber: 1, instruction: 'Cắt đậu và chiên vàng.' },
      { stepNumber: 2, instruction: 'Rưới sốt cà chua\nđảo đều.' },
    ];
    expect(bodyToSteps(stepsToBody(steps, ''))).toEqual(steps);
  });

  it('treats a body without step headings as one step and empty body as none', () => {
    expect(bodyToSteps('Trộn tất cả nguyên liệu.')).toEqual([
      { stepNumber: 1, instruction: 'Trộn tất cả nguyên liệu.' },
    ]);
    expect(bodyToSteps('')).toEqual([]);
    expect(bodyToSteps(undefined)).toEqual([]);
  });
});
