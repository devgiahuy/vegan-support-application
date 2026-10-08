/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isDevScanEnabled, scanProviderMode } from './scan-policy';

test('development scans require explicit opt-in and cannot run in production', () => {
  assert.equal(isDevScanEnabled(true, 'true'), true);
  for (const flag of [undefined, '', 'false', 'TRUE']) assert.equal(isDevScanEnabled(true, flag), false);
  assert.equal(isDevScanEnabled(false, 'true'), false);
});

test('real provider label is the default; fake mode must be explicitly configured', () => {
  assert.equal(scanProviderMode(undefined), 'openai');
  assert.equal(scanProviderMode('openai'), 'openai');
  assert.equal(scanProviderMode('fake'), 'fake');
});
