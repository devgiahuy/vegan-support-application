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
      if (
        suggestion.ingredients.length !== input.ingredientNames.length ||
        suggestion.steps.some((step) =>
          step.affectedIngredientPositions.some(
            (position) => position >= input.ingredientNames.length,
          ),
        )
      ) {
        throw new Error('Recipe draft ingredient count or step reference is invalid');
      }
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
          ingredients: suggestion.ingredients.map((item, position) => ({
            displayName: input.ingredientNames[position],
            amount: item.amount,
            unit: item.unit,
            optional: item.optional,
          })),
          steps: suggestion.steps.map((step) => ({
            instruction: step.instruction,
            ...(step.durationMinutes === null ? {} : { durationMinutes: step.durationMinutes }),
            affectedIngredientPositions: step.affectedIngredientPositions,
          })),
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
        ingredientConfidence: suggestion.ingredients.map((item) => item.confidence),
        confidence: suggestion.confidence,
        assumptions: suggestion.assumptions,
        provenance: {
          provider: this.provider.name,
          model: this.provider.model,
          templateVersion: this.provider.templateVersion,
        },
      };
    } catch {
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
