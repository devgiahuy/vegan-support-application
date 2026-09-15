import {
  ContributorApplicationStatus,
  DietRuleSource,
  PracticeSchedule,
  Tradition,
  type DietRuleDefinition,
  type HealthProfile,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type {
  DietRuleSelectionInput,
  HealthProfileInput,
  SaveDietPreferencesInput,
  UpdateBasicProfileInput,
} from './profile.schemas.js';

const profileInclude = {
  applications: {
    where: { status: ContributorApplicationStatus.PENDING },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  healthProfile: true,
  dietPreference: true,
  dietPreferenceRules: {
    include: { ruleDefinition: true },
    orderBy: { createdAt: 'asc' },
  },
  dietScheduleDates: {
    where: { enabled: true },
    orderBy: { date: 'asc' },
  },
  allergies: {
    where: { active: true },
    orderBy: { allergenCode: 'asc' },
  },
  ingredientExclusions: {
    where: { active: true },
    orderBy: { normalizedName: 'asc' },
  },
} satisfies Prisma.UserInclude;

export type ProfileRecord = Prisma.UserGetPayload<{ include: typeof profileInclude }>;
export type PreferenceRuleRecord = ProfileRecord['dietPreferenceRules'][number];

interface CalculatedHealthMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
}

export interface NormalizedIngredientExclusion {
  ingredientId?: string;
  ingredientName: string;
  normalizedName: string;
  reason?: string;
}

function dateFromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findProfile(userId: string): Promise<ProfileRecord | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, include: profileInclude });
  }

  async updateBasicProfile(userId: string, input: UpdateBasicProfileInput): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    });
  }

  upsertHealthProfile(
    userId: string,
    input: HealthProfileInput,
    metrics: CalculatedHealthMetrics,
  ): Promise<HealthProfile> {
    const data = { ...input, ...metrics };
    return this.prisma.healthProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async latestRuleSetVersion(): Promise<number | null> {
    const aggregate = await this.prisma.dietRuleDefinition.aggregate({
      where: { active: true },
      _max: { ruleSetVersion: true },
    });
    return aggregate._max.ruleSetVersion;
  }

  findRuleDefinitions(
    selection: DietRuleSelectionInput,
    ruleSetVersion: number,
  ): Promise<DietRuleDefinition[]> {
    return this.prisma.dietRuleDefinition.findMany({
      where: {
        active: true,
        ruleSetVersion,
        OR: [
          { source: DietRuleSource.DIET_PATTERN, dietPattern: selection.dietPattern },
          ...(selection.tradition === Tradition.NONE
            ? []
            : [{ source: DietRuleSource.TRADITION, tradition: selection.tradition }]),
        ],
      },
      orderBy: [{ source: 'asc' }, { code: 'asc' }],
    });
  }

  findActiveIngredients(ids: string[]) {
    return this.prisma.ingredient.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, canonicalName: true, normalizedName: true },
    });
  }

  async saveDietPreferences(
    userId: string,
    input: SaveDietPreferencesInput,
    definitions: DietRuleDefinition[],
    exclusions: NormalizedIngredientExclusion[],
    confirmedAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.dietPreference.upsert({
        where: { userId },
        update: {
          dietPattern: input.dietPattern,
          practiceSchedule: input.practiceSchedule,
          tradition: input.tradition,
          ruleSetVersion: input.ruleSetVersion,
          confirmedAt,
        },
        create: {
          userId,
          dietPattern: input.dietPattern,
          practiceSchedule: input.practiceSchedule,
          tradition: input.tradition,
          ruleSetVersion: input.ruleSetVersion,
          confirmedAt,
        },
      });

      await transaction.dietPreferenceRule.deleteMany({ where: { userId } });
      const selectedById = new Map(
        input.rules.map((selection) => [selection.ruleDefinitionId, selection.enabled]),
      );
      await transaction.dietPreferenceRule.createMany({
        data: definitions.map((definition) => ({
          userId,
          ruleDefinitionId: definition.id,
          enabled: selectedById.get(definition.id) ?? definition.defaultEnabled,
          source: definition.source,
        })),
      });

      await transaction.dietScheduleDate.deleteMany({ where: { userId } });
      if (input.practiceSchedule === PracticeSchedule.PERIODIC && input.scheduleDates?.length) {
        await transaction.dietScheduleDate.createMany({
          data: input.scheduleDates.map((date) => ({ userId, date: dateFromDateOnly(date) })),
        });
      }

      await transaction.userAllergy.deleteMany({ where: { userId } });
      if (input.allergies.length) {
        await transaction.userAllergy.createMany({
          data: input.allergies.map((allergy) => ({
            userId,
            allergenCode: allergy.allergenCode,
            ...(allergy.label ? { label: allergy.label } : {}),
            ...(allergy.severity ? { severity: allergy.severity } : {}),
          })),
        });
      }

      await transaction.userIngredientExclusion.deleteMany({ where: { userId } });
      if (exclusions.length) {
        await transaction.userIngredientExclusion.createMany({
          data: exclusions.map((exclusion) => ({ userId, ...exclusion })),
        });
      }
    });
  }

  async replaceDietSchedule(userId: string, dates: string[]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.dietScheduleDate.deleteMany({ where: { userId } });
      await transaction.dietScheduleDate.createMany({
        data: dates.map((date) => ({ userId, date: dateFromDateOnly(date) })),
      });
    });
  }
}
