import { FoodDataProvider } from '@prisma/client';
import type { ImportFoodRecord } from './food-data.schemas.js';

export type CanonicalImportRecord = ImportFoodRecord;

export interface FoodDataImportAdapter {
  readonly provider: FoodDataProvider;
  normalize(records: ImportFoodRecord[]): CanonicalImportRecord[];
}

class PassthroughFoodDataAdapter implements FoodDataImportAdapter {
  constructor(readonly provider: FoodDataProvider) {}

  normalize(records: ImportFoodRecord[]): CanonicalImportRecord[] {
    return records.map((record) => ({
      ...record,
      canonicalName: record.canonicalName.trim(),
      preparation: record.preparation.trim().toLowerCase(),
      aliases: record.aliases.map((alias) => ({ ...alias, name: alias.name.trim() })),
      nutrients: record.nutrients.map((nutrient) => ({
        ...nutrient,
        nutrientCode: nutrient.nutrientCode.trim().toUpperCase(),
      })),
    }));
  }
}

const adapters = new Map<FoodDataProvider, FoodDataImportAdapter>([
  [FoodDataProvider.USDA_FDC, new PassthroughFoodDataAdapter(FoodDataProvider.USDA_FDC)],
  [
    FoodDataProvider.VIETNAM_CURATED,
    new PassthroughFoodDataAdapter(FoodDataProvider.VIETNAM_CURATED),
  ],
  [
    FoodDataProvider.OPEN_FOOD_FACTS,
    new PassthroughFoodDataAdapter(FoodDataProvider.OPEN_FOOD_FACTS),
  ],
  [FoodDataProvider.MANUAL, new PassthroughFoodDataAdapter(FoodDataProvider.MANUAL)],
]);

export function getFoodDataImportAdapter(provider: FoodDataProvider): FoodDataImportAdapter {
  const adapter = adapters.get(provider);
  if (!adapter) throw new Error(`Unsupported authoritative food-data provider: ${provider}`);
  return adapter;
}
