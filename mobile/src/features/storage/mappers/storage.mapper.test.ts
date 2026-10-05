/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storageMapper, validateImage } from './storage.mapper';

test('reserved bytes count towards quota and backend warning threshold is respected', () => {
  const usage = storageMapper.toUsage({
    usedBytes: 60,
    reservedBytes: 25,
    limitBytes: 100,
    remainingBytes: 15,
    overQuota: false,
    warningPercent: 80,
  });
  assert.equal(usage.occupiedPercent, 85);
  assert.equal(usage.warning, true);
  assert.equal(usage.remainingBytes, 15);
});

test('zero quota and over-quota usage never produce invalid progress', () => {
  const usage = storageMapper.toUsage({
    usedBytes: 20,
    reservedBytes: 0,
    limitBytes: 0,
    remainingBytes: 0,
    overQuota: true,
    warningPercent: 80,
  });
  assert.equal(usage.occupiedPercent, 100);
  assert.equal(usage.warning, true);
});

test('images require matching format, known positive size, and maximum 10 MB', () => {
  assert.equal(validateImage({ name: 'image.JPG', mimeType: 'image/jpeg', bytes: 100 }), '.jpg');
  assert.throws(() => validateImage({ name: 'image.png', mimeType: 'image/jpeg', bytes: 100 }));
  assert.throws(() => validateImage({ name: 'image.jpg', mimeType: 'image/jpeg', bytes: 0 }));
  assert.throws(() =>
    validateImage({
      name: 'image.jpg',
      mimeType: 'image/jpeg',
      bytes: 10 * 1024 * 1024 + 1,
    })
  );
});

test('commit never fabricates missing provider signature', () => {
  assert.throws(() => storageMapper.toProviderReceipt({ public_id: 'asset', version: 1 }));
  const signature = 'a'.repeat(40);
  assert.deepEqual(
    storageMapper.toCommitDto(
      storageMapper.toProviderReceipt({
        public_id: 'asset',
        version: 1,
        signature,
      })
    ),
    { publicId: 'asset', version: 1, signature }
  );
});
