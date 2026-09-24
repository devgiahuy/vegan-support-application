import {
  BaseMapper,
  pickField,
  safeString,
  safeDate,
  safeNumber,
  safeBoolean,
  safeArray,
} from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { ModerationPriority, PostType, ReviewItemStatus } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import type {
  AiFlagDto,
  ReviewAuthorDto,
  ReviewQueueItemDto,
  ReviewDecisionRequestDto,
} from '../types/review.dto';
import type { AiFlag, ReviewQueueItem } from '../types/review.model';

export function getReviewStatusLabel(status: ReviewItemStatus): string {
  switch (status) {
    case ReviewItemStatus.FLAGGED:
      return 'Cờ cảnh báo';
    case ReviewItemStatus.QUARANTINED:
      return 'Tạm giữ';
    default:
      return 'Chờ duyệt';
  }
}

export function parseReviewStatus(raw: string): ReviewItemStatus {
  return (
    Object.values(ReviewItemStatus).includes(raw as ReviewItemStatus)
      ? raw
      : ReviewItemStatus.PENDING_REVIEW
  ) as ReviewItemStatus;
}

export function getPriorityLabel(priority: ModerationPriority): string {
  switch (priority) {
    case ModerationPriority.URGENT:
      return 'Khẩn cấp';
    case ModerationPriority.HIGH:
      return 'Cao';
    case ModerationPriority.MEDIUM:
      return 'Trung bình';
    default:
      return 'Thấp';
  }
}

export function parsePriority(raw: string): ModerationPriority {
  return (
    Object.values(ModerationPriority).includes(raw as ModerationPriority)
      ? raw
      : ModerationPriority.LOW
  ) as ModerationPriority;
}

function parsePostType(raw: string): PostType {
  return (Object.values(PostType).includes(raw as PostType) ? raw : PostType.BLOG) as PostType;
}

export class ReviewMapper extends BaseMapper<ReviewQueueItemDto, ReviewQueueItem> {
  toModel(dto: ReviewQueueItemDto | null | undefined): ReviewQueueItem {
    const status = parseReviewStatus(
      safeString(pickField(dto, ['postStatus', 'status', 'revisionStatus'], 'PENDING_REVIEW'))
    );
    const priority = parsePriority(safeString(pickField(dto, ['priority'], 'LOW')));
    const author = pickField<ReviewAuthorDto | null>(dto, ['author'], null);
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));

    const rawFlags = safeArray<AiFlagDto>(pickField(dto, ['aiFlags', 'ai_flags'], []));
    const aiFlags: AiFlag[] = rawFlags.map((flag) => ({
      id: safeString(flag?.id),
      reasonCodes: safeArray<string>(flag?.reasonCodes),
      riskScore: safeNumber(flag?.riskScore, 0),
      riskLevel: safeString(flag?.riskLevel),
    }));

    return {
      postId: safeString(pickField(dto, ['postId', 'post_id', 'id'], '')),
      type: parsePostType(safeString(pickField(dto, ['type'], 'BLOG'))),
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], 'Bài viết chưa có tiêu đề')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')),
      status,
      statusLabel: getReviewStatusLabel(status),
      revisionVersion: safeNumber(
        pickField(dto, ['revisionVersion', 'revision_version', 'version'], 1)
      ),
      author: {
        id: safeString(author?.id),
        name: safeString(author?.displayName, 'Tác giả ẩn danh'),
      },
      aiFlags,
      priority,
      priorityLabel: getPriorityLabel(priority),
      activeReporterCount: safeNumber(
        pickField(dto, ['activeReporterCount', 'active_reporter_count', 'reports'], 0)
      ),
      canDecide: safeBoolean(pickField(dto, ['canDecide', 'can_decide'], false)),
      createdAt,
      formattedCreatedAt: formatDate(createdAt),
    };
  }

  toPaginationFromEnvelope(
    data: (ReviewQueueItemDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): PaginationResult<ReviewQueueItem> {
    const items = this.toModelList(data);
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }

  toDecisionDto(reason: string): ReviewDecisionRequestDto {
    return { reason: reason.trim() };
  }
}

export const reviewMapper = new ReviewMapper();
export { contentReviewMapper } from './content-review.mapper';
