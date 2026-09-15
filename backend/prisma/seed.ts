import 'dotenv/config';
import {
  DietPattern,
  DietRuleSource,
  PrismaClient,
  Role,
  Tradition,
  UserStatus,
} from '@prisma/client';
import { z } from 'zod';
import { PasswordService } from '../src/modules/auth/password.service.js';

const prisma = new PrismaClient();
const passwordService = new PasswordService();
const dietRuleSetVersion = 1;

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
  console.info(
    `Seeded local Member/Admin accounts and diet rule set v${String(dietRuleSetVersion)}.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
