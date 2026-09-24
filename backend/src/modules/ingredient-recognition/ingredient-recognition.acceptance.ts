import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient, RecognitionJobStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { loadConfig } from '../../config/env.js';
import { createIngredientVisionProvider } from './ingredient-vision.provider.js';
import { IngredientRecognitionRepository } from './ingredient-recognition.repository.js';
import { IngredientRecognitionService } from './ingredient-recognition.service.js';

const prisma = new PrismaClient();
const config = loadConfig();
const repository = new IngredientRecognitionRepository(prisma);
const service = new IngredientRecognitionService(
  repository,
  createIngredientVisionProvider(config),
  config,
);
const acceptancePrefix = 'phase21-acceptance-';

async function cleanup(ownerId: string): Promise<void> {
  const jobs = await prisma.recognitionJob.findMany({
    where: { ownerId, idempotencyKey: { startsWith: acceptancePrefix } },
    include: { candidates: { select: { pantryItemId: true } } },
  });
  const jobIds = jobs.map((job) => job.id);
  const pantryItemIds = jobs.flatMap((job) =>
    job.candidates.flatMap((candidate) => (candidate.pantryItemId ? [candidate.pantryItemId] : [])),
  );
  await prisma.$transaction(async (transaction) => {
    if (jobIds.length) await transaction.recognitionJob.deleteMany({ where: { id: { in: jobIds } } });
    if (pantryItemIds.length) {
      await transaction.pantryAdjustment.deleteMany({
        where: { ownerId, pantryItemId: { in: pantryItemIds } },
      });
      await transaction.pantryItem.deleteMany({
        where: {
          id: { in: pantryItemIds },
          ownerId,
          source: 'FRIDGE_RECOGNITION',
          sourceReferenceId: { in: jobIds },
        },
      });
    }
  });
}

async function waitForTerminal(ownerId: string, jobId: string) {
  for (let index = 0; index < 50; index += 1) {
    const job = await repository.findOwnedJob(ownerId, jobId);
    assert(job);
    if (
      job.status !== RecognitionJobStatus.QUEUED &&
      job.status !== RecognitionJobStatus.PROCESSING
    ) {
      return job;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Recognition job ${jobId} did not reach a terminal state`);
}

async function main(): Promise<void> {
  assert.equal(config.vision.provider, 'fake', 'Phase 21 acceptance requires VISION_PROVIDER=fake');
  const fixtureOwner = await prisma.mediaAsset.findUniqueOrThrow({
    where: { id: '21000000-0000-4000-8000-000000000001' },
    select: { owner: true },
  });
  const member = fixtureOwner.owner;
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } });
  await cleanup(member.id);
  try {
    const normalAssetIds = [
      '21000000-0000-4000-8000-000000000001',
      '21000000-0000-4000-8000-000000000002',
    ];
    const created = await service.create(member.id, {
      imageAssetIds: normalAssetIds,
      idempotencyKey: `${acceptancePrefix}main`,
    });
    const replay = await service.create(member.id, {
      imageAssetIds: normalAssetIds,
      idempotencyKey: `${acceptancePrefix}main`,
    });
    assert.equal(replay.id, created.id, 'create must be idempotent');
    const ready = await waitForTerminal(member.id, created.id);
    assert.equal(ready.status, RecognitionJobStatus.READY);
    const tofu = ready.candidates.find((candidate) => candidate.evidence.length === 2);
    assert(tofu, 'same ingredient across images must deduplicate and retain both evidence refs');
    assert(ready.candidates.some((candidate) => candidate.confidence.toNumber() < 0.5));
    const unknown = ready.candidates.find(
      (candidate) => candidate.ingredientId === null && candidate.quantity === null,
    );
    assert(unknown, 'fake fixture must contain an unknown ingredient');
    assert.equal(
      await prisma.pantryItem.count({ where: { ownerId: member.id, sourceReferenceId: ready.id } }),
      0,
      'processing results must not modify pantry',
    );
    const edited = await service.updateCandidate(member.id, ready.id, unknown.id, {
      expectedVersion: unknown.version,
      quantity: 3,
      unit: 'bunch',
      detectedName: 'unknown green vegetable',
      decision: 'KEEP',
    });
    const editedUnknown = edited.candidates.find((candidate) => candidate.id === unknown.id);
    assert(editedUnknown);
    const confirmed = await service.confirm(member.id, ready.id, {
      candidates: [{ id: unknown.id, expectedVersion: editedUnknown.version }],
      idempotencyKey: `${acceptancePrefix}confirm`,
    });
    assert.equal(confirmed.pantryChanges.length, 1);
    assert.equal(confirmed.pantryChanges[0]?.pantryItem.quantity, 3);
    const confirmReplay = await service.confirm(member.id, ready.id, {
      candidates: [{ id: unknown.id, expectedVersion: editedUnknown.version }],
      idempotencyKey: `${acceptancePrefix}confirm`,
    });
    assert.equal(confirmReplay.pantryChanges[0]?.pantryItem.id, confirmed.pantryChanges[0]?.pantryItem.id);

    const partial = await service.create(member.id, {
      imageAssetIds: [normalAssetIds[0]!, '21000000-0000-4000-8000-000000000003'],
      idempotencyKey: `${acceptancePrefix}partial`,
    });
    const partialDone = await waitForTerminal(member.id, partial.id);
    assert.equal(partialDone.status, RecognitionJobStatus.PARTIAL_FAILED);
    assert(partialDone.candidates.length > 0, 'partial provider failure must retain successful results');
    await service.retry(member.id, partial.id, { idempotencyKey: `${acceptancePrefix}retry` });
    const retried = await waitForTerminal(member.id, partial.id);
    const retryReplay = await service.retry(member.id, partial.id, {
      idempotencyKey: `${acceptancePrefix}retry`,
    });
    assert.equal(retryReplay.attempt, retried.attemptCount, 'retry idempotency must not add an attempt');

    const cancellable = await service.create(member.id, {
      imageAssetIds: normalAssetIds,
      idempotencyKey: `${acceptancePrefix}cancel`,
    });
    const cancelled = await service.cancel(member.id, cancellable.id);
    assert.equal(cancelled.status, RecognitionJobStatus.CANCELLED);

    const beforeInvalid = await prisma.recognitionJob.count({ where: { ownerId: admin.id } });
    await assert.rejects(
      () =>
        service.create(admin.id, {
          imageAssetIds: normalAssetIds,
          idempotencyKey: `${acceptancePrefix}ownership`,
        }),
      (error: unknown) => error instanceof AppError && error.code === 'RECOGNITION_IMAGE_INVALID',
    );
    assert.equal(
      await prisma.recognitionJob.count({ where: { ownerId: admin.id } }),
      beforeInvalid,
      'invalid ownership must roll back without attaching storage',
    );
    console.info(
      'Phase 21 fake-provider acceptance passed: dedupe, low confidence, unknown correction, partial failure, retry/idempotency, cancel, storage ownership rollback, confirmation diff, and pantry boundary.',
    );
  } finally {
    await cleanup(member.id);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
