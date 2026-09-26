import 'dotenv/config';
import { MediaResourceType, PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { loadConfig } from '../../config/env.js';
import { CloudinaryMediaProvider } from './cloudinary.provider.js';
import { StorageRepository } from './storage.repository.js';

const prisma = new PrismaClient();
const repository = new StorageRepository(prisma);
const argumentsSet = new Set(process.argv.slice(2));
const action = process.argv[2] ?? 'reconcile';
const apply = argumentsSet.has('--apply');
const checkProvider = argumentsSet.has('--provider');

function json(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => (typeof item === 'bigint' ? item.toString() : item), 2);
}

async function cleanup(): Promise<void> {
  let expired = 0;
  let releasedBytes = 0n;
  for (;;) {
    const batch = await repository.cleanupExpired(500);
    expired += batch.expired;
    releasedBytes += batch.releasedBytes;
    if (batch.expired < 500) break;
  }
  console.info(json({ action: 'cleanup', expiredReservations: expired, releasedBytes }));
}

async function reconcile(): Promise<void> {
  if (apply) await cleanup();
  const snapshot = await repository.reconciliationSnapshot();
  const usedByUser = new Map<string, bigint>();
  const reservedByUser = new Map<string, bigint>();
  const now = new Date();
  for (const asset of snapshot.assets) {
    usedByUser.set(asset.ownerId, (usedByUser.get(asset.ownerId) ?? 0n) + asset.bytes);
  }
  for (const reservation of snapshot.reservations) {
    if (reservation.expiresAt > now) {
      reservedByUser.set(
        reservation.userId,
        (reservedByUser.get(reservation.userId) ?? 0n) + reservation.declaredBytes,
      );
    }
  }
  const counterDrift = snapshot.accounts.flatMap((account) => {
    const expectedUsedBytes = usedByUser.get(account.userId) ?? 0n;
    const expectedReservedBytes = reservedByUser.get(account.userId) ?? 0n;
    return account.usedBytes === expectedUsedBytes && account.reservedBytes === expectedReservedBytes
      ? []
      : [
          {
            userId: account.userId,
            storedUsedBytes: account.usedBytes,
            expectedUsedBytes,
            storedReservedBytes: account.reservedBytes,
            expectedReservedBytes,
          },
        ];
  });
  if (apply) {
    for (const drift of counterDrift) {
      await repository.applyCounterReconciliation(
        drift.userId,
        drift.expectedUsedBytes,
        drift.expectedReservedBytes,
      );
    }
  }

  const providerDrift: Array<Record<string, unknown>> = [];
  const providerOrphans: string[] = [];
  if (checkProvider) {
    const config = loadConfig();
    const provider = new CloudinaryMediaProvider(config);
    const providerAssets = [
      ...(await provider.listResources(MediaResourceType.IMAGE)),
      ...(await provider.listResources(MediaResourceType.VIDEO)),
    ];
    const providerByPublicId = new Map(providerAssets.map((asset) => [asset.publicId, asset]));
    const databasePublicIds = new Set(snapshot.assets.map((asset) => asset.publicId));
    for (const asset of snapshot.assets) {
      const actual = providerByPublicId.get(asset.publicId);
      if (!actual) {
        providerDrift.push({ assetId: asset.id, publicId: asset.publicId, issue: 'PROVIDER_MISSING' });
        if (apply) await repository.reconcileAssetMetadata(asset.id, null);
        continue;
      }
      if (
        asset.bytes !== BigInt(actual.bytes) ||
        asset.mimeType !== actual.mimeType ||
        asset.extension !== actual.extension ||
        asset.resourceType !== actual.resourceType
      ) {
        providerDrift.push({
          assetId: asset.id,
          publicId: asset.publicId,
          issue: 'METADATA_MISMATCH',
          databaseBytes: asset.bytes,
          providerBytes: actual.bytes,
        });
        if (apply) await repository.reconcileAssetMetadata(asset.id, actual);
      }
    }
    providerOrphans.push(
      ...providerAssets
        .filter((asset) => !databasePublicIds.has(asset.publicId))
        .map((asset) => asset.publicId),
    );
  }

  console.info(
    json({
      action: 'reconcile',
      mode: apply ? 'apply' : 'dry-run',
      providerChecked: checkProvider,
      expiredReservations: snapshot.reservations.filter((item) => item.expiresAt <= now).length,
      counterDrift,
      providerDrift,
      providerOrphans,
      backfilledAssetsPendingMetadata: snapshot.assets
        .filter((asset) => asset.backfilled && (asset.bytes === 0n || !asset.mimeType || !asset.extension))
        .map((asset) => ({ assetId: asset.id, publicId: asset.publicId })),
    }),
  );
}

try {
  if (action === 'cleanup') await cleanup();
  else if (action === 'reconcile') await reconcile();
  else throw new AppError({ statusCode: 400, code: 'INVALID_COMMAND', message: 'Use cleanup or reconcile' });
} finally {
  await prisma.$disconnect();
}
