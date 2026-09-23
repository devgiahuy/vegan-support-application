import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AdminFoodDataRecordDto,
  CookingMethodDto,
  CreateFoodDataRecordRequestDto,
  FoodDataImportResponseDto,
  FoodDataListResponseDto,
  FoodDataRecordResponseDto,
  IngredientIntakeGuidelineDto,
  IngredientInteractionRuleDto,
  IngredientNutrientsDataDto,
  NutrientReferenceIntakeDto,
  PreviewFoodDataImportRequestDto,
  CommitFoodDataImportRequestDto,
  ReplaceFoodDataRecordRequestDto,
} from '../types/food-data.dto';
import type {
  AdminRecordItem,
  CookingMethodItem,
  FoodDataImportPreviewResult,
  FoodDataRecordKind,
  FoodInteractionRuleItem,
  IngredientGuidelineItem,
  IngredientNutritionFact,
  ReferenceIntakeItem,
} from '../types/food-data.model';
import { foodDataMapper, mapPageMeta } from '../mappers/food-data.mapper';

export interface FoodDataQueryParams {
  page?: number;
  limit?: number;
  locale?: string;
  populationCode?: string;
  nutrientCode?: string;
  ingredientId?: string;
  scope?: string;
}

export const foodDataApi = {
  /**
   * Lấy chi tiết dinh dưỡng chuẩn trên 100g và nguồn xuất xứ của nguyên liệu.
   */
  getIngredientNutrients: async (
    ingredientId: string,
    params?: { preparation?: string; locale?: string }
  ): Promise<IngredientNutritionFact> => {
    const res = await api.get<FoodDataRecordResponseDto<IngredientNutrientsDataDto>>(
      API_ENDPOINTS.FOOD_DATA.NUTRIENTS(ingredientId),
      {
        params: params || {},
        silent: true,
      }
    );
    return foodDataMapper.toModel(res.data?.data);
  },

  /**
   * Tra cứu nhu cầu khuyến nghị (RDA/AI) & giới hạn an toàn tối đa (UL).
   */
  listReferenceIntakes: async (
    params?: FoodDataQueryParams
  ): Promise<PaginationResult<ReferenceIntakeItem>> => {
    const res = await api.get<FoodDataListResponseDto<NutrientReferenceIntakeDto>>(
      API_ENDPOINTS.FOOD_DATA.REFERENCE_INTAKES,
      { params: params || {} }
    );
    const items = foodDataMapper.toReferenceIntakeList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },

  /**
   * Tra cứu hướng dẫn định lượng và tần suất an toàn của nguyên liệu.
   */
  listGuidelines: async (
    params?: FoodDataQueryParams
  ): Promise<PaginationResult<IngredientGuidelineItem>> => {
    const res = await api.get<FoodDataListResponseDto<IngredientIntakeGuidelineDto>>(
      API_ENDPOINTS.FOOD_DATA.GUIDELINES,
      { params: params || {} }
    );
    const items = foodDataMapper.toGuidelineList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },

  /**
   * Tra cứu phương pháp nấu nướng và hệ số bảo tồn / hao hụt khối lượng.
   */
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

  /**
   * Tra cứu quy tắc tương tác / kiêng kỵ giữa các nguyên liệu.
   */
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

  /**
   * [ADMIN] Lấy danh sách bản ghi dinh dưỡng chuẩn theo phân loại (kind).
   */
  listAdminRecords: async (params: {
    kind: FoodDataRecordKind;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<AdminRecordItem>> => {
    const res = await api.get<FoodDataListResponseDto<AdminFoodDataRecordDto>>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.RECORDS,
      { params }
    );
    const items = foodDataMapper.toAdminRecordList(res.data?.data);
    const metadata = mapPageMeta(res.data?.meta);
    return { items, metadata };
  },

  /**
   * [ADMIN] Tạo mới một bản ghi dinh dưỡng chuẩn.
   */
  createAdminRecord: async (input: CreateFoodDataRecordRequestDto): Promise<AdminRecordItem> => {
    const res = await api.post<FoodDataRecordResponseDto<AdminFoodDataRecordDto>>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.RECORDS,
      input
    );
    return foodDataMapper.toAdminRecordModel(res.data?.data);
  },

  /**
   * [ADMIN] Thay thế/cập nhật toàn diện một bản ghi dinh dưỡng chuẩn.
   */
  replaceAdminRecord: async (
    id: string,
    input: ReplaceFoodDataRecordRequestDto
  ): Promise<AdminRecordItem> => {
    const res = await api.put<FoodDataRecordResponseDto<AdminFoodDataRecordDto>>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.RECORD(id),
      input
    );
    return foodDataMapper.toAdminRecordModel(res.data?.data);
  },

  /**
   * [ADMIN] Lưu trữ mềm hoặc đánh dấu thay thế một bản ghi dinh dưỡng.
   */
  archiveAdminRecord: async (id: string, kind: FoodDataRecordKind): Promise<AdminRecordItem> => {
    const res = await api.delete<FoodDataRecordResponseDto<AdminFoodDataRecordDto>>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.RECORD(id),
      { params: { kind } }
    );
    return foodDataMapper.toAdminRecordModel(res.data?.data);
  },

  /**
   * [ADMIN] Xem trước (Preview) gói dữ liệu nhập từ nguồn bên ngoài.
   */
  previewImport: async (
    input: PreviewFoodDataImportRequestDto
  ): Promise<FoodDataImportPreviewResult> => {
    const res = await api.post<FoodDataImportResponseDto>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.IMPORT_PREVIEW,
      input
    );
    return foodDataMapper.toImportPreviewResult(res.data?.data);
  },

  /**
   * [ADMIN] Cam kết (Commit) lưu gói dữ liệu đã xem trước.
   */
  commitImport: async (
    input: CommitFoodDataImportRequestDto
  ): Promise<FoodDataImportPreviewResult> => {
    const res = await api.post<FoodDataImportResponseDto>(
      API_ENDPOINTS.ADMIN_FOOD_DATA.IMPORT_COMMIT,
      input
    );
    return foodDataMapper.toImportPreviewResult(res.data?.data);
  },
};
