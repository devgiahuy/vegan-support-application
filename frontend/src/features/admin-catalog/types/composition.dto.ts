export interface CompositionDto {
  ingredientId?: string;
  status?: string;
  kind?: string;
  version?: number;
  componentIds?: string[];
  components?: Array<{ id?: string; name?: string; active?: boolean }>;
  evidence?: Record<string, unknown> | null;
  complete?: boolean;
  inferredAllergenCodes?: string[];
  audit?: Array<{
    version?: number;
    actorId?: string;
    snapshot?: Record<string, unknown>;
    createdAt?: string;
  }>;
}
export interface CompositionResponseDto {
  success?: boolean;
  data?: CompositionDto;
}
export interface CompositionSourceDto {
  id?: string;
  code?: string;
  name?: string;
  licenseName?: string;
  attribution?: string;
}
export interface CompositionSourcesResponseDto {
  success?: boolean;
  data?: CompositionSourceDto[];
}
export interface SaveCompositionRequestDto {
  expectedVersion: number;
  status: 'UNKNOWN' | 'PARTIAL' | 'COMPLETE';
  kind: 'UNSPECIFIED' | 'SIMPLE' | 'COMPOUND';
  componentIds: string[];
  evidence?: { sourceId: string; sourceVersion: string; sourceRecordId: string; scope: string };
}
