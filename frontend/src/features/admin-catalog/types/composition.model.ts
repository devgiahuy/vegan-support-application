export type CompositionStatus = 'UNKNOWN' | 'PARTIAL' | 'COMPLETE';
export type CompositionKind = 'UNSPECIFIED' | 'SIMPLE' | 'COMPOUND';
export interface CompositionEvidence {
  sourceId: string;
  sourceVersion: string;
  sourceRecordId: string;
  scope: string;
  sourceCode: string;
  licenseName: string;
  attribution: string;
  reviewedAt: string;
}
export interface IngredientComposition {
  ingredientId: string;
  status: CompositionStatus;
  kind: CompositionKind;
  version: number;
  components: Array<{ id: string; name: string; active: boolean }>;
  evidence: CompositionEvidence;
  complete: boolean;
  inferredAllergenCodes: string[];
  audit: Array<{ version: number; createdAtLabel: string; scope: string }>;
}
export interface CompositionSource {
  id: string;
  name: string;
  licenseName: string;
  attribution: string;
}
export interface CompositionDraft {
  status: CompositionStatus;
  kind: CompositionKind;
  componentIds: string[];
  sourceId: string;
  sourceVersion: string;
  sourceRecordId: string;
  scope: string;
}
