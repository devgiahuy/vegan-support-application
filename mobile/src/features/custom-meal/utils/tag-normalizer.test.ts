/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_TAGS_PER_MEAL, addUserTags, normalizeUserTag } from './tag-normalizer';

test('normalizeUserTag strips hashes, lowercases and collapses spaces', () => {
  assert.equal(normalizeUserTag('  ##Meal   Prep '), 'meal prep');
  assert.equal(normalizeUserTag(''), '');
});

test('addUserTags splits separators, de-duplicates and reports the last error', () => {
  assert.deepEqual(addUserTags([], '#Shopee, bữa trưa; shopee'), {
    tags: ['shopee', 'bữa trưa'],
    error: 'Thẻ "shopee" đã tồn tại.',
  });
  assert.deepEqual(addUserTags(['a'], 'b@c').tags, ['a']);
  assert.notEqual(addUserTags(['a'], 'b@c').error, null);
});

test('addUserTags enforces the maximum number of tags', () => {
  const full = Array.from({ length: MAX_TAGS_PER_MEAL }, (_, index) => `tag${index}`);
  const result = addUserTags(full, 'extra');
  assert.deepEqual(result.tags, full);
  assert.notEqual(result.error, null);
});
