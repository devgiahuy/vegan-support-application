import {
  FoodDataImportStatus,
  FoodDataReviewStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type { CanonicalImportRecord } from './food-data-provider.js';
import type {
  AdminFoodDataRecordQuery,
  CreateFoodDataRecordInput,
  FoodDataReadQuery,
  FoodDataRecordKind,
  IngredientNutrientQuery,
  PreviewFoodDataImportInput,
} from './food-data.schemas.js';

const approvedNow = (now: Date) => ({
  reviewStatus: FoodDataReviewStatus.APPROVED,
  effectiveFrom: { lte: now },
  AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
});

export class FoodDataRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findSourceByCode(code: string) {
    return this.prisma.foodDataSource.findUnique({ where: { code } });
  }

  findImport(sourceId: string, idempotencyKey: string) {
    return this.prisma.foodDataImportBatch.findUnique({
      where: { sourceId_idempotencyKey: { sourceId, idempotencyKey } },
    });
  }

  findImportById(id: string) {
    return this.prisma.foodDataImportBatch.findUnique({ where: { id }, include: { source: true } });
  }

  findNutrientsByCodes(codes: string[]) {
    return this.prisma.nutrient.findMany({ where: { code: { in: codes }, active: true } });
  }

  findEffectiveProfileConflicts(
    sourceId: string,
    sourceRecordIds: string[],
    sourceVersion: string,
    effectiveFrom: Date,
  ) {
    return this.prisma.ingredientFoodProfile.findMany({
      where: {
        sourceId,
        sourceRecordId: { in: sourceRecordIds },
        sourceVersion: { not: sourceVersion },
        effectiveFrom,
        reviewStatus: FoodDataReviewStatus.APPROVED,
      },
      select: { sourceRecordId: true, sourceVersion: true },
    });
  }

  createImportPreview(
    sourceId: string,
    input: PreviewFoodDataImportInput,
    payloadHash: string,
    summary: Prisma.InputJsonObject,
    actorId: string,
  ) {
    return this.prisma.foodDataImportBatch.create({
      data: {
        sourceId,
        idempotencyKey: input.idempotencyKey,
        sourceVersion: input.sourceVersion,
        ...(input.sourceDate ? { sourceDate: new Date(input.sourceDate) } : {}),
        payloadHash,
        stagedPayload: input,
        summary,
        createdById: actorId,
      },
    });
  }

  async commitImport(
    importId: string,
    input: PreviewFoodDataImportInput,
    records: CanonicalImportRecord[],
    actorId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const batch = await transaction.foodDataImportBatch.findUniqueOrThrow({
        where: { id: importId },
      });
      if (batch.status === FoodDataImportStatus.COMMITTED) return batch;

      const nutrients = await transaction.nutrient.findMany({ where: { active: true } });
      const nutrientByCode = new Map(nutrients.map((nutrient) => [nutrient.code, nutrient]));

      for (const record of records) {
        const normalizedName = normalizeName(record.canonicalName);
        const ingredient = await transaction.ingredient.upsert({
          where: { normalizedName },
          update: { canonicalName: record.canonicalName, foodGroup: record.foodGroup },
          create: {
            canonicalName: record.canonicalName,
            normalizedName,
            foodGroup: record.foodGroup,
          },
        });
        const profile = await transaction.ingredientFoodProfile.upsert({
          where: {
            sourceId_sourceRecordId_sourceVersion: {
              sourceId: batch.sourceId,
              sourceRecordId: record.sourceRecordId,
              sourceVersion: input.sourceVersion,
            },
          },
          update: {
            ingredientId: ingredient.id,
            importBatchId: batch.id,
            sourceDate: input.sourceDate ? new Date(input.sourceDate) : null,
            preparation: record.preparation,
            locale: record.locale,
            ediblePortionPercent: record.ediblePortionPercent,
            servingGrams: record.servingGrams ?? null,
            quality: record.quality,
            reviewStatus: FoodDataReviewStatus.APPROVED,
            reviewedById: actorId,
            reviewedAt: new Date(),
            effectiveFrom: new Date(input.effectiveFrom),
          },
          create: {
            ingredientId: ingredient.id,
            sourceId: batch.sourceId,
            importBatchId: batch.id,
            sourceRecordId: record.sourceRecordId,
            sourceVersion: input.sourceVersion,
            ...(input.sourceDate ? { sourceDate: new Date(input.sourceDate) } : {}),
            preparation: record.preparation,
            locale: record.locale,
            ediblePortionPercent: record.ediblePortionPercent,
            ...(record.servingGrams ? { servingGrams: record.servingGrams } : {}),
            quality: record.quality,
            reviewStatus: FoodDataReviewStatus.APPROVED,
            reviewedById: actorId,
            reviewedAt: new Date(),
            effectiveFrom: new Date(input.effectiveFrom),
          },
        });

        for (const alias of record.aliases) {
          const normalizedAlias = normalizeName(alias.name);
          await transaction.ingredientAlias.upsert({
            where: {
              ingredientId_normalizedAlias: { ingredientId: ingredient.id, normalizedAlias },
            },
            update: {
              alias: alias.name,
              locale: alias.locale,
              sourceId: batch.sourceId,
              sourceRecordId: record.sourceRecordId,
              reviewStatus: FoodDataReviewStatus.APPROVED,
            },
            create: {
              ingredientId: ingredient.id,
              alias: alias.name,
              normalizedAlias,
              locale: alias.locale,
              sourceId: batch.sourceId,
              sourceRecordId: record.sourceRecordId,
              reviewStatus: FoodDataReviewStatus.APPROVED,
            },
          });
        }

        await transaction.householdConversion.deleteMany({ where: { profileId: profile.id } });
        if (record.householdConversions.length) {
          await transaction.householdConversion.createMany({
            data: record.householdConversions.map((conversion) => ({
              profileId: profile.id,
              unitName: conversion.unitName,
              unitSymbol: conversion.unitSymbol ?? null,
              quantity: conversion.quantity,
              unitDimension: conversion.unitDimension,
              grams: conversion.grams,
              quality: record.quality,
              reviewStatus: FoodDataReviewStatus.APPROVED,
              reviewedById: actorId,
              reviewedAt: new Date(),
            })),
          });
        }

        for (const value of record.nutrients) {
          const nutrient = nutrientByCode.get(value.nutrientCode);
          if (!nutrient) throw new Error(`NUTRIENT_NOT_FOUND:${value.nutrientCode}`);
          const effectiveFrom = new Date(input.effectiveFrom);
          await transaction.ingredientNutrientValue.upsert({
            where: {
              profileId_nutrientId_effectiveFrom: {
                profileId: profile.id,
                nutrientId: nutrient.id,
                effectiveFrom,
              },
            },
            update: {
              valuePer100g: value.valuePer100g,
              unit: value.unit,
              minValue: value.minValue ?? null,
              maxValue: value.maxValue ?? null,
              quality: record.quality,
              reviewStatus: FoodDataReviewStatus.APPROVED,
              reviewedById: actorId,
              reviewedAt: new Date(),
            },
            create: {
              profileId: profile.id,
              nutrientId: nutrient.id,
              valuePer100g: value.valuePer100g,
              unit: value.unit,
              minValue: value.minValue ?? null,
              maxValue: value.maxValue ?? null,
              quality: record.quality,
              reviewStatus: FoodDataReviewStatus.APPROVED,
              reviewedById: actorId,
              reviewedAt: new Date(),
              effectiveFrom,
            },
          });
        }
      }

      return transaction.foodDataImportBatch.update({
        where: { id: batch.id },
        data: { status: FoodDataImportStatus.COMMITTED, committedAt: new Date() },
      });
    });
  }

  async listIngredientNutrients(ingredientId: string, query: IngredientNutrientQuery) {
    const now = new Date();
    return this.prisma.ingredient.findFirst({
      where: { id: ingredientId, status: 'ACTIVE' },
      select: {
        id: true,
        canonicalName: true,
        foodGroup: true,
        status: true,
        aliases: {
          where: { reviewStatus: FoodDataReviewStatus.APPROVED },
          orderBy: { alias: 'asc' },
          select: {
            id: true,
            alias: true,
            locale: true,
            reviewStatus: true,
          },
        },
        foodProfiles: {
          where: {
            ...approvedNow(now),
            ...(query.preparation ? { preparation: query.preparation } : {}),
            ...(query.locale ? { locale: query.locale } : {}),
          },
          select: {
            id: true,
            sourceRecordId: true,
            sourceVersion: true,
            locale: true,
            preparation: true,
            ediblePortionPercent: true,
            servingGrams: true,
            quality: true,
            reviewStatus: true,
            effectiveFrom: true,
            effectiveTo: true,
            source: {
              select: {
                id: true,
                code: true,
                name: true,
                provider: true,
                sourceUrl: true,
                licenseName: true,
                licenseUrl: true,
                attribution: true,
                defaultLocale: true,
              },
            },
            householdConversions: {
              where: { reviewStatus: FoodDataReviewStatus.APPROVED },
              orderBy: { unitName: 'asc' },
              select: {
                id: true,
                unitName: true,
                unitSymbol: true,
                quantity: true,
                unitDimension: true,
                grams: true,
                quality: true,
                reviewStatus: true,
              },
            },
            nutrientValues: {
              where: approvedNow(now),
              orderBy: { nutrient: { name: 'asc' } },
              select: {
                id: true,
                valuePer100g: true,
                unit: true,
                minValue: true,
                maxValue: true,
                quality: true,
                reviewStatus: true,
                effectiveFrom: true,
                effectiveTo: true,
                nutrient: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    defaultUnit: true,
                    unitDimension: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: [{ effectiveFrom: 'desc' }, { sourceVersion: 'desc' }],
        },
      },
    });
  }

  async listReferenceIntakes(query: FoodDataReadQuery) {
    const now = new Date();
    const where: Prisma.NutrientReferenceIntakeWhereInput = {
      ...approvedNow(now),
      ...(query.locale ? { locale: query.locale } : {}),
      ...(query.populationCode ? { populationCode: query.populationCode } : {}),
      ...(query.nutrientCode ? { nutrient: { code: query.nutrientCode } } : {}),
    };
    return paged(
      this.prisma.nutrientReferenceIntake,
      where,
      query,
      {
        id: true,
        referenceType: true,
        populationCode: true,
        applicability: true,
        value: true,
        unit: true,
        warningEligible: true,
        reviewStatus: true,
        effectiveFrom: true,
        effectiveTo: true,
        locale: true,
        sourceRecordId: true,
        sourceVersion: true,
        nutrient: {
          select: {
            id: true,
            code: true,
            name: true,
            defaultUnit: true,
            unitDimension: true,
            description: true,
          },
        },
        source: {
          select: {
            id: true,
            code: true,
            name: true,
            provider: true,
            sourceUrl: true,
            licenseName: true,
            licenseUrl: true,
            attribution: true,
            defaultLocale: true,
          },
        },
      },
      [{ nutrient: { name: 'asc' } }, { populationCode: 'asc' }],
    );
  }

  async listGuidelines(query: FoodDataReadQuery) {
    const now = new Date();
    const where: Prisma.IngredientIntakeGuidelineWhereInput = {
      ...approvedNow(now),
      ...(query.locale ? { locale: query.locale } : {}),
      ...(query.populationCode ? { populationCode: query.populationCode } : {}),
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.ingredientIntakeGuideline.findMany({
        where,
        select: {
          id: true,
          populationCode: true,
          applicability: true,
          amount: true,
          unit: true,
          frequency: true,
          period: true,
          advisoryOnly: true,
          evidenceGrade: true,
          severity: true,
          explanation: true,
          reviewStatus: true,
          effectiveFrom: true,
          effectiveTo: true,
          locale: true,
          sourceRecordId: true,
          sourceVersion: true,
          ingredient: {
            select: {
              id: true,
              canonicalName: true,
              foodGroup: true,
            },
          },
          source: {
            select: {
              id: true,
              code: true,
              name: true,
              provider: true,
              sourceUrl: true,
              licenseName: true,
              licenseUrl: true,
              attribution: true,
              defaultLocale: true,
            },
          },
        },
        orderBy: [{ ingredient: { canonicalName: 'asc' } }, { effectiveFrom: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.ingredientIntakeGuideline.count({ where }),
    ]);
    return { records, total };
  }

  async listCookingMethods(query: FoodDataReadQuery) {
    const now = new Date();
    const where: Prisma.CookingMethodWhereInput = { active: true };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.cookingMethod.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          active: true,
          retentions: {
            where: approvedNow(now),
            orderBy: { nutrient: { name: 'asc' } },
            select: {
              id: true,
              factor: true,
              applicability: true,
              quality: true,
              reviewStatus: true,
              effectiveFrom: true,
              effectiveTo: true,
              sourceRecordId: true,
              sourceVersion: true,
              nutrient: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  defaultUnit: true,
                  unitDimension: true,
                },
              },
              source: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  provider: true,
                  sourceUrl: true,
                  licenseName: true,
                  licenseUrl: true,
                  attribution: true,
                  defaultLocale: true,
                },
              },
            },
          },
          yields: {
            where: approvedNow(now),
            orderBy: { effectiveFrom: 'desc' },
            select: {
              id: true,
              factor: true,
              applicability: true,
              quality: true,
              reviewStatus: true,
              effectiveFrom: true,
              effectiveTo: true,
              sourceRecordId: true,
              sourceVersion: true,
              ingredient: {
                select: {
                  id: true,
                  canonicalName: true,
                  foodGroup: true,
                },
              },
              source: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  provider: true,
                  sourceUrl: true,
                  licenseName: true,
                  licenseUrl: true,
                  attribution: true,
                  defaultLocale: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.cookingMethod.count({ where }),
    ]);
    return { records, total };
  }

  async listInteractionRules(query: FoodDataReadQuery) {
    const now = new Date();
    const where: Prisma.IngredientInteractionRuleWhereInput = {
      ...approvedNow(now),
      ...(query.locale ? { locale: query.locale } : {}),
      ...(query.scope ? { scope: query.scope } : {}),
      ...(query.ingredientId
        ? { OR: [{ ingredientAId: query.ingredientId }, { ingredientBId: query.ingredientId }] }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.ingredientInteractionRule.findMany({
        where,
        select: {
          id: true,
          scope: true,
          direction: true,
          severity: true,
          evidenceGrade: true,
          applicability: true,
          explanation: true,
          suggestedAction: true,
          hardRule: true,
          reviewStatus: true,
          effectiveFrom: true,
          effectiveTo: true,
          locale: true,
          sourceRecordId: true,
          sourceVersion: true,
          ingredientA: {
            select: {
              id: true,
              canonicalName: true,
              foodGroup: true,
            },
          },
          ingredientB: {
            select: {
              id: true,
              canonicalName: true,
              foodGroup: true,
            },
          },
          source: {
            select: {
              id: true,
              code: true,
              name: true,
              provider: true,
              sourceUrl: true,
              licenseName: true,
              licenseUrl: true,
              attribution: true,
              defaultLocale: true,
            },
          },
        },
        orderBy: [{ severity: 'desc' }, { effectiveFrom: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.ingredientInteractionRule.count({ where }),
    ]);
    return { records, total };
  }

  listAdminRecords(query: AdminFoodDataRecordQuery) {
    const options = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' as const },
    };
    switch (query.kind) {
      case 'SOURCE':
        return this.listModel(this.prisma.foodDataSource, options);
      case 'NUTRIENT':
        return this.listModel(this.prisma.nutrient, options);
      case 'INGREDIENT_PROFILE':
        return this.listModel(this.prisma.ingredientFoodProfile, options);
      case 'HOUSEHOLD_CONVERSION':
        return this.listModel(this.prisma.householdConversion, options);
      case 'NUTRIENT_VALUE':
        return this.listModel(this.prisma.ingredientNutrientValue, options);
      case 'REFERENCE_INTAKE':
        return this.listModel(this.prisma.nutrientReferenceIntake, options);
      case 'INGREDIENT_GUIDELINE':
        return this.listModel(this.prisma.ingredientIntakeGuideline, options);
      case 'COOKING_METHOD':
        return this.listModel(this.prisma.cookingMethod, options);
      case 'RETENTION_FACTOR':
        return this.listModel(this.prisma.nutrientRetentionFactor, options);
      case 'YIELD_FACTOR':
        return this.listModel(this.prisma.cookingYieldFactor, options);
      case 'INTERACTION_RULE':
        return this.listModel(this.prisma.ingredientInteractionRule, options);
      case 'AI_SUGGESTION':
        return this.listModel(this.prisma.foodDataSuggestion, options);
    }
  }

  createRecord(input: CreateFoodDataRecordInput, actorId: string): Promise<unknown> {
    const reviewed = 'reviewStatus' in input.data ? reviewAudit(input.data, actorId) : {};
    switch (input.kind) {
      case 'SOURCE':
        return this.prisma.foodDataSource.create({
          data: prismaData<Prisma.FoodDataSourceUncheckedCreateInput>(input.data),
        });
      case 'NUTRIENT':
        return this.prisma.nutrient.create({
          data: prismaData<Prisma.NutrientUncheckedCreateInput>(input.data),
        });
      case 'INGREDIENT_PROFILE':
        return this.prisma.ingredientFoodProfile.create({
          data: prismaData<Prisma.IngredientFoodProfileUncheckedCreateInput>({
            ...effectiveData(input.data),
            ...reviewed,
          }),
        });
      case 'HOUSEHOLD_CONVERSION':
        return this.prisma.householdConversion.create({
          data: prismaData<Prisma.HouseholdConversionUncheckedCreateInput>({
            ...input.data,
            ...reviewed,
          }),
        });
      case 'NUTRIENT_VALUE':
        return this.prisma.ingredientNutrientValue.create({
          data: prismaData<Prisma.IngredientNutrientValueUncheckedCreateInput>({
            ...effectiveData(input.data),
            ...reviewed,
          }),
        });
      case 'REFERENCE_INTAKE':
        return this.prisma.nutrientReferenceIntake.create({
          data: prismaData<Prisma.NutrientReferenceIntakeUncheckedCreateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'INGREDIENT_GUIDELINE':
        return this.prisma.ingredientIntakeGuideline.create({
          data: prismaData<Prisma.IngredientIntakeGuidelineUncheckedCreateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'COOKING_METHOD':
        return this.prisma.cookingMethod.create({
          data: prismaData<Prisma.CookingMethodUncheckedCreateInput>(input.data),
        });
      case 'RETENTION_FACTOR':
        return this.prisma.nutrientRetentionFactor.create({
          data: prismaData<Prisma.NutrientRetentionFactorUncheckedCreateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'YIELD_FACTOR':
        return this.prisma.cookingYieldFactor.create({
          data: prismaData<Prisma.CookingYieldFactorUncheckedCreateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'INTERACTION_RULE':
        return this.prisma.ingredientInteractionRule.create({
          data: prismaData<Prisma.IngredientInteractionRuleUncheckedCreateInput>({
            ...orderedInteraction(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'AI_SUGGESTION':
        return this.prisma.foodDataSuggestion.create({
          data: prismaData<Prisma.FoodDataSuggestionUncheckedCreateInput>({
            ...input.data,
            payload: input.data.payload as Prisma.InputJsonObject,
            reviewStatus: FoodDataReviewStatus.STAGED,
          }),
        });
    }
  }

  replaceRecord(id: string, input: CreateFoodDataRecordInput, actorId: string): Promise<unknown> {
    const reviewed = 'reviewStatus' in input.data ? reviewAudit(input.data, actorId) : {};
    switch (input.kind) {
      case 'SOURCE':
        return this.prisma.foodDataSource.update({
          where: { id },
          data: prismaData<Prisma.FoodDataSourceUncheckedUpdateInput>(input.data),
        });
      case 'NUTRIENT':
        return this.prisma.nutrient.update({
          where: { id },
          data: prismaData<Prisma.NutrientUncheckedUpdateInput>(input.data),
        });
      case 'INGREDIENT_PROFILE':
        return this.prisma.ingredientFoodProfile.update({
          where: { id },
          data: prismaData<Prisma.IngredientFoodProfileUncheckedUpdateInput>({
            ...effectiveData(input.data),
            ...reviewed,
          }),
        });
      case 'HOUSEHOLD_CONVERSION':
        return this.prisma.householdConversion.update({
          where: { id },
          data: prismaData<Prisma.HouseholdConversionUncheckedUpdateInput>({
            ...input.data,
            ...reviewed,
          }),
        });
      case 'NUTRIENT_VALUE':
        return this.prisma.ingredientNutrientValue.update({
          where: { id },
          data: prismaData<Prisma.IngredientNutrientValueUncheckedUpdateInput>({
            ...effectiveData(input.data),
            ...reviewed,
          }),
        });
      case 'REFERENCE_INTAKE':
        return this.prisma.nutrientReferenceIntake.update({
          where: { id },
          data: prismaData<Prisma.NutrientReferenceIntakeUncheckedUpdateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'INGREDIENT_GUIDELINE':
        return this.prisma.ingredientIntakeGuideline.update({
          where: { id },
          data: prismaData<Prisma.IngredientIntakeGuidelineUncheckedUpdateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'COOKING_METHOD':
        return this.prisma.cookingMethod.update({
          where: { id },
          data: prismaData<Prisma.CookingMethodUncheckedUpdateInput>(input.data),
        });
      case 'RETENTION_FACTOR':
        return this.prisma.nutrientRetentionFactor.update({
          where: { id },
          data: prismaData<Prisma.NutrientRetentionFactorUncheckedUpdateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'YIELD_FACTOR':
        return this.prisma.cookingYieldFactor.update({
          where: { id },
          data: prismaData<Prisma.CookingYieldFactorUncheckedUpdateInput>({
            ...effectiveData(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'INTERACTION_RULE':
        return this.prisma.ingredientInteractionRule.update({
          where: { id },
          data: prismaData<Prisma.IngredientInteractionRuleUncheckedUpdateInput>({
            ...orderedInteraction(input.data),
            applicability: input.data.applicability as Prisma.InputJsonObject,
            ...reviewed,
          }),
        });
      case 'AI_SUGGESTION':
        return this.prisma.foodDataSuggestion.update({
          where: { id },
          data: prismaData<Prisma.FoodDataSuggestionUncheckedUpdateInput>({
            ...input.data,
            payload: input.data.payload as Prisma.InputJsonObject,
            reviewStatus: FoodDataReviewStatus.STAGED,
            reviewedById: null,
            reviewedAt: null,
          }),
        });
    }
  }

  archiveRecord(kind: FoodDataRecordKind, id: string, actorId: string): Promise<unknown> {
    const reviewedAt = new Date();
    switch (kind) {
      case 'SOURCE':
        return this.prisma.foodDataSource.update({ where: { id }, data: { active: false } });
      case 'NUTRIENT':
        return this.prisma.nutrient.update({ where: { id }, data: { active: false } });
      case 'COOKING_METHOD':
        return this.prisma.cookingMethod.update({ where: { id }, data: { active: false } });
      case 'AI_SUGGESTION':
        return this.prisma.foodDataSuggestion.update({
          where: { id },
          data: { reviewStatus: FoodDataReviewStatus.REJECTED, reviewedById: actorId, reviewedAt },
        });
      case 'INGREDIENT_PROFILE':
        return this.prisma.ingredientFoodProfile.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'HOUSEHOLD_CONVERSION':
        return this.prisma.householdConversion.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'NUTRIENT_VALUE':
        return this.prisma.ingredientNutrientValue.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'REFERENCE_INTAKE':
        return this.prisma.nutrientReferenceIntake.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'INGREDIENT_GUIDELINE':
        return this.prisma.ingredientIntakeGuideline.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'RETENTION_FACTOR':
        return this.prisma.nutrientRetentionFactor.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'YIELD_FACTOR':
        return this.prisma.cookingYieldFactor.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
          },
        });
      case 'INTERACTION_RULE':
        return this.prisma.ingredientInteractionRule.update({
          where: { id },
          data: {
            reviewStatus: FoodDataReviewStatus.SUPERSEDED,
            reviewedById: actorId,
            reviewedAt,
            hardRule: false,
          },
        });
    }
  }

  private async listModel(
    model: { findMany(args: object): Promise<unknown[]>; count(): Promise<number> },
    options: object,
  ) {
    const [records, total] = await Promise.all([model.findMany(options), model.count()]);
    return { records, total };
  }
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function reviewAudit(data: { reviewStatus?: FoodDataReviewStatus }, actorId: string) {
  return data.reviewStatus === FoodDataReviewStatus.APPROVED
    ? { reviewedById: actorId, reviewedAt: new Date() }
    : { reviewedById: null, reviewedAt: null };
}

function effectiveData<
  T extends { effectiveFrom: string; effectiveTo?: string | null | undefined },
>(data: T) {
  return {
    ...data,
    effectiveFrom: new Date(data.effectiveFrom),
    effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
  };
}

function orderedInteraction<
  T extends {
    ingredientAId: string;
    ingredientBId: string;
    effectiveFrom: string;
    effectiveTo?: string | null | undefined;
  },
>(data: T) {
  const [ingredientAId, ingredientBId] = [data.ingredientAId, data.ingredientBId].sort();
  return { ...effectiveData(data), ingredientAId, ingredientBId };
}

function prismaData<T>(value: unknown): T {
  if (!value || typeof value !== 'object') return value as T;
  return Object.fromEntries(Object.entries(value).filter(([, child]) => child !== undefined)) as T;
}

async function paged(
  model: {
    findMany(args: object): Promise<unknown[]>;
    count(args: object): Promise<number>;
  },
  where: object,
  query: FoodDataReadQuery,
  select: object,
  orderBy: object[],
) {
  const [records, total] = await Promise.all([
    model.findMany({
      where,
      select,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    model.count({ where }),
  ]);
  return { records, total };
}
