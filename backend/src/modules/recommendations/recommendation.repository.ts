import {
  BehaviorEventType,
  PostRevisionStatus,
  PostStatus,
  PostType,
  type BehaviorEvent,
  type PersonalizationPreference,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';

export interface CreateBehaviorEventData {
  userId: string;
  type: BehaviorEventType;
  entityId?: string;
  idempotencyKey: string;
  dedupeKey?: string;
  payloadHash: string;
  consentVersion: string;
  metadata: Prisma.InputJsonValue;
  occurredAt: Date;
}

export interface RecommendationMetric {
  ratingAverage: number;
  ratingCount: number;
  voteCount: number;
  bookmarkCount: number;
}

export class RecommendationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getPreference(userId: string): Promise<PersonalizationPreference | null> {
    return this.prisma.personalizationPreference.findUnique({ where: { userId } });
  }

  setPreference(
    userId: string,
    enabled: boolean,
    consentVersion: string,
    now: Date,
  ): Promise<PersonalizationPreference> {
    return this.prisma.personalizationPreference.upsert({
      where: { userId },
      create: {
        userId,
        enabled,
        consentVersion,
        consentedAt: enabled ? now : null,
        disabledAt: enabled ? null : now,
      },
      update: {
        enabled,
        consentVersion,
        ...(enabled ? { consentedAt: now, disabledAt: null } : { disabledAt: now }),
      },
    });
  }

  createEvent(data: CreateBehaviorEventData): Promise<BehaviorEvent> {
    return this.prisma.behaviorEvent.create({ data });
  }

  findEventByIdempotency(userId: string, idempotencyKey: string): Promise<BehaviorEvent | null> {
    return this.prisma.behaviorEvent.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  findEventByDedupeKey(dedupeKey: string): Promise<BehaviorEvent | null> {
    return this.prisma.behaviorEvent.findUnique({ where: { dedupeKey } });
  }

  findEventsSince(userId: string, since: Date): Promise<BehaviorEvent[]> {
    return this.prisma.behaviorEvent.findMany({
      where: { userId, occurredAt: { gte: since } },
      orderBy: [{ occurredAt: 'desc' }, { id: 'asc' }],
    });
  }

  async deleteHistory(userId: string): Promise<number> {
    return (await this.prisma.behaviorEvent.deleteMany({ where: { userId } })).count;
  }

  findPublishedRecipe(id: string) {
    return this.prisma.post.findFirst({
      where: {
        id,
        type: PostType.RECIPE,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        publishedRevisionId: { not: null },
        publishedRevision: { is: { status: PostRevisionStatus.PUBLISHED } },
      },
      select: { id: true },
    });
  }

  hasBookmark(userId: string, postId: string): Promise<boolean> {
    return this.prisma.postBookmark
      .findUnique({ where: { userId_postId: { userId, postId } }, select: { postId: true } })
      .then(Boolean);
  }

  findRating(userId: string, postId: string) {
    return this.prisma.postRating.findFirst({
      where: { userId, postId, active: true },
      select: { taste: true, difficulty: true },
    });
  }

  async getMetrics(postIds: string[]): Promise<Map<string, RecommendationMetric>> {
    if (!postIds.length) return new Map();
    const [ratings, votes, bookmarks] = await Promise.all([
      this.prisma.postRating.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds }, active: true },
        _avg: { taste: true, difficulty: true },
        _count: { _all: true },
      }),
      this.prisma.postVote.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      }),
      this.prisma.postBookmark.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      }),
    ]);
    const metrics = new Map(
      postIds.map((id) => [
        id,
        { ratingAverage: 0, ratingCount: 0, voteCount: 0, bookmarkCount: 0 },
      ]),
    );
    for (const rating of ratings) {
      const metric = metrics.get(rating.postId);
      if (!metric) continue;
      metric.ratingAverage = ((rating._avg.taste ?? 0) + (rating._avg.difficulty ?? 0)) / 2;
      metric.ratingCount = rating._count._all;
    }
    for (const vote of votes) {
      const metric = metrics.get(vote.postId);
      if (metric) metric.voteCount = vote._count._all;
    }
    for (const bookmark of bookmarks) {
      const metric = metrics.get(bookmark.postId);
      if (metric) metric.bookmarkCount = bookmark._count._all;
    }
    return metrics;
  }

  isUniqueConstraintError(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
  }
}

export { BehaviorEventType };
