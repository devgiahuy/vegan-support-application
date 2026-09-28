import {
  EvidenceGrade,
  FoodDataProvider,
  FoodDataQuality,
  FoodDataReviewStatus,
  FoodDataSuggestionType,
  FoodGroup,
  FoodRuleSeverity,
  GuidelinePeriod,
  InteractionDirection,
  InteractionScope,
  NutrientReferenceType,
  UnitDimension,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';

const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .pipe(z.string().regex(/^\d+(?:\.\d+)?$/, 'Giá trị phải là số thập phân không âm'));
const positiveDecimalSchema = decimalSchema.refine((value) => Number(value) > 0, {
  message: 'Giá trị phải lớn hơn 0',
});
const factorSchema = decimalSchema.refine((value) => Number(value) >= 0 && Number(value) <= 1, {
  message: 'Hệ số phải nằm trong khoảng 0 đến 1',
});
const dateSchema = z.string().date();
const localeSchema = z.string().trim().min(2).max(20);
const sourceVersionSchema = z.string().trim().min(1).max(120);
const sourceRecordIdSchema = z.string().trim().min(1).max(160);
const applicabilitySchema = z.record(z.string(), z.unknown()).default({});

export const foodDataIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const ingredientFoodDataParamsSchema = z
  .object({ ingredientId: z.string().uuid() })
  .strict();
export const importIdParamsSchema = z.object({ importId: z.string().uuid() }).strict();

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const foodDataReadQuerySchema = z
  .object({
    ...paginationFields,
    locale: localeSchema.optional(),
    populationCode: z.string().trim().min(1).max(120).optional(),
    nutrientCode: z.string().trim().min(1).max(80).optional(),
    ingredientId: z.string().uuid().optional(),
    scope: z.enum(InteractionScope).optional(),
  })
  .strict();

export const ingredientNutrientQuerySchema = z
  .object({
    preparation: z.string().trim().min(1).max(120).optional(),
    locale: localeSchema.optional(),
  })
  .strict();

const provenanceFields = {
  sourceId: z.string().uuid(),
  sourceRecordId: sourceRecordIdSchema,
  sourceVersion: sourceVersionSchema,
  locale: localeSchema.default('en-US'),
  effectiveFrom: dateSchema,
  effectiveTo: dateSchema.nullable().optional(),
  reviewStatus: z.enum(FoodDataReviewStatus).default(FoodDataReviewStatus.STAGED),
};

const sourceDataSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Z0-9_]+$/),
    name: z.string().trim().min(1).max(200),
    provider: z.enum(FoodDataProvider).refine((value) => value !== FoodDataProvider.AI_SUGGESTION, {
      message: 'AI không thể là nguồn dữ liệu chuẩn',
    }),
    sourceUrl: z.string().url().max(2048).nullable().optional(),
    licenseName: z.string().trim().min(1).max(200),
    licenseUrl: z.string().url().max(2048).nullable().optional(),
    attribution: z.string().trim().min(1).max(1000),
    defaultLocale: localeSchema.default('en-US'),
    active: z.boolean().default(true),
  })
  .strict();

const nutrientDataSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Z0-9_]+$/),
    name: z.string().trim().min(1).max(160),
    defaultUnit: z.string().trim().min(1).max(20),
    unitDimension: z.enum(UnitDimension),
    description: z.string().trim().max(1000).nullable().optional(),
    active: z.boolean().default(true),
  })
  .strict();

const profileDataSchema = z
  .object({
    ingredientId: z.string().uuid(),
    importBatchId: z.string().uuid().nullable().optional(),
    preparation: z.string().trim().min(1).max(120).default('raw'),
    ediblePortionPercent: decimalSchema.refine(
      (value) => Number(value) > 0 && Number(value) <= 100,
      'Tỷ lệ phần ăn được phải lớn hơn 0 và không vượt quá 100',
    ),
    servingGrams: positiveDecimalSchema.nullable().optional(),
    quality: z.enum(FoodDataQuality),
    ...provenanceFields,
  })
  .strict();

const conversionDataSchema = z
  .object({
    profileId: z.string().uuid(),
    unitName: z.string().trim().min(1).max(100),
    unitSymbol: z.string().trim().min(1).max(30).nullable().optional(),
    quantity: positiveDecimalSchema,
    unitDimension: z
      .enum(UnitDimension)
      .refine(
        (value) => value === UnitDimension.COUNT || value === UnitDimension.VOLUME,
        'Đơn vị gia dụng chỉ được có dimension COUNT hoặc VOLUME',
      ),
    grams: positiveDecimalSchema,
    quality: z.enum(FoodDataQuality),
    reviewStatus: z.enum(FoodDataReviewStatus).default(FoodDataReviewStatus.STAGED),
  })
  .strict();

const nutrientValueDataSchema = z
  .object({
    profileId: z.string().uuid(),
    nutrientId: z.string().uuid(),
    valuePer100g: decimalSchema,
    unit: z.string().trim().min(1).max(20),
    minValue: decimalSchema.nullable().optional(),
    maxValue: decimalSchema.nullable().optional(),
    quality: z.enum(FoodDataQuality),
    reviewStatus: z.enum(FoodDataReviewStatus).default(FoodDataReviewStatus.STAGED),
    effectiveFrom: dateSchema,
    effectiveTo: dateSchema.nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const amount = Number(value.valuePer100g);
    if (
      value.minValue !== undefined &&
      value.minValue !== null &&
      Number(value.minValue) > amount
    ) {
      context.addIssue({
        code: 'custom',
        path: ['minValue'],
        message: 'minValue không thể lớn hơn valuePer100g',
      });
    }
    if (
      value.maxValue !== undefined &&
      value.maxValue !== null &&
      Number(value.maxValue) < amount
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maxValue'],
        message: 'maxValue không thể nhỏ hơn valuePer100g',
      });
    }
  });

const referenceIntakeDataSchema = z
  .object({
    nutrientId: z.string().uuid(),
    referenceType: z.enum(NutrientReferenceType),
    populationCode: z.string().trim().min(1).max(120),
    applicability: applicabilitySchema,
    value: positiveDecimalSchema,
    unit: z.string().trim().min(1).max(20),
    warningEligible: z.boolean().default(false),
    ...provenanceFields,
  })
  .strict();

const guidelineDataSchema = z
  .object({
    ingredientId: z.string().uuid(),
    populationCode: z.string().trim().min(1).max(120),
    applicability: applicabilitySchema,
    amount: positiveDecimalSchema,
    unit: z.string().trim().min(1).max(30),
    frequency: positiveDecimalSchema.default('1'),
    period: z.enum(GuidelinePeriod),
    advisoryOnly: z.boolean().default(true),
    evidenceGrade: z.enum(EvidenceGrade),
    severity: z.enum(FoodRuleSeverity),
    explanation: z.string().trim().min(1).max(2000),
    ...provenanceFields,
  })
  .strict();

const cookingMethodDataSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Z0-9_]+$/),
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).nullable().optional(),
    active: z.boolean().default(true),
  })
  .strict();

const retentionFactorDataSchema = z
  .object({
    cookingMethodId: z.string().uuid(),
    nutrientId: z.string().uuid(),
    factor: factorSchema,
    applicability: applicabilitySchema,
    quality: z.enum(FoodDataQuality),
    ...provenanceFields,
  })
  .strict();

const yieldFactorDataSchema = z
  .object({
    cookingMethodId: z.string().uuid(),
    ingredientId: z.string().uuid().nullable().optional(),
    factor: positiveDecimalSchema,
    applicability: applicabilitySchema,
    quality: z.enum(FoodDataQuality),
    ...provenanceFields,
  })
  .strict();

const interactionRuleDataSchema = z
  .object({
    ingredientAId: z.string().uuid(),
    ingredientBId: z.string().uuid(),
    scope: z.enum(InteractionScope),
    direction: z.enum(InteractionDirection),
    severity: z.enum(FoodRuleSeverity),
    evidenceGrade: z.enum(EvidenceGrade),
    applicability: applicabilitySchema,
    explanation: z.string().trim().min(1).max(2000),
    suggestedAction: z.string().trim().max(1000).nullable().optional(),
    hardRule: z.boolean().default(false),
    ...provenanceFields,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.ingredientAId === value.ingredientBId) {
      context.addIssue({
        code: 'custom',
        path: ['ingredientBId'],
        message: 'Interaction cần hai ingredient khác nhau',
      });
    }
    if (
      value.hardRule &&
      (value.reviewStatus !== FoodDataReviewStatus.APPROVED ||
        value.evidenceGrade === EvidenceGrade.INSUFFICIENT)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['hardRule'],
        message: 'Hard rule cần APPROVED và evidence đã được hỗ trợ',
      });
    }
  });

const suggestionDataSchema = z
  .object({
    suggestionType: z.enum(FoodDataSuggestionType),
    provider: z.literal(FoodDataProvider.AI_SUGGESTION).default(FoodDataProvider.AI_SUGGESTION),
    payload: z.record(z.string(), z.unknown()),
    rationale: z.string().trim().max(2000).nullable().optional(),
    confidence: factorSchema.nullable().optional(),
  })
  .strict();

export const foodDataRecordKindSchema = z.enum([
  'SOURCE',
  'NUTRIENT',
  'INGREDIENT_PROFILE',
  'HOUSEHOLD_CONVERSION',
  'NUTRIENT_VALUE',
  'REFERENCE_INTAKE',
  'INGREDIENT_GUIDELINE',
  'COOKING_METHOD',
  'RETENTION_FACTOR',
  'YIELD_FACTOR',
  'INTERACTION_RULE',
  'AI_SUGGESTION',
]);

export const adminFoodDataRecordQuerySchema = z
  .object({ ...paginationFields, kind: foodDataRecordKindSchema })
  .strict();
export const foodDataRecordKindQuerySchema = z.object({ kind: foodDataRecordKindSchema }).strict();

export const createFoodDataRecordRequestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SOURCE'), data: sourceDataSchema }).strict(),
  z.object({ kind: z.literal('NUTRIENT'), data: nutrientDataSchema }).strict(),
  z.object({ kind: z.literal('INGREDIENT_PROFILE'), data: profileDataSchema }).strict(),
  z.object({ kind: z.literal('HOUSEHOLD_CONVERSION'), data: conversionDataSchema }).strict(),
  z.object({ kind: z.literal('NUTRIENT_VALUE'), data: nutrientValueDataSchema }).strict(),
  z.object({ kind: z.literal('REFERENCE_INTAKE'), data: referenceIntakeDataSchema }).strict(),
  z.object({ kind: z.literal('INGREDIENT_GUIDELINE'), data: guidelineDataSchema }).strict(),
  z.object({ kind: z.literal('COOKING_METHOD'), data: cookingMethodDataSchema }).strict(),
  z.object({ kind: z.literal('RETENTION_FACTOR'), data: retentionFactorDataSchema }).strict(),
  z.object({ kind: z.literal('YIELD_FACTOR'), data: yieldFactorDataSchema }).strict(),
  z.object({ kind: z.literal('INTERACTION_RULE'), data: interactionRuleDataSchema }).strict(),
  z.object({ kind: z.literal('AI_SUGGESTION'), data: suggestionDataSchema }).strict(),
]);

export const replaceFoodDataRecordRequestSchema = createFoodDataRecordRequestSchema;

const importAliasSchema = z
  .object({ name: z.string().trim().min(1).max(160), locale: localeSchema.default('en-US') })
  .strict();
const importMeasureSchema = z
  .object({
    unitName: z.string().trim().min(1).max(100),
    unitSymbol: z.string().trim().min(1).max(30).nullable().optional(),
    quantity: positiveDecimalSchema,
    unitDimension: z
      .enum(UnitDimension)
      .refine(
        (value) => value === UnitDimension.COUNT || value === UnitDimension.VOLUME,
        'Đơn vị gia dụng chỉ được có dimension COUNT hoặc VOLUME',
      ),
    grams: positiveDecimalSchema,
  })
  .strict();
const importNutrientValueSchema = z
  .object({
    nutrientCode: z.string().trim().min(1).max(80),
    valuePer100g: decimalSchema,
    unit: z.string().trim().min(1).max(20),
    minValue: decimalSchema.nullable().optional(),
    maxValue: decimalSchema.nullable().optional(),
  })
  .strict();

export const importFoodRecordSchema = z
  .object({
    sourceRecordId: sourceRecordIdSchema,
    canonicalName: z.string().trim().min(1).max(160),
    foodGroup: z.enum(FoodGroup),
    preparation: z.string().trim().min(1).max(120).default('raw'),
    locale: localeSchema.default('en-US'),
    ediblePortionPercent: decimalSchema.refine(
      (value) => Number(value) > 0 && Number(value) <= 100,
      'Tỷ lệ phần ăn được phải lớn hơn 0 và không vượt quá 100',
    ),
    servingGrams: positiveDecimalSchema.nullable().optional(),
    quality: z.enum(FoodDataQuality).default(FoodDataQuality.REVIEWED),
    aliases: z.array(importAliasSchema).max(50).default([]),
    householdConversions: z.array(importMeasureSchema).max(100).default([]),
    nutrients: z.array(importNutrientValueSchema).max(500).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    const aliases = new Set<string>();
    value.aliases.forEach((alias, index) => {
      const key = `${alias.locale}:${normalizeVietnameseText(alias.name)}`;
      if (aliases.has(key))
        context.addIssue({
          code: 'custom',
          path: ['aliases', index],
          message: 'Alias bị trùng trong record',
        });
      aliases.add(key);
    });
    const nutrients = new Set<string>();
    value.nutrients.forEach((nutrient, index) => {
      const nutrientCode = nutrient.nutrientCode.toUpperCase();
      if (nutrients.has(nutrientCode))
        context.addIssue({
          code: 'custom',
          path: ['nutrients', index],
          message: 'Nutrient bị trùng trong record',
        });
      nutrients.add(nutrientCode);
      const amount = Number(nutrient.valuePer100g);
      if (nutrient.minValue && Number(nutrient.minValue) > amount)
        context.addIssue({
          code: 'custom',
          path: ['nutrients', index, 'minValue'],
          message: 'minValue không hợp lệ',
        });
      if (nutrient.maxValue && Number(nutrient.maxValue) < amount)
        context.addIssue({
          code: 'custom',
          path: ['nutrients', index, 'maxValue'],
          message: 'maxValue không hợp lệ',
        });
    });
    const conversions = new Set<string>();
    value.householdConversions.forEach((conversion, index) => {
      const key = `${normalizeVietnameseText(conversion.unitName)}:${conversion.quantity}`;
      if (conversions.has(key))
        context.addIssue({
          code: 'custom',
          path: ['householdConversions', index],
          message: 'Household conversion bị trùng trong record',
        });
      conversions.add(key);
    });
  });

export const previewFoodDataImportRequestSchema = z
  .object({
    sourceCode: z.string().trim().min(1).max(80),
    idempotencyKey: z.string().trim().min(8).max(160),
    sourceVersion: sourceVersionSchema,
    sourceDate: dateSchema.nullable().optional(),
    effectiveFrom: dateSchema,
    records: z.array(importFoodRecordSchema).min(1).max(500),
  })
  .strict();

export const commitFoodDataImportRequestSchema = z.object({ importId: z.string().uuid() }).strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .strict();
const dataRecordSchema = z.record(z.string(), z.unknown());
export const foodDataListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(dataRecordSchema), meta: paginationMetaSchema })
  .strict();
export const foodDataRecordResponseSchema = z
  .object({ success: z.literal(true), data: dataRecordSchema, meta: z.null() })
  .strict();
export const foodDataImportResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        importId: z.string().uuid(),
        status: z.enum(['PREVIEWED', 'COMMITTED']),
        idempotentReplay: z.boolean(),
        summary: dataRecordSchema,
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export type FoodDataIdParams = z.infer<typeof foodDataIdParamsSchema>;
export type IngredientFoodDataParams = z.infer<typeof ingredientFoodDataParamsSchema>;
export type ImportIdParams = z.infer<typeof importIdParamsSchema>;
export type FoodDataReadQuery = z.infer<typeof foodDataReadQuerySchema>;
export type IngredientNutrientQuery = z.infer<typeof ingredientNutrientQuerySchema>;
export type AdminFoodDataRecordQuery = z.infer<typeof adminFoodDataRecordQuerySchema>;
export type FoodDataRecordKindQuery = z.infer<typeof foodDataRecordKindQuerySchema>;
export type FoodDataRecordKind = z.infer<typeof foodDataRecordKindSchema>;
export type CreateFoodDataRecordInput = z.infer<typeof createFoodDataRecordRequestSchema>;
export type PreviewFoodDataImportInput = z.infer<typeof previewFoodDataImportRequestSchema>;
export type CommitFoodDataImportInput = z.infer<typeof commitFoodDataImportRequestSchema>;
export type ImportFoodRecord = z.infer<typeof importFoodRecordSchema>;
