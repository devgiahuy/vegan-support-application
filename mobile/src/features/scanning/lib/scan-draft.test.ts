/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ScanCandidate } from '../types/scanning.model';
import { isScanDraftDirty, mergeScanDrafts, parseScanDraft, toScanDraft } from './scan-draft';

const candidate: ScanCandidate = {
  id: 'c1', name: 'Trứng', ingredient: { id: 'i1', name: 'Trứng gà', confidence: 0.9 }, quantity: null, unit: null, confidence: 0.92,
  uncertainty: null, freshness: 'Còn tươi', status: 'PROPOSED', version: 1, lineText: null, unitPrice: null, lineTotal: null, currency: null, imageIds: [],
  classification: null, classificationReason: null, duplicateOfJobId: null,
};

test('unknown quantity must be entered before an active draft can be saved', () => {
  const draft = toScanDraft(candidate);
  assert.equal(isScanDraftDirty(draft), false);
  assert.throws(() => parseScanDraft(draft, candidate, 1), /Vui lòng nhập trọng lượng/);
  const edit = parseScanDraft({ ...draft, quantity: '1,5', unit: 'kg' }, candidate, 3);
  assert.deepEqual([edit.quantity, edit.unit, edit.expectedVersion, edit.decision, edit.ingredientId, edit.freshness], [1.5, 'kg', 3, 'KEEP', 'i1', 'Còn tươi']);
});

test('renaming drops the suggested ingredient link and rejected drafts skip quantity validation', () => {
  const draft = { ...toScanDraft(candidate), name: 'Trứng cút', quantity: '10', unit: 'quả' };
  assert.equal(parseScanDraft(draft, candidate, 1).ingredientId, null);
  const rejected = parseScanDraft({ ...toScanDraft(candidate), rejected: true }, candidate, 1);
  assert.deepEqual([rejected.decision, rejected.quantity, rejected.unit, rejected.name], ['REJECT', null, null, 'Trứng']);
});

test('merge keeps unsaved edits for the same version and adopts server values after a version change', () => {
  const edited = { ...toScanDraft(candidate), quantity: '2', unit: 'quả' };
  assert.equal(mergeScanDrafts([edited], [candidate])[0].quantity, '2');
  const updated = { ...candidate, version: 2, quantity: 5, unit: 'g' };
  const merged = mergeScanDrafts([edited], [updated])[0];
  assert.deepEqual([merged.quantity, merged.unit, merged.version], ['5', 'g', 2]);
});
