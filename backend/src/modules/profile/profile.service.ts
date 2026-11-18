import { ActivityLevel, HealthSex, type HealthProfile } from '@prisma/client';
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
} from './profile.schemas.js';
import type {
  NormalizedIngredientExclusion,
  ProfileRecord,
  ProfileRepository,
} from './profile.repository.js';

const POLICY_VERSION = 1;
const FOOD_OPTIONS = [
  { code: 'EGG', label: 'Trứng', field: 'allowEggs' },
  { code: 'DAIRY', label: 'Sữa và sản phẩm từ sữa', field: 'allowDairy' },
  { code: 'HONEY', label: 'Mật ong', field: 'allowHoney' },
  {
    code: 'FIVE_PUNGENT',
    label: 'Ngũ vị tân (hành, hẹ, tỏi, kiệu, hưng cừ)',
    field: 'allowFivePungent',
  },
] as const;

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

export function dietPreferenceOutput(profile: ProfileRecord): DietPreferenceOutput | null {
  const p = profile.dietPreference;
  if (!p) return null;
  return {
    allowEggs: p.allowEggs,
    allowDairy: p.allowDairy,
    allowHoney: p.allowHoney,
    allowFivePungent: p.allowFivePungent,
    policyVersion: p.policyVersion,
    dietaryRevision: p.dietaryRevision,
    confirmedAt: p.confirmedAt.toISOString(),
    requiresRuleReview: p.policyVersion !== POLICY_VERSION,
    allergies: profile.allergies.map((a) => ({
      id: a.id,
      allergenCode: a.allergenCode,
      label: a.label,
      severity: a.severity,
      active: a.active,
    })),
    ingredientAllergies: profile.ingredientAllergies.map((a) => ({
      ingredientId: a.ingredientId,
      ingredientName: a.ingredient.canonicalName,
      severity: a.severity,
      ingredientActive: a.ingredient.status === 'ACTIVE',
    })),
    ingredientExclusions: profile.ingredientExclusions.map((e) => ({
      id: e.id,
      ingredientId: e.ingredientId,
      ingredientName: e.ingredientName,
      normalizedName: e.normalizedName,
      reason: e.reason,
      active: e.active,
    })),
    effectiveConstraints: {
      always: [
        ...profile.allergies.map((a) => ({
          priority: 1,
          source: 'ALLERGY' as const,
          code: a.allergenCode,
          label: a.label ?? a.allergenCode,
          hardConstraint: true as const,
        })),
        ...profile.ingredientAllergies.map((a) => ({
          priority: 1,
          source: 'ALLERGY' as const,
          code: a.ingredientId,
          label: a.ingredient.canonicalName,
          hardConstraint: true as const,
        })),
        ...profile.ingredientExclusions.map((e) => ({
          priority: 2,
          source: 'INGREDIENT_EXCLUSION' as const,
          code: e.normalizedName,
          label: e.ingredientName,
          hardConstraint: true as const,
        })),
        {
          priority: 3,
          source: 'FOOD_GROUP' as const,
          code: 'MEAT_FISH',
          label: 'Kiêng thịt, cá và thành phần có nguồn từ thịt/cá',
          hardConstraint: true as const,
        },
        ...FOOD_OPTIONS.filter((o) => !p[o.field]).map((o) => ({
          priority: 3,
          source: 'FOOD_GROUP' as const,
          code: o.code,
          label: 'Kiêng ' + o.label,
          hardConstraint: true as const,
        })),
      ],
    },
  };
}

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileOutput> {
    const profile = await this.repository.findProfile(userId);
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
      dietPreference: dietPreferenceOutput(profile),
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
    policyVersion: number;
    selection: DietRuleSelectionInput;
    constraints: DietRulePreviewOutput[];
  }> {
    return Promise.resolve({
      policyVersion: POLICY_VERSION,
      selection,
      constraints: [
        { code: 'MEAT_FISH', label: 'Thịt, cá và thành phần từ thịt/cá', allowed: false },
        ...FOOD_OPTIONS.map((o) => ({ code: o.code, label: o.label, allowed: selection[o.field] })),
      ],
    });
  }

  async validateDietPreferences(
    userId: string,
    input: SaveDietPreferencesInput,
  ): Promise<{ input: SaveDietPreferencesInput; exclusions: NormalizedIngredientExclusion[] }> {
    if (input.policyVersion !== POLICY_VERSION)
      throw new AppError({
        statusCode: 409,
        code: 'DIET_RULE_RECONFIRMATION_REQUIRED',
        message: 'Chính sách đã thay đổi. Vui lòng xem lại.',
      });
    const profile = await this.repository.findProfile(userId);
    if (!profile) throw this.profileNotFoundError();
    if ((profile.dietPreference?.dietaryRevision ?? 0) !== input.expectedDietaryRevision)
      throw new AppError({
        statusCode: 409,
        code: 'DIET_PREFERENCES_CONFLICT',
        message: 'Thiết lập đã thay đổi. Vui lòng tải lại.',
        fields: { currentRevision: [String(profile.dietPreference?.dietaryRevision ?? 0)] },
      });
    const ingredientIds = input.ingredientAllergies?.map((entry) => entry.ingredientId) ?? [];
    const activeIngredients = await this.repository.findActiveIngredients(ingredientIds);
    const validIds = new Set(activeIngredients.map((entry) => entry.id));
    const invalidIngredientIds = ingredientIds.filter((id) => !validIds.has(id));
    if (invalidIngredientIds.length)
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_INGREDIENT_ALLERGIES',
        message: 'Vui lòng chọn nguyên liệu dị ứng đang hoạt động từ danh mục chuẩn.',
        fields: { ingredientIds: invalidIngredientIds },
      });
    const allergens = await this.repository.findActiveAllergens(
      input.allergies.map((entry) => entry.allergenCode),
    );
    const labels = new Map(allergens.map((entry) => [entry.code, entry.label]));
    const invalid = input.allergies.filter((entry) => !labels.has(entry.allergenCode));
    if (invalid.length)
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_ALLERGEN_SELECTION',
        message: 'Vui lòng chọn dị ứng từ danh mục thực phẩm được hỗ trợ.',
        fields: { invalidAllergenCodes: invalid.map((entry) => entry.allergenCode) },
      });
    input = {
      ...input,
      allergies: input.allergies.map((entry) => ({
        ...entry,
        label: labels.get(entry.allergenCode)!,
      })),
    };
    return { input, exclusions: await this.normalizeExclusions(input) };
  }

  async saveDietPreferences(
    userId: string,
    input: SaveDietPreferencesInput,
  ): Promise<DietPreferenceOutput> {
    const validated = await this.validateDietPreferences(userId, input);
    await this.repository.saveDietPreferences(
      userId,
      validated.input,
      validated.exclusions,
      new Date(),
    );
    const profile = await this.repository.findProfile(userId);
    if (!profile) throw this.profileNotFoundError();
    const preference = dietPreferenceOutput(profile);
    if (!preference) throw this.profileNotFoundError();
    return preference;
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

  private profileNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Không tìm thấy người dùng',
    });
  }
}
