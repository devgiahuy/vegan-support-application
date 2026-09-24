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
import { ModerationPriority, PostType } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import type {
  AdminAiFlagDto,
  AdminContentReviewDecisionRequestDto,
  AdminContentReviewDetailDto,
  AdminContentReviewDetailResponseDto,
  ContentReviewHistoryItemDto,
  ContentReviewHistoryResponseDto,
  ReviewAuthorDto,
  ReviewCategoryDto,
  ReviewMediaDto,
  ReviewQueueItemDto,
  ReviewQueueListResponseDto,
  ReviewRecipeIngredientDto,
  ReviewRecipeInstructionDto,
} from '../types/content-review.dto';
import {
  AiFlagModel,
  AdminContentReviewDetailModel,
  ContentReviewHistoryModel,
  ContentReviewHistoryTimelineItem,
  ContentReviewQueueItem,
  PostReviewStatus,
  ReviewAuthorModel,
  ReviewCategoryModel,
  ReviewDecisionEnum,
  ReviewMediaModel,
  ReviewRecipeIngredientModel,
  ReviewRecipeInstructionModel,
  ReviewRecipeModel,
  ReviewVideoModel,
} from '../types/content-review.model';

// ==========================================
// Helper functions quy đổi nhãn tiếng Việt
// ==========================================

export function parsePostReviewStatus(raw?: string | null): PostReviewStatus {
  if (!raw) return PostReviewStatus.DRAFT;
  const upper = raw.toUpperCase();
  if (Object.values(PostReviewStatus).includes(upper as PostReviewStatus)) {
    return upper as PostReviewStatus;
  }
  return PostReviewStatus.DRAFT;
}

export function getPostReviewStatusLabel(status: PostReviewStatus): string {
  switch (status) {
    case PostReviewStatus.DRAFT:
      return 'Bản nháp riêng tư';
    case PostReviewStatus.PENDING_REVIEW:
      return 'Đang chờ duyệt';
    case PostReviewStatus.PUBLISHED:
      return 'Đã xuất bản';
    case PostReviewStatus.REJECTED:
      return 'Bị từ chối';
    case PostReviewStatus.FLAGGED:
      return 'Bị cảnh báo';
    case PostReviewStatus.QUARANTINED:
      return 'Tạm giữ kiểm dịch';
    case PostReviewStatus.HIDDEN:
      return 'Đang ẩn';
    case PostReviewStatus.DELETED:
      return 'Đã xóa';
    default:
      return 'Không xác định';
  }
}

export function parsePostType(raw?: string | null): PostType {
  if (!raw) return PostType.BLOG;
  const upper = raw.toUpperCase();
  if (Object.values(PostType).includes(upper as PostType)) {
    return upper as PostType;
  }
  return PostType.BLOG;
}

export function getPostTypeLabel(type: PostType): string {
  switch (type) {
    case PostType.RECIPE:
      return 'Công thức';
    case PostType.VIDEO:
      return 'Video nấu ăn';
    case PostType.BLOG:
    default:
      return 'Bài viết';
  }
}

export function parseModerationPriority(raw?: string | null): ModerationPriority {
  if (!raw) return ModerationPriority.LOW;
  const upper = raw.toUpperCase();
  if (upper === 'HIGH' || upper === 'URGENT') return ModerationPriority.HIGH;
  if (upper === 'MEDIUM') return ModerationPriority.MEDIUM;
  return ModerationPriority.LOW;
}

export function getModerationPriorityLabel(priority: ModerationPriority): string {
  switch (priority) {
    case ModerationPriority.URGENT:
    case ModerationPriority.HIGH:
      return 'Ưu tiên cao';
    case ModerationPriority.MEDIUM:
      return 'Trung bình';
    default:
      return 'Bình thường';
  }
}

export function formatVideoDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ==========================================
// Class Mapper chính cho Content Review
// ==========================================

export class ContentReviewMapper extends BaseMapper<
  ReviewQueueItemDto,
  ContentReviewQueueItem
> {
  toModel(dto: ReviewQueueItemDto | null | undefined): ContentReviewQueueItem {
    const postStatus = parsePostReviewStatus(
      safeString(pickField(dto, ['postStatus', 'status'], 'DRAFT'))
    );
    const revisionStatus = parsePostReviewStatus(
      safeString(pickField(dto, ['revisionStatus', 'status'], 'PENDING_REVIEW'))
    );
    const rawType = safeString(pickField(dto, ['type'], 'BLOG'));
    const type = parsePostType(rawType);
    const rawPriority = safeString(pickField(dto, ['priority'], 'LOW'));
    const priority = parseModerationPriority(rawPriority);

    const authorDto = pickField<ReviewAuthorDto | null>(dto, ['author'], null);
    const author: ReviewAuthorModel = {
      id: safeString(authorDto?.id, ''),
      displayName: safeString(authorDto?.displayName, 'Tác giả ẩn danh'),
      role: safeString(authorDto?.role, 'MEMBER'),
      contributorApprovalBasis: authorDto?.contributorApprovalBasis ?? null,
    };

    const rawFlags = safeArray<AdminAiFlagDto>(pickField(dto, ['aiFlags', 'ai_flags'], []));
    const aiFlags: AiFlagModel[] = rawFlags.map((flag) => ({
      id: safeString(flag?.id),
      provider: safeString(flag?.provider, 'AI'),
      model: safeString(flag?.model, 'v1'),
      reasonCodes: safeArray<string>(flag?.reasonCodes),
      riskScore: safeNumber(flag?.riskScore, 0),
      riskLevel: safeString(flag?.riskLevel, 'LOW'),
      status: safeString(flag?.status, 'ACTIVE'),
      createdAt: safeDate(flag?.createdAt),
    }));

    const submittedAt = safeDate(pickField(dto, ['submittedAt', 'submitted_at'], null));
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));
    const activeReporterCount = safeNumber(
      pickField(dto, ['activeReporterCount', 'active_reporter_count', 'reports'], 0)
    );

    return {
      postId: safeString(pickField(dto, ['postId', 'post_id', 'id'], '')),
      type,
      typeLabel: getPostTypeLabel(type),
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], 'Bản nháp chưa có tiêu đề')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')),
      postStatus,
      postStatusLabel: getPostReviewStatusLabel(postStatus),
      status: postStatus,
      statusLabel: getPostReviewStatusLabel(postStatus),
      revisionId: safeString(pickField(dto, ['revisionId', 'revision_id'], '')),
      revisionVersion: safeNumber(
        pickField(dto, ['revisionVersion', 'revision_version', 'version'], 1)
      ),
      revisionStatus,
      author,
      aiFlags,
      aiFlagsCount: aiFlags.length,
      hasAiFlags: aiFlags.length > 0,
      priority,
      priorityLabel: getModerationPriorityLabel(priority),
      isHighPriority: priority === ModerationPriority.HIGH,
      activeReporterCount,
      hasReports: activeReporterCount > 0,
      canDecide: safeBoolean(pickField(dto, ['canDecide', 'can_decide'], false)),
      submittedAt,
      formattedSubmittedAt: formatDate(submittedAt),
      createdAt,
      formattedCreatedAt: formatDate(createdAt),
    };
  }

  toQueuePagination(
    dto: ReviewQueueListResponseDto | null | undefined
  ): PaginationResult<ContentReviewQueueItem> {
    const items = this.toModelList(dto?.data);
    const meta = dto?.meta;
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 10),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }

  toDetailModel(
    dto: AdminContentReviewDetailDto | null | undefined
  ): AdminContentReviewDetailModel {
    const baseQueue = this.toModel(dto as ReviewQueueItemDto);

    const rawCategories = safeArray<ReviewCategoryDto>(dto?.categories);
    const categories: ReviewCategoryModel[] = rawCategories.map((c) => ({
      id: safeString(c?.id),
      name: safeString(c?.name),
      slug: safeString(c?.slug),
    }));

    const rawMedia = safeArray<ReviewMediaDto>(dto?.media);
    const media: ReviewMediaModel[] = rawMedia.map((m) => ({
      id: safeString(m?.id),
      url: safeString(m?.url),
      type: safeString(m?.type, 'IMAGE'),
      width: m?.width,
      height: m?.height,
      bytes: m?.bytes,
    }));

    let recipe: ReviewRecipeModel | undefined = undefined;
    if (dto?.recipe) {
      const rawIngredients = safeArray<ReviewRecipeIngredientDto>(
        dto.recipe.ingredients
      );
      const ingredients: ReviewRecipeIngredientModel[] = rawIngredients.map((i) => ({
        name: safeString(i?.name),
        amount: safeNumber(i?.amount, 0),
        unit: safeString(i?.unit),
        notes: i?.notes,
      }));

      const rawInstructions = safeArray<ReviewRecipeInstructionDto>(
        dto.recipe.instructions
      );
      const instructions: ReviewRecipeInstructionModel[] = rawInstructions.map(
        (inst) => ({
          stepNumber: safeNumber(inst?.stepNumber, 1),
          description: safeString(inst?.description),
          image: inst?.image,
        })
      );

      recipe = {
        prepTimeMinutes: safeNumber(dto.recipe.prepTimeMinutes, 0),
        cookTimeMinutes: safeNumber(dto.recipe.cookTimeMinutes, 0),
        servings: safeNumber(dto.recipe.servings, 1),
        difficulty: safeString(dto.recipe.difficulty, 'EASY'),
        ingredients,
        instructions,
      };
    }

    let video: ReviewVideoModel | undefined = undefined;
    if (dto?.video) {
      const source =
        safeString(dto.video.source, 'UPLOAD').toUpperCase() === 'YOUTUBE'
          ? 'YOUTUBE'
          : 'UPLOAD';
      const externalUrl = dto.video.externalUrl ?? null;
      const mediaAssetId = dto.video.mediaAssetId ?? null;
      const durationSeconds = dto.video.durationSeconds ?? null;

      // Tìm URL phát video từ media asset hoặc link external
      const videoMedia = media.find((m) => m.type.toUpperCase() === 'VIDEO');
      const videoPlayerUrl = externalUrl || videoMedia?.url || '';

      video = {
        source,
        externalUrl,
        durationSeconds,
        mediaAssetId,
        videoPlayerUrl,
        durationFormatted: formatVideoDuration(durationSeconds),
      };
    }

    const reviewedAt = safeDate(dto?.reviewedAt);

    return {
      ...baseQueue,
      body: safeString(dto?.body, ''),
      tags: safeArray<string>(dto?.tags),
      categories,
      media,
      reviewNote: dto?.reviewNote ?? null,
      reviewedBy: dto?.reviewedBy ?? null,
      reviewedAt,
      formattedReviewedAt: formatDate(reviewedAt),
      isPublishedRevision: safeBoolean(dto?.isPublishedRevision, false),
      recipe,
      video,
    };
  }

  toDetailResponse(
    response: AdminContentReviewDetailResponseDto | null | undefined
  ): AdminContentReviewDetailModel {
    return this.toDetailModel(response?.data);
  }

  toHistoryModel(
    response: ContentReviewHistoryResponseDto | null | undefined
  ): ContentReviewHistoryModel {
    const data = response?.data;
    const postStatus = parsePostReviewStatus(data?.postStatus);
    const type = parsePostType(data?.type);
    const publishedRevisionId = data?.publishedRevisionId ?? null;

    const rawRevisions = safeArray<ContentReviewHistoryItemDto>(data?.revisions);
    const revisions: ContentReviewHistoryTimelineItem[] = rawRevisions.map((rev) => {
      const status = parsePostReviewStatus(rev?.revisionStatus);
      const submittedAt = safeDate(rev?.submittedAt);
      const reviewedAt = safeDate(rev?.reviewedAt);
      const revisionId = safeString(rev?.revisionId);

      return {
        revisionId,
        revisionVersion: safeNumber(rev?.revisionVersion, 1),
        status,
        statusLabel: getPostReviewStatusLabel(status),
        submittedAt,
        formattedSubmittedAt: formatDate(submittedAt),
        reviewedAt,
        formattedReviewedAt: formatDate(reviewedAt),
        reviewedBy: rev?.reviewedBy ?? null,
        reviewNote: rev?.reviewNote ?? null,
        isCurrentPublished: publishedRevisionId !== null && revisionId === publishedRevisionId,
      };
    });

    const pendingRev = revisions.find(
      (r) => r.status === PostReviewStatus.PENDING_REVIEW
    );

    return {
      postId: safeString(data?.postId),
      type,
      postStatus,
      postStatusLabel: getPostReviewStatusLabel(postStatus),
      version: safeNumber(data?.version, 1),
      publishedRevisionId,
      revisions,
      hasPendingRevision: Boolean(pendingRev),
      pendingRevisionVersion: pendingRev ? pendingRev.revisionVersion : null,
    };
  }

  toDecisionDto(
    decision: ReviewDecisionEnum,
    reason: string
  ): AdminContentReviewDecisionRequestDto {
    return {
      decision: decision === ReviewDecisionEnum.APPROVE ? 'APPROVE' : 'REJECT',
      reason: reason.trim(),
    };
  }
}

export const contentReviewMapper = new ContentReviewMapper();
