import { BaseMapper, pickField, safeNumber, safeString, safeEnum } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import type { PaginationResult } from '@/types/api';
import type {
  PantryItemDto,
  PantryAdjustmentDto,
  PantryMergePreviewDto,
  CreatePantryItemReqDto,
  UpdatePantryItemReqDto,
  CreatePantryAdjustmentReqDto,
  MergePantryItemsReqDto,
  PantryItemSourceDto,
  PantryConfirmationStatusDto,
  PantryConversionStatusDto,
  PantryAdjustmentTypeDto,
  PantryListEnvelopeDto,
} from '../types/pantry.dto';

import type {
  PantryItem,
  PantryAdjustment,
  PantryMergePreview,
  ExpiryStatus,
  PantryConversionStatus,
  PantryItemSource,
  PantryConfirmationStatus,
  PantryAdjustmentType,
} from '../types/pantry.model';
import type {
  PantryItemFormData,
  PantryUpdateFormData,
  PantryAdjustmentFormData,
} from '../schemas/pantry.schema';

export class PantryMapper extends BaseMapper<PantryItemDto, PantryItem> {
  toModel(dto: PantryItemDto | null | undefined): PantryItem {
    const id = safeString(pickField(dto, ['id'], ''));
    const ingredientObj = pickField<PantryItemDto['ingredient']>(dto, ['ingredient'], null);
    const ingredientId = ingredientObj ? safeString(ingredientObj.id, '') : null;
    const ingredientName = ingredientObj ? safeString(ingredientObj.name, '') : null;
    const unmatchedText =
      safeString(pickField(dto, ['unmatchedText', 'unmatched_text'], '')) || null;

    const displayName = ingredientName || unmatchedText || 'Nguyên liệu chưa đặt tên';
    const isCanonical = Boolean(ingredientId);

    const quantity = safeNumber(pickField(dto, ['quantity'], 0));
    const unit = safeString(pickField(dto, ['unit'], ''));
    const formattedQuantity = `${quantity.toLocaleString('vi-VN')} ${unit}`.trim();

    const conversionRaw = pickField<PantryItemDto['conversion'] | null>(dto, ['conversion'], null);
    const conversionStatusRaw = conversionRaw?.status || 'UNKNOWN';
    const conversionStatus: PantryConversionStatus =
      conversionStatusRaw === 'EXACT' ||
      conversionStatusRaw === 'APPROXIMATE' ||
      conversionStatusRaw === 'UNKNOWN'
        ? conversionStatusRaw
        : 'UNKNOWN';

    const normalizedGrams =
      conversionRaw?.normalizedGrams !== undefined && conversionRaw?.normalizedGrams !== null
        ? safeNumber(conversionRaw.normalizedGrams, 0)
        : null;
    const formattedGrams =
      normalizedGrams !== null ? `≈ ${normalizedGrams.toLocaleString('vi-VN')}g` : '';

    const conversionStatusLabelMap: Record<PantryConversionStatus, string> = {
      EXACT: 'Quy đổi chính xác',
      APPROXIMATE: 'Quy đổi xấp xỉ',
      UNKNOWN: 'Chưa có quy đổi gam',
    };

    const sourceRaw = safeString(pickField(dto, ['source'], 'MANUAL'));
    const source: PantryItemSource =
      sourceRaw === 'MANUAL' || sourceRaw === 'FRIDGE_RECOGNITION' || sourceRaw === 'RECEIPT'
        ? sourceRaw
        : 'MANUAL';

    const sourceLabelMap: Record<PantryItemSource, string> = {
      MANUAL: 'Nhập thủ công',
      FRIDGE_RECOGNITION: 'Nhận diện tủ lạnh',
      RECEIPT: 'Quét hóa đơn',
    };

    const confirmationStatusRaw = safeString(
      pickField(dto, ['confirmationStatus', 'confirmation_status'], 'CONFIRMED')
    );
    const confirmationStatus: PantryConfirmationStatus =
      confirmationStatusRaw === 'CONFIRMED' ||
      confirmationStatusRaw === 'PENDING' ||
      confirmationStatusRaw === 'REJECTED'
        ? confirmationStatusRaw
        : 'CONFIRMED';

    const purchasedAt = safeString(pickField(dto, ['purchasedAt', 'purchased_at'], '')) || null;
    const openedAt = safeString(pickField(dto, ['openedAt', 'opened_at'], '')) || null;
    const expiresAt = safeString(pickField(dto, ['expiresAt', 'expires_at'], '')) || null;
    const freshnessNote =
      safeString(pickField(dto, ['freshnessNote', 'freshness_note'], '')) || null;
    const version = safeNumber(pickField(dto, ['version'], 1));

    const backendExpiryStatusRaw = pickField(dto, ['expiryStatus', 'expiry_status'], null);
    const backendExpiryStatus =
      backendExpiryStatusRaw === 'GOOD' ||
      backendExpiryStatusRaw === 'WARNING' ||
      backendExpiryStatusRaw === 'ALERT' ||
      backendExpiryStatusRaw === 'EXPIRED'
        ? backendExpiryStatusRaw
        : null;
    const daysUntilExpiryVal = pickField(dto, ['daysUntilExpiry', 'days_until_expiry'], null);
    const daysUntilExpiry =
      daysUntilExpiryVal !== null && daysUntilExpiryVal !== undefined
        ? safeNumber(daysUntilExpiryVal)
        : null;
    const expiryStatusAsOf =
      safeString(pickField(dto, ['expiryStatusAsOf', 'expiry_status_as_of'], '')) || null;

    // Expiry calculation
    const {
      status: expiryStatus,
      variant: expiryBadgeVariant,
      label: expiryBadgeLabel,
      daysRemaining,
    } = this.calculateExpiryStatus(expiresAt, backendExpiryStatus, daysUntilExpiry);

    return {
      id,
      ingredientId,
      ingredientName,
      unmatchedText,
      displayName,
      isCanonical,
      quantity,
      unit,
      formattedQuantity,
      conversion: {
        status: conversionStatus,
        statusLabel: conversionStatusLabelMap[conversionStatus],
        normalizedGrams,
        formattedGrams,
        source: safeString(conversionRaw?.source, ''),
        version: safeString(conversionRaw?.version, ''),
        confidence:
          conversionRaw?.confidence !== undefined && conversionRaw?.confidence !== null
            ? safeNumber(conversionRaw.confidence, 1)
            : null,
      },
      source,
      sourceLabel: sourceLabelMap[source],
      confidence: safeNumber(pickField(dto, ['confidence'], 1)),
      confirmationStatus,
      purchasedAt,
      openedAt,
      expiresAt,
      freshnessNote,
      version,
      expiryStatus,
      backendExpiryStatus,
      daysUntilExpiry,
      expiryStatusAsOf,
      expiryBadgeVariant,
      expiryBadgeLabel,
      daysRemaining,
    };
  }

  private calculateExpiryStatus(
    expiresAt: string | null,
    backendStatus?: string | null,
    backendDays?: number | null
  ): {
    status: ExpiryStatus;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    daysRemaining: number | null;
  } {
    if (backendStatus) {
      if (backendStatus === 'EXPIRED') {
        return {
          status: 'EXPIRED',
          variant: 'destructive',
          label:
            backendDays !== null && backendDays !== undefined
              ? `Đã quá hạn ${Math.abs(backendDays)} ngày`
              : 'Đã hết hạn',
          daysRemaining: backendDays ?? null,
        };
      }
      if (backendStatus === 'ALERT') {
        return {
          status: 'ALERT',
          variant: 'destructive',
          label:
            backendDays === 0
              ? 'Hết hạn hôm nay'
              : backendDays === 1
                ? 'Còn 1 ngày (Cảnh báo khẩn)'
                : `Còn ${backendDays ?? 0} ngày (Cảnh báo khẩn)`,
          daysRemaining: backendDays ?? null,
        };
      }
      if (backendStatus === 'WARNING') {
        return {
          status: 'WARNING',
          variant: 'secondary',
          label: `Còn ${backendDays ?? 0} ngày`,
          daysRemaining: backendDays ?? null,
        };
      }
      if (backendStatus === 'GOOD') {
        return {
          status: 'SAFE',
          variant: 'default',
          label: `Còn ${backendDays ?? 0} ngày`,
          daysRemaining: backendDays ?? null,
        };
      }
    }

    if (!expiresAt) {
      return {
        status: 'UNKNOWN',
        variant: 'outline',
        label: 'Không có hạn',
        daysRemaining: null,
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(expiresAt);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          status: 'EXPIRED',
          variant: 'destructive',
          label: `Đã quá hạn ${Math.abs(diffDays)} ngày`,
          daysRemaining: diffDays,
        };
      }
      if (diffDays <= 3) {
        return {
          status: 'WARNING',
          variant: 'secondary',
          label: diffDays === 0 ? 'Hết hạn hôm nay' : `Còn ${diffDays} ngày`,
          daysRemaining: diffDays,
        };
      }
      return {
        status: 'SAFE',
        variant: 'default',
        label: `Còn ${diffDays} ngày`,
        daysRemaining: diffDays,
      };
    } catch {
      return {
        status: 'UNKNOWN',
        variant: 'outline',
        label: 'Không rõ hạn',
        daysRemaining: null,
      };
    }
  }

  toPantryPaginationModel(
    envelope: PantryListEnvelopeDto | null | undefined
  ): PaginationResult<PantryItem> {
    if (!envelope || !envelope.data) {
      return {
        items: [],
        metadata: {
          page: 1,
          limit: 20,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    return {
      items: this.toModelList(envelope.data),
      metadata: {
        page: envelope.meta?.page ?? 1,
        limit: envelope.meta?.limit ?? 20,
        totalItems: envelope.meta?.total ?? envelope.data.length,
        totalPages: envelope.meta?.totalPages ?? 1,
        hasNextPage: (envelope.meta?.page ?? 1) < (envelope.meta?.totalPages ?? 1),
        hasPrevPage: (envelope.meta?.page ?? 1) > 1,
      },
    };
  }

  toAdjustmentModel(dto: PantryAdjustmentDto | null | undefined): PantryAdjustment {
    const id = safeString(pickField(dto, ['id'], ''));
    const typeRaw = pickField(dto, ['type'], 'CONSUME');
    const type: PantryAdjustmentType =
      typeRaw === 'CONSUME' || typeRaw === 'RESTORE' || typeRaw === 'ADJUST' ? typeRaw : 'CONSUME';

    const typeLabelMap: Record<PantryAdjustmentType, string> = {
      CONSUME: 'Tiêu hao',
      RESTORE: 'Hoàn trả',
      ADJUST: 'Điều chỉnh số lượng',
    };

    const inputQuantity = safeNumber(dto?.input?.quantity, 0);
    const inputUnit = safeString(dto?.input?.unit, '');
    const formattedInput = `${inputQuantity.toLocaleString('vi-VN')} ${inputUnit}`.trim();

    const deltaQuantity = safeNumber(dto?.appliedDelta?.quantity, 0);
    const deltaGrams =
      dto?.appliedDelta?.normalizedGrams !== undefined &&
      dto?.appliedDelta?.normalizedGrams !== null
        ? safeNumber(dto.appliedDelta.normalizedGrams, 0)
        : null;
    const formattedDelta =
      `${deltaQuantity > 0 ? '+' : ''}${deltaQuantity.toLocaleString('vi-VN')} ${inputUnit}`.trim();

    const beforeQuantity = safeNumber(dto?.balance?.beforeQuantity, 0);
    const afterQuantity = safeNumber(dto?.balance?.afterQuantity, 0);
    const formattedBalance =
      `${beforeQuantity.toLocaleString('vi-VN')} → ${afterQuantity.toLocaleString('vi-VN')} ${inputUnit}`.trim();

    const versionBefore = safeNumber(pickField(dto, ['versionBefore', 'version_before'], 0));
    const versionAfter = safeNumber(pickField(dto, ['versionAfter', 'version_after'], 1));
    const reason = safeString(pickField(dto, ['reason'], ''));
    const mergedFromItemId =
      safeString(pickField(dto, ['mergedFromItemId', 'merged_from_item_id'], '')) || null;
    const createdAt = safeString(pickField(dto, ['createdAt', 'created_at'], ''));
    const formattedDate = createdAt ? formatDate(createdAt) : '';

    return {
      id,
      type,
      typeLabel: typeLabelMap[type],
      inputQuantity,
      inputUnit,
      formattedInput,
      deltaQuantity,
      deltaGrams,
      formattedDelta,
      beforeQuantity,
      afterQuantity,
      formattedBalance,
      versionBefore,
      versionAfter,
      reason,
      mergedFromItemId,
      createdAt,
      formattedDate,
    };
  }

  toMergePreviewModel(dto: PantryMergePreviewDto | null | undefined): PantryMergePreview {
    const canMerge = Boolean(dto?.canMerge);
    const ingredientId = dto?.identity?.ingredientId || null;
    const label = safeString(dto?.identity?.label, 'Nguyên liệu');
    const targetItemId = safeString(dto?.targetItemId, '');
    const itemCount = safeNumber(dto?.itemCount, 0);

    const resultQuantity = safeNumber(dto?.result?.quantity, 0);
    const resultUnit = safeString(dto?.result?.unit, '');
    const formattedResultQuantity =
      `${resultQuantity.toLocaleString('vi-VN')} ${resultUnit}`.trim();
    const resultGrams =
      dto?.result?.normalizedGrams !== undefined && dto?.result?.normalizedGrams !== null
        ? safeNumber(dto.result.normalizedGrams, 0)
        : null;

    const conversionStatusRaw = dto?.result?.conversionStatus;
    const conversionStatus: PantryConversionStatus =
      conversionStatusRaw === 'EXACT' ||
      conversionStatusRaw === 'APPROXIMATE' ||
      conversionStatusRaw === 'UNKNOWN'
        ? conversionStatusRaw
        : 'UNKNOWN';

    const warnings = Array.isArray(dto?.warnings) ? dto.warnings.map((w) => safeString(w, '')) : [];

    return {
      canMerge,
      ingredientId,
      label,
      targetItemId,
      itemCount,
      resultQuantity,
      resultUnit,
      formattedResultQuantity,
      resultGrams,
      conversionStatus,
      warnings,
    };
  }

  toCreateDto(form: PantryItemFormData, idempotencyKey: string): CreatePantryItemReqDto {
    const base: CreatePantryItemReqDto = {
      quantity: form.quantity,
      unit: form.unit.trim(),
      confidence: form.confidence,
      purchasedAt: form.purchasedAt || null,
      openedAt: form.openedAt || null,
      expiresAt: form.expiresAt || null,
      freshnessNote: form.freshnessNote?.trim() || null,
      idempotencyKey,
    };

    if (form.isCanonical && form.ingredientId) {
      base.ingredientId = form.ingredientId;
    } else if (form.unmatchedText) {
      base.unmatchedText = form.unmatchedText.trim();
    }
    return base;
  }

  toUpdateDto(form: PantryUpdateFormData): UpdatePantryItemReqDto {
    return {
      expectedVersion: form.expectedVersion,
      confidence: form.confidence,
      purchasedAt: form.purchasedAt || null,
      openedAt: form.openedAt || null,
      expiresAt: form.expiresAt || null,
      freshnessNote: form.freshnessNote?.trim() || null,
    };
  }

  toAdjustmentCreateDto(
    form: PantryAdjustmentFormData,
    idempotencyKey: string
  ): CreatePantryAdjustmentReqDto {
    const reason = form.reason?.trim() ? form.reason.trim() : undefined;

    if (form.type === 'CONSUME') {
      return {
        type: 'CONSUME',
        quantity: form.quantity,
        unit: form.unit.trim(),
        expectedVersion: form.expectedVersion,
        idempotencyKey,
        ...(reason ? { reason } : {}),
      };
    }
    if (form.type === 'RESTORE') {
      return {
        type: 'RESTORE',
        quantity: form.quantity,
        unit: form.unit.trim(),
        expectedVersion: form.expectedVersion,
        idempotencyKey,
        ...(reason ? { reason } : {}),
      };
    }
    return {
      type: 'ADJUST',
      deltaQuantity: form.deltaQuantity,
      unit: form.unit.trim(),
      expectedVersion: form.expectedVersion,
      idempotencyKey,
      reason: form.reason.trim(),
    };
  }

  toMergeDto(
    targetItemId: string,
    items: Array<{ id: string; expectedVersion: number }>,
    idempotencyKey: string
  ): MergePantryItemsReqDto {
    return {
      targetItemId,
      items,
      idempotencyKey,
    };
  }
}

export const pantryMapper = new PantryMapper();
