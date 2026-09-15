import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { Database } from '../../src/database/database.js';
import { PrismaDatabase } from '../../src/database/database.js';
import { createTestConfig } from '../helpers/test-config.js';

const logger = pino({ level: 'silent' });
let database: PrismaDatabase;

beforeAll(() => {
  database = new PrismaDatabase();
});

afterAll(async () => {
  await database.disconnect();
});

describe('foundation HTTP contract', () => {
  it('returns database-aware health with a request ID without authentication', async () => {
    const app = createApp({ config: createTestConfig(), database, logger });
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        database: { status: 'up' },
        environment: 'test',
        requestId: response.headers['x-request-id'],
      },
      meta: null,
    });
    expect(JSON.stringify(response.body)).not.toContain(process.env.DATABASE_URL);
  });

  it('returns a safe 503 envelope when the database is unavailable', async () => {
    const unavailableDatabase: Database = {
      check: () => Promise.reject(new Error('contains a secret connection string')),
      disconnect: () => Promise.resolve(),
    };
    const app = createApp({ config: createTestConfig(), database: unavailableDatabase, logger });
    const response = await request(app).get('/api/v1/health').expect(503);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Dịch vụ cơ sở dữ liệu hiện không khả dụng',
        fields: { database: ['down'] },
        requestId: response.headers['x-request-id'],
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('connection string');
  });

  it('returns the standard 404 envelope', async () => {
    const app = createApp({ config: createTestConfig(), database, logger });
    const response = await request(app).get('/api/v1/unknown').expect(404);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Không tìm thấy tài nguyên GET /api/v1/unknown',
        requestId: response.headers['x-request-id'],
      },
    });
  });

  it('returns the validation envelope for malformed JSON', async () => {
    const app = createApp({ config: createTestConfig(), database, logger });
    const response = await request(app)
      .post('/api/v1/unknown')
      .set('content-type', 'application/json')
      .send('{"broken"')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Nội dung JSON không hợp lệ',
        requestId: response.headers['x-request-id'],
      },
    });
  });

  it('enforces the configured request body limit', async () => {
    const app = createApp({ config: createTestConfig(), database, logger });
    const response = await request(app)
      .post('/api/v1/unknown')
      .send({ content: 'x'.repeat(2_000) })
      .expect(413);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép',
        requestId: response.headers['x-request-id'],
      },
    });
  });

  it('serves OpenAPI JSON and Swagger UI', async () => {
    const app = createApp({ config: createTestConfig(), database, logger });
    const specification = await request(app).get('/api-docs.json').expect(200);
    expect(specification.text).toContain('"/api/v1/health"');

    const swagger = await request(app).get('/api-docs/').expect(200);
    expect(swagger.text).toContain('<title>Vegan Support API Docs</title>');
  });
});
