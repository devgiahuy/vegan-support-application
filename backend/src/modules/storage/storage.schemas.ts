import {
  MediaAssetStatus,
  MediaKind,
  MediaResourceType,
  StorageReservationStatus,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const paginationQueryFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const createReservationRequestSchema = z
  .object({
    kind: z.enum(MediaKind),
    mimeType: z.string().trim().toLowerCase().min(1).max(100),
    extension: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^\.[a-z0-9]{2,10}$/, 'Extension phải gồm dấu chấm và phần mở rộng hợp lệ'),
    bytes: z.number().int().positive().max(250_000_000),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();

export const reservationParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const assetParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const storagePolicyParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const storageAccountParamsSchema = z.object({ userId: z.string().uuid() }).strict();

export const commitReservationRequestSchema = z
  .object({
    publicId: z.string().trim().min(1).max(255),
    version: z.number().int().positive(),
    signature: z.string().regex(/^[a-f0-9]{40}$/i),
  })
  .strict();

export const deleteAssetRequestSchema = z
  .object({ idempotencyKey: z.string().trim().min(8).max(120) })
  .strict();

export const storageAccountListQuerySchema = z
  .object({
    ...paginationQueryFields,
    q: z.string().trim().min(1).max(160).optional(),
    overQuota: z.stringbool().optional(),
  })
  .strict();

export const storagePolicyListQuerySchema = z
  .object({ ...paginationQueryFields, active: z.stringbool().optional() })
  .strict();

export const storageAdjustmentListQuerySchema = z
  .object({ ...paginationQueryFields, userId: z.string().uuid().optional() })
  .strict();

export const updateStoragePolicyRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    name: z.string().trim().min(1).max(160).optional(),
    quotaBytes: z.number().int().positive().max(10_000_000_000_000).optional(),
    reservationTtlSeconds: z.number().int().min(60).max(86_400).optional(),
    warningPercent: z.number().int().min(1).max(100).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.name !== undefined ||
      input.quotaBytes !== undefined ||
      input.reservationTtlSeconds !== undefined ||
      input.warningPercent !== undefined ||
      input.active !== undefined,
    { message: 'Cần ít nhất một trường policy để cập nhật' },
  );

export const createStorageAdjustmentRequestSchema = z
  .object({
    deltaBytes: z.number().int().min(-10_000_000_000_000).max(10_000_000_000_000),
    reason: z.string().trim().min(10).max(1000),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict()
  .refine((input) => input.deltaBytes !== 0, {
    message: 'deltaBytes phải khác 0',
    path: ['deltaBytes'],
  });

const usageSchema = z
  .object({
    usedBytes: z.number().int().nonnegative(),
    reservedBytes: z.number().int().nonnegative(),
    limitBytes: z.number().int().nonnegative(),
    remainingBytes: z.number().int().nonnegative(),
    overQuota: z.boolean(),
    warningPercent: z.number().int().min(1).max(100),
  })
  .strict();

const policySchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    quotaBytes: z.number().int().positive(),
    reservationTtlSeconds: z.number().int().positive(),
    warningPercent: z.number().int().min(1).max(100),
    active: z.boolean(),
    isDefault: z.boolean(),
    version: z.number().int().positive(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const assetSchema = z
  .object({
    id: z.string().uuid(),
    provider: z.literal('CLOUDINARY'),
    resourceType: z.enum(MediaResourceType),
    kind: z.enum(MediaKind),
    publicId: z.string(),
    secureUrl: z.string().url(),
    mimeType: z.string(),
    extension: z.string(),
    bytes: z.number().int().positive(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    durationSeconds: z.number().positive().nullable(),
    status: z.enum(MediaAssetStatus),
    createdAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  })
  .strict();

const reservationSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(StorageReservationStatus),
    resourceType: z.enum(MediaResourceType),
    kind: z.enum(MediaKind),
    declaredMimeType: z.string(),
    declaredExtension: z.string(),
    declaredBytes: z.number().int().positive(),
    actualBytes: z.number().int().positive().nullable(),
    expiresAt: z.string().datetime(),
    committedAt: z.string().datetime().nullable(),
    releasedAt: z.string().datetime().nullable(),
    asset: assetSchema.nullable(),
  })
  .strict();

const uploadConfigurationSchema = z
  .object({
    cloudName: z.string(),
    apiKey: z.string(),
    resourceType: z.enum(['image', 'video']),
    uploadUrl: z.string().url(),
    timestamp: z.number().int().positive(),
    signature: z.string(),
    folder: z.string(),
    maxBytes: z.number().int().positive(),
    allowedMimeTypes: z.array(z.string()),
    expiresAt: z.string().datetime(),
  })
  .strict();

export const storageUsageResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ usage: usageSchema, policy: policySchema }).strict(),
    meta: z.null(),
  })
  .strict();

export const reservationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ reservation: reservationSchema, usage: usageSchema }).strict(),
    meta: z.null(),
  })
  .strict();

export const storageAssetResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ asset: assetSchema, usage: usageSchema }).strict(),
    meta: z.null(),
  })
  .strict();

export const createReservationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        reservation: reservationSchema,
        usage: usageSchema,
        upload: uploadConfigurationSchema,
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

const accountSchema = z
  .object({
    user: z.object({ id: z.string().uuid(), email: z.string().email(), displayName: z.string() }),
    policy: policySchema,
    usage: usageSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

const adjustmentSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    actorId: z.string().uuid(),
    deltaBytes: z.number().int(),
    beforeBytes: z.number().int(),
    afterBytes: z.number().int(),
    reason: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const storagePolicyResponseSchema = z
  .object({ success: z.literal(true), data: policySchema, meta: z.null() })
  .strict();
export const storagePolicyListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(policySchema), meta: paginationMetaSchema })
  .strict();
export const storageAccountListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(accountSchema), meta: paginationMetaSchema })
  .strict();
export const storageAdjustmentResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ adjustment: adjustmentSchema, account: accountSchema }).strict(),
    meta: z.null(),
  })
  .strict();
export const storageAdjustmentListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(adjustmentSchema), meta: paginationMetaSchema })
  .strict();

export type CreateReservationInput = z.infer<typeof createReservationRequestSchema>;
export type CommitReservationInput = z.infer<typeof commitReservationRequestSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetRequestSchema>;
export type StorageAccountListQuery = z.infer<typeof storageAccountListQuerySchema>;
export type StoragePolicyListQuery = z.infer<typeof storagePolicyListQuerySchema>;
export type StorageAdjustmentListQuery = z.infer<typeof storageAdjustmentListQuerySchema>;
export type UpdateStoragePolicyInput = z.infer<typeof updateStoragePolicyRequestSchema>;
export type CreateStorageAdjustmentInput = z.infer<typeof createStorageAdjustmentRequestSchema>;
