import assert from 'node:assert/strict';
import type { VisionImageResult } from './ingredient-vision.provider.js';
import { deduplicateVisionCandidates } from './ingredient-recognition.service.js';

export function verifyDeterministicDeduplication(): void {
  const imageOne = '21000000-0000-4000-8000-000000000001';
  const imageTwo = '21000000-0000-4000-8000-000000000002';
  const carrot = { id: '30000000-0000-4000-8000-000000000001', canonicalName: 'Cà rốt tươi' };
  const tofu = { id: '30000000-0000-4000-8000-000000000002', canonicalName: 'Đậu hũ' };
  const broccoli = {
    id: '30000000-0000-4000-8000-000000000003',
    canonicalName: 'Bông cải xanh',
  };
  const resolved = new Map([
    ['ca rot', carrot],
    ['cu ca rot', carrot],
    ['dau hu', tofu],
    ['bong cai xanh', broccoli],
  ]);
  const candidate = (
    name: string,
    quantity: number | null,
    unit: string | null,
    confidence: number,
  ) => ({
    name,
    quantity,
    unit,
    freshnessObservation: null,
    confidence,
    uncertaintyNote: null,
  });
  const results: VisionImageResult[] = [
    {
      inputId: imageOne,
      candidates: [candidate('Cà rốt', 3, 'củ', 0.94), candidate('Đậu hũ', 1, 'hộp', 0.91)],
      error: null,
    },
    {
      inputId: imageTwo,
      candidates: [
        candidate('củ cà rốt', 3, 'củ', 0.89),
        candidate('Bông cải xanh', 1, 'cây', 0.93),
      ],
      error: null,
    },
  ];
  assert.equal(deduplicateVisionCandidates(results.slice(0, 1), resolved).length, 2);
  const combined = deduplicateVisionCandidates(results, resolved);
  assert.equal(combined.length, 3, 'different images must produce one consolidated list');
  const mergedCarrot = combined.find((item) => item.ingredientId === carrot.id);
  assert(mergedCarrot, 'canonical name and approved alias must merge');
  assert.equal(mergedCarrot.quantity, 3, 'overlapping photos must never sum 3 carrots to 6');
  assert.equal(mergedCarrot.evidence.length, 2);
  assert.match(mergedCarrot.uncertaintyNote ?? '', /không được cộng dồn/);

  const conflict = deduplicateVisionCandidates(
    [
      results[0]!,
      {
        inputId: imageTwo,
        candidates: [candidate('củ cà rốt', 600, 'g', 0.89)],
        error: null,
      },
    ],
    resolved,
  ).find((item) => item.ingredientId === carrot.id);
  assert(conflict);
  assert.deepEqual({ quantity: conflict.quantity, unit: conflict.unit }, { quantity: 3, unit: 'củ' });
  assert.match(conflict.uncertaintyNote ?? '', /không cộng dồn/);
  assert(conflict.evidence.every((item) => item.observation?.includes('Ước tính trong ảnh')));

  const partial = deduplicateVisionCandidates(
    [
      results[0]!,
      {
        inputId: imageTwo,
        candidates: [],
        error: { code: 'IMAGE_PROCESSING_FAILED', message: 'Không thể phân tích ảnh.' },
      },
    ],
    resolved,
  );
  assert.equal(partial.length, 2, 'a failed image must not discard successful candidates');
}

verifyDeterministicDeduplication();
console.info(
  'Recognition dedup acceptance passed: single/multi-image consolidation, canonical and Vietnamese alias merge, overlap-safe quantity, unit conflict uncertainty, evidence retention, and partial failure.',
);
