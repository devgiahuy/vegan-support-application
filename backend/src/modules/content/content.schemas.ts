import {
  DietPattern,
  IngredientResolutionStatus,
  MediaKind,
  MediaProvider,
  PostRevisionStatus,
  PostStatus,
  PostType,
  RecipeDifficulty,
  Tradition,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const uniqueUuidList = (maximum: number) =>
  z
    .array(z.string().uuid())
    .max(maximum)
    .refine((values) => new Set(values).size === values.length, 'ID không được trùng lặp');

const optionalTrimmedString = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(1).max(maximum).optional(),
  );

const optionalUuidCsv = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  const values: unknown[] = Array.isArray(value) ? (value as unknown[]) : [value];
  return values.flatMap((item): unknown[] => (typeof item === 'string' ? item.split(',') : [item]));
}, uniqueUuidList(20).optional());

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải ở định dạng YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, 'Ngày không hợp lệ');

const cloudinaryMediaInputSchema = z
  .object({
    provider: z.literal(MediaProvider.CLOUDINARY),
    kind: z.enum(MediaKind),
    assetId: z.string().uuid(),
  })
  .strict();

const youtubeMediaInputSchema = z
  .object({
    provider: z.literal(MediaProvider.YOUTUBE),
    kind: z.literal(MediaKind.VIDEO),
    secureUrl: z.string().trim().url().max(2_048),
  })
  .strict();

export const mediaInputSchema = z.discriminatedUnion('provider', [
  cloudinaryMediaInputSchema,
  youtubeMediaInputSchema,
]);

const mediaListInputSchema = z
  .array(mediaInputSchema)
  .max(2)
  .default([])
  .refine((media) => new Set(media.map((item) => item.kind)).size === media.length, {
    message: 'Mỗi revision chỉ có tối đa một media cho mỗi kind',
  });

const commonContentFields = {
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug phải ở dạng kebab-case')
    .optional(),
  excerpt: z.string().trim().min(1).max(500).optional(),
  categoryIds: uniqueUuidList(10).default([]),
  tags: z
    .array(z.string().trim().min(1).max(80))
    .max(15)
    .default([])
    .refine(
      (values) => new Set(values.map((value) => value.toLowerCase())).size === values.length,
      'Tag không được trùng lặp',
    ),
  media: mediaListInputSchema,
};

const nutritionInputSchema = z
  .object({
    calories: z.number().int().nonnegative().optional(),
    proteinGrams: z.number().nonnegative().optional(),
    carbsGrams: z.number().nonnegative().optional(),
    fatGrams: z.number().nonnegative().optional(),
    fiberGrams: z.number().nonnegative().optional(),
    vitaminB12Mcg: z.number().nonnegative().optional(),
  })
  .strict()
  .default({});

const recipeIngredientInputSchema = z
  .object({
    // Client hay gửi explicit `null` khi chưa resolve được nguyên liệu chuẩn.
    // Coi null như vắng mặt (free-text) thay vì 400, để service đánh
    // resolutionStatus UNKNOWN và mealPlannerEligible=false như thiết kế.
    ingredientId: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.string().uuid().optional(),
    ),
    displayName: z.string().trim().min(1).max(160),
    amount: z.number().positive().max(1_000_000),
    unit: z.string().trim().min(1).max(40),
    optional: z.boolean().default(false),
  })
  .strict();

const uniqueIngredientPositions = z
  .array(z.number().int().min(0).max(99))
  .max(100)
  .refine((values) => new Set(values).size === values.length, 'Ingredient position khong duoc trung lap');

const recipeStepInputSchema = z
  .object({
    instruction: z.string().trim().min(1).max(2000),
    cookingMethodId: z.string().uuid().optional(),
    durationMinutes: z.number().int().positive().max(10_080).optional(),
    temperatureCelsius: z.number().min(0).max(400).optional(),
    affectedIngredientPositions: uniqueIngredientPositions.default([]),
  })
  .strict();

const recipeInputSchema = z
  .object({
    servings: z.number().int().min(1).max(100),
    prepTimeMinutes: z.number().int().min(0).max(10_080),
    cookTimeMinutes: z.number().int().min(0).max(10_080),
    difficulty: z.enum(RecipeDifficulty),
    nutrition: nutritionInputSchema,
    ingredients: z.array(recipeIngredientInputSchema).min(1).max(100),
    steps: z.array(recipeStepInputSchema).max(100).default([]),
  })
  .strict()
  .superRefine((recipe, context) => {
    for (const [stepIndex, step] of recipe.steps.entries()) {
      for (const position of step.affectedIngredientPositions) {
        if (position >= recipe.ingredients.length) {
          context.addIssue({
            code: 'custom',
            path: ['steps', stepIndex, 'affectedIngredientPositions'],
            message: 'Step tham chieu ingredient position khong ton tai',
          });
        }
      }
    }
  });

export const createRecipePostRequestSchema = z
  .object({
    type: z.literal(PostType.RECIPE),
    ...commonContentFields,
    body: z.string().trim().min(20).max(100_000),
    recipe: recipeInputSchema,
  })
  .strict();

export const createBlogPostRequestSchema = z
  .object({
    type: z.literal(PostType.BLOG),
    ...commonContentFields,
    body: z.string().trim().min(100).max(200_000),
  })
  .strict();

export const createVideoPostRequestSchema = z
  .object({
    type: z.literal(PostType.VIDEO),
    ...commonContentFields,
    body: z.string().trim().min(20).max(100_000),
  })
  .strict()
  .refine((input) => input.media.some((media) => media.kind === MediaKind.VIDEO), {
    message: 'VIDEO post cần Cloudinary video hoặc YouTube URL',
    path: ['media'],
  });

export const createPostRequestSchema = z.discriminatedUnion('type', [
  createRecipePostRequestSchema,
  createBlogPostRequestSchema,
  createVideoPostRequestSchema,
]);

export const updateRecipePostRequestSchema = createRecipePostRequestSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const updateBlogPostRequestSchema = createBlogPostRequestSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const updateVideoPostRequestSchema = createVideoPostRequestSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const updatePostRequestSchema = z.discriminatedUnion('type', [
  updateRecipePostRequestSchema,
  updateBlogPostRequestSchema,
  updateVideoPostRequestSchema,
]);

export const postListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(PostType).optional(),
    q: optionalTrimmedString(120).describe('Từ khóa tiếng Việt có hoặc không dấu'),
    category: optionalTrimmedString(140)
      .refine(
        (value) =>
          value === undefined ||
          z.string().uuid().safeParse(value).success ||
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
        'Category phải là UUID hoặc slug kebab-case',
      )
      .describe('Category UUID hoặc slug'),
    maxCookTimeMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(10_080)
      .optional()
      .describe('Chỉ trả Recipe có cook time không vượt quá giá trị này'),
    difficulty: z.enum(RecipeDifficulty).optional().describe('Filter Recipe difficulty'),
    dietPattern: z
      .enum(DietPattern)
      .optional()
      .describe('Guest filter; authenticated profile đã lưu có quyền ưu tiên'),
    ingredientIds: optionalUuidCsv.describe(
      'CSV hoặc repeated UUID; Recipe phải chứa đủ mọi canonical ingredient',
    ),
    forDate: dateOnlySchema
      .optional()
      .describe('Ngày YYYY-MM-DD để áp lịch tradition PERIODIC; mặc định ngày hiện tại VN'),
  })
  .strict();
export const postIdentifierParamsSchema = z.object({ idOrSlug: z.string().trim().min(1).max(220) });
export const postIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const relatedPostsQuerySchema = z
  .object({
    limitPerType: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .default(4)
      .describe('Số kết quả tối đa cho mỗi nhóm Recipe/Blog/Video'),
    forDate: dateOnlySchema.optional(),
  })
  .strict();
export const deletePostQuerySchema = z
  .object({ expectedVersion: z.coerce.number().int().positive() })
  .strict();

const authorSchema = z
  .object({ id: z.string().uuid(), displayName: z.string(), avatarUrl: z.string().nullable() })
  .strict();
const categorySummarySchema = z
  .object({ id: z.string().uuid(), name: z.string(), slug: z.string(), type: z.string() })
  .strict();
const mediaSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(MediaKind),
    provider: z.enum(MediaProvider),
    publicId: z.string().nullable(),
    secureUrl: z.string().url(),
    mimeType: z.string().nullable(),
    bytes: z.number().int().positive().nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    durationSeconds: z.number().positive().nullable(),
  })
  .strict();
const revisionSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    status: z.enum(PostRevisionStatus),
    title: z.string(),
    excerpt: z.string().nullable(),
    body: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
  })
  .strict();
const recipeIngredientSchema = z
  .object({
    id: z.string().uuid(),
    ingredientId: z.string().uuid().nullable(),
    canonicalName: z.string().nullable(),
    position: z.number().int().nonnegative(),
    displayName: z.string(),
    normalizedName: z.string(),
    amount: z.number().positive(),
    unit: z.string(),
    optional: z.boolean(),
    resolutionStatus: z.enum(IngredientResolutionStatus),
  })
  .strict();
const recipeStepSchema = z
  .object({
    id: z.string().uuid(),
    position: z.number().int().nonnegative(),
    instruction: z.string(),
    cookingMethodId: z.string().uuid().nullable(),
    cookingMethodCode: z.string().nullable(),
    cookingMethodName: z.string().nullable(),
    durationMinutes: z.number().int().positive().nullable(),
    temperatureCelsius: z.number().nonnegative().nullable(),
    affectedIngredientPositions: z.array(z.number().int().nonnegative()),
  })
  .strict();
const recipeCompatibilitySchema = z
  .object({
    dietPattern: z.enum(DietPattern),
    compatible: z.boolean(),
    reasonCodes: z.array(z.string()),
  })
  .strict();
const traditionWarningSchema = z
  .object({ tradition: z.enum(Tradition), warningCode: z.string(), label: z.string() })
  .strict();
const recipeOutputSchema = z
  .object({
    servings: z.number().int().positive(),
    prepTimeMinutes: z.number().int().nonnegative(),
    cookTimeMinutes: z.number().int().nonnegative(),
    difficulty: z.enum(RecipeDifficulty),
    nutrition: z
      .object({
        calories: z.number().int().nonnegative().nullable(),
        proteinGrams: z.number().nonnegative().nullable(),
        carbsGrams: z.number().nonnegative().nullable(),
        fatGrams: z.number().nonnegative().nullable(),
        fiberGrams: z.number().nonnegative().nullable(),
        vitaminB12Mcg: z.number().nonnegative().nullable(),
      })
      .strict(),
    mealPlannerEligible: z.boolean(),
    allergenCodes: z.array(z.string()),
    traditionWarnings: z.array(traditionWarningSchema),
    dietCompatibilities: z.array(recipeCompatibilitySchema),
    ingredients: z.array(recipeIngredientSchema),
    steps: z.array(recipeStepSchema),
  })
  .strict();

const commonPostOutputFields = {
  id: z.string().uuid(),
  author: authorSchema,
  slug: z.string(),
  status: z.enum(PostStatus),
  version: z.number().int().positive(),
  publishedRevisionVersion: z.number().int().positive().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  revision: revisionSchema,
  categories: z.array(categorySummarySchema),
  media: z.array(mediaSchema),
};

export const recipePostSchema = z
  .object({
    ...commonPostOutputFields,
    type: z.literal(PostType.RECIPE),
    recipe: recipeOutputSchema,
  })
  .strict();
export const blogPostSchema = z
  .object({ ...commonPostOutputFields, type: z.literal(PostType.BLOG), recipe: z.null() })
  .strict();
export const videoPostSchema = z
  .object({ ...commonPostOutputFields, type: z.literal(PostType.VIDEO), recipe: z.null() })
  .strict();
export const postSchema = z.discriminatedUnion('type', [
  recipePostSchema,
  blogPostSchema,
  videoPostSchema,
]);

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    rankingVersion: z.literal('v1'),
    appliedConstraints: z
      .object({
        authenticated: z.boolean(),
        dietPattern: z.enum(DietPattern).nullable(),
        allergyCount: z.number().int().nonnegative(),
        ingredientExclusionCount: z.number().int().nonnegative(),
        traditions: z.array(z.enum(Tradition)),
        forDate: dateOnlySchema,
      })
      .strict(),
  })
  .strict();
export const postResponseSchema = z
  .object({ success: z.literal(true), data: postSchema, meta: z.null() })
  .strict();
export const postListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(postSchema), meta: paginationMetaSchema })
  .strict();
export const relatedPostsResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        recipes: z.array(recipePostSchema),
        blogs: z.array(blogPostSchema),
        videos: z.array(videoPostSchema),
      })
      .strict(),
    meta: z
      .object({
        rankingVersion: z.literal('v1'),
        limitPerType: z.number().int().min(1).max(10),
        appliedConstraints: paginationMetaSchema.shape.appliedConstraints,
      })
      .strict(),
  })
  .strict();
export const deletePostResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ id: z.string().uuid(), status: z.literal(PostStatus.DELETED) }).strict(),
    meta: z.null(),
  })
  .strict();
export type CreatePostInput = z.infer<typeof createPostRequestSchema>;
export type UpdatePostInput = z.infer<typeof updatePostRequestSchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type PostIdentifierParams = z.infer<typeof postIdentifierParamsSchema>;
export type PostIdParams = z.infer<typeof postIdParamsSchema>;
export type RelatedPostsQuery = z.infer<typeof relatedPostsQuerySchema>;
export type DeletePostQuery = z.infer<typeof deletePostQuerySchema>;
export type MediaInput = z.infer<typeof mediaInputSchema>;
export type PostOutput = z.infer<typeof postSchema>;
export type AppliedSearchConstraintsOutput = z.infer<
  typeof paginationMetaSchema.shape.appliedConstraints
>;
