import { z } from '../../common/validation/zod.js';

const auditSourceSchema = z.enum([
  'AI_CONTROL',
  'AI_FLAG',
  'BILLING',
  'MODERATION',
  'RESTAURANT',
  'STORAGE',
]);
export type AuditSource = z.infer<typeof auditSourceSchema>;

const auditIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const cursorPartsSchema = z.tuple([
  z.iso.datetime({ precision: 3 }),
  auditSourceSchema,
  auditIdSchema,
]);
export const auditCursorSchema = z
  .string()
  .max(112)
  .refine((value) => cursorPartsSchema.safeParse(value.split('|')).success, {
    message: 'Mốc phân trang nhật ký không hợp lệ.',
  })
  .describe('Opaque continuation token returned by the preceding page');

export function parseAuditCursor(cursor: string) {
  const [time, source, id] = cursorPartsSchema.parse(cursor.split('|'));
  return { createdAt: new Date(time), source, id };
}

export const auditQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(25),
    cursor: auditCursorSchema.optional(),
  })
  .strict();

export const auditPageSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(
          z
            .object({
              id: auditIdSchema,
              source: auditSourceSchema,
              action: z.string(),
              targetType: z.string(),
              targetId: z.string(),
              actor: z
                .object({ id: z.string(), displayName: z.string().nullable() })
                .strict()
                .nullable(),
              occurredAt: z.iso.datetime(),
            })
            .strict(),
        ),
        nextCursor: auditCursorSchema.nullable(),
      })
      .strict(),
  })
  .strict();

export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type AuditPage = z.infer<typeof auditPageSchema>['data'];
