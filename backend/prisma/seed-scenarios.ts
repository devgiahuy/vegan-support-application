import {
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
  FoodGroup,
  IngredientResolutionStatus,
  MealGoal,
  MealProgramAnalysisStatus,
  MealProgramProjectionStatus,
  MealProgramStatus,
  MealProgramWeekStatus,
  MealSlotStatus,
  MealType,
  MediaKind,
  MediaProvider,
  ModerationDecision,
  ModerationPriority,
  ModerationTargetType,
  NutritionDataQuality,
  PostRevisionStatus,
  PostStatus,
  PostType,
  Prisma,
  type PrismaClient,
  RecipeDifficulty,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
} from '@prisma/client';
import { normalizeVietnameseText } from '../src/modules/catalog/catalog.normalization.js';

interface ScenarioSeedInput {
  memberEmail: string;
  memberPasswordHash: string;
  adminEmail: string;
  platformContributorEmail: string;
  organizationContributorEmail: string;
  nextMonday: Date;
}

interface RevisionFixture {
  id: string;
  version: number;
  status: PostRevisionStatus;
  title: string;
  excerpt: string;
  body: string;
  categoryId: string;
  tags: string[];
  reviewNote?: string;
  reviewedById?: string;
  media?: {
    kind: MediaKind;
    provider: MediaProvider;
    secureUrl: string;
    publicId?: string;
    mimeType?: string;
    width?: number;
    height?: number;
  };
  recipe?: {
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: RecipeDifficulty;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    vitaminB12Mcg?: number;
    mealPlannerEligible: boolean;
    allergenCodes: string[];
    traditionWarnings: Array<{ tradition: string; warningCode: string; label: string }>;
    ingredients: Array<{
      ingredientId: string;
      displayName: string;
      normalizedName: string;
      amount: number;
      unit: string;
    }>;
    vegan: boolean;
    lactoOvo: boolean;
  };
}

function scenarioEmail(baseEmail: string, label: string): string {
  const separator = baseEmail.lastIndexOf('@');
  return `${baseEmail.slice(0, separator)}+seed-${label}${baseEmail.slice(separator)}`;
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

async function seedPost(
  transaction: Prisma.TransactionClient,
  fixture: {
    id: string;
    authorId: string;
    type: PostType;
    slug: string;
    status: PostStatus;
    revisions: RevisionFixture[];
    publishedRevisionId?: string;
  },
): Promise<void> {
  await transaction.post.upsert({
    where: { id: fixture.id },
    update: {
      authorId: fixture.authorId,
      type: fixture.type,
      slug: fixture.slug,
      status: fixture.status,
      version: Math.max(...fixture.revisions.map((revision) => revision.version)),
      publishedRevisionId: null,
      publishedAt: fixture.publishedRevisionId ? new Date('2026-09-15T03:00:00.000Z') : null,
      deletedAt: null,
      deletedById: null,
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
    create: {
      id: fixture.id,
      authorId: fixture.authorId,
      type: fixture.type,
      slug: fixture.slug,
      status: fixture.status,
      version: Math.max(...fixture.revisions.map((revision) => revision.version)),
      publishedAt: fixture.publishedRevisionId ? new Date('2026-09-15T03:00:00.000Z') : null,
    },
  });

  for (const revision of fixture.revisions) {
    await transaction.postRevision.upsert({
      where: { id: revision.id },
      update: {
        postId: fixture.id,
        version: revision.version,
        status: revision.status,
        title: revision.title,
        normalizedTitle: normalizeVietnameseText(revision.title),
        excerpt: revision.excerpt,
        normalizedExcerpt: normalizeVietnameseText(revision.excerpt),
        body: revision.body,
        normalizedBody: normalizeVietnameseText(revision.body),
        createdById: fixture.authorId,
        reviewNote: revision.reviewNote ?? null,
        reviewedById: revision.reviewedById ?? null,
        reviewedAt: revision.reviewedById ? new Date('2026-09-15T04:00:00.000Z') : null,
      },
      create: {
        id: revision.id,
        postId: fixture.id,
        version: revision.version,
        status: revision.status,
        title: revision.title,
        normalizedTitle: normalizeVietnameseText(revision.title),
        excerpt: revision.excerpt,
        normalizedExcerpt: normalizeVietnameseText(revision.excerpt),
        body: revision.body,
        normalizedBody: normalizeVietnameseText(revision.body),
        createdById: fixture.authorId,
        reviewNote: revision.reviewNote ?? null,
        reviewedById: revision.reviewedById ?? null,
        reviewedAt: revision.reviewedById ? new Date('2026-09-15T04:00:00.000Z') : null,
      },
    });
    await Promise.all([
      transaction.postCategory.deleteMany({ where: { revisionId: revision.id } }),
      transaction.postTag.deleteMany({ where: { revisionId: revision.id } }),
      transaction.postMedia.deleteMany({ where: { revisionId: revision.id } }),
      transaction.recipeIngredient.deleteMany({ where: { revisionId: revision.id } }),
      transaction.recipeDietCompatibility.deleteMany({ where: { revisionId: revision.id } }),
    ]);
    await transaction.postCategory.create({
      data: { revisionId: revision.id, categoryId: revision.categoryId },
    });
    await transaction.postTag.createMany({
      data: revision.tags.map((tag) => ({
        revisionId: revision.id,
        tag,
        normalizedTag: normalizeVietnameseText(tag),
      })),
    });
    if (revision.media) {
      await transaction.postMedia.create({
        data: { revisionId: revision.id, position: 0, ...revision.media },
      });
    }
    if (revision.recipe) {
      await transaction.recipeDetail.upsert({
        where: { revisionId: revision.id },
        update: {
          servings: revision.recipe.servings,
          prepTimeMinutes: revision.recipe.prepTimeMinutes,
          cookTimeMinutes: revision.recipe.cookTimeMinutes,
          difficulty: revision.recipe.difficulty,
          calories: revision.recipe.calories,
          proteinGrams: revision.recipe.proteinGrams,
          carbsGrams: revision.recipe.carbsGrams,
          fatGrams: revision.recipe.fatGrams,
          fiberGrams: revision.recipe.fiberGrams,
          vitaminB12Mcg: revision.recipe.vitaminB12Mcg ?? null,
          mealPlannerEligible: revision.recipe.mealPlannerEligible,
          allergenCodes: revision.recipe.allergenCodes,
          traditionWarnings: revision.recipe.traditionWarnings,
        },
        create: {
          revisionId: revision.id,
          servings: revision.recipe.servings,
          prepTimeMinutes: revision.recipe.prepTimeMinutes,
          cookTimeMinutes: revision.recipe.cookTimeMinutes,
          difficulty: revision.recipe.difficulty,
          calories: revision.recipe.calories,
          proteinGrams: revision.recipe.proteinGrams,
          carbsGrams: revision.recipe.carbsGrams,
          fatGrams: revision.recipe.fatGrams,
          fiberGrams: revision.recipe.fiberGrams,
          vitaminB12Mcg: revision.recipe.vitaminB12Mcg ?? null,
          mealPlannerEligible: revision.recipe.mealPlannerEligible,
          allergenCodes: revision.recipe.allergenCodes,
          traditionWarnings: revision.recipe.traditionWarnings,
        },
      });
      await transaction.recipeIngredient.createMany({
        data: revision.recipe.ingredients.map((ingredient, position) => ({
          revisionId: revision.id,
          position,
          resolutionStatus: IngredientResolutionStatus.EXACT,
          ...ingredient,
        })),
      });
      await transaction.recipeDietCompatibility.createMany({
        data: [
          {
            revisionId: revision.id,
            dietPattern: DietPattern.VEGAN,
            compatible: revision.recipe.vegan,
            reasonCodes: revision.recipe.vegan ? [] : ['CONTAINS_DAIRY'],
          },
          {
            revisionId: revision.id,
            dietPattern: DietPattern.LACTO_OVO,
            compatible: revision.recipe.lactoOvo,
            reasonCodes: revision.recipe.lactoOvo ? [] : ['INCOMPATIBLE_INGREDIENT'],
          },
        ],
      });
    } else {
      await transaction.recipeDetail.deleteMany({ where: { revisionId: revision.id } });
    }
  }

  if (fixture.publishedRevisionId) {
    await transaction.post.update({
      where: { id: fixture.id },
      data: { publishedRevisionId: fixture.publishedRevisionId },
    });
  }
}

export async function seedScenarioData(
  prisma: PrismaClient,
  input: ScenarioSeedInput,
): Promise<void> {
  const [member, admin, platformContributor, organizationContributor] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: input.memberEmail } }),
    prisma.user.findUniqueOrThrow({ where: { email: input.adminEmail } }),
    prisma.user.findUniqueOrThrow({ where: { email: input.platformContributorEmail } }),
    prisma.user.findUniqueOrThrow({ where: { email: input.organizationContributorEmail } }),
  ]);

  const scenarioUsers = [
    {
      id: 'a1000000-0000-4000-8000-000000000001',
      email: scenarioEmail(input.memberEmail, 'pending-contributor'),
      displayName: 'Seed Pending Contributor',
      status: UserStatus.ACTIVE,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000002',
      email: scenarioEmail(input.memberEmail, 'rejected-contributor'),
      displayName: 'Seed Rejected Contributor',
      status: UserStatus.ACTIVE,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000003',
      email: scenarioEmail(input.memberEmail, 'cold-start'),
      displayName: 'Seed Cold Start Member',
      status: UserStatus.ACTIVE,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000004',
      email: scenarioEmail(input.memberEmail, 'reporter-two'),
      displayName: 'Seed Reporter Two',
      status: UserStatus.ACTIVE,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000005',
      email: scenarioEmail(input.memberEmail, 'reporter-three'),
      displayName: 'Seed Reporter Three',
      status: UserStatus.ACTIVE,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000006',
      email: scenarioEmail(input.memberEmail, 'locked'),
      displayName: 'Seed Locked Member',
      status: UserStatus.LOCKED,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000007',
      email: scenarioEmail(input.memberEmail, 'banned'),
      displayName: 'Seed Banned Member',
      status: UserStatus.BANNED,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000008',
      email: scenarioEmail(input.memberEmail, 'deleted'),
      displayName: 'Seed Deleted Member',
      status: UserStatus.DELETED,
    },
  ] as const;
  const users = new Map<string, { id: string; email: string }>();
  for (const definition of scenarioUsers) {
    const isLocked = definition.status === UserStatus.LOCKED;
    const isDeleted = definition.status === UserStatus.DELETED;
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      update: {
        passwordHash: input.memberPasswordHash,
        displayName: definition.displayName,
        role: Role.MEMBER,
        status: definition.status,
        failedLoginAttempts: isLocked ? 5 : 0,
        lockedUntil: isLocked ? addDays(new Date(), 7) : null,
        deletedAt: isDeleted ? new Date('2026-09-15T05:00:00.000Z') : null,
        privateDataPurgeAt: isDeleted ? new Date('2026-10-15T05:00:00.000Z') : null,
      },
      create: {
        id: definition.id,
        email: definition.email,
        passwordHash: input.memberPasswordHash,
        displayName: definition.displayName,
        role: Role.MEMBER,
        status: definition.status,
        failedLoginAttempts: isLocked ? 5 : 0,
        lockedUntil: isLocked ? addDays(new Date(), 7) : null,
        deletedAt: isDeleted ? new Date('2026-09-15T05:00:00.000Z') : null,
        privateDataPurgeAt: isDeleted ? new Date('2026-10-15T05:00:00.000Z') : null,
      },
      select: { id: true, email: true },
    });
    users.set(definition.email, user);
  }

  const pendingApplicant = users.get(scenarioEmail(input.memberEmail, 'pending-contributor'))!;
  const rejectedApplicant = users.get(scenarioEmail(input.memberEmail, 'rejected-contributor'))!;
  const coldStartMember = users.get(scenarioEmail(input.memberEmail, 'cold-start'))!;
  const reporterTwo = users.get(scenarioEmail(input.memberEmail, 'reporter-two'))!;
  const reporterThree = users.get(scenarioEmail(input.memberEmail, 'reporter-three'))!;

  await prisma.$transaction([
    prisma.contributorApplication.upsert({
      where: { id: 'a1100000-0000-4000-8000-000000000001' },
      update: {
        userId: pendingApplicant.id,
        claimedApprovalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
        organizationClaim: null,
        experience: 'Đang chờ Admin đánh giá kinh nghiệm thực hành và đóng góp cộng đồng.',
        referenceLinks: ['https://example.com/seed/pending-contributor'],
        source: ContributorApplicationSource.PROFILE,
        status: ContributorApplicationStatus.PENDING,
        approvalBasis: null,
        reviewEvidence: Prisma.DbNull,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
        reapplyEligibleAt: null,
      },
      create: {
        id: 'a1100000-0000-4000-8000-000000000001',
        userId: pendingApplicant.id,
        claimedApprovalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
        organizationClaim: null,
        experience: 'Đang chờ Admin đánh giá kinh nghiệm thực hành và đóng góp cộng đồng.',
        referenceLinks: ['https://example.com/seed/pending-contributor'],
        source: ContributorApplicationSource.PROFILE,
        status: ContributorApplicationStatus.PENDING,
      },
    }),
    prisma.contributorApplication.upsert({
      where: { id: 'a1100000-0000-4000-8000-000000000002' },
      update: {
        userId: rejectedApplicant.id,
        claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        organizationClaim: 'Demo rejected organization claim',
        experience: 'Hồ sơ demo thiếu căn cứ chuyên môn để kiểm tra trạng thái bị từ chối.',
        referenceLinks: [],
        source: ContributorApplicationSource.PROFILE,
        status: ContributorApplicationStatus.REJECTED,
        approvalBasis: null,
        reviewEvidence: Prisma.DbNull,
        reviewNote: 'Cần bổ sung mô tả kinh nghiệm và nguồn tham khảo trước khi nộp lại.',
        reviewedById: admin.id,
        reviewedAt: new Date('2026-09-15T05:30:00.000Z'),
        reapplyEligibleAt: new Date('2026-10-15T05:30:00.000Z'),
      },
      create: {
        id: 'a1100000-0000-4000-8000-000000000002',
        userId: rejectedApplicant.id,
        claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        organizationClaim: 'Demo rejected organization claim',
        experience: 'Hồ sơ demo thiếu căn cứ chuyên môn để kiểm tra trạng thái bị từ chối.',
        referenceLinks: [],
        source: ContributorApplicationSource.PROFILE,
        status: ContributorApplicationStatus.REJECTED,
        reviewNote: 'Cần bổ sung mô tả kinh nghiệm và nguồn tham khảo trước khi nộp lại.',
        reviewedById: admin.id,
        reviewedAt: new Date('2026-09-15T05:30:00.000Z'),
        reapplyEligibleAt: new Date('2026-10-15T05:30:00.000Z'),
      },
    }),
  ]);
  await prisma.contributorDecision.deleteMany({
    where: {
      applicationId: 'a1100000-0000-4000-8000-000000000002',
      decision: ContributorDecisionType.REJECTED,
    },
  });
  await prisma.contributorDecision.create({
    data: {
      userId: rejectedApplicant.id,
      applicationId: 'a1100000-0000-4000-8000-000000000002',
      actorId: admin.id,
      decision: ContributorDecisionType.REJECTED,
      reason: 'Cần bổ sung mô tả kinh nghiệm và nguồn tham khảo trước khi nộp lại.',
      createdAt: new Date('2026-09-15T05:30:00.000Z'),
    },
  });

  await prisma.category.upsert({
    where: { id: 'a1200000-0000-4000-8000-000000000001' },
    update: {
      name: 'Chủ đề đã lưu trữ',
      slug: 'chu-de-da-luu-tru-seed',
      type: CategoryType.CONTENT_TOPIC,
      status: CatalogStatus.ARCHIVED,
      sortOrder: 999,
    },
    create: {
      id: 'a1200000-0000-4000-8000-000000000001',
      name: 'Chủ đề đã lưu trữ',
      slug: 'chu-de-da-luu-tru-seed',
      type: CategoryType.CONTENT_TOPIC,
      status: CatalogStatus.ARCHIVED,
      sortOrder: 999,
    },
  });
  const archivedIngredient = await prisma.ingredient.upsert({
    where: { normalizedName: 'nguyen lieu luu tru seed' },
    update: {
      canonicalName: 'Nguyên liệu lưu trữ seed',
      foodGroup: FoodGroup.OTHER,
      status: CatalogStatus.ARCHIVED,
    },
    create: {
      id: 'a1200000-0000-4000-8000-000000000002',
      canonicalName: 'Nguyên liệu lưu trữ seed',
      normalizedName: 'nguyen lieu luu tru seed',
      foodGroup: FoodGroup.OTHER,
      status: CatalogStatus.ARCHIVED,
    },
  });
  await prisma.$transaction([
    prisma.ingredientAlias.deleteMany({ where: { ingredientId: archivedIngredient.id } }),
    prisma.ingredientDietCompatibility.deleteMany({
      where: { ingredientId: archivedIngredient.id },
    }),
  ]);
  await prisma.ingredientAlias.create({
    data: {
      ingredientId: archivedIngredient.id,
      alias: 'archived seed ingredient',
      normalizedAlias: 'archived seed ingredient',
    },
  });
  await prisma.ingredientDietCompatibility.createMany({
    data: [
      { ingredientId: archivedIngredient.id, dietPattern: DietPattern.VEGAN, compatible: true },
      { ingredientId: archivedIngredient.id, dietPattern: DietPattern.LACTO_OVO, compatible: true },
    ],
  });

  const [topicCategory, recipeCategory, tofu, mushroom, milk, brownRice, broccoli] =
    await Promise.all([
      prisma.category.findFirstOrThrow({ where: { slug: 'dinh-duong' } }),
      prisma.category.findFirstOrThrow({ where: { slug: 'com-va-ngu-coc' } }),
      prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'dau hu' } }),
      prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'nam huong' } }),
      prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'sua bo' } }),
      prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'gao lut' } }),
      prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'bong cai xanh' } }),
    ]);

  const coverImage = {
    kind: MediaKind.COVER_IMAGE,
    provider: MediaProvider.CLOUDINARY,
    secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    publicId: 'seed/frontend-food-cover',
    mimeType: 'image/jpeg',
    width: 864,
    height: 576,
  } as const;
  await prisma.$transaction(async (transaction) => {
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000001',
      authorId: platformContributor.id,
      type: PostType.BLOG,
      slug: 'seed-bai-viet-cho-duyet',
      status: PostStatus.PENDING_REVIEW,
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000001',
          version: 1,
          status: PostRevisionStatus.PENDING_REVIEW,
          title: 'Bài viết sạch đang chờ duyệt',
          excerpt: 'Fixture cho hàng đợi duyệt nội dung không có AI flag.',
          body: 'Nội dung hướng dẫn phối hợp thực phẩm thực vật cân bằng và an toàn.',
          categoryId: topicCategory.id,
          tags: ['chờ duyệt', 'dinh dưỡng'],
        },
      ],
    });
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000002',
      authorId: platformContributor.id,
      type: PostType.BLOG,
      slug: 'seed-bai-viet-bi-tu-choi',
      status: PostStatus.REJECTED,
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000002',
          version: 1,
          status: PostRevisionStatus.REJECTED,
          title: 'Bài viết cần sửa nguồn tham khảo',
          excerpt: 'Fixture để Contributor xem lý do từ chối và tạo bản sửa.',
          body: 'Nội dung demo chưa trình bày đủ căn cứ cho một nhận định dinh dưỡng.',
          categoryId: topicCategory.id,
          tags: ['bị từ chối', 'cần chỉnh sửa'],
          reviewNote: 'Vui lòng bổ sung nguồn và diễn đạt lại nhận định dinh dưỡng.',
          reviewedById: admin.id,
        },
      ],
    });
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000003',
      authorId: platformContributor.id,
      type: PostType.RECIPE,
      slug: 'seed-cong-thuc-da-dang-co-ban-sua-cho-duyet',
      status: PostStatus.PUBLISHED,
      publishedRevisionId: 'a2100000-0000-4000-8000-000000000003',
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000003',
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Cơm gạo lứt đậu hũ nhiều rau',
          excerpt: 'Công thức đã xuất bản, dùng để kiểm tra bản sửa vẫn đang chờ duyệt.',
          body: 'Nấu gạo lứt, áp chảo đậu hũ và dùng cùng bông cải đã hấp chín.',
          categoryId: recipeCategory.id,
          tags: ['gạo lứt', 'đậu hũ', 'bữa chính'],
          media: coverImage,
          recipe: {
            servings: 2,
            prepTimeMinutes: 15,
            cookTimeMinutes: 30,
            difficulty: RecipeDifficulty.MEDIUM,
            calories: 510,
            proteinGrams: 24,
            carbsGrams: 65,
            fatGrams: 16,
            fiberGrams: 12,
            vitaminB12Mcg: 0,
            mealPlannerEligible: true,
            allergenCodes: ['SOY'],
            traditionWarnings: [],
            ingredients: [
              {
                ingredientId: brownRice.id,
                displayName: brownRice.canonicalName,
                normalizedName: brownRice.normalizedName,
                amount: 160,
                unit: 'g',
              },
              {
                ingredientId: tofu.id,
                displayName: tofu.canonicalName,
                normalizedName: tofu.normalizedName,
                amount: 180,
                unit: 'g',
              },
              {
                ingredientId: broccoli.id,
                displayName: broccoli.canonicalName,
                normalizedName: broccoli.normalizedName,
                amount: 140,
                unit: 'g',
              },
            ],
            vegan: true,
            lactoOvo: true,
          },
        },
        {
          id: 'a2100000-0000-4000-8000-000000000004',
          version: 2,
          status: PostRevisionStatus.PENDING_REVIEW,
          title: 'Cơm gạo lứt đậu hũ nhiều rau - bản cập nhật',
          excerpt: 'Bản cập nhật tăng lượng rau đang chờ Admin duyệt.',
          body: 'Nấu gạo lứt, áp chảo đậu hũ và tăng khẩu phần bông cải hấp chín.',
          categoryId: recipeCategory.id,
          tags: ['gạo lứt', 'đậu hũ', 'bản cập nhật'],
          media: coverImage,
          recipe: {
            servings: 2,
            prepTimeMinutes: 15,
            cookTimeMinutes: 30,
            difficulty: RecipeDifficulty.MEDIUM,
            calories: 525,
            proteinGrams: 25,
            carbsGrams: 66,
            fatGrams: 16,
            fiberGrams: 14,
            vitaminB12Mcg: 0,
            mealPlannerEligible: true,
            allergenCodes: ['SOY'],
            traditionWarnings: [],
            ingredients: [
              {
                ingredientId: brownRice.id,
                displayName: brownRice.canonicalName,
                normalizedName: brownRice.normalizedName,
                amount: 160,
                unit: 'g',
              },
              {
                ingredientId: tofu.id,
                displayName: tofu.canonicalName,
                normalizedName: tofu.normalizedName,
                amount: 180,
                unit: 'g',
              },
              {
                ingredientId: broccoli.id,
                displayName: broccoli.canonicalName,
                normalizedName: broccoli.normalizedName,
                amount: 200,
                unit: 'g',
              },
            ],
            vegan: true,
            lactoOvo: true,
          },
        },
      ],
    });
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000004',
      authorId: organizationContributor.id,
      type: PostType.RECIPE,
      slug: 'seed-cong-thuc-kho-nam-gao-lut',
      status: PostStatus.PUBLISHED,
      publishedRevisionId: 'a2100000-0000-4000-8000-000000000005',
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000005',
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Nấm om gạo lứt nhiều bước',
          excerpt: 'Công thức mức khó để frontend hiển thị đủ bộ lọc độ khó.',
          body: 'Ngâm gạo, sơ chế nấm, nấu nền rau củ rồi om chậm đến khi đạt độ sánh.',
          categoryId: recipeCategory.id,
          tags: ['nấm', 'mức khó', 'gạo lứt'],
          media: coverImage,
          recipe: {
            servings: 4,
            prepTimeMinutes: 35,
            cookTimeMinutes: 75,
            difficulty: RecipeDifficulty.HARD,
            calories: 490,
            proteinGrams: 18,
            carbsGrams: 72,
            fatGrams: 12,
            fiberGrams: 11,
            mealPlannerEligible: true,
            allergenCodes: [],
            traditionWarnings: [],
            ingredients: [
              {
                ingredientId: mushroom.id,
                displayName: mushroom.canonicalName,
                normalizedName: mushroom.normalizedName,
                amount: 220,
                unit: 'g',
              },
              {
                ingredientId: brownRice.id,
                displayName: brownRice.canonicalName,
                normalizedName: brownRice.normalizedName,
                amount: 180,
                unit: 'g',
              },
            ],
            vegan: true,
            lactoOvo: true,
          },
        },
      ],
    });
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000005',
      authorId: organizationContributor.id,
      type: PostType.RECIPE,
      slug: 'seed-cong-thuc-lacto-ovo-sua',
      status: PostStatus.PUBLISHED,
      publishedRevisionId: 'a2100000-0000-4000-8000-000000000006',
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000006',
          version: 1,
          status: PostRevisionStatus.PUBLISHED,
          title: 'Cháo gạo lứt sữa kiểu lacto-ovo',
          excerpt: 'Fixture không tương thích vegan để kiểm tra hard constraint và bộ lọc.',
          body: 'Nấu gạo lứt mềm rồi thêm sữa; công thức này không phù hợp với chế độ vegan.',
          categoryId: recipeCategory.id,
          tags: ['lacto ovo', 'sữa', 'cháo'],
          media: coverImage,
          recipe: {
            servings: 2,
            prepTimeMinutes: 10,
            cookTimeMinutes: 35,
            difficulty: RecipeDifficulty.EASY,
            calories: 460,
            proteinGrams: 17,
            carbsGrams: 70,
            fatGrams: 11,
            fiberGrams: 7,
            vitaminB12Mcg: 1.2,
            mealPlannerEligible: false,
            allergenCodes: ['MILK'],
            traditionWarnings: [],
            ingredients: [
              {
                ingredientId: brownRice.id,
                displayName: brownRice.canonicalName,
                normalizedName: brownRice.normalizedName,
                amount: 160,
                unit: 'g',
              },
              {
                ingredientId: milk.id,
                displayName: milk.canonicalName,
                normalizedName: milk.normalizedName,
                amount: 300,
                unit: 'ml',
              },
            ],
            vegan: false,
            lactoOvo: true,
          },
        },
      ],
    });
    await seedPost(transaction, {
      id: 'a2000000-0000-4000-8000-000000000006',
      authorId: organizationContributor.id,
      type: PostType.BLOG,
      slug: 'seed-bai-viet-flag-medium',
      status: PostStatus.FLAGGED,
      revisions: [
        {
          id: 'a2100000-0000-4000-8000-000000000007',
          version: 1,
          status: PostRevisionStatus.FLAGGED,
          title: 'Bài viết có tín hiệu cần kiểm tra',
          excerpt: 'Fixture AI flag mức MEDIUM trong moderation queue.',
          body: 'Một số cách diễn đạt tuyệt đối trong nội dung cần được Admin xem xét thủ công.',
          categoryId: topicCategory.id,
          tags: ['ai flag', 'moderation'],
        },
      ],
    });
  });

  const [communityRecipe, communityVideo] = await Promise.all([
    prisma.post.findUniqueOrThrow({ where: { slug: 'dau-hu-xao-bong-cai-demo' } }),
    prisma.post.findUniqueOrThrow({ where: { slug: 'video-bua-an-xanh-demo' } }),
  ]);

  await prisma.$transaction(async (transaction) => {
    await transaction.aiFlag.upsert({
      where: { id: 'a5000000-0000-4000-8000-000000000001' },
      update: {
        postRevisionId: 'a2100000-0000-4000-8000-000000000007',
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['ABSOLUTE_HEALTH_CLAIM'],
        riskScore: 0.62,
        riskLevel: AiFlagRiskLevel.MEDIUM,
        status: AiFlagStatus.OPEN,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        id: 'a5000000-0000-4000-8000-000000000001',
        postRevisionId: 'a2100000-0000-4000-8000-000000000007',
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['ABSOLUTE_HEALTH_CLAIM'],
        riskScore: 0.62,
        riskLevel: AiFlagRiskLevel.MEDIUM,
        status: AiFlagStatus.OPEN,
      },
    });
    await transaction.aiFlag.upsert({
      where: { id: 'a5000000-0000-4000-8000-000000000002' },
      update: {
        postRevisionId: 'a2100000-0000-4000-8000-000000000004',
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['LOW_CONFIDENCE_STYLE_SIGNAL'],
        riskScore: 0.18,
        riskLevel: AiFlagRiskLevel.LOW,
        status: AiFlagStatus.REVIEWED,
        reviewedById: admin.id,
        reviewedAt: new Date('2026-09-15T06:00:00.000Z'),
      },
      create: {
        id: 'a5000000-0000-4000-8000-000000000002',
        postRevisionId: 'a2100000-0000-4000-8000-000000000004',
        provider: 'RULE_ENGINE',
        model: 'deterministic-moderation',
        ruleVersion: 'moderation-rules-v1',
        reasonCodes: ['LOW_CONFIDENCE_STYLE_SIGNAL'],
        riskScore: 0.18,
        riskLevel: AiFlagRiskLevel.LOW,
        status: AiFlagStatus.REVIEWED,
        reviewedById: admin.id,
        reviewedAt: new Date('2026-09-15T06:00:00.000Z'),
      },
    });

    const comments = [
      {
        id: 'a3000000-0000-4000-8000-000000000001',
        authorId: reporterTwo.id,
        content: 'Bình luận demo đã bị ẩn bởi moderation.',
        status: CommentStatus.HIDDEN,
        hiddenAt: new Date('2026-09-15T06:10:00.000Z'),
        hiddenById: admin.id,
        hiddenReason: 'Fixture kiểm tra trạng thái bình luận bị ẩn.',
        deletedAt: null,
        parentId: null,
      },
      {
        id: 'a3000000-0000-4000-8000-000000000002',
        authorId: reporterThree.id,
        content: 'Bình luận gốc đã được người dùng xóa.',
        status: CommentStatus.DELETED,
        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,
        deletedAt: new Date('2026-09-15T06:20:00.000Z'),
        parentId: null,
      },
      {
        id: 'a3000000-0000-4000-8000-000000000003',
        authorId: pendingApplicant.id,
        content: 'Phản hồi vẫn hiển thị để kiểm tra cây bình luận khi bình luận cha đã xóa.',
        status: CommentStatus.VISIBLE,
        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,
        deletedAt: null,
        parentId: 'a3000000-0000-4000-8000-000000000002',
      },
    ] as const;
    for (const comment of comments) {
      await transaction.comment.upsert({
        where: { id: comment.id },
        update: { postId: communityRecipe.id, ...comment },
        create: { postId: communityRecipe.id, ...comment },
      });
    }

    for (const [index, user] of [pendingApplicant, rejectedApplicant, coldStartMember].entries()) {
      await transaction.postVote.upsert({
        where: { userId_postId: { userId: user.id, postId: communityRecipe.id } },
        update: {},
        create: { userId: user.id, postId: communityRecipe.id },
      });
      await transaction.postRating.upsert({
        where: { userId_postId: { userId: user.id, postId: communityRecipe.id } },
        update: { taste: 5 - index, difficulty: 2 + (index % 2), active: true },
        create: {
          userId: user.id,
          postId: communityRecipe.id,
          taste: 5 - index,
          difficulty: 2 + (index % 2),
        },
      });
      await transaction.postBookmark.upsert({
        where: { userId_postId: { userId: user.id, postId: communityVideo.id } },
        update: {},
        create: { userId: user.id, postId: communityVideo.id },
      });
    }
  });

  const openReporters = [member, pendingApplicant, rejectedApplicant, coldStartMember, reporterTwo];
  for (const [index, reporter] of openReporters.entries()) {
    const reportId =
      index === 0
        ? '80000000-0000-4000-8000-000000000004'
        : `a4000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
    await prisma.report.upsert({
      where: { id: reportId },
      update: {
        reporterId: reporter.id,
        targetType: ReportTargetType.POST,
        targetId: communityRecipe.id,
        reasonCode: index % 2 === 0 ? 'MISLEADING_INFORMATION' : 'OTHER',
        details: `Báo cáo seed ${String(index + 1)}/5 để tạo priority HIGH theo nghiệp vụ.`,
        status: ReportStatus.OPEN,
        priority: ModerationPriority.HIGH,
        activeKey: `${reporter.id}:${ReportTargetType.POST}:${communityRecipe.id}`,
        resolvedDecision: null,
        resolvedReason: null,
        resolvedById: null,
        resolvedAt: null,
      },
      create: {
        id: reportId,
        reporterId: reporter.id,
        targetType: ReportTargetType.POST,
        targetId: communityRecipe.id,
        reasonCode: index % 2 === 0 ? 'MISLEADING_INFORMATION' : 'OTHER',
        details: `Báo cáo seed ${String(index + 1)}/5 để tạo priority HIGH theo nghiệp vụ.`,
        status: ReportStatus.OPEN,
        priority: ModerationPriority.HIGH,
        activeKey: `${reporter.id}:${ReportTargetType.POST}:${communityRecipe.id}`,
      },
    });
  }
  await prisma.report.upsert({
    where: { id: 'a4000000-0000-4000-8000-000000000005' },
    update: {
      reporterId: reporterThree.id,
      targetType: ReportTargetType.POST,
      targetId: communityVideo.id,
      reasonCode: 'OTHER',
      details: 'Báo cáo seed đã xử lý để hiển thị lịch sử moderation.',
      status: ReportStatus.RESOLVED,
      priority: ModerationPriority.NORMAL,
      activeKey: null,
      resolvedDecision: ModerationDecision.NO_VIOLATION,
      resolvedReason: 'Admin đã kiểm tra và không phát hiện vi phạm.',
      resolvedById: admin.id,
      resolvedAt: new Date('2026-09-15T06:30:00.000Z'),
    },
    create: {
      id: 'a4000000-0000-4000-8000-000000000005',
      reporterId: reporterThree.id,
      targetType: ReportTargetType.POST,
      targetId: communityVideo.id,
      reasonCode: 'OTHER',
      details: 'Báo cáo seed đã xử lý để hiển thị lịch sử moderation.',
      status: ReportStatus.RESOLVED,
      priority: ModerationPriority.NORMAL,
      resolvedDecision: ModerationDecision.NO_VIOLATION,
      resolvedReason: 'Admin đã kiểm tra và không phát hiện vi phạm.',
      resolvedById: admin.id,
      resolvedAt: new Date('2026-09-15T06:30:00.000Z'),
    },
  });

  const moderationActions = [
    {
      id: 'a6000000-0000-4000-8000-000000000001',
      decision: ModerationDecision.REJECT,
      targetType: ModerationTargetType.POST,
      targetId: 'a2000000-0000-4000-8000-000000000002',
      reason: 'Yêu cầu bổ sung nguồn tham khảo trước khi xuất bản.',
      relatedReportIds: [],
      relatedAiFlagIds: [],
      metadata: { fixture: 'rejected-post' },
    },
    {
      id: 'a6000000-0000-4000-8000-000000000002',
      decision: ModerationDecision.NO_VIOLATION,
      targetType: ModerationTargetType.REPORT,
      targetId: 'a4000000-0000-4000-8000-000000000005',
      reason: 'Đã đối chiếu nội dung video và kết luận không vi phạm.',
      relatedReportIds: ['a4000000-0000-4000-8000-000000000005'],
      relatedAiFlagIds: [],
      metadata: { fixture: 'resolved-report' },
    },
    {
      id: 'a6000000-0000-4000-8000-000000000003',
      decision: ModerationDecision.APPROVE,
      targetType: ModerationTargetType.AI_FLAG,
      targetId: 'a5000000-0000-4000-8000-000000000002',
      reason: 'Tín hiệu mức thấp đã được kiểm tra thủ công.',
      relatedReportIds: [],
      relatedAiFlagIds: ['a5000000-0000-4000-8000-000000000002'],
      metadata: { fixture: 'reviewed-low-flag' },
    },
  ] as const;
  for (const action of moderationActions) {
    await prisma.moderationAction.upsert({
      where: { id: action.id },
      update: { actorId: admin.id, ...action },
      create: { actorId: admin.id, ...action },
    });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.personalizationPreference.upsert({
      where: { userId: coldStartMember.id },
      update: {
        enabled: true,
        consentVersion: 'behavior-personalization-v1',
        consentedAt: new Date('2026-09-15T07:00:00.000Z'),
        disabledAt: null,
      },
      create: {
        userId: coldStartMember.id,
        enabled: true,
        consentVersion: 'behavior-personalization-v1',
        consentedAt: new Date('2026-09-15T07:00:00.000Z'),
      },
    });
    await transaction.behaviorEvent.deleteMany({ where: { userId: coldStartMember.id } });
    await transaction.personalizationPreference.upsert({
      where: { userId: reporterTwo.id },
      update: {
        enabled: false,
        consentVersion: 'behavior-personalization-v1',
        consentedAt: null,
        disabledAt: new Date('2026-09-15T07:05:00.000Z'),
      },
      create: {
        userId: reporterTwo.id,
        enabled: false,
        consentVersion: 'behavior-personalization-v1',
        disabledAt: new Date('2026-09-15T07:05:00.000Z'),
      },
    });

    const behaviorFixtures = [
      {
        id: 'a8000000-0000-4000-8000-000000000001',
        type: BehaviorEventType.SEARCH,
        entityId: null,
        idempotencyKey: 'seed-member-search-balanced-meals',
        dedupeKey: 'seed-member-search-balanced-meals-bucket',
        payloadHash: 'a'.repeat(64),
        metadata: { query: 'bữa ăn cân bằng đậu hũ' },
      },
      {
        id: 'a8000000-0000-4000-8000-000000000002',
        type: BehaviorEventType.RATE,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-rate-community-recipe',
        dedupeKey: 'seed-member-rate-community-recipe-bucket',
        payloadHash: 'b'.repeat(64),
        metadata: { taste: 5, difficulty: 2 },
      },
      {
        id: 'a8000000-0000-4000-8000-000000000003',
        type: BehaviorEventType.ACCEPT_MEAL,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-accept-meal',
        dedupeKey: 'seed-member-accept-meal-bucket',
        payloadHash: 'c'.repeat(64),
        metadata: { source: 'seed-meal-plan' },
      },
      {
        id: 'a8000000-0000-4000-8000-000000000004',
        type: BehaviorEventType.SWAP_MEAL,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-swap-meal',
        dedupeKey: 'seed-member-swap-meal-bucket',
        payloadHash: 'd'.repeat(64),
        metadata: { source: 'seed-meal-plan' },
      },
      {
        id: 'a8000000-0000-4000-8000-000000000005',
        type: BehaviorEventType.REJECT_MEAL,
        entityId: communityRecipe.id,
        idempotencyKey: 'seed-member-reject-meal',
        dedupeKey: 'seed-member-reject-meal-bucket',
        payloadHash: 'e'.repeat(64),
        metadata: { source: 'seed-meal-plan' },
      },
    ] as const;
    for (const fixture of behaviorFixtures) {
      await transaction.behaviorEvent.upsert({
        where: { id: fixture.id },
        update: {
          userId: member.id,
          ...fixture,
          consentVersion: 'behavior-personalization-v1',
          occurredAt: new Date('2026-09-15T07:10:00.000Z'),
        },
        create: {
          userId: member.id,
          ...fixture,
          consentVersion: 'behavior-personalization-v1',
          occurredAt: new Date('2026-09-15T07:10:00.000Z'),
        },
      });
    }
  });

  const eligibleRecipes = (
    await prisma.post.findMany({
      where: {
        type: PostType.RECIPE,
        status: PostStatus.PUBLISHED,
        publishedRevisionId: { not: null },
      },
      include: {
        publishedRevision: {
          include: {
            recipeDetail: true,
            ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
            dietCompatibility: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    })
  ).filter(
    (post) =>
      post.publishedRevision?.recipeDetail?.mealPlannerEligible === true &&
      post.publishedRevision.recipeDetail.calories !== null &&
      post.publishedRevision.dietCompatibility.some(
        (compatibility) =>
          compatibility.dietPattern === DietPattern.VEGAN && compatibility.compatible,
      ),
  );
  if (eligibleRecipes.length === 0) throw new Error('Scenario seed requires one eligible recipe');

  const mealPlanId = 'a7000000-0000-4000-8000-000000000001';
  const existingMealPlan = await prisma.mealPlan.findUnique({ where: { id: mealPlanId } });
  const maximumVersion = await prisma.mealPlan.aggregate({
    where: { userId: member.id, weekStart: input.nextMonday },
    _max: { version: true },
  });
  const planVersion = existingMealPlan?.version ?? (maximumVersion._max.version ?? 0) + 1;
  const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER] as const;
  const targetByMealType = {
    [MealType.BREAKFAST]: 375,
    [MealType.LUNCH]: 600,
    [MealType.DINNER]: 525,
  } as const;
  const useCounts = new Map<string, number>();
  const slots = Array.from({ length: 21 }, (_, position) => {
    const mealType = mealTypes[position % 3]!;
    const targetCalories = targetByMealType[mealType];
    const candidates = eligibleRecipes
      .filter((recipe) => {
        const calories = recipe.publishedRevision!.recipeDetail!.calories!;
        return (
          Math.abs(calories - targetCalories) / targetCalories <= 0.2 &&
          (useCounts.get(recipe.id) ?? 0) < 2
        );
      })
      .sort((left, right) => {
        const leftUses = useCounts.get(left.id) ?? 0;
        const rightUses = useCounts.get(right.id) ?? 0;
        if ((leftUses === 0) !== (rightUses === 0)) return leftUses === 0 ? -1 : 1;
        const leftCalories = left.publishedRevision!.recipeDetail!.calories!;
        const rightCalories = right.publishedRevision!.recipeDetail!.calories!;
        return (
          Math.abs(leftCalories - targetCalories) - Math.abs(rightCalories - targetCalories) ||
          left.id.localeCompare(right.id)
        );
      });
    const recipe = candidates[0];
    if (!recipe) throw new Error(`Scenario seed cannot fill meal-plan slot ${String(position)}`);
    const revision = recipe.publishedRevision!;
    const calories = revision.recipeDetail!.calories!;
    const priorUses = useCounts.get(recipe.id) ?? 0;
    useCounts.set(recipe.id, priorUses + 1);
    const tolerancePercent = Number(
      ((Math.abs(calories - targetCalories) / targetCalories) * 100).toFixed(2),
    );
    return {
      id: `a7100000-0000-4000-8000-${String(position + 1).padStart(12, '0')}`,
      date: addDays(input.nextMonday, Math.floor(position / 3)),
      mealType,
      position,
      recipe,
      revision,
      calories,
      targetCalories,
      tolerancePercent,
      warningCodes: [
        ...(tolerancePercent > 15 ? ['CALORIE_TOLERANCE_WIDENED'] : []),
        ...(priorUses > 0 ? ['RECIPE_REPEATED'] : []),
      ],
    };
  });
  const shoppingGroups = new Map<
    string,
    { ingredientId: string; canonicalName: string; amount: number; unit: string; count: number }
  >();
  for (const slot of slots) {
    for (const ingredient of slot.revision.ingredients) {
      if (!ingredient.ingredientId || !ingredient.ingredient) continue;
      const key = `${ingredient.ingredientId}:${ingredient.unit}`;
      const current = shoppingGroups.get(key);
      shoppingGroups.set(key, {
        ingredientId: ingredient.ingredientId,
        canonicalName: ingredient.ingredient.canonicalName,
        amount: Number(((current?.amount ?? 0) + Number(ingredient.amount)).toFixed(3)),
        unit: ingredient.unit,
        count: (current?.count ?? 0) + 1,
      });
    }
  }
  const shoppingItems = [...shoppingGroups.values()].sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName),
  );
  const b12Values = slots
    .map((slot) => slot.revision.recipeDetail?.vitaminB12Mcg)
    .filter((value) => value !== null && value !== undefined)
    .map(Number);

  await prisma.$transaction(async (transaction) => {
    await transaction.mealPlan.upsert({
      where: { id: mealPlanId },
      update: {
        userId: member.id,
        weekStart: input.nextMonday,
        goal: MealGoal.MAINTAIN,
        targetCalories: 1500,
        version: planVersion,
        lockVersion: 1,
        supersedesMealPlanId: null,
        idempotencyKey: 'seed-frontend-meal-plan-v1',
        payloadHash: 'f'.repeat(64),
        seedHash: '1'.repeat(64),
        algorithmVersion: 'weekly-deterministic-v1',
        recommendationVersion: 'behavior-ranking-v1',
        constraintSnapshot: {
          fixture: true,
          timezone: 'Asia/Ho_Chi_Minh',
          dietPattern: DietPattern.VEGAN,
          calorieTolerance: { initialPercent: 15, maximumPercent: 20 },
          maxRecipeUses: 2,
        },
        warnings: ['CALORIE_TOLERANCE_WIDENED', 'RECIPE_REPEATED', 'MICRONUTRIENT_DATA_PARTIAL'],
        nutritionDataQuality: NutritionDataQuality.PARTIAL,
        micronutrientSummary: {
          vitaminB12Mcg:
            b12Values.length > 0
              ? Number(b12Values.reduce((sum, value) => sum + value, 0).toFixed(2))
              : null,
          recipesWithData: b12Values.length,
          filledRecipeCount: slots.length,
        },
        explanation:
          'Meal plan seed 21/21 bữa để frontend có dữ liệu ngay; vẫn có recipe lặp và cảnh báo vi chất để kiểm tra đầy đủ trạng thái hiển thị.',
        deletedAt: null,
      },
      create: {
        id: mealPlanId,
        userId: member.id,
        weekStart: input.nextMonday,
        goal: MealGoal.MAINTAIN,
        targetCalories: 1500,
        version: planVersion,
        lockVersion: 1,
        idempotencyKey: 'seed-frontend-meal-plan-v1',
        payloadHash: 'f'.repeat(64),
        seedHash: '1'.repeat(64),
        algorithmVersion: 'weekly-deterministic-v1',
        recommendationVersion: 'behavior-ranking-v1',
        constraintSnapshot: {
          fixture: true,
          timezone: 'Asia/Ho_Chi_Minh',
          dietPattern: DietPattern.VEGAN,
          calorieTolerance: { initialPercent: 15, maximumPercent: 20 },
          maxRecipeUses: 2,
        },
        warnings: ['CALORIE_TOLERANCE_WIDENED', 'RECIPE_REPEATED', 'MICRONUTRIENT_DATA_PARTIAL'],
        nutritionDataQuality: NutritionDataQuality.PARTIAL,
        micronutrientSummary: {
          vitaminB12Mcg:
            b12Values.length > 0
              ? Number(b12Values.reduce((sum, value) => sum + value, 0).toFixed(2))
              : null,
          recipesWithData: b12Values.length,
          filledRecipeCount: slots.length,
        },
        explanation:
          'Meal plan seed 21/21 bữa để frontend có dữ liệu ngay; vẫn có recipe lặp và cảnh báo vi chất để kiểm tra đầy đủ trạng thái hiển thị.',
      },
    });
    await transaction.mealPlanMutation.deleteMany({ where: { mealPlanId } });
    await transaction.mealPlanItem.deleteMany({ where: { mealPlanId } });
    await transaction.mealPlanShoppingItem.deleteMany({ where: { mealPlanId } });
    await transaction.mealPlanItem.createMany({
      data: slots.map((slot) => ({
        id: slot.id,
        mealPlanId,
        date: slot.date,
        mealType: slot.mealType,
        position: slot.position,
        status: MealSlotStatus.FILLED,
        recipeId: slot.recipe.id,
        recipeRevisionId: slot.revision.id,
        targetCalories: slot.targetCalories,
        calories: slot.calories,
        tolerancePercent: slot.tolerancePercent,
        reasonCodes: ['SEED_DISPLAY_FIXTURE'],
        warningCodes: slot.warningCodes,
      })),
    });
    await transaction.mealPlanShoppingItem.createMany({
      data: shoppingItems.map((item, index) => ({
        id: `a7200000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        mealPlanId,
        ingredientId: item.ingredientId,
        canonicalName: item.canonicalName,
        amount: item.amount,
        unit: item.unit,
        sourceItemCount: item.count,
      })),
    });
  });

  const mealProgramId = 'a8000000-0000-4000-8000-000000000001';
  await prisma.$transaction(async (transaction) => {
    await transaction.mealProgram.deleteMany({ where: { id: mealProgramId } });
    const totalCalories = slots.reduce((sum, slot) => sum + slot.calories, 0);
    const totalB12 = b12Values.length
      ? Number(b12Values.reduce((sum, value) => sum + value, 0).toFixed(2))
      : null;
    await transaction.mealProgram.create({
      data: {
        id: mealProgramId,
        userId: member.id,
        title: 'Chương trình thuần chay 2 tuần mẫu',
        goal: MealGoal.MAINTAIN,
        startDate: input.nextMonday,
        timezone: 'Asia/Ho_Chi_Minh',
        horizonWeeks: 2,
        status: MealProgramStatus.PARTIAL,
        idempotencyKey: 'seed-frontend-meal-program-v1',
        payloadHash: '8'.repeat(64),
        generationParameters: {
          fixture: true,
          algorithmVersion: 'multi-week-program-v1',
          alternativesPerWeek: 1,
          limits: {
            minWeeks: 2,
            maxWeeks: 12,
            maxAlternativesPerWeek: 3,
            maxRegenerationsPerWeek: 2,
          },
        },
        failureSummary: [
          { weekIndex: 1, failure: { code: 'SEED_PARTIAL_WEEK', message: 'Fixture for retry UI' } },
        ],
        weeks: {
          create: [
            {
              id: 'a8100000-0000-4000-8000-000000000001',
              weekIndex: 0,
              weekStart: input.nextMonday,
              status: MealProgramWeekStatus.READY,
              selectedAlternativeRank: 0,
              projectionStatus: MealProgramProjectionStatus.CURRENT,
              alternatives: {
                create: {
                  id: 'a8200000-0000-4000-8000-000000000001',
                  mealPlanId,
                  rank: 0,
                  seed: 'seed-meal-program-week-0',
                  snapshot: {
                    id: mealPlanId,
                    weekStart: input.nextMonday.toISOString().slice(0, 10),
                    goal: MealGoal.MAINTAIN,
                    items: slots.map((slot) => ({
                      id: slot.id,
                      calories: slot.calories,
                      recipe: { id: slot.recipe.id, title: slot.revision.title },
                    })),
                    micronutrientSummary: { vitaminB12Mcg: totalB12 },
                    analysis: null,
                  },
                },
              },
            },
            {
              weekIndex: 1,
              weekStart: addDays(input.nextMonday, 7),
              status: MealProgramWeekStatus.FAILED,
              projectionStatus: MealProgramProjectionStatus.CURRENT,
              failure: { code: 'SEED_PARTIAL_WEEK', message: 'Fixture for retry UI' },
            },
          ],
        },
        analyses: {
          create: {
            version: 1,
            status: MealProgramAnalysisStatus.CURRENT,
            inputFingerprint: '9'.repeat(64),
            warnings: [{ code: 'PARTIAL_HORIZON', severity: 'INFO', incompleteWeekIndexes: [1] }],
            nutritionSummary: {
              horizonWeeks: 2,
              analyzedWeeks: 1,
              totalCalories,
              averageDailyCalories: Number((totalCalories / 7).toFixed(2)),
              totalVitaminB12Mcg: totalB12,
              averageWeeklyVitaminB12Mcg: totalB12,
              incompleteWeekIndexes: [1],
            },
            weeklyAnalyses: [
              {
                weekIndex: 0,
                mealPlanId,
                mealAnalysisId: null,
                version: null,
                status: null,
                warningCount: 0,
              },
            ],
          },
        },
      },
    });
  });
}
