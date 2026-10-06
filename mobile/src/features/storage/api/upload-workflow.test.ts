/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { runImageUpload, type ImageUploadTransport } from './upload-workflow';
import type { ReservationInput, UploadAttempt, UploadReservation } from '../types/storage.model';

const input: ReservationInput = {
  kind: 'COVER_IMAGE',
  image: { uri: 'local://image', name: 'avatar.jpg', bytes: 100, mimeType: 'image/jpeg' },
  idempotencyKey: 'request-key',
};
const receipt = { publicId: 'provider-image', version: 1, signature: 'a'.repeat(40) };
const reserved: UploadReservation = {
  id: 'reservation',
  asset: null,
  usage: {
    usedBytes: 0,
    reservedBytes: 100,
    remainingBytes: 900,
    limitBytes: 1000,
    occupiedPercent: 10,
    overQuota: false,
    warning: false,
  },
  upload: {
    url: 'https://upload.example.com',
    fields: {},
    maxBytes: 1000,
    allowedMimeTypes: ['image/jpeg'],
  },
};
const committed: UploadReservation = {
  ...reserved,
  asset: {
    id: 'asset',
    url: 'https://cdn.example.com/image.jpg',
    bytes: 100,
    mimeType: 'image/jpeg',
  },
};
function attempt(): UploadAttempt {
  return { key: 'request-key', reservationId: null, receipt: null };
}

test('successful image upload reserves before send and commits before completion', async () => {
  const calls: string[] = [];
  const transport: ImageUploadTransport = {
    reserve: async () => {
      calls.push('reserve');
      return reserved;
    },
    send: async () => {
      calls.push('send');
      return receipt;
    },
    commit: async () => {
      calls.push('commit');
      return committed;
    },
    release: async () => {
      calls.push('release');
      return reserved;
    },
  };
  const asset = await runImageUpload(
    input,
    (percent) => calls.push(String(percent)),
    attempt(),
    transport
  );
  assert.equal(asset.id, 'asset');
  assert.deepEqual(calls, ['reserve', 'send', 'commit', '100']);
});

test('provider failure releases quota and rotates the key for the next reservation', async () => {
  const state = attempt();
  let released = false;
  const transport: ImageUploadTransport = {
    reserve: async () => reserved,
    send: async () => {
      throw new Error('upload failed');
    },
    commit: async () => committed,
    release: async () => {
      released = true;
      return reserved;
    },
  };
  await assert.rejects(runImageUpload(input, () => {}, state, transport));
  assert.equal(released, true);
  assert.equal(state.reservationId, null);
  assert.notEqual(state.key, 'request-key');
});

test('lost commit responses retain the receipt; retry commits without reuploading', async () => {
  const state = attempt();
  let sent = 0;
  let released = 0;
  let fail = true;
  const transport: ImageUploadTransport = {
    reserve: async () => reserved,
    send: async () => {
      sent++;
      return receipt;
    },
    commit: async (id, submittedReceipt) => {
      assert.equal(id, reserved.id);
      assert.deepEqual(submittedReceipt, receipt);
      if (fail) throw new AxiosError('response lost');
      return committed;
    },
    release: async () => {
      released++;
      return reserved;
    },
  };
  await assert.rejects(runImageUpload(input, () => {}, state, transport));
  assert.equal(released, 0);
  assert.deepEqual(state.receipt, receipt);
  fail = false;
  const asset = await runImageUpload(input, () => {}, state, transport);
  assert.equal(asset.id, 'asset');
  assert.equal(sent, 1);
  assert.equal(released, 0);
});
