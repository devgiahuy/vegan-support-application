import { createHash } from 'node:crypto';
import {
  FoodDataQuality,
  PantryConversionStatus,
  ReceiptCandidateStatus,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { uniqueAssetIdsByContent } from '../../common/media/asset-dedup.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import type { ReceiptExtractionProvider, ReceiptProviderImageResult } from './receipt.provider.js';
import {
  ReceiptConflictError,
  type ConversionSnapshot,
  type ReceiptJobRecord,
  type ReceiptRepository,
  ReceiptVersionConflictError,
} from './receipt.repository.js';
import type {
  AddReceiptImagesInput,
  ConfirmReceiptJobInput,
  CreateReceiptJobInput,
  RetryReceiptJobInput,
  ShoppingGapPreviewInput,
  UpdateReceiptCandidateInput,
} from './receipt.schemas.js';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const OPENAI_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MASS_UNITS = new Map<string, number>([
  ['mg', 0.001],
  ['g', 1],
  ['gram', 1],
  ['grams', 1],
  ['kg', 1000],
  ['kilogram', 1000],
  ['kilograms', 1000],
]);

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function number(value: number | null): number | null {
  return value === null ? null : typeof value === 'number' ? value : value;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function qualityConfidence(quality: FoodDataQuality): number {
  if (quality === FoodDataQuality.VERIFIED) return 1;
  if (quality === FoodDataQuality.REVIEWED) return 0.9;
  if (quality === FoodDataQuality.ESTIMATED) return 0.7;
  return 0.5;
}

interface SourceMeal {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  name: string;
  servings: number;
}

interface RequiredLine {
  ingredientId: string | null;
  name: string;
  amount: number;
  unit: string;
  sourceMeal: SourceMeal;
}

export class ReceiptService {
  constructor(
    private readonly repository: ReceiptRepository,
    private readonly provider: ReceiptExtractionProvider,
    private readonly config: AppConfig,
  ) {}

  async create(ownerId: string, input: CreateReceiptJobInput) {
    this.ensureEnabled();
    if (input.imageAssetIds.length > this.config.receipt.maxImages) throw this.imageLimit();
    const byId = await this.loadValidAssets(ownerId, input.imageAssetIds);
    // The same photo uploaded twice is stored as two assets; analyse its content only once.
    const assetIds = uniqueAssetIdsByContent(input.imageAssetIds, byId);
    const requestHash = sha256({ imageAssetIds: input.imageAssetIds });
    const result = await this.repository.createJob({
      ownerId,
      assetIds,
      provider: this.provider.name,
      modelId: this.provider.model,
      templateVersion: this.provider.templateVersion,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    });
    if (!result.created && result.job.requestHash !== requestHash) {
      throw new AppError({
        statusCode: 409,
        code: 'RECEIPT_IDEMPOTENCY_CONFLICT',
        message: 'The idempotency key was already used with different receipt images.',
      });
    }
    if (result.created) this.schedule(ownerId, result.job.id);
    return this.serializeJob(result.job);
  }

  /**
   * Adds more photos to a reviewable job. Lines read from them are merged into the existing
   * candidates (repeated lines collapse, nothing already read or edited is lost).
   */
  async addImages(ownerId: string, id: string, input: AddReceiptImagesInput) {
    this.ensureEnabled();
    const job = await this.repository.findOwnedJob(ownerId, id);
    if (!job) throw this.notFound();
    const byId = await this.loadValidAssets(ownerId, input.imageAssetIds);
    const attached = new Set(job.inputs.map((item) => item.assetId));
    const assetIds = uniqueAssetIdsByContent(
      input.imageAssetIds.filter((assetId) => !attached.has(assetId)),
      byId,
      job.inputs.map((item) => item.asset.providerEtag),
    );
    if (job.inputs.length + assetIds.length > this.config.receipt.maxImages)
      throw this.imageLimit();
    try {
      const result = await this.repository.appendInputs(ownerId, id, assetIds);
      if (!result) throw this.notFound();
      if (result.queued) this.schedule(ownerId, id);
      return this.serializeJob(result.job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async get(ownerId: string, id: string) {
    const job = await this.repository.findOwnedJob(ownerId, id);
    if (!job) throw this.notFound();
    if (job.status === 'QUEUED') this.schedule(ownerId, id);
    return this.serializeJob(job);
  }

  async updateCandidate(
    ownerId: string,
    jobId: string,
    candidateId: string,
    input: UpdateReceiptCandidateInput,
  ) {
    const job = await this.repository.findOwnedJob(ownerId, jobId);
    if (!job) throw this.notFound();
    const current = job.candidates.find((candidate) => candidate.id === candidateId);
    if (!current) throw this.notFound();
    let ingredientId = current.ingredientId;
    let detectedName = input.detectedName ?? current.detectedName;
    let normalizedName = normalizeVietnameseText(detectedName);
    let matchConfidence = number(current.matchConfidence);
    if (input.ingredientId !== undefined) {
      ingredientId = input.ingredientId;
      if (ingredientId) {
        const ingredient = await this.repository.resolveIngredientById(ingredientId);
        if (!ingredient)
          throw this.validation(
            'RECEIPT_INGREDIENT_INVALID',
            'The selected ingredient is not active.',
          );
        detectedName = ingredient.canonicalName;
        normalizedName = normalizeVietnameseText(ingredient.canonicalName);
        matchConfidence = 1;
      } else matchConfidence = null;
    }
    if (!normalizedName)
      throw this.validation(
        'RECEIPT_CANDIDATE_INVALID',
        'Candidate name must contain letters or numbers.',
      );
    const quantity = input.quantity === undefined ? number(current.quantity) : input.quantity;
    const unit = input.unit === undefined ? current.unit : input.unit;
    if ((quantity === null) !== (unit === null)) {
      throw this.validation(
        'RECEIPT_QUANTITY_INCOMPLETE',
        'Quantity and unit must both be provided or both be empty.',
      );
    }
    const data: Prisma.ReceiptCandidateUncheckedUpdateManyInput = {
      ingredientId,
      detectedName,
      normalizedName,
      matchConfidence,
      quantity,
      unit,
      status:
        input.decision === 'REJECT'
          ? ReceiptCandidateStatus.REJECTED
          : ReceiptCandidateStatus.EDITED,
      ...(input.decision === 'REJECT' ? {} : { editedByUser: true }),
      ...(input.lineText !== undefined ? { lineText: input.lineText } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.lineTotal !== undefined ? { lineTotal: input.lineTotal } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
      ...(input.uncertaintyNote !== undefined ? { uncertaintyNote: input.uncertaintyNote } : {}),
    };
    try {
      const updated = await this.repository.updateCandidate(
        ownerId,
        jobId,
        candidateId,
        input.expectedVersion,
        data,
      );
      if (!updated) throw this.notFound();
      return this.serializeJob(updated);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async confirm(ownerId: string, jobId: string, input: ConfirmReceiptJobInput) {
    const job = await this.repository.findOwnedJob(ownerId, jobId);
    if (!job) throw this.notFound();
    const selected = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
    const candidates = [];
    for (const candidate of job.candidates.filter((item) => selected.has(item.id))) {
      if (
        candidate.status === ReceiptCandidateStatus.REJECTED &&
        candidate.aiClassification === 'NON_FOOD'
      ) {
        throw new AppError({
          statusCode: 409,
          code: 'RECEIPT_CANDIDATE_EXCLUDED',
          message: 'Mặt hàng này đã được loại vì không phải thực phẩm. Hãy khôi phục trước khi xác nhận.',
        });
      }
      if (candidate.quantity === null || !candidate.unit) {
        throw new AppError({
          statusCode: 422,
          code: 'RECEIPT_CANDIDATE_INCOMPLETE',
          message: 'Vui lòng bổ sung đầy đủ số lượng và đơn vị cho các mục được chọn.',
        });
      }
      candidates.push({
        id: candidate.id,
        expectedVersion: selected.get(candidate.id)!.expectedVersion,
        conversion: await this.resolveConversion(
          candidate.ingredientId,
          candidate.quantity,
          candidate.unit,
        ),
      });
    }
    const requestHash = sha256({
      jobId,
      candidates: input.candidates,
      receiptReviewDecision: input.receiptReviewDecision ?? null,
    });
    try {
      const result = await this.repository.confirm({
        ownerId,
        jobId,
        candidates,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        receiptReviewDecision: input.receiptReviewDecision ?? null,
      });
      const pantryByCandidate = new Map(
        result.job.candidates.map((candidate) => [candidate.id, candidate.pantryItem]),
      );
      return {
        job: this.serializeJob(result.job),
        duplicateCandidates: result.duplicates,
        pantryChanges: result.changes.map((change) => {
          const item = pantryByCandidate.get(change.candidateId);
          if (!item) throw new Error('Confirmed receipt candidate is missing its pantry item');
          return {
            candidateId: change.candidateId,
            action: change.action,
            pantryItem: {
              id: item.id,
              ingredient: item.ingredient
                ? { id: item.ingredient.id, name: item.ingredient.canonicalName }
                : null,
              unmatchedText: item.unmatchedText ?? null,
              quantity: item.quantity,
              unit: item.unit,
              source: item.source,
              confidence: item.confidence,
              confirmationStatus: item.confirmationStatus,
              purchasedAt: item.purchasedAt?.toISOString().slice(0, 10) ?? null,
              version: item.version,
            },
          };
        }),
      };
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async cancel(ownerId: string, id: string) {
    try {
      const job = await this.repository.cancel(ownerId, id);
      if (!job) throw this.notFound();
      return this.serializeJob(job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async retry(ownerId: string, id: string, input: RetryReceiptJobInput) {
    this.ensureEnabled();
    try {
      const result = await this.repository.queueRetry(
        ownerId,
        id,
        input.idempotencyKey,
        sha256({ id }),
      );
      if (!result) throw this.notFound();
      if (!result.replay) this.schedule(ownerId, id);
      return this.serializeJob(result.job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async process(ownerId: string, id: string): Promise<void> {
    const job = await this.repository.startProcessing(ownerId, id);
    if (!job) return;
    if (
      job.provider !== this.provider.name ||
      job.modelId !== this.provider.model ||
      job.templateVersion !== this.provider.templateVersion
    ) {
      await this.repository.markFailed(job.id, job.attemptCount);
      return;
    }
    try {
      const results = await this.provider.extract(
        job.inputs
          .filter((input) => input.status === 'PENDING')
          .map((input) => ({
            id: input.id,
            position: input.position,
            url: input.asset.secureUrl,
          })),
      );
      const successful = results.filter((result) => !result.error);
      const bestMetadata = successful
        .filter((result) => result.metadataConfidence !== null)
        .sort((left, right) => (right.metadataConfidence ?? 0) - (left.metadataConfidence ?? 0))[0];
      const candidates = await this.mapProviderLines(results);
      await this.repository.saveResults({
        jobId: job.id,
        expectedAttempt: job.attemptCount,
        inputs: results.map((result) => ({
          inputId: result.inputId,
          error: result.error,
          receiptNumber: result.receiptNumber,
          merchantName: result.merchantName,
          purchasedAt: result.purchasedAt ? new Date(`${result.purchasedAt}T00:00:00.000Z`) : null,
          currency: result.currency,
          totalAmount: result.totalAmount,
        })),
        candidates,
        metadata: {
          merchantName: bestMetadata?.merchantName ?? null,
          purchasedAt: bestMetadata?.purchasedAt
            ? new Date(`${bestMetadata.purchasedAt}T00:00:00.000Z`)
            : null,
          currency: bestMetadata?.currency ?? null,
          totalAmount: bestMetadata?.totalAmount ?? null,
          confidence: bestMetadata?.metadataConfidence ?? null,
        },
      });
    } catch {
      await this.repository.markFailed(job.id, job.attemptCount);
    }
  }

  async shoppingGap(ownerId: string, input: ShoppingGapPreviewInput) {
    const recipeSelections = input.meals.filter((meal) => meal.sourceType === 'RECIPE');
    const customSelections = input.meals.filter((meal) => meal.sourceType === 'CUSTOM_MEAL');
    const [recipes, customMeals] = await Promise.all([
      this.repository.findPublishedRecipes(recipeSelections.map((meal) => meal.recipeId)),
      this.repository.findOwnedCustomMeals(
        ownerId,
        customSelections.map((meal) => meal.customMealId),
      ),
    ]);
    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    const customById = new Map(customMeals.map((meal) => [meal.id, meal]));
    if (
      recipeSelections.some((selection) => !recipeById.has(selection.recipeId)) ||
      customSelections.some((selection) => !customById.has(selection.customMealId))
    ) {
      throw new AppError({
        statusCode: 404,
        code: 'SHOPPING_MEAL_NOT_FOUND',
        message: 'A selected meal is unavailable or not owned by the current user.',
      });
    }
    const lines: RequiredLine[] = [];
    for (const selection of recipeSelections) {
      const recipe = recipeById.get(selection.recipeId)!;
      const revision = recipe.publishedRevision!;
      const baseServings = revision.recipeDetail?.servings ?? 1;
      const sourceMeal: SourceMeal = {
        sourceType: 'RECIPE',
        id: recipe.id,
        name: revision.title,
        servings: selection.servings,
      };
      for (const ingredient of revision.ingredients) {
        lines.push({
          ingredientId: ingredient.ingredientId,
          name: ingredient.ingredient?.canonicalName ?? ingredient.displayName,
          amount: Number(ingredient.amount) * (selection.servings / baseServings),
          unit: ingredient.unit,
          sourceMeal,
        });
      }
    }
    for (const selection of customSelections) {
      const meal = customById.get(selection.customMealId)!;
      const sourceMeal: SourceMeal = {
        sourceType: 'CUSTOM_MEAL',
        id: meal.id,
        name: meal.name,
        servings: selection.servings,
      };
      for (const ingredient of meal.ingredients) {
        lines.push({
          ingredientId: ingredient.ingredientId,
          name: ingredient.ingredient?.canonicalName ?? ingredient.displayName,
          amount: Number(ingredient.amount) * (selection.servings / meal.servings),
          unit: ingredient.unit,
          sourceMeal,
        });
      }
    }
    const unresolvedItems: Array<{
      name: string;
      required: { value: number; unit: string };
      reasonCode: 'INGREDIENT_UNRESOLVED' | 'REVIEWED_CONVERSION_UNAVAILABLE';
      explanation: string;
      sourceMeals: SourceMeal[];
    }> = [];
    const groups = new Map<
      string,
      {
        ingredient: { id: string; name: string };
        required: number;
        confidence: number;
        assumptions: Set<string>;
        sourceMeals: Map<string, SourceMeal>;
      }
    >();
    for (const line of lines) {
      if (!line.ingredientId) {
        unresolvedItems.push({
          name: line.name,
          required: { value: Number(line.amount.toFixed(4)), unit: line.unit },
          reasonCode: 'INGREDIENT_UNRESOLVED',
          explanation: 'Nguyên liệu trong bữa ăn này chưa có định danh nguyên liệu chuẩn.',
          sourceMeals: [line.sourceMeal],
        });
        continue;
      }
      const conversion = await this.resolveConversion(line.ingredientId, line.amount, line.unit);
      if (conversion.normalizedGrams === null) {
        unresolvedItems.push({
          name: line.name,
          required: { value: Number(line.amount.toFixed(4)), unit: line.unit },
          reasonCode: 'REVIEWED_CONVERSION_UNAVAILABLE',
          explanation: `Chưa có quy đổi đã được duyệt từ ${line.unit} sang gam.`,
          sourceMeals: [line.sourceMeal],
        });
        continue;
      }
      const group = groups.get(line.ingredientId) ?? {
        ingredient: { id: line.ingredientId, name: line.name },
        required: 0,
        confidence: 1,
        assumptions: new Set<string>(),
        sourceMeals: new Map<string, SourceMeal>(),
      };
      group.required += conversion.normalizedGrams;
      group.confidence = Math.min(group.confidence, conversion.confidence ?? 0.5);
      group.assumptions.add(
        conversion.source === 'SYSTEM_MASS'
          ? `${line.amount} ${line.unit} được quy đổi theo UCUM-MASS-V1.`
          : `${line.amount} ${line.unit} được quy đổi theo nguồn đã duyệt ${conversion.source ?? 'dữ liệu thực phẩm'} ${conversion.version ?? ''}.`.trim(),
      );
      group.sourceMeals.set(`${line.sourceMeal.sourceType}:${line.sourceMeal.id}`, line.sourceMeal);
      groups.set(line.ingredientId, group);
    }
    const pantry = await this.repository.findConfirmedPantry(ownerId, [...groups.keys()]);
    // Free-text stock counts only when its normalized name exactly matches the canonical name
    // or an approved alias of a required ingredient; there is no fuzzy matching.
    const freeTextMatches = await this.repository.resolveIngredients(
      pantry.flatMap((item) =>
        !item.ingredientId && item.normalizedUnmatchedText ? [item.normalizedUnmatchedText] : [],
      ),
    );
    const today = todayUtc();
    const pantryByIngredient = new Map<
      string,
      Array<{
        normalizedGrams: number | null;
        confidence: number;
        freeText: boolean;
        expired: boolean;
      }>
    >();
    for (const item of pantry) {
      const ingredientId =
        item.ingredientId ??
        (item.normalizedUnmatchedText
          ? freeTextMatches.get(item.normalizedUnmatchedText)
          : undefined);
      if (!ingredientId || !groups.has(ingredientId)) continue;
      let normalizedGrams = item.normalizedGrams === null ? null : Number(item.normalizedGrams);
      let confidence = item.conversionConfidence ?? item.confidence;
      if (normalizedGrams === null && !item.ingredientId) {
        const conversion = await this.resolveConversion(ingredientId, item.quantity, item.unit);
        normalizedGrams = conversion.normalizedGrams;
        confidence = Math.min(item.confidence, conversion.confidence ?? 0.5);
      }
      const items = pantryByIngredient.get(ingredientId) ?? [];
      items.push({
        normalizedGrams,
        confidence,
        freeText: !item.ingredientId,
        expired: item.expiresAt !== null && item.expiresAt < today,
      });
      pantryByIngredient.set(ingredientId, items);
    }
    const items = [...groups.values()].map((group) => {
      const stock = pantryByIngredient.get(group.ingredient.id) ?? [];
      const inventory = stock.filter((item) => !item.expired);
      const convertible = inventory.filter((item) => item.normalizedGrams !== null);
      const unavailableCount = inventory.length - convertible.length;
      const expiredCount = stock.length - inventory.length;
      const freeTextCount = convertible.filter((item) => item.freeText).length;
      const available = convertible.reduce((sum, item) => sum + (item.normalizedGrams ?? 0), 0);
      const required = Number(group.required.toFixed(4));
      if (unavailableCount) {
        group.assumptions.add(
          `${String(unavailableCount)} mục kho đã xác nhận không được tính vì chưa có quy đổi sang gam đã được duyệt.`,
        );
        group.confidence = Math.min(group.confidence, 0.5);
      }
      if (expiredCount)
        group.assumptions.add(
          `${String(expiredCount)} mục kho đã quá hạn sử dụng nên không được tính là có sẵn.`,
        );
      if (freeTextCount)
        group.assumptions.add(
          `${String(freeTextCount)} mục kho nhập tự do được tính vì tên trùng khớp với tên chuẩn hoặc tên gọi khác đã duyệt của ${group.ingredient.name}.`,
        );
      for (const item of convertible)
        group.confidence = Math.min(group.confidence, item.confidence);
      return {
        ingredient: group.ingredient,
        required: { value: required, unit: 'g' },
        available: { value: Number(available.toFixed(4)), unit: 'g' },
        missing: { value: Number(Math.max(required - available, 0).toFixed(4)), unit: 'g' },
        surplus: { value: Number(Math.max(available - required, 0).toFixed(4)), unit: 'g' },
        confidence: Number(group.confidence.toFixed(4)),
        conversionAssumptions: [...group.assumptions],
        sourceMeals: [...group.sourceMeals.values()],
      };
    });
    const pantryAsOf = new Date().toISOString();
    return {
      items: items.sort((left, right) => left.ingredient.name.localeCompare(right.ingredient.name)),
      unresolvedItems,
      summary: {
        selectedMealCount: input.meals.length,
        readyItemCount: items.length,
        missingItemCount: items.filter((item) => item.missing.value > 0).length,
        unresolvedItemCount: unresolvedItems.length,
      },
      pantryAsOf,
    };
  }

  private async mapProviderLines(results: ReceiptProviderImageResult[]) {
    const candidates = [];
    for (const result of results) {
      if (result.error) continue;
      for (const line of result.lines) {
        const normalizedName = normalizeVietnameseText(line.name);
        if (!normalizedName) continue;
        const excluded = line.classification === 'NON_FOOD';
        const ingredient = excluded
          ? null
          : await this.repository.resolveIngredient(normalizedName);
        const uncertaintyNote =
          line.classification === 'UNCERTAIN'
            ? [
                line.uncertaintyNote,
                'Chưa chắc mặt hàng này là thực phẩm; vui lòng kiểm tra trước khi xác nhận.',
              ]
                .filter(Boolean)
                .join(' ')
            : line.uncertaintyNote;
        candidates.push({
          inputId: result.inputId,
          ingredientId: ingredient?.id ?? null,
          lineText: line.lineText,
          detectedName: ingredient?.canonicalName ?? line.name,
          normalizedName: ingredient
            ? normalizeVietnameseText(ingredient.canonicalName)
            : normalizedName,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          currency: line.currency,
          confidence: line.confidence,
          matchConfidence: ingredient ? 0.9 : null,
          uncertaintyNote,
          aiClassification: line.classification,
          classificationConfidence: line.classificationConfidence,
          classificationReason: excluded
            ? line.classificationReason ?? 'Mặt hàng này không phải thực phẩm.'
            : line.classificationReason,
          status: excluded ? ReceiptCandidateStatus.REJECTED : ReceiptCandidateStatus.PROPOSED,
        });
      }
    }
    return candidates;
  }

  private async resolveConversion(
    ingredientId: string | null,
    quantity: number,
    unit: string,
  ): Promise<ConversionSnapshot> {
    const normalizedUnit = unit.trim().toLowerCase();
    const massFactor = MASS_UNITS.get(normalizedUnit);
    if (massFactor !== undefined) {
      return {
        normalizedGrams: quantity * massFactor,
        status: PantryConversionStatus.CONVERTED,
        source: 'SYSTEM_MASS',
        version: 'UCUM-MASS-V1',
        confidence: 1,
      };
    }
    if (!ingredientId)
      return {
        normalizedGrams: null,
        status: PantryConversionStatus.UNKNOWN,
        source: null,
        version: null,
        confidence: null,
      };
    const profiles = await this.repository.findReviewedConversions(ingredientId);
    for (const profile of profiles) {
      const conversion = profile.householdConversions.find(
        (item) =>
          item.unitName.toLowerCase() === normalizedUnit ||
          item.unitSymbol?.toLowerCase() === normalizedUnit,
      );
      if (!conversion) continue;
      return {
        normalizedGrams: (quantity / conversion.quantity) * conversion.grams,
        status: PantryConversionStatus.CONVERTED,
        source: profile.source.code,
        version: profile.sourceVersion,
        confidence: qualityConfidence(conversion.quality),
      };
    }
    return {
      normalizedGrams: null,
      status: PantryConversionStatus.UNKNOWN,
      source: null,
      version: null,
      confidence: null,
    };
  }

  private serializeJob(job: ReceiptJobRecord) {
    const excluded = job.candidates.filter(
      (candidate) =>
        candidate.status === ReceiptCandidateStatus.REJECTED &&
        candidate.aiClassification === 'NON_FOOD',
    );
    return {
      id: job.id,
      status: job.status,
      progress: {
        completedImages: job.inputs.filter((input) => input.status !== 'PENDING').length,
        totalImages: job.inputs.length,
      },
      receipt: {
        merchantName: job.merchantName ?? null,
        purchasedAt: job.purchasedAt?.toISOString().slice(0, 10) ?? null,
        currency: job.currency?.trim() ?? null,
        totalAmount: number(job.totalAmount),
        confidence: number(job.metadataConfidence),
      },
      reviewRequired: job.reviewRequired,
      identityDecisionRequired: job.identityDecisionRequired,
      receiptReviewDecision: job.receiptReviewDecision,
      notices: excluded.length
        ? [{
            code: 'RECEIPT_NON_FOOD_ITEMS_EXCLUDED' as const,
            message: `Đã loại ${excluded.length} mặt hàng không phải thực phẩm. Bạn có thể xem và khôi phục nếu cần.`,
            count: excluded.length,
          }]
        : [],
      excludedItems: excluded.map((candidate) => ({
        id: candidate.id,
        imageId: candidate.input.id,
        lineText: candidate.lineText,
        name: candidate.detectedName,
        reason: candidate.classificationReason ?? 'Mặt hàng không phải thực phẩm.',
        confidence: number(candidate.classificationConfidence) ?? 0,
        version: candidate.version,
      })),
      images: job.inputs.map((input) => ({
        id: input.id,
        position: input.position,
        url: input.asset.secureUrl,
        status: input.status,
        receiptNumber: input.receiptNumber,
        merchantName: input.merchantName,
        purchasedAt: input.purchasedAt?.toISOString().slice(0, 10) ?? null,
        currency: input.currency,
        totalAmount: number(input.totalAmount),
        issue: input.errorMessage ?? null,
      })),
      candidates: job.candidates
        .filter((candidate) => !excluded.some((item) => item.id === candidate.id))
        .map((candidate) => ({
        id: candidate.id,
        imageId: candidate.input.id,
        lineText: candidate.lineText,
        name: candidate.detectedName,
        ingredientSuggestion: candidate.ingredient
          ? {
              id: candidate.ingredient.id,
              name: candidate.ingredient.canonicalName,
              confidence: number(candidate.matchConfidence) ?? 0,
            }
          : null,
        quantity: { value: number(candidate.quantity), unit: candidate.unit ?? null },
        pricing: {
          unitPrice: number(candidate.unitPrice),
          lineTotal: number(candidate.lineTotal),
          currency: candidate.currency?.trim() ?? null,
        },
        confidence: number(candidate.confidence) ?? 0,
        uncertaintyNote: candidate.uncertaintyNote ?? null,
        aiClassification: candidate.aiClassification,
        classificationReason: candidate.classificationReason,
        classificationConfidence: number(candidate.classificationConfidence),
        status: candidate.status,
        duplicateOfJobId: candidate.duplicateOfJobId,
        version: candidate.version,
        })),
      attempt: job.attemptCount,
      issue: job.errorCode
        ? { code: job.errorCode, message: job.errorMessage ?? 'Không thể hoàn tất đọc hóa đơn.' }
        : null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt: job.processingCompletedAt?.toISOString() ?? null,
      confirmedAt: job.confirmedAt?.toISOString() ?? null,
    };
  }

  private schedule(ownerId: string, id: string): void {
    setImmediate(() => void this.process(ownerId, id).catch(() => undefined));
  }

  private ensureEnabled(): void {
    if (!this.config.receipt.enabled) {
      throw new AppError({
        statusCode: 503,
        code: 'RECEIPT_PROVIDER_UNAVAILABLE',
        message: 'Receipt extraction is currently disabled.',
      });
    }
  }

  private async loadValidAssets(ownerId: string, assetIds: string[]) {
    const assets = await this.repository.findOwnedAssets(ownerId, assetIds);
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    if (assets.length !== assetIds.length) throw this.invalidImage();
    const allowedTypes =
      this.config.receipt.provider === 'openai' ? OPENAI_IMAGE_MIME_TYPES : IMAGE_MIME_TYPES;
    for (const id of assetIds) {
      const asset = byId.get(id);
      if (
        !asset?.mimeType ||
        !allowedTypes.has(asset.mimeType) ||
        asset.bytes > BigInt(this.config.receipt.maxImageBytes)
      ) {
        throw this.invalidImage();
      }
    }
    return byId;
  }

  private imageLimit(): AppError {
    return new AppError({
      statusCode: 422,
      code: 'RECEIPT_IMAGE_LIMIT_EXCEEDED',
      message: `A receipt job accepts at most ${String(this.config.receipt.maxImages)} images.`,
    });
  }

  private invalidImage(): AppError {
    return this.validation(
      'RECEIPT_IMAGE_INVALID',
      'Every image must be an owned, committed receipt image with a supported type and size.',
    );
  }

  private validation(code: string, message: string): AppError {
    return new AppError({ statusCode: 422, code, message });
  }

  private notFound(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'RECEIPT_JOB_NOT_FOUND',
      message: 'Receipt job was not found.',
    });
  }

  private mapConflict(error: unknown): Error {
    if (error instanceof AppError) return error;
    if (error instanceof ReceiptVersionConflictError) {
      return new AppError({
        statusCode: 409,
        code: 'RECEIPT_VERSION_CONFLICT',
        message: 'Receipt candidate changed; refresh before continuing.',
      });
    }
    if (error instanceof ReceiptConflictError) {
      return new AppError({
        statusCode: 409,
        code: 'RECEIPT_STATE_CONFLICT',
        message: 'Receipt job is not in a state that permits this action.',
      });
    }
    return error instanceof Error ? error : new Error('Unknown receipt error');
  }
}
