import {
  ActivityLevel,
  DietRuleSource,
  HealthSex,
  PracticeSchedule,
  type DietRuleDefinition,
  type HealthProfile,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import { toPublicUser } from '../auth/auth.service.js';
import type {
  DietPreferenceOutput,
  DietRulePreviewOutput,
  DietRuleSelectionInput,
  HealthProfileInput,
  HealthProfileOutput,
  ProfileOutput,
  SaveDietPreferencesInput,
  UpdateBasicProfileInput,
  UpdateDietScheduleInput,
} from './profile.schemas.js';
import type {
  NormalizedIngredientExclusion,
  PreferenceRuleRecord,
  ProfileRecord,
  ProfileRepository,
} from './profile.repository.js';

const TIMEZONE = 'Asia/Ho_Chi_Minh' as const;

const activityFactors: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
  [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
  [ActivityLevel.VERY_ACTIVE]: 1.725,
  [ActivityLevel.EXTRA_ACTIVE]: 1.9,
};

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function rulePreview(definition: DietRuleDefinition): DietRulePreviewOutput {
  return {
    id: definition.id,
    code: definition.code,
    label: definition.label,
    description: definition.description,
    defaultEnabled: definition.defaultEnabled,
    hardConstraint: definition.hardConstraint,
    source: definition.source,
    version: definition.ruleSetVersion,
  };
}

function healthOutput(profile: HealthProfile): HealthProfileOutput {
  return {
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.weightKg),
    age: profile.age,
    sex: profile.sex,
    activityLevel: profile.activityLevel,
    bmi: Number(profile.bmi),
    bmr: Number(profile.bmr),
    tdee: Number(profile.tdee),
    dataSource: profile.dataSource,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function savedRule(rule: PreferenceRuleRecord) {
  return { ...rulePreview(rule.ruleDefinition), enabled: rule.enabled };
}

function dietPreferenceOutput(
  profile: ProfileRecord,
  latestRuleSetVersion: number | null,
): DietPreferenceOutput | null {
  const preference = profile.dietPreference;
  if (!preference) return null;

  const rules = profile.dietPreferenceRules.map(savedRule);
  const dates = profile.dietScheduleDates.map((scheduleDate) => dateOnly(scheduleDate.date));
  const enabledDietPatternRules = rules.filter(
    (rule) => rule.source === DietRuleSource.DIET_PATTERN && rule.enabled,
  );
  const enabledTraditionRules = rules.filter(
    (rule) => rule.source === DietRuleSource.TRADITION && rule.enabled,
  );

  return {
    dietPattern: preference.dietPattern,
    practiceSchedule: preference.practiceSchedule,
    tradition: preference.tradition,
    ruleSetVersion: preference.ruleSetVersion,
    confirmedAt: preference.confirmedAt.toISOString(),
    requiresRuleReview:
      latestRuleSetVersion !== null && latestRuleSetVersion !== preference.ruleSetVersion,
    rules,
    schedule: { timezone: TIMEZONE, dates },
    allergies: profile.allergies.map((allergy) => ({
      id: allergy.id,
      allergenCode: allergy.allergenCode,
      label: allergy.label,
      severity: allergy.severity,
      active: allergy.active,
    })),
    ingredientExclusions: profile.ingredientExclusions.map((exclusion) => ({
      id: exclusion.id,
      ingredientId: exclusion.ingredientId,
      ingredientName: exclusion.ingredientName,
      normalizedName: exclusion.normalizedName,
      reason: exclusion.reason,
      active: exclusion.active,
    })),
    effectiveConstraints: {
      always: [
        ...profile.allergies.map((allergy) => ({
          priority: 1,
          source: 'ALLERGY' as const,
          code: allergy.allergenCode,
          label: allergy.label ?? allergy.allergenCode,
          hardConstraint: true as const,
        })),
        ...profile.ingredientExclusions.map((exclusion) => ({
          priority: 2,
          source: 'INGREDIENT_EXCLUSION' as const,
          code: exclusion.normalizedName,
          label: exclusion.ingredientName,
          hardConstraint: true as const,
        })),
        ...enabledDietPatternRules.map((rule) => ({
          priority: 3,
          source: 'DIET_PATTERN' as const,
          code: rule.code,
          label: rule.label,
          hardConstraint: true as const,
        })),
      ],
      scheduledTradition: {
        practiceSchedule: preference.practiceSchedule,
        timezone: TIMEZONE,
        dates,
        rules: enabledTraditionRules,
      },
    },
  };
}

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileOutput> {
    const [profile, latestRuleSetVersion] = await Promise.all([
      this.repository.findProfile(userId),
      this.repository.latestRuleSetVersion(),
    ]);
    if (!profile) {
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    return {
      ...toPublicUser(profile, profile.applications[0] ?? null, profile.contributorProfile),
      healthProfile: profile.healthProfile ? healthOutput(profile.healthProfile) : null,
      dietPreference: dietPreferenceOutput(profile, latestRuleSetVersion),
    };
  }

  async updateBasicProfile(userId: string, input: UpdateBasicProfileInput): Promise<ProfileOutput> {
    await this.repository.updateBasicProfile(userId, input);
    return this.getProfile(userId);
  }

  async updateHealthProfile(
    userId: string,
    input: HealthProfileInput,
  ): Promise<HealthProfileOutput> {
    const heightMeters = input.heightCm / 100;
    const bmi = roundToTwo(input.weightKg / (heightMeters * heightMeters));
    const sexAdjustment = input.sex === HealthSex.MALE ? 5 : -161;
    const rawBmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexAdjustment;
    const bmr = roundToTwo(rawBmr);
    const tdee = roundToTwo(rawBmr * activityFactors[input.activityLevel]);
    const profile = await this.repository.upsertHealthProfile(userId, input, { bmi, bmr, tdee });
    return healthOutput(profile);
  }

  async previewDietRules(selection: DietRuleSelectionInput): Promise<{
    ruleSetVersion: number;
    selection: DietRuleSelectionInput;
    rules: DietRulePreviewOutput[];
  }> {
    const ruleSetVersion = await this.requireLatestRuleSetVersion();
    const definitions = await this.repository.findRuleDefinitions(selection, ruleSetVersion);
    if (!definitions.length) throw this.rulesUnavailableError();
    return { ruleSetVersion, selection, rules: definitions.map(rulePreview) };
  }

  async saveDietPreferences(
    userId: string,
    input: SaveDietPreferencesInput,
  ): Promise<DietPreferenceOutput> {
    if (input.practiceSchedule === PracticeSchedule.PERIODIC && !input.scheduleDates?.length) {
      throw new AppError({
        statusCode: 409,
        code: 'DIET_SCHEDULE_REQUIRED',
        message: 'Cần chọn ít nhất một ngày cho lịch PERIODIC',
      });
    }
    if (input.practiceSchedule === PracticeSchedule.PERMANENT && input.scheduleDates?.length) {
      throw new AppError({
        statusCode: 400,
        code: 'DIET_SCHEDULE_NOT_APPLICABLE',
        message: 'Lịch PERMANENT không nhận danh sách ngày',
      });
    }

    const latestRuleSetVersion = await this.requireLatestRuleSetVersion();
    if (input.ruleSetVersion !== latestRuleSetVersion) {
      throw new AppError({
        statusCode: 409,
        code: 'DIET_RULE_RECONFIRMATION_REQUIRED',
        message: 'Bộ quy tắc đã thay đổi, vui lòng xem và xác nhận lại',
      });
    }

    const definitions = await this.repository.findRuleDefinitions(input, input.ruleSetVersion);
    this.validateSelectedRules(input, definitions);
    const exclusions = await this.normalizeExclusions(input);
    await this.repository.saveDietPreferences(userId, input, definitions, exclusions, new Date());
    const profile = await this.repository.findProfile(userId);
    if (!profile) throw this.profileNotFoundError();
    const preference = dietPreferenceOutput(profile, latestRuleSetVersion);
    if (!preference) throw this.profileNotFoundError();
    return preference;
  }

  async updateDietSchedule(
    userId: string,
    input: UpdateDietScheduleInput,
  ): Promise<{ practiceSchedule: PracticeSchedule; timezone: typeof TIMEZONE; dates: string[] }> {
    const profile = await this.repository.findProfile(userId);
    if (!profile?.dietPreference) {
      throw new AppError({
        statusCode: 409,
        code: 'DIET_PREFERENCES_REQUIRED',
        message: 'Cần lưu lựa chọn chế độ ăn trước khi cập nhật lịch',
      });
    }
    if (profile.dietPreference.practiceSchedule !== PracticeSchedule.PERIODIC) {
      throw new AppError({
        statusCode: 409,
        code: 'DIET_SCHEDULE_NOT_APPLICABLE',
        message: 'Lịch ngày chỉ áp dụng cho chế độ PERIODIC',
      });
    }
    if (!input.dates.length) {
      throw new AppError({
        statusCode: 409,
        code: 'DIET_SCHEDULE_REQUIRED',
        message: 'Cần chọn ít nhất một ngày cho lịch PERIODIC',
      });
    }
    await this.repository.replaceDietSchedule(userId, input.dates);
    return {
      practiceSchedule: PracticeSchedule.PERIODIC,
      timezone: TIMEZONE,
      dates: [...input.dates].sort(),
    };
  }

  private async requireLatestRuleSetVersion(): Promise<number> {
    const version = await this.repository.latestRuleSetVersion();
    if (version === null) throw this.rulesUnavailableError();
    return version;
  }

  private validateSelectedRules(
    input: SaveDietPreferencesInput,
    definitions: DietRuleDefinition[],
  ): void {
    const expectedIds = new Set(definitions.map((definition) => definition.id));
    const selectedIds = new Set(input.rules.map((selection) => selection.ruleDefinitionId));
    if (
      expectedIds.size !== selectedIds.size ||
      [...expectedIds].some((id) => !selectedIds.has(id))
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_DIET_RULE_SELECTION',
        message: 'Danh sách rule không thuộc preview hoặc không đầy đủ',
      });
    }

    const selectedById = new Map(
      input.rules.map((selection) => [selection.ruleDefinitionId, selection.enabled]),
    );
    if (
      definitions.some(
        (definition) =>
          definition.source === DietRuleSource.DIET_PATTERN && !selectedById.get(definition.id),
      )
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'DIET_RULE_REQUIRED',
        message: 'Không thể tắt hard constraint của diet pattern',
      });
    }
  }

  private async normalizeExclusions(
    input: SaveDietPreferencesInput,
  ): Promise<NormalizedIngredientExclusion[]> {
    const canonicalIds = input.ingredientExclusions.flatMap((exclusion) =>
      exclusion.ingredientId ? [exclusion.ingredientId] : [],
    );
    const ingredients = await this.repository.findActiveIngredients(canonicalIds);
    if (new Set(canonicalIds).size !== ingredients.length) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_INGREDIENT_EXCLUSIONS',
        message: 'Canonical ingredient không tồn tại hoặc đã archive',
      });
    }
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const exclusions = input.ingredientExclusions.map((exclusion) => {
      const canonical = exclusion.ingredientId
        ? ingredientById.get(exclusion.ingredientId)
        : undefined;
      return {
        ...(canonical ? { ingredientId: canonical.id } : {}),
        ingredientName: canonical?.canonicalName ?? exclusion.ingredientName,
        normalizedName:
          canonical?.normalizedName ?? normalizeVietnameseText(exclusion.ingredientName),
        ...(exclusion.reason ? { reason: exclusion.reason } : {}),
      };
    });
    if (
      exclusions.some((exclusion) => !exclusion.normalizedName) ||
      new Set(exclusions.map((exclusion) => exclusion.normalizedName)).size !== exclusions.length
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_INGREDIENT_EXCLUSIONS',
        message: 'Danh sách nguyên liệu loại trừ không hợp lệ hoặc bị trùng',
      });
    }
    return exclusions;
  }

  private rulesUnavailableError(): AppError {
    return new AppError({
      statusCode: 503,
      code: 'DIET_RULES_UNAVAILABLE',
      message: 'Bộ quy tắc chế độ ăn chưa sẵn sàng',
    });
  }

  private profileNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Không tìm thấy người dùng',
    });
  }
}
