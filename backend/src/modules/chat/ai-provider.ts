import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import type { AppConfig } from '../../config/env.js';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatInput {
  instructions: string;
  messages: AiChatMessage[];
  signal: AbortSignal;
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
  moderate(input: string, signal: AbortSignal): Promise<{ flagged: boolean }>;
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
}

export function createAiProvider(config: AppConfig): AiProvider {
  if (config.ai.provider === 'fake') return new FakeAiProvider();
  if (!config.ai.openAiApiKey) return new UnavailableAiProvider(config);
  return new OpenAiProvider(config);
}
