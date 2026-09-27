/**
 * Clean UI Models for Phase 20 Pantry Inventory Management
 * Strictly typed, camelCase, with formatted fields and UI state helpers
 */

export type PantryItemSource = 'MANUAL' | 'FRIDGE_RECOGNITION' | 'RECEIPT';
export type PantryConfirmationStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type PantryConversionStatus = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
export type PantryAdjustmentType = 'CONSUME' | 'RESTORE' | 'ADJUST';

export type ExpiryStatus = 'SAFE' | 'WARNING' | 'EXPIRED' | 'UNKNOWN';

export interface PantryConversion {
  status: PantryConversionStatus;
  statusLabel: string;
  normalizedGrams: number | null;
  formattedGrams: string;
  source: string;
  version: string;
  confidence: number | null;
}

export interface PantryItem {
  id: string;
  ingredientId: string | null;
  ingredientName: string | null;
  unmatchedText: string | null;
  displayName: string;
  isCanonical: boolean;
  quantity: number;
  unit: string;
  formattedQuantity: string;
  conversion: PantryConversion;
  source: PantryItemSource;
  sourceLabel: string;
  confidence: number;
  confirmationStatus: PantryConfirmationStatus;
  purchasedAt: string | null;
  openedAt: string | null;
  expiresAt: string | null;
  freshnessNote: string | null;
  version: number;
  // UI helpers
  expiryStatus: ExpiryStatus;
  expiryBadgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  expiryBadgeLabel: string;
  daysRemaining: number | null;
}

export interface PantryAdjustment {
  id: string;
  type: PantryAdjustmentType;
  typeLabel: string;
  inputQuantity: number;
  inputUnit: string;
  formattedInput: string;
  deltaQuantity: number;
  deltaGrams: number | null;
  formattedDelta: string;
  beforeQuantity: number;
  afterQuantity: number;
  formattedBalance: string;
  versionBefore: number;
  versionAfter: number;
  reason: string;
  mergedFromItemId: string | null;
  createdAt: string;
  formattedDate: string;
}

export interface PantryMergePreview {
  canMerge: boolean;
  ingredientId: string | null;
  label: string;
  targetItemId: string;
  itemCount: number;
  resultQuantity: number;
  resultUnit: string;
  formattedResultQuantity: string;
  resultGrams: number | null;
  conversionStatus: PantryConversionStatus;
  warnings: string[];
}

export interface PantryFilter {
  search?: string;
  source?: PantryItemSource | 'ALL';
  conversionStatus?: PantryConversionStatus | 'ALL';
  expiringOnly?: boolean;
}
