import { describe, it, expect } from 'vitest';
import { RecipeDifficulty } from '@/common/enums';
import { RecipeDraftMapper, recipeDraftMapper } from '../recipe-draft.mapper';
import type { GenerateRecipeDraftResponseDto } from '../../types/recipe-draft.dto';
import type { RecipeDraftPrompt, RecipeDraftSuggestion } from '../../types/recipe-draft.model';

describe('RecipeDraftMapper', () => {
  const mapper = new RecipeDraftMapper();

  const mockResponseDto: GenerateRecipeDraftResponseDto = {
    success: true,
    data: {
      draft: {
        type: 'RECIPE',
        title: 'Cà ri chay nấm đông cô',
        excerpt: 'Món cà ri thanh đạm cho bữa cơm gia đình',
        body: 'Món ăn kết hợp hài hòa giữa vị béo của cốt dừa và vị ngọt thanh của nấm đông cô.',
        categoryIds: ['cat-1'],
        tags: ['chay-nam-bo'],
        media: [],
        recipe: {
          servings: 4,
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          difficulty: 'MEDIUM',
          nutrition: {},
          ingredients: [
            { displayName: 'Đậu hũ chiên', amount: 200, unit: 'g', optional: false },
            { displayName: 'Nấm đông cô', amount: 150, unit: 'g', optional: false },
            { displayName: 'Nước cốt dừa', amount: 250, unit: 'ml', optional: true },
          ],
          steps: [
            {
              instruction: 'Sơ chế và rửa sạch nấm đông cô, cắt miếng vừa ăn.',
              durationMinutes: 5,
              affectedIngredientPositions: [1],
            },
            {
              instruction: 'Cho cốt dừa và đậu hũ vào nấu lửa nhỏ.',
              durationMinutes: 20,
              affectedIngredientPositions: [0, 2],
            },
          ],
        },
      },
      ingredientConfidence: [0.95, 0.9, 0.85],
      confidence: 0.92,
      assumptions: ['Khẩu phần 4 người', 'Gia vị nêm vừa ăn'],
      provenance: {
        provider: 'openai',
        model: 'gpt-5.6-terra',
        templateVersion: 'recipe-draft-v1',
      },
    },
  };

  describe('toModel', () => {
    it('chuyển đổi DTO hoàn chỉnh thành UI Model chính xác', () => {
      const model = mapper.toModel(mockResponseDto);

      expect(model.title).toBe('Cà ri chay nấm đông cô');
      expect(model.description).toBe('Món cà ri thanh đạm cho bữa cơm gia đình');
      expect(model.body).toContain('kết hợp hài hòa');
      expect(model.servings).toBe(4);
      expect(model.prepTimeMinutes).toBe(15);
      expect(model.cookTimeMinutes).toBe(25);
      expect(model.difficulty).toBe(RecipeDifficulty.MEDIUM);

      expect(model.ingredients).toHaveLength(3);
      expect(model.ingredients[0]).toEqual({
        name: 'Đậu hũ chiên',
        amount: 200,
        unit: 'g',
        optional: false,
        confidence: 0.95,
      });
      expect(model.ingredients[2].optional).toBe(true);

      expect(model.steps).toHaveLength(2);
      expect(model.steps[0]).toEqual({
        stepNumber: 1,
        instruction: 'Sơ chế và rửa sạch nấm đông cô, cắt miếng vừa ăn.',
        durationMinutes: 5,
        affectedIngredientIndices: [1],
      });
      expect(model.steps[1].stepNumber).toBe(2);

      expect(model.confidence).toBe(0.92);
      expect(model.assumptions).toEqual(['Khẩu phần 4 người', 'Gia vị nêm vừa ăn']);
      expect(model.provenance.provider).toBe('openai');
    });

    it('xử lý an toàn khi DTO bị thiếu các trường tùy chọn hoặc null', () => {
      const sparseDto: GenerateRecipeDraftResponseDto = {
        success: true,
        data: {
          draft: {},
          ingredientConfidence: [],
          confidence: 0.8,
          assumptions: [],
          provenance: {
            provider: 'test-ai',
            model: 'model-x',
            templateVersion: 'v1',
          },
        },
      };

      const model = mapper.toModel(sparseDto);
      expect(model.title).toBe('');
      expect(model.servings).toBe(4);
      expect(model.prepTimeMinutes).toBe(15);
      expect(model.cookTimeMinutes).toBe(20);
      expect(model.difficulty).toBe(RecipeDifficulty.MEDIUM);
      expect(model.ingredients).toEqual([]);
      expect(model.steps).toEqual([]);
      expect(model.assumptions).toEqual([]);
    });

    it('ánh xạ đúng các cấp độ khó EASY và HARD', () => {
      const easyDto: GenerateRecipeDraftResponseDto = {
        ...mockResponseDto,
        data: {
          ...mockResponseDto.data,
          draft: {
            ...mockResponseDto.data.draft,
            recipe: {
              ...mockResponseDto.data.draft.recipe,
              difficulty: 'EASY',
            },
          },
        },
      };
      expect(mapper.toModel(easyDto).difficulty).toBe(RecipeDifficulty.EASY);

      const hardDto: GenerateRecipeDraftResponseDto = {
        ...mockResponseDto,
        data: {
          ...mockResponseDto.data,
          draft: {
            ...mockResponseDto.data.draft,
            recipe: {
              ...mockResponseDto.data.draft.recipe,
              difficulty: 'HARD',
            },
          },
        },
      };
      expect(mapper.toModel(hardDto).difficulty).toBe(RecipeDifficulty.HARD);
    });
  });

  describe('toDto', () => {
    it('chuyển đổi RecipeDraftPrompt thành GenerateRecipeDraftRequestDto với trim và loại bỏ chuỗi rỗng', () => {
      const prompt: RecipeDraftPrompt = {
        title: '  Canh chua chay  ',
        description: '  Nấu với thơm và bạc hà  ',
        ingredientNames: [' Đậu hũ ', '  ', 'Bạc hà', ''],
      };

      const dto = mapper.toDto(prompt);
      expect(dto.title).toBe('Canh chua chay');
      expect(dto.description).toBe('Nấu với thơm và bạc hà');
      expect(dto.ingredientNames).toEqual(['Đậu hũ', 'Bạc hà']);
      expect('servings' in dto).toBe(false);
    });

    it('gửi khẩu phần và thời gian hợp lệ từ bước 1, bỏ qua giá trị không hợp lệ', () => {
      const dto = mapper.toDto({
        title: 'Canh chua chay',
        description: 'Nấu với thơm',
        ingredientNames: ['Đậu hũ'],
        servings: 4,
        prepTimeMinutes: 0,
        cookTimeMinutes: Number.NaN,
      });
      expect(dto.servings).toBe(4);
      expect(dto.prepTimeMinutes).toBe(0);
      expect('cookTimeMinutes' in dto).toBe(false);
      expect('servings' in mapper.toDto({ ...dto, servings: 0 })).toBe(false);
    });
  });

  describe('suggestedTiming', () => {
    it('ánh xạ gợi ý thời gian của AI và tạo câu gợi ý khi khác số đã nhập', () => {
      const model = mapper.toModel({
        ...mockResponseDto,
        data: {
          ...mockResponseDto.data,
          suggestedTiming: { servings: 4, prepTimeMinutes: 10, cookTimeMinutes: 25 },
        },
      });
      expect(model.suggestedTiming).toEqual({
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
      });
      expect(mapper.timingHint(model)).toBe(
        'AI ước lượng sơ chế 10 phút; bạn có thể chỉnh nếu cần.'
      );
    });

    it('không có gợi ý khi backend không gửi hoặc thời gian trùng', () => {
      const model = mapper.toModel(mockResponseDto);
      expect(model.suggestedTiming).toBeNull();
      expect(mapper.timingHint(model)).toBeNull();
      expect(
        mapper.timingHint({
          ...model,
          suggestedTiming: { servings: 4, prepTimeMinutes: 15, cookTimeMinutes: 25 },
        })
      ).toBeNull();
    });
  });

  describe('toFormValues', () => {
    it('chuyển đổi RecipeDraftSuggestion thành giá trị biểu mẫu hợp lệ cho RecipeEditorForm', () => {
      const suggestion: RecipeDraftSuggestion = mapper.toModel(mockResponseDto);
      const formValues = mapper.toFormValues(suggestion);

      expect(formValues.title).toBe('Cà ri chay nấm đông cô');
      expect(formValues.description).toBe('Món cà ri thanh đạm cho bữa cơm gia đình');
      expect(formValues.servings).toBe(4);
      expect(formValues.prepTimeMinutes).toBe(15);
      expect(formValues.cookTimeMinutes).toBe(25);
      expect(formValues.difficulty).toBe(RecipeDifficulty.MEDIUM);

      expect(formValues.ingredients).toHaveLength(3);
      expect(formValues.ingredients?.[0]).toEqual({
        name: 'Đậu hũ chiên',
        ingredientId: null,
        amount: 200,
        unit: 'g',
      });

      expect(formValues.steps).toHaveLength(2);
      expect(formValues.steps?.[0]).toEqual({
        stepNumber: 1,
        instruction: 'Sơ chế và rửa sạch nấm đông cô, cắt miếng vừa ăn.',
      });
    });
  });

  it('export singleton recipeDraftMapper hoạt động đồng nhất', () => {
    expect(recipeDraftMapper).toBeInstanceOf(RecipeDraftMapper);
  });
});
