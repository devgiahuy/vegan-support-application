import { RecipeDifficulty } from '@/common/enums';
import { pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type {
  GenerateRecipeDraftRequestDto,
  GenerateRecipeDraftResponseDto,
  RecipeDraftIngredientDto,
  RecipeDraftStepDto,
} from '../types/recipe-draft.dto';
import type { RecipeDraftIngredient, RecipeDraftPrompt, RecipeDraftStep, RecipeDraftSuggestion } from '../types/recipe-draft.model';

function nullableConfidence(value: unknown): number | null {
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : Math.min(1, Math.max(0, parsed));
}

function toDifficulty(value: unknown): RecipeDifficulty {
  const raw = safeString(value).toUpperCase();
  if (raw === 'EASY') return RecipeDifficulty.EASY;
  if (raw === 'HARD') return RecipeDifficulty.HARD;
  return RecipeDifficulty.MEDIUM;
}

export class RecipeDraftMapper {
  toDto(prompt: RecipeDraftPrompt): GenerateRecipeDraftRequestDto {
    const seen = new Set<string>();
    const ingredientNames = prompt.ingredientNames
      .map((name) => name.trim().slice(0, 160))
      .filter((name) => {
        const key = name.toLowerCase();
        if (!name || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 50);
    return { title: prompt.title.trim(), description: prompt.description.trim().slice(0, 500), ingredientNames };
  }

  toModel(dto: GenerateRecipeDraftResponseDto | null | undefined): RecipeDraftSuggestion {
    const data = pickField<NonNullable<GenerateRecipeDraftResponseDto['data']> | null>(dto, ['data'], null);
    const recipe = pickField<NonNullable<NonNullable<typeof data>['draft']>['recipe'] | null>(
      pickField(data, ['draft'], null),
      ['recipe'],
      null
    );
    const confidences = safeArray<number>(pickField(data, ['ingredientConfidence'], []));
    const ingredients = safeArray<RecipeDraftIngredientDto | null, RecipeDraftIngredient>(
      pickField(recipe, ['ingredients'], []),
      (ingredient, index) => ({
        name: safeString(pickField(ingredient, ['displayName'], '')),
        amount: safeNumber(pickField(ingredient, ['amount'], 0), 0),
        unit: safeString(pickField(ingredient, ['unit'], '')),
        optional: safeBoolean(pickField(ingredient, ['optional'], false), false),
        confidence: nullableConfidence(confidences[index]),
      })
    ).filter((ingredient) => ingredient.name.length > 0 && ingredient.amount > 0 && ingredient.unit.length > 0);
    const steps = safeArray<RecipeDraftStepDto | null, RecipeDraftStep>(pickField(recipe, ['steps'], []), (step) => {
      const duration = safeNumber(pickField(step, ['durationMinutes'], 0), 0);
      return {
        instruction: safeString(pickField(step, ['instruction'], '')),
        durationMinutes: duration > 0 ? Math.trunc(duration) : null,
        affectedIngredientPositions: safeArray<number>(pickField(step, ['affectedIngredientPositions'], [])).filter(
          (position) => Number.isInteger(position) && position >= 0
        ),
      };
    }).filter((step) => step.instruction.length > 0);
    const provenance = pickField<Record<string, unknown> | null>(data, ['provenance'], null);

    return {
      servings: Math.max(1, Math.trunc(safeNumber(pickField(recipe, ['servings'], 2), 2))),
      prepTimeMinutes: Math.max(0, Math.trunc(safeNumber(pickField(recipe, ['prepTimeMinutes'], 0), 0))),
      cookTimeMinutes: Math.max(0, Math.trunc(safeNumber(pickField(recipe, ['cookTimeMinutes'], 0), 0))),
      difficulty: toDifficulty(pickField(recipe, ['difficulty'], 'MEDIUM')),
      ingredients,
      steps,
      confidence: nullableConfidence(pickField(data, ['confidence'], null)),
      assumptions: safeArray<string | null, string>(pickField(data, ['assumptions'], []), (note) => safeString(note)).filter(
        (note) => note.length > 0
      ),
      provenance: provenance
        ? {
            provider: safeString(provenance.provider),
            model: safeString(provenance.model),
            templateVersion: safeString(provenance.templateVersion),
          }
        : null,
    };
  }
}

export const recipeDraftMapper = new RecipeDraftMapper();
