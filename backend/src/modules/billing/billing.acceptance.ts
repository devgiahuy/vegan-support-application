import { ChatRepository } from '../chat/chat.repository.js';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
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
import { BillingProviders, paymentHmac, vnpayCanonical, vnpayDate } from './billing.providers.js';
import { billingEnvelope, billingOrderSchema, entitlementSchema } from './billing.schemas.js';
import { seedBillingProducts } from './billing.catalog.js';
import { AppError } from '../../common/errors/app-error.js';

const config = loadConfig({
  ...process.env,
  NODE_ENV: 'test',
  BILLING_ENABLED: 'true',
  BILLING_PROVIDER: 'sandbox',
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
  const sandboxUrl = new URL(order.checkoutUrl);
  const capability = sandboxUrl.searchParams.get('token')!;
  assert.equal((await fetch(order.checkoutUrl)).status, 200);
  assert.equal((await fetch(order.checkoutUrl.replace(capability, 'a'.repeat(128)))).status, 403);
  assert.equal(
    (await request('/billing/sandbox/' + order.id, 'POST', { token: capability, outcome: 'PAID' }))
      .status,
    303,
  );
  await Promise.all(
    Array.from({ length: 10 }, () =>
      billing.settle('sandbox', {
        orderId: order.id,
        amountVnd: order.priceVnd,
        status: 'PAID',
        transactionId: 'demo-' + order.id,
      }),
    ),
  );
  const purchased = await balance();
  assert.equal(purchased.chatCredits, before.chatCredits + 100);
  assert.equal(purchased.fridgeCredits, before.fridgeCredits + 10);
  assert.equal(purchased.receiptCredits, before.receiptCredits + 10);
  assert.equal(purchased.pantrySlots, 50);
  assert.equal(await db.paymentEvent.count({ where: { orderId: order.id } }), 1);
  await assert.rejects(
    billing.settle('sandbox', {
      orderId: order.id,
      amountVnd: 1,
      status: 'PAID',
      transactionId: 'bad',
    }),
    expectCode('BILLING_PAYMENT_MISMATCH'),
  );
  const canceled = await createOrder('chat-100');
  await billing.sandboxSettle(
    canceled.id,
    new URL(canceled.checkoutUrl!).searchParams.get('token')!,
    'CANCELLED',
  );
  assert.equal((await balance()).chatCredits, purchased.chatCredits);
  await billing.settle('sandbox', {
    orderId: canceled.id,
    transactionId: 'late-' + canceled.id,
    amountVnd: canceled.priceVnd,
    status: 'PAID',
  });
  await billing.settle('sandbox', {
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
  const expiredCheckoutUrl = billing.providers.checkout(expiredOrder, '127.0.0.1');
  const expiredJson = await fetch(expiredCheckoutUrl);
  assert.equal(expiredJson.status, 410);
  assert.equal(
    ((await expiredJson.json()) as { error: { code: string } }).error.code,
    'BILLING_CHECKOUT_EXPIRED',
  );
  const expiredPage = await fetch(expiredCheckoutUrl, { headers: { Accept: 'text/html' } });
  assert.equal(expiredPage.status, 410);
  assert(expiredPage.headers.get('content-type')?.includes('text/html'));
  assert((await expiredPage.text()).includes('Phiên thanh toán đã hết hạn'));
  const expiredForm = await fetch(
    new URL(expiredCheckoutUrl).origin + new URL(expiredCheckoutUrl).pathname,
    {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
      body: new URLSearchParams({
        token: new URL(expiredCheckoutUrl).searchParams.get('token')!,
        outcome: 'PAID',
      }),
    },
  );
  assert.equal(expiredForm.status, 410);
  assert((await expiredForm.text()).includes('Phiên thanh toán đã hết hạn'));
  const expiredDetail = await billing.get(user.id, expiring.id, '127.0.0.1');
  assert.equal(expiredDetail.status, 'EXPIRED');
  assert.equal(expiredDetail.checkoutUrl, null);
  assert.equal((await balance()).chatCredits, expiryBalance.chatCredits);
  const replacement = await createOrder('chat-100');
  assert(replacement.checkoutUrl);
  await billing.sandboxSettle(
    replacement.id,
    new URL(replacement.checkoutUrl).searchParams.get('token')!,
    'CANCELLED',
  );
  console.info('PASS expired checkout GET/POST show recovery, never grant and allow a new order');

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
    inputs: [{ inputId: receiptRunning.inputs[0]!.id, error: null }],
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

  const vnpConfig = {
    ...config,
    billing: {
      ...config.billing,
      provider: 'vnpay' as const,
      vnpayMerchant: 'TESTCODE',
      vnpaySecret: 'acceptance-only-secret-1234567890',
    },
  };
  const providers = new BillingProviders(vnpConfig);
  const unsigned = {
    vnp_TmnCode: 'TESTCODE',
    vnp_TxnRef: order.id.replaceAll('-', ''),
    vnp_Amount: String(order.priceVnd * 100),
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TransactionNo: '123456',
    vnp_CurrCode: 'VND',
  };
  const signed = {
    ...unsigned,
    vnp_SecureHash: paymentHmac(vnpConfig.billing.vnpaySecret, vnpayCanonical(unsigned)),
  };
  assert.equal(providers.verifyIpn(signed).amountVnd, order.priceVnd);
  assert.throws(
    () => providers.verifyIpn({ ...signed, vnp_Amount: '1' }),
    expectCode('BILLING_SIGNATURE_INVALID'),
  );
  assert.throws(
    () => providers.verifyIpn({ ...signed, vnp_TxnRef: [order.id] }),
    expectCode('BILLING_SIGNATURE_INVALID'),
  );
  assert.equal(vnpayDate(new Date('2026-10-13T00:00:00Z')), '20261013070000');
  assert.equal(vnpayCanonical({ b: 'x y', a: 'a&b' }), 'a=a%26b&b=x+y');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, init) => {
    assert(typeof init?.body === 'string');
    const body = JSON.parse(init.body) as Record<string, string>;
    const raw = [
      body.vnp_RequestId,
      '2.1.0',
      'querydr',
      'TESTCODE',
      order.id.replaceAll('-', ''),
      vnpayDate(new Date(order.createdAt)),
      body.vnp_CreateDate,
      '127.0.0.1',
      body.vnp_OrderInfo,
    ].join('|');
    assert.equal(body.vnp_SecureHash, paymentHmac(vnpConfig.billing.vnpaySecret, raw));
    const result = {
      ...unsigned,
      vnp_ResponseId: 'fixture',
      vnp_Command: 'querydr',
      vnp_Message: 'Success',
      vnp_TransactionType: '01',
      vnp_OrderInfo: body.vnp_OrderInfo!,
    };
    const fields = [
      'vnp_ResponseId',
      'vnp_Command',
      'vnp_ResponseCode',
      'vnp_Message',
      'vnp_TmnCode',
      'vnp_TxnRef',
      'vnp_Amount',
      'vnp_BankCode',
      'vnp_PayDate',
      'vnp_TransactionNo',
      'vnp_TransactionType',
      'vnp_TransactionStatus',
      'vnp_OrderInfo',
      'vnp_PromotionCode',
      'vnp_PromotionAmount',
    ];
    const values: Record<string, string> = result;
    return Promise.resolve(
      new Response(
        JSON.stringify({
          ...result,
          vnp_SecureHash: paymentHmac(
            vnpConfig.billing.vnpaySecret,
            fields.map((f) => values[f] ?? '').join('|'),
          ),
        }),
      ),
    );
  };
  try {
    assert.equal(
      (await providers.query(await billing.owned(user.id, order.id), '127.0.0.1')).status,
      'PAID',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.throws(() =>
    loadConfig({
      ...process.env,
      NODE_ENV: 'production',
      BILLING_ENABLED: 'true',
      VISION_ENABLED: 'false',
      RECEIPT_ENABLED: 'false',
    }),
  );
  console.info(
    'PASS VNPAY checkout/IPN/querydr protocol fixtures, tampering, duplicate keys and production guards',
  );
  console.info(
    'Billing acceptance complete. External VNPAY sandbox was not called; merchant credentials are required for that separate check.',
  );
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await db.$disconnect();
}
