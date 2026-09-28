import { createHash } from 'node:crypto';
import {
  AiRequestStatus,
  NutritionValueOrigin,
  RecipeNutritionEstimateStatus,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type {
  AiProvider,
  RecipeNutritionFallbackSuggestion,
} from '../chat/ai-provider.js';
import {
  CALCULATION_VERSION,
  NUTRITION_DISCLAIMER,
  type NutritionEstimateOutput,
  type NutritionHistoryQuery,
  type NutritionPreviewInput,
  type NutritionRecalculateInput,
} from './recipe-nutrition.schemas.js';
import {
  type NutritionActor,
  type NutritionEstimateRecord,
  type NutritionRevisionRecord,
  type RecipeNutritionRepository,
} from './recipe-nutrition.repository.js';

interface SourceVersion {
  sourceCode: string;
  sourceVersion: string;
  sourceRecordId: string;
  kind: string;
}

interface Assumption {
  code: string;
  message: string;
  origin: NutritionValueOrigin;
}

interface NutrientAmount {
  nutrientCode: string;
  nutrientName: string;
  unit: string;
  amount: number;
  origin: NutritionValueOrigin;
  confidence: number;
  min: number | null;
  max: number | null;
}

interface EstimateLine {
  id: string | null;
  recipeIngredientId: string | null;
  ingredientId: string | null;
  position: number;
  displayName: string;
  origin: NutritionValueOrigin;
  normalizedRawGrams: number | null;
  edibleRawGrams: number | null;
  yieldFactor: number | null;
  cookedGrams: number | null;
  nutrients: NutrientAmount[];
  sourceVersions: SourceVersion[];
  assumptions: Assumption[];
  confidence: number;
  uncertainty: Record<string, unknown>;
  uncoveredReason: string | null;
}

interface BuiltEstimate {
  id: string | null;
  revisionId: string;
  postId: string;
  postVersion: number;
  estimateVersion: number | null;
  status: RecipeNutritionEstimateStatus | null;
  stale: boolean;
  calculationVersion: typeof CALCULATION_VERSION;
  recipeFingerprint: string;
  servings: number;
  totalRawGrams: number;
  totalCookedGrams: number;
  totalNutrients: NutrientAmount[];
  perServingNutrients: NutrientAmount[];
  lines: EstimateLine[];
  uncoveredIngredients: Array<{
    recipeIngredientId: string | null;
    position: number;
    displayName: string;
    reason: string;
  }>;
  sourceVersions: SourceVersion[];
  assumptions: Assumption[];
  confidence: number;
  uncertainty: Record<string, unknown>;
  ai: {
    used: boolean;
    provider: string | null;
    modelId: string | null;
    status: AiRequestStatus | null;
    providerDown: boolean;
  };
  disclaimer: string;
  createdAt: string | null;
}

const MASS_UNITS = new Map([
  ['g', 1],
  ['gram', 1],
  ['grams', 1],
  ['kg', 1000],
  ['mg', 0.001],
]);

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function jsonArray<T>(value: Prisma.JsonValue, guard: (item: Prisma.JsonValue) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = guard(item);
    return parsed ? [parsed] : [];
  });
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function parseSourceVersion(value: Prisma.JsonValue): SourceVersion | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record.sourceCode === 'string' &&
    typeof record.sourceVersion === 'string' &&
    typeof record.sourceRecordId === 'string' &&
    typeof record.kind === 'string'
    ? {
        sourceCode: record.sourceCode,
        sourceVersion: record.sourceVersion,
        sourceRecordId: record.sourceRecordId,
        kind: record.kind,
      }
    : null;
}

function parseAssumption(value: Prisma.JsonValue): Assumption | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record.code === 'string' &&
    typeof record.message === 'string' &&
    typeof record.origin === 'string' &&
    Object.values(NutritionValueOrigin).includes(record.origin as NutritionValueOrigin)
    ? {
        code: record.code,
        message: record.message,
        origin: record.origin as NutritionValueOrigin,
      }
    : null;
}

function parseNutrient(value: Prisma.JsonValue): NutrientAmount | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record.nutrientCode === 'string' &&
    typeof record.nutrientName === 'string' &&
    typeof record.unit === 'string' &&
    typeof record.amount === 'number' &&
    typeof record.origin === 'string' &&
    typeof record.confidence === 'number'
    ? {
        nutrientCode: record.nutrientCode,
        nutrientName: record.nutrientName,
        unit: record.unit,
        amount: record.amount,
        origin: record.origin as NutritionValueOrigin,
        confidence: record.confidence,
        min: typeof record.min === 'number' ? record.min : null,
        max: typeof record.max === 'number' ? record.max : null,
      }
    : null;
}

function dedupeSources(values: SourceVersion[]): SourceVersion[] {
  return [
    ...new Map(
      values.map((value) => [
        `${value.kind}:${value.sourceCode}:${value.sourceVersion}:${value.sourceRecordId}`,
        value,
      ]),
    ).values(),
  ];
}

function fingerprint(revision: NutritionRevisionRecord): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        calculationVersion: CALCULATION_VERSION,
        revisionId: revision.id,
        postVersion: revision.post.version,
        servings: revision.recipeDetail?.servings,
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
}

export class RecipeNutritionService {
  constructor(
    private readonly repository: RecipeNutritionRepository,
    private readonly provider: AiProvider,
  ) {}

  async preview(
    postId: string,
    input: NutritionPreviewInput,
    actor?: NutritionActor,
  ): Promise<NutritionEstimateOutput> {
    const revision = await this.repository.findAccessibleRecipeRevision(postId, actor);
    if (!revision) throw this.notFound();
    return this.output(await this.build(revision, input.useAiFallback));
  }

  async recalculate(
    postId: string,
    input: NutritionRecalculateInput,
    actor: NutritionActor,
  ): Promise<NutritionEstimateOutput> {
    const revision = await this.repository.findOwnedRecipeRevision(postId, actor);
    if (!revision) throw this.forbiddenOrNotFound();
    if (input.expectedPostVersion && input.expectedPostVersion !== revision.post.version) {
      throw new AppError({
        statusCode: 409,
        code: 'CONTENT_VERSION_CONFLICT',
        message: 'Recipe da thay doi, hay refetch truoc khi tinh lai dinh duong',
        fields: { currentVersion: [String(revision.post.version)] },
      });
    }
    const built = await this.build(revision, input.useAiFallback);
    const saved = await this.repository.saveEstimate({
      revisionId: revision.id,
      currentFingerprint: built.recipeFingerprint,
      estimate: {
        revisionId: revision.id,
        version: 1,
        calculationVersion: CALCULATION_VERSION,
        recipeFingerprint: built.recipeFingerprint,
        servings: built.servings,
        totalRawGrams: built.totalRawGrams,
        totalCookedGrams: built.totalCookedGrams,
        totalNutrients: built.totalNutrients as unknown as Prisma.InputJsonArray,
        perServingNutrients: built.perServingNutrients as unknown as Prisma.InputJsonArray,
        sourceVersions: built.sourceVersions as unknown as Prisma.InputJsonArray,
        assumptions: built.assumptions as unknown as Prisma.InputJsonArray,
        uncoveredIngredients: built.uncoveredIngredients,
        confidence: built.confidence,
        uncertainty: built.uncertainty as Prisma.InputJsonObject,
        aiUsed: built.ai.used,
        providerDown: built.ai.providerDown,
        disclaimer: built.disclaimer,
      },
      lines: built.lines.map((line) => ({
        recipeIngredientId: line.recipeIngredientId,
        ingredientId: line.ingredientId,
        position: line.position,
        displayName: line.displayName,
        origin: line.origin,
        normalizedRawGrams: line.normalizedRawGrams,
        edibleRawGrams: line.edibleRawGrams,
        yieldFactor: line.yieldFactor,
        cookedGrams: line.cookedGrams,
        nutrientCoverage: line.nutrients as unknown as Prisma.InputJsonArray,
        sourceVersions: line.sourceVersions as unknown as Prisma.InputJsonArray,
        assumptions: line.assumptions as unknown as Prisma.InputJsonArray,
        confidence: line.confidence,
        uncertainty: line.uncertainty as Prisma.InputJsonObject,
        uncoveredReason: line.uncoveredReason,
      })),
      ...(built.ai.status ? { aiJobId: built.ai.statusJobId } : {}),
    });
    return this.output(this.fromRecord(saved, fingerprint(revision)));
  }

  async current(postId: string, actor?: NutritionActor): Promise<NutritionEstimateOutput> {
    const revision = await this.repository.findAccessibleRecipeRevision(postId, actor);
    if (!revision) throw this.notFound();
    const current = await this.repository.findCurrentEstimate(revision.id);
    if (!current) {
      throw new AppError({
        statusCode: 404,
        code: 'NUTRITION_DATA_INCOMPLETE',
        message: 'Recipe chua co estimate dinh duong da luu',
      });
    }
    const currentFingerprint = fingerprint(revision);
    if (current.recipeFingerprint !== currentFingerprint) {
      await this.repository.markCurrentStale(revision.id);
      throw new AppError({
        statusCode: 409,
        code: 'NUTRITION_ESTIMATE_STALE',
        message: 'Recipe hoac food-data da thay doi, can tinh lai estimate',
      });
    }
    return this.output(this.fromRecord(current, currentFingerprint));
  }

  async history(postId: string, query: NutritionHistoryQuery, actor?: NutritionActor) {
    const revision = await this.repository.findAccessibleRecipeRevision(postId, actor);
    if (!revision) throw this.notFound();
    const result = await this.repository.listEstimates(revision.id, query.page, query.limit);
    const currentFingerprint = fingerprint(revision);
    return {
      data: result.records.map((record) => this.output(this.fromRecord(record, currentFingerprint))),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }

  async status(postId: string, actor?: NutritionActor) {
    const revision = await this.repository.findAccessibleRecipeRevision(postId, actor);
    if (!revision) throw this.notFound();
    const [current, latestAiJob] = await Promise.all([
      this.repository.findCurrentEstimate(revision.id),
      this.repository.findLatestAiJob(revision.id),
    ]);
    const currentFingerprint = fingerprint(revision);
    const stale = Boolean(current && current.recipeFingerprint !== currentFingerprint);
    return {
      postId: revision.postId,
      revisionId: revision.id,
      currentEstimateId: current?.id ?? null,
      currentStatus: stale ? RecipeNutritionEstimateStatus.STALE : (current?.status ?? null),
      stale,
      latestAiJob: latestAiJob
        ? {
            id: latestAiJob.id,
            provider: latestAiJob.provider,
            modelId: latestAiJob.modelId,
            status: latestAiJob.status,
            errorCode: latestAiJob.errorCode,
            startedAt: latestAiJob.startedAt.toISOString(),
            completedAt: latestAiJob.completedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private async build(
    revision: NutritionRevisionRecord,
    useAiFallback: boolean,
  ): Promise<BuiltEstimate & { ai: BuiltEstimate['ai'] & { statusJobId?: string } }> {
    if (!revision.recipeDetail) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_CONTENT',
        message: 'Post khong phai recipe co structured detail',
      });
    }
    if (revision.recipeDetail.servings <= 0) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SERVINGS',
        message: 'Servings phai lon hon 0',
      });
    }

    const ingredientIds = revision.ingredients.flatMap((item) =>
      item.ingredientId ? [item.ingredientId] : [],
    );
    const methodIds = revision.recipeSteps.flatMap((step) =>
      step.cookingMethodId ? [step.cookingMethodId] : [],
    );
    const inputs = await this.repository.findNutritionInputs(ingredientIds, methodIds);
    const profileByIngredient = new Map<string, (typeof inputs.profiles)[number]>();
    for (const profile of inputs.profiles) {
      if (!profileByIngredient.has(profile.ingredientId)) profileByIngredient.set(profile.ingredientId, profile);
    }
    const methodById = new Map(inputs.methods.map((method) => [method.id, method]));
    const methodByCode = new Map(inputs.methods.map((method) => [method.code, method]));

    let aiSuggestion: RecipeNutritionFallbackSuggestion | null = null;
    let aiStatus: AiRequestStatus | null = null;
    let aiJobId: string | undefined;
    let providerDown = false;
    if (useAiFallback) {
      const startedAt = new Date();
      const requestPayload = {
        revisionId: revision.id,
        ingredients: revision.ingredients.map((ingredient) => ({
          position: ingredient.position,
          displayName: ingredient.displayName,
          canonicalName: ingredient.ingredient?.canonicalName ?? null,
          unit: ingredient.unit,
        })),
        steps: revision.recipeSteps.map((step) => ({
          position: step.position,
          instruction: step.instruction,
          cookingMethodCode: step.cookingMethod?.code ?? null,
          affectedIngredientPositions: positions(step.affectedIngredientPositions),
        })),
      };
      const requestPayloadHash = createHash('sha256')
        .update(JSON.stringify(requestPayload))
        .digest('hex');
      try {
        const rawSuggestion = await this.provider.suggestRecipeNutritionFallback({
          recipeTitle: revision.title,
          ingredients: requestPayload.ingredients,
          steps: requestPayload.steps,
          availableCookingMethodCodes: inputs.methods.map((method) => method.code),
          signal: AbortSignal.timeout(5_000),
        });
        aiSuggestion = validateAiSuggestion(
          rawSuggestion,
          new Set(revision.recipeSteps.map((step) => step.position)),
          new Set(revision.ingredients.map((ingredient) => ingredient.position)),
          new Set(inputs.methods.map((method) => method.code)),
        );
        aiStatus = AiRequestStatus.SUCCESS;
        const job = await this.repository.createAiJob({
          revisionId: revision.id,
          provider: this.provider.name,
          modelId: this.provider.chatModel,
          status: aiStatus,
          requestPayloadHash,
          resultPayload: aiSuggestion as unknown as Prisma.InputJsonObject,
          startedAt,
          completedAt: new Date(),
        });
        aiJobId = job.id;
      } catch {
        aiStatus = AiRequestStatus.FALLBACK;
        providerDown = true;
        const job = await this.repository.createAiJob({
          revisionId: revision.id,
          provider: this.provider.name,
          modelId: this.provider.chatModel,
          status: aiStatus,
          requestPayloadHash,
          errorCode: 'AI_PROVIDER_UNAVAILABLE',
          startedAt,
          completedAt: new Date(),
        });
        aiJobId = job.id;
      }
    }

    const stepMethodByPosition = new Map<number, (typeof inputs.methods)[number]>();
    const aiMethodByStep = new Map(
      aiSuggestion?.stepMethods
        .map((suggestion) => [suggestion.stepPosition, methodByCode.get(suggestion.cookingMethodCode)] as const)
        .filter((entry): entry is readonly [number, (typeof inputs.methods)[number]] => Boolean(entry[1])) ?? [],
    );
    for (const step of revision.recipeSteps) {
      const method = step.cookingMethodId
        ? methodById.get(step.cookingMethodId)
        : aiMethodByStep.get(step.position);
      if (!method) continue;
      for (const position of positions(step.affectedIngredientPositions)) {
        if (!stepMethodByPosition.has(position)) stepMethodByPosition.set(position, method);
      }
    }

    const lines: EstimateLine[] = [];
    const uncovered: BuiltEstimate['uncoveredIngredients'] = [];
    for (const ingredient of revision.ingredients) {
      const ingredientAssumptions: Assumption[] = [];
      const profile = ingredient.ingredientId
        ? profileByIngredient.get(ingredient.ingredientId)
        : undefined;
      if (!ingredient.ingredientId || !profile) {
        const reason = !ingredient.ingredientId ? 'UNRESOLVED_INGREDIENT' : 'MISSING_CANONICAL_PROFILE';
        uncovered.push({
          recipeIngredientId: ingredient.id,
          position: ingredient.position,
          displayName: ingredient.displayName,
          reason,
        });
        lines.push(this.uncoveredLine(ingredient, reason));
        continue;
      }
      const rawGrams = normalizeMass(Number(ingredient.amount), ingredient.unit, profile);
      if (rawGrams === null) {
        uncovered.push({
          recipeIngredientId: ingredient.id,
          position: ingredient.position,
          displayName: ingredient.displayName,
          reason: 'UNIT_CONVERSION_UNAVAILABLE',
        });
        lines.push(this.uncoveredLine(ingredient, 'UNIT_CONVERSION_UNAVAILABLE'));
        continue;
      }
      const edibleRawGrams = rawGrams * (Number(profile.ediblePortionPercent) / 100);
      const method = stepMethodByPosition.get(ingredient.position);
      const yieldInfo = method ? bestYield(method.yields, ingredient.ingredientId) : null;
      const yieldFactor = yieldInfo?.factor ?? 1;
      if (!method) {
        ingredientAssumptions.push({
          code: 'RAW_OR_UNSPECIFIED_COOKING',
          message: 'No cooking method affected this ingredient; raw baseline used.',
          origin: NutritionValueOrigin.CANONICAL_CALCULATED,
        });
      } else if (!yieldInfo) {
        const aiYield = aiSuggestion?.yieldFactors.find(
          (suggestion) => suggestion.ingredientPosition === ingredient.position,
        );
        if (aiYield) {
          ingredientAssumptions.push({
            code: 'AI_YIELD_FACTOR',
            message: aiYield.assumption,
            origin: NutritionValueOrigin.AI_ESTIMATED,
          });
        } else {
          ingredientAssumptions.push({
            code: 'DEFAULT_YIELD_FACTOR',
            message: 'No reviewed yield factor found; factor 1.0 used.',
            origin: NutritionValueOrigin.CANONICAL_CALCULATED,
          });
        }
      }
      const cookedGrams = edibleRawGrams * yieldFactor;
      const nutrients = profile.nutrientValues.map((value) => {
        const retention = method
          ? bestRetention(method.retentions, value.nutrientId, value.nutrient.code, aiSuggestion)
          : { factor: 1, origin: NutritionValueOrigin.CANONICAL_CALCULATED, confidence: 1 };
        const amount = (Number(value.valuePer100g) * edibleRawGrams * retention.factor) / 100;
        return {
          nutrientCode: value.nutrient.code,
          nutrientName: value.nutrient.name,
          unit: value.unit,
          amount: round(amount),
          origin: retention.origin,
          confidence: retention.confidence,
          min:
            value.minValue === null
              ? round(amount * 0.9)
              : round((Number(value.minValue) * edibleRawGrams * retention.factor) / 100),
          max:
            value.maxValue === null
              ? round(amount * 1.1)
              : round((Number(value.maxValue) * edibleRawGrams * retention.factor) / 100),
        };
      });
      if (!nutrients.length) {
        uncovered.push({
          recipeIngredientId: ingredient.id,
          position: ingredient.position,
          displayName: ingredient.displayName,
          reason: 'MISSING_NUTRIENT_VALUES',
        });
      }
      const sources = [
        {
          sourceCode: profile.source.code,
          sourceVersion: profile.sourceVersion,
          sourceRecordId: profile.sourceRecordId,
          kind: 'INGREDIENT_PROFILE',
        },
        ...profile.nutrientValues.map((value) => ({
          sourceCode: profile.source.code,
          sourceVersion: profile.sourceVersion,
          sourceRecordId: value.id,
          kind: `NUTRIENT_VALUE:${value.nutrient.code}`,
        })),
        ...(yieldInfo
          ? [
              {
                sourceCode: yieldInfo.sourceCode,
                sourceVersion: yieldInfo.sourceVersion,
                sourceRecordId: yieldInfo.sourceRecordId,
                kind: 'YIELD_FACTOR',
              },
            ]
          : []),
      ];
      const confidence = nutrients.length
        ? round(Math.min(...nutrients.map((nutrient) => nutrient.confidence)), 4)
        : 0.4;
      lines.push({
        id: null,
        recipeIngredientId: ingredient.id,
        ingredientId: ingredient.ingredientId,
        position: ingredient.position,
        displayName: ingredient.displayName,
        origin: nutrients.some((nutrient) => nutrient.origin === NutritionValueOrigin.AI_ESTIMATED)
          ? NutritionValueOrigin.AI_ESTIMATED
          : NutritionValueOrigin.CANONICAL_CALCULATED,
        normalizedRawGrams: round(rawGrams),
        edibleRawGrams: round(edibleRawGrams),
        yieldFactor: round(yieldFactor, 6),
        cookedGrams: round(cookedGrams),
        nutrients,
        sourceVersions: dedupeSources(sources),
        assumptions: ingredientAssumptions,
        confidence,
        uncertainty: { method: method?.code ?? null },
        uncoveredReason: nutrients.length ? null : 'MISSING_NUTRIENT_VALUES',
      });
    }

    const totalNutrients = aggregate(lines, 1);
    const perServingNutrients = aggregate(lines, revision.recipeDetail.servings);
    const totalRawGrams = round(
      lines.reduce((sum, line) => sum + (line.normalizedRawGrams ?? 0), 0),
    );
    const totalCookedGrams = round(lines.reduce((sum, line) => sum + (line.cookedGrams ?? 0), 0));
    const allAssumptions = lines.flatMap((line) => line.assumptions);
    const allSources = dedupeSources(lines.flatMap((line) => line.sourceVersions));
    const coverage = revision.ingredients.length
      ? (revision.ingredients.length - uncovered.length) / revision.ingredients.length
      : 0;
    const confidence = round(
      Math.max(0, Math.min(1, coverage * (lines.length ? average(lines.map((line) => line.confidence)) : 0))),
      4,
    );
    return {
      id: null,
      revisionId: revision.id,
      postId: revision.postId,
      postVersion: revision.post.version,
      estimateVersion: null,
      status: null,
      stale: false,
      calculationVersion: CALCULATION_VERSION,
      recipeFingerprint: fingerprint(revision),
      servings: revision.recipeDetail.servings,
      totalRawGrams,
      totalCookedGrams,
      totalNutrients,
      perServingNutrients,
      lines,
      uncoveredIngredients: uncovered,
      sourceVersions: allSources,
      assumptions: allAssumptions,
      confidence,
      uncertainty: { partial: uncovered.length > 0, lineCount: lines.length },
      ai: {
        used: Boolean(aiSuggestion),
        provider: useAiFallback ? this.provider.name : null,
        modelId: useAiFallback ? this.provider.chatModel : null,
        status: aiStatus,
        providerDown,
        ...(aiJobId ? { statusJobId: aiJobId } : {}),
      },
      disclaimer: NUTRITION_DISCLAIMER,
      createdAt: null,
    };
  }

  private fromRecord(record: NutritionEstimateRecord, currentFingerprint: string): BuiltEstimate {
    return {
      id: record.id,
      revisionId: record.revisionId,
      postId: record.revision.postId,
      postVersion: record.revision.post.version,
      estimateVersion: record.version,
      status: record.status,
      stale: record.status === RecipeNutritionEstimateStatus.STALE || record.recipeFingerprint !== currentFingerprint,
      calculationVersion: CALCULATION_VERSION,
      recipeFingerprint: record.recipeFingerprint,
      servings: record.servings,
      totalRawGrams: Number(record.totalRawGrams),
      totalCookedGrams: Number(record.totalCookedGrams),
      totalNutrients: jsonArray(record.totalNutrients, parseNutrient),
      perServingNutrients: jsonArray(record.perServingNutrients, parseNutrient),
      lines: record.lines.map((line) => ({
        id: line.id,
        recipeIngredientId: line.recipeIngredientId,
        ingredientId: line.ingredientId,
        position: line.position,
        displayName: line.displayName,
        origin: line.origin,
        normalizedRawGrams: line.normalizedRawGrams === null ? null : Number(line.normalizedRawGrams),
        edibleRawGrams: line.edibleRawGrams === null ? null : Number(line.edibleRawGrams),
        yieldFactor: line.yieldFactor === null ? null : Number(line.yieldFactor),
        cookedGrams: line.cookedGrams === null ? null : Number(line.cookedGrams),
        nutrients: jsonArray(line.nutrientCoverage, parseNutrient),
        sourceVersions: jsonArray(line.sourceVersions, parseSourceVersion),
        assumptions: jsonArray(line.assumptions, parseAssumption),
        confidence: Number(line.confidence),
        uncertainty: asRecord(line.uncertainty),
        uncoveredReason: line.uncoveredReason,
      })),
      uncoveredIngredients: jsonArray(record.uncoveredIngredients, (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const value = item as Record<string, unknown>;
        return typeof value.position === 'number' &&
          typeof value.displayName === 'string' &&
          typeof value.reason === 'string'
          ? {
              recipeIngredientId:
                typeof value.recipeIngredientId === 'string' ? value.recipeIngredientId : null,
              position: value.position,
              displayName: value.displayName,
              reason: value.reason,
            }
          : null;
      }),
      sourceVersions: jsonArray(record.sourceVersions, parseSourceVersion),
      assumptions: jsonArray(record.assumptions, parseAssumption),
      confidence: Number(record.confidence),
      uncertainty: asRecord(record.uncertainty),
      ai: {
        used: record.aiUsed,
        provider: record.aiJobs[0]?.provider ?? null,
        modelId: record.aiJobs[0]?.modelId ?? null,
        status: record.aiJobs[0]?.status ?? null,
        providerDown: record.providerDown,
      },
      disclaimer: record.disclaimer,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private output(estimate: BuiltEstimate): NutritionEstimateOutput {
    return estimate;
  }

  private uncoveredLine(
    ingredient: NutritionRevisionRecord['ingredients'][number],
    reason: string,
  ): EstimateLine {
    return {
      id: null,
      recipeIngredientId: ingredient.id,
      ingredientId: ingredient.ingredientId,
      position: ingredient.position,
      displayName: ingredient.displayName,
      origin: NutritionValueOrigin.CANONICAL_CALCULATED,
      normalizedRawGrams: null,
      edibleRawGrams: null,
      yieldFactor: null,
      cookedGrams: null,
      nutrients: [],
      sourceVersions: [],
      assumptions: [
        {
          code: reason,
          message: 'Ingredient could not be fully covered by reviewed food data.',
          origin: NutritionValueOrigin.CANONICAL_CALCULATED,
        },
      ],
      confidence: 0,
      uncertainty: { uncovered: true },
      uncoveredReason: reason,
    };
  }

  private notFound() {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Khong tim thay recipe' });
  }

  private forbiddenOrNotFound() {
    return new AppError({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Ban khong co quyen tinh lai recipe nay',
    });
  }
}

function normalizeMass(
  amount: number,
  unit: string,
  profile: Awaited<ReturnType<RecipeNutritionRepository['findNutritionInputs']>>['profiles'][number],
): number | null {
  const normalizedUnit = unit.trim().toLowerCase();
  const direct = MASS_UNITS.get(normalizedUnit);
  if (direct !== undefined) return amount * direct;
  const conversion = profile.householdConversions.find(
    (item) =>
      item.unitName.toLowerCase() === normalizedUnit ||
      item.unitSymbol?.toLowerCase() === normalizedUnit,
  );
  if (!conversion) return null;
  return (amount / Number(conversion.quantity)) * Number(conversion.grams);
}

function positions(value: Prisma.JsonValue): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 0)
    : [];
}

function bestYield(
  values: Awaited<ReturnType<RecipeNutritionRepository['findNutritionInputs']>>['methods'][number]['yields'],
  ingredientId: string,
): { factor: number; sourceCode: string; sourceVersion: string; sourceRecordId: string } | null {
  const exact = values.find((value) => value.ingredientId === ingredientId);
  const generic = values.find((value) => value.ingredientId === null);
  const value = exact ?? generic;
  return value
    ? {
        factor: Number(value.factor),
        sourceCode: value.source.code,
        sourceVersion: value.sourceVersion,
        sourceRecordId: value.sourceRecordId,
      }
    : null;
}

function bestRetention(
  values: Awaited<ReturnType<RecipeNutritionRepository['findNutritionInputs']>>['methods'][number]['retentions'],
  nutrientId: string,
  nutrientCode: string,
  aiSuggestion: RecipeNutritionFallbackSuggestion | null,
) {
  const value = values.find((retention) => retention.nutrientId === nutrientId);
  if (value) {
    return {
      factor: Number(value.factor),
      origin: NutritionValueOrigin.CANONICAL_CALCULATED,
      confidence: 0.95,
    };
  }
  const ai = aiSuggestion?.retentionFactors.find((suggestion) => suggestion.nutrientCode === nutrientCode);
  return ai
    ? {
        factor: ai.factor,
        origin: NutritionValueOrigin.AI_ESTIMATED,
        confidence: ai.confidence,
      }
    : {
        factor: 1,
        origin: NutritionValueOrigin.CANONICAL_CALCULATED,
        confidence: 0.8,
      };
}

function aggregate(lines: EstimateLine[], divisor: number): NutrientAmount[] {
  const totals = new Map<string, NutrientAmount>();
  for (const nutrient of lines.flatMap((line) => line.nutrients)) {
    const key = `${nutrient.nutrientCode}:${nutrient.unit}`;
    const current = totals.get(key);
    if (!current) {
      totals.set(key, { ...nutrient, amount: nutrient.amount / divisor });
      continue;
    }
    current.amount += nutrient.amount / divisor;
    current.confidence = Math.min(current.confidence, nutrient.confidence);
    current.origin =
      current.origin === NutritionValueOrigin.AI_ESTIMATED ||
      nutrient.origin === NutritionValueOrigin.AI_ESTIMATED
        ? NutritionValueOrigin.AI_ESTIMATED
        : NutritionValueOrigin.CANONICAL_CALCULATED;
    current.min =
      current.min === null || nutrient.min === null
        ? null
        : current.min + nutrient.min / divisor;
    current.max =
      current.max === null || nutrient.max === null
        ? null
        : current.max + nutrient.max / divisor;
  }
  return [...totals.values()].map((nutrient) => ({
    ...nutrient,
    amount: round(nutrient.amount),
    min: nutrient.min === null ? null : round(nutrient.min),
    max: nutrient.max === null ? null : round(nutrient.max),
  }));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function validConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateAiSuggestion(
  suggestion: RecipeNutritionFallbackSuggestion,
  stepPositions: Set<number>,
  ingredientPositions: Set<number>,
  cookingMethodCodes: Set<string>,
): RecipeNutritionFallbackSuggestion {
  const stepMethods = Array.isArray(suggestion.stepMethods) ? suggestion.stepMethods : [];
  const yieldFactors = Array.isArray(suggestion.yieldFactors) ? suggestion.yieldFactors : [];
  const retentionFactors = Array.isArray(suggestion.retentionFactors)
    ? suggestion.retentionFactors
    : [];
  return {
    stepMethods: stepMethods.filter(
      (item) =>
        typeof item.stepPosition === 'number' &&
        typeof item.cookingMethodCode === 'string' &&
        typeof item.confidence === 'number' &&
        typeof item.assumption === 'string' &&
        stepPositions.has(item.stepPosition) &&
        cookingMethodCodes.has(item.cookingMethodCode) &&
        validConfidence(item.confidence) &&
        item.assumption.trim().length > 0,
    ),
    yieldFactors: yieldFactors.filter(
      (item) =>
        typeof item.ingredientPosition === 'number' &&
        typeof item.factor === 'number' &&
        typeof item.confidence === 'number' &&
        typeof item.assumption === 'string' &&
        ingredientPositions.has(item.ingredientPosition) &&
        Number.isFinite(item.factor) &&
        item.factor > 0 &&
        item.factor <= 5 &&
        validConfidence(item.confidence) &&
        item.assumption.trim().length > 0,
    ),
    retentionFactors: retentionFactors.filter(
      (item) =>
        typeof item.nutrientCode === 'string' &&
        typeof item.cookingMethodCode === 'string' &&
        typeof item.factor === 'number' &&
        typeof item.confidence === 'number' &&
        typeof item.assumption === 'string' &&
        item.nutrientCode.trim().length > 0 &&
        cookingMethodCodes.has(item.cookingMethodCode) &&
        Number.isFinite(item.factor) &&
        item.factor >= 0 &&
        item.factor <= 1 &&
        validConfidence(item.confidence) &&
        item.assumption.trim().length > 0,
    ),
  };
}
