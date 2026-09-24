import {
  FoodDataReviewStatus,
  PantryAdjustmentType,
  PantryConfirmationStatus,
  type PantryConversionStatus,
  type PantryItemSource,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';

const pantryItemInclude = {
  ingredient: { select: { id: true, canonicalName: true } },
} satisfies Prisma.PantryItemInclude;
export type PantryItemRecord = Prisma.PantryItemGetPayload<{ include: typeof pantryItemInclude }>;
export type PantryAdjustmentRecord = Prisma.PantryAdjustmentGetPayload<object>;

export class PantryVersionConflictError extends Error {}
export class PantryIdempotencyConflictError extends Error {}
export class PantryNegativeQuantityError extends Error {}
export class PantryMergeConflictError extends Error {}
export class PantryItemNotFoundError extends Error {}

export interface ConversionSnapshot {
  normalizedGrams: number | null;
  status: PantryConversionStatus;
  source: string | null;
  version: string | null;
  confidence: number | null;
}

export interface CreateItemData {
  ownerId: string;
  ingredientId?: string;
  unmatchedText?: string;
  normalizedUnmatchedText?: string;
  quantity: number;
  unit: string;
  confidence: number;
  purchasedAt?: Date | null;
  openedAt?: Date | null;
  expiresAt?: Date | null;
  freshnessNote?: string;
  idempotencyKey: string;
  requestHash: string;
  conversion: ConversionSnapshot;
}

export interface UpdateItemData {
  expectedVersion: number;
  requestHash: string;
  confidence?: number;
  purchasedAt?: Date | null;
  openedAt?: Date | null;
  expiresAt?: Date | null;
  freshnessNote?: string | null;
}

export interface AdjustmentData {
  ownerId: string;
  itemId: string;
  type: PantryAdjustmentType;
  inputQuantity: number;
  inputUnit: string;
  appliedDeltaQuantity: number;
  normalizedDeltaGrams: number | null;
  expectedVersion: number;
  idempotencyKey: string;
  requestHash: string;
  reason?: string;
}

export interface MergeData {
  ownerId: string;
  targetItemId: string;
  items: Array<{
    id: string;
    expectedVersion: number;
    appliedQuantity: number;
    normalizedGrams: number | null;
  }>;
  idempotencyKey: string;
  requestHash: string;
}

export class PantryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findActiveIngredient(id: string) {
    return this.prisma.ingredient.findFirst({
      where: { id, status: 'ACTIVE' },
      select: { id: true, canonicalName: true },
    });
  }

  async findReviewedConversions(ingredientId: string) {
    const now = new Date();
    return this.prisma.ingredientFoodProfile.findMany({
      where: {
        ingredientId,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        effectiveFrom: { lte: now },
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
        source: { active: true },
      },
      include: {
        source: { select: { code: true } },
        householdConversions: { where: { reviewStatus: FoodDataReviewStatus.APPROVED } },
      },
      orderBy: [{ effectiveFrom: 'desc' }, { sourceVersion: 'desc' }],
    });
  }

  findOwned(ownerId: string, id: string, includeDeleted = false): Promise<PantryItemRecord | null> {
    return this.prisma.pantryItem.findFirst({
      where: { id, ownerId, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: pantryItemInclude,
    });
  }

  async findIdempotentResult(ownerId: string, idempotencyKey: string) {
    const adjustment = await this.prisma.pantryAdjustment.findUnique({
      where: { ownerId_idempotencyKey: { ownerId, idempotencyKey } },
    });
    if (!adjustment) return null;
    const item = await this.prisma.pantryItem.findUniqueOrThrow({
      where: { id: adjustment.pantryItemId },
      include: pantryItemInclude,
    });
    return { adjustment, item };
  }

  async findOwnedMany(ownerId: string, ids: string[]): Promise<PantryItemRecord[]> {
    return this.prisma.pantryItem.findMany({
      where: { ownerId, id: { in: ids }, deletedAt: null },
      include: pantryItemInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async listOwned(
    ownerId: string,
    input: {
      page: number;
      limit: number;
      ingredientId?: string;
      source?: PantryItemSource;
      confirmationStatus?: PantryConfirmationStatus;
      conversionStatus?: PantryConversionStatus;
      normalizedSearch?: string;
      expiresFrom?: Date;
      expiresTo?: Date;
      includeZero: boolean;
    },
  ) {
    const where: Prisma.PantryItemWhereInput = {
      ownerId,
      deletedAt: null,
      ...(input.includeZero ? {} : { quantity: { gt: 0 } }),
      ...(input.ingredientId ? { ingredientId: input.ingredientId } : {}),
      ...(input.source ? { source: input.source } : {}),
      ...(input.confirmationStatus ? { confirmationStatus: input.confirmationStatus } : {}),
      ...(input.conversionStatus ? { conversionStatus: input.conversionStatus } : {}),
      ...(input.normalizedSearch
        ? {
            OR: [
              { normalizedUnmatchedText: { contains: input.normalizedSearch } },
              { ingredient: { normalizedName: { contains: input.normalizedSearch } } },
              {
                ingredient: {
                  aliases: { some: { normalizedAlias: { contains: input.normalizedSearch } } },
                },
              },
            ],
          }
        : {}),
      ...(input.expiresFrom || input.expiresTo
        ? {
            expiresAt: {
              ...(input.expiresFrom ? { gte: input.expiresFrom } : {}),
              ...(input.expiresTo ? { lte: input.expiresTo } : {}),
            },
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.pantryItem.findMany({
        where,
        include: pantryItemInclude,
        orderBy: [{ expiresAt: 'asc' }, { updatedAt: 'desc' }, { id: 'asc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.pantryItem.count({ where }),
    ]);
    return { records, total };
  }

  async listExpiring(ownerId: string, from: Date, to: Date, page: number, limit: number) {
    const where: Prisma.PantryItemWhereInput = {
      ownerId,
      deletedAt: null,
      confirmationStatus: PantryConfirmationStatus.CONFIRMED,
      quantity: { gt: 0 },
      expiresAt: { gte: from, lte: to },
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.pantryItem.findMany({
        where,
        include: pantryItemInclude,
        orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pantryItem.count({ where }),
    ]);
    return { records, total };
  }

  async create(
    data: CreateItemData,
  ): Promise<{ item: PantryItemRecord; adjustment: PantryAdjustmentRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockOwner(transaction, data.ownerId);
      const existing = await transaction.pantryAdjustment.findUnique({
        where: {
          ownerId_idempotencyKey: { ownerId: data.ownerId, idempotencyKey: data.idempotencyKey },
        },
      });
      if (existing) {
        if (
          existing.requestHash !== data.requestHash ||
          existing.type !== PantryAdjustmentType.CREATE
        )
          throw new PantryIdempotencyConflictError();
        const item = await transaction.pantryItem.findUniqueOrThrow({
          where: { id: existing.pantryItemId },
          include: pantryItemInclude,
        });
        return { item, adjustment: existing };
      }
      const item = await transaction.pantryItem.create({
        data: {
          ownerId: data.ownerId,
          ...(data.ingredientId ? { ingredientId: data.ingredientId } : {}),
          ...(data.unmatchedText
            ? {
                unmatchedText: data.unmatchedText,
                normalizedUnmatchedText: data.normalizedUnmatchedText,
              }
            : {}),
          quantity: data.quantity,
          unit: data.unit,
          normalizedGrams: data.conversion.normalizedGrams,
          conversionStatus: data.conversion.status,
          conversionSource: data.conversion.source,
          conversionVersion: data.conversion.version,
          conversionConfidence: data.conversion.confidence,
          source: 'MANUAL',
          confirmationStatus: PantryConfirmationStatus.CONFIRMED,
          confidence: data.confidence,
          ...(data.purchasedAt !== undefined ? { purchasedAt: data.purchasedAt } : {}),
          ...(data.openedAt !== undefined ? { openedAt: data.openedAt } : {}),
          ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
          ...(data.freshnessNote !== undefined ? { freshnessNote: data.freshnessNote } : {}),
        },
        include: pantryItemInclude,
      });
      const adjustment = await transaction.pantryAdjustment.create({
        data: {
          ownerId: data.ownerId,
          pantryItemId: item.id,
          type: PantryAdjustmentType.CREATE,
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,
          inputQuantity: data.quantity,
          inputUnit: data.unit,
          appliedDeltaQuantity: data.quantity,
          normalizedDeltaGrams: data.conversion.normalizedGrams,
          beforeQuantity: 0,
          afterQuantity: data.quantity,
          beforeGrams: data.conversion.normalizedGrams === null ? null : 0,
          afterGrams: data.conversion.normalizedGrams,
          versionBefore: 0,
          versionAfter: 1,
        },
      });
      return { item, adjustment };
    });
  }

  async update(
    ownerId: string,
    id: string,
    data: UpdateItemData,
  ): Promise<PantryItemRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.pantryItem.findFirst({
        where: { id, ownerId, deletedAt: null },
        include: pantryItemInclude,
      });
      if (!current) return null;
      const updated = await transaction.pantryItem.updateMany({
        where: { id, ownerId, deletedAt: null, version: data.expectedVersion },
        data: {
          version: { increment: 1 },
          ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
          ...(data.purchasedAt !== undefined ? { purchasedAt: data.purchasedAt } : {}),
          ...(data.openedAt !== undefined ? { openedAt: data.openedAt } : {}),
          ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
          ...(data.freshnessNote !== undefined ? { freshnessNote: data.freshnessNote } : {}),
        },
      });
      if (!updated.count) throw new PantryVersionConflictError();
      await transaction.pantryAdjustment.create({
        data: {
          ownerId,
          pantryItemId: id,
          type: PantryAdjustmentType.UPDATE,
          idempotencyKey: `update:${id}:${String(data.expectedVersion)}`,
          requestHash: data.requestHash,
          inputQuantity: 0,
          inputUnit: current.unit,
          appliedDeltaQuantity: 0,
          normalizedDeltaGrams: current.normalizedGrams === null ? null : 0,
          beforeQuantity: current.quantity,
          afterQuantity: current.quantity,
          beforeGrams: current.normalizedGrams,
          afterGrams: current.normalizedGrams,
          versionBefore: data.expectedVersion,
          versionAfter: data.expectedVersion + 1,
        },
      });
      return transaction.pantryItem.findUniqueOrThrow({
        where: { id },
        include: pantryItemInclude,
      });
    });
  }

  async adjust(
    data: AdjustmentData,
  ): Promise<{ item: PantryItemRecord; adjustment: PantryAdjustmentRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockOwner(transaction, data.ownerId);
      const existing = await transaction.pantryAdjustment.findUnique({
        where: {
          ownerId_idempotencyKey: { ownerId: data.ownerId, idempotencyKey: data.idempotencyKey },
        },
      });
      if (existing) {
        if (existing.requestHash !== data.requestHash || existing.pantryItemId !== data.itemId)
          throw new PantryIdempotencyConflictError();
        const item = await transaction.pantryItem.findUniqueOrThrow({
          where: { id: existing.pantryItemId },
          include: pantryItemInclude,
        });
        return { item, adjustment: existing };
      }
      const current = await transaction.pantryItem.findFirst({
        where: { id: data.itemId, ownerId: data.ownerId, deletedAt: null },
        include: pantryItemInclude,
      });
      if (!current) throw new PantryItemNotFoundError();
      const afterQuantity = Number(current.quantity) + data.appliedDeltaQuantity;
      const afterGrams =
        current.normalizedGrams === null
          ? null
          : Number(current.normalizedGrams) + (data.normalizedDeltaGrams ?? 0);
      if (afterQuantity < 0 || (afterGrams !== null && afterGrams < 0))
        throw new PantryNegativeQuantityError();
      const updated = await transaction.pantryItem.updateMany({
        where: {
          id: data.itemId,
          ownerId: data.ownerId,
          deletedAt: null,
          version: data.expectedVersion,
        },
        data: { quantity: afterQuantity, normalizedGrams: afterGrams, version: { increment: 1 } },
      });
      if (!updated.count) throw new PantryVersionConflictError();
      const adjustment = await transaction.pantryAdjustment.create({
        data: {
          ownerId: data.ownerId,
          pantryItemId: data.itemId,
          type: data.type,
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,
          inputQuantity: data.inputQuantity,
          inputUnit: data.inputUnit,
          appliedDeltaQuantity: data.appliedDeltaQuantity,
          normalizedDeltaGrams: data.normalizedDeltaGrams,
          beforeQuantity: current.quantity,
          afterQuantity,
          beforeGrams: current.normalizedGrams,
          afterGrams,
          versionBefore: data.expectedVersion,
          versionAfter: data.expectedVersion + 1,
          ...(data.reason ? { reason: data.reason } : {}),
        },
      });
      const item = await transaction.pantryItem.findUniqueOrThrow({
        where: { id: data.itemId },
        include: pantryItemInclude,
      });
      return { item, adjustment };
    });
  }

  async softDelete(
    ownerId: string,
    id: string,
    expectedVersion: number,
    requestHash: string,
  ): Promise<'deleted' | 'not-found'> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.pantryItem.findFirst({
        where: { id, ownerId },
        include: pantryItemInclude,
      });
      if (!current) return 'not-found';
      if (current.deletedAt) return 'deleted';
      const updated = await transaction.pantryItem.updateMany({
        where: { id, ownerId, deletedAt: null, version: expectedVersion },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
      if (!updated.count) throw new PantryVersionConflictError();
      await transaction.pantryAdjustment.create({
        data: {
          ownerId,
          pantryItemId: id,
          type: PantryAdjustmentType.DELETE,
          idempotencyKey: `delete:${id}:${String(expectedVersion)}`,
          requestHash,
          inputQuantity: 0,
          inputUnit: current.unit,
          appliedDeltaQuantity: 0,
          normalizedDeltaGrams: current.normalizedGrams === null ? null : 0,
          beforeQuantity: current.quantity,
          afterQuantity: current.quantity,
          beforeGrams: current.normalizedGrams,
          afterGrams: current.normalizedGrams,
          versionBefore: expectedVersion,
          versionAfter: expectedVersion + 1,
        },
      });
      return 'deleted';
    });
  }

  async listAdjustments(ownerId: string, itemId: string, page: number, limit: number) {
    const owned = await this.prisma.pantryItem.findFirst({
      where: { id: itemId, ownerId },
      select: { id: true },
    });
    if (!owned) return null;
    const where = { pantryItemId: itemId, ownerId };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.pantryAdjustment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pantryAdjustment.count({ where }),
    ]);
    return { records, total };
  }

  async merge(data: MergeData): Promise<PantryItemRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockOwner(transaction, data.ownerId);
      const existing = await transaction.pantryAdjustment.findUnique({
        where: {
          ownerId_idempotencyKey: { ownerId: data.ownerId, idempotencyKey: data.idempotencyKey },
        },
      });
      if (existing) {
        if (
          existing.requestHash !== data.requestHash ||
          existing.pantryItemId !== data.targetItemId ||
          existing.type !== PantryAdjustmentType.MERGE_IN
        )
          throw new PantryIdempotencyConflictError();
        return transaction.pantryItem.findUniqueOrThrow({
          where: { id: data.targetItemId },
          include: pantryItemInclude,
        });
      }
      const ids = data.items.map((item) => item.id);
      const records = await transaction.pantryItem.findMany({
        where: { ownerId: data.ownerId, id: { in: ids }, deletedAt: null },
        include: pantryItemInclude,
      });
      if (records.length !== data.items.length) throw new PantryMergeConflictError();
      for (const expected of data.items) {
        const record = records.find((item) => item.id === expected.id);
        if (!record || record.version !== expected.expectedVersion)
          throw new PantryVersionConflictError();
      }
      const target = records.find((item) => item.id === data.targetItemId);
      if (!target) throw new PantryMergeConflictError();
      const additions = data.items.filter((item) => item.id !== data.targetItemId);
      const deltaQuantity = additions.reduce((sum, item) => sum + item.appliedQuantity, 0);
      const normalizedDelta =
        target.normalizedGrams === null
          ? null
          : additions.reduce((sum, item) => sum + (item.normalizedGrams ?? 0), 0);
      const afterQuantity = Number(target.quantity) + deltaQuantity;
      const afterGrams =
        target.normalizedGrams === null
          ? null
          : Number(target.normalizedGrams) + (normalizedDelta ?? 0);
      const targetUpdated = await transaction.pantryItem.updateMany({
        where: { id: target.id, ownerId: data.ownerId, deletedAt: null, version: target.version },
        data: { quantity: afterQuantity, normalizedGrams: afterGrams, version: { increment: 1 } },
      });
      if (!targetUpdated.count) throw new PantryVersionConflictError();
      await transaction.pantryAdjustment.create({
        data: {
          ownerId: data.ownerId,
          pantryItemId: target.id,
          type: PantryAdjustmentType.MERGE_IN,
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,
          inputQuantity: deltaQuantity,
          inputUnit: target.unit,
          appliedDeltaQuantity: deltaQuantity,
          normalizedDeltaGrams: normalizedDelta,
          beforeQuantity: target.quantity,
          afterQuantity,
          beforeGrams: target.normalizedGrams,
          afterGrams,
          versionBefore: target.version,
          versionAfter: target.version + 1,
        },
      });
      for (const source of records.filter((item) => item.id !== target.id)) {
        const sourceUpdated = await transaction.pantryItem.updateMany({
          where: { id: source.id, ownerId: data.ownerId, deletedAt: null, version: source.version },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
        if (!sourceUpdated.count) throw new PantryVersionConflictError();
        await transaction.pantryAdjustment.create({
          data: {
            ownerId: data.ownerId,
            pantryItemId: source.id,
            type: PantryAdjustmentType.MERGE_OUT,
            idempotencyKey: `merge-out:${data.requestHash.slice(0, 48)}:${source.id}`,
            requestHash: data.requestHash,
            inputQuantity: 0,
            inputUnit: source.unit,
            appliedDeltaQuantity: 0,
            normalizedDeltaGrams: source.normalizedGrams === null ? null : 0,
            beforeQuantity: source.quantity,
            afterQuantity: source.quantity,
            beforeGrams: source.normalizedGrams,
            afterGrams: source.normalizedGrams,
            versionBefore: source.version,
            versionAfter: source.version + 1,
            mergedFromItemId: source.id,
          },
        });
      }
      return transaction.pantryItem.findUniqueOrThrow({
        where: { id: target.id },
        include: pantryItemInclude,
      });
    });
  }

  private async lockOwner(transaction: Prisma.TransactionClient, ownerId: string): Promise<void> {
    await transaction.$queryRaw<
      Array<{ id: string }>
    >`SELECT "id" FROM "users" WHERE "id" = ${ownerId}::uuid FOR UPDATE`;
  }
}
