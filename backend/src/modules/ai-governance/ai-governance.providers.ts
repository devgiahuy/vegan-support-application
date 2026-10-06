import {
  AiProviderUnavailableError,
  type AiProvider,
  type AiChatInput,
  type AiChatChunk,
  type CustomMealNutritionFallbackInput,
  type CustomMealNutritionFallbackSuggestion,
  type RecipeNutritionFallbackInput,
  type RecipeNutritionFallbackSuggestion,
} from '../chat/ai-provider.js';
import type {
  IngredientVisionProvider,
  VisionImageResult,
} from '../ingredient-recognition/ingredient-vision.provider.js';
import type {
  ReceiptExtractionProvider,
  ReceiptProviderImageResult,
} from '../receipts/receipt.provider.js';
import type { AiGovernanceService } from './ai-governance.service.js';
import type { AppConfig } from '../../config/env.js';

export function governAiProvider(
  provider: AiProvider,
  governance: AiGovernanceService,
  config: AppConfig,
): AiProvider {
  const moderationModel = provider.name === 'fake' ? null : config.ai.moderationModel;
  return {
    name: provider.name,
    chatModel: provider.chatModel,
    async *streamChat(input: AiChatInput): AsyncIterable<AiChatChunk> {
      const startedAt = new Date();
      if (provider.name === 'unavailable') {
        await governance.record({
          capability: 'CHAT',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.chatTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw new AiProviderUnavailableError();
      }
      if (!(await governance.allowed('CHAT', provider.name))) {
        await governance.record({
          capability: 'CHAT',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.chatTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'DISABLED',
          startedAt,
        });
        throw new AiProviderUnavailableError('AI chat disabled by governance control');
      }
      let tokens: { inputTokens: number | null; outputTokens: number | null } = {
        inputTokens: null,
        outputTokens: null,
      };
      let recorded = false;
      try {
        for await (const chunk of provider.streamChat(input)) {
          if (chunk.type === 'complete')
            tokens = { inputTokens: chunk.inputTokens, outputTokens: chunk.outputTokens };
          yield chunk;
        }
        recorded = true;
        await governance.record({
          capability: 'CHAT',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.chatTemplateVersion,
          status: 'SUCCESS',
          startedAt,
          ...tokens,
        });
      } catch (error) {
        if (!recorded) {
          recorded = true;
          await governance.record({
            capability: 'CHAT',
            provider: provider.name,
            modelId: provider.chatModel,
            templateVersion: config.ai.chatTemplateVersion,
            status: input.signal.aborted ? 'ABORTED' : 'FAILED',
            errorClass: input.signal.aborted
              ? 'CLIENT_ABORTED_OR_TIMEOUT'
              : error instanceof AiProviderUnavailableError
                ? 'PROVIDER_UNAVAILABLE'
                : 'PROVIDER_ERROR',
            startedAt,
          });
        }
        throw error;
      } finally {
        if (!recorded)
          await governance.record({
            capability: 'CHAT',
            provider: provider.name,
            modelId: provider.chatModel,
            templateVersion: config.ai.chatTemplateVersion,
            status: 'ABORTED',
            errorClass: 'STREAM_CLOSED',
            startedAt,
          });
      }
    },
    async moderate(content: string, signal: AbortSignal) {
      const startedAt = new Date();
      if (provider.name === 'unavailable') {
        await governance.record({
          capability: 'MODERATION',
          provider: provider.name,
          modelId: moderationModel,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          safetyOutcome: 'LOCAL_SAFETY_HOLD',
          startedAt,
        });
        throw new AiProviderUnavailableError();
      }
      if (!(await governance.allowed('MODERATION', provider.name))) {
        await governance.record({
          capability: 'MODERATION',
          provider: provider.name,
          modelId: moderationModel,
          status: 'BLOCKED',
          errorClass: 'DISABLED',
          safetyOutcome: 'LOCAL_SAFETY_HOLD',
          startedAt,
        });
        return { flagged: true, unavailable: true };
      }
      try {
        const result = await provider.moderate(content, signal);
        await governance.record({
          capability: 'MODERATION',
          provider: provider.name,
          modelId: moderationModel,
          status: result.flagged ? 'BLOCKED' : 'SUCCESS',
          safetyOutcome: result.flagged ? 'FLAGGED' : 'CLEAR',
          startedAt,
        });
        return result;
      } catch (error) {
        await governance.record({
          capability: 'MODERATION',
          provider: provider.name,
          modelId: moderationModel,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          safetyOutcome: 'LOCAL_SAFETY_HOLD',
          startedAt,
        });
        throw error;
      }
    },
    async suggestRecipeNutritionFallback(
      input: RecipeNutritionFallbackInput,
    ): Promise<RecipeNutritionFallbackSuggestion> {
      const startedAt = new Date();
      if (provider.name === 'unavailable') {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw new AiProviderUnavailableError();
      }
      if (!(await governance.allowed('NUTRITION', provider.name))) {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'DISABLED',
          startedAt,
        });
        throw new AiProviderUnavailableError('Nutrition AI disabled by governance control');
      }
      try {
        const result = await provider.suggestRecipeNutritionFallback(input);
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'SUCCESS',
          startedAt,
        });
        return result;
      } catch (error) {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw error;
      }
    },
    async suggestCustomMealNutritionFallback(
      input: CustomMealNutritionFallbackInput,
    ): Promise<CustomMealNutritionFallbackSuggestion> {
      const startedAt = new Date();
      if (provider.name === 'unavailable') {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw new AiProviderUnavailableError();
      }
      if (!(await governance.allowed('NUTRITION', provider.name))) {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FALLBACK',
          errorClass: 'DISABLED',
          startedAt,
        });
        throw new AiProviderUnavailableError('Nutrition AI disabled by governance control');
      }
      try {
        const result = await provider.suggestCustomMealNutritionFallback(input);
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'SUCCESS',
          startedAt,
          confidence: result.confidence,
        });
        return result;
      } catch (error) {
        await governance.record({
          capability: 'NUTRITION',
          provider: provider.name,
          modelId: provider.chatModel,
          templateVersion: config.ai.nutritionTemplateVersion,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw error;
      }
    },
  };
}

export function governVisionProvider(
  provider: IngredientVisionProvider,
  governance: AiGovernanceService,
): IngredientVisionProvider {
  return {
    name: provider.name,
    model: provider.model,
    templateVersion: provider.templateVersion,
    async recognize(images): Promise<VisionImageResult[]> {
      const startedAt = new Date();
      if (!(await governance.allowed('VISION', provider.name))) {
        await governance.record({
          capability: 'VISION',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: 'FALLBACK',
          errorClass: 'DISABLED',
          startedAt,
        });
        throw new AiProviderUnavailableError('Vision disabled by governance control');
      }
      try {
        const result = await provider.recognize(images);
        const candidates = result.flatMap((item) => item.candidates);
        await governance.record({
          capability: 'VISION',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: result.some((item) => item.error) ? 'FALLBACK' : 'SUCCESS',
          errorClass: result.some((item) => item.error) ? 'PARTIAL_PROVIDER_ERROR' : null,
          startedAt,
          confidence: candidates.length
            ? candidates.reduce((sum, item) => sum + item.confidence, 0) / candidates.length
            : null,
          coverage: result.length
            ? result.filter((item) => !item.error).length / result.length
            : null,
        });
        return result;
      } catch (error) {
        await governance.record({
          capability: 'VISION',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw error;
      }
    },
  };
}

export function governReceiptProvider(
  provider: ReceiptExtractionProvider,
  governance: AiGovernanceService,
): ReceiptExtractionProvider {
  return {
    name: provider.name,
    model: provider.model,
    templateVersion: provider.templateVersion,
    async extract(images): Promise<ReceiptProviderImageResult[]> {
      const startedAt = new Date();
      if (!(await governance.allowed('RECEIPT', provider.name))) {
        await governance.record({
          capability: 'RECEIPT',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: 'FALLBACK',
          errorClass: 'DISABLED',
          startedAt,
        });
        throw new AiProviderUnavailableError('Receipt extraction disabled by governance control');
      }
      try {
        const result = await provider.extract(images);
        await governance.record({
          capability: 'RECEIPT',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: result.some((item) => item.error) ? 'FALLBACK' : 'SUCCESS',
          errorClass: result.some((item) => item.error) ? 'PARTIAL_PROVIDER_ERROR' : null,
          startedAt,
          coverage: result.length
            ? result.filter((item) => !item.error).length / result.length
            : null,
        });
        return result;
      } catch (error) {
        await governance.record({
          capability: 'RECEIPT',
          provider: provider.name,
          modelId: provider.model,
          templateVersion: provider.templateVersion,
          status: 'FAILED',
          errorClass: 'PROVIDER_UNAVAILABLE',
          startedAt,
        });
        throw error;
      }
    },
  };
}
