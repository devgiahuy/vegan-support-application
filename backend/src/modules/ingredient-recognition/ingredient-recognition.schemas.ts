import { PantryItemSource, RecognitionCandidateStatus, RecognitionJobStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const idempotencyKeySchema = z.string().trim().min(8).max(160);
const candidateIdentityFields = {
  ingredientId: z.string().uuid().nullable().optional(),
  detectedName: z.string().trim().min(1).max(160).optional(),
};

export const createRecognitionJobSchema = z
  .object({
    imageAssetIds: z.array(z.string().uuid()).min(1).max(12),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((input) => new Set(input.imageAssetIds).size === input.imageAssetIds.length, {
    message: 'Image asset IDs must be unique',
    path: ['imageAssetIds'],
  });

export const recognitionJobParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const recognitionCandidateParamsSchema = z
  .object({ id: z.string().uuid(), candidateId: z.string().uuid() })
  .strict();

export const updateRecognitionCandidateSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    ...candidateIdentityFields,
    quantity: z.number().positive().max(999_999_999).nullable().optional(),
    unit: z.string().trim().min(1).max(40).nullable().optional(),
    freshnessObservation: z.string().trim().min(1).max(1000).nullable().optional(),
    confidence: z.number().min(0).max(1).optional(),
    decision: z.enum(['KEEP', 'REJECT']).optional(),
  })
  .strict()
  .refine(
    (input) =>
      Object.keys(input).some((key) => key !== 'expectedVersion'),
    { message: 'Provide at least one candidate change' },
  );

export const confirmRecognitionJobSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() })
          .strict(),
      )
      .min(1)
      .max(100),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((input) => new Set(input.candidates.map((item) => item.id)).size === input.candidates.length, {
    message: 'Candidate IDs must be unique',
    path: ['candidates'],
  });

export const retryRecognitionJobSchema = z
  .object({ idempotencyKey: idempotencyKeySchema })
  .strict();

const imageSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().nonnegative(),
  url: z.string().url(),
  status: z.enum(['PENDING', 'PROCESSED', 'FAILED']),
  issue: z.string().nullable(),
});

const candidateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ingredientSuggestion: z
    .object({ id: z.string().uuid(), name: z.string(), confidence: z.number().min(0).max(1) })
    .nullable(),
  quantity: z.object({ value: z.number().positive().nullable(), unit: z.string().nullable() }),
  freshnessObservation: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  uncertaintyNote: z.string().nullable(),
  status: z.nativeEnum(RecognitionCandidateStatus),
  version: z.number().int().positive(),
  evidence: z.array(
    z.object({ imageId: z.string().uuid(), imagePosition: z.number().int(), confidence: z.number() }),
  ),
});

export const recognitionJobResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(RecognitionJobStatus),
  progress: z.object({ completedImages: z.number().int(), totalImages: z.number().int() }),
  images: z.array(imageSchema),
  candidates: z.array(candidateSchema),
  attempt: z.number().int().nonnegative(),
  issue: z.object({ code: z.string(), message: z.string() }).nullable(),
  freshnessDisclaimer: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  confirmedAt: z.string().datetime().nullable(),
});

export const recognitionJobEnvelopeSchema = z.object({
  success: z.literal(true),
  data: recognitionJobResponseSchema,
});

export const recognitionConfirmationEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: recognitionJobResponseSchema,
    pantryChanges: z.array(
      z.object({
        candidateId: z.string().uuid(),
        action: z.enum(['CREATED', 'UPDATED']),
        pantryItem: z.object({
          id: z.string().uuid(),
          ingredient: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
          unmatchedText: z.string().nullable(),
          quantity: z.number(),
          unit: z.string(),
          source: z.nativeEnum(PantryItemSource),
          confidence: z.number(),
          confirmationStatus: z.literal('CONFIRMED'),
          version: z.number().int().positive(),
        }),
      }),
    ),
  }),
});

export type CreateRecognitionJobInput = z.infer<typeof createRecognitionJobSchema>;
export type UpdateRecognitionCandidateInput = z.infer<typeof updateRecognitionCandidateSchema>;
export type ConfirmRecognitionJobInput = z.infer<typeof confirmRecognitionJobSchema>;
export type RetryRecognitionJobInput = z.infer<typeof retryRecognitionJobSchema>;
