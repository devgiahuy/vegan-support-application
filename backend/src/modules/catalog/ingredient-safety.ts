import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { SearchConstraints } from '../content/content.repository.js';

const safetyInclude = {
  aliases: { where: { reviewStatus: 'APPROVED' as const } },
  allergens: true,
  dietCompatibilities: true,
  traditionWarnings: true,
  components: true,
} satisfies Prisma.IngredientInclude;

export type SafetyIngredient = Prisma.IngredientGetPayload<{ include: typeof safetyInclude }>;
export const MAX_COMPOSITION_DEPTH = 32;

const safetyReasonLabels: Record<string, string> = {
  ALLERGEN_SELECTION_UNRESOLVED: 'lựa chọn dị ứng cần được xác nhận lại trong danh mục',
  ALLERGY: 'có thành phần gây dị ứng đã khai báo',
  UNRESOLVED_INGREDIENT: 'có nguyên liệu chưa xác định hoặc không còn hoạt động',
  INGREDIENT_COMPOSITION_UNCERTAIN: 'cấu tạo nguyên liệu chưa được rà soát đầy đủ',
  INGREDIENT_EXCLUSION: 'có nguyên liệu bạn đã chọn kiêng',
  DIET_PATTERN: 'chưa đáp ứng chế độ ăn đã chọn',
  TRADITION_RULE: 'không phù hợp quy tắc truyền thống đang áp dụng',
  SOURCE_UNAVAILABLE: 'món ăn nguồn không còn khả dụng',
};

export function describeIngredientSafetyReasons(reasons: string[]): string {
  return reasons
    .map((reason) => safetyReasonLabels[reason] ?? 'dữ liệu cần được rà soát')
    .join(', ');
}

export function jsonObject(value: Prisma.JsonValue | null): Prisma.JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export class IngredientSafetyCatalog {
  readonly byId: Map<string, SafetyIngredient>;
  readonly fingerprint: string;
  private readonly closures = new Map<string, { nodes: SafetyIngredient[]; complete: boolean }>();

  constructor(
    readonly ingredients: SafetyIngredient[],
    private readonly activeAllergens: Set<string>,
    private readonly activeSources: Set<string>,
  ) {
    this.byId = new Map(ingredients.map((item) => [item.id, item]));
    this.fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          ingredients: ingredients.map((item) => ({
            id: item.id,
            status: item.status,
            normalizedName: item.normalizedName,
            compositionStatus: item.compositionStatus,
            compositionKind: item.compositionKind,
            compositionEvidence: item.compositionEvidence,
            components: item.components.map((edge) => edge.componentId).sort(),
            aliases: item.aliases.map((alias) => alias.normalizedAlias).sort(),
            allergens: item.allergens.map((entry) => entry.allergenCode).sort(),
            dietCompatibilities: item.dietCompatibilities
              .map(({ dietPattern, compatible }) => ({ dietPattern, compatible }))
              .sort((a, b) => a.dietPattern.localeCompare(b.dietPattern)),
            traditionWarnings: item.traditionWarnings
              .map(({ tradition, warningCode }) => `${tradition}:${warningCode}`)
              .sort(),
          })),
          activeAllergens: [...activeAllergens].sort(),
          activeSources: [...activeSources].sort(),
        }),
      )
      .digest('hex');
  }

  closure(rootId: string) {
    const cached = this.closures.get(rootId);
    if (cached) return cached;
    const nodes = new Map<string, SafetyIngredient>();
    let complete = true;
    const visit = (id: string, path: Set<string>, depth: number) => {
      if (path.has(id) || depth > MAX_COMPOSITION_DEPTH || nodes.size >= 2048) {
        complete = false;
        return;
      }
      const item = this.byId.get(id);
      if (!item) {
        complete = false;
        return;
      }
      if (nodes.has(id)) return;
      nodes.set(id, item);
      const evidence = jsonObject(item.compositionEvidence);
      if (
        item.status !== 'ACTIVE' ||
        item.compositionStatus !== 'COMPLETE' ||
        typeof evidence.sourceId !== 'string' ||
        !this.activeSources.has(evidence.sourceId) ||
        !evidence.sourceVersion ||
        !evidence.sourceRecordId ||
        !evidence.scope ||
        typeof evidence.reviewedAt !== 'string' ||
        !Number.isFinite(Date.parse(evidence.reviewedAt)) ||
        typeof evidence.reviewedById !== 'string' ||
        !evidence.reviewedById ||
        (item.compositionKind !== 'SIMPLE' && item.compositionKind !== 'COMPOUND') ||
        (item.compositionKind === 'SIMPLE' && item.components.length !== 0) ||
        (item.compositionKind === 'COMPOUND' && item.components.length === 0)
      )
        complete = false;
      const nextPath = new Set(path).add(id);
      for (const edge of item.components) visit(edge.componentId, nextPath, depth + 1);
    };
    visit(rootId, new Set(), 0);
    const result = { nodes: [...nodes.values()], complete };
    this.closures.set(rootId, result);
    return result;
  }

  reasons(
    ingredientIds: Array<string | null>,
    constraints: SearchConstraints,
    options: { unresolved?: boolean; snapshotAllergens?: string[] } = {},
  ): string[] {
    const reasons = new Set<string>();
    const requiresCompleteness = Boolean(
      constraints.requireResolvedIngredients ||
      constraints.dietPattern ||
      constraints.traditions.length ||
      constraints.allergenCodes.length ||
      constraints.allergicIngredientIds?.length ||
      constraints.excludedIngredientIds.length ||
      constraints.excludedNormalizedNames.length,
    );
    if (constraints.allergenCodes.some((code) => !this.activeAllergens.has(code)))
      reasons.add('ALLERGEN_SELECTION_UNRESOLVED');
    if (constraints.allergenCodes.some((code) => options.snapshotAllergens?.includes(code)))
      reasons.add('ALLERGY');
    if (
      requiresCompleteness &&
      (options.unresolved || !ingredientIds.length || ingredientIds.some((id) => !id))
    )
      reasons.add('UNRESOLVED_INGREDIENT');
    for (const id of ingredientIds) {
      if (!id) continue;
      const closure = this.closure(id);
      if (requiresCompleteness && !closure.complete)
        reasons.add('INGREDIENT_COMPOSITION_UNCERTAIN');
      if (!closure.nodes.length || closure.nodes.some((item) => item.status !== 'ACTIVE'))
        reasons.add('UNRESOLVED_INGREDIENT');
      for (const item of closure.nodes) {
        if (constraints.allergicIngredientIds?.includes(item.id)) reasons.add('ALLERGY');
        if (item.allergens.some((entry) => constraints.allergenCodes.includes(entry.allergenCode)))
          reasons.add('ALLERGY');
        const names = [item.normalizedName, ...item.aliases.map((alias) => alias.normalizedAlias)];
        if (
          constraints.excludedIngredientIds.includes(item.id) ||
          names.some((name) => constraints.excludedNormalizedNames.includes(name))
        )
          reasons.add('INGREDIENT_EXCLUSION');
        if (
          constraints.dietPattern &&
          !item.dietCompatibilities.some(
            (entry) => entry.dietPattern === constraints.dietPattern && entry.compatible,
          )
        )
          reasons.add('DIET_PATTERN');
        if (
          item.traditionWarnings.some((entry) => constraints.traditions.includes(entry.tradition))
        )
          reasons.add('TRADITION_RULE');
      }
    }
    return [...reasons].sort();
  }

  blockedIngredientIds(constraints: SearchConstraints): string[] {
    return this.ingredients
      .filter((item) => this.reasons([item.id], constraints).length)
      .map((item) => item.id);
  }
}

export async function loadIngredientSafetyCatalog(prisma: PrismaClient | Prisma.TransactionClient) {
  const [ingredients, allergens, sources] = await Promise.all([
    prisma.ingredient.findMany({ include: safetyInclude, orderBy: { id: 'asc' } }),
    prisma.allergenDefinition.findMany({ where: { active: true }, select: { code: true } }),
    prisma.foodDataSource.findMany({ where: { active: true }, select: { id: true } }),
  ]);
  return new IngredientSafetyCatalog(
    ingredients,
    new Set(allergens.map((item) => item.code)),
    new Set(sources.map((item) => item.id)),
  );
}
