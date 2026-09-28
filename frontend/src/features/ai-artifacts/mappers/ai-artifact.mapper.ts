import {
  AiArtifactStatus,
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
} from '@/common/enums';
import { BaseMapper } from '@/lib/mapper/base-mapper';
import {
  pickField,
  safeArray,
  safeBoolean,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper/field-helpers';
import type { PaginationResult } from '@/types/api';
import type {
  AiArtifactAuthorDto,
  AiArtifactContentDto,
  AiArtifactDto,
  AiArtifactLifecycleDto,
  NutrientSnapshotDto,
  PublicAiArtifactListResponseDto,
  ReceiptExtractionContentDto,
  RecognitionItemDto,
} from '../types/ai-artifact.dto';
import type { AiVerificationDto } from '../types/ai-verification.dto';
import type {
  AiArtifact,
  AiArtifactAuthor,
  AiArtifactContent,
  AiArtifactLifecycle,
  NutrientSnapshot,
  RecognitionItem,
} from '../types/ai-artifact.model';
import { aiVerificationMapper } from './ai-verification.mapper';

export class AiArtifactMapper extends BaseMapper<AiArtifactDto, AiArtifact> {
  toModel(dto: AiArtifactDto | null | undefined): AiArtifact {
    const rawType = pickField(dto, ['type'], '');
    const type = safeEnum(rawType, AiArtifactType, AiArtifactType.CHAT_ANSWER);

    const typeLabel = this.getTypeLabel(type);

    const authorDto = pickField<AiArtifactAuthorDto | null>(dto, ['author'], null);
    const authorAnonymous = safeBoolean(authorDto?.anonymous, true);
    const author: AiArtifactAuthor = {
      name: safeString(
        authorDto?.name,
        authorAnonymous ? 'Thành viên ẩn danh' : 'Thành viên VeggieConnect'
      ),
      anonymous: authorAnonymous,
    };

    const lifecycleDto = pickField<AiArtifactLifecycleDto | null>(dto, ['lifecycle'], null);
    const status = safeEnum(lifecycleDto?.status, AiArtifactStatus, AiArtifactStatus.DRAFT);
    const visibility = safeEnum(
      lifecycleDto?.visibility,
      AiArtifactVisibility,
      AiArtifactVisibility.PRIVATE
    );

    const lifecycle: AiArtifactLifecycle = {
      status,
      visibility,
      version: safeNumber(lifecycleDto?.version, 1),
      submittedAt: lifecycleDto?.submittedAt ? safeString(lifecycleDto.submittedAt, '') : null,
      sharedAt: lifecycleDto?.sharedAt ? safeString(lifecycleDto.sharedAt, '') : null,
    };

    const activeVerificationDto = pickField<AiVerificationDto | null>(
      dto,
      ['activeVerification'],
      null
    );
    const activeVerification = activeVerificationDto
      ? aiVerificationMapper.toModel(activeVerificationDto)
      : null;

    const verificationHistoryDto = pickField<AiVerificationDto[]>(dto, ['verificationHistory'], []);
    const verificationHistory = safeArray<AiVerificationDto>(verificationHistoryDto).map((item) =>
      aiVerificationMapper.toModel(item)
    );

    const contentDto = pickField<AiArtifactContentDto | undefined>(dto, ['content'], undefined);
    const content = this.mapContent(type, contentDto);

    const isPublic = visibility === AiArtifactVisibility.PUBLIC;
    const isSubmitted = status === AiArtifactStatus.SUBMITTED;
    const isVerified =
      activeVerification !== null &&
      activeVerification.conclusion === AiVerificationConclusion.VERIFIED;

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      type,
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      title: safeString(
        pickField(dto, ['title'], 'Tri thức AI VeggieConnect'),
        'Tri thức AI VeggieConnect'
      ),
      summary: safeString(pickField(dto, ['summary'], ''), ''),
      content,
      author,
      lifecycle,
      activeVerification,
      verificationHistory,
      createdAt: safeString(pickField(dto, ['createdAt'], ''), ''),
      isPublic,
      isSubmitted,
      isVerified,
      typeLabel,
    };
  }

  toPaginationModel(
    response: PublicAiArtifactListResponseDto | PaginationResult<AiArtifactDto> | null | undefined
  ): PaginationResult<AiArtifact> {
    if (!response) {
      return {
        items: [],
        metadata: {
          page: 1,
          limit: 20,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const rawItems: AiArtifactDto[] =
      'data' in response && Array.isArray(response.data)
        ? response.data
        : 'items' in response && Array.isArray(response.items)
          ? response.items
          : [];

    const items = rawItems.map((item) => this.toModel(item));

    const meta =
      'meta' in response && response.meta
        ? response.meta
        : 'metadata' in response && response.metadata
          ? response.metadata
          : null;

    const page = safeNumber(meta?.page, 1);
    const limit = safeNumber(meta?.limit, 20);
    const totalItems = safeNumber(
      meta && 'total' in meta
        ? (meta as { total?: number }).total
        : meta && 'totalItems' in meta
          ? (meta as { totalItems?: number }).totalItems
          : items.length,
      items.length
    );
    const totalPages = safeNumber(meta?.totalPages, Math.ceil(totalItems / (limit || 1)) || 1);

    return {
      items,
      metadata: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private mapContent(type: AiArtifactType, dto?: AiArtifactContentDto): AiArtifactContent {
    if (type === AiArtifactType.RECIPE_NUTRITION && dto?.type === 'RECIPE_NUTRITION') {
      const perServingNutrients: NutrientSnapshot[] = safeArray<NutrientSnapshotDto>(
        dto.perServingNutrients
      ).map((item) => ({
        code: safeString(item?.code, ''),
        name: safeString(item?.name, ''),
        amount: safeNumber(item?.amount, 0),
        unit: safeString(item?.unit, ''),
        origin: safeString(item?.origin, ''),
        confidence: safeNumber(item?.confidence, 1),
        range: {
          min: typeof item?.range?.min === 'number' ? item.range.min : null,
          max: typeof item?.range?.max === 'number' ? item.range.max : null,
        },
      }));

      return {
        type: AiArtifactType.RECIPE_NUTRITION,
        recipe: {
          title: safeString(dto.recipe?.title, 'Công thức chay'),
          servings: safeNumber(dto.recipe?.servings, 1),
        },
        totals: {
          rawGrams: safeNumber(dto.totals?.rawGrams, 0),
          cookedGrams: safeNumber(dto.totals?.cookedGrams, 0),
        },
        perServingNutrients,
        confidence: safeNumber(dto.confidence, 1),
        disclaimer: safeString(dto.disclaimer, ''),
      };
    }

    if (type === AiArtifactType.FRIDGE_RECOGNITION && dto?.type === 'FRIDGE_RECOGNITION') {
      return {
        type: AiArtifactType.FRIDGE_RECOGNITION,
        items: this.mapItems(dto.items),
      };
    }

    if (type === AiArtifactType.RECEIPT_EXTRACTION && dto?.type === 'RECEIPT_EXTRACTION') {
      return {
        type: AiArtifactType.RECEIPT_EXTRACTION,
        items: this.mapItems((dto as ReceiptExtractionContentDto).items),
      };
    }

    // Mặc định hoặc CHAT_ANSWER
    const answer = dto && 'answer' in dto && typeof dto.answer === 'string' ? dto.answer : '';
    return {
      type: AiArtifactType.CHAT_ANSWER,
      answer,
    };
  }

  private mapItems(items?: RecognitionItemDto[]): RecognitionItem[] {
    return safeArray<RecognitionItemDto>(items).map((item) => ({
      name: safeString(item?.name, 'Nguyên liệu'),
      quantity: {
        value: typeof item?.quantity?.value === 'number' ? item.quantity.value : null,
        unit: item?.quantity?.unit ? safeString(item.quantity.unit, '') : null,
      },
      confidence: safeNumber(item?.confidence, 1),
      status: safeString(item?.status, 'DETECTED'),
    }));
  }

  private getTypeLabel(type: AiArtifactType): string {
    switch (type) {
      case AiArtifactType.CHAT_ANSWER:
        return 'Trợ lý AI';
      case AiArtifactType.RECIPE_NUTRITION:
        return 'Dinh dưỡng món ăn';
      case AiArtifactType.FRIDGE_RECOGNITION:
        return 'Nhận diện tủ lạnh';
      case AiArtifactType.RECEIPT_EXTRACTION:
        return 'Bóc tách hóa đơn';
    }
  }
}

export const aiArtifactMapper = new AiArtifactMapper();
