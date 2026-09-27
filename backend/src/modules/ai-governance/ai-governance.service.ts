import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { aiCorrelationId } from './ai-governance.context.js';
import type { Capability, GovernanceAuditQuery, GovernanceControlInput, GovernanceFlagQuery, GovernanceListQuery, GovernanceMetricsQuery } from './ai-governance.schemas.js';

export const AI_GOVERNANCE_RETENTION_DAYS = 90;
const fallback: Record<Capability, string> = {
  CHAT: 'STATIC_ADVISORY', MODERATION: 'STATIC_ADVISORY', NUTRITION: 'DETERMINISTIC_PARTIAL',
  VISION: 'MANUAL_PANTRY_ENTRY', RECEIPT: 'MANUAL_PANTRY_ENTRY', VERIFICATION: 'HUMAN_REVIEW',
};

export interface GovernanceEventInput {
  capability: Capability;
  provider: string;
  modelId?: string | null;
  templateVersion?: string | null;
  status: 'SUCCESS' | 'BLOCKED' | 'FALLBACK' | 'FAILED' | 'ABORTED';
  errorClass?: string | null;
  safetyOutcome?: string;
  startedAt: Date;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costMicros?: bigint | null;
  confidence?: number | null;
  coverage?: number | null;
}

function dateWindow(query: { from?: string | undefined; to?: string | undefined }): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 86_400_000);
  if (from > to || to.getTime() - from.getTime() > AI_GOVERNANCE_RETENTION_DAYS * 86_400_000) {
    throw new AppError({ statusCode: 422, code: 'AI_GOVERNANCE_WINDOW_INVALID', message: 'Date range must be ordered and at most 90 days.' });
  }
  return { from, to };
}

export class AiGovernanceService {
  constructor(private readonly db: PrismaClient, private readonly config: AppConfig, private readonly activeChatModel = config.ai.chatModel) {}

  private configured() {
    return [
      { capability: 'CHAT' as const, provider: this.config.ai.provider, modelId: this.activeChatModel, environmentEnabled: this.config.ai.chatEnabled && (this.config.ai.provider === 'fake' || Boolean(this.config.ai.openAiApiKey)) },
      { capability: 'MODERATION' as const, provider: this.config.ai.provider, modelId: this.config.ai.provider === 'fake' ? null : this.config.ai.moderationModel, environmentEnabled: this.config.ai.provider === 'fake' || Boolean(this.config.ai.openAiApiKey) },
      { capability: 'NUTRITION' as const, provider: this.config.ai.provider, modelId: this.activeChatModel, environmentEnabled: this.config.ai.provider === 'fake' || Boolean(this.config.ai.openAiApiKey) },
      { capability: 'VISION' as const, provider: this.config.vision.provider, modelId: this.config.vision.model, environmentEnabled: this.config.vision.enabled },
      { capability: 'RECEIPT' as const, provider: this.config.receipt.provider, modelId: this.config.receipt.model, environmentEnabled: this.config.receipt.enabled },
    ];
  }

  async allowed(capability: Capability, provider: string): Promise<boolean> {
    const configured = this.configured().find((item) => item.capability === capability);
    if (!configured || !configured.environmentEnabled || configured.provider !== provider) return false;
    // Read authoritative state for every call: no cache can leave a disabled provider running.
    const control = await this.db.aiCapabilityControl.findUnique({ where: { capability_provider: { capability, provider } } });
    return control?.enabled ?? true;
  }

  async record(input: GovernanceEventInput): Promise<void> {
    const completedAt = new Date();
    await this.db.aiGovernanceEvent.create({ data: {
      capability: input.capability, provider: input.provider, modelId: input.modelId ?? null,
      templateVersion: input.templateVersion ?? null, correlationId: aiCorrelationId(),
      status: input.status, errorClass: input.errorClass ?? null,
      safetyOutcome: input.safetyOutcome ?? 'NONE',
      latencyMs: Math.max(0, completedAt.getTime() - input.startedAt.getTime()),
      inputTokens: input.inputTokens ?? null, outputTokens: input.outputTokens ?? null,
      costMicros: input.costMicros ?? null, confidence: input.confidence ?? null,
      coverage: input.coverage ?? null, startedAt: input.startedAt, completedAt,
    } });
  }

  async requests(query: GovernanceListQuery) {
    const { from, to } = dateWindow(query);
    const where = { createdAt: { gte: from, lte: to }, ...(query.capability ? { capability: query.capability } : {}), ...(query.provider ? { provider: query.provider } : {}), ...(query.status ? { status: query.status } : {}) };
    const [rows, total] = await this.db.$transaction([
      this.db.aiGovernanceEvent.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.limit, take: query.limit }),
      this.db.aiGovernanceEvent.count({ where }),
    ]);
    return { data: rows.map((row) => ({ id: row.id, capability: row.capability, provider: row.provider,
      modelId: row.modelId, templateVersion: row.templateVersion, correlationId: row.correlationId,
      status: row.status, errorClass: row.errorClass, safetyOutcome: row.safetyOutcome,
      latencyMs: row.latencyMs, inputTokens: row.inputTokens, outputTokens: row.outputTokens,
      costMicros: row.costMicros?.toString() ?? null, confidence: row.confidence?.toNumber() ?? null,
      coverage: row.coverage?.toNumber() ?? null, startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt.toISOString(), redacted: true as const })),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async features() {
    const controls = await this.db.aiCapabilityControl.findMany();
    return this.configured().map((item) => {
      const control = controls.find((row) => row.capability === item.capability && row.provider === item.provider);
      return { capability: item.capability, provider: item.provider, modelId: item.modelId,
        enabled: item.environmentEnabled && (control?.enabled ?? true), version: control?.version ?? 0,
        fallback: fallback[item.capability], updatedAt: control?.updatedAt.toISOString() ?? null };
    });
  }

  async setFeature(capability: Capability, actorId: string, input: GovernanceControlInput) {
    const configured = this.configured().find((item) => item.capability === capability);
    if (!configured || configured.provider !== input.provider) throw new AppError({ statusCode: 422, code: 'AI_PROVIDER_NOT_CONFIGURED', message: 'Provider is not configured for this capability.' });
    if (input.enabled && !configured.environmentEnabled) throw new AppError({ statusCode: 422, code: 'AI_PROVIDER_NOT_CONFIGURED', message: 'Environment policy disables this capability.' });
    let result;
    try {
      result = await this.db.$transaction(async (tx) => {
      const key = { capability, provider: input.provider };
      const current = await tx.aiCapabilityControl.findUnique({ where: { capability_provider: key } });
      if ((current?.version ?? 0) !== input.expectedVersion) throw new AppError({ statusCode: 409, code: 'AI_CONFIG_CONFLICT', message: 'Configuration changed; refresh before retrying.' });
      let next;
      if (current) {
        const changed = await tx.aiCapabilityControl.updateMany({ where: { ...key, version: input.expectedVersion }, data: { enabled: input.enabled, version: { increment: 1 } } });
        if (changed.count !== 1) throw new AppError({ statusCode: 409, code: 'AI_CONFIG_CONFLICT', message: 'Configuration changed; refresh before retrying.' });
        next = await tx.aiCapabilityControl.findUniqueOrThrow({ where: { capability_provider: key } });
      } else {
        next = await tx.aiCapabilityControl.create({ data: { ...key, enabled: input.enabled } });
      }
      await tx.aiCapabilityControlAudit.create({ data: { id: randomUUID(), ...key, enabled: input.enabled, version: next.version, actorId, reason: input.reason } });
      return next;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AppError({ statusCode: 409, code: 'AI_CONFIG_CONFLICT', message: 'Configuration changed; refresh before retrying.' });
      throw error;
    }
    return { capability, provider: input.provider, modelId: configured.modelId,
      enabled: result.enabled, version: result.version, fallback: fallback[capability], updatedAt: result.updatedAt.toISOString() };
  }

  async controlAudit(query: GovernanceAuditQuery) {
    const { from, to } = dateWindow(query);
    const where = { createdAt: { gte: from, lte: to }, ...(query.capability ? { capability: query.capability } : {}), ...(query.provider ? { provider: query.provider } : {}) };
    const [rows, total] = await this.db.$transaction([
      this.db.aiCapabilityControlAudit.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.limit, take: query.limit }),
      this.db.aiCapabilityControlAudit.count({ where }),
    ]);
    return { data: rows.map((row) => ({ ...row, capability: row.capability as Capability, createdAt: row.createdAt.toISOString() })), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async flags(query: GovernanceFlagQuery) {
    const { from, to } = dateWindow(query);
    const where = { createdAt: { gte: from, lte: to }, ...(query.provider ? { provider: query.provider } : {}), ...(query.status ? { status: query.status } : {}) };
    const [rows, total] = await this.db.$transaction([
      this.db.aiFlag.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.limit, take: query.limit,
        select: { id: true, provider: true, model: true, riskLevel: true, riskScore: true, status: true, createdAt: true, reviewedAt: true } }),
      this.db.aiFlag.count({ where }),
    ]);
    return { data: rows.map((row) => ({ ...row, riskScore: row.riskScore.toNumber(), createdAt: row.createdAt.toISOString(), reviewedAt: row.reviewedAt?.toISOString() ?? null })),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async metrics(query: GovernanceMetricsQuery) {
    const { from, to } = dateWindow(query);
    const createdAt = { gte: from, lte: to };
    const eventWhere = { createdAt, ...(query.capability ? { capability: query.capability } : {}), ...(query.provider ? { provider: query.provider } : {}) };
    const [events, unavailableCount, feedback, flags, falsePositiveActions, recognition, receipts, estimates, nutritionLines, coveredLines, verifications] = await Promise.all([
      this.db.aiGovernanceEvent.groupBy({ by: ['capability', 'provider', 'status'], where: eventWhere, _count: true, _avg: { latencyMs: true }, _sum: { inputTokens: true, outputTokens: true, costMicros: true } }),
      this.db.aiGovernanceEvent.count({ where: { ...eventWhere, errorClass: 'PROVIDER_UNAVAILABLE' } }),
      this.db.chatFeedback.groupBy({ by: ['value'], where: { updatedAt: createdAt }, _count: true }),
      this.db.aiFlag.groupBy({ by: ['status'], where: { createdAt }, _count: true }),
      this.db.moderationAction.findMany({ where: { createdAt, decision: 'NO_VIOLATION' }, select: { relatedAiFlagIds: true } }),
      Promise.all([this.db.recognitionCandidate.count({ where: { createdAt } }), this.db.recognitionCandidate.count({ where: { createdAt, editedByUser: true } })]),
      Promise.all([this.db.receiptCandidate.count({ where: { createdAt } }), this.db.receiptCandidate.count({ where: { createdAt, editedByUser: true } })]),
      this.db.recipeNutritionEstimate.aggregate({ where: { createdAt }, _count: true, _avg: { confidence: true } }),
      this.db.recipeNutritionEstimateLine.count({ where: { estimate: { createdAt } } }),
      this.db.recipeNutritionEstimateLine.count({ where: { estimate: { createdAt }, uncoveredReason: null } }),
      this.db.aiVerification.groupBy({ by: ['conclusion', 'status'], where: { createdAt }, _count: true }),
    ]);
    const countStatus = (values: Array<{ status: string; _count: number }>, status: string) => values.find((row) => row.status === status)?._count ?? 0;
    const correction = ([total, corrected]: [number, number]) => {
      return { total, corrected, correctionRate: total ? corrected / total : null };
    };
    const selected = (capability: Capability) => !query.capability || query.capability === capability;
    return { window: { from: from.toISOString(), to: to.toISOString() },
      requests: events.map((item) => ({ capability: item.capability as Capability, provider: item.provider, status: item.status, count: item._count, averageLatencyMs: item._avg.latencyMs === null ? null : Math.round(item._avg.latencyMs), inputTokens: item._sum.inputTokens ?? 0, outputTokens: item._sum.outputTokens ?? 0, costMicros: item._sum.costMicros?.toString() ?? null })),
      feedback: selected('CHAT') ? { positive: feedback.filter((row) => row.value === 'UP').reduce((sum, row) => sum + row._count, 0), negative: feedback.filter((row) => row.value === 'DOWN').reduce((sum, row) => sum + row._count, 0) } : { positive: 0, negative: 0 },
      moderation: selected('MODERATION') ? { open: countStatus(flags, 'OPEN'), dismissed: falsePositiveActions.filter((row) => Array.isArray(row.relatedAiFlagIds) && row.relatedAiFlagIds.length > 0).length, actioned: countStatus(flags, 'REVIEWED'), falsePositiveSignals: falsePositiveActions.reduce((sum, row) => sum + (Array.isArray(row.relatedAiFlagIds) ? row.relatedAiFlagIds.length : 0), 0) } : { open: 0, dismissed: 0, actioned: 0, falsePositiveSignals: 0 },
      recognition: selected('VISION') ? correction(recognition) : { total: 0, corrected: 0, correctionRate: null }, receipts: selected('RECEIPT') ? correction(receipts) : { total: 0, corrected: 0, correctionRate: null },
      nutrition: selected('NUTRITION') ? { estimates: estimates._count, averageConfidence: estimates._avg.confidence?.toNumber() ?? null, averageCoverage: nutritionLines ? coveredLines / nutritionLines : null } : { estimates: 0, averageConfidence: null, averageCoverage: null },
      verification: selected('VERIFICATION') ? verifications.map((row) => ({ conclusion: row.conclusion, status: row.status, count: row._count })) : [],
      providerUnavailable: unavailableCount };
  }

  async health() {
    const since = new Date(Date.now() - 86_400_000);
    const events = await this.db.aiGovernanceEvent.groupBy({ by: ['status', 'errorClass'], where: { createdAt: { gte: since } }, _count: true });
    return { evaluatedAt: new Date().toISOString(), last24Hours: {
      total: events.reduce((sum, row) => sum + row._count, 0),
      failures: events.filter((row) => row.status === 'FAILED').reduce((sum, row) => sum + row._count, 0),
      fallback: events.filter((row) => row.status === 'FALLBACK').reduce((sum, row) => sum + row._count, 0),
      providerUnavailable: events.filter((row) => row.errorClass === 'PROVIDER_UNAVAILABLE').reduce((sum, row) => sum + row._count, 0),
    }, controls: await this.features(), retentionDays: AI_GOVERNANCE_RETENTION_DAYS };
  }

  cleanup(before = new Date(Date.now() - AI_GOVERNANCE_RETENTION_DAYS * 86_400_000)) {
    return this.db.aiGovernanceEvent.deleteMany({ where: { createdAt: { lt: before } } });
  }
}
