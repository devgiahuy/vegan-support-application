import {
  AiArtifactStatus,
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
  AiVerificationStatus,
  Role,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const createAiArtifactSchema = z
  .object({
    type: z.nativeEnum(AiArtifactType),
    sourceId: z.string().uuid(),
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(3).max(1000),
    authorAnonymous: z.boolean().default(true),
  })
  .strict();

export const aiArtifactParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const aiVerificationParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const updateAiArtifactVisibilitySchema = z
  .object({
    visibility: z.nativeEnum(AiArtifactVisibility),
    expectedLifecycleVersion: z.number().int().positive(),
  })
  .strict();

export const submitAiArtifactSchema = z
  .object({ expectedLifecycleVersion: z.number().int().positive() })
  .strict();

export const publicAiArtifactsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.nativeEnum(AiArtifactType).optional(),
  })
  .strict();

const verificationFields = {
  conclusion: z.nativeEnum(AiVerificationConclusion),
  scope: z.string().trim().min(3).max(500),
  evidenceNote: z.string().trim().min(3).max(2000),
  correction: z.string().trim().min(3).max(2000).nullable().optional(),
};

export const createAiVerificationSchema = z
  .object({
    expectedArtifactVersion: z.number().int().positive(),
    ...verificationFields,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.conclusion === AiVerificationConclusion.CORRECTION_NEEDED && !value.correction) {
      context.addIssue({ code: 'custom', path: ['correction'], message: 'A scoped correction is required.' });
    }
  });

export const adminAiVerificationActionSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('OVERRIDE'),
      expectedVersion: z.number().int().positive(),
      reason: z.string().trim().min(3).max(2000),
      ...verificationFields,
    })
    .strict()
    .superRefine((value, context) => {
      if (value.conclusion === AiVerificationConclusion.CORRECTION_NEEDED && !value.correction) {
        context.addIssue({ code: 'custom', path: ['correction'], message: 'A scoped correction is required.' });
      }
    }),
  z
    .object({
      action: z.literal('REVOKE'),
      expectedVersion: z.number().int().positive(),
      reason: z.string().trim().min(3).max(2000),
    })
    .strict(),
]);

const nutrientSchema = z.object({
  code: z.string(),
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  origin: z.string(),
  confidence: z.number().min(0).max(1),
  range: z.object({ min: z.number().nullable(), max: z.number().nullable() }),
});

export const artifactContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CHAT_ANSWER'), answer: z.string() }),
  z.object({
    type: z.literal('RECIPE_NUTRITION'),
    recipe: z.object({ title: z.string(), servings: z.number().int().positive() }),
    totals: z.object({ rawGrams: z.number(), cookedGrams: z.number() }),
    perServingNutrients: z.array(nutrientSchema),
    confidence: z.number().min(0).max(1),
    disclaimer: z.string(),
  }),
  z.object({
    type: z.literal('FRIDGE_RECOGNITION'),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.object({ value: z.number().nullable(), unit: z.string().nullable() }),
        confidence: z.number().min(0).max(1),
        status: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal('RECEIPT_EXTRACTION'),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.object({ value: z.number().nullable(), unit: z.string().nullable() }),
        confidence: z.number().min(0).max(1),
        status: z.string(),
      }),
    ),
  }),
]);

const verificationSchema = z.object({
  id: z.string().uuid(),
  artifactVersion: z.number().int().positive(),
  conclusion: z.nativeEnum(AiVerificationConclusion),
  scope: z.string(),
  evidenceNote: z.string(),
  correction: z.string().nullable(),
  status: z.nativeEnum(AiVerificationStatus),
  reviewer: z.object({ name: z.string(), role: z.enum([Role.CONTRIBUTOR, Role.ADMIN]) }),
  version: z.number().int().positive(),
  supersedes: z.object({ verificationId: z.string().uuid() }).nullable(),
  createdAt: z.string().datetime(),
});

export const aiArtifactSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(AiArtifactType),
  version: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  content: artifactContentSchema,
  author: z.object({ name: z.string(), anonymous: z.boolean() }),
  lifecycle: z.object({
    status: z.nativeEnum(AiArtifactStatus),
    visibility: z.nativeEnum(AiArtifactVisibility),
    version: z.number().int().positive(),
    submittedAt: z.string().datetime().nullable(),
    sharedAt: z.string().datetime().nullable(),
  }),
  activeVerification: verificationSchema.nullable(),
  verificationHistory: z.array(verificationSchema),
  createdAt: z.string().datetime(),
});

export const aiArtifactEnvelopeSchema = z.object({ success: z.literal(true), data: aiArtifactSchema });
export const publicAiArtifactListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(aiArtifactSchema),
  meta: z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() }),
});
export const aiVerificationEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({ artifact: aiArtifactSchema, verification: verificationSchema }),
});

export type CreateAiArtifactInput = z.infer<typeof createAiArtifactSchema>;
export type UpdateAiArtifactVisibilityInput = z.infer<typeof updateAiArtifactVisibilitySchema>;
export type SubmitAiArtifactInput = z.infer<typeof submitAiArtifactSchema>;
export type PublicAiArtifactsQuery = z.infer<typeof publicAiArtifactsQuerySchema>;
export type CreateAiVerificationInput = z.infer<typeof createAiVerificationSchema>;
export type AdminAiVerificationActionInput = z.infer<typeof adminAiVerificationActionSchema>;
