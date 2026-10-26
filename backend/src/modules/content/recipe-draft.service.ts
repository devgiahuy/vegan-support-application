import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import type { AiGovernanceService } from '../ai-governance/ai-governance.service.js';
import { createRecipePostRequestSchema } from './content.schemas.js';
import type { RecipeDraftProvider } from './recipe-draft.provider.js';
import type { GenerateRecipeDraftInput } from './recipe-draft.schemas.js';

export class RecipeDraftService {
  constructor(
    private readonly provider: RecipeDraftProvider,
    private readonly governance: AiGovernanceService,
    private readonly config: AppConfig,
  ) {}

  async generate(input: GenerateRecipeDraftInput) {
    const startedAt = new Date();
    if (
      !this.config.ai.recipeEnabled ||
      !(await this.governance.allowed('RECIPE_DRAFT', this.provider.name))
    ) {
      throw new AppError({
        statusCode: 503,
        code: 'RECIPE_DRAFT_UNAVAILABLE',
        message: 'Gợi ý công thức AI hiện chưa khả dụng.',
      });
    }
    try {
      const suggestion = await this.provider.suggest(input);

      // Normalize ingredients: ensure count matches input.ingredientNames exactly
      let ingredients = suggestion.ingredients;
      if (ingredients.length < input.ingredientNames.length) {
        const missing = input.ingredientNames.length - ingredients.length;
        const padding = Array.from({ length: missing }, () => ({
          amount: 100,
          unit: 'g',
          optional: false,
          confidence: 0.3,
        }));
        ingredients = [...ingredients, ...padding];
      } else if (ingredients.length > input.ingredientNames.length) {
        ingredients = ingredients.slice(0, input.ingredientNames.length);
      }

      // Normalize step references: ensure affectedIngredientPositions are integers and within bounds
      const steps = suggestion.steps.map((step) => ({
        instruction: step.instruction,
        ...(step.durationMinutes === null ? {} : { durationMinutes: step.durationMinutes }),
        affectedIngredientPositions: Array.from(
          new Set(
            step.affectedIngredientPositions.filter(
              (pos) => Number.isInteger(pos) && pos >= 0 && pos < input.ingredientNames.length,
            ),
          ),
        ),
      }));

      const draft = createRecipePostRequestSchema.parse({
        type: 'RECIPE',
        title: input.title,
        excerpt: input.description,
        body: suggestion.body,
        categoryIds: [],
        tags: [],
        media: [],
        recipe: {
          servings: suggestion.servings,
          prepTimeMinutes: suggestion.prepTimeMinutes,
          cookTimeMinutes: suggestion.cookTimeMinutes,
          difficulty: suggestion.difficulty,
          nutrition: {},
          ingredients: ingredients.map((item, position) => ({
            displayName: input.ingredientNames[position] ?? `Nguyên liệu ${position + 1}`,
            amount: item.amount,
            unit: item.unit,
            optional: item.optional,
          })),
          steps,
        },
      });
      await this.governance.record({
        capability: 'RECIPE_DRAFT',
        provider: this.provider.name,
        modelId: this.provider.model,
        templateVersion: this.provider.templateVersion,
        status: 'SUCCESS',
        startedAt,
        confidence: suggestion.confidence,
      });
      return {
        draft,
        ingredientConfidence: ingredients.map((item) => item.confidence),
        confidence: suggestion.confidence,
        assumptions: suggestion.assumptions,
        provenance: {
          provider: this.provider.name,
          model: this.provider.model,
          templateVersion: this.provider.templateVersion,
        },
      };
    } catch (error) {
      console.error('[RecipeDraftService] Generate failed:', error);
      await this.governance.record({
        capability: 'RECIPE_DRAFT',
        provider: this.provider.name,
        modelId: this.provider.model,
        templateVersion: this.provider.templateVersion,
        status: 'FAILED',
        errorClass: 'PROVIDER_OR_OUTPUT_ERROR',
        startedAt,
      });
      throw new AppError({
        statusCode: 503,
        code: 'RECIPE_DRAFT_GENERATION_FAILED',
        message: 'Không thể tạo bản gợi ý công thức. Vui lòng thử lại hoặc nhập thủ công.',
      });
    }
  }
}
