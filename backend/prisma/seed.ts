import 'dotenv/config';
import {
  CatalogStatus,
  CategoryType,
  DietPattern,
  DietRuleSource,
  FoodGroup,
  IngredientResolutionStatus,
  MediaKind,
  MediaProvider,
  PostRevisionStatus,
  PostStatus,
  PostType,
  PrismaClient,
  RecipeDifficulty,
  Role,
  Tradition,
  UserStatus,
} from '@prisma/client';
import { z } from 'zod';
import { PasswordService } from '../src/modules/auth/password.service.js';
import { normalizeVietnameseText } from '../src/modules/catalog/catalog.normalization.js';

const prisma = new PrismaClient();
const passwordService = new PasswordService();
const dietRuleSetVersion = 1;

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
  const [recipeCategory, topicCategory, tofu, broccoli] = await Promise.all([
    prisma.category.findFirstOrThrow({
      where: { type: CategoryType.FOOD_TYPE, slug: 'com-va-ngu-coc', status: CatalogStatus.ACTIVE },
    }),
    prisma.category.findFirstOrThrow({
      where: { type: CategoryType.CONTENT_TOPIC, slug: 'dinh-duong', status: CatalogStatus.ACTIVE },
    }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'dau hu' } }),
    prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'bong cai xanh' } }),
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
          excerpt: 'Món xào giàu đạm thực vật cho bữa ăn nhanh.',
          body: 'Ép ráo đậu hũ, áp chảo vàng rồi xào nhanh cùng bông cải và sốt gia vị.',
          categories: { create: [{ categoryId: recipeCategory.id }] },
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
          excerpt: 'Kết hợp nhiều nhóm thực phẩm để xây dựng bữa ăn cân bằng.',
          body: 'Các loại đậu, hạt và ngũ cốc cung cấp nguồn đạm thực vật đa dạng. Khi xây dựng thực đơn, hãy kết hợp nhiều nhóm thực phẩm, theo dõi khẩu phần và ưu tiên nhu cầu sức khỏe cá nhân thay vì dựa vào một nguyên liệu duy nhất.',
          categories: { create: [{ categoryId: topicCategory.id }] },
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
          excerpt: 'Demo contract video YouTube cho local development.',
          body: 'Video minh họa quy trình chuẩn bị nguyên liệu và sắp xếp một bữa ăn thực vật.',
          categories: { create: [{ categoryId: topicCategory.id }] },
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
  console.info(
    `Seeded local accounts, diet rules v${String(dietRuleSetVersion)}, catalog, and demo content.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
