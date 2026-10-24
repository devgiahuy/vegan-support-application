import { BaseMapper } from '@/lib/mapper/base-mapper';
import { pickField, safeArray, safeNumber, safeString } from '@/lib/mapper/field-helpers';
import { RecipeDifficulty } from '@/common/enums';
import type {
  GenerateRecipeDraftRequestDto,
  GenerateRecipeDraftResponseDto,
  RecipeDraftContentDto,
  RecipeDraftIngredientDto,
  RecipeDraftStepDto,
} from '../types/recipe-draft.dto';
import type {
  RecipeDraftPrompt,
  RecipeDraftSuggestion,
  RecipeDraftIngredient,
  RecipeDraftStep,
} from '../types/recipe-draft.model';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';

export class RecipeDraftMapper extends BaseMapper<
  GenerateRecipeDraftResponseDto,
  RecipeDraftSuggestion
> {
  toModel(dto: GenerateRecipeDraftResponseDto): RecipeDraftSuggestion {
    const rawData = pickField<GenerateRecipeDraftResponseDto['data'] | null>(
      dto,
      ['data'],
      null
    ) ?? {
      draft: {},
      ingredientConfidence: [],
      confidence: 0.85,
      assumptions: [],
      provenance: { provider: 'AI', model: 'recipe-draft', templateVersion: 'v1' },
    };

    const draft = pickField<RecipeDraftContentDto | null>(rawData, ['draft'], null) ?? {};
    const recipe = pickField<RecipeDraftContentDto['recipe'] | null>(draft, ['recipe'], null) ?? {};
    const rawIngredientConf = safeArray<number>(
      pickField<number[]>(rawData, ['ingredientConfidence'], [])
    );

    // Map ingredients
    const rawIngredients = safeArray<RecipeDraftIngredientDto>(
      pickField<RecipeDraftIngredientDto[]>(recipe, ['ingredients'], [])
    );
    const ingredients: RecipeDraftIngredient[] = rawIngredients.map((ing, idx) => ({
      name: safeString(pickField(ing, ['displayName', 'name'], 'Nguyên liệu')),
      amount: safeNumber(pickField(ing, ['amount'], 1), 1),
      unit: safeString(pickField(ing, ['unit'], 'phần')),
      optional: Boolean(pickField(ing, ['optional'], false)),
      confidence: rawIngredientConf[idx] ?? 0.85,
    }));

    // Map steps
    const rawSteps = safeArray<RecipeDraftStepDto>(
      pickField<RecipeDraftStepDto[]>(recipe, ['steps'], [])
    );
    const steps: RecipeDraftStep[] = rawSteps.map((st, idx) => {
      const rawDuration = pickField<number | null | undefined>(st, ['durationMinutes'], undefined);
      return {
        stepNumber: idx + 1,
        instruction: safeString(pickField(st, ['instruction', 'desc', 'instructionText'], '')),
        durationMinutes:
          rawDuration !== undefined && rawDuration !== null ? safeNumber(rawDuration, 0) : null,
        affectedIngredientIndices: safeArray<number>(
          pickField<number[]>(st, ['affectedIngredientPositions'], [])
        ),
      };
    });

    // Map difficulty
    const rawDiff = safeString(pickField(recipe, ['difficulty'], 'MEDIUM')).toUpperCase();
    let difficulty: RecipeDifficulty = RecipeDifficulty.MEDIUM;
    if (rawDiff === 'EASY') difficulty = RecipeDifficulty.EASY;
    if (rawDiff === 'HARD') difficulty = RecipeDifficulty.HARD;

    // Map provenance
    const rawProv = pickField<Record<string, unknown> | null>(rawData, ['provenance'], null) ?? {};

    return {
      title: safeString(pickField(draft, ['title'], '')),
      description: safeString(pickField(draft, ['excerpt', 'description'], '')),
      body: safeString(pickField(draft, ['body'], '')),
      servings: Math.max(1, safeNumber(pickField(recipe, ['servings'], 4), 4)),
      prepTimeMinutes: Math.max(0, safeNumber(pickField(recipe, ['prepTimeMinutes'], 15), 15)),
      cookTimeMinutes: Math.max(0, safeNumber(pickField(recipe, ['cookTimeMinutes'], 20), 20)),
      difficulty,
      ingredients,
      steps,
      confidence: safeNumber(pickField(rawData, ['confidence'], 0.85), 0.85),
      assumptions: safeArray<string>(pickField<string[]>(rawData, ['assumptions'], [])),
      provenance: {
        provider: safeString(pickField(rawProv, ['provider'], 'AI')),
        model: safeString(pickField(rawProv, ['model'], 'recipe-draft')),
        templateVersion: safeString(pickField(rawProv, ['templateVersion'], 'v1')),
      },
    };
  }

  toDto(prompt: RecipeDraftPrompt): GenerateRecipeDraftRequestDto {
    return {
      title: prompt.title.trim(),
      description: prompt.description.trim(),
      ingredientNames: prompt.ingredientNames.map((n) => n.trim()).filter(Boolean),
    };
  }

  /**
   * Chuyển đổi Model gợi ý từ AI thành giá trị biểu mẫu RecipeFormValues
   */
  toFormValues(model: RecipeDraftSuggestion): Partial<RecipeFormValues> {
    return {
      title: model.title,
      description: model.description || model.body.slice(0, 500),
      servings: model.servings,
      prepTimeMinutes: model.prepTimeMinutes,
      cookTimeMinutes: model.cookTimeMinutes,
      difficulty: model.difficulty,
      ingredients: model.ingredients.map((ing) => ({
        name: ing.name,
        ingredientId: null,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.optional ? 'Tùy chọn' : '',
      })),
      steps: model.steps.map((st) => ({
        stepNumber: st.stepNumber,
        instruction: st.instruction,
        tip: st.durationMinutes ? `Thời gian nấu khoảng ${st.durationMinutes} phút` : '',
      })),
    };
  }
}

export const recipeDraftMapper = new RecipeDraftMapper();
