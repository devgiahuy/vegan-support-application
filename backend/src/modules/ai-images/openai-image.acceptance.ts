import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { loadConfig } from '../../config/env.js';
import { OpenAiIngredientVisionProvider } from '../ingredient-recognition/ingredient-vision.provider.js';
import { OpenAiReceiptExtractionProvider } from '../receipts/receipt.provider.js';

const requests: Array<Record<string, unknown>> = [];
const server = createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk as Uint8Array));
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  requests.push(body);
  const content =
    (body.input as Array<{ content: Array<{ type: string; image_url?: string }> }>)[0]?.content ??
    [];
  const imageUrl = content.find((item) => item.type === 'input_image')?.image_url ?? '';
  if (imageUrl.includes('fail-image')) {
    response.writeHead(503, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({ error: { message: 'provider unavailable', type: 'server_error' } }),
    );
    return;
  }
  const isReceipt =
    (body.text as { format: { name: string } }).format.name === 'receipt_candidates';
  const payload = isReceipt
    ? {
        merchantName: 'Chợ Việt',
        purchasedAt: '2026-09-27',
        currency: 'VND',
        totalAmount: 24000,
        metadataConfidence: 0.8,
        lines: [
          {
            lineText: 'DAU HU 400G 24000',
            name: 'Đậu hũ',
            quantity: 400,
            unit: 'g',
            unitPrice: null,
            lineTotal: 24000,
            currency: 'VND',
            confidence: 0.8,
            uncertaintyNote: null,
          },
        ],
      }
    : {
        candidates: [
          {
            name: 'Đậu hũ',
            quantity: null,
            unit: null,
            freshnessObservation: null,
            confidence: 0.7,
            uncertaintyNote: 'Quantity is not visible.',
          },
        ],
      };
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(
    JSON.stringify({
      id: randomUUID(),
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      status: 'completed',
      output: [
        {
          id: randomUUID(),
          type: 'message',
          role: 'assistant',
          status: 'completed',
          content: [{ type: 'output_text', text: JSON.stringify(payload), annotations: [] }],
        },
      ],
    }),
  );
});

try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const environment = {
    NODE_ENV: 'test',
    DATABASE_URL: 'mongodb://localhost:27017/audit?replicaSet=rs0&directConnection=true',
    JWT_ACCESS_SECRET: 'phase27-audit-jwt-secret-at-least-32-characters',
    CLOUDINARY_CLOUD_NAME: 'audit-cloud',
    CLOUDINARY_API_KEY: 'audit-key',
    CLOUDINARY_API_SECRET: 'audit-secret',
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
    VISION_ENABLED: 'true',
    VISION_PROVIDER: 'openai',
    RECEIPT_ENABLED: 'true',
    RECEIPT_PROVIDER: 'openai',
  };
  const config = loadConfig(environment);
  assert.equal(loadConfig({ ...environment, NODE_ENV: 'production' }).vision.provider, 'openai');
  assert.throws(() =>
    loadConfig({ ...environment, NODE_ENV: 'production', VISION_PROVIDER: 'fake' }),
  );
  assert.throws(() => loadConfig({ ...environment, OPENAI_API_KEY: '' }));
  const vision = new OpenAiIngredientVisionProvider(config);
  const receipt = new OpenAiReceiptExtractionProvider(config);
  const url = 'https://res.cloudinary.com/audit-cloud/image/upload/vegan-support/posts/image.png';
  const visionResults = await vision.recognize([
    { id: randomUUID(), position: 0, url },
    { id: randomUUID(), position: 1, url: url.replace('image.png', 'fail-image.png') },
  ]);
  assert.equal(visionResults[0]?.candidates[0]?.name, 'Đậu hũ');
  assert.equal(visionResults[1]?.error?.code, 'IMAGE_PROCESSING_FAILED');
  const callsBeforeRejectedUrl = requests.length;
  const rejectedUrl = await vision.recognize([
    { id: randomUUID(), position: 0, url: 'https://example.com/image.png' },
  ]);
  assert.equal(rejectedUrl[0]?.error?.code, 'IMAGE_PROCESSING_FAILED');
  assert.equal(requests.length, callsBeforeRejectedUrl, 'untrusted URL must never reach OpenAI');
  const receiptResults = await receipt.extract([{ id: randomUUID(), position: 0, url }]);
  assert.equal(receiptResults[0]?.lines[0]?.lineText, 'DAU HU 400G 24000');
  assert.equal(receiptResults[0]?.currency, 'VND');
  assert(
    requests.some(
      (item) => (item.text as { format: { name: string } }).format.name === 'fridge_candidates',
    ),
  );
  assert(
    requests.some(
      (item) => (item.text as { format: { name: string } }).format.name === 'receipt_candidates',
    ),
  );
  for (const request of requests) {
    assert.equal(request.store, false);
    assert.equal((request.text as { format: { strict: boolean } }).format.strict, true);
    const content =
      (request.input as Array<{ content: Array<{ type: string; image_url?: string }> }>)[0]
        ?.content ?? [];
    assert(
      content.some(
        (item) =>
          item.type === 'input_image' && item.image_url?.startsWith('https://res.cloudinary.com/'),
      ),
    );
  }
  console.info(
    'OpenAI image adapter acceptance passed: image request, schema mapping, receipt lines, and partial failure.',
  );
} finally {
  server.close();
}
