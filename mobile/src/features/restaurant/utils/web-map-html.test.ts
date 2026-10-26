/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWebMapHtml } from './web-map-html';

test('web map html embeds the style and starting view and exposes the control hooks', () => {
  const html = buildWebMapHtml({ styleUrl: 'https://tiles.example.com/styles/bright', lat: 10.77, lng: 106.7, zoom: 12.5 });
  assert.match(html, /tiles\.example\.com\/styles\/bright/);
  assert.match(html, /window\.__setState/);
  assert.match(html, /window\.__zoom/);
  assert.match(html, /ReactNativeWebView\.postMessage/);
});

test('web map html cannot be broken out of by a hostile style url', () => {
  const html = buildWebMapHtml({ styleUrl: 'x</script><script>alert(1)</script>', lat: 0, lng: 0, zoom: 3 });
  assert.equal(html.includes('</script><script>alert(1)'), false);
});
