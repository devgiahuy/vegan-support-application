import { CatalogStatus, CategoryType, DietPattern, FoodGroup, Tradition } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const paginationQueryFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const idParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const aliasParamsSchema = z
  .object({ id: z.string().uuid(), aliasId: z.string().uuid() })
  .strict();

export const publicCategoryQuerySchema = z
  .object({ type: z.enum(CategoryType).optional() })
  .strict();

export const adminCategoryQuerySchema = z
  .object({
    ...paginationQueryFields,
    type: z.enum(CategoryType).optional(),
    status: z.enum(CatalogStatus).optional(),
  })
  .strict();

const categoryMutationFields = {
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug phải ở dạng kebab-case')
    .optional(),
  type: z.enum(CategoryType),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
};

export const createCategoryRequestSchema = z.object(categoryMutationFields).strict();
export const updateCategoryRequestSchema = z
  .object({
    name: categoryMutationFields.name.optional(),
    slug: categoryMutationFields.slug,
    type: categoryMutationFields.type.optional(),
    parentId: categoryMutationFields.parentId,
    sortOrder: z.number().int().min(0).max(100_000).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Cần cung cấp ít nhất một trường');

export const archiveCategoryQuerySchema = z
  .object({ replacementId: z.string().uuid().optional() })
  .strict();

const categoryBaseSchema = z
  .object({
    id: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(CategoryType),
    status: z.enum(CatalogStatus),
    sortOrder: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const categoryTreeNodeSchema = categoryBaseSchema
  .extend({ children: z.array(categoryBaseSchema) })
  .strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const publicCategoryTreeResponseSchema = z
  .object({ success: z.literal(true), data: z.array(categoryTreeNodeSchema), meta: z.null() })
  .strict();
export const categoryResponseSchema = z
  .object({ success: z.literal(true), data: categoryBaseSchema, meta: z.null() })
  .strict();
export const adminCategoryListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(categoryBaseSchema),
    meta: paginationMetaSchema,
  })
  .strict();

const dietCompatibilityInputSchema = z
  .object({ dietPattern: z.enum(DietPattern), compatible: z.boolean() })
  .strict();
const traditionWarningInputSchema = z
  .object({
    tradition: z.enum(Tradition).refine((value) => value !== Tradition.NONE, {
      message: 'Tradition warning không áp dụng cho NONE',
    }),
    warningCode: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/, 'Warning code phải ở dạng UPPER_SNAKE_CASE'),
    label: z.string().trim().min(1).max(180),
  })
  .strict();

const ingredientMetadataFields = {
  allergenCodes: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  dietCompatibilities: z.array(dietCompatibilityInputSchema).max(10).default([]),
  traditionWarnings: z.array(traditionWarningInputSchema).max(30).default([]),
};

export const createIngredientRequestSchema = z
  .object({
    canonicalName: z.string().trim().min(1).max(160),
    foodGroup: z.enum(FoodGroup),
    ...ingredientMetadataFields,
  })
  .strict();

export const updateIngredientRequestSchema = z
  .object({
    canonicalName: z.string().trim().min(1).max(160).optional(),
    foodGroup: z.enum(FoodGroup).optional(),
    status: z.enum(CatalogStatus).optional(),
    allergenCodes: ingredientMetadataFields.allergenCodes.optional(),
    dietCompatibilities: ingredientMetadataFields.dietCompatibilities.optional(),
    traditionWarnings: ingredientMetadataFields.traditionWarnings.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Cần cung cấp ít nhất một trường');

export const createIngredientAliasRequestSchema = z
  .object({ alias: z.string().trim().min(1).max(160) })
  .strict();

export const publicIngredientQuerySchema = z
  .object({
    ...paginationQueryFields,
    q: z.string().trim().min(1).max(160).optional(),
    foodGroup: z.enum(FoodGroup).optional(),
  })
  .strict();

export const adminIngredientQuerySchema = publicIngredientQuerySchema.extend({
  status: z.enum(CatalogStatus).optional(),
});

export const resolveIngredientQuerySchema = z
  .object({ query: z.string().trim().min(1).max(160) })
  .strict();

const ingredientAliasSchema = z
  .object({ id: z.string().uuid(), alias: z.string(), normalizedAlias: z.string() })
  .strict();
const ingredientDietCompatibilitySchema = z
  .object({ dietPattern: z.enum(DietPattern), compatible: z.boolean() })
  .strict();
const ingredientTraditionWarningSchema = z
  .object({ tradition: z.enum(Tradition), warningCode: z.string(), label: z.string() })
  .strict();

export const ingredientSchema = z
  .object({
    id: z.string().uuid(),
    canonicalName: z.string(),
    normalizedName: z.string(),
    foodGroup: z.enum(FoodGroup),
    status: z.enum(CatalogStatus),
    aliases: z.array(ingredientAliasSchema),
    allergenCodes: z.array(z.string()),
    dietCompatibilities: z.array(ingredientDietCompatibilitySchema),
    traditionWarnings: z.array(ingredientTraditionWarningSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const ingredientResponseSchema = z
  .object({ success: z.literal(true), data: ingredientSchema, meta: z.null() })
  .strict();
export const ingredientListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(ingredientSchema),
    meta: paginationMetaSchema,
  })
  .strict();
export const ingredientResolutionResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        query: z.string(),
        normalizedQuery: z.string(),
        match: z.enum(['NONE', 'EXACT', 'AMBIGUOUS']),
        candidates: z.array(ingredientSchema),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();
export const archiveResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ id: z.string().uuid(), status: z.literal(CatalogStatus.ARCHIVED) }).strict(),
    meta: z.null(),
  })
  .strict();

export type IdParams = z.infer<typeof idParamsSchema>;
export type AliasParams = z.infer<typeof aliasParamsSchema>;
export type PublicCategoryQuery = z.infer<typeof publicCategoryQuerySchema>;
export type AdminCategoryQuery = z.infer<typeof adminCategoryQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryRequestSchema>;
export type ArchiveCategoryQuery = z.infer<typeof archiveCategoryQuerySchema>;
export type CreateIngredientInput = z.infer<typeof createIngredientRequestSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientRequestSchema>;
export type CreateIngredientAliasInput = z.infer<typeof createIngredientAliasRequestSchema>;
export type PublicIngredientQuery = z.infer<typeof publicIngredientQuerySchema>;
export type AdminIngredientQuery = z.infer<typeof adminIngredientQuerySchema>;
export type ResolveIngredientQuery = z.infer<typeof resolveIngredientQuerySchema>;
export type CategoryOutput = z.infer<typeof categoryBaseSchema>;
export type CategoryTreeOutput = z.infer<typeof categoryTreeNodeSchema>;
export type IngredientOutput = z.infer<typeof ingredientSchema>;
