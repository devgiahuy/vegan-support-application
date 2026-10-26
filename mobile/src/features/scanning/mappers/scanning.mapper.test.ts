/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanningMappers } from './scanning.mapper';
import { canEditScan, canSelectCandidate } from '../types/scanning.model';
import type { ScanJobDto } from '../types/scanning.dto';

const fixture: ScanJobDto = {
  id: 'job', status: 'PARTIAL_FAILED', progress: { completedImages: 1, totalImages: 2 },
  images: [{ id: 'second', position: 1, url: 'second.jpg', status: 'FAILED', issue: 'Không đọc được' }, { id: 'first', position: 0, url: 'first.jpg', status: 'PROCESSED', issue: null }],
  issue: { code: 'PARTIAL_PROVIDER_FAILURE', message: 'Một ảnh lỗi' }, freshnessDisclaimer: 'Không xác nhận an toàn thực phẩm',
  candidates: [{ id: 'candidate', name: 'Rau', ingredientSuggestion: null, quantity: { value: null, unit: null }, confidence: 0.3, uncertaintyNote: 'Bị che khuất', status: 'PROPOSED', version: 2, evidence: [{ imageId: 'first', imagePosition: 0, confidence: 0.3 }] }],
};

test('unknown quantity is not fabricated; ordered images and evidence remain intact', () => {
  const job = scanningMappers.fridge.toModel(fixture);
  assert.equal(job.candidates[0].quantity, null);
  assert.equal(canSelectCandidate(job.candidates[0]), false);
  assert.deepEqual(job.images.map(image => image.id), ['first', 'second']);
  assert.deepEqual(job.candidates[0].imageIds, ['first']);
  assert.equal(canEditScan(job), true);
  assert.equal(canEditScan({ ...job, status: 'CONFIRMED' }), false);
  assert.equal(job.disclaimer, fixture.freshnessDisclaimer);
});

test('receipt pricing preserves zero and excludes fridge-only fields', () => {
  const candidate = scanningMappers.receipt.toModel({ ...fixture, candidates: [{ ...fixture.candidates[0], imageId: 'first', lineText: 'RAU 1', pricing: { unitPrice: 0, lineTotal: null, currency: 'VND' } }] }).candidates[0];
  assert.equal(candidate.unitPrice, 0);
  assert.equal(candidate.lineTotal, null);
  const dto = scanningMappers.receipt.toEditDto({ expectedVersion: 2, name: ' Rau ', ingredientId: null, quantity: 1, unit: ' kg ', decision: 'KEEP', freshness: 'not sent', unitPrice: 0, currency: 'vnd' });
  assert.equal(dto.currency, 'VND');
  assert.equal(dto.unitPrice, 0);
  assert.equal('freshnessObservation' in dto, false);
});

test('correction clears canonical identity and confirmation sends selected versions only', () => {
  const edit = scanningMappers.fridge.toEditDto({ expectedVersion: 3, name: ' Tên sửa ', ingredientId: null, quantity: 1, unit: 'g', decision: 'KEEP' });
  assert.equal(edit.ingredientId, null);
  assert.equal(edit.detectedName, 'Tên sửa');
  assert.equal(edit.freshnessObservation, null);
  const values = { candidates: [{ id: 'chosen', version: 4 }], operationKey: 'stable-confirm-key' };
  assert.deepEqual(scanningMappers.fridge.toConfirmDto(values), { candidates: [{ id: 'chosen', expectedVersion: 4 }], idempotencyKey: 'stable-confirm-key' });
  assert.equal(scanningMappers.fridge.toCreateDto({ assetIds: ['second', 'first'], operationKey: 'create-key' }).imageAssetIds[0], 'second');
});

test('confirmation maps the explicit pantry diff and retry preserves its operation key', () => {
  const confirmation = scanningMappers.receipt.toConfirmation({ job: { ...fixture, status: 'CONFIRMED' }, pantryChanges: [{ candidateId: 'candidate', action: 'UPDATED', pantryItem: { id: 'pantry', ingredient: { id: 'ingredient', name: 'Đậu hũ' }, unmatchedText: null, quantity: 7, unit: 'g' } }] });
  assert.equal(confirmation.job.status, 'CONFIRMED');
  assert.deepEqual(confirmation.changes, [{ candidateId: 'candidate', action: 'UPDATED', itemId: 'pantry', name: 'Đậu hũ', quantity: 7, unit: 'g' }]);
  assert.deepEqual(scanningMappers.fridge.toRetryDto('stable-retry-key'), { idempotencyKey: 'stable-retry-key' });
  assert.throws(() => scanningMappers.fridge.toConfirmation(undefined), /Không nhận được/);
});

test('receipt review state, excluded non-food items and duplicate count are preserved', () => {
  const job = scanningMappers.receipt.toModel({
    ...fixture, identityDecisionRequired: true, receiptReviewDecision: null,
    notices: [{ code: 'RECEIPT_NON_FOOD_ITEMS_EXCLUDED', message: 'Đã loại 1 mặt hàng không phải thực phẩm', count: 1 }],
    excludedItems: [{ id: 'x1', imageId: 'first', lineText: 'TÚI NYLON', name: 'Túi nylon', reason: 'Không phải thực phẩm', confidence: 0.9, version: 3 }],
  });
  assert.equal(job.identityDecisionRequired, true);
  assert.deepEqual(job.notices, ['Đã loại 1 mặt hàng không phải thực phẩm']);
  assert.equal(job.excludedItems[0].version, 3);
  assert.deepEqual(scanningMappers.receipt.toRestoreDto(3), { expectedVersion: 3, decision: 'KEEP' });
  const confirmation = scanningMappers.receipt.toConfirmation({ job: fixture, pantryChanges: [], duplicateCandidates: [{ candidateId: 'c', sourceJobId: 's' }] });
  assert.equal(confirmation.duplicateCount, 1);
});

test('receipt confirmation carries the identity decision; fridge never does', () => {
  const values = { candidates: [{ id: 'a', version: 1 }], operationKey: 'k', receiptReviewDecision: 'SAME_RECEIPT' as const };
  assert.equal(scanningMappers.receipt.toConfirmDto(values).receiptReviewDecision, 'SAME_RECEIPT');
  assert.equal('receiptReviewDecision' in scanningMappers.fridge.toConfirmDto(values), false);
  assert.equal('receiptReviewDecision' in scanningMappers.receipt.toConfirmDto({ ...values, receiptReviewDecision: undefined }), false);
});
