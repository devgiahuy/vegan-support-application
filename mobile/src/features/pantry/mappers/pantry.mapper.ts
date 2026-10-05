import { BaseMapper, pickField, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  CreatePantryItemReqDto,
  PantryAdjustmentEnvelopeDto,
  PantryItemDto,
  PantryListEnvelopeDto,
  PantryAdjustmentDto,
  PantryMergePreviewDto,
  UpdatePantryItemReqDto,
  CreatePantryAdjustmentReqDto,
  MergePantryItemsReqDto,
} from '../types/pantry.dto';
import type {
  ExpiryStatus,
  PantryConfirmationStatus,
  PantryConversionStatus,
  PantryItem,
  PantryItemFormValues,
  PantryItemSource,
  PantryAdjustment,
  PantryAdjustmentValues,
  PantryObservationValues,
  PantryMergePreview,
  PantryMergeValues,
} from '../types/pantry.model';

const CONVERSION_LABELS: Record<PantryConversionStatus, string> = {
  EXACT: 'Quy đổi chính xác',
  APPROXIMATE: 'Quy đổi xấp xỉ',
  UNKNOWN: 'Chưa có quy đổi gam',
};

const SOURCE_LABELS: Record<PantryItemSource, string> = {
  MANUAL: 'Nhập thủ công',
  FRIDGE_RECOGNITION: 'Nhận diện tủ lạnh',
  RECEIPT: 'Quét hóa đơn',
};

function normalizeConversionStatus(value: string): PantryConversionStatus {
  return value === 'EXACT' || value === 'APPROXIMATE' || value === 'UNKNOWN' ? value : 'UNKNOWN';
}

function normalizeSource(value: string): PantryItemSource {
  return value === 'MANUAL' || value === 'FRIDGE_RECOGNITION' || value === 'RECEIPT'
    ? value
    : 'MANUAL';
}

function normalizeConfirmationStatus(value: string): PantryConfirmationStatus {
  return value === 'CONFIRMED' || value === 'PENDING' || value === 'REJECTED' ? value : 'CONFIRMED';
}

function cleanDate(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export class PantryMapper extends BaseMapper<PantryItemDto, PantryItem> {
  toModel(dto: PantryItemDto | null | undefined): PantryItem {
    const ingredient = pickField<PantryItemDto['ingredient']>(dto, ['ingredient'], null);
    const ingredientId = ingredient?.id ? safeString(ingredient.id) : null;
    const ingredientName = ingredient?.name ? safeString(ingredient.name) : null;
    const unmatchedText =
      safeString(pickField(dto, ['unmatchedText', 'unmatched_text'], '')) || null;
    const displayName = ingredientName || unmatchedText || 'Nguyên liệu chưa đặt tên';
    const quantity = safeNumber(pickField(dto, ['quantity'], 0));
    const unit = safeString(pickField(dto, ['unit'], ''));
    const conversionRaw = pickField<PantryItemDto['conversion']>(dto, ['conversion'], null);
    const conversionStatus = normalizeConversionStatus(
      safeString(conversionRaw?.status, 'UNKNOWN')
    );
    const normalizedGrams =
      conversionRaw?.normalizedGrams === null || conversionRaw?.normalizedGrams === undefined
        ? null
        : safeNumber(conversionRaw.normalizedGrams, 0);
    const source = normalizeSource(safeString(pickField(dto, ['source'], 'MANUAL')));
    const expiresAt = cleanDate(safeString(pickField(dto, ['expiresAt', 'expires_at'], '')));
    const calculatedExpiry = this.calculateExpiryStatus(expiresAt);
    const status = dto?.expiryStatus ?? calculatedExpiry.status;
    const days = dto?.daysUntilExpiry ?? calculatedExpiry.daysRemaining;
    const expiry = {
      status,
      daysRemaining: days,
      label:
        days === null
          ? 'Chưa có hạn dùng'
          : days < 0
            ? `Quá hạn ${Math.abs(days)} ngày`
            : days === 0
              ? 'Hạn dùng hôm nay'
              : `Còn ${days} ngày`,
    };

    return {
      id: safeString(pickField(dto, ['id'], '')),
      ingredientId,
      ingredientName,
      unmatchedText,
      displayName,
      quantity,
      unit,
      formattedQuantity: `${quantity.toLocaleString('vi-VN')} ${unit}`.trim(),
      conversion: {
        source: conversionRaw?.source ?? null,
        version: conversionRaw?.version ?? null,
        status: conversionStatus,
        statusLabel: CONVERSION_LABELS[conversionStatus],
        normalizedGrams,
        formattedGrams:
          normalizedGrams === null ? '' : `~ ${normalizedGrams.toLocaleString('vi-VN')} g`,
        confidence:
          conversionRaw?.confidence === null || conversionRaw?.confidence === undefined
            ? null
            : safeNumber(conversionRaw.confidence, 1),
      },
      source,
      sourceLabel: SOURCE_LABELS[source],
      confidence: safeNumber(pickField(dto, ['confidence'], 1)),
      confirmationStatus: normalizeConfirmationStatus(
        safeString(pickField(dto, ['confirmationStatus', 'confirmation_status'], 'CONFIRMED'))
      ),
      purchasedAt: cleanDate(safeString(pickField(dto, ['purchasedAt', 'purchased_at'], ''))),
      openedAt: cleanDate(safeString(pickField(dto, ['openedAt', 'opened_at'], ''))),
      expiresAt,
      freshnessNote: cleanDate(safeString(pickField(dto, ['freshnessNote', 'freshness_note'], ''))),
      version: safeNumber(pickField(dto, ['version'], 1)),
      expiryStatus: expiry.status,
      expiryBadgeLabel: expiry.label,
      daysRemaining: expiry.daysRemaining,
    };
  }

  toPantryPaginationModel(
    envelope: PantryListEnvelopeDto | null | undefined
  ): PaginationResult<PantryItem> {
    const items = envelope?.data ?? [];
    const meta = envelope?.meta;
    return {
      items: this.toModelList(items),
      metadata: {
        page: meta?.page ?? 1,
        limit: meta?.limit ?? 20,
        totalItems: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
        hasNextPage: (meta?.page ?? 1) < (meta?.totalPages ?? 1),
        hasPrevPage: (meta?.page ?? 1) > 1,
      },
    };
  }

  toCreateDto(values: PantryItemFormValues): CreatePantryItemReqDto {
    const dto: CreatePantryItemReqDto = {
      quantity: values.quantity,
      unit: values.unit.trim(),
      confidence: 1,
      purchasedAt: cleanDate(values.purchasedAt),
      openedAt: cleanDate(values.openedAt),
      expiresAt: cleanDate(values.expiresAt),
      ...(values.freshnessNote?.trim() ? { freshnessNote: values.freshnessNote.trim() } : {}),
      idempotencyKey: values.idempotencyKey,
    };
    if (values.ingredientId) {
      dto.ingredientId = values.ingredientId;
    } else {
      dto.unmatchedText = values.unmatchedText.trim();
    }
    return dto;
  }

  toCreatedItem(envelope: PantryAdjustmentEnvelopeDto): PantryItem {
    return this.toModel(envelope.data.item);
  }

  toUpdateDto(values: PantryObservationValues): UpdatePantryItemReqDto {
    return {
      expectedVersion: values.expectedVersion,
      purchasedAt: cleanDate(values.purchasedAt),
      openedAt: cleanDate(values.openedAt),
      expiresAt: cleanDate(values.expiresAt),
      freshnessNote: cleanDate(values.freshnessNote),
    };
  }

  toAdjustmentDto(values: PantryAdjustmentValues): CreatePantryAdjustmentReqDto {
    const common = {
      unit: values.unit,
      expectedVersion: values.expectedVersion,
      idempotencyKey: values.idempotencyKey,
    };
    if (values.type === 'ADJUST')
      return {
        ...common,
        type: 'ADJUST',
        deltaQuantity: values.amount,
        reason: values.reason.trim(),
      };
    return {
      ...common,
      type: values.type,
      quantity: values.amount,
      ...(values.reason.trim() ? { reason: values.reason.trim() } : {}),
    };
  }

  toAdjustmentModel(dto: PantryAdjustmentDto): PantryAdjustment {
    return {
      id: safeString(dto.id),
      typeLabel:
        dto.type === 'CONSUME' ? 'Đã dùng' : dto.type === 'RESTORE' ? 'Hoàn trả' : 'Điều chỉnh',
      delta: safeNumber(dto.appliedDelta?.quantity),
      unit: safeString(dto.input?.unit),
      before: safeNumber(dto.balance?.beforeQuantity),
      after: safeNumber(dto.balance?.afterQuantity),
      reason: dto.reason || null,
      createdAt: safeString(dto.createdAt),
    };
  }

  toMergePreviewModel(dto: PantryMergePreviewDto): PantryMergePreview {
    return {
      canMerge: dto.canMerge === true,
      targetItemId: dto.targetItemId,
      label: dto.identity.label,
      quantity: dto.result.quantity,
      unit: dto.result.unit,
      warnings: dto.warnings ?? [],
    };
  }

  toMergeDto(values: PantryMergeValues): MergePantryItemsReqDto {
    return {
      targetItemId: values.targetItemId,
      items: values.items.map(({ id, expectedVersion }) => ({
        id,
        expectedVersion,
      })),
      idempotencyKey: values.idempotencyKey,
    };
  }

  private calculateExpiryStatus(expiresAt: string | null): {
    status: ExpiryStatus;
    label: string;
    daysRemaining: number | null;
  } {
    if (!expiresAt) {
      return { status: 'UNKNOWN', label: 'Khong co han', daysRemaining: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expiresAt);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (!Number.isFinite(diffDays)) {
      return { status: 'UNKNOWN', label: 'Khong ro han', daysRemaining: null };
    }
    if (diffDays < 0) {
      return {
        status: 'EXPIRED',
        label: `Qua han ${Math.abs(diffDays)} ngay`,
        daysRemaining: diffDays,
      };
    }
    if (diffDays <= 3) {
      return {
        status: diffDays <= 1 ? 'ALERT' : 'WARNING',
        label: diffDays === 0 ? 'Hạn dùng hôm nay' : `Còn ${diffDays} ngày`,
        daysRemaining: diffDays,
      };
    }
    return {
      status: 'GOOD',
      label: `Còn ${diffDays} ngày`,
      daysRemaining: diffDays,
    };
  }
}

export const pantryMapper = new PantryMapper();
