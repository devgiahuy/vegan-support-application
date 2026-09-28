import { BaseMapper, pickField, safeArray, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type { IngredientDto, IngredientListResponseDto } from '../types/ingredient.dto';
import type { Ingredient, IngredientAlias } from '../types/ingredient.model';
import { FoodGroup } from '@/common/enums';

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

function toAlias(raw: unknown): IngredientAlias {
  if (typeof raw === 'string') return { id: '', alias: raw };
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: safeString(pickField(o, ['id', 'aliasId', 'alias_id'], '')),
    alias: safeString(pickField(o, ['alias', 'name', 'value'], '')),
  };
}

/** IngredientMapper: chỉ phục vụ tra cứu công khai (`GET /ingredients`). */
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
      foodGroup: group,
      foodGroupLabel: FOOD_GROUP_LABELS[group],
      aliases: safeArray<unknown, IngredientAlias>(pickField(dto, ['aliases'], null), (a) =>
        toAlias(a)
      ).filter((a) => a.alias.length > 0),
      allergenCodes: safeArray<unknown, string>(
        pickField(dto, ['allergenCodes', 'allergen_codes'], null),
        (c) => (typeof c === 'string' ? c : '')
      ).filter((c) => c.length > 0),
    };
  }

  /** Chuẩn hoá meta catalog `{page,limit,total,totalPages}` về `PaginationResult`. */
  toListModel(dto: IngredientListResponseDto | null | undefined): PaginationResult<Ingredient> {
    const rawItems = pickField<(IngredientDto | null)[] | null>(dto, ['data'], null);
    const items = this.toModelList(rawItems);
    const meta = pickField<IngredientListResponseDto['meta']>(dto, ['meta'], null);
    const page = safeNumber(pickField(meta, ['page'], 1), 1);
    const limit = safeNumber(pickField(meta, ['limit'], 10), 10);
    const totalItems = safeNumber(pickField(meta, ['total'], items.length), items.length);
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1), 1);
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
}

export const ingredientMapper = new IngredientMapper();
