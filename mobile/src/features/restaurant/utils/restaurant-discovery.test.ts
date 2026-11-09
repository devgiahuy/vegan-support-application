/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDiscoveryNotices, isExternalPlace } from './discovery-notices';
import { emptyStateCopy } from './restaurant-search-copy';
import { formatBoundsLabel } from './restaurant-map-layout';

const quietMeta = {
  externalDataUnavailable: false,
  externalResultsSuppressed: false,
  resultsTruncated: false,
  providerResultLimit: null,
  provider: '',
  locationStored: null,
};

test('internal and demo places are not external; provider places are', () => {
  assert.equal(isExternalPlace({ source: 'INTERNAL' }), false);
  assert.equal(isExternalPlace({ source: 'FAKE' }), false);
  assert.equal(isExternalPlace({ source: 'SERPAPI' }), true);
});

test('no notices when nothing needs saying', () => {
  assert.deepEqual(buildDiscoveryNotices(quietMeta, [{ source: 'INTERNAL', isStale: false }]), []);
});

test('collects availability, truncation, attribution, stale and privacy notices', () => {
  const notices = buildDiscoveryNotices(
    { ...quietMeta, externalDataUnavailable: true, resultsTruncated: true, providerResultLimit: 20, provider: 'SerpApi', locationStored: false },
    [
      { source: 'SERPAPI', isStale: true },
      { source: 'INTERNAL', isStale: false },
    ]
  );
  assert.deepEqual(
    notices.map((notice) => notice.kind),
    ['UNAVAILABLE', 'TRUNCATED', 'ATTRIBUTION', 'STALE', 'PRIVACY']
  );
  assert.match(notices[1]!.message, /tối đa 20 kết quả/);
  assert.match(notices[2]!.message, /SerpApi/);
  assert.match(notices[3]!.message, /^1 quán/);
});

test('privacy notice only appears when the backend confirms nothing is stored', () => {
  assert.equal(buildDiscoveryNotices({ ...quietMeta, locationStored: null }, []).length, 0);
  assert.equal(buildDiscoveryNotices({ ...quietMeta, locationStored: true }, []).length, 0);
});

test('empty-state copy depends on the search mode', () => {
  assert.equal(emptyStateCopy('BOUNDS').title, 'Không có quán trong vùng bạn đang xem');
  assert.deepEqual(emptyStateCopy('BOUNDS').actions, ['Đổi vị trí']);
  assert.ok(emptyStateCopy('KEYWORD').actions.includes('Xoá từ khóa'));
  assert.equal(emptyStateCopy('NEARBY', true).title, 'Chưa có quán đáp ứng bộ lọc chế độ ăn');
});

test('bounds label uses Vietnamese decimals and is empty for unusable bounds', () => {
  assert.equal(
    formatBoundsLabel({ north: 10.8, south: 10.7, east: 106.8, west: 106.6 }),
    'Vùng đang xem: 10,7 → 10,8 (vĩ độ), 106,6 → 106,8 (kinh độ)'
  );
  assert.equal(formatBoundsLabel({ north: 1, south: 2, east: 3, west: 2 }), '');
});
