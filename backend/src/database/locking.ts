import { Prisma } from '@prisma/client';

type LockModel =
  | 'contributorApplication'
  | 'user'
  | 'post'
  | 'postRevision'
  | 'comment'
  | 'report'
  | 'mealPlan'
  | 'mealProgram'
  | 'chatSession'
  | 'storageAccount'
  | 'mediaAsset'
  | 'aiArtifact'
  | 'aiVerification';

/** A write to the shared document forces MongoDB to detect concurrent transactions.
 * The transaction client retries the whole operation against a fresh snapshot.
 */
export async function lockDocument(
  transaction: Prisma.TransactionClient,
  model: LockModel,
  where: { id: string } | { userId: string },
): Promise<boolean> {
  const metadata = Prisma.dmmf.datamodel.models.find(
    (item) => item.name[0]!.toLowerCase() + item.name.slice(1) === model,
  )!;
  const delegate = transaction[model] as unknown as {
    findUnique(args: { where: typeof where }): Promise<Record<string, unknown> | null>;
    updateMany(args: {
      where: typeof where;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
  const current = await delegate.findUnique({ where });
  if (!current) return false;
  const timestamps = Object.fromEntries(
    metadata.fields
      .filter((field) => field.isUpdatedAt)
      .map((field) => [field.name, current[field.name]]),
  );
  return (
    (
      await delegate.updateMany({
        where,
        data: {
          [model === 'mealPlan' ? 'transactionVersion' : 'lockVersion']: { increment: 1 },
          ...timestamps,
        },
      })
    ).count === 1
  );
}
