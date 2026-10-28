import { PostType } from '@/common/enums';
import { resolveMediaUrl } from '@/lib/env';
import { pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { getPostStatusLabel, parsePostStatus } from '@/features/post/mappers/post-shared';
import type {
  ContentReviewAiFlagDto,
  ContentReviewDecisionRequestDto,
  ContentReviewDetailDto,
  ContentReviewDetailResponseDto,
  ContentReviewQueueItemDto,
  ContentReviewQueueResponseDto,
} from '../types/content-review.dto';
import type {
  ContentReviewAiFlag,
  ContentReviewDecision,
  ContentReviewDetail,
  ContentReviewMedia,
  ContentReviewPriority,
  ContentReviewQueueItem,
  ContentReviewQueuePage,
} from '../types/content-review.model';

const TYPE_LABELS: Record<PostType, string> = {
  [PostType.RECIPE]: 'Công thức',
  [PostType.BLOG]: 'Cẩm nang',
  [PostType.VIDEO]: 'Video',
};

const ROLE_LABELS: Record<string, string> = {
  CONTRIBUTOR: 'Người đóng góp',
  ADMIN: 'Quản trị viên',
};

const RISK_LABELS: Record<string, string> = {
  LOW: 'Rủi ro thấp',
  MEDIUM: 'Rủi ro trung bình',
  HIGH: 'Rủi ro cao',
};

function toType(value: unknown): PostType {
  const raw = safeString(value).toUpperCase();
  return raw === PostType.RECIPE || raw === PostType.VIDEO ? raw : PostType.BLOG;
}

function toPriority(value: unknown): ContentReviewPriority {
  return safeString(value).toUpperCase() === 'HIGH' ? 'HIGH' : 'NORMAL';
}

function formatDateTime(value: unknown): string {
  const date = safeDate(value);
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${formatDate(date)}`;
}

function toAiFlag(dto: ContentReviewAiFlagDto | null | undefined): ContentReviewAiFlag {
  const level = safeString(pickField(dto, ['riskLevel'], '')).toUpperCase();
  return {
    id: safeString(pickField(dto, ['id'], '')),
    provider: safeString(pickField(dto, ['provider'], '')),
    model: safeString(pickField(dto, ['model'], '')),
    reasonCodes: safeArray<string | null, string>(pickField(dto, ['reasonCodes'], null), (code) => safeString(code)).filter(
      (code) => code.length > 0
    ),
    riskLevelLabel: RISK_LABELS[level] ?? 'Tín hiệu kiểm duyệt',
    isOpen: safeString(pickField(dto, ['status'], '')).toUpperCase() === 'OPEN',
  };
}

export const contentReviewMapper = {
  toQueueItem(dto: ContentReviewQueueItemDto | null | undefined): ContentReviewQueueItem {
    const type = toType(pickField(dto, ['type'], 'BLOG'));
    const status = parsePostStatus(safeString(pickField(dto, ['postStatus'], 'PENDING_REVIEW')));
    const priority = toPriority(pickField(dto, ['priority'], 'NORMAL'));
    const author = pickField(dto, ['author'], null);
    const role = safeString(pickField(author, ['role'], 'MEMBER')).toUpperCase();
    return {
      postId: safeString(pickField(dto, ['postId'], '')),
      revisionId: safeString(pickField(dto, ['revisionId'], '')),
      revisionVersion: safeNumber(pickField(dto, ['revisionVersion'], 1), 1),
      type,
      typeLabel: TYPE_LABELS[type],
      title: safeString(pickField(dto, ['title'], 'Bản nộp chưa có tiêu đề')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')),
      authorId: safeString(pickField(author, ['id'], '')),
      authorName: safeString(pickField(author, ['displayName'], 'Tác giả')),
      authorRoleLabel: ROLE_LABELS[role] ?? null,
      postStatus: status,
      postStatusLabel: getPostStatusLabel(status),
      priority,
      priorityLabel: priority === 'HIGH' ? 'Ưu tiên cao' : 'Bình thường',
      isHighPriority: priority === 'HIGH',
      aiFlagCount: safeArray<ContentReviewAiFlagDto | null>(pickField(dto, ['aiFlags'], null)).length,
      reportCount: Math.max(0, safeNumber(pickField(dto, ['activeReporterCount'], 0), 0)),
      canDecide: safeBoolean(pickField(dto, ['canDecide'], false), false),
      formattedSubmittedAt: formatDateTime(pickField(dto, ['submittedAt'], null)),
      formattedCreatedAt: formatDate(safeDate(pickField(dto, ['createdAt'], null))),
    };
  },

  toQueuePage(dto: ContentReviewQueueResponseDto | null | undefined): ContentReviewQueuePage {
    const items = safeArray<ContentReviewQueueItemDto | null, ContentReviewQueueItem>(pickField(dto, ['data'], null), (item) =>
      contentReviewMapper.toQueueItem(item)
    ).filter((item) => item.revisionId.length > 0);
    const meta = pickField(dto, ['meta'], null);
    return {
      items,
      page: Math.max(1, safeNumber(pickField(meta, ['page'], 1), 1)),
      totalPages: Math.max(1, safeNumber(pickField(meta, ['totalPages'], 1), 1)),
      totalItems: safeNumber(pickField(meta, ['total'], items.length), items.length),
    };
  },

  toDetail(dto: ContentReviewDetailResponseDto | null | undefined): ContentReviewDetail {
    const data = pickField<ContentReviewDetailDto | null>(dto, ['data'], null);
    const media = safeArray<NonNullable<ContentReviewDetailDto['media']>[number], ContentReviewMedia>(
      pickField(data, ['media'], null),
      (item) => ({
        id: safeString(pickField(item, ['id'], '')),
        kind: safeString(pickField(item, ['kind'], '')).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'COVER_IMAGE',
        url: resolveMediaUrl(safeString(pickField(item, ['secureUrl'], ''))),
      })
    ).filter((item) => item.url.length > 0);
    const reviewer = pickField(data, ['reviewedBy'], null);
    const reviewedAt = formatDateTime(pickField(data, ['reviewedAt'], null));
    const note = safeString(pickField(data, ['reviewNote'], ''));
    return {
      ...contentReviewMapper.toQueueItem(data),
      body: safeString(pickField(data, ['body'], '')),
      tags: safeArray<string | null, string>(pickField(data, ['tags'], null), (tag) => safeString(tag)).filter((tag) => tag.length > 0),
      categories: safeArray<{ name?: string } | null, string>(pickField(data, ['categories'], null), (category) =>
        safeString(pickField(category, ['name'], ''))
      ).filter((name) => name.length > 0),
      coverUrl: media.find((item) => item.kind === 'COVER_IMAGE')?.url ?? null,
      videoUrl: media.find((item) => item.kind === 'VIDEO')?.url ?? null,
      aiFlags: safeArray<ContentReviewAiFlagDto | null, ContentReviewAiFlag>(pickField(data, ['aiFlags'], null), toAiFlag),
      reviewNote: note.length > 0 ? note : null,
      reviewerName: safeString(pickField(reviewer, ['displayName'], '')) || null,
      formattedReviewedAt: reviewedAt || null,
      isPublishedRevision: safeBoolean(pickField(data, ['isPublishedRevision'], false), false),
    };
  },

  /** Backend bắt buộc lý do 10–2000 ký tự cho cả duyệt lẫn từ chối. */
  toDecisionDto(decision: ContentReviewDecision, reason: string): ContentReviewDecisionRequestDto {
    return { decision, reason: reason.trim() };
  },
};
