/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getNextPageNumber } from './pagination';

test('getNextPageNumber prefers the backend hasNextPage flag', () => {
  assert.equal(getNextPageNumber({ metadata: { page: 1, totalPages: 5, hasNextPage: false } }), undefined);
  assert.equal(getNextPageNumber({ metadata: { page: 1, totalPages: 1, hasNextPage: true } }), 2);
});

test('getNextPageNumber falls back to comparing page with totalPages', () => {
  assert.equal(getNextPageNumber({ metadata: { page: 2, totalPages: 3 } }), 3);
  assert.equal(getNextPageNumber({ metadata: { page: 3, totalPages: 3 } }), undefined);
});
