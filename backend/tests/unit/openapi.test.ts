import { describe, expect, it } from 'vitest';
import { openApiDocument } from '../../src/openapi/document.js';

describe('OpenAPI document', () => {
  it('contains the foundation health contract', () => {
    expect(openApiDocument.openapi).toBe('3.1.0');
    expect(openApiDocument.paths?.['/api/v1/health']?.get).toBeDefined();
  });
});
