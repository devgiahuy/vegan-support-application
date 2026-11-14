/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isScanEnabled, scanProviderMode } from './scan-policy';

test('scans are enabled by default and only an explicit kill switch disables them', () => {
  assert.equal(isScanEnabled(undefined), true);
  for (const flag of ['', 'false', 'TRUE', '1']) assert.equal(isScanEnabled(flag), true);
  assert.equal(isScanEnabled('true'), false);
});

test('real provider label is the default; fake mode must be explicitly configured', () => {
  assert.equal(scanProviderMode(undefined), 'openai');
  assert.equal(scanProviderMode('openai'), 'openai');
  assert.equal(scanProviderMode('fake'), 'fake');
});
