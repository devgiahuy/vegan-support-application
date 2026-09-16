import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  IngredientDto,
  IngredientListResponseDto,
  IngredientResponseDto,
  ResolveResponseDto,
} from '../types/ingredient.dto';
import type {
  DietCompatibility,
  Ingredient,
  IngredientAlias,
  IngredientResolution,
  TraditionWarning,
} from '../types/ingredient.model';
import { CatalogStatus, FoodGroup, ResolutionMatch } from '@/common/enums';

const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  [FoodGroup.GRAINS]: 'Ngũ cốc',
  [FoodGroup.LEGUMES]: 'Đậu',
  [FoodGroup.VEGETABLES]: 'Rau',
  [FoodGroup.FRUITS]: 'Trái cây',
  [FoodGroup.NUTS_SEEDS]: 'Hạt',
  [FoodGroup.MUSHROOMS]: 'Nấm',
  [FoodGroup.DAIRY_EGGS]: 'Trứng sữa',
  [FoodGroup.HERBS_SPICES]: 'Thảo mộc – gia vị',
  [FoodGroup.OTHER]: 'Khác',
};

/**
 * IngredientMapper: list public/admin (meta catalog chuẩn hóa),
 * resolve 3 trạng thái, response đơn, alias.
 */
export class IngredientMapper extends BaseMapper<IngredientDto, Ingredient> {
  toModel(dto: IngredientDto | null | undefined): Ingredient {
    const group = safeEnum(
      pickField(dto, ['foodGroup', 'food_group'], 'OTHER'),
      FoodGroup,
      FoodGroup.OTHER
    );
    return {
      id: safeString(pickField(dto, ['id'], '')),
      canonicalName: safeString(pickField(dto, ['canonicalName', 'canonical_name', 'name'], '')),
      normalizedName: safeString(pickField(dto, ['normalizedName', 'normalized_name'], '')),
      foodGroup: group,
      foodGroupLabel: FOOD_GROUP_LABELS[group],
      status: safeEnum(pickField(dto, ['status'], 'ACTIVE'), CatalogStatus, CatalogStatus.ACTIVE),
      aliases: safeArray<unknown, IngredientAlias>(pickField(dto, ['aliases'], null), (a) =>
        toAlias(a)
      ).filter((a) => a.alias.length > 0),
      allergenCodes: safeArray<unknown, string>(
        pickField(dto, ['allergenCodes', 'allergen_codes'], null),
        (c) => (typeof c === 'string' ? c : '')
      ).filter((c) => c.length > 0),
      dietCompatibilities: safeArray<unknown, DietCompatibility>(
        pickField(dto, ['dietCompatibilities', 'diet_compatibilities'], null),
        (c) => toCompatibility(c)
      ),
      traditionWarnings: safeArray<unknown, TraditionWarning>(
        pickField(dto, ['traditionWarnings', 'tradition_warnings'], null),
        (w) => toWarning(w)
      ),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  /**
   * Chuẩn hóa meta catalog `{page,limit,total,totalPages}` về `PaginationResult`.
   * Đặt tên khác `toPaginationModel` của base vì envelope catalog khác shape base.
   */
  toListModel(dto: IngredientListResponseDto | null | undefined): PaginationResult<Ingredient> {
    const rawItems = pickField(dto, ['data'], null) as (IngredientDto | null)[] | null;
    const items = this.toModelList(
      safeArray<IngredientDto | null, IngredientDto | null>(rawItems, (c) => c)
    );
    const meta = pickField(dto, ['meta'], null) as IngredientListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 10));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** `POST/PATCH /admin/ingredients*` → 1 item đủ. */
  toSingleModel(dto: IngredientResponseDto | null | undefined): Ingredient {
    const data = pickField(dto, ['data'], null) as IngredientDto | null;
    return this.toModel(data);
  }

  /** `GET /ingredients/resolve` → 3 trạng thái rõ ràng. */
  toResolutionModel(dto: ResolveResponseDto | null | undefined): IngredientResolution {
    const data = pickField(dto, ['data'], null) as ResolveResponseDto['data'];
    return {
      query: safeString(pickField(data, ['query'], '')),
      normalizedQuery: safeString(pickField(data, ['normalizedQuery', 'normalized_query'], '')),
      match: safeEnum(pickField(data, ['match'], 'NONE'), ResolutionMatch, ResolutionMatch.NONE),
      candidates: this.toModelList(
        safeArray<IngredientDto | null, IngredientDto | null>(
          pickField(data, ['candidates'], null),
          (c) => c
        )
      ),
    };
  }
}

function toAlias(raw: unknown): IngredientAlias {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  if (typeof raw === 'string') return { id: '', alias: raw };
  return {
    id: safeString(pickField(o, ['id', 'aliasId', 'alias_id'], '')),
    alias: safeString(pickField(o, ['alias', 'name', 'value'], '')),
  };
}

function toCompatibility(raw: unknown): DietCompatibility {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    dietPattern: safeString(pickField(o, ['dietPattern', 'diet_pattern'], '')),
    compatible: safeBoolean(pickField(o, ['compatible'], false)),
  };
}

function toWarning(raw: unknown): TraditionWarning {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    tradition: safeString(pickField(o, ['tradition'], '')),
    warningCode: safeString(pickField(o, ['warningCode', 'warning_code'], '')),
    label: safeString(pickField(o, ['label'], '')),
  };
}

export const ingredientMapper = new IngredientMapper();
