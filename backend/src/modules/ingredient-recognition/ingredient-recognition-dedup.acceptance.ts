import assert from 'node:assert/strict';
import { RecognitionCandidateStatus } from '@prisma/client';
import type { VisionImageResult } from './ingredient-vision.provider.js';
import { deduplicateVisionCandidates } from './ingredient-recognition.service.js';
import { planAppendedCandidates } from './ingredient-recognition.merge.js';

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
export function verifyAppendedImageMerge(): void {
  const imageOne = '21000000-0000-4000-8000-000000000001';
  const imageTwo = '21000000-0000-4000-8000-000000000002';
  const base = {
    freshnessObservation: null,
    matchConfidence: 0.9,
    uncertaintyNote: null,
    normalizedName: 'ca rot',
    detectedName: 'Cà rốt',
  };
  const stored = (over: Partial<Parameters<typeof planAppendedCandidates>[0][number]>) => ({
    id: 'cand-carrot',
    ingredientId: 'ing-carrot',
    normalizedName: 'ca rot',
    quantity: 3,
    unit: 'củ',
    confidence: 0.8,
    status: RecognitionCandidateStatus.PROPOSED,
    editedByUser: false,
    evidenceInputIds: [imageOne],
    ...over,
  });
  const incoming = (quantity: number, unit: string, confidence: number) => [
    {
      ...base,
      ingredientId: 'ing-carrot',
      quantity,
      unit,
      confidence,
      evidence: [{ inputId: imageTwo, confidence, observation: null }],
    },
    {
      ...base,
      ingredientId: 'ing-tofu',
      normalizedName: 'dau hu',
      detectedName: 'Đậu hũ',
      quantity: 1,
      unit: 'hộp',
      confidence: 0.9,
      evidence: [{ inputId: imageTwo, confidence: 0.9, observation: null }],
    },
  ];

  const plan = planAppendedCandidates([stored({})], incoming(3, 'củ', 0.9));
  assert.equal(plan.creates.length, 1, 'an ingredient not seen before is added');
  assert.equal(plan.creates[0]!.detectedName, 'Đậu hũ');
  assert.equal(plan.updates.length, 1, 'a known ingredient gains evidence instead of a duplicate');
  assert.equal(plan.updates[0]!.data?.quantity, 3, 'quantities are never summed (3 + 3 != 6)');
  assert.equal(plan.updates[0]!.evidence.length, 1);

  const edited = planAppendedCandidates(
    [stored({ editedByUser: true, quantity: 5 })],
    incoming(9, 'củ', 0.99),
  );
  assert.equal(edited.updates[0]!.data, null, 'user-edited candidates keep their values');
  assert.equal(edited.updates[0]!.evidence.length, 1, 'but still record the extra evidence');

  const rejected = planAppendedCandidates(
    [stored({ status: RecognitionCandidateStatus.REJECTED })],
    incoming(3, 'củ', 0.99),
  );
  assert.equal(rejected.updates[0]!.data, null, 'a rejected candidate is not resurrected');

  const replay = planAppendedCandidates(
    [stored({ evidenceInputIds: [imageOne, imageTwo] })],
    incoming(3, 'củ', 0.9).slice(0, 1),
  );
  assert.equal(replay.updates[0]!.evidence.length, 0, 'evidence is never attached twice');
}

verifyAppendedImageMerge();
console.info(
  'Recognition dedup acceptance passed: single/multi-image consolidation, canonical and Vietnamese alias merge, overlap-safe quantity, unit conflict uncertainty, evidence retention, and partial failure.',
);
