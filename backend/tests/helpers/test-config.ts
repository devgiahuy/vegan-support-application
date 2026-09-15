import type { AppConfig } from '../../src/config/env.js';

export function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    port: 4000,
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres@localhost/test',
    frontendOrigins: ['http://localhost:3000'],
    jsonBodyLimit: '1kb',
    shutdownTimeoutMs: 1_000,
    logLevel: 'silent',
    ...overrides,
  };
}
