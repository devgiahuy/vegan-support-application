import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  CustomMealIngredientDto,
  CustomMealIngredientNutrientsDto,
  CustomMealInUseErrorDto,
  CustomMealListItemDto,
  CustomMealListResponseDto,
  CustomMealPhotoDto,
  CustomMealPlanUsageDto,
  CustomMealResponseDto,
  CustomMealTagStatDto,
} from '../types/custom-meal.dto';
import type {
  CustomMeal,
  CustomMealDeleteCheckResult,
  CustomMealIngredient,
  CustomMealIngredientNutrients,
  CustomMealListItem,
  CustomMealListResult,
  CustomMealPhoto,
  CustomMealPlanUsage,
  UserTagItem,
} from '../types/custom-meal.model';

export class CustomMealMapper extends BaseMapper<CustomMealResponseDto, CustomMeal> {
  public toModel(dto: CustomMealResponseDto | null | undefined): CustomMeal {
    if (!dto) {
      return {
        id: '',
        ownerId: '',
        name: '',
        notes: null,
        servings: 1,
        sourceNote: null,
        userCalories: null,
        userProtein: null,
        userCarbs: null,
        userFat: null,
        calculatedCalories: null,
        calculatedProtein: null,
        calculatedCarbs: null,
        calculatedFat: null,
        coverageRatio: 1,
        isFullyCovered: true,
        unmatchedIngredientCount: 0,
        tags: [],
        photos: [],
        coverPhoto: null,
        ingredients: [],
        createdAt: '',
        updatedAt: '',
      };
    }
    return CustomMealMapper.toCustomMealModel(dto);
  }

  /**
   * Chuyển đổi DTO ảnh sang UI Model
   */
  public static toPhotoModel(dto?: CustomMealPhotoDto | null): CustomMealPhoto {
    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      url: safeString(pickField(dto, ['url'], ''), ''),
      sortOrder: safeNumber(pickField(dto, ['sortOrder', 'sort_order'], 0), 0),
      isCover: safeBoolean(pickField(dto, ['isCover', 'is_cover'], false), false),
      fileSizeBytes: safeNumber(pickField(dto, ['fileSizeBytes', 'file_size_bytes', 'size'], 0), 0),
      mimeType: safeString(pickField(dto, ['mimeType', 'mime_type'], 'image/jpeg'), 'image/jpeg'),
      createdAt: safeString(pickField(dto, ['createdAt', 'created_at'], ''), ''),
    };
  }

  /**
   * Chuyển đổi DTO dưỡng chất của nguyên liệu sang UI Model
   */
  public static toIngredientNutrientsModel(
    dto?: CustomMealIngredientNutrientsDto | null
  ): CustomMealIngredientNutrients | null {
    if (!dto) return null;

    return {
      calories: safeNumber(pickField(dto, ['calories'], 0), 0),
      protein: safeNumber(pickField(dto, ['protein'], 0), 0),
      carbs: safeNumber(pickField(dto, ['carbs', 'carbohydrate'], 0), 0),
      fat: safeNumber(pickField(dto, ['fat'], 0), 0),
      fiber: dto.fiber !== undefined ? safeNumber(pickField(dto, ['fiber'], 0), 0) : undefined,
    };
  }

  /**
   * Chuyển đổi DTO nguyên liệu sang UI Model
   */
  public static toIngredientModel(dto?: CustomMealIngredientDto | null): CustomMealIngredient {
    const ingredientId = pickField<string | null>(dto, ['ingredientId', 'ingredient_id'], null);
    const isCustom = safeBoolean(
      pickField(dto, ['isCustom', 'is_custom'], !ingredientId),
      !ingredientId
    );

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      ingredientId: ingredientId ? safeString(ingredientId, '') : null,
      name: safeString(pickField(dto, ['name'], ''), ''),
      quantity: safeNumber(pickField(dto, ['quantity', 'amount'], 0), 0),
      unit: safeString(pickField(dto, ['unit'], 'g'), 'g'),
      isCustom,
      calculatedNutrients: this.toIngredientNutrientsModel(
        pickField(dto, ['calculatedNutrients', 'nutrients'], null)
      ),
    };
  }

  /**
   * Chuyển đổi DTO chi tiết món ăn cá nhân sang UI Model
   */
  public static toCustomMealModel(dto: CustomMealResponseDto): CustomMeal {
    const rawPhotos = safeArray<CustomMealPhotoDto>(pickField(dto, ['photos'], [])).map((photo) =>
      this.toPhotoModel(photo)
    );

    // Sắp xếp ảnh theo sortOrder tăng dần
    const photos = rawPhotos.sort((a, b) => a.sortOrder - b.sortOrder);

    // Tìm ảnh bìa chính (hoặc ảnh đầu tiên nếu không có cờ isCover)
    let coverPhoto = photos.find((p) => p.isCover) || null;
    if (!coverPhoto && photos.length > 0) {
      coverPhoto = photos[0];
    }

    const ingredients = safeArray<CustomMealIngredientDto>(pickField(dto, ['ingredients'], [])).map(
      (ingredient) => this.toIngredientModel(ingredient)
    );

    const unmatchedIngredientCount = ingredients.filter((ing) => ing.isCustom).length;
    const defaultCoverage =
      ingredients.length > 0
        ? (ingredients.length - unmatchedIngredientCount) / ingredients.length
        : 1.0;
    const coverageRatio = safeNumber(
      pickField(dto, ['coverageRatio', 'coverage_ratio'], defaultCoverage),
      defaultCoverage
    );

    const tags = safeArray<string>(pickField(dto, ['tags'], []))
      .map((t) => safeString(t, '').trim().toLowerCase())
      .filter(Boolean);

    const userCalories = pickField<number | null>(dto, ['userCalories', 'user_calories'], null);
    const userProtein = pickField<number | null>(dto, ['userProtein', 'user_protein'], null);
    const userCarbs = pickField<number | null>(dto, ['userCarbs', 'user_carbs'], null);
    const userFat = pickField<number | null>(dto, ['userFat', 'user_fat'], null);

    const calculatedCalories = pickField<number | null>(
      dto,
      ['calculatedCalories', 'calculated_calories'],
      null
    );
    const calculatedProtein = pickField<number | null>(
      dto,
      ['calculatedProtein', 'calculated_protein'],
      null
    );
    const calculatedCarbs = pickField<number | null>(
      dto,
      ['calculatedCarbs', 'calculated_carbs'],
      null
    );
    const calculatedFat = pickField<number | null>(dto, ['calculatedFat', 'calculated_fat'], null);

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      ownerId: safeString(pickField(dto, ['ownerId', 'owner_id'], ''), ''),
      name: safeString(pickField(dto, ['name'], ''), ''),
      notes: pickField<string | null>(dto, ['notes'], null)
        ? safeString(pickField(dto, ['notes'], null), '')
        : null,
      servings: Math.max(1, safeNumber(pickField(dto, ['servings'], 1), 1)),
      sourceNote: pickField<string | null>(dto, ['sourceNote', 'source_note'], null)
        ? safeString(pickField(dto, ['sourceNote', 'source_note'], null), '')
        : null,
      userCalories: userCalories !== null ? safeNumber(userCalories, 0) : null,
      userProtein: userProtein !== null ? safeNumber(userProtein, 0) : null,
      userCarbs: userCarbs !== null ? safeNumber(userCarbs, 0) : null,
      userFat: userFat !== null ? safeNumber(userFat, 0) : null,
      calculatedCalories: calculatedCalories !== null ? safeNumber(calculatedCalories, 0) : null,
      calculatedProtein: calculatedProtein !== null ? safeNumber(calculatedProtein, 0) : null,
      calculatedCarbs: calculatedCarbs !== null ? safeNumber(calculatedCarbs, 0) : null,
      calculatedFat: calculatedFat !== null ? safeNumber(calculatedFat, 0) : null,
      coverageRatio,
      isFullyCovered: safeBoolean(
        pickField(dto, ['isFullyCovered', 'is_fully_covered'], unmatchedIngredientCount === 0),
        unmatchedIngredientCount === 0
      ),
      unmatchedIngredientCount,
      tags,
      photos,
      coverPhoto,
      ingredients,
      createdAt: safeString(pickField(dto, ['createdAt', 'created_at'], ''), ''),
      updatedAt: safeString(pickField(dto, ['updatedAt', 'updated_at'], ''), ''),
    };
  }

  /**
   * Chuyển đổi DTO phần tử danh sách sang UI Model
   */
  public static toListItemModel(dto: CustomMealListItemDto): CustomMealListItem {
    const tags = safeArray<string>(pickField(dto, ['tags'], []))
      .map((t) => safeString(t, '').trim().toLowerCase())
      .filter(Boolean);

    const userCalories = pickField<number | null>(dto, ['userCalories', 'user_calories'], null);
    const calculatedCalories = pickField<number | null>(
      dto,
      ['calculatedCalories', 'calculated_calories'],
      null
    );
    const coverPhotoUrl = pickField<string | null>(dto, ['coverPhotoUrl', 'cover_photo_url'], null);

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      name: safeString(pickField(dto, ['name'], ''), ''),
      notes: pickField<string | null>(dto, ['notes'], null)
        ? safeString(pickField(dto, ['notes'], null), '')
        : null,
      servings: Math.max(1, safeNumber(pickField(dto, ['servings'], 1), 1)),
      sourceNote: pickField<string | null>(dto, ['sourceNote', 'source_note'], null)
        ? safeString(pickField(dto, ['sourceNote', 'source_note'], null), '')
        : null,
      userCalories: userCalories !== null ? safeNumber(userCalories, 0) : null,
      calculatedCalories: calculatedCalories !== null ? safeNumber(calculatedCalories, 0) : null,
      coverageRatio: safeNumber(pickField(dto, ['coverageRatio', 'coverage_ratio'], 1.0), 1.0),
      isFullyCovered: safeBoolean(
        pickField(dto, ['isFullyCovered', 'is_fully_covered'], true),
        true
      ),
      tags,
      coverPhotoUrl: coverPhotoUrl ? safeString(coverPhotoUrl, '') : null,
      photoCount: safeNumber(pickField(dto, ['photoCount', 'photo_count'], 0), 0),
      ingredientCount: safeNumber(pickField(dto, ['ingredientCount', 'ingredient_count'], 0), 0),
      createdAt: safeString(pickField(dto, ['createdAt', 'created_at'], ''), ''),
      updatedAt: safeString(pickField(dto, ['updatedAt', 'updated_at'], ''), ''),
    };
  }

  /**
   * Chuyển đổi DTO danh sách món ăn phân trang sang UI Model
   */
  public static toListResultModel(dto: CustomMealListResponseDto): CustomMealListResult {
    const rawItems = safeArray<CustomMealListItemDto>(pickField(dto, ['items'], []));
    const items = rawItems.map((item) => this.toListItemModel(item));

    const rawTags = safeArray<CustomMealTagStatDto>(pickField(dto, ['availableTags', 'tags'], []));
    const availableTags: UserTagItem[] = rawTags.map((tag) => ({
      name: safeString(pickField(tag, ['name'], ''), '')
        .trim()
        .toLowerCase(),
      count: safeNumber(pickField(tag, ['count'], 0), 0),
    }));

    const paginationDto = pickField(dto, ['pagination'], null);

    return {
      items,
      pagination: {
        page: safeNumber(pickField(paginationDto, ['page'], 1), 1),
        limit: safeNumber(pickField(paginationDto, ['limit'], 12), 12),
        totalItems: safeNumber(
          pickField(paginationDto, ['totalItems', 'total'], items.length),
          items.length
        ),
        totalPages: safeNumber(pickField(paginationDto, ['totalPages', 'total_pages'], 1), 1),
      },
      availableTags,
    };
  }

  /**
   * Chuyển đổi thông tin tham chiếu thực đơn tuần
   */
  public static toPlanUsageModel(dto?: CustomMealPlanUsageDto | null): CustomMealPlanUsage {
    return {
      planItemId: safeString(pickField(dto, ['planItemId', 'plan_item_id'], ''), ''),
      planId: safeString(pickField(dto, ['planId', 'plan_id'], ''), ''),
      planTitle: safeString(
        pickField(dto, ['planTitle', 'plan_title'], 'Thực đơn tuần'),
        'Thực đơn tuần'
      ),
      date: safeString(pickField(dto, ['date'], ''), ''),
      mealType:
        (pickField(dto, ['mealType', 'meal_type'], 'LUNCH') as CustomMealPlanUsage['mealType']) ||
        'LUNCH',
      servings: safeNumber(pickField(dto, ['servings'], 1), 1),
    };
  }

  /**
   * Chuyển đổi kết quả kiểm tra xóa an toàn khi có lỗi CUSTOM_MEAL_IN_USE
   */
  public static toDeleteCheckResult(
    errorDto?: CustomMealInUseErrorDto | null
  ): CustomMealDeleteCheckResult {
    const usages = safeArray<CustomMealPlanUsageDto>(pickField(errorDto, ['usages'], [])).map((u) =>
      this.toPlanUsageModel(u)
    );

    const canDelete = usages.length === 0;
    const message = canDelete
      ? 'Có thể xóa an toàn'
      : `Món ăn này đang được sử dụng trong ${usages.length} thực đơn tuần. Vui lòng gỡ món khỏi thực đơn trước khi xóa.`;

    return {
      canDelete,
      usages,
      message,
    };
  }
}

export const customMealMapper = new CustomMealMapper();
