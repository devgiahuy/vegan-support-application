import { z } from '../../common/validation/zod.js';

export const capabilitySchema = z.enum(['CHAT', 'MODERATION', 'NUTRITION', 'VISION', 'RECEIPT', 'VERIFICATION']);
export const governanceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  capability: capabilitySchema.optional(),
  provider: z.string().min(1).max(80).optional(),
  status: z.enum(['SUCCESS', 'BLOCKED', 'FALLBACK', 'FAILED', 'ABORTED']).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
}).strict();
export const governanceFlagQuerySchema = governanceListQuerySchema.omit({ capability: true, status: true }).extend({ status: z.enum(['OPEN', 'REVIEWED']).optional() }).strict();
export const governanceAuditQuerySchema = governanceListQuerySchema.omit({ status: true }).strict();
export const governanceMetricsQuerySchema = governanceListQuerySchema.omit({ page: true, limit: true, status: true }).strict();
export const governanceFeatureParamsSchema = z.object({ feature: capabilitySchema }).strict();
export const governanceControlSchema = z.object({
  provider: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
  expectedVersion: z.number().int().min(0),
  reason: z.enum(['PROVIDER_INCIDENT', 'QUALITY_INVESTIGATION', 'SAFETY_HOLD', 'PLANNED_MAINTENANCE', 'RESTORE_SERVICE']),
}).strict();

export const governanceEventSchema = z.object({
  id: z.string().uuid(), capability: capabilitySchema, provider: z.string(),
  modelId: z.string().nullable(), templateVersion: z.string().nullable(),
  correlationId: z.string(), status: z.string(), errorClass: z.string().nullable(),
  safetyOutcome: z.string(), latencyMs: z.number().nullable(),
  inputTokens: z.number().nullable(), outputTokens: z.number().nullable(),
  costMicros: z.string().nullable(), confidence: z.number().nullable(), coverage: z.number().nullable(),
  startedAt: z.iso.datetime(), completedAt: z.iso.datetime(), redacted: z.literal(true),
});
export const governancePageSchema = z.object({ success: z.literal(true), data: z.array(governanceEventSchema), meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }) });
export const governanceControlOutputSchema = z.object({ capability: capabilitySchema, provider: z.string(), modelId: z.string().nullable(), enabled: z.boolean(), version: z.number(), fallback: z.string(), updatedAt: z.iso.datetime().nullable() });
export const governanceControlsSchema = z.object({ success: z.literal(true), data: z.array(governanceControlOutputSchema) });
export const governanceControlEnvelopeSchema = z.object({ success: z.literal(true), data: governanceControlOutputSchema });
export const governanceControlAuditSchema = z.object({ success: z.literal(true), data: z.array(z.object({ id: z.string().uuid(), capability: capabilitySchema, provider: z.string(), enabled: z.boolean(), version: z.number(), actorId: z.string().uuid(), reason: z.string(), createdAt: z.iso.datetime() })), meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }) });
export const governanceMetricsSchema = z.object({ success: z.literal(true), data: z.object({
  window: z.object({ from: z.iso.datetime(), to: z.iso.datetime() }),
  requests: z.array(z.object({ capability: capabilitySchema, provider: z.string(), status: z.string(), count: z.number(), averageLatencyMs: z.number().nullable(), inputTokens: z.number(), outputTokens: z.number(), costMicros: z.string().nullable() })),
  feedback: z.object({ positive: z.number(), negative: z.number() }),
  moderation: z.object({ open: z.number(), dismissed: z.number(), actioned: z.number(), falsePositiveSignals: z.number() }),
  recognition: z.object({ total: z.number(), corrected: z.number(), correctionRate: z.number().nullable() }),
  receipts: z.object({ total: z.number(), corrected: z.number(), correctionRate: z.number().nullable() }),
  nutrition: z.object({ estimates: z.number(), averageConfidence: z.number().nullable(), averageCoverage: z.number().nullable() }),
  verification: z.array(z.object({ conclusion: z.string(), status: z.string(), count: z.number() })),
  providerUnavailable: z.number(),
}) });
export const governanceFlagsSchema = z.object({ success: z.literal(true), data: z.array(z.object({ id: z.string().uuid(), provider: z.string(), model: z.string(), riskLevel: z.string(), riskScore: z.number(), status: z.string(), createdAt: z.iso.datetime(), reviewedAt: z.iso.datetime().nullable() })), meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }) });
export const governanceHealthSchema = z.object({ success: z.literal(true), data: z.object({ evaluatedAt: z.iso.datetime(), last24Hours: z.object({ total: z.number(), failures: z.number(), fallback: z.number(), providerUnavailable: z.number() }), controls: z.array(governanceControlOutputSchema), retentionDays: z.number() }) });

export type GovernanceListQuery = z.infer<typeof governanceListQuerySchema>;
export type GovernanceFlagQuery = z.infer<typeof governanceFlagQuerySchema>;
export type GovernanceAuditQuery = z.infer<typeof governanceAuditQuerySchema>;
export type GovernanceMetricsQuery = z.infer<typeof governanceMetricsQuerySchema>;
export type GovernanceControlInput = z.infer<typeof governanceControlSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
