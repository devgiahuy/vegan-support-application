import { createHash } from 'node:crypto';
import { AiRequestStatus, ChatMessageRole, Role, type ChatSession } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import {
  PERSONALIZATION_CONSENT_VERSION,
  type TopicCode,
} from '../recommendations/recommendation.schemas.js';
import type { RecommendationService } from '../recommendations/recommendation.service.js';
import type { AiProvider } from './ai-provider.js';
import type { ChatIdentity } from './chat.identity.js';
import {
  ChatIdempotencyConflictError,
  ChatRequestInProgressError,
  type ChatMessageRecord,
  type ChatRepository,
  type QuotaBucketState,
} from './chat.repository.js';
import {
  CHAT_DISCLAIMER,
  type ChatFeedbackInput,
  type ChatListQuery,
  type ChatMessageListQuery,
  type ChatSseEvent,
  type CreateChatSessionInput,
  type SendChatMessageInput,
} from './chat.schemas.js';

const CHAT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const HISTORY_LIMIT = 20;
const OUT_OF_SCOPE_RESPONSE =
  'M�nh ch? h? tr? c�c c�u h?i v? dinh du?ng v� an chay. B?n c� th? h?i v? kh?u ph?n, ngu?n d?m th?c v?t, vitamin, kho�ng ch?t ho?c c�ch x�y d?ng b?a an chay c�n b?ng.';
const SAFETY_RESPONSE =
  'N?i dung n�y c?n du?c chuy�n gia y t? d�nh gi� tr?c ti?p. N?u b?n ho?c ngu?i kh�c dang g?p nguy hi?m, h�y li�n h? d?ch v? c?p c?u d?a phuong ho?c co s? y t? g?n nh?t ngay b�y gi?.';
const PROVIDER_FALLBACK_RESPONSE =
  'D?ch v? tu v?n AI dang t?m th?i kh�ng kh? d?ng. B?n v?n c� th? d�ng t�m ki?m c�ng th?c v� Meal Planner theo quy t?c an to�n, ho?c th? l?i sau.';
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const PHONE_PATTERN = /(?<!\d)(?:\+?84|0)(?:[ .-]?\d){8,10}(?!\d)/gu;

const TOPIC_TERMS: Array<[TopicCode, string[]]> = [
  ['TOFU', ['dau hu', 'tofu']],
  ['MUSHROOM', ['nam']],
  ['PROTEIN', ['protein', 'chat dam', 'dam thuc vat']],
  ['QUICK_MEALS', ['nhanh', 'tien loi', 'it thoi gian']],
  ['BREAKFAST', ['bua sang', 'an sang']],
  ['DINNER', ['bua toi', 'an toi']],
  ['LOW_CALORIE', ['it calo', 'giam can', 'calorie thap']],
  ['WHOLE_GRAINS', ['gao lut', 'ngu coc nguyen hat']],
  ['VEGETABLES', ['rau', 'cu qua', 'vegetable']],
];

const NUTRITION_TERMS = [
  'an chay',
  'vegan',
  'dinh duong',
  'thuc pham',
  'bua an',
  'mon an',
  'protein',
  'chat dam',
  'calo',
  'calorie',
  'vitamin',
  'khoang chat',
  'b12',
  'sat',
  'canxi',
  'dau hu',
  'rau',
  'nam',
  'gao lut',
  'di ung',
  'giam can',
  'tang can',
  'bmi',
  'tdee',
  'xin chao',
  'chao ban',
];

const URGENT_TERMS = [
  'tu tu',
  'giet nguoi',
  'dau nguc',
  'kho tho',
  'soc phan ve',
  'ngat xiu',
  'cap cuu',
];

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function redactPii(value: string): string {
  return value.replace(EMAIL_PATTERN, '[EMAIL_REDACTED]').replace(PHONE_PATTERN, '[PHONE_REDACTED]');
}

function datePartsInTimezone(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function quotaWindow(now: Date): { usageDate: Date; resetAt: Date } {
  const { year, month, day } = datePartsInTimezone(now);
  const usageDate = new Date(Date.UTC(year, month - 1, day));
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const resetAt = new Date(`${nextDate.toISOString().slice(0, 10)}T00:00:00.000+07:00`);
  return { usageDate, resetAt };
}

function topicCodes(content: string): TopicCode[] {
  const normalized = normalizeVietnameseText(content);
  return TOPIC_TERMS.filter(([, terms]) => terms.some((term) => normalized.includes(term))).map(
    ([code]) => code,
  );
}

function isNutritionScope(content: string): boolean {
  const normalized = normalizeVietnameseText(content);
  return NUTRITION_TERMS.some((term) => normalized.includes(term));
}

function isUrgent(content: string): boolean {
  const normalized = normalizeVietnameseText(content);
  return URGENT_TERMS.some((term) => normalized.includes(term));
}

export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly provider: AiProvider,
    private readonly recommendationService: RecommendationService,
    private readonly config: AppConfig,
  ) {}

  async createSession(identity: ChatIdentity, input: CreateChatSessionInput) {
    const now = new Date();
    await this.repository.purgeExpiredGuestHistory(now);
    const expiresAt =
      identity.type === 'GUEST'
        ? new Date(now.getTime() + this.config.ai.guestCookieTtlDays * 86_400_000)
        : null;
    return this.sessionOutput(
      await this.repository.createSession(
        identity,
        input.title ?? 'Cu?c tr� chuy?n dinh du?ng',
        expiresAt,
      ),
    );
  }

  async listSessions(identity: ChatIdentity, query: ChatListQuery) {
    if (identity.type !== 'AUTHENTICATED') throw this.authRequired();
    const result = await this.repository.listSessions(identity.userId, query.page, query.limit);
    return {
      data: result.records.map((session) => this.sessionOutput(session)),
      meta: this.pagination(query.page, query.limit, result.total),
    };
  }

  async listMessages(identity: ChatIdentity, sessionId: string, query: ChatMessageListQuery) {
    await this.repository.purgeExpiredGuestHistory(new Date());
    const result = await this.repository.listMessages(identity, sessionId, query.page, query.limit);
    if (!result) throw this.notFound();
    return {
      data: result.records.map((message) => this.messageOutput(message)),
      meta: this.pagination(query.page, query.limit, result.total),
    };
  }

  async feedback(identity: ChatIdentity, messageId: string, input: ChatFeedbackInput) {
    await this.repository.purgeExpiredGuestHistory(new Date());
    const message = await this.repository.findOwnedAssistantMessage(identity, messageId);
    if (!message) throw this.notFound();
    const feedback = await this.repository.upsertFeedback(messageId, input.value, input.reason);
    return {
      messageId,
      value: feedback.value,
      reason: feedback.reason,
      updatedAt: feedback.updatedAt.toISOString(),
    };
  }

  async prepareStream(
    identity: ChatIdentity,
    sessionId: string,
    input: SendChatMessageInput,
    clientSignal: AbortSignal,
  ): Promise<AsyncIterable<ChatSseEvent>> {
    if (!this.config.ai.chatEnabled) {
      throw new AppError({
        statusCode: 503,
        code: 'AI_FEATURE_DISABLED',
        message: 'Chatbot dang t?m ngung',
      });
    }
    const now = new Date();
    await this.repository.purgeExpiredGuestHistory(now);
    if (identity.type === 'GUEST') await this.enforceGuestRateLimit(identity, now);

    const topics = topicCodes(input.content);
    const payloadHash = sha256({ content: input.content });
    let turn;
    try {
      turn = await this.repository.prepareTurn(
        identity,
        sessionId,
        input.idempotencyKey,
        payloadHash,
        input.content,
        topics,
        new Date(now.getTime() - this.config.ai.timeoutMs - 10_000),
      );
    } catch (error) {
      if (error instanceof ChatIdempotencyConflictError) {
        throw new AppError({
          statusCode: 409,
          code: 'CHAT_IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key d� du?c d�ng cho n?i dung kh�c',
        });
      }
      if (error instanceof ChatRequestInProgressError) {
        throw new AppError({
          statusCode: 409,
          code: 'CHAT_REQUEST_IN_PROGRESS',
          message: 'Y�u c?u chat v?i idempotency key n�y dang du?c x? l�',
        });
      }
      throw error;
    }
    if (!turn) throw this.notFound();
    if (turn.replayed) return this.replay(turn.requestMessage, turn.assistantMessage, identity);

    if (isUrgent(input.content)) {
      return this.completeLocalTurn(
        identity,
        turn.requestMessage,
        turn.assistantMessage,
        SAFETY_RESPONSE,
        AiRequestStatus.BLOCKED,
        'URGENT_HEALTH_SAFETY',
      );
    }
    if (!isNutritionScope(input.content)) {
      return this.completeLocalTurn(
        identity,
        turn.requestMessage,
        turn.assistantMessage,
        OUT_OF_SCOPE_RESPONSE,
        AiRequestStatus.BLOCKED,
        'OUT_OF_SCOPE',
      );
    }

    const window = quotaWindow(now);
    const limit = this.quotaLimit(identity);
    const reserved = await this.repository.reserveQuota(
      identity.subjectKey,
      window.usageDate,
      limit,
      turn.assistantMessage.id,
      new Date(now.getTime() + this.config.ai.timeoutMs + 10_000),
    );
    if (reserved.reservationKey !== turn.assistantMessage.id) {
      await this.repository.failAssistant(turn.assistantMessage.id, '');
      if (reserved.successfulCount >= reserved.quotaLimit) {
        throw new AppError({
          statusCode: 429,
          code: 'AI_QUOTA_EXCEEDED',
          message: '�� h?t quota chatbot h�m nay',
          fields: {
            limit: [String(reserved.quotaLimit)],
            resetAt: [window.resetAt.toISOString()],
            ...(identity.type === 'GUEST' ? { cta: ['REGISTER'] } : {}),
          },
        });
      }
      throw new AppError({
        statusCode: 409,
        code: 'CHAT_REQUEST_IN_PROGRESS',
        message: 'M?t y�u c?u chat kh�c dang du?c x? l� cho t�i kho?n n�y',
      });
    }

    const profile =
      identity.type === 'AUTHENTICATED'
        ? await this.repository.findPromptProfile(identity.userId)
        : null;
    const personalized = Boolean(
      profile?.personalizationPreference?.enabled &&
      profile.personalizationPreference.consentVersion === PERSONALIZATION_CONSENT_VERSION,
    );
    const history = await this.repository.findHistory(
      sessionId,
      turn.requestMessage.id,
      HISTORY_LIMIT,
    );
    await this.repository.upsertRequestLog({
      identity,
      sessionId,
      requestMessageId: turn.requestMessage.id,
      provider: this.provider.name,
      modelId: this.provider.chatModel,
      redactedMetadata: {
        promptHash: payloadHash,
        topicCodes: topics,
        personalizedContext: personalized,
        historyMessageCount: history.length,
      },
      startedAt: now,
    });
    return this.providerStream({
      identity,
      requestMessage: turn.requestMessage,
      assistantMessage: turn.assistantMessage,
      history,
      instructions: this.instructions(profile, personalized),
      topics,
      window,
      clientSignal,
      startedAt: now,
    });
  }

  private async *providerStream(data: {
    identity: ChatIdentity;
    requestMessage: ChatMessageRecord;
    assistantMessage: ChatMessageRecord;
    history: Array<{ role: ChatMessageRole; content: string }>;
    instructions: string;
    topics: TopicCode[];
    window: { usageDate: Date; resetAt: Date };
    clientSignal: AbortSignal;
    startedAt: Date;
  }): AsyncIterable<ChatSseEvent> {
    const controller = new AbortController();
    const onClientAbort = () => controller.abort(data.clientSignal.reason);
    data.clientSignal.addEventListener('abort', onClientAbort, { once: true });
    if (data.clientSignal.aborted) onClientAbort();
    const timeout = setTimeout(
      () => controller.abort(new Error('AI_PROVIDER_TIMEOUT')),
      this.config.ai.timeoutMs,
    );
    let content = '';
    let responseId = '';
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let settled = false;
    try {
      yield {
        event: 'message_start',
        data: {
          requestMessageId: data.requestMessage.id,
          assistantMessageId: data.assistantMessage.id,
          replayed: false,
        },
      };
      await this.repository.markProviderCalled(data.requestMessage.id);
      const moderation = await this.provider.moderate(
        redactPii(data.requestMessage.content),
        controller.signal,
      );
      if (moderation.unavailable) {
        const message = await this.repository.completeNonQuotaTurn({
          subjectKey: data.identity.subjectKey,
          usageDate: data.window.usageDate,
          reservationKey: data.assistantMessage.id,
          assistantMessageId: data.assistantMessage.id,
          content: PROVIDER_FALLBACK_RESPONSE,
          provider: 'local-fallback',
          modelId: this.config.ai.fallbackModel,
          requestMessageId: data.requestMessage.id,
          requestStatus: AiRequestStatus.FALLBACK,
          latencyMs: Date.now() - data.startedAt.getTime(),
          errorCode: 'AI_PROVIDER_UNAVAILABLE',
        });
        settled = true;
        yield { event: 'content_delta', data: { delta: PROVIDER_FALLBACK_RESPONSE } };
        const quota = await this.currentQuota(data.identity, data.window);
        yield { event: 'message_complete', data: { message: this.messageOutput(message), quota } };
        yield { event: 'quota', data: quota };
        return;
      }
      if (moderation.flagged) {
        const message = await this.repository.completeNonQuotaTurn({
          subjectKey: data.identity.subjectKey,
          usageDate: data.window.usageDate,
          reservationKey: data.assistantMessage.id,
          assistantMessageId: data.assistantMessage.id,
          content: SAFETY_RESPONSE,
          provider: this.provider.name,
          modelId: this.config.ai.moderationModel,
          requestMessageId: data.requestMessage.id,
          requestStatus: AiRequestStatus.BLOCKED,
          latencyMs: Date.now() - data.startedAt.getTime(),
          errorCode: 'MODERATION_FLAGGED',
        });
        settled = true;
        yield { event: 'content_delta', data: { delta: SAFETY_RESPONSE } };
        const quota = await this.currentQuota(data.identity, data.window);
        yield { event: 'message_complete', data: { message: this.messageOutput(message), quota } };
        yield { event: 'quota', data: quota };
        return;
      }

      await this.repository.markProviderCalled(data.requestMessage.id);
      for await (const chunk of this.provider.streamChat({
        instructions: data.instructions,
        messages: data.history.map((message) => ({
          role: message.role === ChatMessageRole.USER ? ('user' as const) : ('assistant' as const),
          content: redactPii(message.content),
        })),
        signal: controller.signal,
      })) {
        if (chunk.type === 'delta') {
          content += chunk.delta;
          yield { event: 'content_delta', data: { delta: chunk.delta } };
        } else {
          responseId = chunk.responseId;
          inputTokens = chunk.inputTokens;
          outputTokens = chunk.outputTokens;
        }
      }
      if (!content.trim() || !responseId) throw new Error('AI_PROVIDER_EMPTY_RESPONSE');
      const completed = await this.repository.completeSuccessfulTurn({
        subjectKey: data.identity.subjectKey,
        usageDate: data.window.usageDate,
        reservationKey: data.assistantMessage.id,
        assistantMessageId: data.assistantMessage.id,
        content,
        provider: this.provider.name,
        modelId: this.provider.chatModel,
        providerResponseId: responseId,
        requestMessageId: data.requestMessage.id,
        latencyMs: Date.now() - data.startedAt.getTime(),
        inputTokens,
        outputTokens,
      });
      settled = true;
      await this.emitChatTopics(data.identity, data.requestMessage.id, data.topics);
      const quota = this.quotaOutput(completed.quota, data.window.resetAt);
      yield {
        event: 'message_complete',
        data: { message: this.messageOutput(completed.message), quota },
      };
      yield { event: 'quota', data: quota };
    } catch (error) {
      if (settled) throw error;
      const aborted = controller.signal.aborted;
      if (aborted && data.clientSignal.aborted) {
        await this.repository.releaseQuota(
          data.identity.subjectKey,
          data.window.usageDate,
          data.assistantMessage.id,
        );
        await this.repository.failAssistant(data.assistantMessage.id, content);
        await this.repository.finishRequestLog(data.requestMessage.id, AiRequestStatus.ABORTED, {
          latencyMs: Date.now() - data.startedAt.getTime(),
          errorCode: 'CLIENT_ABORTED',
        });
        settled = true;
        return;
      }
      const errorCode = aborted ? 'AI_PROVIDER_TIMEOUT' : 'AI_PROVIDER_UNAVAILABLE';
      if (!content) {
        const message = await this.repository.completeNonQuotaTurn({
          subjectKey: data.identity.subjectKey,
          usageDate: data.window.usageDate,
          reservationKey: data.assistantMessage.id,
          assistantMessageId: data.assistantMessage.id,
          content: PROVIDER_FALLBACK_RESPONSE,
          provider: 'local-fallback',
          modelId: this.config.ai.fallbackModel,
          requestMessageId: data.requestMessage.id,
          requestStatus: AiRequestStatus.FALLBACK,
          latencyMs: Date.now() - data.startedAt.getTime(),
          errorCode,
          redactedMetadata: {
            promptHash: sha256({ content: data.requestMessage.content }),
            topicCodes: data.topics,
            fallbackReason: errorCode,
          },
        });
        settled = true;
        yield { event: 'content_delta', data: { delta: PROVIDER_FALLBACK_RESPONSE } };
        const quota = await this.currentQuota(data.identity, data.window);
        yield { event: 'message_complete', data: { message: this.messageOutput(message), quota } };
        yield { event: 'quota', data: quota };
        return;
      }
      await this.repository.releaseQuota(
        data.identity.subjectKey,
        data.window.usageDate,
        data.assistantMessage.id,
      );
      await this.repository.failAssistant(data.assistantMessage.id, content);
      await this.repository.finishRequestLog(data.requestMessage.id, AiRequestStatus.FAILED, {
        latencyMs: Date.now() - data.startedAt.getTime(),
        errorCode,
      });
      settled = true;
      yield {
        event: 'error',
        data: {
          code: errorCode,
          message: 'Lu?ng AI b? gi�n do?n, quota chua b? tr?',
          retryable: true,
          partial: true,
        },
      };
    } finally {
      if (!settled) {
        await Promise.allSettled([
          this.repository.releaseQuota(
            data.identity.subjectKey,
            data.window.usageDate,
            data.assistantMessage.id,
          ),
          this.repository.failAssistant(data.assistantMessage.id, content),
          this.repository.finishRequestLog(data.requestMessage.id, AiRequestStatus.ABORTED, {
            latencyMs: Date.now() - data.startedAt.getTime(),
            errorCode: 'STREAM_CLOSED',
          }),
        ]);
      }
      clearTimeout(timeout);
      data.clientSignal.removeEventListener('abort', onClientAbort);
    }
  }

  private async completeLocalTurn(
    identity: ChatIdentity,
    requestMessage: ChatMessageRecord,
    assistantMessage: ChatMessageRecord,
    content: string,
    status: AiRequestStatus,
    reason: string,
  ): Promise<AsyncIterable<ChatSseEvent>> {
    const startedAt = new Date();
    await this.repository.upsertRequestLog({
      identity,
      sessionId: requestMessage.sessionId,
      requestMessageId: requestMessage.id,
      provider: 'local-rule',
      modelId: this.config.ai.topicRuleVersion,
      redactedMetadata: {
        promptHash: requestMessage.payloadHash,
        topicCodes: requestMessage.topicCodes,
        blockReason: reason,
      },
      startedAt,
    });
    const message = await this.repository.completeNonQuotaTurn({
      assistantMessageId: assistantMessage.id,
      content,
      provider: 'local-rule',
      modelId: this.config.ai.topicRuleVersion,
      requestMessageId: requestMessage.id,
      requestStatus: status,
      latencyMs: Date.now() - startedAt.getTime(),
      errorCode: reason,
    });
    return this.completedEvents(requestMessage, message, identity, false);
  }

  private replay(
    requestMessage: ChatMessageRecord,
    assistantMessage: ChatMessageRecord,
    identity: ChatIdentity,
  ): Promise<AsyncIterable<ChatSseEvent>> {
    return Promise.resolve(this.completedEvents(requestMessage, assistantMessage, identity, true));
  }

  private async *completedEvents(
    requestMessage: ChatMessageRecord,
    assistantMessage: ChatMessageRecord,
    identity: ChatIdentity,
    replayed: boolean,
  ): AsyncIterable<ChatSseEvent> {
    yield {
      event: 'message_start',
      data: {
        requestMessageId: requestMessage.id,
        assistantMessageId: assistantMessage.id,
        replayed,
      },
    };
    if (assistantMessage.content) {
      yield { event: 'content_delta', data: { delta: assistantMessage.content } };
    }
    const window = quotaWindow(new Date());
    const quota = await this.currentQuota(identity, window);
    yield {
      event: 'message_complete',
      data: { message: this.messageOutput(assistantMessage), quota },
    };
    yield { event: 'quota', data: quota };
  }

  private async enforceGuestRateLimit(
    identity: Extract<ChatIdentity, { type: 'GUEST' }>,
    now: Date,
  ) {
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const count = await this.repository.consumeGuestRateLimit(
      identity.networkKey,
      windowStart,
      this.config.ai.guestRateLimitPerMinute,
    );
    if (count) return;
    throw new AppError({
      statusCode: 429,
      code: 'AI_RATE_LIMITED',
      message: 'Qu� nhi?u y�u c?u chatbot t? thi?t b? ho?c m?ng n�y',
      fields: { retryAfterSeconds: ['60'] },
    });
  }

  private quotaLimit(identity: ChatIdentity): number {
    if (identity.type === 'GUEST') return this.config.ai.guestDailyQuota;
    return identity.role === Role.CONTRIBUTOR || identity.role === Role.ADMIN
      ? this.config.ai.privilegedDailyQuota
      : this.config.ai.memberDailyQuota;
  }

  private async currentQuota(identity: ChatIdentity, window: { usageDate: Date; resetAt: Date }) {
    const state = await this.repository.findQuotaState(identity.subjectKey, window.usageDate);
    return this.quotaOutput(
      state ?? {
        successfulCount: 0,
        quotaLimit: this.quotaLimit(identity),
        reservationKey: null,
        reservationExpiresAt: null,
      },
      window.resetAt,
    );
  }

  private quotaOutput(state: QuotaBucketState, resetAt: Date) {
    return {
      limit: state.quotaLimit,
      used: state.successfulCount,
      remaining: Math.max(0, state.quotaLimit - state.successfulCount),
      resetAt: resetAt.toISOString(),
    };
  }

  private instructions(
    profile: Awaited<ReturnType<ChatRepository['findPromptProfile']>>,
    personalized: boolean,
  ): string {
    const context = personalized
      ? {
          dietPattern: profile?.dietPreference?.dietPattern ?? null,
          practiceSchedule: profile?.dietPreference?.practiceSchedule ?? null,
          tradition: profile?.dietPreference?.tradition ?? null,
          allergenCodes: profile?.allergies.map((item) => item.allergenCode) ?? [],
        }
      : null;
    return [
      'B?n l� tr? l� dinh du?ng an chay b?ng ti?ng Vi?t.',
      'Ch? tr? l?i trong ph?m vi dinh du?ng v� an chay; kh�ng ch?n do�n ho?c thay th? chuy�n gia y t?.',
      'Kh�ng du?c n?i l?ng d? ?ng hay b?a d? li?u s?c kh?e, c�ng th?c ho?c ngu?n tham kh?o.',
      'Tr? l?i ng?n g?n, th?c t? v� n�u r� khi thi?u d? li?u.',
      context
        ? `Context d� consent: ${JSON.stringify(context)}`
        : 'Kh�ng c� profile context du?c consent.',
    ].join('\n');
  }

  private async emitChatTopics(
    identity: ChatIdentity,
    requestMessageId: string,
    topics: TopicCode[],
  ) {
    if (identity.type !== 'AUTHENTICATED' || topics.length === 0) return;
    try {
      await this.recommendationService.ingest(identity.userId, {
        type: 'CHAT_TOPIC',
        idempotencyKey: `chat-topic:${requestMessageId}`,
        metadata: { topicCodes: topics },
      });
    } catch {
      // Chat completion must not fail when personalization is disabled or event persistence is unavailable.
    }
  }

  private sessionOutput(session: ChatSession) {
    return {
      id: session.id,
      title: session.title,
      ownerType: session.userId ? ('AUTHENTICATED' as const) : ('GUEST' as const),
      expiresAt: session.expiresAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private messageOutput(message: ChatMessageRecord) {
    const topics = Array.isArray(message.topicCodes)
      ? message.topicCodes.filter((item): item is TopicCode => typeof item === 'string')
      : [];
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      status: message.status,
      content: message.content,
      provider: message.provider,
      modelId: message.modelId,
      fallback: message.fallback,
      topicCodes: topics,
      disclaimer: message.role === ChatMessageRole.ASSISTANT ? CHAT_DISCLAIMER : null,
      feedback: message.feedback
        ? {
            value: message.feedback.value,
            reason: message.feedback.reason,
            updatedAt: message.feedback.updatedAt.toISOString(),
          }
        : null,
      completedAt: message.completedAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private pagination(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
  }

  private authRequired() {
    return new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui l�ng dang nh?p' });
  }

  private notFound() {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Kh�ng t�m th?y chat' });
  }
}
