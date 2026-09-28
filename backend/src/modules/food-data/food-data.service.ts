import { createHash } from 'node:crypto';
import { FoodDataImportStatus, Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { getFoodDataImportAdapter } from './food-data-provider.js';
import type { FoodDataRepository } from './food-data.repository.js';
import {
  previewFoodDataImportRequestSchema,
  type AdminFoodDataRecordQuery,
  type CommitFoodDataImportInput,
  type CreateFoodDataRecordInput,
  type FoodDataReadQuery,
  type FoodDataRecordKind,
  type IngredientNutrientQuery,
  type PreviewFoodDataImportInput,
} from './food-data.schemas.js';

export class FoodDataService {
  constructor(private readonly repository: FoodDataRepository) {}

  async getIngredientNutrients(ingredientId: string, query: IngredientNutrientQuery) {
    const record = await this.repository.listIngredientNutrients(ingredientId, query);
    if (!record) throw this.notFound('Không tìm thấy ingredient hoặc dữ liệu đã ngừng hoạt động');
    return serialize(record);
  }

  async listReferenceIntakes(query: FoodDataReadQuery) {
    return this.toPaged(
      await this.repository.listReferenceIntakes(normalizeReadQuery(query)),
      query,
    );
  }

  async listGuidelines(query: FoodDataReadQuery) {
    return this.toPaged(await this.repository.listGuidelines(normalizeReadQuery(query)), query);
  }

  async listCookingMethods(query: FoodDataReadQuery) {
    return this.toPaged(await this.repository.listCookingMethods(query), query);
  }

  async listInteractionRules(query: FoodDataReadQuery) {
    return this.toPaged(await this.repository.listInteractionRules(query), query);
  }

  async listAdminRecords(query: AdminFoodDataRecordQuery) {
    return this.toPaged(await this.repository.listAdminRecords(query), query);
  }

  async createRecord(input: CreateFoodDataRecordInput, actorId: string) {
    try {
      return serialize(await this.repository.createRecord(input, actorId));
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async replaceRecord(id: string, input: CreateFoodDataRecordInput, actorId: string) {
    try {
      return serialize(await this.repository.replaceRecord(id, input, actorId));
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async archiveRecord(kind: FoodDataRecordKind, id: string, actorId: string) {
    try {
      return serialize(await this.repository.archiveRecord(kind, id, actorId));
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async previewImport(input: PreviewFoodDataImportInput, actorId: string) {
    const source = await this.repository.findSourceByCode(input.sourceCode);
    if (!source || !source.active) {
      throw new AppError({
        statusCode: 400,
        code: 'FOOD_DATA_SOURCE_UNAVAILABLE',
        message: 'Nguồn food data không tồn tại hoặc đã ngừng hoạt động',
      });
    }
    const adapter = getFoodDataImportAdapter(source.provider);
    const records = adapter.normalize(input.records);
    const sourceRecordIds = new Set<string>();
    const allNutrientCodes = new Set<string>();
    for (const record of records) {
      if (sourceRecordIds.has(record.sourceRecordId)) {
        throw new AppError({
          statusCode: 400,
          code: 'DUPLICATE_SOURCE_RECORD',
          message: `sourceRecordId bị trùng: ${record.sourceRecordId}`,
        });
      }
      sourceRecordIds.add(record.sourceRecordId);
      record.nutrients.forEach((nutrient) => allNutrientCodes.add(nutrient.nutrientCode));
    }

    const nutrients = await this.repository.findNutrientsByCodes([...allNutrientCodes]);
    const nutrientByCode = new Map(nutrients.map((nutrient) => [nutrient.code, nutrient]));
    const unknownNutrients = [...allNutrientCodes].filter((code) => !nutrientByCode.has(code));
    if (unknownNutrients.length) {
      throw new AppError({
        statusCode: 400,
        code: 'UNKNOWN_NUTRIENT_CODE',
        message: `Nutrient chưa được định nghĩa: ${unknownNutrients.join(', ')}`,
      });
    }
    for (const record of records) {
      for (const value of record.nutrients) {
        const nutrient = nutrientByCode.get(value.nutrientCode);
        if (nutrient && nutrient.defaultUnit !== value.unit) {
          throw new AppError({
            statusCode: 400,
            code: 'NUTRIENT_UNIT_MISMATCH',
            message: `${value.nutrientCode} yêu cầu unit ${nutrient.defaultUnit}, nhận ${value.unit}`,
          });
        }
      }
    }

    const conflicts = await this.repository.findEffectiveProfileConflicts(
      source.id,
      [...sourceRecordIds],
      input.sourceVersion,
      new Date(input.effectiveFrom),
    );
    if (conflicts.length) {
      throw new AppError({
        statusCode: 409,
        code: 'FOOD_DATA_VERSION_CONFLICT',
        message: 'Đã có version khác cùng effective date cho một hoặc nhiều source record',
      });
    }

    const payloadHash = hashPayload(input);
    const existing = await this.repository.findImport(source.id, input.idempotencyKey);
    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw new AppError({
          statusCode: 409,
          code: 'IMPORT_IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key đã được dùng với payload khác',
        });
      }
      return importOutput(existing, true);
    }

    const summary: Prisma.InputJsonObject = {
      provider: source.provider,
      recordCount: records.length,
      aliasCount: records.reduce((total, record) => total + record.aliases.length, 0),
      conversionCount: records.reduce(
        (total, record) => total + record.householdConversions.length,
        0,
      ),
      nutrientValueCount: records.reduce((total, record) => total + record.nutrients.length, 0),
    };
    try {
      const batch = await this.repository.createImportPreview(
        source.id,
        input,
        payloadHash,
        summary,
        actorId,
      );
      return importOutput(batch, false);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async commitImport(input: CommitFoodDataImportInput, actorId: string) {
    const batch = await this.repository.findImportById(input.importId);
    if (!batch) throw this.notFound('Không tìm thấy import preview');
    if (batch.status === FoodDataImportStatus.FAILED) {
      throw new AppError({
        statusCode: 409,
        code: 'IMPORT_NOT_COMMITTABLE',
        message: 'Import ở trạng thái FAILED không thể commit',
      });
    }
    if (batch.status === FoodDataImportStatus.COMMITTED) return importOutput(batch, true);

    const parsed = previewFoodDataImportRequestSchema.safeParse(batch.stagedPayload);
    if (!parsed.success) {
      throw new AppError({
        statusCode: 409,
        code: 'IMPORT_STAGING_INVALID',
        message: 'Payload staging không còn hợp lệ với contract hiện tại',
      });
    }
    const adapter = getFoodDataImportAdapter(batch.source.provider);
    const records = adapter.normalize(parsed.data.records);
    try {
      const committed = await this.repository.commitImport(batch.id, parsed.data, records, actorId);
      return importOutput(committed, false);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('NUTRIENT_NOT_FOUND:')) {
        throw new AppError({
          statusCode: 409,
          code: 'IMPORT_REFERENCE_CHANGED',
          message: 'Nutrient definition đã thay đổi sau preview; cần preview lại',
        });
      }
      throw this.mapPersistenceError(error);
    }
  }

  private toPaged(
    result: { records: unknown[]; total: number },
    query: { page: number; limit: number },
  ) {
    return {
      data: result.records.map((record) => serialize(record)),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }

  private mapPersistenceError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return this.notFound('Không tìm thấy food-data record');
      if (error.code === 'P2002') {
        return new AppError({
          statusCode: 409,
          code: 'FOOD_DATA_DUPLICATE',
          message: 'Food-data record trùng source identity, code, alias hoặc effective version',
        });
      }
      if (error.code === 'P2003') {
        return new AppError({
          statusCode: 400,
          code: 'FOOD_DATA_REFERENCE_INVALID',
          message: 'Food-data record tham chiếu tới dữ liệu không tồn tại',
        });
      }
    }
    return new AppError({
      statusCode: 500,
      code: 'FOOD_DATA_PERSISTENCE_ERROR',
      message: 'Không thể lưu food data',
    });
  }

  private notFound(message: string): AppError {
    return new AppError({ statusCode: 404, code: 'FOOD_DATA_NOT_FOUND', message });
  }
}

function normalizeReadQuery(query: FoodDataReadQuery): FoodDataReadQuery {
  return {
    ...query,
    ...(query.nutrientCode ? { nutrientCode: query.nutrientCode.toUpperCase() } : {}),
  };
}

function hashPayload(input: PreviewFoodDataImportInput): string {
  return createHash('sha256').update(stableStringify(input)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function serialize(value: unknown): Record<string, unknown> {
  const serialized = serializeValue(value);
  if (!serialized || typeof serialized !== 'object' || Array.isArray(serialized))
    return { value: serialized };
  return serialized as Record<string, unknown>;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, serializeValue(child)]),
    );
  }
  return value;
}

function importOutput(
  batch: {
    id: string;
    status: FoodDataImportStatus;
    summary: Prisma.JsonValue;
  },
  idempotentReplay: boolean,
) {
  return {
    importId: batch.id,
    status: batch.status === FoodDataImportStatus.COMMITTED ? 'COMMITTED' : 'PREVIEWED',
    idempotentReplay,
    summary: serialize(batch.summary),
  };
}
