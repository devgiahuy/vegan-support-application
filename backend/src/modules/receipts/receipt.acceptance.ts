import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient, ReceiptJobStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { loadConfig } from '../../config/env.js';
import { createReceiptExtractionProvider } from './receipt.provider.js';
import { ReceiptRepository } from './receipt.repository.js';
import { ReceiptService } from './receipt.service.js';

const prisma = new PrismaClient();
const config = loadConfig();
const repository = new ReceiptRepository(prisma);
const service = new ReceiptService(repository, createReceiptExtractionProvider(config), config);
const prefix = 'phase22-acceptance-';
const customMealId = '22000000-0000-4000-8000-000000000100';

async function cleanup(ownerId: string): Promise<void> {
  const jobs = await prisma.receiptJob.findMany({
    where: { ownerId, idempotencyKey: { startsWith: prefix } },
    include: { candidates: { select: { pantryItemId: true } } },
  });
  const jobIds = jobs.map((job) => job.id);
  const pantryIds = jobs.flatMap((job) => job.candidates.flatMap((candidate) => candidate.pantryItemId ? [candidate.pantryItemId] : []));
  await prisma.$transaction(async (transaction) => {
    if (jobIds.length) await transaction.receiptJob.deleteMany({ where: { id: { in: jobIds } } });
    if (pantryIds.length) {
      await transaction.pantryAdjustment.deleteMany({ where: { ownerId, pantryItemId: { in: pantryIds } } });
      await transaction.pantryItem.deleteMany({
        where: { id: { in: pantryIds }, ownerId, source: 'RECEIPT', sourceReferenceId: { in: jobIds } },
      });
    }
    await transaction.customMeal.deleteMany({ where: { id: customMealId, ownerId } });
  });
}

async function waitForTerminal(ownerId: string, id: string) {
  for (let index = 0; index < 50; index += 1) {
    const job = await repository.findOwnedJob(ownerId, id);
    assert(job);
    if (job.status !== ReceiptJobStatus.QUEUED && job.status !== ReceiptJobStatus.PROCESSING) return job;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Receipt job ${id} did not reach a terminal state`);
}

async function main(): Promise<void> {
  assert.equal(config.receipt.provider, 'fake', 'Phase 22 acceptance requires RECEIPT_PROVIDER=fake');
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
    assert.equal(await prisma.pantryItem.count({ where: { ownerId: owner.id, sourceReferenceId: ready.id } }), 0);
    const unknown = ready.candidates.find((candidate) => candidate.ingredientId === null);
    assert(unknown, 'fake receipt must include an unknown line');
    const edited = await service.updateCandidate(owner.id, ready.id, unknown.id, {
      expectedVersion: unknown.version,
      detectedName: 'unknown corrected greens',
      quantity: 3,
      unit: 'bunch',
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
    assert.equal(confirmationReplay.pantryChanges[0]?.pantryItem.id, confirmed.pantryChanges[0]?.pantryItem.id);

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
    const retryReplay = await service.retry(owner.id, partial.id, { idempotencyKey: `${prefix}retry` });
    assert.equal(retryReplay.attempt, retried.attemptCount);

    const cancellable = await service.create(owner.id, {
      imageAssetIds: ['22000000-0000-4000-8000-000000000001'],
      idempotencyKey: `${prefix}cancel`,
    });
    assert.equal((await service.cancel(owner.id, cancellable.id)).status, ReceiptJobStatus.CANCELLED);

    const beforeOwnership = await prisma.receiptJob.count({ where: { ownerId: admin.id } });
    await assert.rejects(
      () => service.create(admin.id, {
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
            { position: 0, ingredientId: tofu.id, displayName: 'Đậu hũ', normalizedName: 'dau hu', amount: 1, unit: 'miếng', resolutionStatus: 'EXACT' },
            { position: 1, ingredientId: tofu.id, displayName: 'Đậu hũ', normalizedName: 'dau hu', amount: 100, unit: 'g', resolutionStatus: 'EXACT' },
            { position: 2, displayName: 'Mystery item', normalizedName: 'mystery item', amount: 1, unit: 'bunch', resolutionStatus: 'UNKNOWN' },
          ],
        },
      },
    });
    const availableGrams = (await prisma.pantryItem.findMany({
      where: {
        ownerId: owner.id,
        ingredientId: tofu.id,
        confirmationStatus: 'CONFIRMED',
        deletedAt: null,
        quantity: { gt: 0 },
      },
      select: { normalizedGrams: true },
    })).reduce((total, item) => total + Number(item.normalizedGrams ?? 0), 0);
    assert(availableGrams > 0, 'seeded confirmed pantry must contain tofu');
    const insufficientServings = (availableGrams + 200) / 200;
    const insufficient = await service.shoppingGap(owner.id, {
      meals: [
        { sourceType: 'CUSTOM_MEAL', customMealId, servings: insufficientServings / 2 },
        { sourceType: 'CUSTOM_MEAL', customMealId, servings: insufficientServings / 2 },
      ],
    });
    const tofuGap = insufficient.items.find((item) => item.ingredient.id === tofu.id);
    assert(tofuGap);
    assert(Math.abs(tofuGap.required.value - (availableGrams + 200)) < 0.01, 'multiple meals and reviewed piece conversion must aggregate');
    assert(Math.abs(tofuGap.missing.value - 200) < 0.01, 'confirmed pantry must remain authoritative for the gap');
    assert(insufficient.unresolvedItems.some((item) => item.reasonCode === 'INGREDIENT_UNRESOLVED'));
    const extra = await service.shoppingGap(owner.id, {
      meals: [{ sourceType: 'CUSTOM_MEAL', customMealId, servings: availableGrams / 400 }],
    });
    const extraTofu = extra.items.find((item) => item.ingredient.id === tofu.id);
    assert(extraTofu && extraTofu.surplus.value > 0, 'current confirmed pantry must expose extra inventory');
    console.info('Phase 22 fake-provider acceptance passed: duplicate retry, unknown correction, partial extraction, confirmation boundary, ownership, multi-meal aggregation, reviewed conversion, unit mismatch, insufficient/extra pantry, and unresolved lines.');
  } finally {
    await cleanup(owner.id);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
