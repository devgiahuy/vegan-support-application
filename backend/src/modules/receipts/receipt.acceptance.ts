import { createPrismaClient } from '../../database/client.js';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { MediaKind, MediaResourceType, ReceiptJobStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { loadConfig } from '../../config/env.js';
import { createReceiptExtractionProvider } from './receipt.provider.js';
import { ReceiptRepository } from './receipt.repository.js';
import { ReceiptService } from './receipt.service.js';

const prisma = createPrismaClient();
const config = loadConfig();
const repository = new ReceiptRepository(prisma);
const service = new ReceiptService(repository, createReceiptExtractionProvider(config), config);
const prefix = 'phase22-acceptance-';
const customMealId = '22000000-0000-4000-8000-000000000100';
const twinAssetIds = [
  '22000000-0000-4000-8000-0000000000b1',
  '22000000-0000-4000-8000-0000000000b2',
  '22000000-0000-4000-8000-0000000000b3',
] as const;

async function cleanup(ownerId: string): Promise<void> {
  const jobs = await prisma.receiptJob.findMany({
    where: { ownerId, idempotencyKey: { startsWith: prefix } },
    include: { candidates: { select: { pantryItemId: true } } },
  });
  const jobIds = jobs.map((job) => job.id);
  const pantryIds = jobs.flatMap((job) =>
    job.candidates.flatMap((candidate) => (candidate.pantryItemId ? [candidate.pantryItemId] : [])),
  );
  await prisma.$transaction(async (transaction) => {
    if (jobIds.length) {
      await transaction.receiptCandidate.deleteMany({ where: { jobId: { in: jobIds } } });
      await transaction.receiptInput.deleteMany({ where: { jobId: { in: jobIds } } });
      await transaction.receiptJob.deleteMany({ where: { id: { in: jobIds } } });
    }
    await transaction.mediaAsset.deleteMany({ where: { id: { in: [...twinAssetIds] } } });
    if (pantryIds.length) {
      await transaction.pantryAdjustment.deleteMany({
        where: { ownerId, pantryItemId: { in: pantryIds } },
      });
      await transaction.pantryItem.deleteMany({
        where: {
          id: { in: pantryIds },
          ownerId,
          source: 'RECEIPT',
          sourceReferenceId: { in: jobIds },
        },
      });
    }
    await transaction.customMeal.deleteMany({ where: { id: customMealId, ownerId } });
  });
}

async function waitForTerminal(ownerId: string, id: string) {
  for (let index = 0; index < 50; index += 1) {
    const job = await repository.findOwnedJob(ownerId, id);
    assert(job);
    if (job.status !== ReceiptJobStatus.QUEUED && job.status !== ReceiptJobStatus.PROCESSING)
      return job;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Receipt job ${id} did not reach a terminal state`);
}

async function main(): Promise<void> {
  assert.equal(
    config.receipt.provider,
    'fake',
    'Phase 22 acceptance requires RECEIPT_PROVIDER=fake',
  );
  const fixture = await prisma.mediaAsset.findUniqueOrThrow({
    where: { id: '22000000-0000-4000-8000-000000000001' },
    select: { owner: true },
  });
  const owner = fixture.owner;
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  await cleanup(owner.id);
  try {
    const created = await service.create(owner.id, {
      imageAssetIds: ['22000000-0000-4000-8000-000000000001'],
      idempotencyKey: `${prefix}main`,
    });
    const replay = await service.create(owner.id, {
      imageAssetIds: ['22000000-0000-4000-8000-000000000001'],
      idempotencyKey: `${prefix}main`,
    });
    assert.equal(replay.id, created.id, 'duplicate receipt create must replay');
    const ready = await waitForTerminal(owner.id, created.id);
    assert.equal(ready.status, ReceiptJobStatus.READY);
    assert.equal(
      await prisma.pantryItem.count({ where: { ownerId: owner.id, sourceReferenceId: ready.id } }),
      0,
    );
    const unknown = ready.candidates.find((candidate) => candidate.ingredientId === null);
    assert(unknown, 'fake receipt must include an unknown line');
    assert.equal(unknown.detectedName, 'rau xanh chưa xác định');
    assert.equal(
      unknown.lineText,
      'RAU XANH 2 30000',
      'original receipt text must remain unchanged',
    );
    assert.match(unknown.uncertaintyNote ?? '', /chưa đủ/);
    const edited = await service.updateCandidate(owner.id, ready.id, unknown.id, {
      expectedVersion: unknown.version,
      detectedName: 'rau xanh đã chỉnh sửa',
      quantity: 3,
      unit: 'bó',
      decision: 'KEEP',
    });
    const corrected = edited.candidates.find((candidate) => candidate.id === unknown.id);
    assert(corrected);
    const confirmed = await service.confirm(owner.id, ready.id, {
      candidates: [{ id: unknown.id, expectedVersion: corrected.version }],
      idempotencyKey: `${prefix}confirm`,
    });
    assert.equal(confirmed.pantryChanges.length, 1);
    assert.equal(confirmed.pantryChanges[0]?.pantryItem.quantity, 3);
    const confirmationReplay = await service.confirm(owner.id, ready.id, {
      candidates: [{ id: unknown.id, expectedVersion: corrected.version }],
      idempotencyKey: `${prefix}confirm`,
    });
    assert.equal(
      confirmationReplay.pantryChanges[0]?.pantryItem.id,
      confirmed.pantryChanges[0]?.pantryItem.id,
    );

    const partial = await service.create(owner.id, {
      imageAssetIds: [
        '22000000-0000-4000-8000-000000000001',
        '22000000-0000-4000-8000-000000000002',
      ],
      idempotencyKey: `${prefix}partial`,
    });
    const partialDone = await waitForTerminal(owner.id, partial.id);
    assert.equal(partialDone.status, ReceiptJobStatus.PARTIAL_FAILED);
    assert(partialDone.candidates.length > 0);
    await service.retry(owner.id, partial.id, { idempotencyKey: `${prefix}retry` });
    const retried = await waitForTerminal(owner.id, partial.id);
    const retryReplay = await service.retry(owner.id, partial.id, {
      idempotencyKey: `${prefix}retry`,
    });
    assert.equal(retryReplay.attempt, retried.attemptCount);

    const cancellable = await service.create(owner.id, {
      imageAssetIds: ['22000000-0000-4000-8000-000000000001'],
      idempotencyKey: `${prefix}cancel`,
    });
    assert.equal(
      (await service.cancel(owner.id, cancellable.id)).status,
      ReceiptJobStatus.CANCELLED,
    );

    // Same photo uploaded twice, then more photos added to the same job.
    const primary = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: '22000000-0000-4000-8000-000000000001' },
    });
    for (const [index, id] of twinAssetIds.entries()) {
      await prisma.mediaAsset.create({
        data: {
          id,
          ownerId: owner.id,
          kind: MediaKind.RECEIPT_IMAGE,
          resourceType: MediaResourceType.IMAGE,
          publicId: `seed/receipts/phase22-twin-${String(index)}`,
          secureUrl: primary.secureUrl,
          mimeType: 'image/jpeg',
          extension: '.jpg',
          bytes: primary.bytes,
          // b1 and b2 are the same file uploaded twice; b3 is a different photo of the same lines.
          providerEtag: index < 2 ? 'phase22-twin-etag' : 'phase22-other-etag',
        },
      });
    }
    const repeatedJob = await service.create(owner.id, {
      imageAssetIds: [twinAssetIds[2]],
      idempotencyKey: `${prefix}cross-job-duplicate`,
    });
    const repeatedReady = await waitForTerminal(owner.id, repeatedJob.id);
    const repeatedUnknown = repeatedReady.candidates.find(
      (candidate) => candidate.lineText === 'RAU XANH 2 30000',
    );
    assert(repeatedUnknown);
    const repeatedEdited = await service.updateCandidate(owner.id, repeatedReady.id, repeatedUnknown.id, {
      expectedVersion: repeatedUnknown.version,
      detectedName: 'rau xanh đã chỉnh sửa',
      quantity: 3,
      unit: 'bó',
      decision: 'KEEP',
    });
    const repeatedCorrected = repeatedEdited.candidates.find(
      (candidate) => candidate.id === repeatedUnknown.id,
    );
    assert(repeatedCorrected);
    const repeatedConfirmation = await service.confirm(owner.id, repeatedJob.id, {
      candidates: [{ id: repeatedUnknown.id, expectedVersion: repeatedCorrected.version }],
      idempotencyKey: `${prefix}cross-job-confirm`,
    });
    assert.equal(
      repeatedConfirmation.pantryChanges.length,
      0,
      'cross-job duplicate must not increase pantry',
    );
    assert.deepEqual(repeatedConfirmation.duplicateCandidates, [
      { candidateId: repeatedUnknown.id, sourceJobId: ready.id },
    ]);
    assert.equal(
      (
        await prisma.pantryItem.findUniqueOrThrow({
          where: { id: confirmed.pantryChanges[0].pantryItem.id },
        })
      ).quantity,
      3,
    );
    const ambiguous = await repository.createJob({
      ownerId: owner.id,
      assetIds: [twinAssetIds[0], twinAssetIds[2]],
      provider: 'fake',
      modelId: config.receipt.model,
      templateVersion: config.receipt.templateVersion,
      idempotencyKey: `${prefix}ambiguous`,
      requestHash: `${prefix}ambiguous`,
    });
    const ambiguousRunning = await repository.startProcessing(owner.id, ambiguous.job.id);
    assert(ambiguousRunning);
    const [firstInput, secondInput] = ambiguousRunning.inputs;
    assert(firstInput && secondInput);
    const metadata = {
      receiptNumber: null,
      merchantName: 'Another Market',
      purchasedAt: new Date('2026-09-24T00:00:00.000Z'),
      currency: 'VND',
      totalAmount: 50000,
      error: null,
    };
    const candidate = (inputId: string, name: string, lineTotal: number) => ({
      inputId,
      ingredientId: null,
      lineText: `${name} ${lineTotal}`,
      detectedName: name,
      normalizedName: name.toLowerCase(),
      quantity: 1,
      unit: 'g',
      unitPrice: lineTotal,
      lineTotal,
      currency: 'VND',
      confidence: 0.9,
      matchConfidence: null,
      uncertaintyNote: null,
    });
    const ambiguousReady = await repository.saveResults({
      jobId: ambiguous.job.id,
      expectedAttempt: ambiguousRunning.attemptCount,
      inputs: [
        { inputId: firstInput.id, ...metadata, receiptNumber: 'MIXED-1' },
        { inputId: secondInput.id, ...metadata },
      ],
      candidates: [
        candidate(firstInput.id, 'Bí đỏ', 20000),
        candidate(secondInput.id, 'Bí đỏ', 20000),
        candidate(secondInput.id, 'Cà rốt', 30000),
      ],
      metadata: {
        merchantName: 'Another Market',
        purchasedAt: metadata.purchasedAt,
        currency: 'VND',
        totalAmount: 50000,
        confidence: 0.9,
      },
    });
    assert.equal(ambiguousReady.reviewRequired, true);
    assert.equal(ambiguousReady.identityDecisionRequired, true);
    assert.equal(
      ambiguousReady.candidates.length,
      3,
      'a cropped receipt number keeps partial lines for explicit review',
    );
    const ambiguousSelection = ambiguousReady.candidates.map((item) => ({
      id: item.id,
      expectedVersion: item.version,
    }));
    await assert.rejects(
      () =>
        service.confirm(owner.id, ambiguous.job.id, {
          candidates: ambiguousSelection,
          idempotencyKey: `${prefix}ambiguous-confirm`,
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === 'RECEIPT_REVIEW_DECISION_REQUIRED',
    );
    const mergedAmbiguous = await service.confirm(owner.id, ambiguous.job.id, {
      candidates: ambiguousSelection,
      idempotencyKey: `${prefix}ambiguous-confirm`,
      receiptReviewDecision: 'SAME_RECEIPT',
    });
    assert.equal(mergedAmbiguous.pantryChanges.length, 2);
    assert.equal(mergedAmbiguous.duplicateCandidates.length, 1);
    const croppedAgain = await repository.createJob({
      ownerId: owner.id,
      assetIds: [twinAssetIds[0]],
      provider: 'fake',
      modelId: config.receipt.model,
      templateVersion: config.receipt.templateVersion,
      idempotencyKey: `${prefix}cropped-again`,
      requestHash: `${prefix}cropped-again`,
    });
    const croppedRunning = await repository.startProcessing(owner.id, croppedAgain.job.id);
    assert(croppedRunning);
    const croppedInput = croppedRunning.inputs[0];
    assert(croppedInput);
    const croppedReady = await repository.saveResults({
      jobId: croppedAgain.job.id,
      expectedAttempt: croppedRunning.attemptCount,
      inputs: [{ inputId: croppedInput.id, ...metadata, receiptNumber: 'MIXED-1' }],
      candidates: [candidate(croppedInput.id, 'Cà rốt', 30000)],
      metadata: {
        merchantName: 'Another Market',
        purchasedAt: metadata.purchasedAt,
        currency: 'VND',
        totalAmount: 50000,
        confidence: 0.9,
      },
    });
    assert.equal(croppedReady.identityDecisionRequired, true);
    const croppedResult = await service.confirm(owner.id, croppedAgain.job.id, {
      candidates: [
        {
          id: croppedReady.candidates[0]!.id,
          expectedVersion: croppedReady.candidates[0]!.version,
        },
      ],
      idempotencyKey: `${prefix}cropped-again-confirm`,
      receiptReviewDecision: 'SAME_RECEIPT',
    });
    assert.equal(croppedResult.pantryChanges.length, 0);
    assert.deepEqual(croppedResult.duplicateCandidates, [
      { candidateId: croppedReady.candidates[0]!.id, sourceJobId: ambiguous.job.id },
    ]);
    const separate = await repository.createJob({
      ownerId: owner.id,
      assetIds: [twinAssetIds[1]],
      provider: 'fake',
      modelId: config.receipt.model,
      templateVersion: config.receipt.templateVersion,
      idempotencyKey: `${prefix}separate`,
      requestHash: `${prefix}separate`,
    });
    const separateRunning = await repository.startProcessing(owner.id, separate.job.id);
    assert(separateRunning);
    const separateInput = separateRunning.inputs[0];
    assert(separateInput);
    const separateReady = await repository.saveResults({
      jobId: separate.job.id,
      expectedAttempt: separateRunning.attemptCount,
      inputs: [{ inputId: separateInput.id, ...metadata }],
      candidates: [candidate(separateInput.id, 'Bí đỏ', 20000)],
      metadata: {
        merchantName: 'Another Market',
        purchasedAt: metadata.purchasedAt,
        currency: 'VND',
        totalAmount: 50000,
        confidence: 0.9,
      },
    });
    assert.equal(separateReady.identityDecisionRequired, true);
    const separateResult = await service.confirm(owner.id, separate.job.id, {
      candidates: [
        {
          id: separateReady.candidates[0]!.id,
          expectedVersion: separateReady.candidates[0]!.version,
        },
      ],
      idempotencyKey: `${prefix}separate-confirm`,
      receiptReviewDecision: 'SEPARATE_RECEIPTS',
    });
    assert.equal(separateResult.pantryChanges.length, 1, 'separate purchase must accumulate');
    assert.equal(separateResult.duplicateCandidates.length, 0);
    const twin = await service.create(owner.id, {
      imageAssetIds: [twinAssetIds[0], twinAssetIds[1]],
      idempotencyKey: `${prefix}twin`,
    });
    assert.equal(twin.images.length, 1, 'identical content uploaded twice is analysed once');
    const twinReady = await waitForTerminal(owner.id, twin.id);
    assert.equal(twinReady.status, ReceiptJobStatus.READY);
    assert.equal(twinReady.candidates.length, 2);
    const twinUnknown = twinReady.candidates.find((candidate) => candidate.ingredientId === null);
    assert(twinUnknown);
    await service.updateCandidate(owner.id, twin.id, twinUnknown.id, {
      expectedVersion: twinUnknown.version,
      detectedName: 'rau đã sửa tay',
      decision: 'KEEP',
    });
    const unchanged = await service.addImages(owner.id, twin.id, {
      imageAssetIds: [twinAssetIds[0], twinAssetIds[1]],
    });
    assert.equal(unchanged.status, ReceiptJobStatus.READY, 'nothing new means nothing is queued');
    assert.equal(unchanged.images.length, 1);
    const appended = await service.addImages(owner.id, twin.id, {
      imageAssetIds: [twinAssetIds[2]],
    });
    assert.equal(appended.images.length, 2);
    const merged = await waitForTerminal(owner.id, twin.id);
    assert.equal(merged.status, ReceiptJobStatus.READY);
    assert.equal(
      merged.candidates.length,
      2,
      'lines repeated from the new photo are not duplicated',
    );
    assert(
      merged.candidates.some((candidate) => candidate.detectedName === 'rau đã sửa tay'),
      'user edits survive an appended image',
    );
    await service.addImages(owner.id, twin.id, {
      imageAssetIds: ['22000000-0000-4000-8000-000000000002'],
    });
    const mergedPartial = await waitForTerminal(owner.id, twin.id);
    assert.equal(mergedPartial.status, ReceiptJobStatus.PARTIAL_FAILED);
    assert.equal(mergedPartial.candidates.length, 2, 'a failed extra image keeps earlier results');
    await assert.rejects(
      () => service.addImages(owner.id, cancellable.id, { imageAssetIds: [twinAssetIds[2]] }),
      (error: unknown) => error instanceof AppError && error.code === 'RECEIPT_STATE_CONFLICT',
    );

    const beforeOwnership = await prisma.receiptJob.count({ where: { ownerId: admin.id } });
    await assert.rejects(
      () =>
        service.create(admin.id, {
          imageAssetIds: ['22000000-0000-4000-8000-000000000001'],
          idempotencyKey: `${prefix}ownership`,
        }),
      (error: unknown) => error instanceof AppError && error.code === 'RECEIPT_IMAGE_INVALID',
    );
    assert.equal(await prisma.receiptJob.count({ where: { ownerId: admin.id } }), beforeOwnership);

    const tofu = await prisma.ingredient.findUniqueOrThrow({ where: { normalizedName: 'dau hu' } });
    await prisma.customMeal.create({
      data: {
        id: customMealId,
        ownerId: owner.id,
        name: 'Phase 22 shopping acceptance meal',
        servings: 1,
        ingredients: {
          create: [
            {
              position: 0,
              ingredientId: tofu.id,
              displayName: 'Đậu hũ',
              normalizedName: 'dau hu',
              amount: 1,
              unit: 'miếng',
              resolutionStatus: 'EXACT',
            },
            {
              position: 1,
              ingredientId: tofu.id,
              displayName: 'Đậu hũ',
              normalizedName: 'dau hu',
              amount: 100,
              unit: 'g',
              resolutionStatus: 'EXACT',
            },
            {
              position: 2,
              displayName: 'Mystery item',
              normalizedName: 'mystery item',
              amount: 1,
              unit: 'bunch',
              resolutionStatus: 'UNKNOWN',
            },
          ],
        },
      },
    });
    const availableGrams = (
      await prisma.pantryItem.findMany({
        where: {
          ownerId: owner.id,
          ingredientId: tofu.id,
          confirmationStatus: 'CONFIRMED',
          deletedAt: null,
          quantity: { gt: 0 },
        },
        select: { normalizedGrams: true },
      })
    ).reduce((total, item) => total + Number(item.normalizedGrams ?? 0), 0);
    assert(availableGrams > 0, 'seeded confirmed pantry must contain tofu');
    const oneServing = await service.shoppingGap(owner.id, {
      meals: [{ sourceType: 'CUSTOM_MEAL', customMealId, servings: 1 }],
    });
    const requiredPerServing = oneServing.items.find((item) => item.ingredient.id === tofu.id)
      ?.required.value;
    assert(requiredPerServing && requiredPerServing > 0, 'reviewed conversion must produce grams');
    const insufficientServings = (availableGrams + 200) / requiredPerServing;
    const insufficient = await service.shoppingGap(owner.id, {
      meals: [
        { sourceType: 'CUSTOM_MEAL', customMealId, servings: insufficientServings / 2 },
        { sourceType: 'CUSTOM_MEAL', customMealId, servings: insufficientServings / 2 },
      ],
    });
    const tofuGap = insufficient.items.find((item) => item.ingredient.id === tofu.id);
    assert(tofuGap);
    assert(
      Math.abs(tofuGap.required.value - (availableGrams + 200)) < 0.01,
      'multiple meals and reviewed piece conversion must aggregate',
    );
    assert(
      Math.abs(tofuGap.missing.value - 200) < 0.01,
      'confirmed pantry must remain authoritative for the gap',
    );
    assert(
      insufficient.unresolvedItems.some((item) => item.reasonCode === 'INGREDIENT_UNRESOLVED'),
    );
    const extra = await service.shoppingGap(owner.id, {
      meals: [
        {
          sourceType: 'CUSTOM_MEAL',
          customMealId,
          servings: availableGrams / (requiredPerServing * 2),
        },
      ],
    });
    const extraTofu = extra.items.find((item) => item.ingredient.id === tofu.id);
    assert(
      extraTofu && extraTofu.surplus.value > 0,
      'current confirmed pantry must expose extra inventory',
    );
    console.info(
      'Phase 22 fake-provider acceptance passed: duplicate retry, cross-job duplicate protection, ambiguous no-number review, duplicate-content collapse, appended images merge, unknown correction, partial extraction, confirmation boundary, ownership, multi-meal aggregation, reviewed conversion, unit mismatch, insufficient/extra pantry, and unresolved lines.',
    );
  } finally {
    await cleanup(owner.id);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
