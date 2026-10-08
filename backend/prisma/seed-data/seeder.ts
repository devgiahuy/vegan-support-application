import {
  CatalogStatus,
  CategoryType,
  CommentStatus,
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorDecisionType,
  DietPattern,
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
  type PostRevision,
  type Prisma,
  RecipeNutritionEstimateStatus,
  type PrismaClient,
  Tradition,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { normalizeVietnameseText } from '../../src/modules/catalog/catalog.normalization.js';
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

function postTagRows(tags: readonly string[]) {
  return tags.map((tag) => ({ tag, normalizedTag: normalizeVietnameseText(tag) }));
}

function hasEncodingDamage(value: string | null): boolean {
  return value !== null && /\uFFFD|[ÃÄÆ]|[\p{L}]\?+[\p{L}]|â[\u0080-\u00bf]/u.test(value);
}

async function repairSeedRevisionText(
  prisma: PrismaClient,
  revision: PostRevision,
  fixture: Pick<PostRevision, 'title' | 'excerpt' | 'body'> & { tags: readonly string[] },
): Promise<PostRevision> {
  const data: Prisma.PostRevisionUpdateInput = {};
  if (hasEncodingDamage(revision.title) || hasEncodingDamage(revision.normalizedTitle)) {
    data.title = fixture.title;
    data.normalizedTitle = normalizeVietnameseText(fixture.title);
  }
  if (hasEncodingDamage(revision.excerpt) || hasEncodingDamage(revision.normalizedExcerpt)) {
    data.excerpt = fixture.excerpt;
    data.normalizedExcerpt = normalizeVietnameseText(fixture.excerpt ?? '');
  }
  if (hasEncodingDamage(revision.body) || hasEncodingDamage(revision.normalizedBody)) {
    data.body = fixture.body;
    data.normalizedBody = normalizeVietnameseText(fixture.body);
  }
  const tags = await prisma.postTag.findMany({ where: { revisionId: revision.id } });
  const damagedTagIds = tags.filter((tag) => hasEncodingDamage(tag.tag)).map((tag) => tag.id);
  if (damagedTagIds.length) {
    await prisma.$transaction(async (transaction) => {
      await transaction.postTag.deleteMany({ where: { id: { in: damagedTagIds } } });
      for (const tag of postTagRows(fixture.tags)) {
        await transaction.postTag.upsert({
          where: {
            revisionId_normalizedTag: { revisionId: revision.id, normalizedTag: tag.normalizedTag },
          },
          update: {},
          create: { revisionId: revision.id, ...tag },
        });
      }
    });
  }
  return Object.keys(data).length
    ? prisma.postRevision.update({ where: { id: revision.id }, data })
    : revision;
}

export async function seedComprehensiveData(
  prisma: PrismaClient,
  options: {
    adminId: string;
    defaultPasswordHash: string;
  },
): Promise<void> {
  const { adminId, defaultPasswordHash } = options;
  const effectiveFrom = new Date('2026-01-01');

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
  // 3. FOOD DATA SOURCE & NUTRIENTS
  // ==========================================
  const projectSource = await prisma.foodDataSource.upsert({
    where: { code: 'PROJECT_DEMO_V1' },
    update: {
      name: 'VeggieConnect Curated Plant Food Knowledge Base',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution:
        'VeggieConnect scientific plant nutrition dataset; evidence-graded educational references.',
      defaultLocale: 'vi-VN',
      active: true,
    },
    create: {
      code: 'PROJECT_DEMO_V1',
      name: 'VeggieConnect Curated Plant Food Knowledge Base',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution:
        'VeggieConnect scientific plant nutrition dataset; evidence-graded educational references.',
      defaultLocale: 'vi-VN',
      active: true,
    },
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

  // Reference intakes
  for (const ref of nutrientReferenceIntakes) {
    const nutrient = nutrientMap.get(ref.nutrientCode);
    if (!nutrient) continue;
    const sourceRecordId = `ref-${ref.nutrientCode.toLowerCase()}-${ref.populationCode.toLowerCase()}`;
    await prisma.nutrientReferenceIntake.upsert({
      where: {
        sourceId_sourceRecordId_effectiveFrom: {
          sourceId: projectSource.id,
          sourceRecordId,
          effectiveFrom,
        },
      },
      update: {
        nutrientId: nutrient.id,
        referenceType: ref.referenceType,
        populationCode: ref.populationCode,
        applicability: { minAge: 18 },
        value: ref.value,
        unit: ref.unit,
        warningEligible: 'warningEligible' in ref ? Boolean(ref.warningEligible) : false,
        sourceVersion: '1.0',
        locale: 'vi-VN',
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      create: {
        nutrientId: nutrient.id,
        sourceId: projectSource.id,
        referenceType: ref.referenceType,
        populationCode: ref.populationCode,
        applicability: { minAge: 18 },
        value: ref.value,
        unit: ref.unit,
        warningEligible: 'warningEligible' in ref ? Boolean(ref.warningEligible) : false,
        sourceRecordId,
        sourceVersion: '1.0',
        locale: 'vi-VN',
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
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
  // 4. CANONICAL INGREDIENTS (60+ items)
  // ==========================================
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

    // Food Profile & Conversions
    const sourceRecordId = `profile-${def.normalizedName}`;
    const profile = await prisma.ingredientFoodProfile.upsert({
      where: {
        sourceId_sourceRecordId_sourceVersion: {
          sourceId: projectSource.id,
          sourceRecordId,
          sourceVersion: '1.0',
        },
      },
      update: {
        ingredientId: ingredient.id,
        servingGrams: 100,
        ediblePortionPercent: 100,
        quality: FoodDataQuality.REVIEWED,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      create: {
        ingredientId: ingredient.id,
        sourceId: projectSource.id,
        sourceRecordId,
        sourceVersion: '1.0',
        servingGrams: 100,
        ediblePortionPercent: 100,
        quality: FoodDataQuality.REVIEWED,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
      },
    });

    // Household conversions
    for (const conv of def.conversions) {
      await prisma.householdConversion.upsert({
        where: {
          profileId_unitName_quantity: {
            profileId: profile.id,
            unitName: conv.unitName,
            quantity: conv.quantity,
          },
        },
        update: { grams: conv.grams, quality: FoodDataQuality.REVIEWED },
        create: {
          profileId: profile.id,
          unitName: conv.unitName,
          quantity: conv.quantity,
          unitDimension: conv.unitDimension,
          grams: conv.grams,
          quality: FoodDataQuality.REVIEWED,
          reviewStatus: FoodDataReviewStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    }

    // Nutrient values per 100g
    const nutrientFields: Array<[string, number | undefined]> = [
      ['ENERGY_KCAL', def.nutrients.energyKcal],
      ['PROTEIN', def.nutrients.protein],
      ['FAT', def.nutrients.fat],
      ['CARBS', def.nutrients.carbs],
      ['FIBER', def.nutrients.fiber],
      ['IRON', def.nutrients.iron],
      ['CALCIUM', def.nutrients.calcium],
      ['VITAMIN_C', def.nutrients.vitaminC],
      ['VITAMIN_B12', def.nutrients.vitaminB12],
    ];

    for (const [nCode, val] of nutrientFields) {
      if (val === undefined) continue;
      const n = nutrientMap.get(nCode);
      if (!n) continue;
      await prisma.ingredientNutrientValue.upsert({
        where: {
          profileId_nutrientId_effectiveFrom: {
            profileId: profile.id,
            nutrientId: n.id,
            effectiveFrom,
          },
        },
        update: { valuePer100g: val, unit: n.defaultUnit, quality: FoodDataQuality.REVIEWED },
        create: {
          profileId: profile.id,
          nutrientId: n.id,
          valuePer100g: val,
          unit: n.defaultUnit,
          quality: FoodDataQuality.REVIEWED,
          reviewStatus: FoodDataReviewStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: new Date(),
          effectiveFrom,
        },
      });
    }
  }

  // Interaction rules
  for (const ir of interactionRuleDefinitions) {
    const ingA = ingredientMap.get(ir.ingredientANormalized);
    const ingB = ingredientMap.get(ir.ingredientBNormalized);
    if (!ingA || !ingB) continue;
    const [firstIng, secondIng] = ingA.id < ingB.id ? [ingA, ingB] : [ingB, ingA];
    const ingredientAId = firstIng.id;
    const ingredientBId = secondIng.id;
    const ruleRecordId = `rule-${firstIng.normalizedName}-${secondIng.normalizedName}-${ir.scope.toLowerCase()}`;
    await prisma.ingredientInteractionRule.upsert({
      where: {
        ingredientAId_ingredientBId_scope_sourceId_sourceVersion_effectiveFrom: {
          ingredientAId,
          ingredientBId,
          scope: ir.scope,
          sourceId: projectSource.id,
          sourceVersion: '1.0',
          effectiveFrom,
        },
      },
      update: {
        direction: ir.direction,
        severity: ir.severity,
        evidenceGrade: ir.evidenceGrade,
        explanation: ir.explanation,
        suggestedAction: ir.suggestedAction,
        hardRule: ir.hardRule,
        applicability: { note: 'Scientific evidence baseline' },
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      create: {
        ingredientAId,
        ingredientBId,
        sourceId: projectSource.id,
        sourceRecordId: ruleRecordId,
        sourceVersion: '1.0',
        scope: ir.scope,
        direction: ir.direction,
        severity: ir.severity,
        evidenceGrade: ir.evidenceGrade,
        explanation: ir.explanation,
        suggestedAction: ir.suggestedAction,
        hardRule: ir.hardRule,
        applicability: { note: 'Scientific evidence baseline' },
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
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

      await prisma.contributorDecision.deleteMany({
        where: { applicationId: app.id, decision: ContributorDecisionType.APPROVED },
      });
      await prisma.contributorDecision.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          actorId: adminId,
          decision: ContributorDecisionType.APPROVED,
          approvalBasis: c.approvalBasis,
          evidence: approvalEvidence,
          reason: 'Approved profile for VeggieConnect plant-based community.',
          createdAt: new Date('2026-09-15T00:00:00.000Z'),
        },
      });
    }
  }

  // ==========================================
  // 6. RECIPES
  // ==========================================
  const postMap = new Map<string, { id: string }>();
  for (const rDef of recipeDefinitions) {
    const author = userMap.get(rDef.authorEmail.toLowerCase()) ?? { id: adminId };
    const catId =
      categoryIdMap.get(`${CategoryType.FOOD_TYPE}:${rDef.categorySlug}`) ??
      categoryIdMap.get(`${CategoryType.RECIPE_GROUP}:${rDef.categorySlug}`);

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

    let revision = await prisma.postRevision.findUnique({
      where: { postId_version: { postId: post.id, version: 1 } },
    });

    if (!revision) {
      revision = await prisma.postRevision.create({
        data: {
          postId: post.id,
          createdById: author.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: rDef.title,
          normalizedTitle: normalizeVietnameseText(rDef.title),
          excerpt: rDef.excerpt,
          normalizedExcerpt: normalizeVietnameseText(rDef.excerpt),
          body: rDef.body,
          normalizedBody: normalizeVietnameseText(rDef.body),
          ...(catId ? { categories: { create: [{ categoryId: catId }] } } : {}),
          tags: { create: postTagRows(rDef.tags) },
          media: {
            create: {
              kind: MediaKind.COVER_IMAGE,
              provider: MediaProvider.CLOUDINARY,
              secureUrl: rDef.coverMedia.secureUrl,
              publicId: rDef.coverMedia.publicId,
              width: rDef.coverMedia.width,
              height: rDef.coverMedia.height,
              position: 0,
            },
          },
          recipeDetail: {
            create: {
              servings: rDef.servings,
              prepTimeMinutes: rDef.prepTimeMinutes,
              cookTimeMinutes: rDef.cookTimeMinutes,
              difficulty: rDef.difficulty,
              calories: rDef.calories,
              proteinGrams: rDef.proteinGrams,
              carbsGrams: rDef.carbsGrams,
              fatGrams: rDef.fatGrams,
              fiberGrams: rDef.fiberGrams,
              vitaminB12Mcg: rDef.vitaminB12Mcg ?? null,
              mealPlannerEligible: rDef.mealPlannerEligible,
              allergenCodes: rDef.allergenCodes,
              traditionWarnings: rDef.traditionWarnings,
            },
          },
          ingredients: {
            create: rDef.ingredients.map((ing, idx) => {
              const canonical = ingredientMap.get(ing.ingredientNormalizedName);
              return {
                position: idx,
                ingredientId: canonical?.id,
                displayName: ing.displayName,
                normalizedName: normalizeVietnameseText(ing.displayName),
                amount: ing.amount,
                unit: ing.unit,
                resolutionStatus: canonical
                  ? IngredientResolutionStatus.EXACT
                  : IngredientResolutionStatus.UNKNOWN,
              };
            }),
          },
          recipeSteps: {
            create: rDef.steps.map((st) => {
              const method = st.cookingMethodCode
                ? cookingMethodMap.get(st.cookingMethodCode)
                : undefined;
              return {
                position: st.position,
                instruction: st.instruction,
                durationMinutes: st.durationMinutes,
                cookingMethodId: method?.id,
                affectedIngredientPositions: st.affectedIngredientPositions,
              };
            }),
          },
          dietCompatibility: {
            create: [
              { dietPattern: DietPattern.VEGAN, compatible: true, reasonCodes: [] },
              { dietPattern: DietPattern.LACTO_OVO, compatible: true, reasonCodes: [] },
            ],
          },
        },
      });
    }

    revision = await repairSeedRevisionText(prisma, revision, rDef);
    const storedIngredients = await prisma.recipeIngredient.findMany({
      where: { revisionId: revision.id },
    });
    for (const ingredient of storedIngredients) {
      const fixture = rDef.ingredients[ingredient.position];
      if (fixture && hasEncodingDamage(ingredient.displayName)) {
        await prisma.recipeIngredient.update({
          where: { id: ingredient.id },
          data: {
            displayName: fixture.displayName,
            normalizedName: normalizeVietnameseText(fixture.displayName),
          },
        });
      }
    }
    const storedSteps = await prisma.recipeStep.findMany({ where: { revisionId: revision.id } });
    for (const step of storedSteps) {
      const fixture = rDef.steps.find((candidate) => candidate.position === step.position);
      if (fixture && hasEncodingDamage(step.instruction)) {
        await prisma.recipeStep.update({
          where: { id: step.id },
          data: { instruction: fixture.instruction },
        });
      }
    }

    // Keep the compact recipe nutrition fields synchronized on repeat seeds;
    // previously these values were written only when the revision was new.
    await prisma.recipeDetail.upsert({
      where: { revisionId: revision.id },
      update: {
        servings: rDef.servings,
        prepTimeMinutes: rDef.prepTimeMinutes,
        cookTimeMinutes: rDef.cookTimeMinutes,
        difficulty: rDef.difficulty,
        calories: rDef.calories,
        proteinGrams: rDef.proteinGrams,
        carbsGrams: rDef.carbsGrams,
        fatGrams: rDef.fatGrams,
        fiberGrams: rDef.fiberGrams,
        vitaminB12Mcg: rDef.vitaminB12Mcg ?? null,
        mealPlannerEligible: rDef.mealPlannerEligible,
        allergenCodes: rDef.allergenCodes,
        traditionWarnings: rDef.traditionWarnings,
      },
      create: {
        revisionId: revision.id,
        servings: rDef.servings,
        prepTimeMinutes: rDef.prepTimeMinutes,
        cookTimeMinutes: rDef.cookTimeMinutes,
        difficulty: rDef.difficulty,
        calories: rDef.calories,
        proteinGrams: rDef.proteinGrams,
        carbsGrams: rDef.carbsGrams,
        fatGrams: rDef.fatGrams,
        fiberGrams: rDef.fiberGrams,
        vitaminB12Mcg: rDef.vitaminB12Mcg ?? null,
        mealPlannerEligible: rDef.mealPlannerEligible,
        allergenCodes: rDef.allergenCodes,
        traditionWarnings: rDef.traditionWarnings,
      },
    });

    if (post.status === PostStatus.PUBLISHED && post.publishedRevisionId !== revision.id) {
      await prisma.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
      post.publishedRevisionId = revision.id;
    }

    await prisma.postMedia.upsert({
      where: { revisionId_kind: { revisionId: revision.id, kind: MediaKind.COVER_IMAGE } },
      update: {
        secureUrl: rDef.coverMedia.secureUrl,
        publicId: rDef.coverMedia.publicId,
        width: rDef.coverMedia.width,
        height: rDef.coverMedia.height,
        bytes: rDef.coverMedia.bytes,
      },
      create: {
        revisionId: revision.id,
        kind: MediaKind.COVER_IMAGE,
        provider: MediaProvider.CLOUDINARY,
        secureUrl: rDef.coverMedia.secureUrl,
        publicId: rDef.coverMedia.publicId,
        width: rDef.coverMedia.width,
        height: rDef.coverMedia.height,
        bytes: rDef.coverMedia.bytes,
        position: 0,
      },
    });
  }

  // RecipeDetail keeps the compact macro fields used by meal planning, while
  // the detail page reads the versioned Phase 13 nutrition estimate. Persist
  // the recipe definition's curated per-serving values into that contract so
  // seeded dishes display the same calories/macros declared in recipes.data.
  for (const rDef of recipeDefinitions) {
    const recipe = postMap.get(rDef.slug);
    if (!recipe) continue;

    const revision = await prisma.postRevision.findFirstOrThrow({
      where: { postId: recipe.id, version: 1 },
      include: {
        post: true,
        ingredients: { orderBy: { position: 'asc' } },
        recipeSteps: { orderBy: { position: 'asc' } },
      },
    });
    const recipeFingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          calculationVersion: 'recipe-nutrition-v1',
          revisionId: revision.id,
          postVersion: revision.post.version,
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
        }),
      )
      .digest('hex');

    const currentEstimate = await prisma.recipeNutritionEstimate.findFirst({
      where: { revisionId: revision.id, status: RecipeNutritionEstimateStatus.CURRENT },
      orderBy: { version: 'desc' },
    });
    if (currentEstimate?.recipeFingerprint === recipeFingerprint) continue;

    const perServingNutrients = [
      {
        nutrientCode: 'ENERGY_KCAL',
        nutrientName: 'Năng lượng',
        unit: 'kcal',
        amount: rDef.calories,
      },
      { nutrientCode: 'PROTEIN', nutrientName: 'Protein', unit: 'g', amount: rDef.proteinGrams },
      { nutrientCode: 'CARBS', nutrientName: 'Carbohydrate', unit: 'g', amount: rDef.carbsGrams },
      { nutrientCode: 'FAT', nutrientName: 'Chất béo', unit: 'g', amount: rDef.fatGrams },
      { nutrientCode: 'FIBER', nutrientName: 'Chất xơ', unit: 'g', amount: rDef.fiberGrams },
      ...(rDef.vitaminB12Mcg === undefined
        ? []
        : [
            {
              nutrientCode: 'VITAMIN_B12',
              nutrientName: 'Vitamin B12',
              unit: 'mcg',
              amount: rDef.vitaminB12Mcg,
            },
          ]),
    ].map((nutrient) => ({
      ...nutrient,
      origin: NutritionValueOrigin.USER_PROVIDED,
      confidence: 0.8,
      min: Math.round(nutrient.amount * 0.9 * 100) / 100,
      max: Math.round(nutrient.amount * 1.1 * 100) / 100,
    }));
    const totalNutrients = perServingNutrients.map((nutrient) => ({
      ...nutrient,
      amount: nutrient.amount * rDef.servings,
      min: nutrient.min * rDef.servings,
      max: nutrient.max * rDef.servings,
    }));
    const sourceVersions = [
      {
        sourceCode: projectSource.code,
        sourceVersion: '1.0',
        sourceRecordId: `recipe-seed:${rDef.slug}`,
        kind: 'CURATED_RECIPE_NUTRITION',
      },
    ];
    const assumptions = [
      {
        code: 'CURATED_RECIPE_MACROS',
        message: 'Per-serving nutrition values are curated seed data declared with the recipe.',
        origin: NutritionValueOrigin.USER_PROVIDED,
      },
    ];

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
          totalRawGrams: 0,
          totalCookedGrams: 0,
          totalNutrients,
          perServingNutrients,
          sourceVersions,
          assumptions,
          uncoveredIngredients: [],
          confidence: 0.8,
          uncertainty: {
            method: 'CURATED_RECIPE_MACROS',
            relativeRangePercent: 10,
          },
          aiUsed: false,
          providerDown: false,
          disclaimer:
            'Số liệu dinh dưỡng theo khẩu phần là dữ liệu ước tính được biên soạn cho món mẫu và chỉ mang tính tham khảo.',
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

    let post = await prisma.post.findUnique({ where: { slug: hDef.slug } });
    if (!post) {
      post = await prisma.post.create({
        data: {
          authorId: author.id,
          type: PostType.BLOG,
          slug: hDef.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date('2026-09-21T00:00:00.000Z'),
        },
      });
    }

    // Repair damaged text only in version 1 of known seed definitions.
    postMap.set(hDef.slug, post);

    let revision = await prisma.postRevision.findUnique({
      where: { postId_version: { postId: post.id, version: 1 } },
    });

    if (!revision) {
      revision = await prisma.postRevision.create({
        data: {
          postId: post.id,
          createdById: author.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: hDef.title,
          normalizedTitle: normalizeVietnameseText(hDef.title),
          excerpt: hDef.excerpt,
          normalizedExcerpt: normalizeVietnameseText(hDef.excerpt),
          body: hDef.body,
          normalizedBody: normalizeVietnameseText(hDef.body),
          ...(catId ? { categories: { create: [{ categoryId: catId }] } } : {}),
          tags: { create: postTagRows(hDef.tags) },
          media: {
            create: {
              kind: MediaKind.COVER_IMAGE,
              provider: MediaProvider.CLOUDINARY,
              secureUrl: hDef.coverMedia.secureUrl,
              publicId: hDef.coverMedia.publicId,
              width: hDef.coverMedia.width,
              height: hDef.coverMedia.height,
              position: 0,
            },
          },
        },
      });
    }
    revision = await repairSeedRevisionText(prisma, revision, hDef);

    if (post.status === PostStatus.PUBLISHED && post.publishedRevisionId !== revision.id) {
      await prisma.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
      post.publishedRevisionId = revision.id;
    }

    await prisma.postMedia.upsert({
      where: { revisionId_kind: { revisionId: revision.id, kind: MediaKind.COVER_IMAGE } },
      update: {
        secureUrl: hDef.coverMedia.secureUrl,
        publicId: hDef.coverMedia.publicId,
        width: hDef.coverMedia.width,
        height: hDef.coverMedia.height,
        bytes: hDef.coverMedia.bytes,
      },
      create: {
        revisionId: revision.id,
        kind: MediaKind.COVER_IMAGE,
        provider: MediaProvider.CLOUDINARY,
        secureUrl: hDef.coverMedia.secureUrl,
        publicId: hDef.coverMedia.publicId,
        width: hDef.coverMedia.width,
        height: hDef.coverMedia.height,
        bytes: hDef.coverMedia.bytes,
        position: 0,
      },
    });
  }

  // ==========================================
  // 8. VIDEOS
  // ==========================================
  for (const vDef of videoDefinitions) {
    const author = userMap.get(vDef.authorEmail.toLowerCase()) ?? { id: adminId };
    const catId =
      categoryIdMap.get(`${CategoryType.RECIPE_GROUP}:${vDef.categorySlug}`) ??
      categoryIdMap.get(`${CategoryType.CONTENT_TOPIC}:${vDef.categorySlug}`);

    let post = await prisma.post.findUnique({ where: { slug: vDef.slug } });
    if (!post) {
      post = await prisma.post.create({
        data: {
          authorId: author.id,
          type: PostType.VIDEO,
          slug: vDef.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date('2026-09-22T00:00:00.000Z'),
        },
      });
    }
    postMap.set(vDef.slug, post);

    let revision = await prisma.postRevision.findUnique({
      where: { postId_version: { postId: post.id, version: 1 } },
    });

    if (!revision) {
      revision = await prisma.postRevision.create({
        data: {
          postId: post.id,
          createdById: author.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: vDef.title,
          normalizedTitle: normalizeVietnameseText(vDef.title),
          excerpt: vDef.excerpt,
          normalizedExcerpt: normalizeVietnameseText(vDef.excerpt),
          body: vDef.body,
          normalizedBody: normalizeVietnameseText(vDef.body),
          ...(catId ? { categories: { create: [{ categoryId: catId }] } } : {}),
          tags: { create: postTagRows(vDef.tags) },
          media: {
            create: {
              kind: MediaKind.VIDEO,
              provider: MediaProvider.YOUTUBE,
              secureUrl: `https://www.youtube.com/watch?v=${vDef.youtubeId}`,
              publicId: vDef.coverMedia.publicId,
              width: vDef.coverMedia.width,
              height: vDef.coverMedia.height,
              position: 0,
            },
          },
        },
      });
    }

    revision = await repairSeedRevisionText(prisma, revision, vDef);

    if (post.status === PostStatus.PUBLISHED && post.publishedRevisionId !== revision.id) {
      await prisma.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
      post.publishedRevisionId = revision.id;
    }

    await prisma.postMedia.upsert({
      where: { revisionId_kind: { revisionId: revision.id, kind: MediaKind.COVER_IMAGE } },
      update: {
        secureUrl: vDef.coverMedia.secureUrl,
        publicId: vDef.coverMedia.publicId,
        width: vDef.coverMedia.width,
        height: vDef.coverMedia.height,
        bytes: vDef.coverMedia.bytes,
      },
      create: {
        revisionId: revision.id,
        kind: MediaKind.COVER_IMAGE,
        provider: MediaProvider.CLOUDINARY,
        secureUrl: vDef.coverMedia.secureUrl,
        publicId: vDef.coverMedia.publicId,
        width: vDef.coverMedia.width,
        height: vDef.coverMedia.height,
        bytes: vDef.coverMedia.bytes,
        position: 0,
      },
    });

    await prisma.postMedia.upsert({
      where: { revisionId_kind: { revisionId: revision.id, kind: MediaKind.VIDEO } },
      update: {
        secureUrl: vDef.videoUrl ?? `https://www.youtube.com/watch?v=${vDef.youtubeId}`,
        publicId: vDef.slug,
        width: 1920,
        height: 1080,
        bytes: vDef.videoBytes ?? null,
        durationSeconds: vDef.durationSeconds,
      },
      create: {
        revisionId: revision.id,
        kind: MediaKind.VIDEO,
        provider: vDef.videoUrl ? MediaProvider.CLOUDINARY : MediaProvider.YOUTUBE,
        secureUrl: vDef.videoUrl ?? `https://www.youtube.com/watch?v=${vDef.youtubeId}`,
        publicId: vDef.slug,
        width: 1920,
        height: 1080,
        bytes: vDef.videoBytes ?? null,
        durationSeconds: vDef.durationSeconds,
        position: 1,
      },
    });
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

  console.info(
    'Successfully seeded comprehensive VeggieConnect sample dataset with 60+ ingredients, 25 recipes, 4 handbooks, 3 videos, community, pantry, and media assets.',
  );
}
