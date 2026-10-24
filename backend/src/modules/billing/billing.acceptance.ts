import { ChatRepository } from '../chat/chat.repository.js';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import pino from 'pino';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config/env.js';
import { createPrismaClient } from '../../database/client.js';
import { PrismaDatabase } from '../../database/database.js';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { TokenService } from '../auth/token.service.js';
import { PasswordService } from '../auth/password.service.js';
import { PantryRepository } from '../pantry/pantry.repository.js';
import { PantryService } from '../pantry/pantry.service.js';
import { IngredientRecognitionRepository } from '../ingredient-recognition/ingredient-recognition.repository.js';
import { ReceiptRepository } from '../receipts/receipt.repository.js';
import { BillingService } from './billing.service.js';
import { BillingProviders } from './billing.providers.js';
import type { CreatePaymentLinkRequest, PaymentLink } from '@payos/node';
import { billingEnvelope, billingOrderSchema, entitlementSchema } from './billing.schemas.js';
import { seedBillingProducts } from './billing.catalog.js';
import { AppError } from '../../common/errors/app-error.js';

const config = loadConfig({
  ...process.env,
  NODE_ENV: 'test',
  BILLING_ENABLED: 'true',
  BILLING_PROVIDER: 'payos',
  PAYOS_CLIENT_ID: 'acceptance-fixture-client',
  PAYOS_API_KEY: 'acceptance-fixture-key',
  PAYOS_CHECKSUM_KEY: 'acceptance-only-checksum-key',
  BILLING_PANTRY_BASE_LIMIT: '2',
  AI_PROVIDER: 'fake',
  VISION_PROVIDER: 'fake',
  RECEIPT_PROVIDER: 'fake',
  AI_MEMBER_DAILY_QUOTA: '1',
  MAPS_PROVIDER: 'fake',
});
assert(
  new URL(config.databaseUrl).pathname.includes('billing_'),
  'Acceptance requires a separate database named billing_*; never use user data.',
);
// Controlled payOS transport; never contacts the merchant API or transfers money.
const originalFetch = globalThis.fetch;
const links = new Map<number, PaymentLink>();
let ambiguousCreate = false;
let tamperQuery = false;
let unavailableQuery = false;
const signedData = (data: Record<string, unknown>) => {
  const canonical = Object.keys(data)
    .sort()
    .map((key) => {
      const raw = data[key];
      const value =
        raw == null || raw === 'null' || raw === 'undefined'
          ? ''
          : Array.isArray(raw)
            ? JSON.stringify(
                raw.map((item: Record<string, unknown>) =>
                  Object.fromEntries(
                    Object.keys(item)
                      .sort()
                      .map((field) => [field, item[field]]),
                  ),
                ),
              )
            : typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
              ? String(raw)
              : JSON.stringify(raw);
      return key + '=' + value;
    })
    .join('&');
  return createHmac('sha256', config.billing.payosChecksumKey!).update(canonical).digest('hex');
};
const providerResponse = (data: Record<string, unknown>) =>
  new Response(
    JSON.stringify({
      code: '00',
      desc: 'success',
      data,
      signature: tamperQuery ? '0'.repeat(64) : signedData(data),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== 'https://api-merchant.payos.vn') {
    assert(
      url.hostname === '127.0.0.1' || url.hostname === 'localhost',
      'No external acceptance request',
    );
    return originalFetch(input, init);
  }
  if (init?.method === 'POST' && url.pathname === '/v2/payment-requests') {
    assert(typeof init.body === 'string');
    const body = JSON.parse(init.body) as CreatePaymentLinkRequest;
    assert(Number.isSafeInteger(body.orderCode) && body.orderCode > 0);
    assert(body.description.length <= 9);
    assert.equal(
      body.signature,
      signedData({
        amount: body.amount,
        cancelUrl: body.cancelUrl,
        description: body.description,
        orderCode: body.orderCode,
        returnUrl: body.returnUrl,
      }),
    );
    assert(body.expiredAt && body.expiredAt > Date.now() / 1000);
    if (links.has(body.orderCode))
      return new Response(JSON.stringify({ code: '231', desc: 'Order already exists' }), {
        status: 400,
      });
    const id = randomUUID().replaceAll('-', '');
    links.set(body.orderCode, {
      id,
      orderCode: body.orderCode,
      amount: body.amount,
      amountPaid: 0,
      amountRemaining: body.amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      transactions: [],
      cancellationReason: null,
      canceledAt: null,
    });
    if (ambiguousCreate) {
      ambiguousCreate = false;
      throw new Error('Fixture response lost after creation');
    }
    return providerResponse({
      bin: '970422',
      accountNumber: 'fixture-only',
      accountName: 'Fixture',
      amount: body.amount,
      description: body.description,
      orderCode: body.orderCode,
      currency: 'VND',
      paymentLinkId: id,
      status: 'PENDING',
      checkoutUrl: 'https://pay.payos.vn/web/' + id,
      qrCode: 'fixture-qr',
    });
  }
  assert.equal(init?.method, 'GET');
  assert(url.pathname.startsWith('/v2/payment-requests/'));
  if (unavailableQuery) throw new Error('Fixture unavailable');
  const link = links.get(Number(url.pathname.split('/').pop()));
  if (!link)
    return new Response(JSON.stringify({ code: '101', desc: 'Not found' }), { status: 404 });
  return providerResponse({ ...link });
};
const providerLink = async (id: string) => {
  const order = await db.paymentOrder.findUniqueOrThrow({ where: { id } });
  return links.get(Number(order.providerOrderCode))!;
};
const webhookFor = async (id: string, amount?: number) => {
  const link = await providerLink(id);
  const data = {
    orderCode: link.orderCode,
    amount: amount ?? link.amountPaid,
    description: 'VC fixture',
    accountNumber: 'fixture-only',
    reference: 'fixture-' + link.id,
    transactionDateTime: '2026-10-14 12:00:00',
    currency: 'VND',
    paymentLinkId: link.id,
    code: '00',
    desc: 'success',
    counterAccountName: null,
    counterAccountNumber: null,
  };
  return { code: '00', desc: 'success', success: true, data, signature: signedData(data) };
};

const db = createPrismaClient();
const entitlements = new EntitlementService(db, config);
const billing = new BillingService(db, entitlements, config);
const marker = randomUUID();
const password = new PasswordService();
const user = await db.user.create({
  data: {
    email: 'billing-' + marker + '@example.test',
    displayName: 'Billing acceptance',
    passwordHash: await password.hash('DemoBilling2026!'),
    role: 'MEMBER',
  },
});
const other = await db.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
const tokens = new TokenService(config);
const token = (await tokens.issueAccessToken(user)).token;
const otherToken = (await tokens.issueAccessToken(other)).token;
const server = createServer(
  createApp({ config, database: new PrismaDatabase(db), logger: pino({ level: 'silent' }) }),
);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address !== 'string');
config.billing.publicUrl = 'http://127.0.0.1:' + address.port;
const base = config.billing.publicUrl + '/api/v1';
const request = (path: string, method = 'GET', body?: unknown, access = token) =>
  fetch(base + path, {
    method,
    headers: {
      ...(access ? { Authorization: 'Bearer ' + access } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'manual',
  });
const balance = async () =>
  billingEnvelope(entitlementSchema).parse(await (await request('/entitlements/me')).json()).data;
const createOrder = async (productId: string, key = randomUUID()) =>
  billingEnvelope(billingOrderSchema).parse(
    await (await request('/billing/orders', 'POST', { productId, idempotencyKey: key })).json(),
  ).data;
const expectCode = (code: string) => (error: unknown) =>
  error instanceof AppError && error.code === code;

try {
  await seedBillingProducts(db);
  assert.equal((await request('/billing/products', 'GET', undefined, '')).status, 401);
  // Reproduce a long-lived session without waiting for the normal 15-minute TTL.
  const loginResponse = await request(
    '/auth/login',
    'POST',
    {
      email: user.email,
      password: 'DemoBilling2026!',
    },
    '',
  );
  assert.equal(loginResponse.status, 200);
  const cookieFrom = (response: Response) => {
    const cookie = response.headers
      .getSetCookie()
      .find((value) => value.startsWith('refreshToken='));
    assert(cookie, 'Refresh rotation must return its HttpOnly cookie');
    return cookie.split(';')[0]!;
  };
  let sessionCookie = cookieFrom(loginResponse);
  const expiredAccess = await new TokenService({
    ...config,
    accessTokenTtlSeconds: -1,
  }).issueAccessToken(user);
  const expiredAccessResponse = await request(
    '/billing/products',
    'GET',
    undefined,
    expiredAccess.token,
  );
  assert.equal(expiredAccessResponse.status, 401);
  assert.equal(
    ((await expiredAccessResponse.json()) as { error: { code: string } }).error.code,
    'TOKEN_EXPIRED',
  );
  for (let cycle = 0; cycle < 6; cycle++) {
    const refreshed = await fetch(base + '/auth/refresh', {
      method: 'POST',
      headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(refreshed.status, 200, 'Refresh cycle ' + cycle);
    const nextCookie = cookieFrom(refreshed);
    assert.notEqual(nextCookie, sessionCookie);
    sessionCookie = nextCookie;
    const refreshedBody = (await refreshed.json()) as { data: { accessToken: string } };
    assert.equal(
      (await request('/billing/products', 'GET', undefined, refreshedBody.data.accessToken)).status,
      200,
    );
    assert.equal(
      (await request('/entitlements/me', 'GET', undefined, refreshedBody.data.accessToken)).status,
      200,
    );
  }
  console.info('PASS expired access token and six refresh rotations retain billing access');
  const rotateCookie = (cookie: string) =>
    fetch(base + '/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: '{}',
    });
  const duplicatedRefresh = await Promise.all([
    rotateCookie(sessionCookie),
    rotateCookie(sessionCookie),
  ]);
  assert.deepEqual(duplicatedRefresh.map((response) => response.status).sort(), [200, 401]);
  assert(
    await db.refreshSession.count({ where: { userId: user.id, revokeReason: 'REUSE_DETECTED' } }),
  );
  const independentLogins = await Promise.all(
    [0, 1].map(() =>
      request(
        '/auth/login',
        'POST',
        {
          email: user.email,
          password: 'DemoBilling2026!',
        },
        '',
      ),
    ),
  );
  assert(independentLogins.every((response) => response.status === 200));
  const independentCookies = independentLogins.map(cookieFrom);
  assert.notEqual(independentCookies[0], independentCookies[1]);
  const independentRotations = await Promise.all(independentCookies.map(rotateCookie));
  assert(independentRotations.every((response) => response.status === 200));
  const nextIndependentRotations = await Promise.all(
    independentRotations.map((response) => rotateCookie(cookieFrom(response))),
  );
  assert(nextIndependentRotations.every((response) => response.status === 200));
  console.info(
    'PASS duplicate refresh still revokes reused family; independent client cookies rotate concurrently',
  );
  const before = await balance();
  const key = randomUUID();
  const order = await createOrder('combo', key);
  assert.equal((await createOrder('combo', key)).id, order.id);
  assert.equal(
    (await request('/billing/orders', 'POST', { productId: 'chat-100', idempotencyKey: key }))
      .status,
    409,
  );
  assert.equal(
    (await request('/billing/orders/' + order.id, 'GET', undefined, otherToken)).status,
    404,
  );
  assert(order.checkoutUrl);
  assert(new URL(order.checkoutUrl).hostname === 'pay.payos.vn');
  const paidLink = await providerLink(order.id);
  paidLink.status = 'PAID';
  paidLink.amountPaid = paidLink.amount;
  paidLink.amountRemaining = 0;
  const paidWebhook = await webhookFor(order.id);
  assert.equal(
    (
      await request(
        '/billing/payos/webhook',
        'POST',
        { ...paidWebhook, signature: '0'.repeat(64) },
        '',
      )
    ).status,
    400,
  );
  const replayResponses = await Promise.all(
    Array.from({ length: 10 }, () => request('/billing/payos/webhook', 'POST', paidWebhook, '')),
  );
  assert(replayResponses.every((response) => response.status === 200));
  const purchased = await balance();
  assert.equal(purchased.chatCredits, before.chatCredits + 100);
  assert.equal(purchased.fridgeCredits, before.fridgeCredits + 10);
  assert.equal(purchased.receiptCredits, before.receiptCredits + 10);
  assert.equal(purchased.pantrySlots, 50);
  assert.equal(await db.paymentEvent.count({ where: { orderId: order.id } }), 1);
  await assert.rejects(
    billing.settle('payos', {
      orderId: order.id,
      amountVnd: 1,
      status: 'PAID',
      transactionId: 'bad',
    }),
    expectCode('BILLING_PAYMENT_MISMATCH'),
  );
  const canceled = await createOrder('chat-100');
  const canceledLink = await providerLink(canceled.id);
  canceledLink.status = 'CANCELLED';
  await billing.webhook(await webhookFor(canceled.id));
  assert.equal((await balance()).chatCredits, purchased.chatCredits);
  await billing.settle('payos', {
    orderId: canceled.id,
    transactionId: 'late-' + canceled.id,
    amountVnd: canceled.priceVnd,
    status: 'PAID',
  });
  await billing.settle('payos', {
    orderId: canceled.id,
    transactionId: 'late-' + canceled.id,
    amountVnd: canceled.priceVnd,
    status: 'FAILED',
  });
  assert.equal((await billing.get(user.id, canceled.id, '')).status, 'PAID');
  console.info(
    'PASS checkout, owner auth, idempotency, 10 webhook replays, wrong amount, cancellation and late success',
  );

  const expiryBalance = await balance();
  const expiring = await createOrder('chat-100');
  const expiredOrder = await db.paymentOrder.update({
    where: { id: expiring.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  assert.equal((await billing.get(user.id, expiredOrder.id, '')).status, 'EXPIRED');
  assert.equal((await billing.get(user.id, expiredOrder.id, '')).checkoutUrl, null);
  assert.equal((await balance()).chatCredits, expiryBalance.chatCredits);
  assert.equal((await request('/billing/sandbox/' + expiredOrder.id)).status, 404);
  assert.equal((await request('/billing/vnpay/ipn')).status, 404);
  const returned = await request(
    '/billing/payos/return/' + expiredOrder.id + '?status=PAID&cancel=false',
    'GET',
    undefined,
    '',
  );
  assert.equal(returned.status, 303);
  assert(
    new URL(returned.headers.get('location')!).searchParams.get('orderId') === expiredOrder.id,
  );
  assert.equal((await balance()).chatCredits, expiryBalance.chatCredits);
  const replacement = await createOrder('chat-100');
  const replacementLink = await providerLink(replacement.id);
  replacementLink.status = 'CANCELLED';
  await billing.webhook(await webhookFor(replacement.id));
  console.info(
    'PASS expired checkout hidden, retired routes removed and browser return never grants',
  );

  // HTTP SSE uses the real chat gateway with a deterministic development provider.
  const sessionResponse = await request('/chat/sessions', 'POST', { title: 'Billing acceptance' });
  const session = (await sessionResponse.json()) as { data: { id: string } };
  const chat = async (idempotencyKey: string) => {
    const response = await request('/chat/sessions/' + session.data.id + '/messages', 'POST', {
      content: 'Đậu hũ có bao nhiêu protein cho người ăn chay?',
      idempotencyKey,
    });
    const text = await response.text();
    assert.equal(response.status, 200, text);
    assert(text.includes('message_complete'), text);
    return text;
  };
  const chatStart = (await balance()).chatCredits;
  await chat(randomUUID());
  assert.equal((await balance()).chatCredits, chatStart);
  const paidKey = randomUUID();
  const paidStream = await chat(paidKey);
  assert(paidStream.includes('paidRemaining'));
  assert.equal((await balance()).chatCredits, chatStart - 1);
  await chat(paidKey);
  assert.equal((await balance()).chatCredits, chatStart - 1);
  const subjectKey = createHash('sha256')
    .update('user:' + user.id)
    .digest('hex');
  assert.equal(
    (await db.aiQuotaBucket.findFirstOrThrow({ where: { subjectKey } })).successfulCount,
    1,
  );
  console.info(
    'PASS free chat before purchased credits, atomic paid completion, SSE quota and replay',
  );

  const assistant = await db.chatMessage.findFirstOrThrow({
    where: { sessionId: session.data.id, role: 'ASSISTANT', status: 'COMPLETED' },
  });
  assert(assistant.requestMessageId);
  const oldToken = 'CHAT:' + assistant.id + ':old';
  const newToken = 'CHAT:' + assistant.id + ':new';
  const oldDate = new Date('2026-10-12T00:00:00Z');
  const oldSubject = 'cross-midnight-' + marker;
  await db.aiQuotaBucket.create({
    data: {
      subjectKey: oldSubject,
      usageDate: oldDate,
      quotaLimit: 1,
      reservationKey: oldToken,
      reservationExpiresAt: new Date(Date.now() + 60000),
    },
  });
  await db.chatMessage.update({
    where: { id: assistant.id },
    data: {
      status: 'PENDING',
      processingToken: newToken,
      completedAt: null,
      content: '',
      provider: null,
      modelId: null,
      providerResponseId: null,
    },
  });
  await assert.rejects(
    new ChatRepository(db, entitlements).completeSuccessfulTurn({
      subjectKey: oldSubject,
      usageDate: oldDate,
      reservationKey: oldToken,
      assistantMessageId: assistant.id,
      content: 'Stale worker',
      provider: 'fake',
      modelId: config.ai.chatModel,
      providerResponseId: 'stale',
      requestMessageId: assistant.requestMessageId,
      latencyMs: 1,
      inputTokens: 1,
      outputTokens: 1,
    }),
    /CHAT_PROCESSING_TOKEN_LOST/,
  );
  assert.equal(
    (
      await db.aiQuotaBucket.findUniqueOrThrow({
        where: { subjectKey_usageDate: { subjectKey: oldSubject, usageDate: oldDate } },
      })
    ).successfulCount,
    0,
  );
  assert.equal(
    (await db.chatMessage.findUniqueOrThrow({ where: { id: assistant.id } })).processingToken,
    newToken,
  );
  await db.chatMessage.update({
    where: { id: assistant.id },
    data: {
      status: 'COMPLETED',
      processingToken: null,
      completedAt: assistant.completedAt,
      content: assistant.content,
      provider: assistant.provider,
      modelId: assistant.modelId,
      providerResponseId: assistant.providerResponseId,
    },
  });
  console.info('PASS cross-midnight chat completion cannot overwrite a newer attempt');

  await db.entitlementAccount.update({ where: { ownerId: user.id }, data: { chatCredits: 1 } });
  const keys = ['CHAT:' + randomUUID() + ':a', 'CHAT:' + randomUUID() + ':b'];
  const contenders = await Promise.allSettled(
    keys.map((resourceKey) =>
      db.$transaction((tx) => entitlements.reserve(tx, user.id, 'CHAT', resourceKey)),
    ),
  );
  assert.equal(contenders.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal((await balance()).chatCredits, 0);
  const held = await db.usageReservation.findFirstOrThrow({
    where: { ownerId: user.id, feature: 'CHAT', status: 'HELD' },
  });
  await db.$transaction((tx) => entitlements.settle(tx, held.resourceKey, false));
  assert.equal((await balance()).chatCredits, 1);
  const crashKey = 'CHAT:' + randomUUID() + ':crash';
  await db.$transaction((tx) => entitlements.reserve(tx, user.id, 'CHAT', crashKey, new Date(0)));
  await entitlements.recover();
  assert.equal((await balance()).chatCredits, 1);
  assert.equal(
    (await db.usageReservation.findUniqueOrThrow({ where: { resourceKey: crashKey } })).status,
    'RELEASED',
  );
  console.info('PASS final-credit race, failure release and abandoned reservation recovery');

  const pantry = new PantryService(new PantryRepository(db, entitlements));
  await db.entitlementAccount.update({ where: { ownerId: user.id }, data: { pantrySlots: 0 } });
  const itemInput = (name: string) => ({
    unmatchedText: name,
    quantity: 10,
    unit: 'g',
    confidence: 1,
    idempotencyKey: randomUUID(),
  });
  const first = await pantry.create(user.id, itemInput('Đậu xanh ' + marker));
  const pantryRace = await Promise.allSettled([
    pantry.create(user.id, itemInput('Gạo ' + marker)),
    pantry.create(user.id, itemInput('Nấm ' + marker)),
  ]);
  assert.equal(pantryRace.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(await db.pantryItem.count({ where: { ownerId: user.id, deletedAt: null } }), 2);
  await assert.rejects(
    pantry.create(user.id, itemInput('Hạt sen ' + marker)),
    expectCode('PANTRY_CAPACITY_EXCEEDED'),
  );

  const fixtures = await db.mediaAsset.findMany({
    where: {
      id: { in: ['21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001'] },
    },
  });
  assert.equal(fixtures.length, 2);
  const assets = [];
  const policy = await db.storagePolicy.findFirstOrThrow({ where: { active: true } });
  await db.storageAccount.create({ data: { userId: user.id, policyId: policy.id } });
  for (const fixture of fixtures) {
    const { id: _id, ownerId: _ownerId, ...data } = fixture;
    assert(_id && _ownerId);
    assets.push(
      await db.mediaAsset.create({
        data: { ...data, ownerId: user.id, publicId: fixture.publicId + '-' + marker },
      }),
    );
  }
  const fridgeAsset = assets.find((a) => a.kind === 'FRIDGE_IMAGE')!;
  const receiptAsset = assets.find((a) => a.kind === 'RECEIPT_IMAGE')!;
  const visionRepo = new IngredientRecognitionRepository(db, entitlements);
  const receiptRepo = new ReceiptRepository(db, entitlements);
  const visionBefore = (await balance()).fridgeCredits;
  const vision = await visionRepo.createJob({
    ownerId: user.id,
    assetIds: [fridgeAsset.id],
    provider: 'fake',
    modelId: config.vision.model,
    templateVersion: config.vision.templateVersion,
    idempotencyKey: randomUUID(),
    requestHash: marker,
  });
  const running = (await visionRepo.startProcessing(user.id, vision.job.id))!;
  const inputId = running.inputs[0]!.id;
  const candidate = {
    ingredientId: null,
    detectedName: 'Cà rốt ' + marker,
    normalizedName: 'carrot' + marker,
    quantity: 10,
    unit: 'g',
    freshnessObservation: null,
    confidence: 0.8,
    matchConfidence: null,
    uncertaintyNote: null,
    evidence: [{ inputId, confidence: 0.8, observation: null }],
  };
  const ready = await visionRepo.saveResults(
    running.id,
    [{ inputId, error: null }],
    [candidate],
    running.attemptCount,
  );
  assert.equal((await balance()).fridgeCredits, visionBefore - 1);
  const confirmVision = () =>
    visionRepo.confirm({
      ownerId: user.id,
      jobId: ready.id,
      candidates: ready.candidates.map((c) => ({ id: c.id, expectedVersion: c.version })),
      idempotencyKey: randomUUID(),
      requestHash: marker,
    });
  await assert.rejects(confirmVision(), expectCode('PANTRY_CAPACITY_EXCEEDED'));
  assert.equal((await balance()).fridgeCredits, visionBefore - 1);
  const receipt = await receiptRepo.createJob({
    ownerId: user.id,
    assetIds: [receiptAsset.id],
    provider: 'fake',
    modelId: config.receipt.model,
    templateVersion: config.receipt.templateVersion,
    idempotencyKey: randomUUID(),
    requestHash: marker,
  });
  const receiptRunning = (await receiptRepo.startProcessing(user.id, receipt.job.id))!;
  const receiptReady = await receiptRepo.saveResults({
    jobId: receiptRunning.id,
    expectedAttempt: receiptRunning.attemptCount,
    inputs: [{ inputId: receiptRunning.inputs[0]!.id, error: null, receiptNumber: null, merchantName: null, purchasedAt: null, currency: null, totalAmount: null }],
    candidates: [
      {
        inputId: receiptRunning.inputs[0]!.id,
        ingredientId: null,
        lineText: 'Rau',
        detectedName: 'Rau ' + marker,
        normalizedName: 'rau' + marker,
        quantity: 10,
        unit: 'g',
        unitPrice: null,
        lineTotal: null,
        currency: null,
        confidence: 0.8,
        matchConfidence: null,
        uncertaintyNote: null,
      },
    ],
    metadata: {
      merchantName: null,
      purchasedAt: null,
      currency: null,
      totalAmount: null,
      confidence: null,
    },
  });
  await assert.rejects(
    receiptRepo.confirm({
      ownerId: user.id,
      jobId: receiptReady.id,
      candidates: receiptReady.candidates.map((c) => ({
        id: c.id,
        expectedVersion: c.version,
        conversion: {
          normalizedGrams: 10,
          status: 'CONVERTED' as const,
          source: 'SYSTEM_MASS',
          version: 'UCUM-MASS-V1',
          confidence: 1,
        },
      })),
      idempotencyKey: randomUUID(),
      requestHash: marker,
    }),
    expectCode('PANTRY_CAPACITY_EXCEEDED'),
  );
  await pantry.delete(user.id, first.item.id, first.item.version);
  await confirmVision();
  assert.equal(await db.pantryItem.count({ where: { ownerId: user.id, deletedAt: null } }), 2);
  console.info(
    'PASS Pantry final-slot race, manual/fridge/receipt enforcement, deletion frees space and confirmation does not recharge',
  );

  const failed = await visionRepo.createJob({
    ownerId: user.id,
    assetIds: [fridgeAsset.id],
    provider: 'fake',
    modelId: config.vision.model,
    templateVersion: config.vision.templateVersion,
    idempotencyKey: randomUUID(),
    requestHash: marker,
  });
  const failedRun = (await visionRepo.startProcessing(user.id, failed.job.id))!;
  const failedBalance = (await balance()).fridgeCredits;
  await visionRepo.markFailed(
    failedRun.id,
    'PROVIDER_ERROR',
    'Fixture failure',
    failedRun.attemptCount,
  );
  assert.equal((await balance()).fridgeCredits, failedBalance + 1);
  await visionRepo.queueRetry(user.id, failedRun.id, randomUUID(), marker);
  await db.recognitionJob.update({ where: { id: failedRun.id }, data: { createdAt: new Date(0) } });
  assert.equal(
    (await visionRepo.findOwnedJob(user.id, failedRun.id))!.status,
    'QUEUED',
    'Fresh queue lease must permit retry of an old job',
  );
  const retry = (await visionRepo.startProcessing(user.id, failedRun.id))!;
  await visionRepo.saveResults(
    retry.id,
    [{ inputId: retry.inputs[0]!.id, error: null }],
    [],
    failedRun.attemptCount,
  );
  assert.equal(
    (await visionRepo.findOwnedJob(user.id, retry.id))!.status,
    'PROCESSING',
    'Stale attempt must not write',
  );
  await visionRepo.saveResults(
    retry.id,
    [{ inputId: retry.inputs[0]!.id, error: null }],
    [],
    retry.attemptCount,
  );
  assert.equal((await balance()).fridgeCredits, failedBalance);
  console.info(
    'PASS failed scan release, retry reservation, valid empty analysis and stale-worker fencing',
  );

  const secondFridge = await db.mediaAsset.create({
    data: { ...fridgeAsset, id: randomUUID(), publicId: fridgeAsset.publicId + '-second' },
  });
  const charged = await visionRepo.createJob({
    ownerId: user.id,
    assetIds: [fridgeAsset.id, secondFridge.id],
    provider: 'fake',
    modelId: config.vision.model,
    templateVersion: config.vision.templateVersion,
    idempotencyKey: randomUUID(),
    requestHash: marker,
  });
  const chargedStart = (await visionRepo.startProcessing(user.id, charged.job.id))!;
  const chargedBefore = (await balance()).fridgeCredits;
  await visionRepo.saveResults(
    chargedStart.id,
    chargedStart.inputs.map((input, index) => ({
      inputId: input.id,
      error: index ? { code: 'FIXTURE_FAILURE', message: 'Partial failure' } : null,
    })),
    [],
    chargedStart.attemptCount,
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    await visionRepo.queueRetry(user.id, chargedStart.id, randomUUID(), marker);
    const run = (await visionRepo.startProcessing(user.id, chargedStart.id))!;
    await visionRepo.saveResults(
      run.id,
      run.inputs.map((input, index) => ({
        inputId: input.id,
        error: index ? { code: 'FIXTURE_FAILURE', message: 'Partial failure' } : null,
      })),
      [],
      run.attemptCount,
    );
  }
  assert.equal(
    (await balance()).fridgeCredits,
    chargedBefore,
    'Charged retry never debits another credit',
  );
  await assert.rejects(
    visionRepo.queueRetry(user.id, chargedStart.id, randomUUID(), marker),
    expectCode('SCAN_RETRY_LIMIT_EXCEEDED'),
  );
  console.info('PASS partial-success charge, free charged-job retries and configured attempt cap');

  const protocol = await createOrder('receipt-10');
  const protocolLink = await providerLink(protocol.id);
  const providers = new BillingProviders(config);
  const protocolOwned = await billing.owned(user.id, protocol.id);
  const protocolStart = await balance();
  protocolLink.status = 'UNDERPAID';
  protocolLink.amountPaid = 100;
  protocolLink.amountRemaining = protocolLink.amount - 100;
  await billing.webhook(await webhookFor(protocol.id, 100));
  assert.equal((await billing.get(user.id, protocol.id, '')).status, 'PENDING');
  assert.equal((await balance()).receiptCredits, protocolStart.receiptCredits);
  const signed = await webhookFor(protocol.id, 100);
  await assert.rejects(
    providers.verifyWebhook({ ...signed, data: { ...signed.data, amount: 101 } }),
    expectCode('BILLING_SIGNATURE_INVALID'),
  );
  await assert.rejects(
    billing.webhook({
      ...signed,
      data: { ...signed.data, currency: 'USD' },
      signature: signedData({ ...signed.data, currency: 'USD' }),
    }),
    expectCode('BILLING_PAYMENT_MISMATCH'),
  );
  await assert.rejects(
    billing.webhook({
      ...signed,
      data: { ...signed.data, paymentLinkId: 'f'.repeat(32) },
      signature: signedData({ ...signed.data, paymentLinkId: 'f'.repeat(32) }),
    }),
    expectCode('BILLING_PAYMENT_MISMATCH'),
  );
  tamperQuery = true;
  await assert.rejects(providers.query(protocolOwned), expectCode('BILLING_SIGNATURE_INVALID'));
  tamperQuery = false;
  unavailableQuery = true;
  assert.equal((await request('/billing/payos/webhook', 'POST', signed, '')).status, 503);
  unavailableQuery = false;
  protocolLink.status = 'PAID';
  protocolLink.amountPaid = protocolLink.amount - 1;
  assert.equal((await providers.query(protocolOwned)).status, 'PENDING');
  protocolLink.amountPaid = protocolLink.amount + 100;
  protocolLink.amountRemaining = 0;
  await billing.webhook(await webhookFor(protocol.id));
  await billing.webhook(await webhookFor(protocol.id));
  assert.equal((await balance()).receiptCredits, protocolStart.receiptCredits + 10);
  const unknown = { ...signed.data, orderCode: 1 };
  const sampleBalance = await balance();
  assert.equal(
    (
      await request(
        '/billing/payos/webhook',
        'POST',
        { ...signed, data: unknown, signature: signedData(unknown) },
        '',
      )
    ).status,
    200,
  );
  const confirmationSample = {
    code: signed.code,
    desc: signed.desc,
    data: unknown,
    signature: signedData(unknown),
  };
  assert.equal(
    (await request('/billing/payos/webhook', 'POST', confirmationSample, '')).status,
    200,
  );
  assert.equal(
    (
      await request(
        '/billing/payos/webhook',
        'POST',
        { ...confirmationSample, signature: '0'.repeat(64) },
        '',
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/billing/payos/webhook',
        'POST',
        { ...confirmationSample, success: 'true' },
        '',
      )
    ).status,
    400,
  );
  assert.deepEqual(await balance(), sampleBalance);
  const pending = await createOrder('receipt-10');
  const pendingBeforeRecovery = await billing.owned(user.id, pending.id);
  const linkCount = links.size;
  await db.paymentOrder.update({
    where: { id: pending.id },
    data: { providerLinkId: null, providerCheckoutUrl: null },
  });
  assert.equal(
    (await request('/billing/orders/' + pending.id + '/reconcile', 'POST', {})).status,
    200,
  );
  assert.equal((await billing.get(user.id, pending.id, '')).checkoutUrl, pending.checkoutUrl);
  assert.equal(
    (await billing.owned(user.id, pending.id)).providerOrderCode,
    pendingBeforeRecovery.providerOrderCode,
  );
  assert.equal(links.size, linkCount);
  assert.equal(
    (await request('/billing/orders/' + pending.id + '/reconcile', 'POST', {})).status,
    429,
  );
  ambiguousCreate = true;
  const recovered = await createOrder('receipt-10');
  assert(recovered.checkoutUrl);
  const recoveredOrder = await billing.owned(user.id, recovered.id);
  const existingCode = recoveredOrder.providerOrderCode;
  assert.equal(
    (
      await billing.create(
        user.id,
        { productId: 'receipt-10', idempotencyKey: recoveredOrder.idempotencyKey },
        '',
      )
    ).id,
    recovered.id,
  );
  assert.equal((await billing.owned(user.id, recovered.id)).providerOrderCode, existingCode);
  const missingConfig = { ...config, billing: { ...config.billing, payosApiKey: undefined } };
  const disabled = new BillingService(db, entitlements, missingConfig);
  assert.equal((await disabled.products()).enabled, false);
  await assert.rejects(
    disabled.create(user.id, { productId: 'chat-100', idempotencyKey: randomUUID() }, ''),
    expectCode('BILLING_PROVIDER_UNAVAILABLE'),
  );
  const historic = await db.paymentOrder.update({
    where: { id: expiring.id },
    data: { provider: 'sandbox' },
  });
  assert.equal(billing.serialize(historic).provider, 'sandbox');
  assert.equal(billing.serialize(historic).checkoutUrl, null);
  await assert.rejects(
    billing.settle('sandbox', {
      orderId: historic.id,
      transactionId: 'legacy',
      amountVnd: historic.priceVnd,
      status: 'PAID',
    }),
    expectCode('BILLING_PAYMENT_MISMATCH'),
  );
  console.info(
    'PASS signed SDK create/query/webhook, underpayment, overpayment, replay, unknown sample, provider errors, cooldown, ambiguous create recovery and legacy read-only history',
  );
  assert.throws(() =>
    loadConfig({
      ...process.env,
      NODE_ENV: 'production',
      BILLING_ENABLED: 'true',
      VISION_ENABLED: 'false',
      RECEIPT_ENABLED: 'false',
    }),
  );
  console.info('PASS payOS fixtures and production rollout guard');
  console.info(
    'Billing acceptance complete. payOS transport was mocked; no external merchant request or real transfer occurred.',
  );
} finally {
  globalThis.fetch = originalFetch;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await db.$disconnect();
}
