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

function isWholeNumber(value: number | undefined, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

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

    const rawTiming = pickField<Record<string, unknown> | null>(rawData, ['suggestedTiming'], null);
    const suggestedTiming = rawTiming
      ? {
          servings: Math.max(1, safeNumber(pickField(rawTiming, ['servings'], 1), 1)),
          prepTimeMinutes: Math.max(0, safeNumber(pickField(rawTiming, ['prepTimeMinutes'], 0), 0)),
          cookTimeMinutes: Math.max(0, safeNumber(pickField(rawTiming, ['cookTimeMinutes'], 0), 0)),
        }
      : null;

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
      suggestedTiming,
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
      // Chỉ gửi số hợp lệ tác giả đã nhập; ô trống để AI đề xuất.
      ...(isWholeNumber(prompt.servings, 1, 100) ? { servings: prompt.servings } : {}),
      ...(isWholeNumber(prompt.prepTimeMinutes, 0, 10_080)
        ? { prepTimeMinutes: prompt.prepTimeMinutes }
        : {}),
      ...(isWholeNumber(prompt.cookTimeMinutes, 0, 10_080)
        ? { cookTimeMinutes: prompt.cookTimeMinutes }
        : {}),
    };
  }

  /**
   * Câu gợi ý khi thời gian AI tự đề xuất khác thời gian trong bản nháp (= số tác giả đã nhập).
   * Trả null khi giống nhau hoặc backend không gửi `suggestedTiming`.
   */
  timingHint(model: RecipeDraftSuggestion): string | null {
    const ai = model.suggestedTiming;
    if (!ai) return null;
    const parts: string[] = [];
    if (ai.prepTimeMinutes !== model.prepTimeMinutes)
      parts.push(`sơ chế ${ai.prepTimeMinutes} phút`);
    if (ai.cookTimeMinutes !== model.cookTimeMinutes) parts.push(`nấu ${ai.cookTimeMinutes} phút`);
    return parts.length ? `AI ước lượng ${parts.join(', ')}; bạn có thể chỉnh nếu cần.` : null;
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
      })),
      steps: model.steps.map((st) => ({
        stepNumber: st.stepNumber,
        instruction: st.instruction,
      })),
    };
  }
}

export const recipeDraftMapper = new RecipeDraftMapper();
