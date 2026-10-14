/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recommendationMapper } from './recommendation.mapper';

test('known reason codes get a label and unknown ones are shown as sent', () => {
  const item = recommendationMapper.toModel({
    id: 'r1',
    reasonCodes: ['POPULAR', 'NEW_UNKNOWN_CODE'],
  });
  assert.deepEqual(item.reasonLabels, ['Được yêu thích', 'NEW_UNKNOWN_CODE']);
});

test('at most two reasons are kept', () => {
  const item = recommendationMapper.toModel({
    id: 'r1',
    reasonCodes: ['POPULAR', 'RECENT_RECIPE', 'BOOKMARK_SIMILAR'],
  });
  assert.equal(item.reasonCodes.length, 2);
});

test('missing calories stay null but a real zero is kept', () => {
  assert.equal(recommendationMapper.toModel({ id: 'a' }).calories, null);
  assert.equal(recommendationMapper.toModel({ id: 'b', calories: 0 }).calories, 0);
  assert.equal(recommendationMapper.toModel({ id: 'c', calories: 350 }).calories, 350);
});

test('home meta summarizes only the constraints that were applied', () => {
  const meta = recommendationMapper.toHomeMeta({
    data: [],
    meta: {
      personalized: true,
      appliedConstraints: { dietPattern: 'vegan', allergyCount: 1, ingredientExclusionCount: 2 },
    },
  } as never);
  assert.equal(meta.personalized, true);
  assert.equal(meta.constraintsSummary, 'Đã lọc: chay trường · 1 dị ứng · 2 loại trừ');
});

test('home meta has no summary when nothing was filtered', () => {
  const meta = recommendationMapper.toHomeMeta({ data: [], meta: { personalized: false } } as never);
  assert.equal(meta.constraintsSummary, null);
});

test('events without a usable target are not sent', () => {
  assert.equal(recommendationMapper.toEventDto({ type: 'SEARCH', query: '   ' } as never), null);
  assert.equal(recommendationMapper.toEventDto({ type: 'CHAT_TOPIC', topicCodes: [' ', ''] } as never), null);
  assert.equal(recommendationMapper.toEventDto({ type: 'VIEW' } as never), null);
});

test('a search event carries the trimmed query and a fresh idempotency key', () => {
  const dto = recommendationMapper.toEventDto({ type: 'SEARCH', query: 'phở nấm' } as never);
  assert.equal(dto?.type, 'SEARCH');
  assert.deepEqual(dto?.metadata, { query: 'phở nấm' });
  assert.ok(dto?.idempotencyKey.startsWith('search-'));
});

test('consent defaults to disabled when the backend sends nothing', () => {
  const consent = recommendationMapper.toConsentModel(null);
  assert.equal(consent.enabled, false);
  assert.equal(consent.consentedAt, null);
});
