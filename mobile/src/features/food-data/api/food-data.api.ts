import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  CookingMethodDto,
  FoodDataListResponseDto,
  FoodDataRecordResponseDto,
  IngredientInteractionRuleDto,
  IngredientNutrientsDataDto,
  NutrientReferenceIntakeDto,
} from '../types/food-data.dto';
import type {
  CookingMethodItem,
  FoodInteractionRuleItem,
  IngredientNutritionFact,
  ReferenceIntakeItem,
} from '../types/food-data.model';
import { foodDataMapper, mapPageMeta } from '../mappers/food-data.mapper';

export interface FoodDataQueryParams {
  page?: number;
  limit?: number;
  populationCode?: string;
  scope?: string;
  ingredientId?: string;
}

/**
 * `foodDataApi` — chỉ phần tra cứu công khai (Phase 12), đồng bộ
 * `frontend/src/features/food-data/api/food-data.api.ts` (bỏ phần [ADMIN]/import).
 */
export const foodDataApi = {
  /** Chi tiết dinh dưỡng chuẩn trên 100g và nguồn xuất xứ của nguyên liệu. */
  getIngredientNutrients: async (
    ingredientId: string,
    params?: { preparation?: string }
  ): Promise<IngredientNutritionFact> => {
    const res = await api.get<FoodDataRecordResponseDto<IngredientNutrientsDataDto>>(
      API_ENDPOINTS.FOOD_DATA.NUTRIENTS(ingredientId),
      { params: params || {}, silent: true }
    );
    return foodDataMapper.toModel(res.data?.data);
  },

  /** Tra cứu nhu cầu khuyến nghị (RDA/AI) & giới hạn an toàn tối đa (UL). */
  listReferenceIntakes: async (params?: FoodDataQueryParams): Promise<PaginationResult<ReferenceIntakeItem>> => {
    const res = await api.get<FoodDataListResponseDto<NutrientReferenceIntakeDto>>(
      API_ENDPOINTS.FOOD_DATA.REFERENCE_INTAKES,
      { params: params || {} }
    );
    const items = foodDataMapper.toReferenceIntakeList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },

  /** Tra cứu phương pháp nấu nướng và hệ số bảo tồn / hao hụt khối lượng. */
  listCookingMethods: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<CookingMethodItem>> => {
    const res = await api.get<FoodDataListResponseDto<CookingMethodDto>>(
      API_ENDPOINTS.FOOD_DATA.COOKING_METHODS,
      { params: params || {} }
    );
    const items = foodDataMapper.toCookingMethodList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },

  /** Tra cứu quy tắc tương tác / kiêng kỵ giữa các nguyên liệu. */
  listInteractionRules: async (
    params?: FoodDataQueryParams
  ): Promise<PaginationResult<FoodInteractionRuleItem>> => {
    const res = await api.get<FoodDataListResponseDto<IngredientInteractionRuleDto>>(
      API_ENDPOINTS.FOOD_DATA.INTERACTIONS,
      { params: params || {} }
    );
    const items = foodDataMapper.toInteractionRuleList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },
};
