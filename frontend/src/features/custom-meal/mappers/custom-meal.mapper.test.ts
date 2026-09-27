import { describe, expect, it } from 'vitest';
import type {
  CustomMealInUseErrorDto,
  CustomMealListItemDto,
  CustomMealListResponseDto,
  CustomMealPhotoDto,
  CustomMealResponseDto,
} from '../types/custom-meal.dto';
import { CustomMealMapper } from './custom-meal.mapper';

describe('CustomMealMapper', () => {
  describe('toPhotoModel', () => {
    it('chuyển đổi hợp lệ DTO ảnh sang UI Model', () => {
      const dto: CustomMealPhotoDto = {
        id: 'photo-1',
        url: 'https://example.com/photo.webp',
        sortOrder: 1,
        isCover: true,
        fileSizeBytes: 1024000,
        mimeType: 'image/webp',
        createdAt: '2026-09-23T10:00:00Z',
      };

      const result = CustomMealMapper.toPhotoModel(dto);

      expect(result.id).toBe('photo-1');
      expect(result.url).toBe('https://example.com/photo.webp');
      expect(result.sortOrder).toBe(1);
      expect(result.isCover).toBe(true);
      expect(result.fileSizeBytes).toBe(1024000);
      expect(result.mimeType).toBe('image/webp');
    });

    it('xử lý an toàn khi DTO ảnh là null hoặc khuyết thiếu trường', () => {
      const result = CustomMealMapper.toPhotoModel(null);

      expect(result.id).toBe('');
      expect(result.url).toBe('');
      expect(result.sortOrder).toBe(0);
      expect(result.isCover).toBe(false);
      expect(result.fileSizeBytes).toBe(0);
      expect(result.mimeType).toBe('image/jpeg');
    });
  });

  describe('toIngredientModel', () => {
    it('chuyển đổi nguyên liệu chuẩn hóa có dưỡng chất tính toán', () => {
      const dto = {
        id: 'cmi-1',
        ingredientId: 'ing-tofu',
        name: 'Đậu hũ non',
        quantity: 150,
        unit: 'g',
        isCustom: false,
        calculatedNutrients: {
          calories: 120,
          protein: 12.5,
          carbs: 3,
          fat: 6.5,
          fiber: 1.2,
        },
      };

      const result = CustomMealMapper.toIngredientModel(dto);

      expect(result.id).toBe('cmi-1');
      expect(result.ingredientId).toBe('ing-tofu');
      expect(result.name).toBe('Đậu hũ non');
      expect(result.quantity).toBe(150);
      expect(result.unit).toBe('g');
      expect(result.isCustom).toBe(false);
      expect(result.calculatedNutrients).toEqual({
        calories: 120,
        protein: 12.5,
        carbs: 3,
        fat: 6.5,
        fiber: 1.2,
      });
    });

    it('chuyển đổi nguyên liệu tự do không khớp ngân hàng thực phẩm', () => {
      const dto = {
        id: 'cmi-2',
        ingredientId: null,
        name: 'Sốt gia truyền',
        quantity: 30,
        unit: 'ml',
        isCustom: true,
        calculatedNutrients: null,
      };

      const result = CustomMealMapper.toIngredientModel(dto);

      expect(result.id).toBe('cmi-2');
      expect(result.ingredientId).toBeNull();
      expect(result.name).toBe('Sốt gia truyền');
      expect(result.isCustom).toBe(true);
      expect(result.calculatedNutrients).toBeNull();
    });
  });

  describe('toCustomMealModel', () => {
    it('sắp xếp danh sách ảnh theo sortOrder và gán đúng coverPhoto', () => {
      const dto: CustomMealResponseDto = {
        id: 'cm-1',
        ownerId: 'usr-1',
        name: 'Salad bơ đậu hũ',
        servings: 2,
        photos: [
          { id: 'p2', url: 'https://example.com/2.jpg', sortOrder: 2, isCover: false },
          { id: 'p1', url: 'https://example.com/1.jpg', sortOrder: 0, isCover: true },
          { id: 'p3', url: 'https://example.com/3.jpg', sortOrder: 1, isCover: false },
        ],
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
      };

      const result = CustomMealMapper.toCustomMealModel(dto);

      expect(result.photos).toHaveLength(3);
      expect(result.photos[0].id).toBe('p1');
      expect(result.photos[1].id).toBe('p3');
      expect(result.photos[2].id).toBe('p2');
      expect(result.coverPhoto?.id).toBe('p1');
    });

    it('tính toán chính xác coverageRatio và unmatchedIngredientCount', () => {
      const dto: CustomMealResponseDto = {
        id: 'cm-2',
        ownerId: 'usr-1',
        name: 'Bún xào',
        servings: 1,
        ingredients: [
          {
            id: '1',
            ingredientId: 'ing-bun',
            name: 'Bún tươi',
            quantity: 200,
            unit: 'g',
            isCustom: false,
          },
          {
            id: '2',
            ingredientId: null,
            name: 'Sốt tự chế',
            quantity: 20,
            unit: 'ml',
            isCustom: true,
          },
        ],
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
      };

      const result = CustomMealMapper.toCustomMealModel(dto);

      expect(result.unmatchedIngredientCount).toBe(1);
      expect(result.coverageRatio).toBe(0.5);
      expect(result.isFullyCovered).toBe(false);
    });

    it('chuẩn hóa tags về chữ thường và cắt bỏ khoảng trắng', () => {
      const dto: CustomMealResponseDto = {
        id: 'cm-3',
        ownerId: 'usr-1',
        name: 'Canh rong biển',
        servings: 2,
        tags: ['  MÓN NHANH ', 'SHOPEE  ', ''],
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
      };

      const result = CustomMealMapper.toCustomMealModel(dto);

      expect(result.tags).toEqual(['món nhanh', 'shopee']);
    });

    it('chuyển đổi chính xác các trường dữ liệu thực tế từ Backend: userProteinGrams, displayName, amount, secureUrl và tag objects', () => {
      const dto = {
        id: 'cm-be-detail',
        ownerId: 'usr-1',
        name: 'Bún bò chay Huế',
        servings: 2,
        sourceNote: 'Tự nấu',
        notes: 'Hầm nước dùng với củ cải và bắp ngọt',
        userCalories: 450,
        userProteinGrams: 18.5,
        userCarbsGrams: 60.0,
        userFatGrams: 10.2,
        nutritionCoverage: 'FULL',
        tags: [
          { tag: 'bua_trua', normalizedTag: 'bua trua' },
          { tag: 'đậm đà', normalizedTag: 'dam da' },
        ],
        photos: [
          {
            id: 'photo-row-1',
            assetId: 'asset-uuid-1',
            position: 0,
            secureUrl: 'https://cloudinary.com/bun-bo.webp',
            mimeType: 'image/webp',
          },
        ],
        ingredients: [
          {
            id: 'ing-1',
            position: 0,
            displayName: 'Bún sợi to',
            amount: 300,
            unit: 'g',
            resolutionStatus: 'RESOLVED',
            ingredientId: 'ing-bun-soi-to',
          },
          {
            id: 'ing-2',
            position: 1,
            displayName: 'Nấm đùi gà',
            amount: 100,
            unit: 'g',
            resolutionStatus: 'RESOLVED',
            ingredientId: 'ing-nam-dui-ga',
          },
        ],
        createdAt: '2026-09-27T08:00:00Z',
        updatedAt: '2026-09-27T08:00:00Z',
      } as unknown as CustomMealResponseDto;

      const result = CustomMealMapper.toCustomMealModel(dto);

      expect(result.id).toBe('cm-be-detail');
      expect(result.name).toBe('Bún bò chay Huế');
      expect(result.userProtein).toBe(18.5);
      expect(result.userCarbs).toBe(60.0);
      expect(result.userFat).toBe(10.2);
      expect(result.userCalories).toBe(450);
      expect(result.tags).toEqual(['bua_trua', 'đậm đà']);
      expect(result.coverPhoto?.id).toBe('asset-uuid-1');
      expect(result.coverPhoto?.url).toBe('https://cloudinary.com/bun-bo.webp');
      expect(result.coverPhoto?.isCover).toBe(true);
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0].name).toBe('Bún sợi to');
      expect(result.ingredients[0].quantity).toBe(300);
      expect(result.ingredients[0].isCustom).toBe(false);
      expect(result.isFullyCovered).toBe(true);
    });
  });

  describe('toListItemModel', () => {
    it('chuyển đổi phần tử danh sách món ăn cá nhân với ảnh bìa và thống kê', () => {
      const dto: CustomMealListItemDto = {
        id: 'cm-list-1',
        name: 'Chả giò chay',
        servings: 4,
        sourceNote: 'Mẹ dạy',
        userCalories: 500,
        calculatedCalories: 480,
        coverageRatio: 1.0,
        isFullyCovered: true,
        tags: ['chiên', 'cuối tuần'],
        coverPhotoUrl: 'https://example.com/cover.webp',
        photoCount: 2,
        ingredientCount: 6,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
      };

      const result = CustomMealMapper.toListItemModel(dto);

      expect(result.id).toBe('cm-list-1');
      expect(result.name).toBe('Chả giò chay');
      expect(result.coverPhotoUrl).toBe('https://example.com/cover.webp');
      expect(result.photoCount).toBe(2);
      expect(result.ingredientCount).toBe(6);
      expect(result.isFullyCovered).toBe(true);
    });
  });

  describe('toListResultModel', () => {
    it('chuyển đổi danh sách món ăn cá nhân phân trang kèm danh mục thẻ', () => {
      const dto: CustomMealListResponseDto = {
        items: [
          {
            id: 'cm-1',
            name: 'Món 1',
            servings: 1,
            createdAt: '2026-09-23T10:00:00Z',
            updatedAt: '2026-09-23T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
        availableTags: [
          { name: 'ĂN SÁNG', count: 3 },
          { name: 'shopee', count: 1 },
        ],
      };

      const result = CustomMealMapper.toListResultModel(dto);

      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.availableTags).toEqual([
        { name: 'ăn sáng', count: 3 },
        { name: 'shopee', count: 1 },
      ]);
    });

    it('chuyển đổi danh sách món ăn từ cấu trúc data.records chuẩn Backend', () => {
      const backendDto = {
        records: [
          {
            id: 'cm-be-1',
            ownerId: 'usr-1',
            name: 'Đậu hũ sốt cà chua',
            servings: 2,
            userCalories: 350,
            userProteinGrams: 20.5,
            userCarbsGrams: 15.2,
            userFatGrams: 8.4,
            nutritionCoverage: 'FULL',
            tags: [{ tag: 'bua_trua', normalizedTag: 'bua trua' }],
            photos: [
              {
                id: 'p-1',
                assetId: 'asset-1',
                position: 0,
                secureUrl: 'https://cloudinary.com/meal.jpg',
              },
            ],
            ingredients: [
              {
                id: 'ing-row-1',
                position: 0,
                displayName: 'Đậu hũ chiên',
                amount: 200,
                unit: 'g',
                resolutionStatus: 'RESOLVED' as const,
                ingredientId: 'ing-tofu',
              },
            ],
            createdAt: '2026-09-27T08:00:00Z',
            updatedAt: '2026-09-27T08:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      const result = CustomMealMapper.toListResultModel(backendDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('cm-be-1');
      expect(result.items[0].name).toBe('Đậu hũ sốt cà chua');
      expect(result.items[0].userCalories).toBe(350);
      expect(result.items[0].tags).toEqual(['bua_trua']);
      expect(result.items[0].coverPhotoUrl).toBe('https://cloudinary.com/meal.jpg');
      expect(result.items[0].ingredientCount).toBe(1);
      expect(result.items[0].photoCount).toBe(1);
      expect(result.items[0].isFullyCovered).toBe(true);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('toDeleteCheckResult', () => {
    it('trả về canDelete = false kèm danh sách và thông điệp tiếng Việt khi có lỗi CUSTOM_MEAL_IN_USE', () => {
      const errorDto: CustomMealInUseErrorDto = {
        usages: [
          {
            planItemId: 'pi-1',
            planId: 'mp-1',
            planTitle: 'Thực đơn tuần 38',
            date: '2026-09-24',
            mealType: 'LUNCH',
            servings: 1,
          },
        ],
      };

      const result = CustomMealMapper.toDeleteCheckResult(errorDto);

      expect(result.canDelete).toBe(false);
      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].planTitle).toBe('Thực đơn tuần 38');
      expect(result.message).toContain('đang được sử dụng trong 1 thực đơn tuần');
    });

    it('trả về canDelete = true khi không có thực đơn nào tham chiếu', () => {
      const result = CustomMealMapper.toDeleteCheckResult(null);

      expect(result.canDelete).toBe(true);
      expect(result.usages).toHaveLength(0);
      expect(result.message).toBe('Có thể xóa an toàn');
    });
  });
});
