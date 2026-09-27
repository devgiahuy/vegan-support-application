/**
 * DTOs for Phase 20 Pantry Inventory Management
 * Direct representations of Backend OpenAPI responses and requests
 */

export type PantryItemSourceDto = 'MANUAL' | 'FRIDGE_RECOGNITION' | 'RECEIPT';
export type PantryConfirmationStatusDto = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type PantryConversionStatusDto = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
export type PantryAdjustmentTypeDto = 'CONSUME' | 'RESTORE' | 'ADJUST';

export interface PantryConversionDto {
  status: PantryConversionStatusDto;
  normalizedGrams: number | null;
  source: string | null;
  version: string | null;
  confidence: number | null;
}

export interface PantryIngredientRefDto {
  id: string;
  name: string;
}

export interface PantryItemDto {
  id: string;
  ingredient: PantryIngredientRefDto | null;
  unmatchedText: string | null;
  quantity: number;
  unit: string;
  conversion: PantryConversionDto;
  source: PantryItemSourceDto;
  confidence: number;
  confirmationStatus: PantryConfirmationStatusDto;
  purchasedAt: string | null;
  openedAt: string | null;
  expiresAt: string | null;
  freshnessNote: string | null;
  version: number;
}

export interface PantryAdjustmentDto {
  id: string;
  type: PantryAdjustmentTypeDto;
  input: {
    quantity: number;
    unit: string;
  };
  appliedDelta: {
    quantity: number;
    normalizedGrams: number | null;
  };
  balance: {
    beforeQuantity: number;
    afterQuantity: number;
    beforeGrams: number | null;
    afterGrams: number | null;
  };
  versionBefore: number;
  versionAfter: number;
  reason: string | null;
  mergedFromItemId: string | null;
  createdAt: string;
}

export interface PantryMergePreviewDto {
  canMerge: boolean;
  identity: {
    ingredientId: string | null;
    label: string;
  };
  targetItemId: string;
  itemCount: number;
  result: {
    quantity: number;
    unit: string;
    normalizedGrams: number | null;
    conversionStatus: PantryConversionStatusDto;
  };
  warnings: string[];
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

export interface CreatePantryAdjustmentConsumeReqDto {
  type: 'CONSUME';
  quantity: number;
  unit: string;
  expectedVersion: number;
  idempotencyKey: string;
  reason?: string;
}

export interface CreatePantryAdjustmentRestoreReqDto {
  type: 'RESTORE';
  quantity: number;
  unit: string;
  expectedVersion: number;
  idempotencyKey: string;
  reason?: string;
}

export interface CreatePantryAdjustmentAdjustReqDto {
  type: 'ADJUST';
  deltaQuantity: number;
  unit: string;
  expectedVersion: number;
  idempotencyKey: string;
  reason: string;
}

export type CreatePantryAdjustmentReqDto =
  | CreatePantryAdjustmentConsumeReqDto
  | CreatePantryAdjustmentRestoreReqDto
  | CreatePantryAdjustmentAdjustReqDto;

export interface MergePreviewReqDto {
  itemIds: string[];
}

export interface MergePantryItemsReqDto {
  targetItemId: string;
  items: Array<{
    id: string;
    expectedVersion: number;
  }>;
  idempotencyKey: string;
}

export interface PantryListQueryDto {
  page?: number;
  limit?: number;
  ingredientId?: string;
  source?: PantryItemSourceDto;
  confirmationStatus?: PantryConfirmationStatusDto;
  conversionStatus?: PantryConversionStatusDto;
  search?: string;
  expiresFrom?: string;
  expiresTo?: string;
  includeZero?: boolean | string;
}

export interface ExpiringSoonQueryDto {
  asOf?: string;
  days?: number;
  page?: number;
  limit?: number;
}

export interface PantryAdjustmentListQueryDto {
  page?: number;
  limit?: number;
}

/* Envelopes */
export interface PantryItemEnvelopeDto {
  success: true;
  data: PantryItemDto;
}

export interface PantryListEnvelopeDto {
  success: true;
  data: PantryItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MergePreviewEnvelopeDto {
  success: true;
  data: PantryMergePreviewDto;
}
