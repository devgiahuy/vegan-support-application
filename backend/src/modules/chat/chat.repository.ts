import { lockDocument } from '../../database/locking.js';
import {
  AiRequestStatus,
  ChatMessageRole,
  ChatMessageStatus,
  type ChatFeedbackValue,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type { ChatIdentity } from './chat.identity.js';
import { aiCorrelationId } from '../ai-governance/ai-governance.context.js';

const messageInclude = { feedback: true } satisfies Prisma.ChatMessageInclude;
export type ChatMessageRecord = Prisma.ChatMessageGetPayload<{ include: typeof messageInclude }>;

const sessionOwnerWhere = (identity: ChatIdentity) =>
  identity.type === 'AUTHENTICATED'
    ? { userId: identity.userId }
    : { guestIdHash: identity.guestIdHash, expiresAt: { gt: new Date() } };

export class ChatIdempotencyConflictError extends Error {}
export class ChatRequestInProgressError extends Error {}

export interface PreparedTurn {
  requestMessage: ChatMessageRecord;
  assistantMessage: ChatMessageRecord;
  replayed: boolean;
}

export interface QuotaBucketState {
  successfulCount: number;
  quotaLimit: number;
  reservationKey: string | null;
  reservationExpiresAt: Date | null;
}

export class ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async purgeExpiredGuestHistory(now: Date): Promise<void> {
    await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.chatSession.deleteMany({
          where: { guestIdHash: { not: null }, expiresAt: { lte: now } },
        }),
        transaction.aiRateLimitBucket.deleteMany({
          where: { windowStart: { lt: new Date(now.getTime() - 86_400_000) } },
        }),
      ]),
    );
  }

  createSession(identity: ChatIdentity, title: string, expiresAt: Date | null) {
    return this.prisma.chatSession.create({
      data: {
        ...(identity.type === 'AUTHENTICATED'
          ? { userId: identity.userId }
          : { guestIdHash: identity.guestIdHash, expiresAt }),
        title,
      },
    });
  }

  async listSessions(userId: string, page: number, limit: number) {
    const where = { userId, deletedAt: null };
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.chatSession.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        transaction.chatSession.count({ where }),
      ]),
    );
    return { records, total };
  }

  findOwnedSession(identity: ChatIdentity, id: string) {
    return this.prisma.chatSession.findFirst({
      where: { id, deletedAt: null, ...sessionOwnerWhere(identity) },
    });
  }

  async listMessages(identity: ChatIdentity, sessionId: string, page: number, limit: number) {
    const session = await this.findOwnedSession(identity, sessionId);
    if (!session) return null;
    const where = {
      sessionId,
      status: { in: [ChatMessageStatus.COMPLETED, ChatMessageStatus.FAILED] },
    };
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.chatMessage.findMany({
          where,
          include: messageInclude,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        transaction.chatMessage.count({ where }),
      ]),
    );
    return { records, total };
  }

  async prepareTurn(
    identity: ChatIdentity,
    sessionId: string,
    idempotencyKey: string,
    payloadHash: string,
    content: string,
    topicCodes: Prisma.InputJsonValue,
    staleBefore: Date,
  ): Promise<PreparedTurn | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'chatSession', { id: sessionId });
      const session = await transaction.chatSession.findFirst({
        where: { id: sessionId, deletedAt: null, ...sessionOwnerWhere(identity) },
        select: { id: true },
      });
      if (!session) return null;

      const existing = await transaction.chatMessage.findUnique({
        where: { sessionId_idempotencyKey: { sessionId, idempotencyKey } },
        include: {
          ...messageInclude,
          responseMessage: { include: messageInclude },
        },
      });
      if (existing) {
        if (existing.payloadHash !== payloadHash) throw new ChatIdempotencyConflictError();
        const response = existing.responseMessage;
        if (!response) throw new ChatRequestInProgressError();
        if (response.status === ChatMessageStatus.COMPLETED) {
          return { requestMessage: existing, assistantMessage: response, replayed: true };
        }
        if (response.status === ChatMessageStatus.PENDING && response.updatedAt > staleBefore) {
          throw new ChatRequestInProgressError();
        }
        const reset = await transaction.chatMessage.update({
          where: { id: response.id },
          data: {
            status: ChatMessageStatus.PENDING,
            content: '',
            provider: null,
            modelId: null,
            providerResponseId: null,
            fallback: false,
            completedAt: null,
          },
          include: messageInclude,
        });
        return { requestMessage: existing, assistantMessage: reset, replayed: false };
      }

      const requestMessage = await transaction.chatMessage.create({
        data: {
          sessionId,
          role: ChatMessageRole.USER,
          status: ChatMessageStatus.COMPLETED,
          content,
          idempotencyKey,
          payloadHash,
          topicCodes,
          completedAt: new Date(),
        },
        include: messageInclude,
      });
      const assistantMessage = await transaction.chatMessage.create({
        data: {
          sessionId,
          role: ChatMessageRole.ASSISTANT,
          status: ChatMessageStatus.PENDING,
          content: '',
          requestMessageId: requestMessage.id,
          topicCodes,
        },
        include: messageInclude,
      });
      await transaction.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
      return { requestMessage, assistantMessage, replayed: false };
    });
  }

  findHistory(sessionId: string, currentRequestMessageId: string, limit: number) {
    return this.prisma.chatMessage
      .findMany({
        where: {
          sessionId,
          status: ChatMessageStatus.COMPLETED,
          OR: [
            { role: ChatMessageRole.ASSISTANT },
            { role: ChatMessageRole.USER, id: currentRequestMessageId },
            {
              role: ChatMessageRole.USER,
              responseMessage: { is: { status: ChatMessageStatus.COMPLETED } },
            },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      })
      .then((messages) => messages.reverse());
  }

  findPromptProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        personalizationPreference: { select: { enabled: true, consentVersion: true } },
        dietPreference: {
          select: { dietPattern: true, practiceSchedule: true, tradition: true },
        },
        allergies: {
          where: { active: true },
          select: { allergenCode: true },
          orderBy: { allergenCode: 'asc' },
        },
      },
    });
  }

  async reserveQuota(
    subjectKey: string,
    usageDate: Date,
    quotaLimit: number,
    reservationKey: string,
    reservationExpiresAt: Date,
  ): Promise<QuotaBucketState> {
    return this.prisma.$transaction(async (transaction) => {
      const where = { subjectKey_usageDate: { subjectKey, usageDate } };
      const existing = await transaction.aiQuotaBucket.findUnique({ where });
      const now = new Date();
      if (
        existing &&
        (existing.successfulCount >= quotaLimit ||
          (existing.reservationKey !== null &&
            existing.reservationKey !== reservationKey &&
            existing.reservationExpiresAt !== null &&
            existing.reservationExpiresAt > now))
      )
        return existing;
      return transaction.aiQuotaBucket.upsert({
        where,
        create: { subjectKey, usageDate, quotaLimit, reservationKey, reservationExpiresAt },
        update: { quotaLimit, reservationKey, reservationExpiresAt },
      });
    });
  }

  async completeQuota(
    subjectKey: string,
    usageDate: Date,
    reservationKey: string,
  ): Promise<QuotaBucketState> {
    return this.prisma.$transaction(async (transaction) => {
      const where = { subjectKey_usageDate: { subjectKey, usageDate } };
      const bucket = await transaction.aiQuotaBucket.findUniqueOrThrow({ where });
      if (bucket.reservationKey !== reservationKey || bucket.successfulCount >= bucket.quotaLimit)
        return bucket;
      return transaction.aiQuotaBucket.update({
        where,
        data: {
          successfulCount: { increment: 1 },
          reservationKey: null,
          reservationExpiresAt: null,
        },
      });
    });
  }

  async releaseQuota(subjectKey: string, usageDate: Date, reservationKey: string): Promise<void> {
    await this.prisma.aiQuotaBucket.updateMany({
      where: { subjectKey, usageDate, reservationKey },
      data: { reservationKey: null, reservationExpiresAt: null },
    });
  }

  quotaState(subjectKey: string, usageDate: Date): Promise<QuotaBucketState> {
    return this.prisma.aiQuotaBucket.findUniqueOrThrow({
      where: { subjectKey_usageDate: { subjectKey, usageDate } },
      select: {
        successfulCount: true,
        quotaLimit: true,
        reservationKey: true,
        reservationExpiresAt: true,
      },
    });
  }

  findQuotaState(subjectKey: string, usageDate: Date): Promise<QuotaBucketState | null> {
    return this.prisma.aiQuotaBucket.findUnique({
      where: { subjectKey_usageDate: { subjectKey, usageDate } },
      select: {
        successfulCount: true,
        quotaLimit: true,
        reservationKey: true,
        reservationExpiresAt: true,
      },
    });
  }

  async consumeGuestRateLimit(keyHash: string, windowStart: Date, limit: number): Promise<number> {
    return this.prisma.$transaction(async (transaction) => {
      const where = { keyHash_windowStart: { keyHash, windowStart } };
      const existing = await transaction.aiRateLimitBucket.findUnique({ where });
      if (existing && existing.count >= limit) return 0;
      const bucket = await transaction.aiRateLimitBucket.upsert({
        where,
        create: { keyHash, windowStart, count: 1 },
        update: { count: { increment: 1 } },
      });
      return bucket.count;
    });
  }

  upsertRequestLog(data: {
    identity: ChatIdentity;
    sessionId: string;
    requestMessageId: string;
    provider: string;
    modelId: string;
    redactedMetadata: Prisma.InputJsonValue;
    startedAt: Date;
  }) {
    return this.prisma.aiRequestLog.upsert({
      where: { requestMessageId: data.requestMessageId },
      create: {
        sessionId: data.sessionId,
        requestMessageId: data.requestMessageId,
        ...(data.identity.type === 'AUTHENTICATED'
          ? { userId: data.identity.userId }
          : { guestIdHash: data.identity.guestIdHash }),
        provider: data.provider,
        modelId: data.modelId,
        status: AiRequestStatus.IN_PROGRESS,
        providerCallCount: 0,
        redactedMetadata: data.redactedMetadata,
        startedAt: data.startedAt,
      },
      update: {
        provider: data.provider,
        modelId: data.modelId,
        status: AiRequestStatus.IN_PROGRESS,
        errorCode: null,
        redactedMetadata: data.redactedMetadata,
        startedAt: data.startedAt,
        completedAt: null,
      },
    });
  }

  markProviderCalled(requestMessageId: string) {
    return this.prisma.aiRequestLog.update({
      where: { requestMessageId },
      data: { providerCallCount: { increment: 1 } },
    });
  }

  finishRequestLog(
    requestMessageId: string,
    status: AiRequestStatus,
    data: {
      latencyMs: number;
      inputTokens?: number | null;
      outputTokens?: number | null;
      errorCode?: string;
      redactedMetadata?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.aiRequestLog.update({
      where: { requestMessageId },
      data: {
        status,
        latencyMs: data.latencyMs,
        inputTokens: data.inputTokens ?? null,
        outputTokens: data.outputTokens ?? null,
        ...(data.errorCode ? { errorCode: data.errorCode } : { errorCode: null }),
        ...(data.redactedMetadata ? { redactedMetadata: data.redactedMetadata } : {}),
        completedAt: new Date(),
      },
    });
  }

  async completeSuccessfulTurn(data: {
    subjectKey: string;
    usageDate: Date;
    reservationKey: string;
    assistantMessageId: string;
    content: string;
    provider: string;
    modelId: string;
    providerResponseId: string;
    requestMessageId: string;
    latencyMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
  }): Promise<{ message: ChatMessageRecord; quota: QuotaBucketState }> {
    return this.prisma.$transaction(async (transaction) => {
      const where = {
        subjectKey_usageDate: { subjectKey: data.subjectKey, usageDate: data.usageDate },
      };
      const bucket = await transaction.aiQuotaBucket.findUniqueOrThrow({ where });
      if (
        bucket.reservationKey !== data.reservationKey ||
        bucket.successfulCount >= bucket.quotaLimit
      )
        throw new Error('AI_QUOTA_RESERVATION_LOST');
      const quota = await transaction.aiQuotaBucket.update({
        where,
        data: {
          successfulCount: { increment: 1 },
          reservationKey: null,
          reservationExpiresAt: null,
        },
      });
      const message = await transaction.chatMessage.update({
        where: { id: data.assistantMessageId },
        data: {
          status: ChatMessageStatus.COMPLETED,
          content: data.content,
          provider: data.provider,
          modelId: data.modelId,
          providerResponseId: data.providerResponseId,
          fallback: false,
          completedAt: new Date(),
        },
        include: messageInclude,
      });
      await transaction.aiRequestLog.update({
        where: { requestMessageId: data.requestMessageId },
        data: {
          status: AiRequestStatus.SUCCESS,
          latencyMs: data.latencyMs,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          errorCode: null,
          completedAt: new Date(),
        },
      });
      return { message, quota };
    });
  }

  async completeNonQuotaTurn(data: {
    subjectKey?: string;
    usageDate?: Date;
    reservationKey?: string;
    assistantMessageId: string;
    content: string;
    provider: string;
    modelId: string;
    requestMessageId: string;
    requestStatus: AiRequestStatus;
    latencyMs: number;
    errorCode?: string;
    redactedMetadata?: Prisma.InputJsonValue;
  }): Promise<ChatMessageRecord> {
    return this.prisma.$transaction(async (transaction) => {
      if (data.subjectKey && data.usageDate && data.reservationKey) {
        await transaction.aiQuotaBucket.updateMany({
          where: {
            subjectKey: data.subjectKey,
            usageDate: data.usageDate,
            reservationKey: data.reservationKey,
          },
          data: { reservationKey: null, reservationExpiresAt: null },
        });
      }
      const message = await transaction.chatMessage.update({
        where: { id: data.assistantMessageId },
        data: {
          status: ChatMessageStatus.COMPLETED,
          content: data.content,
          provider: data.provider,
          modelId: data.modelId,
          fallback: true,
          completedAt: new Date(),
        },
        include: messageInclude,
      });
      await transaction.aiRequestLog.update({
        where: { requestMessageId: data.requestMessageId },
        data: {
          status: data.requestStatus,
          latencyMs: data.latencyMs,
          errorCode: data.errorCode ?? null,
          ...(data.redactedMetadata ? { redactedMetadata: data.redactedMetadata } : {}),
          completedAt: new Date(),
        },
      });
      const completedAt = new Date();
      await transaction.aiGovernanceEvent.create({
        data: {
          capability: 'CHAT',
          provider: data.provider,
          modelId: data.modelId,
          templateVersion: data.provider === 'local-rule' ? data.modelId : null,
          correlationId: aiCorrelationId(),
          status: data.requestStatus === AiRequestStatus.BLOCKED ? 'BLOCKED' : 'FALLBACK',
          errorClass: data.errorCode ?? null,
          safetyOutcome:
            data.requestStatus === AiRequestStatus.BLOCKED ? 'LOCAL_BLOCK' : 'STATIC_ADVISORY',
          latencyMs: data.latencyMs,
          startedAt: new Date(completedAt.getTime() - data.latencyMs),
          completedAt,
        },
      });
      return message;
    });
  }

  completeAssistant(
    id: string,
    data: {
      content: string;
      provider: string;
      modelId: string;
      providerResponseId?: string;
      fallback: boolean;
    },
  ): Promise<ChatMessageRecord> {
    return this.prisma.chatMessage.update({
      where: { id },
      data: {
        status: ChatMessageStatus.COMPLETED,
        content: data.content,
        provider: data.provider,
        modelId: data.modelId,
        providerResponseId: data.providerResponseId ?? null,
        fallback: data.fallback,
        completedAt: new Date(),
      },
      include: messageInclude,
    });
  }

  failAssistant(id: string, partialContent: string): Promise<ChatMessageRecord> {
    return this.prisma.chatMessage.update({
      where: { id },
      data: {
        status: ChatMessageStatus.FAILED,
        content: partialContent,
        completedAt: new Date(),
      },
      include: messageInclude,
    });
  }

  async findOwnedAssistantMessage(identity: ChatIdentity, id: string) {
    return this.prisma.chatMessage.findFirst({
      where: {
        id,
        role: ChatMessageRole.ASSISTANT,
        status: ChatMessageStatus.COMPLETED,
        session: { is: { deletedAt: null, ...sessionOwnerWhere(identity) } },
      },
      include: messageInclude,
    });
  }

  upsertFeedback(messageId: string, value: ChatFeedbackValue, reason?: string) {
    return this.prisma.chatFeedback.upsert({
      where: { messageId },
      create: { messageId, value, ...(reason ? { reason } : {}) },
      update: { value, reason: reason ?? null },
    });
  }
}
