import { emitNotification } from './notification-events.js';
import { createPrismaClient } from '../../database/client.js';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import {
  AiArtifactType,
  AiVerificationConclusion,
  AiVerificationStatus,
  ContributorApprovalBasis,
  ContributorDecisionType,
  ModerationDecision,
  ModerationTargetType,
  PostRevisionStatus,
  PostType,
  ReportStatus,
  ReportTargetType,
  RestaurantSource,
  RestaurantStatus,
  Role,
} from '@prisma/client';
import { NotificationService } from './notification.service.js';

if (process.env.NODE_ENV === 'production') throw new Error('Acceptance check is local only');
const prisma = createPrismaClient();
const service = new NotificationService(prisma);
const ownerEmail = `phase25-${randomUUID()}@invalid.local`;
const otherEmail = `phase25-${randomUUID()}@invalid.local`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function emit(ownerId: string, sourceId: string): Promise<void> {
  await prisma.$transaction(async (tx) =>
    emitNotification(tx, ownerId, 'REPORT_RESOLVED', sourceId),
  );
}

async function main(): Promise<void> {
  const owner = await prisma.user.create({
    data: {
      email: ownerEmail,
      passwordHash: 'acceptance-only',
      displayName: 'Notification acceptance',
    },
  });
  const other = await prisma.user.create({
    data: { email: otherEmail, passwordHash: 'acceptance-only', displayName: 'Other acceptance' },
  });
  try {
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    await emit(owner.id, ids[0]!);
    await emit(owner.id, ids[0]!);
    await emit(owner.id, ids[1]!);
    await emit(owner.id, ids[2]!);
    const deduped = await prisma.notification.count({ where: { ownerId: owner.id } });
    assert(deduped === 3, 'Retry produced duplicate notification');
    const first = await service.list(owner.id, { page: 1, limit: 2, unreadOnly: 'false' });
    const second = await service.list(owner.id, { page: 2, limit: 2, unreadOnly: 'false' });
    assert(
      first.meta.total === 3 && first.data.length === 2 && second.data.length === 1,
      'Pagination failed',
    );
    assert(
      !first.data.some((item) => second.data.some((next) => next.id === item.id)),
      'Pages overlap',
    );
    assert(
      first.data.every((item) => Object.keys(item.payload as object).length === 1),
      'Payload allowlist failed',
    );
    assert((await service.unreadCount(owner.id)).count === 3, 'Unread count failed');
    const notificationId = first.data[0]!.id;
    let ownerRejected = false;
    try {
      await service.markRead(other.id, notificationId);
    } catch (error) {
      ownerRejected = error instanceof Error;
    }
    assert(ownerRejected, 'Cross-owner mark-read was allowed');
    await service.markRead(owner.id, notificationId);
    await service.markRead(owner.id, notificationId);
    assert((await service.unreadCount(owner.id)).count === 2, 'Idempotent mark-read failed');

    const raceSource = randomUUID();
    let release!: () => void;
    let inserted!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      inserted = resolve;
    });
    const pending = prisma.$transaction(
      async (tx) => {
        await emitNotification(tx, owner.id, 'REPORT_RESOLVED', raceSource);
        inserted();
        await gate;
      },
      { timeout: 10000 },
    );
    await started;
    const readAll = await service.markAllRead(owner.id);
    release();
    await pending;
    assert(
      readAll.updatedCount === 2,
      `Read-all updated an incorrect snapshot: ${readAll.updatedCount}`,
    );
    assert(
      (await service.unreadCount(owner.id)).count === 1,
      'Concurrent insert was incorrectly marked read',
    );

    const expired = await prisma.notification.create({
      data: {
        ownerId: owner.id,
        type: 'REPORT_RESOLVED',
        title: 'Expired acceptance row',
        dedupeKey: `acceptance-expired:${randomUUID()}`,
        payload: { sourceId: randomUUID() },
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    assert(
      (await service.list(owner.id, { page: 1, limit: 10, unreadOnly: 'false' })).meta.total === 4,
      'Expired row was listed',
    );
    const cleaned = await prisma.notification.deleteMany({
      where: { id: expired.id, expiresAt: { lte: new Date() } },
    });
    assert(cleaned.count === 1, 'Retention cleanup failed');

    const restaurantId = randomUUID();
    const policy = await prisma.storagePolicy.findFirst({ where: { active: true } });
    assert(policy, 'Seeded storage policy is required for acceptance');
    const marker = new Error('rollback fixture');
    try {
      await prisma.$transaction(async (tx) => {
        await tx.restaurant.create({
          data: {
            id: restaurantId,
            name: 'Acceptance place',
            normalizedName: 'acceptance place',
            address: 'Local acceptance address',
            normalizedAddress: 'local acceptance address',
            latitude: 10,
            longitude: 106,
            source: RestaurantSource.MEMBER,
            status: RestaurantStatus.PENDING,
            submitterId: owner.id,
          },
        });
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: { status: RestaurantStatus.APPROVED },
        });
        const event = await tx.notification.findUnique({
          where: { dedupeKey: `RESTAURANT_APPROVED:${restaurantId}` },
        });
        assert(event?.ownerId === owner.id, 'Restaurant decision trigger failed');
        const rejectedPlaceId = randomUUID();
        await tx.restaurant.create({
          data: {
            id: rejectedPlaceId,
            name: 'Rejected acceptance place',
            normalizedName: 'rejected acceptance place',
            address: 'Local acceptance address',
            normalizedAddress: 'local acceptance address',
            latitude: 10,
            longitude: 106,
            source: RestaurantSource.MEMBER,
            status: RestaurantStatus.PENDING,
            submitterId: owner.id,
          },
        });
        await tx.restaurant.update({
          where: { id: rejectedPlaceId },
          data: { status: RestaurantStatus.REJECTED },
        });
        assert(
          (
            await tx.notification.findUnique({
              where: { dedupeKey: `RESTAURANT_REJECTED:${rejectedPlaceId}` },
            })
          )?.ownerId === owner.id,
          'Restaurant rejection trigger failed',
        );

        for (const decisionType of [
          ContributorDecisionType.APPROVED,
          ContributorDecisionType.REJECTED,
          ContributorDecisionType.REVOKED,
        ]) {
          const decision = await tx.contributorDecision.create({
            data: {
              userId: owner.id,
              actorId: other.id,
              decision: decisionType,
              approvalBasis:
                decisionType === ContributorDecisionType.REJECTED
                  ? null
                  : ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
              ...(decisionType === ContributorDecisionType.REJECTED
                ? {}
                : { evidence: { privateClaim: 'Private contributor evidence' } }),
              reason: 'Private contributor reason',
            },
          });
          const contributorEvent = await tx.notification.findUnique({
            where: { dedupeKey: `CONTRIBUTOR_${decisionType}:${decision.id}` },
          });
          assert(
            contributorEvent?.ownerId === owner.id,
            `${decisionType} contributor trigger failed`,
          );
          assert(
            !JSON.stringify(contributorEvent).includes('Private'),
            'Contributor evidence leaked',
          );
        }

        const reportTarget = randomUUID();
        const report = await tx.report.create({
          data: {
            reporterId: owner.id,
            targetType: ReportTargetType.POST,
            targetId: reportTarget,
            reasonCode: 'OTHER',
            details: 'Private report details',
            activeKey: `${owner.id}:POST:${reportTarget}`,
          },
        });
        await tx.report.update({
          where: { id: report.id },
          data: {
            status: ReportStatus.RESOLVED,
            activeKey: null,
            resolvedDecision: ModerationDecision.NO_VIOLATION,
            resolvedReason: 'Private moderator reason',
            resolvedById: other.id,
            resolvedAt: new Date(),
          },
        });
        const reportEvent = await tx.notification.findUnique({
          where: { dedupeKey: `REPORT_RESOLVED:${report.id}` },
        });
        assert(reportEvent?.ownerId === owner.id, 'Report resolution trigger failed');
        assert(
          !JSON.stringify(reportEvent).includes('Private'),
          'Private report or contributor text leaked',
        );

        for (const postType of [PostType.RECIPE, PostType.BLOG, PostType.VIDEO]) {
          const post = await tx.post.create({
            data: { authorId: owner.id, type: postType, slug: `acceptance-${randomUUID()}` },
          });
          if (postType === PostType.RECIPE) {
            const moderation = await tx.moderationAction.create({
              data: {
                actorId: other.id,
                decision: ModerationDecision.HIDE,
                targetType: ModerationTargetType.POST,
                targetId: post.id,
                reason: 'Private moderation reason',
              },
            });
            const moderationEvent = await tx.notification.findUnique({
              where: { dedupeKey: `MODERATION_OUTCOME:${moderation.id}` },
            });
            assert(moderationEvent?.ownerId === owner.id, 'Moderation action trigger failed');
            assert(
              !JSON.stringify(moderationEvent).includes('Private'),
              'Moderation reason leaked',
            );
          }
          const revision = await tx.postRevision.create({
            data: {
              postId: post.id,
              version: 1,
              status: PostRevisionStatus.PENDING_REVIEW,
              title: 'Private draft title',
              normalizedTitle: 'private draft title',
              body: 'Private body',
              normalizedBody: 'private body',
              createdById: owner.id,
            },
          });
          await tx.postRevision.update({
            where: { id: revision.id },
            data: {
              status: PostRevisionStatus.PUBLISHED,
              reviewedAt: new Date(),
              reviewNote: 'Private review note',
            },
          });
          const eventType = postType === PostType.VIDEO ? 'VIDEO_APPROVED' : 'POST_APPROVED';
          const reviewEvent = await tx.notification.findUnique({
            where: { dedupeKey: `${eventType}:${post.id}:${revision.id}` },
          });
          assert(reviewEvent?.ownerId === owner.id, `${postType} review trigger failed`);
          const expectedLink =
            postType === PostType.BLOG
              ? `/articles/${post.id}`
              : postType === PostType.VIDEO
                ? `/videos/${post.id}`
                : `/recipes/${post.id}`;
          assert(reviewEvent.link === expectedLink, `${postType} navigation target failed`);
          assert(
            !JSON.stringify(reviewEvent).includes('Private'),
            'Private content or review text leaked',
          );
          const rejectedRevision = await tx.postRevision.create({
            data: {
              postId: post.id,
              version: 2,
              status: PostRevisionStatus.PENDING_REVIEW,
              title: 'Private draft title',
              normalizedTitle: 'private draft title',
              body: 'Private body',
              normalizedBody: 'private body',
              createdById: owner.id,
            },
          });
          await tx.postRevision.update({
            where: { id: rejectedRevision.id },
            data: {
              status: PostRevisionStatus.REJECTED,
              reviewedAt: new Date(),
              reviewNote: 'Private rejection reason',
            },
          });
          const rejectionType = postType === PostType.VIDEO ? 'VIDEO_REJECTED' : 'POST_REJECTED';
          const rejectionEvent = await tx.notification.findUnique({
            where: { dedupeKey: `${rejectionType}:${post.id}:${rejectedRevision.id}` },
          });
          assert(
            rejectionEvent?.ownerId === owner.id && rejectionEvent.link === null,
            `${postType} rejection trigger failed`,
          );
        }

        const artifact = await tx.aiArtifact.create({
          data: {
            ownerId: owner.id,
            type: AiArtifactType.CHAT_ANSWER,
            sourceId: randomUUID(),
            sourceVersion: 1,
            snapshot: { privatePrompt: 'Private AI prompt' },
            snapshotHash: '0'.repeat(64),
            title: 'Private AI title',
            summary: 'Private AI summary',
          },
        });
        const verification = await tx.aiVerification.create({
          data: {
            artifactId: artifact.id,
            artifactVersion: 1,
            reviewerId: other.id,
            reviewerRole: Role.ADMIN,
            conclusion: AiVerificationConclusion.VERIFIED,
            scope: 'Private scope',
            evidenceNote: 'Private evidence',
          },
        });
        await tx.aiVerification.update({
          where: { id: verification.id },
          data: { status: AiVerificationStatus.REVOKED, version: 2 },
        });
        const verificationEvents = await tx.notification.findMany({
          where: { ownerId: owner.id, type: { startsWith: 'AI_VERIFICATION_' } },
        });
        assert(verificationEvents.length === 2, 'AI verification lifecycle triggers failed');
        assert(
          !JSON.stringify(verificationEvents).includes('Private'),
          'AI prompt or evidence leaked',
        );

        await tx.storageAccount.create({ data: { userId: owner.id, policyId: policy.id } });
        const thresholdBytes = (policy.quotaBytes * BigInt(policy.warningPercent) + 99n) / 100n;
        await tx.storageAccount.update({
          where: { userId: owner.id },
          data: { reservedBytes: thresholdBytes },
        });
        const quotaEvent = await tx.notification.findFirst({
          where: { ownerId: owner.id, type: 'STORAGE_QUOTA_WARNING' },
        });
        assert(
          quotaEvent?.payload &&
            JSON.stringify(quotaEvent.payload) ===
              JSON.stringify({ thresholdPercent: policy.warningPercent }),
          'Quota warning threshold/payload failed',
        );
        throw marker;
      });
    } catch (error) {
      if (error !== marker) throw error;
    }
    assert(
      (await prisma.notification.count({
        where: { dedupeKey: `RESTAURANT_APPROVED:${restaurantId}` },
      })) === 0,
      'Rolled-back decision leaked a notification',
    );
    assert(
      (await prisma.notification.count({ where: { ownerId: owner.id } })) === 4,
      'Rolled-back domain events leaked notifications',
    );
    console.info(
      'Phase 25 acceptance passed: event triggers, dedupe, pagination, privacy, ownership, read, read-all race, retention and rollback',
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
