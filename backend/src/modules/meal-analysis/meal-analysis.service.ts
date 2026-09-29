import { createHash } from 'node:crypto';
import {
  EvidenceGrade,
  FoodRuleSeverity,
  GuidelinePeriod,
  InteractionScope,
  MealAnalysisStatus,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  addMealMacroValues,
  emptyMealMacroValues,
  estimateMealMacroTargets,
  isMacroOverTarget,
} from '../../common/nutrition/meal-macros.js';
import type { AppConfig } from '../../config/env.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import {
  type AnalysisPlanRecord,
  type AnalysisProfileRecord,
  type MealAnalysisRecord,
  type MealAnalysisRepository,
} from './meal-analysis.repository.js';
import {
  MEAL_ANALYSIS_ALGORITHM_VERSION,
  type MealAnalysisInput,
  type MealAnalysisWarning,
} from './meal-analysis.schemas.js';

const DISCLAIMER =
  'Phân tích này chỉ nhằm mục đích giáo dục, phụ thuộc vào dữ liệu hiện có và không thay thế tư vấn y tế hoặc chẩn đoán.';

interface SelectedItem {
  item: AnalysisPlanRecord['items'][number];
  servings: number;
  name: string;
  nutrients: Array<{ code: string; unit: string; amount: number }>;
  ingredients: Array<{ id: string; name: string; grams: number | null }>;
  confidence: number;
}

interface AnalysisContext {
  plan: AnalysisPlanRecord;
  profile: AnalysisProfileRecord;
  selected: SelectedItem[];
  rules: Awaited<ReturnType<MealAnalysisRepository['findRules']>>;
  incomplete: string[];
  requestSnapshot: {
    expectedPlanVersion: number;
    items: Array<{ itemId: string; servings: number }>;
  };
  profileSnapshot: Prisma.InputJsonObject;
  ruleVersions: string[];
  fingerprint: string;
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function nutrientList(
  value: Prisma.JsonValue,
): Array<{ code: string; unit: string; amount: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    return typeof item.nutrientCode === 'string' &&
      typeof item.unit === 'string' &&
      typeof item.amount === 'number'
      ? [
          {
            code: item.nutrientCode === 'CARBOHYDRATE' ? 'CARBS' : item.nutrientCode,
            unit: item.unit,
            amount: item.amount,
          },
        ]
      : [];
  });
}

function applicabilityMatches(value: Prisma.JsonValue, profile: AnalysisProfileRecord): boolean {
  const applicability = asRecord(value);
  const age = profile.healthProfile?.age;
  const sex = profile.healthProfile?.sex;
  if (typeof applicability.minAge === 'number' && age !== undefined && age < applicability.minAge)
    return false;
  if (typeof applicability.maxAge === 'number' && age !== undefined && age > applicability.maxAge)
    return false;
  if (typeof applicability.sex === 'string' && sex && applicability.sex !== sex) return false;
  if (Array.isArray(applicability.sex) && sex && !applicability.sex.includes(sex)) return false;
  return true;
}

function warningConfidence(grade: EvidenceGrade): number {
  return {
    [EvidenceGrade.HIGH]: 0.95,
    [EvidenceGrade.MODERATE]: 0.8,
    [EvidenceGrade.LOW]: 0.6,
    [EvidenceGrade.INSUFFICIENT]: 0.35,
  }[grade];
}

function affectedItem(selected: SelectedItem) {
  return {
    itemId: selected.item.id,
    date: dateOnly(selected.item.date),
    mealType: selected.item.mealType,
    sourceType: selected.item.sourceType,
    name: selected.name,
    servings: selected.servings,
  };
}

function dedupeWarnings(warnings: MealAnalysisWarning[]): MealAnalysisWarning[] {
  const unique = new Map<string, MealAnalysisWarning>();
  for (const warning of warnings) {
    const key = [
      warning.code,
      warning.scope,
      warning.source.recordId,
      warning.affectedItems
        .map((item) => item.itemId)
        .sort()
        .join(','),
      warning.affectedIngredients
        .map((item) => item.ingredientId)
        .sort()
        .join(','),
    ].join(':');
    if (!unique.has(key)) unique.set(key, warning);
  }
  return [...unique.values()].sort((a, b) => {
    const rank = { HIGH: 0, CAUTION: 1, INFO: 2 } as const;
    return rank[a.severity] - rank[b.severity] || a.code.localeCompare(b.code);
  });
}

export class MealAnalysisService {
  constructor(
    private readonly repository: MealAnalysisRepository,
    private readonly config: AppConfig,
  ) {}

  async analyze(userId: string, mealPlanId: string, input: MealAnalysisInput) {
    const context = await this.loadContext(userId, mealPlanId, input);
    const warnings = dedupeWarnings([
      ...this.portionWarnings(context.selected),
      ...this.macroTargetWarnings(context),
      ...this.guidelineWarnings(context),
      ...this.interactionWarnings(context),
    ]);
    const baseConfidence = context.selected.length
      ? Math.min(...context.selected.map((item) => item.confidence))
      : 0.2;
    const confidence = Number(
      Math.max(0.2, baseConfidence - context.incomplete.length * 0.03).toFixed(4),
    );
    const estimatedNutrition = this.estimatedNutrition(context);
    const summary = {
      warningCount: warnings.length,
      highCount: warnings.filter((item) => item.severity === FoodRuleSeverity.HIGH).length,
      cautionCount: warnings.filter((item) => item.severity === FoodRuleSeverity.CAUTION).length,
      infoCount: warnings.filter((item) => item.severity === FoodRuleSeverity.INFO).length,
      selectedItemCount: context.selected.length,
      estimatedNutrition,
    };
    const saved = await this.repository.save({
      mealPlanId,
      algorithmVersion: MEAL_ANALYSIS_ALGORITHM_VERSION,
      inputFingerprint: context.fingerprint,
      requestSnapshot: context.requestSnapshot,
      profileSnapshot: context.profileSnapshot,
      ruleVersions: context.ruleVersions,
      warnings: warnings as unknown as Prisma.InputJsonArray,
      incompleteData: context.incomplete,
      summary: summary as unknown as Prisma.InputJsonValue,
      confidence,
      disclaimer: DISCLAIMER,
    });
    return this.output(saved);
  }

  async getCurrent(userId: string, mealPlanId: string) {
    const latest = await this.repository.findLatest(mealPlanId);
    if (!latest) throw this.notFound('Chưa có kết quả phân tích cho meal plan');
    const snapshot = asRecord(latest.requestSnapshot);
    const itemValues = Array.isArray(snapshot.items) ? snapshot.items : [];
    const items = itemValues.flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
      const value = entry as Record<string, unknown>;
      return typeof value.itemId === 'string' && typeof value.servings === 'number'
        ? [{ itemId: value.itemId, servings: value.servings }]
        : [];
    });
    const expectedPlanVersion =
      typeof snapshot.expectedPlanVersion === 'number' ? snapshot.expectedPlanVersion : 0;
    let context: AnalysisContext;
    try {
      context = await this.loadContext(userId, mealPlanId, { expectedPlanVersion, items });
    } catch (error) {
      if (
        error instanceof AppError &&
        error.code === 'MEAL_ANALYSIS_STALE' &&
        latest.status === MealAnalysisStatus.CURRENT
      ) {
        await this.repository.markStale(latest.id);
      }
      throw error;
    }
    if (
      latest.status !== MealAnalysisStatus.CURRENT ||
      latest.inputFingerprint !== context.fingerprint
    ) {
      if (latest.status === MealAnalysisStatus.CURRENT) await this.repository.markStale(latest.id);
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_ANALYSIS_STALE',
        message:
          'Meal plan, khẩu phần, recipe, nutrition, profile hoặc rule đã thay đổi; cần phân tích lại',
      });
    }
    return this.output(latest);
  }

  async analyzeDefault(userId: string, mealPlanId: string, expectedPlanVersion: number) {
    return this.analyze(userId, mealPlanId, { expectedPlanVersion });
  }

  private async loadContext(
    userId: string,
    mealPlanId: string,
    input: MealAnalysisInput,
  ): Promise<AnalysisContext> {
    const [plan, profile] = await Promise.all([
      this.repository.findOwnedPlan(userId, mealPlanId),
      this.repository.findProfile(userId),
    ]);
    if (!plan) throw this.notFound('Không tìm thấy meal plan');
    if (!profile) throw this.notFound('Không tìm thấy user profile');
    if (plan.lockVersion !== input.expectedPlanVersion) {
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_ANALYSIS_STALE',
        message: 'Meal plan version đã thay đổi; hãy refetch trước khi phân tích',
        fields: { currentVersion: [String(plan.lockVersion)] },
      });
    }
    const selectedRows = input.items?.length
      ? input.items.map((selection) => {
          const item = plan.items.find((candidate) => candidate.id === selection.itemId);
          if (!item) throw this.notFound('Meal plan item không thuộc meal plan');
          return { item, servings: selection.servings };
        })
      : plan.items
          .filter((item) => item.status === 'FILLED')
          .map((item) => ({ item, servings: Number(item.servings) }));
    if (selectedRows.some(({ item }) => item.status !== 'FILLED')) {
      throw new AppError({
        statusCode: 400,
        code: 'MEAL_ANALYSIS_ITEM_UNFILLED',
        message: 'Không thể phân tích slot chưa có món',
      });
    }
    const ingredientIds = [
      ...new Set(
        selectedRows.flatMap(({ item }) => [
          ...(item.recipeRevision?.ingredients.flatMap((entry) =>
            entry.ingredientId ? [entry.ingredientId] : [],
          ) ?? []),
          ...(item.customMeal?.ingredients.flatMap((entry) =>
            entry.ingredientId ? [entry.ingredientId] : [],
          ) ?? []),
        ]),
      ),
    ];
    const at = new Date();
    const [rules, profiles] = await Promise.all([
      this.repository.findRules(ingredientIds, at),
      this.repository.findConversions(ingredientIds, at),
    ]);
    const conversions = new Map<string, Array<{ unit: string; quantity: number; grams: number }>>();
    for (const foodProfile of profiles) {
      if (conversions.has(foodProfile.ingredientId)) continue;
      conversions.set(
        foodProfile.ingredientId,
        foodProfile.householdConversions.map((conversion) => ({
          unit: normalizeVietnameseText(conversion.unitSymbol ?? conversion.unitName),
          quantity: Number(conversion.quantity),
          grams: Number(conversion.grams),
        })),
      );
    }
    const incomplete: string[] = [];
    if (!selectedRows.length) incomplete.push('Meal plan chưa có item đã điền để phân tích.');
    const selected = selectedRows.map(({ item, servings }) =>
      this.selectedItem(item, servings, conversions, incomplete),
    );
    const requestSnapshot = {
      expectedPlanVersion: plan.lockVersion,
      items: selected.map((entry) => ({ itemId: entry.item.id, servings: entry.servings })),
    };
    const profileSnapshot: Prisma.InputJsonObject = {
      healthUpdatedAt: profile.healthProfile?.updatedAt.toISOString() ?? null,
      dietUpdatedAt: profile.dietPreference?.updatedAt.toISOString() ?? null,
      dietPattern: profile.dietPreference?.dietPattern ?? null,
      tradition: profile.dietPreference?.tradition ?? null,
      allergyCodes: profile.allergies.map((entry) => entry.allergenCode).sort(),
      exclusionIds: profile.ingredientExclusions
        .flatMap((entry) => (entry.ingredientId ? [entry.ingredientId] : []))
        .sort(),
      enabledRuleIds: profile.dietPreferenceRules.map((entry) => entry.ruleDefinitionId).sort(),
    };
    const ruleVersions = [
      ...rules.references.map(
        (rule) =>
          `REFERENCE:${rule.source.code}:${rule.sourceVersion}:${rule.sourceRecordId}:${rule.updatedAt.toISOString()}`,
      ),
      ...rules.guidelines.map(
        (rule) =>
          `GUIDELINE:${rule.source.code}:${rule.sourceVersion}:${rule.sourceRecordId}:${rule.updatedAt.toISOString()}`,
      ),
      ...rules.interactions.map(
        (rule) =>
          `INTERACTION:${rule.source.code}:${rule.sourceVersion}:${rule.sourceRecordId}:${rule.updatedAt.toISOString()}`,
      ),
    ].sort();
    const fingerprint = sha256({
      algorithm: MEAL_ANALYSIS_ALGORITHM_VERSION,
      plan: { id: plan.id, lockVersion: plan.lockVersion, updatedAt: plan.updatedAt.toISOString() },
      requestSnapshot,
      profileSnapshot,
      ruleVersions,
      items: selected.map((entry) => ({
        id: entry.item.id,
        updatedAt: entry.item.updatedAt.toISOString(),
        recipeRevisionId: entry.item.recipeRevisionId,
        nutrition: entry.item.recipeRevision?.nutritionEstimates[0]
          ? {
              version: entry.item.recipeRevision.nutritionEstimates[0].version,
              fingerprint: entry.item.recipeRevision.nutritionEstimates[0].recipeFingerprint,
            }
          : null,
        customMealUpdatedAt: entry.item.customMeal?.updatedAt.toISOString() ?? null,
      })),
    });
    return {
      plan,
      profile,
      selected,
      rules,
      incomplete: [...new Set(incomplete)].sort(),
      requestSnapshot,
      profileSnapshot,
      ruleVersions,
      fingerprint,
    };
  }

  private selectedItem(
    item: AnalysisPlanRecord['items'][number],
    servings: number,
    conversions: Map<string, Array<{ unit: string; quantity: number; grams: number }>>,
    incomplete: string[],
  ): SelectedItem {
    if (item.recipeRevision?.recipeDetail) {
      const estimate = item.recipeRevision.nutritionEstimates[0];
      const nutrients = estimate
        ? nutrientList(estimate.perServingNutrients).map((entry) => ({
            ...entry,
            amount: entry.amount * servings,
          }))
        : [
            item.recipeRevision.recipeDetail.calories === null
              ? null
              : {
                  code: 'ENERGY_KCAL',
                  unit: 'kcal',
                  amount: item.recipeRevision.recipeDetail.calories * servings,
                },
            item.recipeRevision.recipeDetail.proteinGrams === null
              ? null
              : {
                  code: 'PROTEIN',
                  unit: 'g',
                  amount: Number(item.recipeRevision.recipeDetail.proteinGrams) * servings,
                },
            item.recipeRevision.recipeDetail.fiberGrams === null
              ? null
              : {
                  code: 'FIBER',
                  unit: 'g',
                  amount: Number(item.recipeRevision.recipeDetail.fiberGrams) * servings,
                },
            item.recipeRevision.recipeDetail.fatGrams === null
              ? null
              : {
                  code: 'FAT',
                  unit: 'g',
                  amount: Number(item.recipeRevision.recipeDetail.fatGrams) * servings,
                },
            item.recipeRevision.recipeDetail.carbsGrams === null
              ? null
              : {
                  code: 'CARBS',
                  unit: 'g',
                  amount: Number(item.recipeRevision.recipeDetail.carbsGrams) * servings,
                },
          ].flatMap((entry) => (entry ? [entry] : []));
      if (!estimate)
        incomplete.push(
          `Recipe item ${item.id} chưa có cooking-aware nutrition estimate hiện hành.`,
        );
      if (estimate && nutrientList(estimate.perServingNutrients).length === 0)
        incomplete.push(`Recipe item ${item.id} không có nutrient values có thể cộng gộp.`);
      const ingredientAmounts = new Map<string, number>();
      if (estimate) {
        for (const line of estimate.lines) {
          if (line.ingredientId && line.normalizedRawGrams !== null) {
            ingredientAmounts.set(
              line.ingredientId,
              (ingredientAmounts.get(line.ingredientId) ?? 0) +
                (Number(line.normalizedRawGrams) / estimate.servings) * servings,
            );
          }
        }
      }
      const ingredients = item.recipeRevision.ingredients.flatMap((entry) => {
        if (!entry.ingredientId || !entry.ingredient) {
          incomplete.push(
            `Recipe item ${item.id} có ingredient chưa chuẩn hóa: ${entry.displayName}.`,
          );
          return [];
        }
        const grams =
          ingredientAmounts.get(entry.ingredientId) ??
          this.toGrams(
            entry.ingredientId,
            Number(entry.amount),
            entry.unit,
            conversions,
            servings / item.recipeRevision!.recipeDetail!.servings,
          );
        if (grams === null)
          incomplete.push(`Không đổi được ${entry.displayName} (${entry.unit}) sang gram.`);
        return [{ id: entry.ingredientId, name: entry.ingredient.canonicalName, grams }];
      });
      return {
        item,
        servings,
        name: item.recipeRevision.title,
        nutrients,
        ingredients,
        confidence: estimate ? Number(estimate.confidence) : 0.45,
      };
    }
    if (item.customMeal) {
      const meal = item.customMeal;
      const perServing = 1 / meal.servings;
      const nutrients = [
        meal.userCalories === null
          ? null
          : {
              code: 'ENERGY_KCAL',
              unit: 'kcal',
              amount: meal.userCalories * perServing * servings,
            },
        meal.userProteinGrams === null
          ? null
          : {
              code: 'PROTEIN',
              unit: 'g',
              amount: Number(meal.userProteinGrams) * perServing * servings,
            },
        meal.userCarbsGrams === null
          ? null
          : {
              code: 'CARBS',
              unit: 'g',
              amount: Number(meal.userCarbsGrams) * perServing * servings,
            },
        meal.userFatGrams === null
          ? null
          : { code: 'FAT', unit: 'g', amount: Number(meal.userFatGrams) * perServing * servings },
        meal.userFiberGrams === null
          ? null
          : {
              code: 'FIBER',
              unit: 'g',
              amount: Number(meal.userFiberGrams) * perServing * servings,
            },
      ].flatMap((entry) => (entry ? [entry] : []));
      if (!nutrients.length)
        incomplete.push(`Custom meal item ${item.id} chưa có nutrition do người dùng cung cấp.`);
      const ingredients = meal.ingredients.flatMap((entry) => {
        if (!entry.ingredientId || !entry.ingredient) {
          incomplete.push(
            `Custom meal item ${item.id} có ingredient chưa chuẩn hóa: ${entry.displayName}.`,
          );
          return [];
        }
        const grams = this.toGrams(
          entry.ingredientId,
          Number(entry.amount),
          entry.unit,
          conversions,
          perServing * servings,
        );
        if (grams === null)
          incomplete.push(`Không đổi được ${entry.displayName} (${entry.unit}) sang gram.`);
        return [{ id: entry.ingredientId, name: entry.ingredient.canonicalName, grams }];
      });
      return {
        item,
        servings,
        name: meal.name,
        nutrients,
        ingredients,
        confidence: nutrients.length ? 0.65 : 0.35,
      };
    }
    throw new AppError({
      statusCode: 400,
      code: 'MEAL_ANALYSIS_SOURCE_MISSING',
      message: 'Meal item không có source hợp lệ',
    });
  }

  private toGrams(
    ingredientId: string,
    amount: number,
    unit: string,
    conversions: Map<string, Array<{ unit: string; quantity: number; grams: number }>>,
    multiplier: number,
  ): number | null {
    const normalized = normalizeVietnameseText(unit);
    if (['g', 'gram'].includes(normalized)) return amount * multiplier;
    if (['kg', 'kilogram'].includes(normalized)) return amount * 1000 * multiplier;
    if (['mg', 'milligram'].includes(normalized)) return (amount / 1000) * multiplier;
    const conversion = conversions.get(ingredientId)?.find((entry) => entry.unit === normalized);
    return conversion ? (amount / conversion.quantity) * conversion.grams * multiplier : null;
  }

  private portionWarnings(selected: SelectedItem[]): MealAnalysisWarning[] {
    return selected.flatMap((entry) =>
      entry.servings > 2
        ? [
            {
              code: 'PORTION_MULTIPLIER_HIGH' as const,
              severity: FoodRuleSeverity.CAUTION,
              scope: InteractionScope.SAME_DISH,
              evidenceGrade: EvidenceGrade.INSUFFICIENT,
              source: {
                code: 'SYSTEM_ANALYSIS',
                name: 'Vegan Support portion heuristic',
                version: MEAL_ANALYSIS_ALGORITHM_VERSION,
                recordId: 'portion-multiplier-over-two',
                url: null,
              },
              applicability: { servingMultiplierOver: 2 },
              affectedItems: [affectedItem(entry)],
              affectedIngredients: [],
              measured: { value: entry.servings, unit: 'serving' },
              limit: { value: 2, unit: 'serving' },
              explanation:
                'Khẩu phần đã chọn lớn hơn hai khẩu phần chuẩn; tổng dinh dưỡng và lượng nguyên liệu tăng tương ứng.',
              suggestedAdjustment:
                'Kiểm tra lại số người ăn hoặc giảm khẩu phần trước khi xác nhận.',
              confidence: 0.35,
              advisory: true,
              incompleteDataNotes: [],
            },
          ]
        : [],
    );
  }

  private macroTargetWarnings(context: AnalysisContext): MealAnalysisWarning[] {
    const targets = estimateMealMacroTargets(
      context.plan.targetCalories,
      this.config.mealPlanMacroTargets,
    );
    const metrics = [
      { code: 'PROTEIN', key: 'proteinGrams', label: 'protein' },
      { code: 'FIBER', key: 'fiberGrams', label: 'fiber' },
      { code: 'FAT', key: 'fatGrams', label: 'fat' },
      { code: 'CARBS', key: 'carbohydrateGrams', label: 'carbohydrates' },
    ] as const;
    const byDay = new Map<string, SelectedItem[]>();
    for (const item of context.selected) {
      const day = dateOnly(item.item.date);
      byDay.set(day, [...(byDay.get(day) ?? []), item]);
    }
    const warnings: MealAnalysisWarning[] = [];
    for (const [day, items] of byDay) {
      for (const metric of metrics) {
        const matching = items.flatMap((item) =>
          item.nutrients
            .filter((nutrient) => nutrient.code === metric.code && nutrient.unit === 'g')
            .map((nutrient) => ({ item, amount: nutrient.amount })),
        );
        const measured = matching.reduce((sum, entry) => sum + entry.amount, 0);
        const target = targets[metric.key];
        if (!matching.length || !isMacroOverTarget(measured, target, targets.tolerancePercent))
          continue;
        warnings.push({
          code: 'MACRO_TARGET_EXCEEDED',
          severity: FoodRuleSeverity.CAUTION,
          scope: InteractionScope.SAME_DAY,
          evidenceGrade: EvidenceGrade.INSUFFICIENT,
          source: {
            code: 'MEAL_PLAN_ESTIMATED_MACRO_TARGET',
            name: 'Configured meal-plan macro estimate',
            version: MEAL_ANALYSIS_ALGORITHM_VERSION,
            recordId: `${day}:${metric.code}`,
            url: null,
          },
          applicability: { date: day, tolerancePercent: targets.tolerancePercent },
          affectedItems: matching.map((entry) => affectedItem(entry.item)),
          affectedIngredients: [],
          measured: { value: Number(measured.toFixed(2)), unit: 'g' },
          limit: {
            value: Number((target! * (1 + targets.tolerancePercent / 100)).toFixed(2)),
            unit: 'g',
          },
          explanation: `Estimated daily ${metric.label} is above the approximate configured target and tolerance.`,
          suggestedAdjustment:
            'You may keep this manual choice. Consider adjusting a portion or another meal if you want to move the estimated daily total nearer the target.',
          confidence: Math.min(...matching.map((entry) => entry.item.confidence)),
          advisory: true,
          incompleteDataNotes: context.incomplete.filter((note) => note.includes('nutrition')),
        });
      }
    }
    return warnings;
  }

  private guidelineWarnings(context: AnalysisContext): MealAnalysisWarning[] {
    const warnings: MealAnalysisWarning[] = [];
    for (const rule of context.rules.guidelines) {
      if (!applicabilityMatches(rule.applicability, context.profile)) continue;
      const groups = new Map<string, SelectedItem[]>();
      for (const item of context.selected) {
        const key =
          rule.period === GuidelinePeriod.DAY
            ? dateOnly(item.item.date)
            : `${dateOnly(item.item.date)}:${item.item.mealType}`;
        groups.set(key, [...(groups.get(key) ?? []), item]);
      }
      for (const items of groups.values()) {
        const affected = items.filter((item) =>
          item.ingredients.some((entry) => entry.id === rule.ingredientId),
        );
        const grams = affected.reduce(
          (sum, item) =>
            sum +
            item.ingredients
              .filter((entry) => entry.id === rule.ingredientId)
              .reduce((subtotal, entry) => subtotal + (entry.grams ?? 0), 0),
          0,
        );
        const limit = Number(rule.amount) * Number(rule.frequency);
        if (!affected.length || rule.unit !== 'g' || grams <= limit) continue;
        warnings.push({
          code: 'INGREDIENT_GUIDELINE_EXCEEDED',
          severity: rule.severity,
          scope:
            rule.period === GuidelinePeriod.DAY
              ? InteractionScope.SAME_DAY
              : InteractionScope.SAME_MEAL,
          evidenceGrade: rule.evidenceGrade,
          source: {
            code: rule.source.code,
            name: rule.source.name,
            version: rule.sourceVersion,
            recordId: rule.sourceRecordId,
            url: rule.source.sourceUrl,
          },
          applicability: asRecord(rule.applicability),
          affectedItems: affected.map(affectedItem),
          affectedIngredients: [
            { ingredientId: rule.ingredientId, name: rule.ingredient.canonicalName },
          ],
          measured: { value: Number(grams.toFixed(4)), unit: 'g' },
          limit: { value: limit, unit: rule.unit },
          explanation: rule.explanation,
          suggestedAdjustment:
            'Cân nhắc giảm lượng nguyên liệu hoặc chia sang bữa/ngày khác rồi phân tích lại.',
          confidence: warningConfidence(rule.evidenceGrade),
          advisory: rule.advisoryOnly,
          incompleteDataNotes: context.incomplete.filter((note) =>
            note.includes(rule.ingredient.canonicalName),
          ),
        });
      }
    }
    return warnings;
  }

  private interactionWarnings(context: AnalysisContext): MealAnalysisWarning[] {
    const warnings: MealAnalysisWarning[] = [];
    for (const rule of context.rules.interactions) {
      if (!applicabilityMatches(rule.applicability, context.profile)) continue;
      const groups = new Map<string, SelectedItem[]>();
      for (const item of context.selected) {
        const key =
          rule.scope === InteractionScope.SAME_DISH
            ? item.item.id
            : rule.scope === InteractionScope.SAME_MEAL
              ? `${dateOnly(item.item.date)}:${item.item.mealType}`
              : dateOnly(item.item.date);
        groups.set(key, [...(groups.get(key) ?? []), item]);
      }
      for (const items of groups.values()) {
        const affected = items.filter((item) =>
          item.ingredients.some(
            (entry) => entry.id === rule.ingredientAId || entry.id === rule.ingredientBId,
          ),
        );
        const ids = new Set(affected.flatMap((item) => item.ingredients.map((entry) => entry.id)));
        if (!ids.has(rule.ingredientAId) || !ids.has(rule.ingredientBId)) continue;
        warnings.push({
          code: 'INGREDIENT_INTERACTION',
          severity: rule.severity,
          scope: rule.scope,
          evidenceGrade: rule.evidenceGrade,
          source: {
            code: rule.source.code,
            name: rule.source.name,
            version: rule.sourceVersion,
            recordId: rule.sourceRecordId,
            url: rule.source.sourceUrl,
          },
          applicability: asRecord(rule.applicability),
          affectedItems: affected.map(affectedItem),
          affectedIngredients: [
            { ingredientId: rule.ingredientAId, name: rule.ingredientA.canonicalName },
            { ingredientId: rule.ingredientBId, name: rule.ingredientB.canonicalName },
          ],
          measured: null,
          limit: null,
          explanation: rule.explanation,
          suggestedAdjustment:
            rule.suggestedAction ??
            'Xem xét điều chỉnh cách kết hợp hoặc chọn món khác trước khi xác nhận.',
          confidence: warningConfidence(rule.evidenceGrade),
          advisory: !rule.hardRule,
          incompleteDataNotes: context.incomplete,
        });
      }
    }
    return warnings;
  }

  private estimatedNutrition(context: AnalysisContext) {
    const targets = estimateMealMacroTargets(
      context.plan.targetCalories,
      this.config.mealPlanMacroTargets,
    );
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(context.plan.weekStart);
      date.setUTCDate(date.getUTCDate() + index);
      return dateOnly(date);
    });
    const macroCodeMap = {
      PROTEIN: 'proteinGrams',
      FIBER: 'fiberGrams',
      FAT: 'fatGrams',
      CARBS: 'carbohydrateGrams',
    } as const;
    const days = dates.map((date) => {
      const items = context.selected.filter((item) => dateOnly(item.item.date) === date);
      let totals = emptyMealMacroValues();
      for (const item of items) {
        const values = emptyMealMacroValues();
        for (const nutrient of item.nutrients) {
          const key = macroCodeMap[nutrient.code as keyof typeof macroCodeMap];
          if (key && nutrient.unit === 'g') values[key] = nutrient.amount;
        }
        totals = addMealMacroValues(totals, values);
      }
      return {
        date,
        totals,
        confidence: items.length ? Math.min(...items.map((item) => item.confidence)) : 0.2,
        uncertaintyNotes: context.incomplete.filter((note) =>
          items.some((item) => note.includes(item.item.id)),
        ),
      };
    });
    return {
      estimated: true as const,
      targetSource: targets.source,
      targetSourceDetail: targets.sourceDetail,
      tolerancePercent: targets.tolerancePercent,
      targets: {
        proteinGrams: targets.proteinGrams!,
        fiberGrams: targets.fiberGrams!,
        fatGrams: targets.fatGrams!,
        carbohydrateGrams: targets.carbohydrateGrams!,
      },
      days,
    };
  }

  private output(record: MealAnalysisRecord) {
    const request = asRecord(record.requestSnapshot);
    const summary = asRecord(record.summary);
    const warnings = Array.isArray(record.warnings) ? record.warnings : [];
    const incompleteData = Array.isArray(record.incompleteData)
      ? record.incompleteData.filter((item): item is string => typeof item === 'string')
      : [];
    const ruleVersions = Array.isArray(record.ruleVersions)
      ? record.ruleVersions.filter((item): item is string => typeof item === 'string')
      : [];
    const itemValues: unknown[] = Array.isArray(request.items) ? request.items : [];
    return {
      id: record.id,
      mealPlanId: record.mealPlanId,
      version: record.version,
      status: record.status,
      algorithmVersion: record.algorithmVersion,
      planVersion:
        typeof request.expectedPlanVersion === 'number' ? request.expectedPlanVersion : 0,
      analyzedItemIds: itemValues.flatMap((entry) => {
        if (
          !entry ||
          typeof entry !== 'object' ||
          Array.isArray(entry) ||
          !('itemId' in entry) ||
          typeof entry.itemId !== 'string'
        )
          return [];
        return [entry.itemId];
      }),
      warnings,
      summary: {
        warningCount: typeof summary.warningCount === 'number' ? summary.warningCount : 0,
        highCount: typeof summary.highCount === 'number' ? summary.highCount : 0,
        cautionCount: typeof summary.cautionCount === 'number' ? summary.cautionCount : 0,
        infoCount: typeof summary.infoCount === 'number' ? summary.infoCount : 0,
        selectedItemCount:
          typeof summary.selectedItemCount === 'number' ? summary.selectedItemCount : 0,
      },
      confidence: Number(record.confidence),
      incompleteData,
      estimatedNutrition: summary.estimatedNutrition,
      ruleVersions,
      disclaimer: record.disclaimer,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private notFound(message: string) {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message });
  }
}
