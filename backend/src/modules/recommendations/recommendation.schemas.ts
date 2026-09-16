import { BehaviorEventType, DietPattern, RecipeDifficulty, Tradition } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const PERSONALIZATION_CONSENT_VERSION = 'behavior-personalization-v1' as const;
export const RECOMMENDATION_SCORING_VERSION = 'behavioral-v1' as const;

export const topicCodeSchema = z.enum([
  'TOFU',
  'MUSHROOM',
  'PROTEIN',
  'QUICK_MEALS',
  'BREAKFAST',
  'DINNER',
  'LOW_CALORIE',
  'WHOLE_GRAINS',
  'VEGETABLES',
]);

const commonEventFields = {
  idempotencyKey: z.string().trim().min(8).max(120),
  occurredAt: z.string().datetime().optional(),
};
const entityEvent = <T extends Exclude<BehaviorEventType, 'SEARCH' | 'CHAT_TOPIC'>>(type: T) =>
  z
    .object({
      type: z.literal(type),
      entityId: z.string().uuid(),
      metadata: z.object({}).strict().optional(),
      ...commonEventFields,
    })
    .strict();

export const createBehaviorEventRequestSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal(BehaviorEventType.SEARCH),
      metadata: z.object({ query: z.string().trim().min(1).max(120) }).strict(),
      ...commonEventFields,
    })
    .strict(),
  z
    .object({
      type: z.literal(BehaviorEventType.CHAT_TOPIC),
      metadata: z.object({ topicCodes: z.array(topicCodeSchema).min(1).max(5) }).strict(),
      ...commonEventFields,
    })
    .strict(),
  entityEvent(BehaviorEventType.VIEW_RECIPE),
  entityEvent(BehaviorEventType.BOOKMARK),
  entityEvent(BehaviorEventType.RATE),
  entityEvent(BehaviorEventType.ACCEPT_MEAL),
  entityEvent(BehaviorEventType.SWAP_MEAL),
  entityEvent(BehaviorEventType.REJECT_MEAL),
]);

export const updatePersonalizationRequestSchema = z
  .object({
    enabled: z.boolean(),
    consentVersion: z.string().trim().min(1).max(80),
  })
  .strict();

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Ngày không hợp lệ');

export const recommendationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(20).default(10),
    forDate: dateOnlySchema.optional(),
  })
  .strict();

const personalizationSchema = z
  .object({
    enabled: z.boolean(),
    consentVersion: z.string(),
    consentedAt: z.string().datetime().nullable(),
    disabledAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime().nullable(),
  })
  .strict();

const behaviorEventSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(BehaviorEventType),
    entityId: z.string().uuid().nullable(),
    occurredAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    deduplicated: z.boolean(),
  })
  .strict();

const appliedConstraintsSchema = z
  .object({
    authenticated: z.literal(true),
    dietPattern: z.enum(DietPattern).nullable(),
    allergyCount: z.number().int().nonnegative(),
    ingredientExclusionCount: z.number().int().nonnegative(),
    traditions: z.array(z.enum(Tradition)),
    forDate: dateOnlySchema,
  })
  .strict();

const recommendationItemSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string().nullable(),
    coverImageUrl: z.string().url().nullable(),
    cookTimeMinutes: z.number().int().nonnegative(),
    difficulty: z.enum(RecipeDifficulty),
    calories: z.number().int().nonnegative().nullable(),
    ratingAverage: z.number().min(0).max(5),
    ratingCount: z.number().int().nonnegative(),
    voteCount: z.number().int().nonnegative(),
    bookmarkCount: z.number().int().nonnegative(),
    score: z.number(),
    reasonCodes: z.array(z.string()).max(2),
  })
  .strict();

const itemResponse = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data, meta: z.null() }).strict();

export const personalizationResponseSchema = itemResponse(personalizationSchema);
export const behaviorEventResponseSchema = itemResponse(behaviorEventSchema);
export const deleteBehaviorHistoryResponseSchema = itemResponse(
  z.object({ deletedCount: z.number().int().nonnegative() }).strict(),
);
export const recommendationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(recommendationItemSchema),
    meta: z
      .object({
        scoringVersion: z.literal(RECOMMENDATION_SCORING_VERSION),
        personalized: z.boolean(),
        lookbackDays: z.literal(30),
        decayHalfLifeDays: z.literal(14),
        generatedAt: z.string().datetime(),
        appliedConstraints: appliedConstraintsSchema,
      })
      .strict(),
  })
  .strict();

export type CreateBehaviorEventInput = z.infer<typeof createBehaviorEventRequestSchema>;
export type UpdatePersonalizationInput = z.infer<typeof updatePersonalizationRequestSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type TopicCode = z.infer<typeof topicCodeSchema>;
