import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

const optionalNutritionAmountSchema = z.number().finite().nonnegative().max(999_999).nullable();
const customMealNutritionFallbackSchema = z
  .object({
    calories: optionalNutritionAmountSchema,
    proteinGrams: optionalNutritionAmountSchema,
    carbsGrams: optionalNutritionAmountSchema,
    fatGrams: optionalNutritionAmountSchema,
    fiberGrams: optionalNutritionAmountSchema,
    confidence: z.number().min(0).max(1),
    uncertaintyNote: z.string().trim().min(1).max(2_000),
  })
  .strict();

const reviewNutritionAmountSchema = z.number().finite().nonnegative().max(999_999).nullable();
const recipeNutritionReviewEstimateSchema = z
  .object({
    stepMethods: z
      .array(
        z.object({
          stepPosition: z.number().int().nonnegative(),
          cookingMethodCode: z.string().trim().min(1).max(80),
          confidence: z.number().min(0).max(1),
          assumption: z.string().trim().min(1).max(1_000),
        }),
      )
      .max(100)
      .default([]),
    retentionFactors: z
      .array(
        z.object({
          nutrientCode: z.string().trim().min(1).max(80),
          cookingMethodCode: z.string().trim().min(1).max(80),
          factor: z.number().min(0).max(1),
          confidence: z.number().min(0).max(1),
          assumption: z.string().trim().min(1).max(1_000),
        }),
      )
      .max(100)
      .default([]),
    ingredientEstimates: z
      .array(
        z.object({
          ingredientPosition: z.number().int().nonnegative(),
          calories: reviewNutritionAmountSchema,
          proteinGrams: reviewNutritionAmountSchema,
          carbsGrams: reviewNutritionAmountSchema,
          fatGrams: reviewNutritionAmountSchema,
          fiberGrams: reviewNutritionAmountSchema,
          confidence: z.number().min(0).max(1),
          assumption: z.string().trim().min(1).max(1_000),
        }),
      )
      .max(200)
      .default([]),
  })
  .strip();

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatInput {
  instructions: string;
  messages: AiChatMessage[];
  signal: AbortSignal;
}

export interface RecipeNutritionFallbackInput {
  recipeTitle: string;
  ingredients: Array<{
    position: number;
    displayName: string;
    canonicalName: string | null;
    unit: string;
  }>;
  steps: Array<{
    position: number;
    instruction: string;
    cookingMethodCode: string | null;
    affectedIngredientPositions: number[];
  }>;
  availableCookingMethodCodes: string[];
  signal: AbortSignal;
}

export interface RecipeNutritionFallbackSuggestion {
  stepMethods: Array<{
    stepPosition: number;
    cookingMethodCode: string;
    confidence: number;
    assumption: string;
  }>;
  yieldFactors: Array<{
    ingredientPosition: number;
    factor: number;
    confidence: number;
    assumption: string;
  }>;
  retentionFactors: Array<{
    nutrientCode: string;
    cookingMethodCode: string;
    factor: number;
    confidence: number;
    assumption: string;
  }>;
}

export type RecipeReviewNutritionMetric =
  'calories' | 'proteinGrams' | 'carbsGrams' | 'fatGrams' | 'fiberGrams';

export interface RecipeNutritionReviewEstimateInput {
  recipeTitle: string;
  servings: number;
  ingredients: Array<{
    position: number;
    displayName: string;
    canonicalName: string | null;
    amount: number;
    unit: string;
    optional: boolean;
    /** Metrics the reviewed food data could not supply for this ingredient line. */
    missingMetrics: RecipeReviewNutritionMetric[];
  }>;
  steps: Array<{
    position: number;
    instruction: string;
    cookingMethodCode: string | null;
    durationMinutes: number | null;
    temperatureCelsius: number | null;
    affectedIngredientPositions: number[];
  }>;
  availableCookingMethodCodes: string[];
  signal: AbortSignal;
}

export interface RecipeNutritionReviewEstimateSuggestion {
  stepMethods: RecipeNutritionFallbackSuggestion['stepMethods'];
  retentionFactors: RecipeNutritionFallbackSuggestion['retentionFactors'];
  /** Whole-line amounts (as cooked in this recipe) for ingredients with missing metrics. */
  ingredientEstimates: Array<{
    ingredientPosition: number;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    fiberGrams: number | null;
    confidence: number;
    assumption: string;
  }>;
}

export interface CustomMealNutritionFallbackInput {
  mealName: string;
  servings: number;
  ingredients: Array<{
    displayName: string;
    canonicalName: string | null;
    amount: number;
    unit: string;
  }>;
  missingMetrics: Array<'calories' | 'proteinGrams' | 'carbsGrams' | 'fatGrams' | 'fiberGrams'>;
  signal: AbortSignal;
}

export interface CustomMealNutritionFallbackSuggestion {
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  confidence: number;
  uncertaintyNote: string;
}

export type AiChatChunk =
  | { type: 'delta'; delta: string }
  | {
      type: 'complete';
      responseId: string;
      inputTokens: number | null;
      outputTokens: number | null;
    };

export interface AiProvider {
  readonly name: 'openai' | 'fake' | 'unavailable';
  readonly chatModel: string;
  streamChat(input: AiChatInput): AsyncIterable<AiChatChunk>;
  moderate(
    input: string,
    signal: AbortSignal,
  ): Promise<{ flagged: boolean; unavailable?: boolean }>;
  suggestRecipeNutritionFallback(
    input: RecipeNutritionFallbackInput,
  ): Promise<RecipeNutritionFallbackSuggestion>;
  suggestCustomMealNutritionFallback(
    input: CustomMealNutritionFallbackInput,
  ): Promise<CustomMealNutritionFallbackSuggestion>;
  estimateRecipeNutritionForReview(
    input: RecipeNutritionReviewEstimateInput,
  ): Promise<RecipeNutritionReviewEstimateSuggestion>;
}

export class AiProviderUnavailableError extends Error {
  constructor(message = 'AI provider is unavailable') {
    super(message);
    this.name = 'AiProviderUnavailableError';
  }
}

export class AiProviderResponseError extends Error {
  constructor(message = 'AI provider response failed') {
    super(message);
    this.name = 'AiProviderResponseError';
  }
}

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;
  readonly chatModel: string;
  private readonly client: OpenAI;

  constructor(private readonly config: AppConfig) {
    if (!config.ai.openAiApiKey) throw new AiProviderUnavailableError('OPENAI_API_KEY is missing');
    this.chatModel = config.ai.chatModel;
    this.client = new OpenAI({
      apiKey: config.ai.openAiApiKey,
      baseURL: config.ai.openAiBaseUrl,
      timeout: config.ai.timeoutMs,
      maxRetries: 1,
    });
  }

  async *streamChat(input: AiChatInput): AsyncIterable<AiChatChunk> {
    const stream = await this.client.responses.create(
      {
        model: this.chatModel,
        instructions: input.instructions,
        input: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: this.config.ai.maxOutputTokens,
        reasoning: { effort: 'low' },
        store: false,
        stream: true,
      },
      { signal: input.signal },
    );
    let completed = false;
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta' && event.delta) {
        yield { type: 'delta', delta: event.delta };
      } else if (event.type === 'response.refusal.delta' && event.delta) {
        yield { type: 'delta', delta: event.delta };
      } else if (event.type === 'response.completed') {
        completed = true;
        yield {
          type: 'complete',
          responseId: event.response.id,
          inputTokens: event.response.usage?.input_tokens ?? null,
          outputTokens: event.response.usage?.output_tokens ?? null,
        };
      } else if (
        event.type === 'response.failed' ||
        event.type === 'response.incomplete' ||
        event.type === 'error'
      ) {
        throw new AiProviderResponseError(event.type);
      }
    }
    if (!completed) throw new AiProviderResponseError('OpenAI stream ended without completion');
  }

  async moderate(input: string, signal: AbortSignal): Promise<{ flagged: boolean }> {
    const response = await this.client.moderations.create(
      { model: this.config.ai.moderationModel, input },
      { signal },
    );
    return { flagged: response.results.some((result) => result.flagged) };
  }

  async suggestRecipeNutritionFallback(
    input: RecipeNutritionFallbackInput,
  ): Promise<RecipeNutritionFallbackSuggestion> {
    let content = '';
    for await (const chunk of this.streamChat({
      instructions: [
        'Return only compact JSON for vegetarian recipe nutrition estimation hints.',
        'Do not invent canonical nutrient facts. Suggest only missing cooking methods, yield factors, or retention factors.',
        'Use this exact shape: {"stepMethods":[],"yieldFactors":[],"retentionFactors":[]}.',
        'Confidence and factors must be numbers from 0 to 1 except yield factor, which must be positive.',
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            recipeTitle: input.recipeTitle,
            ingredients: input.ingredients,
            steps: input.steps,
            availableCookingMethodCodes: input.availableCookingMethodCodes,
          }),
        },
      ],
      signal: input.signal,
    })) {
      if (chunk.type === 'delta') content += chunk.delta;
    }
    try {
      return JSON.parse(content) as RecipeNutritionFallbackSuggestion;
    } catch {
      throw new AiProviderResponseError('AI nutrition fallback returned invalid JSON');
    }
  }

  async suggestCustomMealNutritionFallback(
    input: CustomMealNutritionFallbackInput,
  ): Promise<CustomMealNutritionFallbackSuggestion> {
    let content = '';
    for await (const chunk of this.streamChat({
      instructions: [
        'Return only compact JSON estimating total nutrition for the entire custom meal.',
        'Use this exact shape: {"calories":null,"proteinGrams":null,"carbsGrams":null,"fatGrams":null,"fiberGrams":null,"confidence":0,"uncertaintyNote":""}.',
        'Estimate only metrics listed in missingMetrics; leave all other metrics null.',
        'Each requested metric is the TOTAL for the entire meal, including all listed ingredients, never only the unknown ingredients. Do not multiply listed ingredient amounts by servings.',
        'When only a recognizable meal name is supplied, you may estimate a common preparation for the given servings. State the assumed portion size and preparation in uncertaintyNote and use low confidence. Return null for vague names or insufficient information.',
        'Never present estimates as measured or canonical values. Use null when the ingredients or amounts are insufficient.',
        'Write uncertaintyNote in Vietnamese. All non-null nutrition values must be finite and non-negative; confidence must be from 0 to 1.',
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            mealName: input.mealName,
            servings: input.servings,
            ingredients: input.ingredients,
            missingMetrics: input.missingMetrics,
          }),
        },
      ],
      signal: input.signal,
    })) {
      if (chunk.type === 'delta') content += chunk.delta;
    }
    try {
      return customMealNutritionFallbackSchema.parse(JSON.parse(content) as unknown);
    } catch {
      throw new AiProviderResponseError('AI custom-meal nutrition fallback returned invalid JSON');
    }
  }

  async estimateRecipeNutritionForReview(
    input: RecipeNutritionReviewEstimateInput,
  ): Promise<RecipeNutritionReviewEstimateSuggestion> {
    let content = '';
    for await (const chunk of this.streamChat({
      instructions: [
        'Return only compact JSON that fills gaps in a vegetarian recipe nutrition estimate for a human reviewer.',
        'Use this exact shape: {"stepMethods":[],"retentionFactors":[],"ingredientEstimates":[]}.',
        'stepMethods: for steps without cookingMethodCode that affect ingredients, choose a code from availableCookingMethodCodes only.',
        'retentionFactors: optional nutrient retention factors (0 to 1) for the chosen cooking methods.',
        'ingredientEstimates: one item per ingredient whose missingMetrics is non-empty. Each value is the TOTAL for that ingredient line exactly as used in the recipe (its amount and unit, after cooking), never per serving and never per 100 g.',
        'Fill only metrics listed in that ingredient missingMetrics; set the others to null. calories are kcal; proteinGrams, carbsGrams, fatGrams and fiberGrams are grams.',
        'Use null when the amount, unit or ingredient is too vague. Never present estimates as measured or canonical values.',
        'Each item needs confidence from 0 to 1 and a short Vietnamese assumption describing the assumed food form and portion.',
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            recipeTitle: input.recipeTitle,
            servings: input.servings,
            ingredients: input.ingredients,
            steps: input.steps,
            availableCookingMethodCodes: input.availableCookingMethodCodes,
          }),
        },
      ],
      signal: input.signal,
    })) {
      if (chunk.type === 'delta') content += chunk.delta;
    }
    try {
      return recipeNutritionReviewEstimateSchema.parse(JSON.parse(content) as unknown);
    } catch {
      throw new AiProviderResponseError(
        'AI recipe review nutrition estimate returned invalid JSON',
      );
    }
  }
}

export class FakeAiProvider implements AiProvider {
  readonly name = 'fake' as const;
  readonly chatModel = 'local-nutrition-fixture-v1';

  async *streamChat(input: AiChatInput): AsyncIterable<AiChatChunk> {
    await Promise.resolve();
    if (input.signal.aborted) throw input.signal.reason;
    const question = input.messages.at(-1)?.content ?? '';
    const answer =
      `Gợi ý demo: hãy ưu tiên nguồn đạm thực vật đa dạng như đậu hũ, các loại đậu, nấm và ngũ cốc nguyên hạt. ` +
      `Với câu hỏi “${question.slice(0, 120)}”, bạn nên đối chiếu khẩu phần với mục tiêu năng lượng và các dị ứng đã khai báo.`;
    for (const delta of answer.match(/.{1,48}(?:\s|$)/gu) ?? [answer]) {
      if (input.signal.aborted) throw input.signal.reason;
      yield { type: 'delta', delta };
    }
    yield {
      type: 'complete',
      responseId: `fake_${randomUUID()}`,
      inputTokens: null,
      outputTokens: null,
    };
  }

  moderate(input: string, signal: AbortSignal): Promise<{ flagged: boolean }> {
    if (signal.aborted) {
      return Promise.reject(new Error('Request aborted', { cause: signal.reason }));
    }
    const normalized = input.toLocaleLowerCase('vi');
    return Promise.resolve({
      flagged: ['tự tử', 'tu tu', 'giết người', 'giet nguoi'].some((term) =>
        normalized.includes(term),
      ),
    });
  }

  suggestRecipeNutritionFallback(
    input: RecipeNutritionFallbackInput,
  ): Promise<RecipeNutritionFallbackSuggestion> {
    if (input.signal.aborted) {
      return Promise.reject(new Error('Request aborted', { cause: input.signal.reason }));
    }
    const hasBoiling = input.availableCookingMethodCodes.includes('BOILING');
    return Promise.resolve({
      stepMethods: hasBoiling
        ? input.steps.flatMap((step) => {
            const normalized = step.instruction.toLocaleLowerCase('vi');
            return !step.cookingMethodCode &&
              ['luộc', 'luoc', 'nấu', 'nau', 'sôi', 'soi'].some((term) => normalized.includes(term))
              ? [
                  {
                    stepPosition: step.position,
                    cookingMethodCode: 'BOILING',
                    confidence: 0.72,
                    assumption: 'Local fixture inferred boiling-like method from step text.',
                  },
                ]
              : [];
          })
        : [],
      yieldFactors: [],
      retentionFactors: [],
    });
  }

  suggestCustomMealNutritionFallback(
    input: CustomMealNutritionFallbackInput,
  ): Promise<CustomMealNutritionFallbackSuggestion> {
    if (input.signal.aborted) {
      return Promise.reject(new Error('Request aborted', { cause: input.signal.reason }));
    }
    return Promise.resolve({
      calories: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      fiberGrams: null,
      confidence: 0,
      uncertaintyNote: 'Bộ cung cấp thử nghiệm không ước tính dinh dưỡng khi thiếu dữ liệu chuẩn.',
    });
  }

  estimateRecipeNutritionForReview(
    input: RecipeNutritionReviewEstimateInput,
  ): Promise<RecipeNutritionReviewEstimateSuggestion> {
    if (input.signal.aborted) {
      return Promise.reject(new Error('Request aborted', { cause: input.signal.reason }));
    }
    const hasBoiling = input.availableCookingMethodCodes.includes('BOILING');
    // Local fixture: a fixed generic vegetable-like density per gram, clearly low confidence.
    const perGram = {
      calories: 0.5,
      proteinGrams: 0.02,
      carbsGrams: 0.08,
      fatGrams: 0.01,
      fiberGrams: 0.02,
    };
    const massUnits = new Map([
      ['g', 1],
      ['gram', 1],
      ['kg', 1000],
      ['mg', 0.001],
    ]);
    return Promise.resolve({
      stepMethods: hasBoiling
        ? input.steps.flatMap((step) => {
            const normalized = step.instruction.toLocaleLowerCase('vi');
            return !step.cookingMethodCode &&
              step.affectedIngredientPositions.length > 0 &&
              ['luộc', 'luoc', 'nấu', 'nau', 'sôi', 'soi'].some((term) => normalized.includes(term))
              ? [
                  {
                    stepPosition: step.position,
                    cookingMethodCode: 'BOILING',
                    confidence: 0.72,
                    assumption: 'Local fixture inferred boiling-like method from step text.',
                  },
                ]
              : [];
          })
        : [],
      retentionFactors: [],
      ingredientEstimates: input.ingredients.flatMap((ingredient) => {
        const factor = massUnits.get(ingredient.unit.trim().toLowerCase());
        if (!ingredient.missingMetrics.length || factor === undefined) return [];
        const grams = ingredient.amount * factor;
        const value = (metric: keyof typeof perGram) =>
          ingredient.missingMetrics.includes(metric)
            ? Math.round(grams * perGram[metric] * 100) / 100
            : null;
        return [
          {
            ingredientPosition: ingredient.position,
            calories: value('calories'),
            proteinGrams: value('proteinGrams'),
            carbsGrams: value('carbsGrams'),
            fatGrams: value('fatGrams'),
            fiberGrams: value('fiberGrams'),
            confidence: 0.3,
            assumption:
              'Bộ cung cấp thử nghiệm dùng mật độ dinh dưỡng chung cho rau củ; chỉ để demo.',
          },
        ];
      }),
    });
  }
}

export class UnavailableAiProvider implements AiProvider {
  readonly name = 'unavailable' as const;
  readonly chatModel: string;

  constructor(config: AppConfig) {
    this.chatModel = config.ai.chatModel;
  }

  streamChat(): AsyncIterable<AiChatChunk> {
    return {
      [Symbol.asyncIterator]() {
        return {
          next: () => Promise.reject(new AiProviderUnavailableError()),
        };
      },
    };
  }

  moderate(): Promise<{ flagged: boolean }> {
    return Promise.reject(new AiProviderUnavailableError());
  }

  suggestRecipeNutritionFallback(): Promise<RecipeNutritionFallbackSuggestion> {
    return Promise.reject(new AiProviderUnavailableError());
  }

  suggestCustomMealNutritionFallback(): Promise<CustomMealNutritionFallbackSuggestion> {
    return Promise.reject(new AiProviderUnavailableError());
  }
  estimateRecipeNutritionForReview(): Promise<RecipeNutritionReviewEstimateSuggestion> {
    return Promise.reject(new AiProviderUnavailableError());
  }
}

export function createAiProvider(config: AppConfig): AiProvider {
  if (config.ai.provider === 'fake') return new FakeAiProvider();
  if (!config.ai.openAiApiKey) return new UnavailableAiProvider(config);
  return new OpenAiProvider(config);
}
