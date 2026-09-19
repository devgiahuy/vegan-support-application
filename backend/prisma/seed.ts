import 'dotenv/config';
import {
  ActivityLevel,
  AiFlagRiskLevel,
  AiFlagStatus,
  BehaviorEventType,
  CatalogStatus,
  CategoryType,
  CommentStatus,
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  ContributorDecisionType,
  DietPattern,
  DietRuleSource,
  FoodGroup,
  EvidenceGrade,
  FoodDataProvider,
  FoodDataQuality,
  FoodDataReviewStatus,
  FoodDataSuggestionType,
  FoodRuleSeverity,
  GuidelinePeriod,
  HealthDataSource,
  HealthSex,
  IngredientResolutionStatus,
  InteractionDirection,
  InteractionScope,
  MediaKind,
  MediaProvider,
  ModerationPriority,
  PostRevisionStatus,
  PostStatus,
  PostType,
  PracticeSchedule,
  PrismaClient,
  RecipeDifficulty,
  NutrientReferenceType,
  ReportStatus,
  ReportTargetType,
  Role,
  Tradition,
  UserStatus,
  UnitDimension,
} from '@prisma/client';
import { z } from 'zod';
import { PasswordService } from '../src/modules/auth/password.service.js';
import { normalizeVietnameseText } from '../src/modules/catalog/catalog.normalization.js';
import { seedScenarioData } from './seed-scenarios.js';

const prisma = new PrismaClient();
const passwordService = new PasswordService();
const dietRuleSetVersion = 1;

function postTagRows(tags: readonly string[]) {
  return tags.map((tag) => ({ tag, normalizedTag: normalizeVietnameseText(tag) }));
}

const allergenDefinitions = [
  { code: 'GLUTEN', label: 'Gluten' },
  { code: 'PEANUT', label: 'Đậu phộng' },
  { code: 'TREE_NUT', label: 'Hạt cây' },
  { code: 'SOY', label: 'Đậu nành' },
  { code: 'SESAME', label: 'Mè' },
  { code: 'MILK', label: 'Sữa' },
  { code: 'EGG', label: 'Trứng' },
] as const;

const categoryDefinitions = [
  { type: CategoryType.FOOD_TYPE, name: 'Món chính', slug: 'mon-chinh', sortOrder: 10 },
  { type: CategoryType.FOOD_TYPE, name: 'Món phụ', slug: 'mon-phu', sortOrder: 20 },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Cơm và ngũ cốc',
    slug: 'com-va-ngu-coc',
    parentSlug: 'mon-chinh',
    sortOrder: 10,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Canh và súp',
    slug: 'canh-va-sup',
    parentSlug: 'mon-chinh',
    sortOrder: 20,
  },
  { type: CategoryType.RECIPE_GROUP, name: 'Bữa sáng', slug: 'bua-sang', sortOrder: 10 },
  { type: CategoryType.RECIPE_GROUP, name: 'Bữa tối', slug: 'bua-toi', sortOrder: 20 },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Nhanh dưới 30 phút',
    slug: 'nhanh-duoi-30-phut',
    parentSlug: 'bua-toi',
    sortOrder: 10,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Dinh dưỡng',
    slug: 'dinh-duong',
    sortOrder: 10,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Lối sống xanh',
    slug: 'loi-song-xanh',
    sortOrder: 20,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Kiến thức protein',
    slug: 'kien-thuc-protein',
    parentSlug: 'dinh-duong',
    sortOrder: 10,
  },
] as const;

const ingredientDefinitions = [
  {
    canonicalName: 'Đậu hũ',
    normalizedName: 'dau hu',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['tofu', 'đậu phụ', 'đậu'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Đậu gà',
    normalizedName: 'dau ga',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['chickpea', 'garbanzo', 'đậu'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Đậu lăng',
    normalizedName: 'dau lang',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['lentil'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Gạo lứt',
    normalizedName: 'gao lut',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['brown rice'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Bông cải xanh',
    normalizedName: 'bong cai xanh',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['broccoli', 'súp lơ xanh'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Chuối',
    normalizedName: 'chuoi',
    foodGroup: FoodGroup.FRUITS,
    aliases: ['banana'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Đậu phộng',
    normalizedName: 'dau phong',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['peanut', 'lạc'],
    allergens: ['PEANUT'],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Nấm hương',
    normalizedName: 'nam huong',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['shiitake'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
  {
    canonicalName: 'Sữa bò',
    normalizedName: 'sua bo',
    foodGroup: FoodGroup.DAIRY_EGGS,
    aliases: ['cow milk'],
    allergens: ['MILK'],
    vegan: false,
    lactoOvo: true,
  },
  {
    canonicalName: 'Hành lá',
    normalizedName: 'hanh la',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['spring onion', 'scallion'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    buddhistWarning: ['FIVE_PUNGENT_ROOTS', 'Có thể thuộc nhóm ngũ vị tân theo lựa chọn cá nhân'],
  },
  {
    canonicalName: 'Men dinh dưỡng',
    normalizedName: 'men dinh duong',
    foodGroup: FoodGroup.OTHER,
    aliases: ['nutritional yeast'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
  },
] as const;

async function seedFoodData(adminId: string): Promise<void> {
  const effectiveFrom = new Date('2026-01-01');
  const projectSource = await prisma.foodDataSource.upsert({
    where: { code: 'PROJECT_DEMO_V1' },
    update: {
      name: 'Project-authored demo food data',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution: 'Vegan Support Application demo fixtures; illustrative, not clinical advice.',
      defaultLocale: 'vi-VN',
      active: true,
    },
    create: {
      code: 'PROJECT_DEMO_V1',
      name: 'Project-authored demo food data',
      provider: FoodDataProvider.MANUAL,
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution: 'Vegan Support Application demo fixtures; illustrative, not clinical advice.',
      defaultLocale: 'vi-VN',
    },
  });
  await prisma.foodDataSource.upsert({
    where: { code: 'USDA_FDC' },
    update: { active: true },
    create: {
      code: 'USDA_FDC',
      name: 'USDA FoodData Central',
      provider: FoodDataProvider.USDA_FDC,
      sourceUrl: 'https://fdc.nal.usda.gov/',
      licenseName: 'U.S. public domain / CC0',
      licenseUrl: 'https://www.usa.gov/government-copyright',
      attribution: 'U.S. Department of Agriculture, Agricultural Research Service.',
      defaultLocale: 'en-US',
    },
  });
  await prisma.foodDataSource.upsert({
    where: { code: 'VIETNAM_FCT_2017_METADATA' },
    update: { active: false },
    create: {
      code: 'VIETNAM_FCT_2017_METADATA',
      name: 'Vietnamese Food Composition Table 2017 (metadata only)',
      provider: FoodDataProvider.VIETNAM_CURATED,
      sourceUrl: 'https://www.fao.org/food-composition/tables-and-databases/',
      licenseName: 'Digital import rights not confirmed',
      attribution: 'Metadata reference only; no table values redistributed.',
      defaultLocale: 'vi-VN',
      active: false,
    },
  });

  const nutrientDefinitions = [
    {
      code: 'ENERGY_KCAL',
      name: 'Năng lượng',
      defaultUnit: 'kcal',
      unitDimension: UnitDimension.ENERGY,
    },
    { code: 'PROTEIN', name: 'Protein', defaultUnit: 'g', unitDimension: UnitDimension.MASS },
    { code: 'VITAMIN_C', name: 'Vitamin C', defaultUnit: 'mg', unitDimension: UnitDimension.MASS },
    { code: 'IRON', name: 'Sắt', defaultUnit: 'mg', unitDimension: UnitDimension.MASS },
  ] as const;
  const nutrients = new Map<string, { id: string }>();
  for (const definition of nutrientDefinitions) {
    const nutrient = await prisma.nutrient.upsert({
      where: { code: definition.code },
      update: { ...definition, active: true },
      create: definition,
    });
    nutrients.set(definition.code, nutrient);
  }

  const tofu = await prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'dau hu' } });
  const broccoli = await prisma.ingredient.findUniqueOrThrow({
    where: { normalizedName: 'bong cai xanh' },
  });
  const tofuProfile = await prisma.ingredientFoodProfile.upsert({
    where: {
      sourceId_sourceRecordId_sourceVersion: {
        sourceId: projectSource.id,
        sourceRecordId: 'demo-tofu-raw',
        sourceVersion: '1.0',
      },
    },
    update: {
      ingredientId: tofu.id,
      ediblePortionPercent: 100,
      servingGrams: 100,
      quality: FoodDataQuality.INCOMPLETE,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
    create: {
      ingredientId: tofu.id,
      sourceId: projectSource.id,
      sourceRecordId: 'demo-tofu-raw',
      sourceVersion: '1.0',
      preparation: 'raw',
      locale: 'vi-VN',
      ediblePortionPercent: 100,
      servingGrams: 100,
      quality: FoodDataQuality.INCOMPLETE,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });
  await prisma.householdConversion.upsert({
    where: {
      profileId_unitName_quantity: { profileId: tofuProfile.id, unitName: 'miếng', quantity: 1 },
    },
    update: { grams: 100, quality: FoodDataQuality.ESTIMATED },
    create: {
      profileId: tofuProfile.id,
      unitName: 'miếng',
      quantity: 1,
      unitDimension: UnitDimension.COUNT,
      grams: 100,
      quality: FoodDataQuality.ESTIMATED,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });
  const demoValues = [
    { code: 'ENERGY_KCAL', value: 76 },
    { code: 'PROTEIN', value: 8.08 },
    { code: 'IRON', value: 5.36 },
  ] as const;
  for (const value of demoValues) {
    const nutrient = nutrients.get(value.code);
    if (!nutrient) continue;
    const definition = nutrientDefinitions.find((item) => item.code === value.code);
    if (!definition) continue;
    await prisma.ingredientNutrientValue.upsert({
      where: {
        profileId_nutrientId_effectiveFrom: {
          profileId: tofuProfile.id,
          nutrientId: nutrient.id,
          effectiveFrom,
        },
      },
      update: { valuePer100g: value.value, unit: definition.defaultUnit },
      create: {
        profileId: tofuProfile.id,
        nutrientId: nutrient.id,
        valuePer100g: value.value,
        unit: definition.defaultUnit,
        quality: FoodDataQuality.INCOMPLETE,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
      },
    });
  }

  const broccoliProfile = await prisma.ingredientFoodProfile.upsert({
    where: {
      sourceId_sourceRecordId_sourceVersion: {
        sourceId: projectSource.id,
        sourceRecordId: 'demo-broccoli-raw',
        sourceVersion: '1.0',
      },
    },
    update: {
      ingredientId: broccoli.id,
      ediblePortionPercent: 100,
      servingGrams: 90,
      quality: FoodDataQuality.INCOMPLETE,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
    create: {
      ingredientId: broccoli.id,
      sourceId: projectSource.id,
      sourceRecordId: 'demo-broccoli-raw',
      sourceVersion: '1.0',
      preparation: 'raw',
      locale: 'vi-VN',
      ediblePortionPercent: 100,
      servingGrams: 90,
      quality: FoodDataQuality.INCOMPLETE,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });
  const broccoliValues = [
    { code: 'ENERGY_KCAL', value: 34 },
    { code: 'PROTEIN', value: 2.82 },
    { code: 'VITAMIN_C', value: 89.2 },
    { code: 'IRON', value: 0.73 },
  ] as const;
  for (const value of broccoliValues) {
    const nutrient = nutrients.get(value.code);
    const definition = nutrientDefinitions.find((item) => item.code === value.code);
    if (!nutrient || !definition) continue;
    await prisma.ingredientNutrientValue.upsert({
      where: {
        profileId_nutrientId_effectiveFrom: {
          profileId: broccoliProfile.id,
          nutrientId: nutrient.id,
          effectiveFrom,
        },
      },
      update: { valuePer100g: value.value, unit: definition.defaultUnit },
      create: {
        profileId: broccoliProfile.id,
        nutrientId: nutrient.id,
        valuePer100g: value.value,
        unit: definition.defaultUnit,
        quality: FoodDataQuality.INCOMPLETE,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
      },
    });
  }

  const vitaminC = nutrients.get('VITAMIN_C');
  if (!vitaminC) throw new Error('Seed nutrient VITAMIN_C missing');
  await prisma.nutrientReferenceIntake.upsert({
    where: {
      nutrientId_referenceType_populationCode_sourceId_sourceVersion_effectiveFrom: {
        nutrientId: vitaminC.id,
        referenceType: NutrientReferenceType.OTHER,
        populationCode: 'DEMO_ADULT_DISPLAY_ONLY',
        sourceId: projectSource.id,
        sourceVersion: '1.0',
        effectiveFrom,
      },
    },
    update: { value: 75, unit: 'mg' },
    create: {
      nutrientId: vitaminC.id,
      sourceId: projectSource.id,
      referenceType: NutrientReferenceType.OTHER,
      populationCode: 'DEMO_ADULT_DISPLAY_ONLY',
      applicability: { note: 'Illustrative fixture only' },
      value: 75,
      unit: 'mg',
      warningEligible: false,
      sourceRecordId: 'demo-vitamin-c-display-reference',
      sourceVersion: '1.0',
      locale: 'vi-VN',
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });
  await prisma.ingredientIntakeGuideline.upsert({
    where: {
      ingredientId_populationCode_period_sourceId_sourceVersion_effectiveFrom: {
        ingredientId: tofu.id,
        populationCode: 'DEMO_GENERAL',
        period: GuidelinePeriod.DAY,
        sourceId: projectSource.id,
        sourceVersion: '1.0',
        effectiveFrom,
      },
    },
    update: { amount: 100 },
    create: {
      ingredientId: tofu.id,
      sourceId: projectSource.id,
      populationCode: 'DEMO_GENERAL',
      applicability: { note: 'Illustrative fixture only' },
      amount: 100,
      unit: 'g',
      frequency: 1,
      period: GuidelinePeriod.DAY,
      advisoryOnly: true,
      evidenceGrade: EvidenceGrade.INSUFFICIENT,
      severity: FoodRuleSeverity.INFO,
      explanation: 'Khẩu phần minh họa cho giao diện; không phải giới hạn dinh dưỡng.',
      sourceRecordId: 'demo-tofu-guideline',
      sourceVersion: '1.0',
      locale: 'vi-VN',
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });

  const boiling = await prisma.cookingMethod.upsert({
    where: { code: 'BOILING' },
    update: { name: 'Luộc', active: true },
    create: { code: 'BOILING', name: 'Luộc', description: 'Nấu thực phẩm trong nước sôi.' },
  });
  await prisma.nutrientRetentionFactor.upsert({
    where: {
      cookingMethodId_nutrientId_sourceId_sourceVersion_effectiveFrom: {
        cookingMethodId: boiling.id,
        nutrientId: vitaminC.id,
        sourceId: projectSource.id,
        sourceVersion: '1.0',
        effectiveFrom,
      },
    },
    update: { factor: 0.55 },
    create: {
      cookingMethodId: boiling.id,
      nutrientId: vitaminC.id,
      sourceId: projectSource.id,
      factor: 0.55,
      applicability: { note: 'Illustrative fixture; cooking conditions vary' },
      sourceRecordId: 'demo-boiling-vitamin-c',
      sourceVersion: '1.0',
      quality: FoodDataQuality.ESTIMATED,
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });
  const existingYield = await prisma.cookingYieldFactor.findFirst({
    where: {
      cookingMethodId: boiling.id,
      ingredientId: broccoli.id,
      sourceId: projectSource.id,
      sourceVersion: '1.0',
      effectiveFrom,
    },
  });
  if (existingYield) {
    await prisma.cookingYieldFactor.update({
      where: { id: existingYield.id },
      data: { factor: 0.9 },
    });
  } else {
    await prisma.cookingYieldFactor.create({
      data: {
        cookingMethodId: boiling.id,
        ingredientId: broccoli.id,
        sourceId: projectSource.id,
        factor: 0.9,
        applicability: { note: 'Illustrative fixture; water loss varies' },
        sourceRecordId: 'demo-broccoli-boiling-yield',
        sourceVersion: '1.0',
        quality: FoodDataQuality.ESTIMATED,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        effectiveFrom,
      },
    });
  }
  const ingredientAId = tofu.id < broccoli.id ? tofu.id : broccoli.id;
  const ingredientBId = tofu.id < broccoli.id ? broccoli.id : tofu.id;
  await prisma.ingredientInteractionRule.upsert({
    where: {
      ingredientAId_ingredientBId_scope_sourceId_sourceVersion_effectiveFrom: {
        ingredientAId,
        ingredientBId,
        scope: InteractionScope.SAME_MEAL,
        sourceId: projectSource.id,
        sourceVersion: '1.0',
        effectiveFrom,
      },
    },
    update: { hardRule: false },
    create: {
      ingredientAId,
      ingredientBId,
      sourceId: projectSource.id,
      scope: InteractionScope.SAME_MEAL,
      direction: InteractionDirection.BENEFICIAL,
      severity: FoodRuleSeverity.INFO,
      evidenceGrade: EvidenceGrade.LOW,
      applicability: { note: 'Educational demo rule' },
      explanation: 'Ví dụ quy tắc tương tác mang tính giáo dục; không phải khuyến cáo lâm sàng.',
      hardRule: false,
      sourceRecordId: 'demo-tofu-broccoli-meal',
      sourceVersion: '1.0',
      locale: 'vi-VN',
      reviewStatus: FoodDataReviewStatus.APPROVED,
      reviewedById: adminId,
      reviewedAt: new Date(),
      effectiveFrom,
    },
  });
  const existingSuggestion = await prisma.foodDataSuggestion.findFirst({
    where: {
      suggestionType: FoodDataSuggestionType.INGREDIENT_MAPPING,
      reviewStatus: FoodDataReviewStatus.STAGED,
    },
  });
  if (!existingSuggestion) {
    await prisma.foodDataSuggestion.create({
      data: {
        suggestionType: FoodDataSuggestionType.INGREDIENT_MAPPING,
        provider: FoodDataProvider.AI_SUGGESTION,
        payload: { input: 'tofu mềm', candidateIngredientId: tofu.id },
        rationale: 'Demo staged suggestion; cannot publish canonical facts.',
        confidence: 0.8,
      },
    });
  }
}

const dietRuleDefinitions = [
  {
    code: 'DIET_VEGAN_EXCLUDE_ANIMAL_PRODUCTS',
    label: 'Loại trừ sản phẩm có nguồn gốc động vật',
    description: 'Quy tắc bắt buộc của lựa chọn VEGAN trong ứng dụng.',
    source: DietRuleSource.DIET_PATTERN,
    dietPattern: DietPattern.VEGAN,
    defaultEnabled: true,
    hardConstraint: true,
  },
  {
    code: 'DIET_LACTO_OVO_EXCLUDE_MEAT_AND_FISH',
    label: 'Loại trừ thịt và cá',
    description: 'Quy tắc bắt buộc của lựa chọn LACTO_OVO; sữa và trứng vẫn được phép.',
    source: DietRuleSource.DIET_PATTERN,
    dietPattern: DietPattern.LACTO_OVO,
    defaultEnabled: true,
    hardConstraint: true,
  },
  {
    code: 'TRADITION_BUDDHIST_EXCLUDE_FIVE_PUNGENT_ROOTS',
    label: 'Tùy chọn tránh ngũ vị tân',
    description:
      'Quy tắc thực hành tùy chọn do người dùng tự bật; không đại diện cho mọi người theo truyền thống Phật giáo.',
    source: DietRuleSource.TRADITION,
    tradition: Tradition.BUDDHIST,
    defaultEnabled: false,
    hardConstraint: true,
  },
  {
    code: 'TRADITION_CHRISTIAN_FASTING_EXCLUDE_ANIMAL_PRODUCTS',
    label: 'Tùy chọn kiêng sản phẩm động vật trong ngày thực hành',
    description:
      'Quy tắc thực hành tùy chọn do người dùng tự bật; không đại diện cho mọi người theo truyền thống Kitô giáo.',
    source: DietRuleSource.TRADITION,
    tradition: Tradition.CHRISTIAN,
    defaultEnabled: false,
    hardConstraint: true,
  },
] as const;

const seedEnvironment = z
  .object({
    SEED_MEMBER_EMAIL: z.string().email().default('member@example.com'),
    SEED_MEMBER_PASSWORD: z.string().min(8),
    SEED_PLATFORM_CONTRIBUTOR_EMAIL: z.string().email().default('contributor@example.com'),
    SEED_ORGANIZATION_CONTRIBUTOR_EMAIL: z.string().email().default('expert@example.com'),
    SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
    SEED_ADMIN_PASSWORD: z.string().min(8),
  })
  .parse(process.env);

async function main(): Promise<void> {
  const [memberPasswordHash, adminPasswordHash] = await Promise.all([
    passwordService.hash(seedEnvironment.SEED_MEMBER_PASSWORD),
    passwordService.hash(seedEnvironment.SEED_ADMIN_PASSWORD),
  ]);

  await prisma.$transaction([
    prisma.user.upsert({
      where: { email: seedEnvironment.SEED_MEMBER_EMAIL.toLowerCase() },
      update: {
        passwordHash: memberPasswordHash,
        displayName: 'Demo Member',
        role: Role.MEMBER,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: seedEnvironment.SEED_MEMBER_EMAIL.toLowerCase(),
        passwordHash: memberPasswordHash,
        displayName: 'Demo Member',
        role: Role.MEMBER,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { email: seedEnvironment.SEED_ADMIN_EMAIL.toLowerCase() },
      update: {
        passwordHash: adminPasswordHash,
        displayName: 'Demo Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: seedEnvironment.SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash: adminPasswordHash,
        displayName: 'Demo Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    }),
    ...dietRuleDefinitions.map((definition) =>
      prisma.dietRuleDefinition.upsert({
        where: {
          code_ruleSetVersion: {
            code: definition.code,
            ruleSetVersion: dietRuleSetVersion,
          },
        },
        update: { ...definition, active: true },
        create: { ...definition, ruleSetVersion: dietRuleSetVersion, active: true },
      }),
    ),
  ]);

  for (const allergen of allergenDefinitions) {
    await prisma.allergenDefinition.upsert({
      where: { code: allergen.code },
      update: { label: allergen.label, active: true },
      create: { ...allergen, active: true },
    });
  }

  const categoryIds = new Map<string, string>();
  for (const definition of categoryDefinitions) {
    const parentId =
      'parentSlug' in definition
        ? categoryIds.get(`${definition.type}:${definition.parentSlug}`)
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
    categoryIds.set(`${definition.type}:${definition.slug}`, category.id);
  }

  for (const definition of ingredientDefinitions) {
    await prisma.$transaction(async (transaction) => {
      const ingredient = await transaction.ingredient.upsert({
        where: { normalizedName: definition.normalizedName },
        update: {
          canonicalName: definition.canonicalName,
          foodGroup: definition.foodGroup,
          status: CatalogStatus.ACTIVE,
        },
        create: {
          canonicalName: definition.canonicalName,
          normalizedName: definition.normalizedName,
          foodGroup: definition.foodGroup,
          status: CatalogStatus.ACTIVE,
        },
      });
      await transaction.ingredientAlias.deleteMany({ where: { ingredientId: ingredient.id } });
      await transaction.ingredientAlias.createMany({
        data: definition.aliases.map((alias) => ({
          ingredientId: ingredient.id,
          alias,
          normalizedAlias: normalizeVietnameseText(alias),
        })),
      });
      await transaction.ingredientAllergen.deleteMany({ where: { ingredientId: ingredient.id } });
      await transaction.ingredientAllergen.createMany({
        data: definition.allergens.map((allergenCode) => ({
          ingredientId: ingredient.id,
          allergenCode,
        })),
      });
      await transaction.ingredientDietCompatibility.deleteMany({
        where: { ingredientId: ingredient.id },
      });
      await transaction.ingredientDietCompatibility.createMany({
        data: [
          {
            ingredientId: ingredient.id,
            dietPattern: DietPattern.VEGAN,
            compatible: definition.vegan,
          },
          {
            ingredientId: ingredient.id,
            dietPattern: DietPattern.LACTO_OVO,
            compatible: definition.lactoOvo,
          },
        ],
      });
      await transaction.ingredientTraditionWarning.deleteMany({
        where: { ingredientId: ingredient.id },
      });
      if ('buddhistWarning' in definition) {
        await transaction.ingredientTraditionWarning.create({
          data: {
            ingredientId: ingredient.id,
            tradition: Tradition.BUDDHIST,
            warningCode: definition.buddhistWarning[0],
            label: definition.buddhistWarning[1],
          },
        });
      }
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: seedEnvironment.SEED_ADMIN_EMAIL.toLowerCase() },
  });
  await seedFoodData(admin.id);
  const contributorSeedDefinitions = [
    {
      applicationId: '70000000-0000-4000-8000-000000000001',
      email: seedEnvironment.SEED_PLATFORM_CONTRIBUTOR_EMAIL.toLowerCase(),
      displayName: 'Demo Platform Contributor',
      claimedApprovalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
      approvalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
      organizationClaim: null,
      referenceLinks: [] as string[],
      experience:
        'Có kinh nghiệm thực hành chế độ ăn thực vật và chia sẻ công thức trong cộng đồng.',
      approvalEvidence: {
        kind: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
        capturedAt: '2026-09-15T00:00:00.000Z',
        snapshotVersion: 'seed-platform-track-record-v1',
        posts: { total: 0, published: 0, pendingReview: 0, rejected: 0 },
        interactions: {
          commentsReceived: 0,
          votesReceived: 0,
          ratingsReceived: 0,
          bookmarksReceived: 0,
          averageTasteRating: null,
        },
      },
    },
    {
      applicationId: '70000000-0000-4000-8000-000000000002',
      email: seedEnvironment.SEED_ORGANIZATION_CONTRIBUTOR_EMAIL.toLowerCase(),
      displayName: 'Demo Organization Contributor',
      claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
      approvalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
      organizationClaim: 'Demo Plant Nutrition Community',
      referenceLinks: ['https://example.com/demo-organization'],
      experience:
        'Đại diện cộng đồng demo chia sẻ kiến thức dinh dưỡng thực vật; không có xác minh chứng chỉ.',
      approvalEvidence: {
        kind: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        capturedAt: '2026-09-15T00:00:00.000Z',
        snapshotVersion: 'seed-organization-claim-v1',
        organizationClaim: 'Demo Plant Nutrition Community',
        referenceLinks: ['https://example.com/demo-organization'],
        verificationStatus: 'CLAIM_RETAINED_NOT_VERIFIED',
      },
    },
  ] as const;
  const seededApprovalAt = new Date('2026-09-15T00:00:00.000Z');
  for (const definition of contributorSeedDefinitions) {
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email: definition.email },
        update: {
          passwordHash: memberPasswordHash,
          displayName: definition.displayName,
          role: Role.CONTRIBUTOR,
          status: UserStatus.ACTIVE,
        },
        create: {
          email: definition.email,
          passwordHash: memberPasswordHash,
          displayName: definition.displayName,
          role: Role.CONTRIBUTOR,
          status: UserStatus.ACTIVE,
        },
      });
      const application = await transaction.contributorApplication.upsert({
        where: { id: definition.applicationId },
        update: {
          userId: user.id,
          claimedApprovalBasis: definition.claimedApprovalBasis,
          organizationClaim: definition.organizationClaim,
          experience: definition.experience,
          referenceLinks: definition.referenceLinks,
          source: ContributorApplicationSource.REGISTRATION,
          status: ContributorApplicationStatus.APPROVED,
          approvalBasis: definition.approvalBasis,
          reviewEvidence: definition.approvalEvidence,
          reviewNote: 'Approved seed profile for local role and permission validation.',
          reviewedById: admin.id,
          reviewedAt: seededApprovalAt,
          reapplyEligibleAt: null,
        },
        create: {
          id: definition.applicationId,
          userId: user.id,
          claimedApprovalBasis: definition.claimedApprovalBasis,
          organizationClaim: definition.organizationClaim,
          experience: definition.experience,
          referenceLinks: definition.referenceLinks,
          source: ContributorApplicationSource.REGISTRATION,
          status: ContributorApplicationStatus.APPROVED,
          approvalBasis: definition.approvalBasis,
          reviewEvidence: definition.approvalEvidence,
          reviewNote: 'Approved seed profile for local role and permission validation.',
          reviewedById: admin.id,
          reviewedAt: seededApprovalAt,
        },
      });
      await transaction.contributorProfile.upsert({
        where: { userId: user.id },
        update: {
          approvalBasis: definition.approvalBasis,
          approvalEvidence: definition.approvalEvidence,
          approvedAt: seededApprovalAt,
          approvedById: admin.id,
          sourceApplicationId: application.id,
          revokedAt: null,
          revokedById: null,
          revocationReason: null,
        },
        create: {
          userId: user.id,
          approvalBasis: definition.approvalBasis,
          approvalEvidence: definition.approvalEvidence,
          approvedAt: seededApprovalAt,
          approvedById: admin.id,
          sourceApplicationId: application.id,
        },
      });
      await transaction.contributorDecision.deleteMany({
        where: { applicationId: application.id, decision: ContributorDecisionType.APPROVED },
      });
      await transaction.contributorDecision.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          actorId: admin.id,
          decision: ContributorDecisionType.APPROVED,
          approvalBasis: definition.approvalBasis,
          evidence: definition.approvalEvidence,
          reason: 'Approved seed profile for unified Contributor permission validation.',
          createdAt: seededApprovalAt,
        },
      });
    });
  }
  const [recipeCategory, topicCategory, tofu, broccoli, brownRice, mushroom, boilingMethod] =
    await Promise.all([
    prisma.category.findFirstOrThrow({
      where: { type: CategoryType.FOOD_TYPE, slug: 'com-va-ngu-coc', status: CatalogStatus.ACTIVE },
    }),
    prisma.category.findFirstOrThrow({
      where: { type: CategoryType.CONTENT_TOPIC, slug: 'dinh-duong', status: CatalogStatus.ACTIVE },
    }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'dau hu' } }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'bong cai xanh' } }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'gao lut' } }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'nam huong' } }),
    prisma.cookingMethod.findUniqueOrThrow({ where: { code: 'BOILING' } }),
  ]);

  if (!(await prisma.post.findUnique({ where: { slug: 'dau-hu-xao-bong-cai-demo' } }))) {
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: PostType.RECIPE,
          slug: 'dau-hu-xao-bong-cai-demo',
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Đậu hũ xào bông cải',
          normalizedTitle: normalizeVietnameseText('Đậu hũ xào bông cải'),
          excerpt: 'Món xào giàu đạm thực vật cho bữa ăn nhanh.',
          normalizedExcerpt: normalizeVietnameseText('Món xào giàu đạm thực vật cho bữa ăn nhanh.'),
          body: 'Ép ráo đậu hũ, áp chảo vàng rồi xào nhanh cùng bông cải và sốt gia vị.',
          normalizedBody: normalizeVietnameseText(
            'Ép ráo đậu hũ, áp chảo vàng rồi xào nhanh cùng bông cải và sốt gia vị.',
          ),
          categories: { create: [{ categoryId: recipeCategory.id }] },
          tags: { create: postTagRows(['đậu hũ', 'bữa tối', 'nhanh']) },
          recipeDetail: {
            create: {
              servings: 2,
              prepTimeMinutes: 15,
              cookTimeMinutes: 20,
              difficulty: RecipeDifficulty.EASY,
              calories: 360,
              proteinGrams: 24,
              carbsGrams: 28,
              fatGrams: 18,
              fiberGrams: 8,
              vitaminB12Mcg: 0,
              mealPlannerEligible: true,
              allergenCodes: ['SOY'],
              traditionWarnings: [],
            },
          },
          ingredients: {
            create: [
              {
                ingredientId: tofu.id,
                position: 0,
                displayName: 'Đậu hũ',
                normalizedName: 'dau hu',
                amount: 300,
                unit: 'g',
                resolutionStatus: IngredientResolutionStatus.EXACT,
              },
              {
                ingredientId: broccoli.id,
                position: 1,
                displayName: 'Bông cải xanh',
                normalizedName: 'bong cai xanh',
                amount: 200,
                unit: 'g',
                resolutionStatus: IngredientResolutionStatus.EXACT,
              },
            ],
          },
          recipeSteps: {
            create: [
              {
                position: 0,
                instruction: 'Luoc bong cai trong nuoc soi den khi vua mem roi de rao.',
                cookingMethodId: boilingMethod.id,
                durationMinutes: 4,
                affectedIngredientPositions: [1],
              },
              {
                position: 1,
                instruction: 'Ap chao dau hu va tron nhanh voi bong cai cung sot gia vi.',
                durationMinutes: 8,
                affectedIngredientPositions: [0, 1],
              },
            ],
          },
          dietCompatibility: {
            create: [
              { dietPattern: DietPattern.VEGAN, compatible: true, reasonCodes: [] },
              { dietPattern: DietPattern.LACTO_OVO, compatible: true, reasonCodes: [] },
            ],
          },
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  const recipeSearchDemos = [
    {
      slug: 'bat-com-rau-xanh-demo',
      title: 'Bát cơm rau xanh giàu đạm',
      excerpt: 'Đậu hũ và gạo lứt cho một bữa ăn gọn, đủ chất.',
      body: 'Nấu gạo lứt mềm, áp chảo đậu hũ rồi dùng cùng rau xanh và gia vị nhẹ.',
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: RecipeDifficulty.EASY,
      calories: 430,
      allergens: ['SOY'],
      tags: ['đậu hũ', 'gạo lứt', 'bữa chính'],
      ingredients: [
        { ingredient: tofu, displayName: 'Tofu', amount: 200, unit: 'g' },
        { ingredient: brownRice, displayName: 'Gạo lứt', amount: 150, unit: 'g' },
      ],
    },
    {
      slug: 'chao-nam-gao-lut-demo',
      title: 'Cháo nấm gạo lứt',
      excerpt: 'Món cháo không chứa đậu nành, phù hợp cho bữa ăn nhẹ.',
      body: 'Ninh gạo lứt đến mềm rồi thêm nấm hương đã sơ chế và nêm gia vị vừa ăn.',
      prepTimeMinutes: 10,
      cookTimeMinutes: 35,
      difficulty: RecipeDifficulty.MEDIUM,
      calories: 320,
      allergens: [],
      tags: ['nấm', 'gạo lứt', 'cháo'],
      ingredients: [
        { ingredient: brownRice, displayName: 'Gạo lứt', amount: 180, unit: 'g' },
        { ingredient: mushroom, displayName: 'Nấm hương', amount: 80, unit: 'g' },
      ],
    },
  ] as const;

  for (const definition of recipeSearchDemos) {
    if (await prisma.post.findUnique({ where: { slug: definition.slug } })) continue;
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: PostType.RECIPE,
          slug: definition.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: definition.title,
          normalizedTitle: normalizeVietnameseText(definition.title),
          excerpt: definition.excerpt,
          normalizedExcerpt: normalizeVietnameseText(definition.excerpt),
          body: definition.body,
          normalizedBody: normalizeVietnameseText(definition.body),
          categories: { create: [{ categoryId: recipeCategory.id }] },
          tags: { create: postTagRows(definition.tags) },
          recipeDetail: {
            create: {
              servings: 2,
              prepTimeMinutes: definition.prepTimeMinutes,
              cookTimeMinutes: definition.cookTimeMinutes,
              difficulty: definition.difficulty,
              calories: definition.calories,
              proteinGrams: 18,
              carbsGrams: 48,
              fatGrams: 12,
              fiberGrams: 8,
              vitaminB12Mcg: 0,
              mealPlannerEligible: true,
              allergenCodes: [...definition.allergens],
              traditionWarnings: [],
            },
          },
          ingredients: {
            create: definition.ingredients.map((item, position) => ({
              ingredientId: item.ingredient.id,
              position,
              displayName: item.displayName,
              normalizedName: normalizeVietnameseText(item.displayName),
              amount: item.amount,
              unit: item.unit,
              resolutionStatus: IngredientResolutionStatus.EXACT,
            })),
          },
          dietCompatibility: {
            create: [
              { dietPattern: DietPattern.VEGAN, compatible: true, reasonCodes: [] },
              { dietPattern: DietPattern.LACTO_OVO, compatible: true, reasonCodes: [] },
            ],
          },
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  const plannerRecipeDefinitions = [
    { slug: 'to-dau-hu-rau-xanh-420-demo', title: 'Tô đậu hũ rau xanh 420 kcal', calories: 420 },
    { slug: 'com-nam-gao-lut-500-demo', title: 'Cơm nấm gạo lứt 500 kcal', calories: 500 },
    { slug: 'com-dau-hu-nam-520-demo', title: 'Cơm đậu hũ nấm 520 kcal', calories: 520 },
    { slug: 'gao-lut-bong-cai-540-demo', title: 'Gạo lứt bông cải 540 kcal', calories: 540 },
    { slug: 'to-nam-rau-xanh-560-demo', title: 'Tô nấm rau xanh 560 kcal', calories: 560 },
    { slug: 'com-dau-hu-bong-cai-580-demo', title: 'Cơm đậu hũ bông cải 580 kcal', calories: 580 },
    { slug: 'gao-lut-dau-hu-600-demo', title: 'Gạo lứt đậu hũ 600 kcal', calories: 600 },
    { slug: 'com-nam-bong-cai-610-demo', title: 'Cơm nấm bông cải 610 kcal', calories: 610 },
  ] as const;
  for (const [index, definition] of plannerRecipeDefinitions.entries()) {
    if (await prisma.post.findUnique({ where: { slug: definition.slug } })) continue;
    const firstIngredient = index % 2 === 0 ? tofu : mushroom;
    const secondIngredient = index % 3 === 0 ? broccoli : brownRice;
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: PostType.RECIPE,
          slug: definition.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: definition.title,
          normalizedTitle: normalizeVietnameseText(definition.title),
          excerpt: 'Fixture Recipe có nutrition và canonical ingredients cho Meal Planner.',
          normalizedExcerpt: normalizeVietnameseText(
            'Fixture Recipe có nutrition và canonical ingredients cho Meal Planner.',
          ),
          body: 'Sơ chế nguyên liệu, nấu chín và chia khẩu phần theo hướng dẫn Meal Planner demo.',
          normalizedBody: normalizeVietnameseText(
            'Sơ chế nguyên liệu, nấu chín và chia khẩu phần theo hướng dẫn Meal Planner demo.',
          ),
          categories: { create: [{ categoryId: recipeCategory.id }] },
          tags: { create: postTagRows(['meal planner', 'bữa chính']) },
          recipeDetail: {
            create: {
              servings: 2,
              prepTimeMinutes: 15,
              cookTimeMinutes: 25,
              difficulty: RecipeDifficulty.EASY,
              calories: definition.calories,
              proteinGrams: 22,
              carbsGrams: 58,
              fatGrams: 14,
              fiberGrams: 10,
              ...(index % 2 === 0 ? { vitaminB12Mcg: 0 } : {}),
              mealPlannerEligible: true,
              allergenCodes: firstIngredient.id === tofu.id ? ['SOY'] : [],
              traditionWarnings: [],
            },
          },
          ingredients: {
            create: [firstIngredient, secondIngredient].map((ingredient, position) => ({
              ingredientId: ingredient.id,
              position,
              displayName: ingredient.canonicalName,
              normalizedName: ingredient.normalizedName,
              amount: position === 0 ? 180 : 140,
              unit: 'g',
              resolutionStatus: IngredientResolutionStatus.EXACT,
            })),
          },
          dietCompatibility: {
            create: [
              { dietPattern: DietPattern.VEGAN, compatible: true, reasonCodes: [] },
              { dietPattern: DietPattern.LACTO_OVO, compatible: true, reasonCodes: [] },
            ],
          },
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  if (!(await prisma.post.findUnique({ where: { slug: 'dam-thuc-vat-trong-bua-an-demo' } }))) {
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: PostType.BLOG,
          slug: 'dam-thuc-vat-trong-bua-an-demo',
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Đạm thực vật trong bữa ăn hằng ngày',
          normalizedTitle: normalizeVietnameseText('Đạm thực vật trong bữa ăn hằng ngày'),
          excerpt: 'Kết hợp nhiều nhóm thực phẩm để xây dựng bữa ăn cân bằng.',
          normalizedExcerpt: normalizeVietnameseText(
            'Kết hợp nhiều nhóm thực phẩm để xây dựng bữa ăn cân bằng.',
          ),
          body: 'Các loại đậu, hạt và ngũ cốc cung cấp nguồn đạm thực vật đa dạng. Khi xây dựng thực đơn, hãy kết hợp nhiều nhóm thực phẩm, theo dõi khẩu phần và ưu tiên nhu cầu sức khỏe cá nhân thay vì dựa vào một nguyên liệu duy nhất.',
          normalizedBody: normalizeVietnameseText(
            'Các loại đậu, hạt và ngũ cốc cung cấp nguồn đạm thực vật đa dạng. Khi xây dựng thực đơn, hãy kết hợp nhiều nhóm thực phẩm, theo dõi khẩu phần và ưu tiên nhu cầu sức khỏe cá nhân thay vì dựa vào một nguyên liệu duy nhất.',
          ),
          categories: { create: [{ categoryId: topicCategory.id }] },
          tags: { create: postTagRows(['protein', 'dinh dưỡng']) },
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  if (!(await prisma.post.findUnique({ where: { slug: 'video-bua-an-xanh-demo' } }))) {
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: PostType.VIDEO,
          slug: 'video-bua-an-xanh-demo',
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Video chuẩn bị bữa ăn xanh',
          normalizedTitle: normalizeVietnameseText('Video chuẩn bị bữa ăn xanh'),
          excerpt: 'Demo contract video YouTube cho local development.',
          normalizedExcerpt: normalizeVietnameseText(
            'Demo contract video YouTube cho local development.',
          ),
          body: 'Video minh họa quy trình chuẩn bị nguyên liệu và sắp xếp một bữa ăn thực vật.',
          normalizedBody: normalizeVietnameseText(
            'Video minh họa quy trình chuẩn bị nguyên liệu và sắp xếp một bữa ăn thực vật.',
          ),
          categories: { create: [{ categoryId: topicCategory.id }] },
          tags: { create: postTagRows(['meal prep', 'lối sống xanh']) },
          media: {
            create: {
              kind: MediaKind.VIDEO,
              provider: MediaProvider.YOUTUBE,
              secureUrl: 'https://www.youtube.com/watch?v=veganDemo01',
            },
          },
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  const discoveryTextDemos = [
    {
      type: PostType.BLOG,
      slug: 'huong-dan-protein-thuc-vat-demo',
      title: 'Hướng dẫn cân bằng protein thực vật',
      excerpt: 'Cách phối hợp nguyên liệu quen thuộc trong tuần.',
      body: 'Đậu hũ là một lựa chọn tiện lợi, nhưng bữa ăn nên kết hợp thêm các loại đậu, hạt, rau và ngũ cốc. Theo dõi khẩu phần cùng nhu cầu cá nhân giúp thực đơn đa dạng hơn.',
      tags: ['protein', 'đậu hũ'],
    },
    {
      type: PostType.BLOG,
      slug: 'doc-nhan-dinh-duong-demo',
      title: 'Đọc nhãn dinh dưỡng cho người mới',
      excerpt: 'Các bước kiểm tra khẩu phần, đạm, đường và chất béo.',
      body: 'Bắt đầu từ kích thước khẩu phần, sau đó so sánh lượng đạm, chất xơ, đường bổ sung và chất béo. Danh sách thành phần giúp nhận diện nguyên liệu cần tránh theo hồ sơ cá nhân.',
      tags: ['dinh dưỡng', 'người mới'],
    },
    {
      type: PostType.BLOG,
      slug: 'bao-quan-rau-cu-demo',
      title: 'Bảo quản rau củ trong tuần',
      excerpt: 'Giảm lãng phí bằng cách sơ chế và chia hộp hợp lý.',
      body: 'Rau lá nên được làm ráo trước khi bảo quản, còn củ quả có thể chia theo từng bữa. Ghi ngày sơ chế trên hộp giúp ưu tiên nguyên liệu cần dùng trước và giảm lãng phí.',
      tags: ['rau củ', 'giảm lãng phí'],
    },
    {
      type: PostType.VIDEO,
      slug: 'video-so-che-rau-cu-demo',
      title: 'Video sơ chế rau củ nhanh',
      excerpt: 'Quy trình rửa, làm ráo và chia phần nguyên liệu.',
      body: 'Video hướng dẫn tổ chức khu vực sơ chế và chuẩn bị rau củ an toàn cho nhiều bữa ăn trong tuần.',
      tags: ['rau củ', 'meal prep'],
      youtubeId: 'greenPrep01',
    },
    {
      type: PostType.VIDEO,
      slug: 'video-nau-chao-nam-demo',
      title: 'Video nấu cháo nấm',
      excerpt: 'Minh họa cách ninh gạo và thêm nấm đúng thời điểm.',
      body: 'Video trình bày các bước nấu cháo nấm gạo lứt với thời gian và độ lửa phù hợp cho người mới.',
      tags: ['nấm', 'cháo'],
      youtubeId: 'mushroom001',
    },
  ] as const;

  for (const definition of discoveryTextDemos) {
    if (await prisma.post.findUnique({ where: { slug: definition.slug } })) continue;
    await prisma.$transaction(async (transaction) => {
      const post = await transaction.post.create({
        data: {
          authorId: admin.id,
          type: definition.type,
          slug: definition.slug,
          status: PostStatus.PUBLISHED,
          version: 1,
          publishedAt: new Date(),
        },
      });
      const revision = await transaction.postRevision.create({
        data: {
          postId: post.id,
          createdById: admin.id,
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: definition.title,
          normalizedTitle: normalizeVietnameseText(definition.title),
          excerpt: definition.excerpt,
          normalizedExcerpt: normalizeVietnameseText(definition.excerpt),
          body: definition.body,
          normalizedBody: normalizeVietnameseText(definition.body),
          categories: { create: [{ categoryId: topicCategory.id }] },
          tags: { create: postTagRows(definition.tags) },
          ...('youtubeId' in definition
            ? {
                media: {
                  create: {
                    kind: MediaKind.VIDEO,
                    provider: MediaProvider.YOUTUBE,
                    secureUrl: `https://www.youtube.com/watch?v=${definition.youtubeId}`,
                  },
                },
              }
            : {}),
        },
      });
      await transaction.post.update({
        where: { id: post.id },
        data: { publishedRevisionId: revision.id },
      });
    });
  }

  const [member, communityRecipe, communityVideo] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { email: seedEnvironment.SEED_MEMBER_EMAIL.toLowerCase() },
    }),
    prisma.post.findUniqueOrThrow({ where: { slug: 'dau-hu-xao-bong-cai-demo' } }),
    prisma.post.findUniqueOrThrow({ where: { slug: 'video-bua-an-xanh-demo' } }),
  ]);
  await prisma.healthProfile.upsert({
    where: { userId: member.id },
    update: {
      heightCm: 160,
      weightKg: 50,
      age: 28,
      sex: HealthSex.FEMALE,
      activityLevel: ActivityLevel.SEDENTARY,
      bmi: 19.53,
      bmr: 1199,
      tdee: 1438.8,
      dataSource: HealthDataSource.MANUAL,
    },
    create: {
      userId: member.id,
      heightCm: 160,
      weightKg: 50,
      age: 28,
      sex: HealthSex.FEMALE,
      activityLevel: ActivityLevel.SEDENTARY,
      bmi: 19.53,
      bmr: 1199,
      tdee: 1438.8,
      dataSource: HealthDataSource.MANUAL,
    },
  });

  const [constraintsMember, periodicMember] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { email: seedEnvironment.SEED_PLATFORM_CONTRIBUTOR_EMAIL.toLowerCase() },
    }),
    prisma.user.findUniqueOrThrow({
      where: { email: seedEnvironment.SEED_ORGANIZATION_CONTRIBUTOR_EMAIL.toLowerCase() },
    }),
  ]);
  const scenarioHealthProfile = {
    heightCm: 160,
    weightKg: 50,
    age: 28,
    sex: HealthSex.FEMALE,
    activityLevel: ActivityLevel.SEDENTARY,
    bmi: 19.53,
    bmr: 1199,
    tdee: 1438.8,
    dataSource: HealthDataSource.MANUAL,
  } as const;
  const nextMonday = new Date();
  nextMonday.setUTCHours(0, 0, 0, 0);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + ((8 - nextMonday.getUTCDay()) % 7 || 7));
  const buddhistRule = await prisma.dietRuleDefinition.findUniqueOrThrow({
    where: {
      code_ruleSetVersion: {
        code: 'TRADITION_BUDDHIST_EXCLUDE_FIVE_PUNGENT_ROOTS',
        ruleSetVersion: dietRuleSetVersion,
      },
    },
  });

  await prisma.$transaction(async (transaction) => {
    for (const userId of [member.id, constraintsMember.id, periodicMember.id]) {
      await transaction.healthProfile.upsert({
        where: { userId },
        update: scenarioHealthProfile,
        create: { userId, ...scenarioHealthProfile },
      });
    }
    await transaction.healthProfile.deleteMany({ where: { userId: admin.id } });

    for (const userId of [member.id, constraintsMember.id]) {
      await transaction.dietPreference.upsert({
        where: { userId },
        update: {
          dietPattern: DietPattern.VEGAN,
          practiceSchedule: PracticeSchedule.PERMANENT,
          tradition: Tradition.NONE,
          ruleSetVersion: dietRuleSetVersion,
          confirmedAt: new Date(),
        },
        create: {
          userId,
          dietPattern: DietPattern.VEGAN,
          practiceSchedule: PracticeSchedule.PERMANENT,
          tradition: Tradition.NONE,
          ruleSetVersion: dietRuleSetVersion,
          confirmedAt: new Date(),
        },
      });
    }
    await transaction.dietPreference.upsert({
      where: { userId: periodicMember.id },
      update: {
        dietPattern: DietPattern.VEGAN,
        practiceSchedule: PracticeSchedule.PERIODIC,
        tradition: Tradition.BUDDHIST,
        ruleSetVersion: dietRuleSetVersion,
        confirmedAt: new Date(),
      },
      create: {
        userId: periodicMember.id,
        dietPattern: DietPattern.VEGAN,
        practiceSchedule: PracticeSchedule.PERIODIC,
        tradition: Tradition.BUDDHIST,
        ruleSetVersion: dietRuleSetVersion,
        confirmedAt: new Date(),
      },
    });
    await transaction.dietPreferenceRule.upsert({
      where: {
        userId_ruleDefinitionId: {
          userId: periodicMember.id,
          ruleDefinitionId: buddhistRule.id,
        },
      },
      update: { enabled: true, source: DietRuleSource.TRADITION },
      create: {
        userId: periodicMember.id,
        ruleDefinitionId: buddhistRule.id,
        enabled: true,
        source: DietRuleSource.TRADITION,
      },
    });
    await transaction.dietScheduleDate.deleteMany({ where: { userId: periodicMember.id } });
    await transaction.dietScheduleDate.create({
      data: { userId: periodicMember.id, date: nextMonday, enabled: true },
    });

    await transaction.userAllergy.deleteMany({ where: { userId: constraintsMember.id } });
    await transaction.userAllergy.create({
      data: {
        userId: constraintsMember.id,
        allergenCode: 'SOY',
        label: 'Đậu nành',
        active: true,
      },
    });
    await transaction.userIngredientExclusion.deleteMany({
      where: { userId: constraintsMember.id },
    });
    await transaction.userIngredientExclusion.create({
      data: {
        userId: constraintsMember.id,
        ingredientId: mushroom.id,
        ingredientName: mushroom.canonicalName,
        normalizedName: mushroom.normalizedName,
        reason: 'Scenario fixture: hard constraint must never be relaxed',
        active: true,
      },
    });
  });
  const rootCommentId = '60000000-0000-4000-8000-000000000001';
  const replyCommentId = '60000000-0000-4000-8000-000000000002';
  await prisma.$transaction(async (transaction) => {
    await transaction.comment.upsert({
      where: { id: rootCommentId },
      update: {
        postId: communityRecipe.id,
        authorId: member.id,
        parentId: null,
        content: 'Công thức dễ theo dõi và phù hợp cho bữa tối nhanh.',
        status: CommentStatus.VISIBLE,
        editedAt: null,
        deletedAt: null,
        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,
      },
      create: {
        id: rootCommentId,
        postId: communityRecipe.id,
        authorId: member.id,
        content: 'Công thức dễ theo dõi và phù hợp cho bữa tối nhanh.',
      },
    });
    await transaction.comment.upsert({
      where: { id: replyCommentId },
      update: {
        postId: communityRecipe.id,
        authorId: admin.id,
        parentId: rootCommentId,
        content: 'Cảm ơn bạn, có thể giảm thêm thời gian bằng cách sơ chế bông cải trước.',
        status: CommentStatus.VISIBLE,
        editedAt: null,
        deletedAt: null,
        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,
      },
      create: {
        id: replyCommentId,
        postId: communityRecipe.id,
        authorId: admin.id,
        parentId: rootCommentId,
        content: 'Cảm ơn bạn, có thể giảm thêm thời gian bằng cách sơ chế bông cải trước.',
      },
    });
    await transaction.postVote.upsert({
      where: { userId_postId: { userId: member.id, postId: communityRecipe.id } },
      update: {},
      create: { userId: member.id, postId: communityRecipe.id },
    });
    await transaction.postVote.upsert({
      where: { userId_postId: { userId: admin.id, postId: communityRecipe.id } },
      update: {},
      create: { userId: admin.id, postId: communityRecipe.id },
    });
    await transaction.postRating.upsert({
      where: { userId_postId: { userId: member.id, postId: communityRecipe.id } },
      update: { taste: 5, difficulty: 2, active: true },
      create: { userId: member.id, postId: communityRecipe.id, taste: 5, difficulty: 2 },
    });
    await transaction.postRating.upsert({
      where: { userId_postId: { userId: admin.id, postId: communityRecipe.id } },
      update: { taste: 4, difficulty: 2, active: true },
      create: { userId: admin.id, postId: communityRecipe.id, taste: 4, difficulty: 2 },
    });
    for (const postId of [communityRecipe.id, communityVideo.id]) {
      await transaction.postBookmark.upsert({
        where: { userId_postId: { userId: member.id, postId } },
        update: {},
        create: { userId: member.id, postId },
      });
    }
  });

  const platformContributor = await prisma.user.findUniqueOrThrow({
    where: { email: seedEnvironment.SEED_PLATFORM_CONTRIBUTOR_EMAIL.toLowerCase() },
  });
  const mushroomRecipe = await prisma.post.findUniqueOrThrow({
    where: { slug: 'chao-nam-gao-lut-demo' },
  });
  const behaviorSeededAt = new Date(Date.now() - 30 * 60 * 1_000);
  await prisma.$transaction(async (transaction) => {
    for (const user of [member, platformContributor]) {
      await transaction.personalizationPreference.upsert({
        where: { userId: user.id },
        update: {
          enabled: true,
          consentVersion: 'behavior-personalization-v1',
          consentedAt: behaviorSeededAt,
          disabledAt: null,
        },
        create: {
          userId: user.id,
          enabled: true,
          consentVersion: 'behavior-personalization-v1',
          consentedAt: behaviorSeededAt,
        },
      });
    }
    const behaviorFixtures = [
      {
        id: '90000000-0000-4000-8000-000000000001',
        userId: member.id,
        type: BehaviorEventType.BOOKMARK,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-bookmark-tofu',
        payloadHash: '1'.repeat(64),
        metadata: {},
        occurredAt: behaviorSeededAt,
      },
      {
        id: '90000000-0000-4000-8000-000000000002',
        userId: member.id,
        type: BehaviorEventType.VIEW_RECIPE,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-view-tofu-1',
        dedupeKey: 'seed-member-view-tofu-bucket-1',
        payloadHash: '2'.repeat(64),
        metadata: {},
        occurredAt: new Date(behaviorSeededAt.getTime() + 10 * 60 * 1_000),
      },
      {
        id: '90000000-0000-4000-8000-000000000003',
        userId: member.id,
        type: BehaviorEventType.VIEW_RECIPE,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-view-tofu-2',
        dedupeKey: 'seed-member-view-tofu-bucket-2',
        payloadHash: '3'.repeat(64),
        metadata: {},
        occurredAt: new Date(behaviorSeededAt.getTime() + 20 * 60 * 1_000),
      },
      {
        id: '90000000-0000-4000-8000-000000000004',
        userId: platformContributor.id,
        type: BehaviorEventType.CHAT_TOPIC,
        idempotencyKey: 'seed-contributor-topic-mushroom',
        dedupeKey: 'seed-contributor-topic-mushroom-bucket',
        payloadHash: '4'.repeat(64),
        metadata: { topicCodes: ['MUSHROOM', 'WHOLE_GRAINS'] },
        occurredAt: behaviorSeededAt,
      },
      {
        id: '90000000-0000-4000-8000-000000000005',
        userId: platformContributor.id,
        type: BehaviorEventType.VIEW_RECIPE,
        entityId: mushroomRecipe.id,
        idempotencyKey: 'seed-contributor-view-mushroom-1',
        dedupeKey: 'seed-contributor-view-mushroom-bucket-1',
        payloadHash: '5'.repeat(64),
        metadata: {},
        occurredAt: new Date(behaviorSeededAt.getTime() + 10 * 60 * 1_000),
      },
      {
        id: '90000000-0000-4000-8000-000000000006',
        userId: platformContributor.id,
        type: BehaviorEventType.VIEW_RECIPE,
        entityId: mushroomRecipe.id,
        idempotencyKey: 'seed-contributor-view-mushroom-2',
        dedupeKey: 'seed-contributor-view-mushroom-bucket-2',
        payloadHash: '6'.repeat(64),
        metadata: {},
        occurredAt: new Date(behaviorSeededAt.getTime() + 20 * 60 * 1_000),
      },
    ];
    for (const fixture of behaviorFixtures) {
      await transaction.behaviorEvent.upsert({
        where: { id: fixture.id },
        update: { ...fixture, consentVersion: 'behavior-personalization-v1' },
        create: { ...fixture, consentVersion: 'behavior-personalization-v1' },
      });
    }
  });
  const quarantinePostId = '80000000-0000-4000-8000-000000000001';
  const quarantineRevisionId = '80000000-0000-4000-8000-000000000002';
  const aiFlagId = '80000000-0000-4000-8000-000000000003';
  await prisma.$transaction(async (transaction) => {
    await transaction.post.upsert({
      where: { id: quarantinePostId },
      update: {
        authorId: platformContributor.id,
        type: PostType.BLOG,
        slug: 'moderation-quarantine-demo',
        status: PostStatus.QUARANTINED,
        version: 1,
        publishedRevisionId: null,
        publishedAt: null,
      },
      create: {
        id: quarantinePostId,
        authorId: platformContributor.id,
        type: PostType.BLOG,
        slug: 'moderation-quarantine-demo',
        status: PostStatus.QUARANTINED,
        version: 1,
      },
    });
    await transaction.postRevision.upsert({
      where: { id: quarantineRevisionId },
      update: {
        postId: quarantinePostId,
        createdById: platformContributor.id,
        version: 1,
        status: PostRevisionStatus.QUARANTINED,
        title: 'Demo nội dung health claim rủi ro cao',
        normalizedTitle: normalizeVietnameseText('Demo nội dung health claim rủi ro cao'),
        body: 'Bản ghi demo chỉ dùng để kiểm tra queue moderation cục bộ.',
        normalizedBody: normalizeVietnameseText(
          'Bản ghi demo chỉ dùng để kiểm tra queue moderation cục bộ.',
        ),
      },
      create: {
        id: quarantineRevisionId,
        postId: quarantinePostId,
        createdById: platformContributor.id,
        version: 1,
        status: PostRevisionStatus.QUARANTINED,
        title: 'Demo nội dung health claim rủi ro cao',
        normalizedTitle: normalizeVietnameseText('Demo nội dung health claim rủi ro cao'),
        body: 'Bản ghi demo chỉ dùng để kiểm tra queue moderation cục bộ.',
        normalizedBody: normalizeVietnameseText(
          'Bản ghi demo chỉ dùng để kiểm tra queue moderation cục bộ.',
        ),
        categories: { create: [{ categoryId: topicCategory.id }] },
        tags: { create: postTagRows(['moderation', 'health claim']) },
      },
    });
    await transaction.aiFlag.upsert({
      where: { id: aiFlagId },
      update: {
        postRevisionId: quarantineRevisionId,
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['HARMFUL_HEALTH_CLAIM'],
        riskScore: 0.98,
        riskLevel: AiFlagRiskLevel.HIGH,
        status: AiFlagStatus.OPEN,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        id: aiFlagId,
        postRevisionId: quarantineRevisionId,
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['HARMFUL_HEALTH_CLAIM'],
        riskScore: 0.98,
        riskLevel: AiFlagRiskLevel.HIGH,
        status: AiFlagStatus.OPEN,
      },
    });
  });

  const reportId = '80000000-0000-4000-8000-000000000004';
  await prisma.report.upsert({
    where: { id: reportId },
    update: {
      reporterId: member.id,
      targetType: ReportTargetType.POST,
      targetId: communityRecipe.id,
      reasonCode: 'OTHER',
      details: 'Report demo để kiểm tra Admin moderation queue.',
      status: ReportStatus.OPEN,
      priority: ModerationPriority.NORMAL,
      activeKey: `${member.id}:${ReportTargetType.POST}:${communityRecipe.id}`,
      resolvedDecision: null,
      resolvedReason: null,
      resolvedById: null,
      resolvedAt: null,
    },
    create: {
      id: reportId,
      reporterId: member.id,
      targetType: ReportTargetType.POST,
      targetId: communityRecipe.id,
      reasonCode: 'OTHER',
      details: 'Report demo để kiểm tra Admin moderation queue.',
      status: ReportStatus.OPEN,
      priority: ModerationPriority.NORMAL,
      activeKey: `${member.id}:${ReportTargetType.POST}:${communityRecipe.id}`,
    },
  });
  await seedScenarioData(prisma, {
    memberEmail: seedEnvironment.SEED_MEMBER_EMAIL.toLowerCase(),
    memberPasswordHash,
    adminEmail: seedEnvironment.SEED_ADMIN_EMAIL.toLowerCase(),
    platformContributorEmail: seedEnvironment.SEED_PLATFORM_CONTRIBUTOR_EMAIL.toLowerCase(),
    organizationContributorEmail: seedEnvironment.SEED_ORGANIZATION_CONTRIBUTOR_EMAIL.toLowerCase(),
    nextMonday,
  });
  console.info(
    `Seeded local Member, unified Contributors with two approval bases, Admin, diet rules v${String(dietRuleSetVersion)}, catalog, discovery/community data, workflow states, behavior/recommendation, Meal Planner, scenario fixtures, and moderation queues.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
