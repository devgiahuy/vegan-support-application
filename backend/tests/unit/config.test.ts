import { describe, expect, it } from 'vitest';
import { ConfigurationError, loadConfig } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4100',
  DATABASE_URL: 'postgresql://postgres@localhost/vegan_support_test',
  FRONTEND_ORIGIN: 'http://localhost:3000,https://app.example.com',
  JSON_BODY_LIMIT: '2mb',
  SHUTDOWN_TIMEOUT_MS: '5000',
  LOG_LEVEL: 'silent',
};

describe('loadConfig', () => {
  it('parses and normalizes valid environment variables', () => {
    expect(loadConfig(validEnvironment)).toEqual({
      nodeEnv: 'test',
      port: 4100,
      databaseUrl: validEnvironment.DATABASE_URL,
      frontendOrigins: ['http://localhost:3000', 'https://app.example.com'],
      jsonBodyLimit: '2mb',
      shutdownTimeoutMs: 5000,
      logLevel: 'silent',
    });
  });

  it('fails fast without exposing an invalid database URL value', () => {
    const secretValue = 'not-a-url-with-secret';
    expect(() => loadConfig({ ...validEnvironment, DATABASE_URL: secretValue })).toThrow(
      ConfigurationError,
    );
    try {
      loadConfig({ ...validEnvironment, DATABASE_URL: secretValue });
    } catch (error) {
      expect(String(error)).not.toContain(secretValue);
    }
  });

  it('reports an invalid frontend origin as a configuration error', () => {
    expect(() => loadConfig({ ...validEnvironment, FRONTEND_ORIGIN: 'not-an-origin' })).toThrow(
      ConfigurationError,
    );
  });
});
