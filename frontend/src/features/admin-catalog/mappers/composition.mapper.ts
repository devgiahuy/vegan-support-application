import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeNumber,
  safeString,
  safeDate,
} from '@/lib/mapper';
import type {
  CompositionDto,
  CompositionSourceDto,
  SaveCompositionRequestDto,
} from '../types/composition.dto';
import type {
  IngredientComposition,
  CompositionSource,
  CompositionDraft,
  CompositionStatus,
  CompositionKind,
} from '../types/composition.model';

export class CompositionMapper extends BaseMapper<CompositionDto, IngredientComposition> {
  toModel(dto: CompositionDto | null | undefined): IngredientComposition {
    const rawStatus = safeString(pickField(dto, ['status'], 'UNKNOWN'));
    const rawKind = safeString(pickField(dto, ['kind'], 'UNSPECIFIED'));
    const status: CompositionStatus =
      rawStatus === 'COMPLETE' || rawStatus === 'PARTIAL' ? rawStatus : 'UNKNOWN';
    const kind: CompositionKind =
      rawKind === 'SIMPLE' || rawKind === 'COMPOUND' ? rawKind : 'UNSPECIFIED';
    const evidence = pickField<Record<string, unknown> | null>(dto, ['evidence'], null);
    return {
      ingredientId: safeString(pickField(dto, ['ingredientId'], '')),
      status,
      kind,
      version: safeNumber(pickField(dto, ['version'], 0)),
      components: safeArray<{ id?: string; name?: string; active?: boolean }>(
        pickField(dto, ['components'], [])
      ).map((item) => ({
        id: safeString(pickField(item, ['id'], '')),
        name: safeString(pickField(item, ['name'], 'Chưa rõ tên')),
        active: safeBoolean(pickField(item, ['active'], false)),
      })),
      complete: safeBoolean(pickField(dto, ['complete'], false)),
      inferredAllergenCodes: safeArray<unknown>(pickField(dto, ['inferredAllergenCodes'], []))
        .map((item) => safeString(item))
        .filter(Boolean),
      evidence: {
        sourceId: safeString(pickField(evidence, ['sourceId'], '')),
        sourceVersion: safeString(pickField(evidence, ['sourceVersion'], '')),
        sourceRecordId: safeString(pickField(evidence, ['sourceRecordId'], '')),
        scope: safeString(pickField(evidence, ['scope'], '')),
        sourceCode: safeString(pickField(evidence, ['sourceCode'], '')),
        licenseName: safeString(pickField(evidence, ['licenseName'], '')),
        attribution: safeString(pickField(evidence, ['attribution'], '')),
        reviewedAt: safeString(pickField(evidence, ['reviewedAt'], '')),
      },
      audit: safeArray<{
        version?: number;
        createdAt?: string;
        snapshot?: Record<string, unknown>;
      }>(pickField(dto, ['audit'], [])).map((item) => {
        const date = safeDate(pickField(item, ['createdAt'], null));
        return {
          version: safeNumber(pickField(item, ['version'], 0)),
          createdAtLabel: date ? date.toLocaleString('vi-VN') : 'Chưa rõ thời gian',
          scope: safeString(pickField(item.snapshot, ['evidence.scope'], 'Chưa có nguồn rà soát')),
        };
      }),
    };
  }
  source(dto: CompositionSourceDto): CompositionSource {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')),
      licenseName: safeString(pickField(dto, ['licenseName'], '')),
      attribution: safeString(pickField(dto, ['attribution'], '')),
    };
  }
  toRequest(draft: CompositionDraft, version: number): SaveCompositionRequestDto {
    return {
      expectedVersion: version,
      status: draft.status,
      kind: draft.kind,
      componentIds: [...new Set(draft.componentIds)],
      ...(draft.status !== 'UNKNOWN'
        ? {
            evidence: {
              sourceId: draft.sourceId,
              sourceVersion: draft.sourceVersion.trim(),
              sourceRecordId: draft.sourceRecordId.trim(),
              scope: draft.scope.trim(),
            },
          }
        : {}),
    };
  }
}
export const compositionMapper = new CompositionMapper();
