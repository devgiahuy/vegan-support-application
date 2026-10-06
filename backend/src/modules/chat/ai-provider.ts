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

export interface CustomMealNutritionFallbackInput {
  mealName: string;
  servings: number;
  ingredients: Array<{
    displayName: string;
    canonicalName: string | null;
    amount: number;
    unit: string;
  }>;
  missingMetrics: Array<
    'calories' | 'proteinGrams' | 'carbsGrams' | 'fatGrams' | 'fiberGrams'
  >;
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
}

export class FakeAiProvider implements AiProvider {
  readonly name = 'fake' as const;
  readonly chatModel = 'local-nutrition-fixture-v1';

  async *streamChat(input: AiChatInput): AsyncIterable<AiChatChunk> {
    await Promise.resolve();
    if (input.signal.aborted) throw input.signal.reason;
    const question = input.messages.at(-1)?.content ?? '';
    const answer =
      `G?i � demo: h�y uu ti�n ngu?n d?m th?c v?t da d?ng nhu d?u hu, c�c lo?i d?u, n?m v� ngu c?c nguy�n h?t. ` +
      `V?i c�u h?i �${question.slice(0, 120)}�, b?n n�n d?i chi?u kh?u ph?n v?i m?c ti�u nang lu?ng v� c�c d? ?ng d� khai b�o.`;
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
      flagged: ['t? t?', 'tu tu', 'gi?t ngu?i', 'giet nguoi'].some((term) =>
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
              ['lu?c', 'luoc', 'n?u', 'nau', 's�i', 'soi'].some((term) => normalized.includes(term))
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
      uncertaintyNote: 'B? cung c?p th? nghi?m kh�ng u?c t�nh dinh du?ng khi thi?u d? li?u chu?n.',
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
}

export function createAiProvider(config: AppConfig): AiProvider {
  if (config.ai.provider === 'fake') return new FakeAiProvider();
  if (!config.ai.openAiApiKey) return new UnavailableAiProvider(config);
  return new OpenAiProvider(config);
}
