import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';

/** Preserve fixture decision IDs so re-seeding cannot emit new decision notifications. */
export async function upsertSeedContributorDecision(
  transaction: Prisma.TransactionClient,
  data: Prisma.ContributorDecisionUncheckedCreateInput & {
    applicationId: string;
    reason: string;
  },
): Promise<void> {
  const existing = await transaction.contributorDecision.findFirst({
    where: {
      applicationId: data.applicationId,
      decision: data.decision,
      reason: data.reason,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  const id = existing?.id ?? randomUUID();
  await transaction.contributorDecision.upsert({
    where: { id },
    update: data,
    create: { ...data, id },
  });
}
