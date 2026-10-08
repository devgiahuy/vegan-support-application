import type { Prisma } from '@prisma/client';

const titles: Record<string, string> = {
  POST_APPROVED: 'Bài viết đã được duyệt',
  POST_REJECTED: 'Bài viết chưa được duyệt',
  VIDEO_APPROVED: 'Video đã được duyệt',
  VIDEO_REJECTED: 'Video chưa được duyệt',
  CONTRIBUTOR_APPROVED: 'Đơn Contributor đã được duyệt',
  CONTRIBUTOR_REJECTED: 'Đơn Contributor chưa được duyệt',
  CONTRIBUTOR_REVOKED: 'Quyền Contributor đã bị thu hồi',
  REPORT_RESOLVED: 'Báo cáo của bạn đã được xử lý',
  MODERATION_OUTCOME: 'Tài khoản hoặc nội dung của bạn đã được xử lý',
  AI_VERIFICATION_CREATED: 'Nội dung AI của bạn có đánh giá mới',
  AI_VERIFICATION_CHANGED: 'Đánh giá nội dung AI đã thay đổi',
  RESTAURANT_APPROVED: 'Địa điểm bạn gửi đã được duyệt',
  RESTAURANT_REJECTED: 'Địa điểm bạn gửi chưa được duyệt',
  STORAGE_QUOTA_WARNING: 'Dung lượng lưu trữ sắp đạt giới hạn',
};

export async function emitNotification(
  transaction: Prisma.TransactionClient,
  ownerId: string | null,
  type: string,
  sourceId: string,
  variant?: string,
  link: string | null = null,
): Promise<void> {
  if (!ownerId) return;
  const title = titles[type];
  if (!title) throw new Error(`Unsupported notification event: ${type}`);
  const now = new Date();
  let dedupeKey = `${type}:${sourceId}${variant === undefined ? '' : `:${variant}`}`;
  let payload: Prisma.InputJsonObject = { sourceId };
  let summary: string | null = null;
  if (type === 'STORAGE_QUOTA_WARNING') {
    const thresholdPercent = Number(variant);
    if (!Number.isInteger(thresholdPercent) || thresholdPercent < 1 || thresholdPercent > 100)
      throw new Error('Invalid quota threshold');
    payload = { thresholdPercent };
    summary = `Mức sử dụng đã đạt ${thresholdPercent}% hạn mức.`;
    dedupeKey += `:${now.toISOString().slice(0, 7)}`;
  }
  await transaction.notification.upsert({
    where: { dedupeKey },
    update: {},
    create: {
      ownerId,
      type,
      title,
      summary,
      link,
      payload,
      dedupeKey,
      expiresAt: new Date(now.getTime() + 90 * 86_400_000),
    },
  });
}

type Row = Record<string, unknown>;
const text = (row: Row, key: string) => (typeof row[key] === 'string' ? row[key] : null);

/** Runs on the same transaction client as the domain mutation; no event can escape rollback. */
export async function dispatchNotifications(
  tx: Prisma.TransactionClient,
  model: string,
  previous: Row | null,
  row: Row,
): Promise<void> {
  const id = text(row, 'id') ?? text(row, 'userId');
  if (!id) return;
  const statusChanged = previous && previous.status !== row.status;
  if (
    model === 'PostRevision' &&
    statusChanged &&
    row.reviewedAt &&
    ['PUBLISHED', 'REJECTED'].includes(String(row.status))
  ) {
    const post = await tx.post.findUniqueOrThrow({ where: { id: String(row.postId) } });
    const type = `${post.type === 'VIDEO' ? 'VIDEO' : 'POST'}_${row.status === 'PUBLISHED' ? 'APPROVED' : 'REJECTED'}`;
    const link =
      row.status === 'PUBLISHED'
        ? `/${post.type === 'VIDEO' ? 'videos' : post.type === 'BLOG' ? 'articles' : 'recipes'}/${post.id}`
        : null;
    await emitNotification(tx, post.authorId, type, post.id, id, link);
  } else if (model === 'ContributorDecision' && !previous) {
    await emitNotification(tx, text(row, 'userId'), `CONTRIBUTOR_${String(row.decision)}`, id);
  } else if (model === 'Report' && previous?.status === 'OPEN' && row.status === 'RESOLVED') {
    await emitNotification(tx, text(row, 'reporterId'), 'REPORT_RESOLVED', id);
  } else if (model === 'AiVerification' && (!previous || statusChanged)) {
    const artifact = await tx.aiArtifact.findUniqueOrThrow({
      where: { id: String(row.artifactId) },
    });
    await emitNotification(
      tx,
      artifact.ownerId,
      previous ? 'AI_VERIFICATION_CHANGED' : 'AI_VERIFICATION_CREATED',
      id,
      previous ? String(row.version) : undefined,
    );
  } else if (
    model === 'Restaurant' &&
    previous?.status === 'PENDING' &&
    ['APPROVED', 'REJECTED'].includes(String(row.status))
  ) {
    await emitNotification(
      tx,
      text(row, 'submitterId'),
      `RESTAURANT_${String(row.status)}`,
      id,
      undefined,
      row.status === 'APPROVED' ? `/restaurants/${id}` : null,
    );
  } else if (
    model === 'ModerationAction' &&
    !previous &&
    !['APPROVE', 'REJECT', 'NO_VIOLATION'].includes(String(row.decision))
  ) {
    const targetId = String(row.targetId);
    const owner =
      row.targetType === 'USER'
        ? targetId
        : row.targetType === 'POST'
          ? (await tx.post.findUnique({ where: { id: targetId } }))?.authorId
          : row.targetType === 'COMMENT'
            ? (await tx.comment.findUnique({ where: { id: targetId } }))?.authorId
            : null;
    await emitNotification(tx, owner ?? null, 'MODERATION_OUTCOME', id);
  } else if (model === 'StorageAccount') {
    const policy = await tx.storagePolicy.findUniqueOrThrow({
      where: { id: String(row.policyId) },
    });
    const quota = policy.quotaBytes + BigInt(String(row.quotaAdjustmentBytes));
    if (quota <= 0n) return;
    const before = previous
      ? BigInt(String(previous.usedBytes)) + BigInt(String(previous.reservedBytes))
      : 0n;
    const after = BigInt(String(row.usedBytes)) + BigInt(String(row.reservedBytes));
    for (const threshold of new Set([policy.warningPercent, 95, 100])) {
      if (before * 100n < quota * BigInt(threshold) && after * 100n >= quota * BigInt(threshold))
        await emitNotification(
          tx,
          text(row, 'userId'),
          'STORAGE_QUOTA_WARNING',
          id,
          String(threshold),
        );
    }
  }
}
