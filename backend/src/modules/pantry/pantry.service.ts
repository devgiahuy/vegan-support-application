import { createHash } from 'node:crypto';
import { FoodDataQuality, PantryAdjustmentType, PantryConversionStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import type {
  AdjustmentListQuery,
  CreateAdjustmentInput,
  CreatePantryItemInput,
  ExpiringSoonQuery,
  MergePantryItemsInput,
  MergePreviewInput,
  PantryListQuery,
  UpdatePantryItemInput,
} from './pantry.schemas.js';
import {
  PantryIdempotencyConflictError,
  PantryItemNotFoundError,
  PantryMergeConflictError,
  PantryNegativeQuantityError,
  PantryVersionConflictError,
  type ConversionSnapshot,
  type PantryAdjustmentRecord,
  type PantryItemRecord,
  type PantryRepository,
} from './pantry.repository.js';

const MASS_UNITS = new Map<string, number>([
  ['mg', 0.001],
  ['milligram', 0.001],
  ['milligrams', 0.001],
  ['g', 1],
  ['gram', 1],
  ['grams', 1],
  ['kg', 1000],
  ['kilogram', 1000],
  ['kilograms', 1000],
]);

function number(value: { toNumber(): number } | number | null): number | null {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

function dateOnly(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export function serializePantryItem(item: PantryItemRecord) {
  return {
    id: item.id,
    ingredient: item.ingredient
      ? { id: item.ingredient.id, name: item.ingredient.canonicalName }
      : null,
    unmatchedText: item.unmatchedText ?? null,
    quantity: number(item.quantity) ?? 0,
    unit: item.unit,
    conversion: {
      status: item.conversionStatus,
      normalizedGrams: number(item.normalizedGrams),
      source: item.conversionSource ?? null,
      version: item.conversionVersion ?? null,
      confidence: number(item.conversionConfidence),
    },
    source: item.source,
    confidence: number(item.confidence) ?? 0,
    confirmationStatus: item.confirmationStatus,
    purchasedAt: dateOnly(item.purchasedAt),
    openedAt: dateOnly(item.openedAt),
    expiresAt: dateOnly(item.expiresAt),
    freshnessNote: item.freshnessNote ?? null,
    version: item.version,
  };
}

export function serializePantryAdjustment(adjustment: PantryAdjustmentRecord) {
  return {
    id: adjustment.id,
    type: adjustment.type,
    input: { quantity: number(adjustment.inputQuantity) ?? 0, unit: adjustment.inputUnit },
    appliedDelta: {
      quantity: number(adjustment.appliedDeltaQuantity) ?? 0,
      normalizedGrams: number(adjustment.normalizedDeltaGrams),
    },
    balance: {
      beforeQuantity: number(adjustment.beforeQuantity) ?? 0,
      afterQuantity: number(adjustment.afterQuantity) ?? 0,
      beforeGrams: number(adjustment.beforeGrams),
      afterGrams: number(adjustment.afterGrams),
    },
    versionBefore: adjustment.versionBefore,
    versionAfter: adjustment.versionAfter,
    reason: adjustment.reason ?? null,
    mergedFromItemId: adjustment.mergedFromItemId ?? null,
    createdAt: adjustment.createdAt.toISOString(),
  };
}

export class PantryService {
  constructor(private readonly repository: PantryRepository) {}

  async list(ownerId: string, query: PantryListQuery) {
    const result = await this.repository.listOwned(ownerId, {
      page: query.page,
      limit: query.limit,
      includeZero: query.includeZero,
      ...(query.ingredientId ? { ingredientId: query.ingredientId } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.confirmationStatus ? { confirmationStatus: query.confirmationStatus } : {}),
      ...(query.conversionStatus ? { conversionStatus: query.conversionStatus } : {}),
      ...(query.search ? { normalizedSearch: normalizeVietnameseText(query.search) } : {}),
      ...(query.expiresFrom ? { expiresFrom: parseDate(query.expiresFrom) as Date } : {}),
      ...(query.expiresTo ? { expiresTo: parseDate(query.expiresTo) as Date } : {}),
    });
    return {
      data: result.records.map(serializePantryItem),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async expiringSoon(ownerId: string, query: ExpiringSoonQuery) {
    const from = query.asOf ? (parseDate(query.asOf) as Date) : todayUtc();
    const result = await this.repository.listExpiring(
      ownerId,
      from,
      addDays(from, query.days),
      query.page,
      query.limit,
    );
    return {
      data: result.records.map(serializePantryItem),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async get(ownerId: string, id: string) {
    const item = await this.repository.findOwned(ownerId, id);
    if (!item) throw this.notFound();
    return serializePantryItem(item);
  }

  async create(ownerId: string, input: CreatePantryItemInput) {
    if (input.ingredientId && !(await this.repository.findActiveIngredient(input.ingredientId))) {
      throw new AppError({
        statusCode: 422,
        code: 'PANTRY_INGREDIENT_INVALID',
        message: 'Ingredient is not active or does not exist',
      });
    }
    if (input.unmatchedText && !normalizeVietnameseText(input.unmatchedText)) {
      throw new AppError({
        statusCode: 422,
        code: 'PANTRY_UNMATCHED_TEXT_INVALID',
        message: 'Unmatched text must contain letters or numbers',
      });
    }
    this.validateDates(input.purchasedAt, input.openedAt, input.expiresAt);
    const conversion = await this.resolveConversion(input.ingredientId, input.quantity, input.unit);
    try {
      const result = await this.repository.create({
        ownerId,
        ...(input.ingredientId ? { ingredientId: input.ingredientId } : {}),
        ...(input.unmatchedText
          ? {
              unmatchedText: input.unmatchedText,
              normalizedUnmatchedText: normalizeVietnameseText(input.unmatchedText),
            }
          : {}),
        quantity: input.quantity,
        unit: input.unit,
        confidence: input.confidence,
        ...(input.purchasedAt !== undefined
          ? { purchasedAt: parseDate(input.purchasedAt) as Date | null }
          : {}),
        ...(input.openedAt !== undefined
          ? { openedAt: parseDate(input.openedAt) as Date | null }
          : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: parseDate(input.expiresAt) as Date | null }
          : {}),
        ...(input.freshnessNote ? { freshnessNote: input.freshnessNote } : {}),
        idempotencyKey: input.idempotencyKey,
        requestHash: sha256(input),
        conversion,
      });
      return {
        item: serializePantryItem(result.item),
        adjustment: serializePantryAdjustment(result.adjustment),
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async update(ownerId: string, id: string, input: UpdatePantryItemInput) {
    const current = await this.repository.findOwned(ownerId, id);
    if (!current) throw this.notFound();
    const purchasedAt =
      input.purchasedAt === undefined ? dateOnly(current.purchasedAt) : input.purchasedAt;
    const openedAt = input.openedAt === undefined ? dateOnly(current.openedAt) : input.openedAt;
    const expiresAt = input.expiresAt === undefined ? dateOnly(current.expiresAt) : input.expiresAt;
    this.validateDates(purchasedAt, openedAt, expiresAt);
    try {
      const item = await this.repository.update(ownerId, id, {
        expectedVersion: input.expectedVersion,
        requestHash: sha256(input),
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        ...(input.purchasedAt !== undefined
          ? { purchasedAt: parseDate(input.purchasedAt) as Date | null }
          : {}),
        ...(input.openedAt !== undefined
          ? { openedAt: parseDate(input.openedAt) as Date | null }
          : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: parseDate(input.expiresAt) as Date | null }
          : {}),
        ...(input.freshnessNote !== undefined ? { freshnessNote: input.freshnessNote } : {}),
      });
      if (!item) throw this.notFound();
      return serializePantryItem(item);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async adjust(ownerId: string, itemId: string, input: CreateAdjustmentInput) {
    const requestHash = sha256(input);
    const replay = await this.repository.findIdempotentResult(ownerId, input.idempotencyKey);
    if (replay) {
      if (
        replay.adjustment.requestHash !== requestHash ||
        replay.adjustment.pantryItemId !== itemId
      )
        throw this.mapError(new PantryIdempotencyConflictError());
      return {
        item: serializePantryItem(replay.item),
        adjustment: serializePantryAdjustment(replay.adjustment),
      };
    }
    const item = await this.repository.findOwned(ownerId, itemId);
    if (!item) throw this.notFound();
    const signedInput =
      input.type === PantryAdjustmentType.ADJUST
        ? input.deltaQuantity
        : input.quantity * (input.type === PantryAdjustmentType.CONSUME ? -1 : 1);
    const converted = await this.convertDelta(item, signedInput, input.unit);
    try {
      const result = await this.repository.adjust({
        ownerId,
        itemId,
        type: input.type,
        inputQuantity:
          input.type === PantryAdjustmentType.ADJUST ? input.deltaQuantity : input.quantity,
        inputUnit: input.unit,
        appliedDeltaQuantity: converted.quantity,
        normalizedDeltaGrams: converted.grams,
        expectedVersion: input.expectedVersion,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        ...(input.reason ? { reason: input.reason } : {}),
      });
      return {
        item: serializePantryItem(result.item),
        adjustment: serializePantryAdjustment(result.adjustment),
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async listAdjustments(ownerId: string, itemId: string, query: AdjustmentListQuery) {
    const result = await this.repository.listAdjustments(ownerId, itemId, query.page, query.limit);
    if (!result) throw this.notFound();
    return {
      data: result.records.map(serializePantryAdjustment),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async delete(ownerId: string, id: string, expectedVersion: number) {
    try {
      const result = await this.repository.softDelete(
        ownerId,
        id,
        expectedVersion,
        sha256({ id, expectedVersion }),
      );
      if (result === 'not-found') throw this.notFound();
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async mergePreview(ownerId: string, input: MergePreviewInput) {
    const items = await this.repository.findOwnedMany(ownerId, input.itemIds);
    if (items.length !== input.itemIds.length) throw this.notFound();
    return this.buildMergePreview(items);
  }

  async merge(ownerId: string, input: MergePantryItemsInput) {
    const requestHash = sha256(input);
    const replay = await this.repository.findIdempotentResult(ownerId, input.idempotencyKey);
    if (replay) {
      if (
        replay.adjustment.requestHash !== requestHash ||
        replay.adjustment.pantryItemId !== input.targetItemId ||
        replay.adjustment.type !== PantryAdjustmentType.MERGE_IN
      )
        throw this.mapError(new PantryIdempotencyConflictError());
      return serializePantryItem(replay.item);
    }
    const items = await this.repository.findOwnedMany(
      ownerId,
      input.items.map((item) => item.id),
    );
    if (items.length !== input.items.length) throw this.notFound();
    const preview = await this.buildMergePreview(items, input.targetItemId);
    if (!preview.canMerge)
      throw new AppError({
        statusCode: 422,
        code: 'PANTRY_MERGE_INCOMPATIBLE',
        message: preview.warnings.join('; '),
      });
    const target = items.find((item) => item.id === input.targetItemId);
    if (!target) throw this.notFound();
    const converted = await Promise.all(
      items.map(async (item) => {
        const amount =
          item.id === target.id
            ? { quantity: 0, grams: target.normalizedGrams === null ? null : 0 }
            : await this.convertDelta(target, number(item.quantity) ?? 0, item.unit, item);
        return {
          id: item.id,
          expectedVersion:
            input.items.find((expected) => expected.id === item.id)?.expectedVersion ??
            item.version,
          appliedQuantity: amount.quantity,
          normalizedGrams: amount.grams,
        };
      }),
    );
    try {
      const result = await this.repository.merge({
        ownerId,
        targetItemId: target.id,
        items: converted,
        idempotencyKey: input.idempotencyKey,
        requestHash,
      });
      return serializePantryItem(result);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private async buildMergePreview(items: PantryItemRecord[], targetId?: string) {
    const target = targetId ? items.find((item) => item.id === targetId) : items[0];
    if (!target) throw this.notFound();
    const sameIdentity = items.every((item) =>
      item.ingredientId
        ? item.ingredientId === target.ingredientId
        : item.normalizedUnmatchedText === target.normalizedUnmatchedText &&
          target.ingredientId === null,
    );
    const warnings: string[] = [];
    if (!sameIdentity)
      warnings.push('Items do not represent the same canonical ingredient or unmatched text');
    if (items.some((item) => item.confirmationStatus !== target.confirmationStatus))
      warnings.push('Items have different confirmation states');
    let total = number(target.quantity) ?? 0;
    let totalGrams = number(target.normalizedGrams);
    if (warnings.length === 0) {
      for (const item of items) {
        if (item.id === target.id) continue;
        try {
          const converted = await this.convertDelta(
            target,
            number(item.quantity) ?? 0,
            item.unit,
            item,
          );
          total += converted.quantity;
          totalGrams =
            totalGrams === null || converted.grams === null ? null : totalGrams + converted.grams;
        } catch {
          warnings.push(`No reviewed conversion from ${item.unit} to ${target.unit}`);
        }
      }
    }
    return {
      canMerge: warnings.length === 0,
      identity: {
        ingredientId: target.ingredientId ?? null,
        label: target.ingredient?.canonicalName ?? target.unmatchedText ?? '',
      },
      targetItemId: target.id,
      itemCount: items.length,
      result: {
        quantity: total,
        unit: target.unit,
        normalizedGrams: totalGrams,
        conversionStatus:
          totalGrams !== null ? PantryConversionStatus.CONVERTED : PantryConversionStatus.UNKNOWN,
      },
      warnings,
    };
  }

  private async resolveConversion(
    ingredientId: string | undefined,
    quantity: number,
    unit: string,
  ): Promise<ConversionSnapshot> {
    const normalizedUnit = unit.trim().toLowerCase();
    const massFactor = MASS_UNITS.get(normalizedUnit);
    if (massFactor !== undefined)
      return {
        normalizedGrams: quantity * massFactor,
        status: PantryConversionStatus.CONVERTED,
        source: 'SYSTEM_MASS',
        version: 'UCUM-MASS-V1',
        confidence: 1,
      };
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
        (value) =>
          value.unitName.toLowerCase() === normalizedUnit ||
          value.unitSymbol?.toLowerCase() === normalizedUnit,
      );
      if (!conversion) continue;
      const confidence =
        conversion.quality === FoodDataQuality.VERIFIED
          ? 1
          : conversion.quality === FoodDataQuality.REVIEWED
            ? 0.9
            : conversion.quality === FoodDataQuality.ESTIMATED
              ? 0.7
              : 0.5;
      return {
        normalizedGrams: (quantity / Number(conversion.quantity)) * Number(conversion.grams),
        status: PantryConversionStatus.CONVERTED,
        source: profile.source.code,
        version: profile.sourceVersion,
        confidence,
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

  private async convertDelta(
    target: PantryItemRecord,
    quantity: number,
    unit: string,
    sourceItem?: PantryItemRecord,
  ) {
    if (unit.trim().toLowerCase() === target.unit.trim().toLowerCase()) {
      const grams =
        target.normalizedGrams === null
          ? null
          : (number(target.quantity) ?? 0) === 0
            ? (await this.resolveConversion(target.ingredientId ?? undefined, quantity, unit))
                .normalizedGrams
            : quantity * (Number(target.normalizedGrams) / Number(target.quantity));
      return { quantity, grams };
    }
    const inputGrams =
      sourceItem?.normalizedGrams !== null && sourceItem !== undefined
        ? number(sourceItem.normalizedGrams)
        : (await this.resolveConversion(target.ingredientId ?? undefined, quantity, unit))
            .normalizedGrams;
    const targetOne = await this.resolveConversion(
      target.ingredientId ?? undefined,
      1,
      target.unit,
    );
    if (
      inputGrams === null ||
      targetOne.normalizedGrams === null ||
      targetOne.normalizedGrams === 0
    ) {
      throw new AppError({
        statusCode: 422,
        code: 'PANTRY_UNIT_CONVERSION_UNAVAILABLE',
        message: 'No reviewed conversion is available for these units',
      });
    }
    const signedGrams = sourceItem && quantity < 0 ? -Math.abs(inputGrams) : inputGrams;
    return { quantity: signedGrams / targetOne.normalizedGrams, grams: signedGrams };
  }

  private validateDates(
    purchasedAt?: string | null,
    openedAt?: string | null,
    expiresAt?: string | null,
  ) {
    if (purchasedAt && openedAt && openedAt < purchasedAt) throw this.invalidDates();
    if (purchasedAt && expiresAt && expiresAt < purchasedAt) throw this.invalidDates();
  }

  private mapError(error: unknown): Error {
    if (error instanceof AppError) return error;
    if (error instanceof PantryVersionConflictError)
      return new AppError({
        statusCode: 409,
        code: 'PANTRY_VERSION_CONFLICT',
        message: 'Pantry item changed; refresh and retry with the latest version',
      });
    if (error instanceof PantryIdempotencyConflictError)
      return new AppError({
        statusCode: 409,
        code: 'PANTRY_IDEMPOTENCY_CONFLICT',
        message: 'Idempotency key was already used for a different request',
      });
    if (error instanceof PantryNegativeQuantityError)
      return new AppError({
        statusCode: 409,
        code: 'PANTRY_NEGATIVE_QUANTITY',
        message: 'Adjustment would make pantry quantity negative',
      });
    if (error instanceof PantryItemNotFoundError) return this.notFound();
    if (error instanceof PantryMergeConflictError)
      return new AppError({
        statusCode: 409,
        code: 'PANTRY_MERGE_CONFLICT',
        message: 'Pantry items changed or are no longer available',
      });
    return error instanceof Error ? error : new Error('Unknown pantry error');
  }

  private notFound() {
    return new AppError({
      statusCode: 404,
      code: 'PANTRY_ITEM_NOT_FOUND',
      message: 'Pantry item was not found',
    });
  }
  private invalidDates() {
    return new AppError({
      statusCode: 422,
      code: 'PANTRY_DATE_INVALID',
      message: 'Opened and expiry dates cannot be before purchase date',
    });
  }
}
