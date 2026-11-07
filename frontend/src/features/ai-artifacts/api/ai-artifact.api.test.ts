import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { aiArtifactApi } from './ai-artifact.api';

describe('AI artifact response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps public items and pagination metadata from the response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'artifact-1', title: 'Công thức' }],
        meta: { page: 2, total: 12, totalPages: 3 },
      },
    });
    const result = await aiArtifactApi.listPublic({ page: 2 });
    expect(result.items[0].id).toBe('artifact-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 12, totalPages: 3 });
  });
});
