import { describe, expect, it } from 'vitest';
import {
  AiArtifactStatus,
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
} from '@/common/enums';
import { aiArtifactMapper } from '../ai-artifact.mapper';
import type { AiArtifactDto, PublicAiArtifactListResponseDto } from '../../types/ai-artifact.dto';

describe('AiArtifactMapper', () => {
  it('maps a complete CHAT_ANSWER artifact correctly', () => {
    const dto: AiArtifactDto = {
      id: 'art-001',
      type: 'CHAT_ANSWER',
      version: 1,
      title: 'Hỏi đáp về cách bổ sung vitamin B12 khi ăn chay thuần',
      summary: 'Giải thích chi tiết các nguồn B12 bổ sung tự nhiên và thực phẩm bổ sung',
      content: {
        type: 'CHAT_ANSWER',
        answer: 'Người ăn chay thuần nên bổ sung B12 qua men dinh dưỡng hoặc viên uống bổ sung...',
      },
      author: {
        name: 'Nguyễn Văn B',
        anonymous: false,
      },
      lifecycle: {
        status: 'SUBMITTED',
        visibility: 'PUBLIC',
        version: 2,
        submittedAt: '2026-09-26T09:00:00Z',
        sharedAt: '2026-09-26T09:30:00Z',
      },
      activeVerification: {
        id: 'ver-001',
        conclusion: 'VERIFIED',
        status: 'ACTIVE',
      },
      verificationHistory: [],
      createdAt: '2026-09-26T08:00:00Z',
    };

    const model = aiArtifactMapper.toModel(dto);

    expect(model.id).toBe('art-001');
    expect(model.type).toBe(AiArtifactType.CHAT_ANSWER);
    expect(model.typeLabel).toBe('Trợ lý AI');
    expect(model.title).toBe('Hỏi đáp về cách bổ sung vitamin B12 khi ăn chay thuần');
    expect(model.author.name).toBe('Nguyễn Văn B');
    expect(model.author.anonymous).toBe(false);
    expect(model.lifecycle.status).toBe(AiArtifactStatus.SUBMITTED);
    expect(model.lifecycle.visibility).toBe(AiArtifactVisibility.PUBLIC);
    expect(model.isPublic).toBe(true);
    expect(model.isSubmitted).toBe(true);
    expect(model.isVerified).toBe(true);
    expect(model.content.type).toBe(AiArtifactType.CHAT_ANSWER);
    if (model.content.type === AiArtifactType.CHAT_ANSWER) {
      expect(model.content.answer).toContain('Người ăn chay thuần nên bổ sung B12');
    }
  });

  it('maps RECIPE_NUTRITION artifact with nutrients and range correctly', () => {
    const dto: AiArtifactDto = {
      id: 'art-002',
      type: 'RECIPE_NUTRITION',
      title: 'Dinh dưỡng món Canh Đậu Hũ Rong Biển',
      summary: 'Phân tích dinh dưỡng cho 2 khẩu phần',
      content: {
        type: 'RECIPE_NUTRITION',
        recipe: {
          title: 'Canh Đậu Hũ Rong Biển',
          servings: 2,
        },
        totals: {
          rawGrams: 500,
          cookedGrams: 450,
        },
        perServingNutrients: [
          {
            code: 'PROCNT',
            name: 'Chất đạm',
            amount: 15.5,
            unit: 'g',
            origin: 'USDA',
            confidence: 0.95,
            range: { min: 14.0, max: 17.0 },
          },
        ],
        confidence: 0.92,
        disclaimer: 'Ước tính dinh dưỡng theo phương pháp bảo tồn nhiệt',
      },
      author: {
        name: 'Secret User',
        anonymous: true,
      },
      lifecycle: {
        status: 'DRAFT',
        visibility: 'PRIVATE',
      },
    };

    const model = aiArtifactMapper.toModel(dto);

    expect(model.type).toBe(AiArtifactType.RECIPE_NUTRITION);
    expect(model.typeLabel).toBe('Dinh dưỡng món ăn');
    expect(model.author.name).toBe('Secret User');
    expect(model.author.anonymous).toBe(true);
    expect(model.isPublic).toBe(false);
    expect(model.isSubmitted).toBe(false);
    expect(model.isVerified).toBe(false);

    if (model.content.type === AiArtifactType.RECIPE_NUTRITION) {
      expect(model.content.recipe.title).toBe('Canh Đậu Hũ Rong Biển');
      expect(model.content.recipe.servings).toBe(2);
      expect(model.content.totals.rawGrams).toBe(500);
      expect(model.content.perServingNutrients).toHaveLength(1);
      expect(model.content.perServingNutrients[0].name).toBe('Chất đạm');
      expect(model.content.perServingNutrients[0].amount).toBe(15.5);
      expect(model.content.perServingNutrients[0].range.min).toBe(14.0);
    }
  });

  it('maps FRIDGE_RECOGNITION artifact correctly', () => {
    const dto: AiArtifactDto = {
      id: 'art-003',
      type: 'FRIDGE_RECOGNITION',
      content: {
        type: 'FRIDGE_RECOGNITION',
        items: [
          {
            name: 'Nấm đùi gà',
            quantity: { value: 300, unit: 'g' },
            confidence: 0.98,
            status: 'DETECTED',
          },
        ],
      },
    };

    const model = aiArtifactMapper.toModel(dto);

    expect(model.type).toBe(AiArtifactType.FRIDGE_RECOGNITION);
    expect(model.typeLabel).toBe('Nhận diện tủ lạnh');
    if (model.content.type === AiArtifactType.FRIDGE_RECOGNITION) {
      expect(model.content.items).toHaveLength(1);
      expect(model.content.items[0].name).toBe('Nấm đùi gà');
      expect(model.content.items[0].quantity.value).toBe(300);
      expect(model.content.items[0].quantity.unit).toBe('g');
    }
  });

  it('maps RECEIPT_EXTRACTION artifact correctly', () => {
    const dto: AiArtifactDto = {
      id: 'art-004',
      type: 'RECEIPT_EXTRACTION',
      content: {
        type: 'RECEIPT_EXTRACTION',
        items: [
          {
            name: 'Đậu phụ Mơ',
            quantity: { value: 2, unit: 'bìa' },
            confidence: 0.99,
            status: 'CONFIRMED',
          },
        ],
      },
    };

    const model = aiArtifactMapper.toModel(dto);

    expect(model.type).toBe(AiArtifactType.RECEIPT_EXTRACTION);
    expect(model.typeLabel).toBe('Bóc tách hóa đơn');
    if (model.content.type === AiArtifactType.RECEIPT_EXTRACTION) {
      expect(model.content.items).toHaveLength(1);
      expect(model.content.items[0].name).toBe('Đậu phụ Mơ');
    }
  });

  it('handles empty or missing DTO fields safely', () => {
    const emptyDto: AiArtifactDto = {};

    const model = aiArtifactMapper.toModel(emptyDto);

    expect(model.id).toBe('');
    expect(model.type).toBe(AiArtifactType.CHAT_ANSWER);
    expect(model.typeLabel).toBe('Trợ lý AI');
    expect(model.title).toBe('Tri thức AI VeggieConnect');
    expect(model.summary).toBe('');
    expect(model.author.name).toBe('Thành viên ẩn danh');
    expect(model.author.anonymous).toBe(true);
    expect(model.lifecycle.status).toBe(AiArtifactStatus.DRAFT);
    expect(model.lifecycle.visibility).toBe(AiArtifactVisibility.PRIVATE);
    expect(model.isPublic).toBe(false);
    expect(model.isSubmitted).toBe(false);
    expect(model.isVerified).toBe(false);
    expect(model.activeVerification).toBeNull();
    expect(model.verificationHistory).toEqual([]);
  });

  it('maps paginated public artifact list response correctly', () => {
    const response: PublicAiArtifactListResponseDto = {
      success: true,
      data: [
        {
          id: 'art-1',
          type: 'CHAT_ANSWER',
          title: 'Bài 1',
        },
        {
          id: 'art-2',
          type: 'RECIPE_NUTRITION',
          title: 'Bài 2',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };

    const paginated = aiArtifactMapper.toPaginationModel(response);

    expect(paginated.items).toHaveLength(2);
    expect(paginated.items[0].title).toBe('Bài 1');
    expect(paginated.items[1].title).toBe('Bài 2');
    expect(paginated.metadata.page).toBe(1);
    expect(paginated.metadata.limit).toBe(10);
    expect(paginated.metadata.totalItems).toBe(25);
    expect(paginated.metadata.totalPages).toBe(3);
    expect(paginated.metadata.hasNextPage).toBe(true);
    expect(paginated.metadata.hasPrevPage).toBe(false);
  });
});
