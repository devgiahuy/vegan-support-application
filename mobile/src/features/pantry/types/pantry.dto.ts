export type PantryItemSourceDto = 'MANUAL' | 'FRIDGE_RECOGNITION' | 'RECEIPT';
export type PantryConfirmationStatusDto = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type PantryConversionStatusDto = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
export type PantryAdjustmentTypeDto = 'CONSUME' | 'RESTORE' | 'ADJUST';

export interface PantryConversionDto {
  status?: PantryConversionStatusDto;
  normalizedGrams?: number | string | null;
  source?: string | null;
  version?: string | null;
  confidence?: number | string | null;
}

export interface PantryIngredientRefDto {
  id?: string;
  name?: string;
}

export interface PantryItemDto {
  id?: string;
  ingredient?: PantryIngredientRefDto | null;
  unmatchedText?: string | null;
  unmatched_text?: string | null;
  quantity?: number | string;
  unit?: string;
  conversion?: PantryConversionDto | null;
  source?: PantryItemSourceDto;
  confidence?: number | string;
  confirmationStatus?: PantryConfirmationStatusDto;
  confirmation_status?: PantryConfirmationStatusDto;
  purchasedAt?: string | null;
  purchased_at?: string | null;
  openedAt?: string | null;
  opened_at?: string | null;
  expiresAt?: string | null;
  expires_at?: string | null;
  freshnessNote?: string | null;
  freshness_note?: string | null;
  expiryStatus?: 'GOOD' | 'WARNING' | 'ALERT' | 'EXPIRED' | null;
  daysUntilExpiry?: number | null;
  version?: number | string;
}

export interface PantryAdjustmentDto {
  id?: string;
  type?: PantryAdjustmentTypeDto;
  input?: {
    quantity?: number | string;
    unit?: string;
  };
  appliedDelta?: {
    quantity?: number | string;
    normalizedGrams?: number | string | null;
  };
  balance?: {
    beforeQuantity?: number | string;
    afterQuantity?: number | string;
    beforeGrams?: number | string | null;
    afterGrams?: number | string | null;
  };
  versionBefore?: number | string;
  version_before?: number | string;
  versionAfter?: number | string;
  version_after?: number | string;
  reason?: string | null;
  mergedFromItemId?: string | null;
  merged_from_item_id?: string | null;
  createdAt?: string;
  created_at?: string;
}

export interface CreatePantryItemReqDto {
  ingredientId?: string;
  unmatchedText?: string;
  quantity: number;
  unit: string;
  confidence?: number;
  purchasedAt?: string | null;
  openedAt?: string | null;
  expiresAt?: string | null;
  freshnessNote?: string | null;
  idempotencyKey: string;
}

export interface UpdatePantryItemReqDto {
  expectedVersion: number;
  confidence?: number;
  purchasedAt?: string | null;
  openedAt?: string | null;
  expiresAt?: string | null;
  freshnessNote?: string | null;
}

export interface PantryListQueryDto {
  page?: number;
  limit?: number;
  source?: PantryItemSourceDto;
  confirmationStatus?: PantryConfirmationStatusDto;
  conversionStatus?: PantryConversionStatusDto;
  search?: string;
  includeZero?: boolean | string;
}

export interface PantryListEnvelopeDto {
  success: true;
  data: PantryItemDto[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PantryItemEnvelopeDto {
  success: true;
  data: PantryItemDto;
}

export interface PantryAdjustmentEnvelopeDto {
  success: true;
  data: {
    item: PantryItemDto;
    adjustment: PantryAdjustmentDto;
  };
}

export interface PantryAdjustmentListEnvelopeDto {
  success: true;
  data: PantryAdjustmentDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type CreatePantryAdjustmentReqDto =
  | {
      type: 'CONSUME' | 'RESTORE';
      quantity: number;
      unit: string;
      expectedVersion: number;
      idempotencyKey: string;
      reason?: string;
    }
  | {
      type: 'ADJUST';
      deltaQuantity: number;
      unit: string;
      expectedVersion: number;
      idempotencyKey: string;
      reason: string;
    };

export interface PantryMergePreviewDto {
  canMerge: boolean;
  targetItemId: string;
  identity: { ingredientId: string | null; label: string };
  itemCount: number;
  result: {
    quantity: number;
    unit: string;
    normalizedGrams: number | null;
    conversionStatus: PantryConversionStatusDto;
  };
  warnings: string[];
}

export interface MergePreviewEnvelopeDto {
  success: true;
  data: PantryMergePreviewDto;
}

export interface MergePantryItemsReqDto {
  targetItemId: string;
  items: { id: string; expectedVersion: number }[];
  idempotencyKey: string;
}
