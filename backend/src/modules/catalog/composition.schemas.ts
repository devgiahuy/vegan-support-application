import { IngredientCompositionKind, IngredientCompositionStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const compositionEvidenceInputSchema = z
  .object({
    sourceId: z.string().uuid(),
    sourceVersion: z.string().trim().min(1).max(120),
    sourceRecordId: z.string().trim().min(1).max(240),
    scope: z.string().trim().min(1).max(1000),
  })
  .strict();

export const compositionInputSchema = z
  .object({
    expectedVersion: z.number().int().nonnegative(),
    status: z.enum(IngredientCompositionStatus),
    kind: z.enum(IngredientCompositionKind),
    componentIds: z
      .array(z.string().uuid())
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Thành phần không được trùng lặp'),
    evidence: compositionEvidenceInputSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const fail = (message: string) => context.addIssue({ code: 'custom', message });
    if (input.status !== 'UNKNOWN' && !input.evidence)
      fail('Cần nguồn và phạm vi công thức thành phần');
    if (input.status === 'COMPLETE' && input.kind === 'UNSPECIFIED')
      fail('Cần chọn loại nguyên liệu');
    if (input.kind === 'SIMPLE' && input.componentIds.length)
      fail('Nguyên liệu đơn không có thành phần con');
    if (input.status === 'COMPLETE' && input.kind === 'COMPOUND' && !input.componentIds.length)
      fail('Nguyên liệu phối trộn cần ít nhất một thành phần');
  });
export type CompositionInput = z.infer<typeof compositionInputSchema>;

export const compositionDataSchema = z
  .object({
    ingredientId: z.string().uuid(),
    status: z.enum(IngredientCompositionStatus),
    kind: z.enum(IngredientCompositionKind),
    version: z.number().int().nonnegative(),
    componentIds: z.array(z.string().uuid()),
    components: z.array(
      z.object({ id: z.string().uuid(), name: z.string(), active: z.boolean() }).strict(),
    ),
    evidence: z.record(z.string(), z.unknown()).nullable(),
    complete: z.boolean(),
    inferredAllergenCodes: z.array(z.string()),
    audit: z.array(
      z
        .object({
          version: z.number().int().nonnegative(),
          actorId: z.string(),
          snapshot: z.record(z.string(), z.unknown()),
          createdAt: z.string().datetime(),
        })
        .strict(),
    ),
  })
  .strict();
export const compositionResponseSchema = z
  .object({
    success: z.literal(true),
    data: compositionDataSchema,
    meta: z.null(),
  })
  .strict();
export const allergenCatalogResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(
      z
        .object({
          code: z.string(),
          label: z.string(),
          description: z.string().nullable(),
          searchTerms: z.array(z.string()),
        })
        .strict(),
    ),
    meta: z.null(),
  })
  .strict();

export const compositionSourcesResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(
      z
        .object({
          id: z.string().uuid(),
          code: z.string(),
          name: z.string(),
          licenseName: z.string(),
          attribution: z.string(),
        })
        .strict(),
    ),
    meta: z.null(),
  })
  .strict();
