import { normalizeAllergyCatalog } from './composition.data.js';
import {
  CatalogStatus,
  CategoryType,
  CommentStatus,
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorDecisionType,
  DietPattern,
  FoodDataImportStatus,
  FoodDataQuality,
  FoodDataProvider,
  FoodDataReviewStatus,
  IngredientResolutionStatus,
  MediaKind,
  MediaAssetStatus,
  MediaProvider,
  NutritionValueOrigin,
  PantryAdjustmentType,
  PostRevisionStatus,
  PostStatus,
  PostType,
  type Prisma,
  RecipeNutritionEstimateStatus,
  type PrismaClient,
  Tradition,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { upsertSeedContributorDecision } from '../seed-contributor-decision.js';
import { normalizeVietnameseText } from '../../src/modules/catalog/catalog.normalization.js';
import { USDA_SR_LEGACY_SOURCE, type IngredientSeedItem } from './ingredients.data.js';
import { DRI_SOURCE, type NutrientCode } from './nutrients.data.js';
import type { SeedRecipeDefinition } from './recipes.data.js';
import {
  allergenDefinitions,
  bookmarkDefinitions,
  categoryDefinitions,
  chatSessionDefinitions,
  commentDefinitions,
  cookingMethodDefinitions,
  customMealDefinitions,
  handbookDefinitions,
  ingredientDefinitions,
  interactionRuleDefinitions,
  mediaAssetDefinitions,
  nutrientDefinitions,
  nutrientReferenceIntakes,
  pantryDefinitions,
  ratingDefinitions,
  recipeDefinitions,
  userDefinitions,
  videoDefinitions,
  voteDefinitions,
} from './index.js';
import { youtubeThumbnail } from './videos.data.js';

function postTagRows(tags: readonly string[]) {
  return tags.map((tag) => ({ tag, normalizedTag: normalizeVietnameseText(tag) }));
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

interface RecipeFacts {
  perServing: Partial<Record<NutrientCode, number>>;
  totalRawGrams: number;
  uncovered: Array<{ position: number; displayName: string; reason: string }>;
  sources: string[];
  proxyCount: number;
  allergenCodes: string[];
  traditionWarnings: Array<{ tradition: Tradition; warningCode: string; label: string }>;
  vegan: boolean;
  lactoOvo: boolean;
}

function ingredientGrams(definition: IngredientSeedItem, amount: number, unit: string) {
  if (unit === 'g') return amount;
  if (unit === 'kg') return amount * 1000;
  const conversion = definition.conversions.find((item) => item.unitName === unit);
  return conversion ? (amount / conversion.quantity) * conversion.grams : null;
}

function deriveRecipeFacts(
  recipe: SeedRecipeDefinition,
  definitions: Map<string, IngredientSeedItem>,
): RecipeFacts {
  const totals: Partial<Record<NutrientCode, number>> = {};
  const uncovered: RecipeFacts['uncovered'] = [];
  const sources = new Set<string>();
  const allergens = new Set<string>();
  const warnings = new Map<string, RecipeFacts['traditionWarnings'][number]>();
  let totalRawGrams = 0;
  let proxyCount = 0;
  let vegan = true;
  let lactoOvo = true;
  recipe.ingredients.forEach((item, position) => {
    const definition = definitions.get(item.ingredientNormalizedName);
    if (!definition) throw new Error(`Unknown ingredient ${item.ingredientNormalizedName}`);
    definition.allergens.forEach((code) => allergens.add(code));
    vegan &&= definition.vegan;
    lactoOvo &&= definition.lactoOvo;
    if (definition.buddhistWarning)
      warnings.set(definition.buddhistWarning[0], {
        tradition: Tradition.BUDDHIST,
        warningCode: definition.buddhistWarning[0],
        label: `${definition.buddhistWarning[1]}: ${item.displayName.toLowerCase()}`,
      });
    const grams = ingredientGrams(definition, item.amount, item.unit);
    if (grams !== null) totalRawGrams += grams;
    if (!definition.nutrientSource || grams === null) {
      uncovered.push({
        position,
        displayName: item.displayName,
        reason: definition.nutrientSource ? 'UNIT_NOT_CONVERTIBLE' : 'NO_CANONICAL_PROFILE',
      });
      return;
    }
    sources.add(String(definition.nutrientSource.fdcId));
    if (definition.nutrientSource.match === 'PROXY') proxyCount++;
    for (const [code, value] of Object.entries(definition.nutrients) as [NutrientCode, number][])
      totals[code] = (totals[code] ?? 0) + (value * grams) / 100;
  });
  const perServing = Object.fromEntries(
    Object.entries(totals).map(([code, value]) => [code, value / recipe.servings]),
  ) as Partial<Record<NutrientCode, number>>;
  return {
    perServing,
    totalRawGrams,
    uncovered,
    sources: [...sources].sort(),
    proxyCount,
    allergenCodes: [...allergens].sort(),
    traditionWarnings: [...warnings.values()],
    vegan,
    lactoOvo,
  };
}

interface SeedContentMedia {
  kind: MediaKind;
  provider: MediaProvider;
  secureUrl: string;
  publicId: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  durationSeconds: number | null;
  position: number;
}

/**
 * Keeps a seeded BLOG/VIDEO post in sync with its fixture. Changed content is published as a new
 * revision (like an edit in the app), so earlier revisions and their references stay intact.
 */
async function syncSeedContentPost(
  prisma: PrismaClient,
  input: {
    type: PostType;
    slug: string;
    authorId: string;
    publishedAt: Date;
    categoryIds: string[];
    title: string;
    excerpt: string;
    body: string;
    tags: readonly string[];
    media: SeedContentMedia[];
  },
) {
  const snapshotOf = (value: {
    title: string;
    excerpt: string | null;
    body: string;
    categoryIds: string[];
    tags: string[];
    media: Array<{ kind: MediaKind; secureUrl: string }>;
  }) =>
    JSON.stringify({
      ...value,
      categoryIds: [...value.categoryIds].sort(),
      tags: [...value.tags].sort(),
      media: value.media
        .map(({ kind, secureUrl }) => ({ kind, secureUrl }))
        .sort((a, b) => a.kind.localeCompare(b.kind)),
    });
  let post = await prisma.post.findUnique({ where: { slug: input.slug } });
  if (!post)
    post = await prisma.post.create({
      data: {
        authorId: input.authorId,
        type: input.type,
        slug: input.slug,
        status: PostStatus.PUBLISHED,
        version: 1,
        publishedAt: input.publishedAt,
      },
    });
  const current = post.publishedRevisionId
    ? await prisma.postRevision.findUnique({
        where: { id: post.publishedRevisionId },
        include: { tags: true, categories: true, media: true },
      })
    : null;
  const fixture = snapshotOf({
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    categoryIds: input.categoryIds,
    tags: input.tags.map(normalizeVietnameseText),
    media: input.media,
  });
  if (
    current &&
    snapshotOf({
      title: current.title,
      excerpt: current.excerpt,
      body: current.body,
      categoryIds: current.categories.map((category) => category.categoryId),
      tags: current.tags.map((tag) => tag.normalizedTag),
      media: current.media,
    }) === fixture
  )
    return { post, revisionId: current.id };

  const latest = await prisma.postRevision.findFirst({
    where: { postId: post.id },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const version = latest ? Math.max(post.version, latest.version) + 1 : 1;
  const revision = await prisma.postRevision.create({
    data: {
      postId: post.id,
      createdById: input.authorId,
      version,
      status: PostRevisionStatus.PUBLISHED,
      title: input.title,
      normalizedTitle: normalizeVietnameseText(input.title),
      excerpt: input.excerpt,
      normalizedExcerpt: normalizeVietnameseText(input.excerpt),
      body: input.body,
      normalizedBody: normalizeVietnameseText(input.body),
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      tags: { create: postTagRows(input.tags) },
      media: { create: input.media },
    },
  });
  post = await prisma.post.update({
    where: { id: post.id },
    data: { version, status: PostStatus.PUBLISHED, publishedRevisionId: revision.id },
  });
  return { post, revisionId: revision.id };
}

export async function seedComprehensiveData(
  prisma: PrismaClient,
  options: {
    adminId: string;
    defaultPasswordHash: string;
  },
): Promise<void> {
  const { adminId, defaultPasswordHash } = options;

  // ==========================================
  // 1. ALLERGENS
  // ==========================================
  for (const allergen of allergenDefinitions) {
    await prisma.allergenDefinition.upsert({
      where: { code: allergen.code },
      update: { label: allergen.label, description: allergen.description ?? null, active: true },
      create: {
        code: allergen.code,
        label: allergen.label,
        description: allergen.description ?? null,
        active: true,
      },
    });
  }

  // ==========================================
  // 2. CATEGORIES TREE
  // ==========================================
  const categoryIdMap = new Map<string, string>();
  for (const definition of categoryDefinitions) {
    const parentId = definition.parentSlug
      ? categoryIdMap.get(`${definition.type}:${definition.parentSlug}`)
      : undefined;

    const existing = await prisma.category.findFirst({
      where: { type: definition.type, slug: definition.slug, parentId: parentId ?? null },
    });

    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: definition.name,
            sortOrder: definition.sortOrder,
            status: CatalogStatus.ACTIVE,
          },
        })
      : await prisma.category.create({
          data: {
            type: definition.type,
            name: definition.name,
            slug: definition.slug,
            sortOrder: definition.sortOrder,
            status: CatalogStatus.ACTIVE,
            ...(parentId ? { parentId } : {}),
          },
        });

    categoryIdMap.set(`${definition.type}:${definition.slug}`, category.id);
  }

  // ==========================================
  // 3. FOOD DATA SOURCES & NUTRIENTS
  // ==========================================
  // Project-authored records (educational interaction notes) keep this source.
  const projectSource = await prisma.foodDataSource.upsert({
    where: { code: 'PROJECT_DEMO_V1' },
    update: {
      name: 'VeggieConnect curated notes',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution:
        'Project-authored educational summaries; each record cites its published references.',
      defaultLocale: 'vi-VN',
      active: true,
    },
    create: {
      code: 'PROJECT_DEMO_V1',
      name: 'VeggieConnect curated notes',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution:
        'Project-authored educational summaries; each record cites its published references.',
      defaultLocale: 'vi-VN',
      active: true,
    },
  });
  const usdaSourceData = {
    name: USDA_SR_LEGACY_SOURCE.name,
    provider: FoodDataProvider.USDA_FDC,
    sourceUrl: USDA_SR_LEGACY_SOURCE.sourceUrl,
    licenseName: USDA_SR_LEGACY_SOURCE.licenseName,
    licenseUrl: USDA_SR_LEGACY_SOURCE.licenseUrl,
    attribution: USDA_SR_LEGACY_SOURCE.attribution,
    defaultLocale: 'en-US',
    active: true,
  };
  const usdaSource = await prisma.foodDataSource.upsert({
    where: { code: USDA_SR_LEGACY_SOURCE.code },
    update: usdaSourceData,
    create: { code: USDA_SR_LEGACY_SOURCE.code, ...usdaSourceData },
  });
  const driSourceData = {
    name: DRI_SOURCE.name,
    provider: FoodDataProvider.MANUAL,
    sourceUrl: DRI_SOURCE.sourceUrl,
    licenseName: DRI_SOURCE.licenseName,
    licenseUrl: DRI_SOURCE.licenseUrl,
    attribution: DRI_SOURCE.attribution,
    defaultLocale: 'en-US',
    active: true,
  };
  const driSource = await prisma.foodDataSource.upsert({
    where: { code: DRI_SOURCE.code },
    update: driSourceData,
    create: { code: DRI_SOURCE.code, ...driSourceData },
  });

  // Data seeded before the 2026-10-26 normalization used project-authored values. Retire them
  // instead of deleting so history stays auditable; the reviewed sources below replace them.
  const supersededAt = new Date('2026-10-26T00:00:00.000Z');
  const seedDataEffectiveFrom = supersededAt;
  const superseded = { reviewStatus: FoodDataReviewStatus.SUPERSEDED, effectiveTo: supersededAt };
  const legacyProfiles = await prisma.ingredientFoodProfile.findMany({
    where: {
      sourceId: projectSource.id,
      sourceVersion: '1.0',
      sourceRecordId: { startsWith: 'profile-' },
      reviewStatus: { not: FoodDataReviewStatus.SUPERSEDED },
    },
    select: { id: true },
  });
  if (legacyProfiles.length) {
    const profileIds = legacyProfiles.map((profile) => profile.id);
    await prisma.ingredientNutrientValue.updateMany({
      where: { profileId: { in: profileIds } },
      data: superseded,
    });
    await prisma.householdConversion.updateMany({
      where: { profileId: { in: profileIds } },
      data: { reviewStatus: FoodDataReviewStatus.SUPERSEDED },
    });
    await prisma.ingredientFoodProfile.updateMany({
      where: { id: { in: profileIds } },
      data: superseded,
    });
  }
  await prisma.nutrientReferenceIntake.updateMany({
    where: {
      sourceId: projectSource.id,
      sourceVersion: '1.0',
      sourceRecordId: { startsWith: 'ref-' },
      reviewStatus: { not: FoodDataReviewStatus.SUPERSEDED },
    },
    data: superseded,
  });
  await prisma.ingredientInteractionRule.updateMany({
    where: {
      sourceId: projectSource.id,
      sourceVersion: '1.0',
      reviewStatus: { not: FoodDataReviewStatus.SUPERSEDED },
    },
    data: superseded,
  });

  const nutrientMap = new Map<string, { id: string; defaultUnit: string }>();
  for (const definition of nutrientDefinitions) {
    const nutrient = await prisma.nutrient.upsert({
      where: { code: definition.code },
      update: {
        name: definition.name,
        defaultUnit: definition.defaultUnit,
        unitDimension: definition.unitDimension,
        description: definition.description ?? null,
        active: true,
      },
      create: {
        code: definition.code,
        name: definition.name,
        defaultUnit: definition.defaultUnit,
        unitDimension: definition.unitDimension,
        description: definition.description ?? null,
        active: true,
      },
    });
    nutrientMap.set(definition.code, { id: nutrient.id, defaultUnit: definition.defaultUnit });
  }

  // Reference intakes (NASEM DRI, adults 19-50)
  for (const ref of nutrientReferenceIntakes) {
    const nutrient = nutrientMap.get(ref.nutrientCode);
    if (!nutrient) continue;
    const sourceRecordId = `${ref.nutrientCode}:${ref.referenceType}:${ref.populationCode}`;
    const data = {
      nutrientId: nutrient.id,
      referenceType: ref.referenceType,
      populationCode: ref.populationCode,
      applicability: { ...ref.applicability, ...(ref.note ? { note: ref.note } : {}) },
      value: ref.value,
      unit: ref.unit,
      warningEligible: ref.warningEligible ?? false,
      sourceVersion: DRI_SOURCE.sourceVersion,
      locale: 'vi-VN',
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
    };
    await prisma.nutrientReferenceIntake.upsert({
      where: {
        sourceId_sourceRecordId_effectiveFrom: {
          sourceId: driSource.id,
          sourceRecordId,
          effectiveFrom: seedDataEffectiveFrom,
        },
      },
      update: data,
      create: {
        ...data,
        sourceId: driSource.id,
        sourceRecordId,
        effectiveFrom: seedDataEffectiveFrom,
      },
    });
  }

  // Cooking methods
  const cookingMethodMap = new Map<string, { id: string }>();
  for (const cm of cookingMethodDefinitions) {
    const method = await prisma.cookingMethod.upsert({
      where: { code: cm.code },
      update: { name: cm.name, description: cm.description ?? null, active: true },
      create: { code: cm.code, name: cm.name, description: cm.description ?? null, active: true },
    });
    cookingMethodMap.set(cm.code, method);
  }

  // ==========================================
  // 4. CANONICAL INGREDIENTS (USDA FoodData Central SR Legacy)
  // ==========================================
  const importPayload = ingredientDefinitions.map((def) => ({
    normalizedName: def.normalizedName,
    fdcId: def.nutrientSource?.fdcId ?? null,
    ndbNumber: def.nutrientSource?.ndbNumber ?? null,
    usdaDescription: def.nutrientSource?.description ?? null,
    match: def.nutrientSource?.match ?? null,
    note: def.note ?? null,
    nutrientNotes: def.nutrientNotes ?? [],
  }));
  const importPayloadHash = createHash('sha256')
    .update(JSON.stringify(importPayload))
    .digest('hex');
  const importBatchData = {
    sourceVersion: USDA_SR_LEGACY_SOURCE.sourceVersion,
    sourceDate: new Date(USDA_SR_LEGACY_SOURCE.sourceDate),
    payloadHash: importPayloadHash,
    status: FoodDataImportStatus.COMMITTED,
    stagedPayload: importPayload,
    summary: {
      dataset: USDA_SR_LEGACY_SOURCE.dataset,
      ingredients: importPayload.length,
      withProfile: importPayload.filter((item) => item.fdcId !== null).length,
      proxyMatches: importPayload.filter((item) => item.match === 'PROXY').length,
      withoutProfile: importPayload
        .filter((item) => item.fdcId === null)
        .map((item) => item.normalizedName),
    },
    committedAt: seedDataEffectiveFrom,
  };
  const importBatch = await prisma.foodDataImportBatch.upsert({
    where: {
      sourceId_idempotencyKey: {
        sourceId: usdaSource.id,
        idempotencyKey: 'seed-sr-legacy-2018-04',
      },
    },
    update: importBatchData,
    create: {
      ...importBatchData,
      sourceId: usdaSource.id,
      idempotencyKey: 'seed-sr-legacy-2018-04',
      createdById: adminId,
    },
  });

  const ingredientMap = new Map<
    string,
    { id: string; canonicalName: string; normalizedName: string }
  >();
  for (const def of ingredientDefinitions) {
    const ingredient = await prisma.ingredient.upsert({
      where: { normalizedName: def.normalizedName },
      update: {
        canonicalName: def.canonicalName,
        foodGroup: def.foodGroup,
        status: CatalogStatus.ACTIVE,
      },
      create: {
        canonicalName: def.canonicalName,
        normalizedName: def.normalizedName,
        foodGroup: def.foodGroup,
        status: CatalogStatus.ACTIVE,
      },
    });
    ingredientMap.set(def.normalizedName, ingredient);

    // Aliases
    await prisma.ingredientAlias.deleteMany({ where: { ingredientId: ingredient.id } });
    const aliases = [
      ...new Map(
        [def.canonicalName, ...def.aliases].map((alias) => [normalizeVietnameseText(alias), alias]),
      ).values(),
    ];
    if (aliases.length > 0) {
      await prisma.ingredientAlias.createMany({
        data: aliases.map((alias) => ({
          ingredientId: ingredient.id,
          alias,
          normalizedAlias: normalizeVietnameseText(alias),
        })),
      });
    }

    // Allergens
    await prisma.ingredientAllergen.deleteMany({ where: { ingredientId: ingredient.id } });
    if (def.allergens.length > 0) {
      await prisma.ingredientAllergen.createMany({
        data: def.allergens.map((allergenCode) => ({
          ingredientId: ingredient.id,
          allergenCode,
        })),
      });
    }

    // Diet compatibility
    await prisma.ingredientDietCompatibility.deleteMany({ where: { ingredientId: ingredient.id } });
    await prisma.ingredientDietCompatibility.createMany({
      data: [
        { ingredientId: ingredient.id, dietPattern: DietPattern.VEGAN, compatible: def.vegan },
        {
          ingredientId: ingredient.id,
          dietPattern: DietPattern.LACTO_OVO,
          compatible: def.lactoOvo,
        },
      ],
    });

    // Tradition warnings
    await prisma.ingredientTraditionWarning.deleteMany({ where: { ingredientId: ingredient.id } });
    if (def.buddhistWarning) {
      await prisma.ingredientTraditionWarning.create({
        data: {
          ingredientId: ingredient.id,
          tradition: Tradition.BUDDHIST,
          warningCode: def.buddhistWarning[0],
          label: def.buddhistWarning[1],
        },
      });
    }

    // No public-domain record: leave the ingredient without a nutrient profile.
    const nutrientSource = def.nutrientSource;
    if (!nutrientSource) continue;

    const quality =
      nutrientSource.match === 'EXACT' ? FoodDataQuality.REVIEWED : FoodDataQuality.ESTIMATED;
    const sourceRecordId =
      nutrientSource.match === 'EXACT'
        ? String(nutrientSource.fdcId)
        : `${nutrientSource.fdcId}:proxy:${def.normalizedName.replaceAll(' ', '-')}`;
    const profileData = {
      ingredientId: ingredient.id,
      importBatchId: importBatch.id,
      sourceDate: new Date(USDA_SR_LEGACY_SOURCE.sourceDate),
      preparation: 'raw',
      locale: 'en-US',
      servingGrams: 100,
      ediblePortionPercent: 100,
      quality,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveTo: null,
    };
    const profile = await prisma.ingredientFoodProfile.upsert({
      where: {
        sourceId_sourceRecordId_sourceVersion: {
          sourceId: usdaSource.id,
          sourceRecordId,
          sourceVersion: USDA_SR_LEGACY_SOURCE.sourceVersion,
        },
      },
      update: profileData,
      create: {
        ...profileData,
        sourceId: usdaSource.id,
        sourceRecordId,
        sourceVersion: USDA_SR_LEGACY_SOURCE.sourceVersion,
        effectiveFrom: seedDataEffectiveFrom,
      },
    });

    // Household conversions
    for (const conv of def.conversions) {
      const conversionQuality =
        conv.basis === 'USDA_PORTION' ? FoodDataQuality.REVIEWED : FoodDataQuality.ESTIMATED;
      await prisma.householdConversion.upsert({
        where: {
          profileId_unitName_quantity: {
            profileId: profile.id,
            unitName: conv.unitName,
            quantity: conv.quantity,
          },
        },
        update: {
          grams: conv.grams,
          unitDimension: conv.unitDimension,
          quality: conversionQuality,
          reviewStatus: FoodDataReviewStatus.APPROVED,
        },
        create: {
          profileId: profile.id,
          unitName: conv.unitName,
          quantity: conv.quantity,
          unitDimension: conv.unitDimension,
          grams: conv.grams,
          quality: conversionQuality,
          reviewStatus: FoodDataReviewStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    }

    // Nutrient values per 100 g edible portion
    for (const nutrientDefinition of nutrientDefinitions) {
      const value = def.nutrients[nutrientDefinition.code];
      if (value === undefined) continue;
      const nutrient = nutrientMap.get(nutrientDefinition.code);
      if (!nutrient) continue;
      await prisma.ingredientNutrientValue.upsert({
        where: {
          profileId_nutrientId_effectiveFrom: {
            profileId: profile.id,
            nutrientId: nutrient.id,
            effectiveFrom: seedDataEffectiveFrom,
          },
        },
        update: {
          valuePer100g: value,
          unit: nutrient.defaultUnit,
          quality,
          reviewStatus: FoodDataReviewStatus.APPROVED,
        },
        create: {
          profileId: profile.id,
          nutrientId: nutrient.id,
          valuePer100g: value,
          unit: nutrient.defaultUnit,
          quality,
          reviewStatus: FoodDataReviewStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
          effectiveFrom: seedDataEffectiveFrom,
        },
      });
    }
  }

  // Interaction rules (advisory pairing notes with published references)
  for (const ir of interactionRuleDefinitions) {
    const ingA = ingredientMap.get(ir.ingredientANormalized);
    const ingB = ingredientMap.get(ir.ingredientBNormalized);
    if (!ingA || !ingB) continue;
    const [firstIng, secondIng] = ingA.id < ingB.id ? [ingA, ingB] : [ingB, ingA];
    const ruleRecordId = `rule-${firstIng.normalizedName}-${secondIng.normalizedName}-${ir.scope.toLowerCase()}`;
    const data = {
      direction: ir.direction,
      severity: ir.severity,
      evidenceGrade: ir.evidenceGrade,
      explanation: ir.explanation,
      suggestedAction: ir.suggestedAction,
      hardRule: ir.hardRule,
      applicability: { population: 'ADULT_GENERAL', references: ir.references },
      locale: 'vi-VN',
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
    };
    await prisma.ingredientInteractionRule.upsert({
      where: {
        sourceId_sourceRecordId_effectiveFrom: {
          sourceId: projectSource.id,
          sourceRecordId: ruleRecordId,
          effectiveFrom: seedDataEffectiveFrom,
        },
      },
      update: data,
      create: {
        ...data,
        ingredientAId: firstIng.id,
        ingredientBId: secondIng.id,
        sourceId: projectSource.id,
        sourceRecordId: ruleRecordId,
        sourceVersion: '2.0',
        scope: ir.scope,
        effectiveFrom: seedDataEffectiveFrom,
      },
    });
  }

  // ==========================================
  // 5. USERS & PROFILES
  // ==========================================
  const userMap = new Map<string, { id: string }>();
  for (const uDef of userDefinitions) {
    const user = await prisma.user.upsert({
      where: { email: uDef.email.toLowerCase() },
      update: {
        displayName: uDef.displayName,
        role: uDef.role,
        status: uDef.status,
        avatarUrl: uDef.avatarUrl ?? null,
      },
      create: {
        email: uDef.email.toLowerCase(),
        passwordHash: defaultPasswordHash,
        displayName: uDef.displayName,
        role: uDef.role,
        status: uDef.status,
        avatarUrl: uDef.avatarUrl ?? null,
      },
    });
    userMap.set(uDef.email.toLowerCase(), user);

    // Health profile
    if (uDef.healthProfile) {
      await prisma.healthProfile.upsert({
        where: { userId: user.id },
        update: {
          heightCm: uDef.healthProfile.heightCm,
          weightKg: uDef.healthProfile.weightKg,
          age: uDef.healthProfile.age,
          sex: uDef.healthProfile.sex,
          activityLevel: uDef.healthProfile.activityLevel,
          bmi: uDef.healthProfile.bmi,
          bmr: uDef.healthProfile.bmr,
          tdee: uDef.healthProfile.tdee,
          dataSource: uDef.healthProfile.dataSource ?? 'MANUAL',
        },
        create: {
          userId: user.id,
          heightCm: uDef.healthProfile.heightCm,
          weightKg: uDef.healthProfile.weightKg,
          age: uDef.healthProfile.age,
          sex: uDef.healthProfile.sex,
          activityLevel: uDef.healthProfile.activityLevel,
          bmi: uDef.healthProfile.bmi,
          bmr: uDef.healthProfile.bmr,
          tdee: uDef.healthProfile.tdee,
          dataSource: uDef.healthProfile.dataSource ?? 'MANUAL',
        },
      });
    }

    // Diet preference
    if (uDef.dietPreference) {
      await prisma.dietPreference.upsert({
        where: { userId: user.id },
        update: {
          dietPattern: uDef.dietPreference.dietPattern,
          practiceSchedule: uDef.dietPreference.practiceSchedule,
          tradition: uDef.dietPreference.tradition,
          ruleSetVersion: 1,
          confirmedAt: new Date(),
        },
        create: {
          userId: user.id,
          dietPattern: uDef.dietPreference.dietPattern,
          practiceSchedule: uDef.dietPreference.practiceSchedule,
          tradition: uDef.dietPreference.tradition,
          ruleSetVersion: 1,
          confirmedAt: new Date(),
        },
      });
    }

    // Allergies
    if (uDef.allergies) {
      await prisma.userAllergy.deleteMany({ where: { userId: user.id } });
      for (const al of uDef.allergies) {
        await prisma.userAllergy.create({
          data: {
            userId: user.id,
            allergenCode: al.allergenCode,
            label: al.label,
            severity: al.severity,
            active: true,
          },
        });
      }
    }

    if (uDef.ingredientAllergies) {
      for (const entry of uDef.ingredientAllergies) {
        const ingredient = ingredientMap.get(entry.ingredientNormalizedName);
        if (!ingredient)
          throw new Error(
            `Missing canonical allergy ingredient: ${entry.ingredientNormalizedName}`,
          );
        await prisma.userIngredientAllergy.upsert({
          where: { userId_ingredientId: { userId: user.id, ingredientId: ingredient.id } },
          update: { severity: entry.severity, active: true },
          create: { userId: user.id, ingredientId: ingredient.id, severity: entry.severity },
        });
      }
    }
    // Exclusions
    if (uDef.exclusions) {
      await prisma.userIngredientExclusion.deleteMany({ where: { userId: user.id } });
      for (const ex of uDef.exclusions) {
        const matchedIng = ingredientMap.get(ex.ingredientNormalizedName);
        await prisma.userIngredientExclusion.create({
          data: {
            userId: user.id,
            ingredientId: matchedIng?.id ?? null,
            ingredientName: ex.ingredientName,
            normalizedName: normalizeVietnameseText(ex.ingredientName),
            reason: ex.reason,
            active: true,
          },
        });
      }
    }

    // Contributor profile & decision
    if (uDef.contributorProfile) {
      const c = uDef.contributorProfile;
      const approvalEvidence: Prisma.InputJsonValue =
        c.source === ContributorApplicationSource.ADMIN_INVITATION
          ? {
              ...(c.approvalEvidence as Prisma.InputJsonObject),
              inviter: {
                id: adminId,
                displayName: (await prisma.user.findUniqueOrThrow({ where: { id: adminId } }))
                  .displayName,
              },
              verificationStatus: 'ADMIN_INVITATION_RECORDED',
            }
          : c.approvalEvidence;
      const app = await prisma.contributorApplication.upsert({
        where: { id: c.applicationId },
        update: {
          userId: user.id,
          claimedApprovalBasis: c.claimedApprovalBasis,
          approvalBasis: c.approvalBasis,
          source: c.source,
          invitedById: c.source === ContributorApplicationSource.ADMIN_INVITATION ? adminId : null,
          organizationClaim: c.organizationClaim ?? null,
          referenceLinks: c.referenceLinks,
          experience: c.experience,
          invitationReason: c.invitationReason ?? null,
          status: ContributorApplicationStatus.APPROVED,
          reviewEvidence: approvalEvidence,
          reviewNote:
            'Hồ sơ đạt tiêu chuẩn đóng góp nội dung chất lượng cao theo quy chế VeggieConnect.',
          reviewedById: adminId,
          reviewedAt: new Date('2026-09-15T00:00:00.000Z'),
        },
        create: {
          id: c.applicationId,
          userId: user.id,
          claimedApprovalBasis: c.claimedApprovalBasis,
          approvalBasis: c.approvalBasis,
          source: c.source,
          invitedById: c.source === ContributorApplicationSource.ADMIN_INVITATION ? adminId : null,
          organizationClaim: c.organizationClaim ?? null,
          referenceLinks: c.referenceLinks,
          experience: c.experience,
          invitationReason: c.invitationReason ?? null,
          status: ContributorApplicationStatus.APPROVED,
          reviewEvidence: approvalEvidence,
          reviewNote:
            'Hồ sơ đạt tiêu chuẩn đóng góp nội dung chất lượng cao theo quy chế VeggieConnect.',
          reviewedById: adminId,
          reviewedAt: new Date('2026-09-15T00:00:00.000Z'),
        },
      });

      await prisma.contributorProfile.upsert({
        where: { userId: user.id },
        update: {
          approvalBasis: c.approvalBasis,
          approvalEvidence,
          approvedById: adminId,
          approvedAt: new Date('2026-09-15T00:00:00.000Z'),
          sourceApplicationId: app.id,
        },
        create: {
          userId: user.id,
          approvalBasis: c.approvalBasis,
          approvalEvidence,
          approvedById: adminId,
          approvedAt: new Date('2026-09-15T00:00:00.000Z'),
          sourceApplicationId: app.id,
        },
      });

      await upsertSeedContributorDecision(prisma, {
        userId: user.id,
        applicationId: app.id,
        actorId: adminId,
        decision: ContributorDecisionType.APPROVED,
        approvalBasis: c.approvalBasis,
        evidence: approvalEvidence,
        reason: 'Approved profile for VeggieConnect plant-based community.',
        createdAt: new Date('2026-09-15T00:00:00.000Z'),
      });
    }
  }

  // ==========================================
  // 6. RECIPES
  // ==========================================
  // Nutrition, allergen codes, tradition warnings and diet compatibility are derived from the
  // canonical ingredient catalogue so they always match the ingredient list.
  const ingredientDefinitionMap = new Map(
    ingredientDefinitions.map((definition) => [definition.normalizedName, definition]),
  );
  const postMap = new Map<string, { id: string }>();
  const recipeFactsMap = new Map<string, RecipeFacts>();
  for (const rDef of recipeDefinitions) {
    const facts = deriveRecipeFacts(rDef, ingredientDefinitionMap);
    recipeFactsMap.set(rDef.slug, facts);
    const author = userMap.get(rDef.authorEmail.toLowerCase()) ?? { id: adminId };
    const catId =
      categoryIdMap.get(`${CategoryType.FOOD_TYPE}:${rDef.categorySlug}`) ??
      categoryIdMap.get(`${CategoryType.RECIPE_GROUP}:${rDef.categorySlug}`);
    const ingredientRows = rDef.ingredients.map((ing, idx) => {
      const canonical = ingredientMap.get(ing.ingredientNormalizedName);
      if (!canonical)
        throw new Error(
          `Recipe ${rDef.slug} references unknown ingredient ${ing.ingredientNormalizedName}`,
        );
      return {
        position: idx,
        ingredientId: canonical.id,
        displayName: ing.displayName,
        normalizedName: normalizeVietnameseText(ing.displayName),
        amount: ing.amount,
        unit: ing.unit,
        resolutionStatus: IngredientResolutionStatus.EXACT,
      };
    });
    const stepRows = rDef.steps.map((st) => ({
      position: st.position,
      instruction: st.instruction,
      durationMinutes: st.durationMinutes,
      cookingMethodId: st.cookingMethodCode
        ? (cookingMethodMap.get(st.cookingMethodCode)?.id ?? null)
        : null,
      affectedIngredientPositions: st.affectedIngredientPositions,
    }));
    const detailData = {
      servings: rDef.servings,
      prepTimeMinutes: rDef.prepTimeMinutes,
      cookTimeMinutes: rDef.cookTimeMinutes,
      difficulty: rDef.difficulty,
      calories: Math.round(facts.perServing.ENERGY_KCAL ?? 0),
      proteinGrams: round1(facts.perServing.PROTEIN ?? 0),
      carbsGrams: round1(facts.perServing.CARBS ?? 0),
      fatGrams: round1(facts.perServing.FAT ?? 0),
      fiberGrams: round1(facts.perServing.FIBER ?? 0),
      vitaminB12Mcg: facts.uncovered.length
        ? null
        : Math.round((facts.perServing.VITAMIN_B12 ?? 0) * 100) / 100,
      mealPlannerEligible: rDef.mealPlannerEligible,
      allergenCodes: facts.allergenCodes,
      traditionWarnings: facts.traditionWarnings,
    };
    const fixtureSnapshot = JSON.stringify({
      title: rDef.title,
      excerpt: rDef.excerpt,
      body: rDef.body,
      categoryIds: catId ? [catId] : [],
      tags: [...rDef.tags].map(normalizeVietnameseText).sort(),
      ingredients: ingredientRows.map(({ ingredientId, displayName, amount, unit }) => ({
        ingredientId,
        displayName,
        amount,
        unit,
      })),
      steps: stepRows,
    });

    let post = await prisma.post.findUnique({ where: { slug: rDef.slug } });
    if (!post) {
      post = await prisma.post.create({
        data: {
          authorId: author.id,
          type: PostType.RECIPE,
          slug: rDef.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date('2026-09-20T00:00:00.000Z'),
        },
      });
    }
    postMap.set(rDef.slug, post);

    const current = post.publishedRevisionId
      ? await prisma.postRevision.findUnique({
          where: { id: post.publishedRevisionId },
          include: {
            ingredients: { orderBy: { position: 'asc' } },
            recipeSteps: { orderBy: { position: 'asc' } },
            tags: true,
            categories: true,
          },
        })
      : null;
    const currentSnapshot = current
      ? JSON.stringify({
          title: current.title,
          excerpt: current.excerpt,
          body: current.body,
          categoryIds: current.categories.map((category) => category.categoryId).sort(),
          tags: current.tags.map((tag) => tag.normalizedTag).sort(),
          ingredients: current.ingredients.map(({ ingredientId, displayName, amount, unit }) => ({
            ingredientId,
            displayName,
            amount,
            unit,
          })),
          steps: current.recipeSteps.map((step) => ({
            position: step.position,
            instruction: step.instruction,
            durationMinutes: step.durationMinutes,
            cookingMethodId: step.cookingMethodId,
            affectedIngredientPositions: step.affectedIngredientPositions,
          })),
        })
      : null;

    let revisionId = current?.id ?? null;
    if (currentSnapshot !== fixtureSnapshot) {
      // Publish curated content as a new revision so earlier versions (and anything that
      // references them, such as meal plans) stay intact.
      const latest = await prisma.postRevision.findFirst({
        where: { postId: post.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = latest ? Math.max(post.version, latest.version) + 1 : 1;
      const revision = await prisma.postRevision.create({
        data: {
          postId: post.id,
          createdById: author.id,
          version,
          status: PostRevisionStatus.PUBLISHED,
          title: rDef.title,
          normalizedTitle: normalizeVietnameseText(rDef.title),
          excerpt: rDef.excerpt,
          normalizedExcerpt: normalizeVietnameseText(rDef.excerpt),
          body: rDef.body,
          normalizedBody: normalizeVietnameseText(rDef.body),
          ...(catId ? { categories: { create: [{ categoryId: catId }] } } : {}),
          tags: { create: postTagRows(rDef.tags) },
          recipeDetail: { create: detailData },
          ingredients: { create: ingredientRows },
          recipeSteps: { create: stepRows },
          dietCompatibility: {
            create: [
              {
                dietPattern: DietPattern.VEGAN,
                compatible: facts.vegan,
                reasonCodes: facts.vegan ? [] : ['NON_VEGAN_INGREDIENT'],
              },
              {
                dietPattern: DietPattern.LACTO_OVO,
                compatible: facts.lactoOvo,
                reasonCodes: facts.lactoOvo ? [] : ['NON_LACTO_OVO_INGREDIENT'],
              },
            ],
          },
        },
      });
      post = await prisma.post.update({
        where: { id: post.id },
        data: {
          version,
          status: PostStatus.PUBLISHED,
          publishedRevisionId: revision.id,
        },
      });
      postMap.set(rDef.slug, post);
      revisionId = revision.id;
    }
    if (!revisionId) continue;

    await prisma.recipeDetail.upsert({
      where: { revisionId },
      update: detailData,
      create: { revisionId, ...detailData },
    });

    if (rDef.coverMedia) {
      const cover = {
        provider: MediaProvider.CLOUDINARY,
        secureUrl: rDef.coverMedia.secureUrl,
        publicId: rDef.coverMedia.publicId,
        width: rDef.coverMedia.width,
        height: rDef.coverMedia.height,
        bytes: rDef.coverMedia.bytes,
      };
      await prisma.postMedia.upsert({
        where: { revisionId_kind: { revisionId, kind: MediaKind.COVER_IMAGE } },
        update: { ...cover, assetId: null },
        create: { revisionId, kind: MediaKind.COVER_IMAGE, position: 0, ...cover },
      });
    } else {
      await prisma.postMedia.deleteMany({
        where: { revisionId, kind: MediaKind.COVER_IMAGE },
      });
    }
  }

  // RecipeDetail keeps the compact macro fields used by meal planning, while the detail page
  // reads the versioned nutrition estimate. Persist the catalogue-derived values into that
  // contract with their USDA provenance, assumptions and uncovered ingredients.
  const nutrientNames = new Map(
    nutrientDefinitions.map((definition) => [definition.code, definition]),
  );
  for (const rDef of recipeDefinitions) {
    const recipe = postMap.get(rDef.slug);
    const facts = recipeFactsMap.get(rDef.slug);
    if (!recipe || !facts) continue;
    const post = await prisma.post.findUniqueOrThrow({ where: { id: recipe.id } });
    if (!post.publishedRevisionId) continue;

    const revision = await prisma.postRevision.findUniqueOrThrow({
      where: { id: post.publishedRevisionId },
      include: {
        ingredients: { orderBy: { position: 'asc' } },
        recipeSteps: { orderBy: { position: 'asc' } },
      },
    });
    const recipeFingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          calculationVersion: 'recipe-nutrition-v1',
          revisionId: revision.id,
          postVersion: post.version,
          servings: rDef.servings,
          ingredients: revision.ingredients.map((ingredient) => ({
            id: ingredient.id,
            ingredientId: ingredient.ingredientId,
            amount: ingredient.amount.toString(),
            unit: ingredient.unit,
            position: ingredient.position,
          })),
          steps: revision.recipeSteps.map((step) => ({
            cookingMethodId: step.cookingMethodId,
            durationMinutes: step.durationMinutes,
            temperatureCelsius: step.temperatureCelsius?.toString() ?? null,
            affectedIngredientPositions: step.affectedIngredientPositions,
            position: step.position,
          })),
          seedDataset: USDA_SR_LEGACY_SOURCE.sourceVersion,
        }),
      )
      .digest('hex');

    const currentEstimate = await prisma.recipeNutritionEstimate.findFirst({
      where: { revisionId: revision.id, status: RecipeNutritionEstimateStatus.CURRENT },
      orderBy: { version: 'desc' },
    });
    if (currentEstimate?.recipeFingerprint === recipeFingerprint) continue;

    const confidence = facts.uncovered.length ? 0.7 : facts.proxyCount ? 0.8 : 0.85;
    const toAmounts = (values: Partial<Record<NutrientCode, number>>, multiplier: number) =>
      nutrientDefinitions
        .filter((definition) => values[definition.code] !== undefined)
        .map((definition) => {
          const amount = round2((values[definition.code] ?? 0) * multiplier);
          return {
            nutrientCode: definition.code,
            nutrientName: nutrientNames.get(definition.code)?.name ?? definition.code,
            unit: definition.defaultUnit,
            amount,
            origin: NutritionValueOrigin.CANONICAL_CALCULATED,
            confidence,
            min: round2(amount * 0.85),
            max: round2(amount * 1.15),
          };
        });
    const perServingNutrients = toAmounts(facts.perServing, 1);
    const totalNutrients = toAmounts(facts.perServing, rDef.servings);
    const sourceVersions = facts.sources.map((sourceRecordId) => ({
      sourceCode: USDA_SR_LEGACY_SOURCE.code,
      sourceVersion: USDA_SR_LEGACY_SOURCE.sourceVersion,
      sourceRecordId,
    }));
    const assumptions = [
      {
        code: 'RAW_INGREDIENT_BASIS',
        message:
          'Tổng dinh dưỡng được cộng từ khối lượng nguyên liệu sống theo giá trị USDA SR Legacy; chưa áp dụng hệ số hao hụt khi nấu.',
        origin: NutritionValueOrigin.CANONICAL_CALCULATED,
      },
      ...(facts.proxyCount
        ? [
            {
              code: 'PROXY_FOOD_RECORDS',
              message: `${facts.proxyCount} nguyên liệu dùng bản ghi USDA gần nhất (ước tính), xem ghi chú nguồn của từng nguyên liệu.`,
              origin: NutritionValueOrigin.CANONICAL_CALCULATED,
            },
          ]
        : []),
    ];
    const uncoveredIngredients = facts.uncovered.map((item) => ({
      recipeIngredientId: revision.ingredients[item.position]?.id ?? null,
      position: item.position,
      displayName: item.displayName,
      reason: item.reason,
    }));

    await prisma.$transaction(async (transaction) => {
      await transaction.recipeNutritionEstimate.updateMany({
        where: { revisionId: revision.id, status: RecipeNutritionEstimateStatus.CURRENT },
        data: { status: RecipeNutritionEstimateStatus.HISTORICAL },
      });
      const latest = await transaction.recipeNutritionEstimate.findFirst({
        where: { revisionId: revision.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      await transaction.recipeNutritionEstimate.create({
        data: {
          revisionId: revision.id,
          version: (latest?.version ?? 0) + 1,
          status: RecipeNutritionEstimateStatus.CURRENT,
          calculationVersion: 'recipe-nutrition-v1',
          recipeFingerprint,
          servings: rDef.servings,
          totalRawGrams: round2(facts.totalRawGrams),
          totalCookedGrams: 0,
          totalNutrients,
          perServingNutrients,
          sourceVersions,
          assumptions,
          uncoveredIngredients,
          confidence,
          uncertainty: {
            method: 'RAW_INGREDIENT_SUM',
            relativeRangePercent: 15,
            uncoveredIngredientCount: facts.uncovered.length,
          },
          aiUsed: false,
          providerDown: false,
          disclaimer:
            'Số liệu dinh dưỡng được tính từ dữ liệu USDA FoodData Central cho nguyên liệu sống, chỉ mang tính tham khảo và có thể khác khi nấu.',
        },
      });
    });
  }

  // ==========================================
  // 7. HANDBOOKS & ARTICLES
  // ==========================================
  for (const hDef of handbookDefinitions) {
    const author = userMap.get(hDef.authorEmail.toLowerCase()) ?? { id: adminId };
    const catId = categoryIdMap.get(`${CategoryType.CONTENT_TOPIC}:${hDef.categorySlug}`);
    const { post } = await syncSeedContentPost(prisma, {
      type: PostType.BLOG,
      slug: hDef.slug,
      authorId: author.id,
      publishedAt: new Date('2026-09-21T00:00:00.000Z'),
      categoryIds: catId ? [catId] : [],
      title: hDef.title,
      excerpt: hDef.excerpt,
      body: hDef.body,
      tags: hDef.tags,
      media: hDef.coverMedia
        ? [
            {
              kind: MediaKind.COVER_IMAGE,
              provider: MediaProvider.CLOUDINARY,
              secureUrl: hDef.coverMedia.secureUrl,
              publicId: hDef.coverMedia.publicId,
              width: hDef.coverMedia.width,
              height: hDef.coverMedia.height,
              bytes: hDef.coverMedia.bytes,
              durationSeconds: null,
              position: 0,
            },
          ]
        : [],
    });
    postMap.set(hDef.slug, post);
  }

  // ==========================================
  // 8. VIDEOS (public YouTube videos)
  // ==========================================
  for (const vDef of videoDefinitions) {
    const author = userMap.get(vDef.authorEmail.toLowerCase()) ?? { id: adminId };
    const catId =
      categoryIdMap.get(`${CategoryType.RECIPE_GROUP}:${vDef.categorySlug}`) ??
      categoryIdMap.get(`${CategoryType.FOOD_TYPE}:${vDef.categorySlug}`) ??
      categoryIdMap.get(`${CategoryType.CONTENT_TOPIC}:${vDef.categorySlug}`);
    const thumbnail = youtubeThumbnail(vDef.youtubeId);
    const { post } = await syncSeedContentPost(prisma, {
      type: PostType.VIDEO,
      slug: vDef.slug,
      authorId: author.id,
      publishedAt: new Date('2026-09-22T00:00:00.000Z'),
      categoryIds: catId ? [catId] : [],
      title: vDef.title,
      excerpt: vDef.excerpt,
      body: vDef.body,
      tags: vDef.tags,
      media: [
        {
          kind: MediaKind.COVER_IMAGE,
          provider: MediaProvider.YOUTUBE,
          ...thumbnail,
          bytes: null,
          durationSeconds: null,
          position: 0,
        },
        {
          kind: MediaKind.VIDEO,
          provider: MediaProvider.YOUTUBE,
          secureUrl: `https://www.youtube.com/watch?v=${vDef.youtubeId}`,
          publicId: `youtube/${vDef.youtubeId}`,
          width: 1280,
          height: 720,
          bytes: null,
          durationSeconds: vDef.durationSeconds,
          position: 1,
        },
      ],
    });
    postMap.set(vDef.slug, post);
  }

  // ==========================================
  // 9. COMMUNITY (Ratings, Comments, Bookmarks, Votes)
  // ==========================================
  for (const r of ratingDefinitions) {
    const post = postMap.get(r.postSlug);
    const user = userMap.get(r.userEmail.toLowerCase());
    if (!post || !user) continue;
    await prisma.postRating.upsert({
      where: { userId_postId: { userId: user.id, postId: post.id } },
      update: { taste: r.taste, difficulty: r.difficulty, active: true },
      create: {
        userId: user.id,
        postId: post.id,
        taste: r.taste,
        difficulty: r.difficulty,
        active: true,
      },
    });
  }

  const commentMap = new Map<string, { id: string }>();
  for (const c of commentDefinitions) {
    const post = postMap.get(c.postSlug);
    const user = userMap.get(c.userEmail.toLowerCase());
    if (!post || !user) continue;

    const parent = c.replyToUserEmail
      ? commentMap.get(`${c.postSlug}:${c.replyToUserEmail}`)
      : undefined;
    let comment = await prisma.comment.findFirst({
      where: { postId: post.id, authorId: user.id, content: c.content },
    });
    if (!comment) {
      comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          parentId: parent?.id ?? null,
          content: c.content,
          status: CommentStatus.VISIBLE,
        },
      });
    }
    commentMap.set(`${c.postSlug}:${c.userEmail.toLowerCase()}`, comment);
  }

  for (const b of bookmarkDefinitions) {
    const post = postMap.get(b.postSlug);
    const user = userMap.get(b.userEmail.toLowerCase());
    if (!post || !user) continue;
    await prisma.postBookmark.upsert({
      where: { userId_postId: { userId: user.id, postId: post.id } },
      update: {},
      create: { userId: user.id, postId: post.id },
    });
  }

  for (const v of voteDefinitions) {
    const post = postMap.get(v.postSlug);
    const user = userMap.get(v.userEmail.toLowerCase());
    if (!post || !user) continue;
    await prisma.postVote.upsert({
      where: { userId_postId: { userId: user.id, postId: post.id } },
      update: {},
      create: { userId: user.id, postId: post.id },
    });
  }

  // ==========================================
  // 10. CUSTOM MEALS
  // ==========================================
  for (const cm of customMealDefinitions) {
    const owner = userMap.get(cm.userEmail.toLowerCase());
    if (!owner) continue;

    const customMeal = await prisma.customMeal.upsert({
      where: { id: cm.id },
      update: {
        name: cm.name,
        notes: cm.notes ?? null,
        servings: cm.servings,
        userCalories: cm.userCalories,
        userProteinGrams: cm.userProteinGrams,
        userCarbsGrams: cm.userCarbsGrams,
        userFatGrams: cm.userFatGrams,
        nutritionCoverage: cm.nutritionCoverage,
      },
      create: {
        id: cm.id,
        ownerId: owner.id,
        name: cm.name,
        notes: cm.notes ?? null,
        servings: cm.servings,
        userCalories: cm.userCalories,
        userProteinGrams: cm.userProteinGrams,
        userCarbsGrams: cm.userCarbsGrams,
        userFatGrams: cm.userFatGrams,
        nutritionCoverage: cm.nutritionCoverage,
      },
    });

    await prisma.customMealTag.deleteMany({ where: { customMealId: customMeal.id } });
    await prisma.customMealTag.createMany({
      data: cm.tags.map((tag) => ({
        customMealId: customMeal.id,
        tag,
        normalizedTag: normalizeVietnameseText(tag),
      })),
    });

    await prisma.customMealIngredient.deleteMany({ where: { customMealId: customMeal.id } });
    await prisma.customMealIngredient.createMany({
      data: cm.ingredients.map((ing, position) => {
        const canonical = ingredientMap.get(ing.ingredientNormalizedName);
        return {
          customMealId: customMeal.id,
          position,
          ingredientId: canonical?.id ?? null,
          displayName: ing.displayName,
          normalizedName: normalizeVietnameseText(ing.displayName),
          amount: ing.amount,
          unit: ing.unit,
          resolutionStatus: canonical
            ? IngredientResolutionStatus.EXACT
            : IngredientResolutionStatus.UNKNOWN,
        };
      }),
    });
  }

  // ==========================================
  // 11. PANTRY INVENTORY
  // ==========================================
  const pantryMember = userMap.get('member@example.com') ?? { id: adminId };
  for (const p of pantryDefinitions) {
    const ing = ingredientMap.get(p.ingredientNormalizedName);
    if (!ing) continue;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + p.expiresInDays);

    const pantryItem = await prisma.pantryItem.upsert({
      where: { id: p.id },
      update: {
        quantity: p.quantity,
        unit: p.unit,
        normalizedGrams: p.normalizedGrams,
        freshnessNote: p.freshnessNote,
        expiresAt,
      },
      create: {
        id: p.id,
        ownerId: pantryMember.id,
        ingredientId: ing.id,
        quantity: p.quantity,
        unit: p.unit,
        normalizedGrams: p.normalizedGrams,
        conversionStatus: p.conversionStatus,
        conversionSource: p.conversionSource,
        conversionVersion: p.conversionVersion,
        conversionConfidence: p.conversionConfidence,
        source: p.source,
        confidence: 1,
        confirmationStatus: p.confirmationStatus,
        freshnessNote: p.freshnessNote,
        expiresAt,
      },
    });

    await prisma.pantryAdjustment.upsert({
      where: {
        ownerId_idempotencyKey: {
          ownerId: pantryMember.id,
          idempotencyKey: p.idempotencyKey,
        },
      },
      update: {},
      create: {
        ownerId: pantryMember.id,
        pantryItemId: pantryItem.id,
        type: PantryAdjustmentType.CREATE,
        idempotencyKey: p.idempotencyKey,
        requestHash: '0'.repeat(64),
        inputQuantity: p.quantity,
        inputUnit: p.unit,
        appliedDeltaQuantity: p.quantity,
        normalizedDeltaGrams: p.normalizedGrams,
        beforeQuantity: 0,
        afterQuantity: p.quantity,
        beforeGrams: 0,
        afterGrams: p.normalizedGrams,
        versionBefore: 0,
        versionAfter: 1,
      },
    });
  }

  // ==========================================
  // 12. CHAT SESSION & MESSAGES
  // ==========================================
  await prisma.chatSession.deleteMany({
    where: { title: { in: chatSessionDefinitions.map((cs) => cs.title) } },
  });

  for (const cs of chatSessionDefinitions) {
    const user = userMap.get(cs.userEmail.toLowerCase());
    if (!user) continue;

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: cs.title,
      },
    });

    let lastUserMessageId: string | null = null;
    for (const [i, msg] of cs.messages.entries()) {
      if (msg.role === 'USER') {
        const payloadHash = createHash('sha256').update(msg.content).digest('hex');
        const userMsg = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'USER',
            status: 'COMPLETED',
            content: msg.content,
            idempotencyKey: `seed-chat-${session.id.slice(0, 8)}-${i}`,
            payloadHash,
            fallback: false,
            completedAt: new Date(),
          },
        });
        lastUserMessageId = userMsg.id;
      } else {
        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'ASSISTANT',
            status: 'COMPLETED',
            content: msg.content,
            requestMessageId: lastUserMessageId!,
            provider: 'GEMINI',
            modelId: 'gemini-1.5-flash',
            completedAt: new Date(),
          },
        });
      }
    }
  }

  // ==========================================
  // 13. MEDIA ASSETS & STORAGE ACCOUNTS
  // ==========================================
  const storagePolicy = await prisma.storagePolicy.upsert({
    where: { code: 'MVP_DEFAULT' },
    update: {},
    create: {
      id: '15000000-0000-4000-8000-000000000001',
      code: 'MVP_DEFAULT',
      name: 'MVP default storage',
      quotaBytes: 10737418240n,
      reservationTtlSeconds: 900,
      warningPercent: 80,
      active: true,
      isDefault: true,
    },
  });

  for (const user of userMap.values()) {
    await prisma.storageAccount.upsert({
      where: { userId: user.id },
      update: { policyId: storagePolicy.id },
      create: { userId: user.id, policyId: storagePolicy.id },
    });
  }

  for (const asset of mediaAssetDefinitions) {
    const owner = userMap.get(asset.ownerEmail.toLowerCase()) ?? { id: adminId };
    const dbAsset = await prisma.mediaAsset.upsert({
      where: { publicId: asset.publicId },
      update: {
        ownerId: owner.id,
        resourceType: asset.resourceType,
        kind: asset.kind,
        secureUrl: asset.secureUrl,
        mimeType: asset.mimeType,
        extension: asset.extension,
        bytes: asset.bytes,
        width: asset.width ?? null,
        height: asset.height ?? null,
        status: MediaAssetStatus.ACTIVE,
        backfilled: true,
      },
      create: {
        ...(asset.id ? { id: asset.id } : {}),
        ownerId: owner.id,
        resourceType: asset.resourceType,
        kind: asset.kind,
        publicId: asset.publicId,
        secureUrl: asset.secureUrl,
        mimeType: asset.mimeType,
        extension: asset.extension,
        bytes: asset.bytes,
        width: asset.width ?? null,
        height: asset.height ?? null,
        status: MediaAssetStatus.ACTIVE,
        backfilled: true,
      },
    });

    await prisma.postMedia.updateMany({
      where: { publicId: asset.publicId },
      data: { assetId: dbAsset.id },
    });
  }

  await normalizeAllergyCatalog(prisma, adminId);
  console.info(
    `Successfully seeded VeggieConnect sample dataset: ${ingredientDefinitions.length} ingredients (USDA FDC SR Legacy), ${recipeDefinitions.length} recipes, handbooks, videos, community, pantry, and media assets.`,
  );
}
