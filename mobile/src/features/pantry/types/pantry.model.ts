export type PantryItemSource = 'MANUAL' | 'FRIDGE_RECOGNITION' | 'RECEIPT';
export type PantryConfirmationStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type PantryConversionStatus = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
export type ExpiryStatus = 'GOOD' | 'WARNING' | 'ALERT' | 'EXPIRED' | 'UNKNOWN';

export interface PantryConversion {
  status: PantryConversionStatus;
  statusLabel: string;
  normalizedGrams: number | null;
  formattedGrams: string;
  confidence: number | null;
  source: string | null;
  version: string | null;
}

export interface PantryItem {
  id: string;
  ingredientId: string | null;
  ingredientName: string | null;
  unmatchedText: string | null;
  displayName: string;
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
  expiryStatus: ExpiryStatus;
  expiryBadgeLabel: string;
  daysRemaining: number | null;
}

export interface PantryItemFormValues {
  ingredientId?: string;
  unmatchedText: string;
  quantity: number;
  unit: string;
  purchasedAt?: string;
  openedAt?: string;
  expiresAt?: string;
  freshnessNote?: string;
  idempotencyKey: string;
}

export interface PantryListFilters {
  page?: number;
  limit?: number;
  search?: string;
  includeZero?: boolean;
}

export interface PantryObservationValues {
  expectedVersion: number;
  purchasedAt: string;
  openedAt: string;
  expiresAt: string;
  freshnessNote: string;
}

export interface PantryAdjustmentValues {
  type: 'CONSUME' | 'RESTORE' | 'ADJUST';
  amount: number;
  unit: string;
  expectedVersion: number;
  reason: string;
  idempotencyKey: string;
}

export interface PantryAdjustment {
  id: string;
  typeLabel: string;
  delta: number;
  unit: string;
  before: number;
  after: number;
  reason: string | null;
  createdAt: string;
}

export interface PantryMergePreview {
  canMerge: boolean;
  targetItemId: string;
  label: string;
  quantity: number;
  unit: string;
  warnings: string[];
}

export interface PantryMergeValues {
  targetItemId: string;
  items: { id: string; expectedVersion: number }[];
  idempotencyKey: string;
}
