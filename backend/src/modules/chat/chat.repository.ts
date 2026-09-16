import {
  AiRequestStatus,
  ChatMessageRole,
  ChatMessageStatus,
  type ChatFeedbackValue,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type { ChatIdentity } from './chat.identity.js';

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
    await this.prisma.$transaction([
      this.prisma.chatSession.deleteMany({
        where: { guestIdHash: { not: null }, expiresAt: { lte: now } },
      }),
      this.prisma.aiRateLimitBucket.deleteMany({
        where: { windowStart: { lt: new Date(now.getTime() - 86_400_000) } },
      }),
    ]);
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
    const [records, total] = await this.prisma.$transaction([
      this.prisma.chatSession.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatSession.count({ where }),
    ]);
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
    const [records, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where,
        include: messageInclude,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
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
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "chat_sessions" WHERE "id" = ${sessionId}::uuid FOR UPDATE
      `;
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
    const rows = await this.prisma.$queryRaw<QuotaBucketState[]>`
      INSERT INTO "ai_quota_buckets" (
        "subject_key", "usage_date", "successful_count", "quota_limit",
        "reservation_key", "reservation_expires_at", "created_at", "updated_at"
      ) VALUES (
        ${subjectKey}, ${usageDate}, 0, ${quotaLimit}, ${reservationKey},
        ${reservationExpiresAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("subject_key", "usage_date") DO UPDATE SET
        "quota_limit" = EXCLUDED."quota_limit",
        "reservation_key" = EXCLUDED."reservation_key",
        "reservation_expires_at" = EXCLUDED."reservation_expires_at",
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "ai_quota_buckets"."successful_count" < EXCLUDED."quota_limit"
        AND (
          "ai_quota_buckets"."reservation_key" IS NULL
          OR "ai_quota_buckets"."reservation_expires_at" <= CURRENT_TIMESTAMP
          OR "ai_quota_buckets"."reservation_key" = EXCLUDED."reservation_key"
        )
      RETURNING
        "successful_count" AS "successfulCount",
        "quota_limit" AS "quotaLimit",
        "reservation_key" AS "reservationKey",
        "reservation_expires_at" AS "reservationExpiresAt"
    `;
    if (rows[0]) return rows[0];
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

  async completeQuota(
    subjectKey: string,
    usageDate: Date,
    reservationKey: string,
  ): Promise<QuotaBucketState> {
    const rows = await this.prisma.$queryRaw<QuotaBucketState[]>`
      UPDATE "ai_quota_buckets"
      SET "successful_count" = "successful_count" + 1,
          "reservation_key" = NULL,
          "reservation_expires_at" = NULL,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "subject_key" = ${subjectKey}
        AND "usage_date" = ${usageDate}
        AND "reservation_key" = ${reservationKey}
        AND "successful_count" < "quota_limit"
      RETURNING
        "successful_count" AS "successfulCount",
        "quota_limit" AS "quotaLimit",
        "reservation_key" AS "reservationKey",
        "reservation_expires_at" AS "reservationExpiresAt"
    `;
    return rows[0] ?? this.quotaState(subjectKey, usageDate);
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
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "ai_rate_limit_buckets" (
        "key_hash", "window_start", "count", "created_at", "updated_at"
      ) VALUES (${keyHash}, ${windowStart}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("key_hash", "window_start") DO UPDATE SET
        "count" = "ai_rate_limit_buckets"."count" + 1,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "ai_rate_limit_buckets"."count" < ${limit}
      RETURNING "count"
    `;
    return rows[0]?.count ?? 0;
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
      const rows = await transaction.$queryRaw<QuotaBucketState[]>`
        UPDATE "ai_quota_buckets"
        SET "successful_count" = "successful_count" + 1,
            "reservation_key" = NULL,
            "reservation_expires_at" = NULL,
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "subject_key" = ${data.subjectKey}
          AND "usage_date" = ${data.usageDate}
          AND "reservation_key" = ${data.reservationKey}
          AND "successful_count" < "quota_limit"
        RETURNING
          "successful_count" AS "successfulCount",
          "quota_limit" AS "quotaLimit",
          "reservation_key" AS "reservationKey",
          "reservation_expires_at" AS "reservationExpiresAt"
      `;
      const quota = rows[0];
      if (!quota) throw new Error('AI_QUOTA_RESERVATION_LOST');
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
