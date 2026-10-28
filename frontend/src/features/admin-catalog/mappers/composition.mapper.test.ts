import { describe, it, expect } from 'vitest';
import { compositionMapper } from './composition.mapper';

describe('composition mapper', () => {
  it('defaults missing composition to unknown, never complete', () => {
    const result = compositionMapper.toModel(null);
    expect(result.status).toBe('UNKNOWN');
    expect(result.complete).toBe(false);
    expect(result.components).toEqual([]);
  });
  it('maps transitive completeness separately from the parent assessment', () => {
    const result = compositionMapper.toModel({
      ingredientId: 'root',
      status: 'COMPLETE',
      kind: 'COMPOUND',
      version: 4,
      complete: false,
      components: [{ id: 'child', name: 'Thành phần', active: false }],
      evidence: { sourceId: 'source', licenseName: 'Demo', scope: 'Sản phẩm cụ thể' },
      audit: [{ version: 4, snapshot: { evidence: { scope: 'Phạm vi cũ' } } }],
    });
    expect(result.status).toBe('COMPLETE');
    expect(result.complete).toBe(false);
    expect(result.components[0].active).toBe(false);
    expect(result.evidence.licenseName).toBe('Demo');
    expect(result.audit[0].scope).toBe('Phạm vi cũ');
  });
  it('sends explicit source evidence and deduplicated component IDs, without reviewer spoofing', () => {
    expect(
      compositionMapper.toRequest(
        {
          status: 'PARTIAL',
          kind: 'COMPOUND',
          componentIds: ['a', 'a'],
          sourceId: 's',
          sourceVersion: ' v1 ',
          sourceRecordId: ' label ',
          scope: ' product ',
        },
        7
      )
    ).toEqual({
      expectedVersion: 7,
      status: 'PARTIAL',
      kind: 'COMPOUND',
      componentIds: ['a'],
      evidence: { sourceId: 's', sourceVersion: 'v1', sourceRecordId: 'label', scope: 'product' },
    });
  });
});
