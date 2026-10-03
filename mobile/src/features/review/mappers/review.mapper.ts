import { PostStatus } from '@/common/enums';
import { getPostStatusLabel, parsePostStatus } from '@/features/post/mappers/post-shared';
import { pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  ReviewHistoryEntryDto,
  ReviewHistoryResponseDto,
  ReviewModerationSignalDto,
} from '../types/review.dto';
import type { ModerationSignal, ReviewHistory, ReviewRevision } from '../types/review.model';

const RISK_LABELS: Record<string, string> = {
  LOW: 'Rủi ro thấp',
  MEDIUM: 'Rủi ro trung bình',
  HIGH: 'Rủi ro cao',
};

function formatDateTime(date: Date | null): string | null {
  if (!date) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function toSignal(dto: ReviewModerationSignalDto | null | undefined): ModerationSignal {
  const level = safeString(pickField(dto, ['riskLevel'], '')).toUpperCase();
  return {
    id: safeString(pickField(dto, ['id'], '')),
    riskLevelLabel: RISK_LABELS[level] ?? 'Tín hiệu kiểm duyệt',
    reasonCodes: safeArray<string | null, string>(pickField(dto, ['reasonCodes'], null), (code) => safeString(code)).filter(
      (code) => code.length > 0
    ),
    isOpen: safeString(pickField(dto, ['status'], '')).toUpperCase() === 'OPEN',
  };
}

/** Chuyển lịch sử duyệt backend sang model hiển thị cho tác giả. */
export const reviewMapper = {
  toRevision(entry: ReviewHistoryEntryDto | null | undefined): ReviewRevision {
    const revision = pickField(entry, ['revision'], null);
    const reviewer = pickField(entry, ['reviewedBy'], null);
    const status: PostStatus = parsePostStatus(safeString(pickField(revision, ['status'], 'DRAFT')));
    return {
      id: safeString(pickField(revision, ['id'], '')),
      version: safeNumber(pickField(revision, ['version'], 1)),
      status,
      statusLabel: getPostStatusLabel(status),
      title: safeString(pickField(revision, ['title'], '')) || 'Bản chỉnh sửa',
      reviewNote: safeString(pickField(revision, ['reviewNote'], '')) || null,
      reviewerName: safeString(pickField(reviewer, ['displayName'], '')) || null,
      formattedSubmittedAt: formatDateTime(safeDate(pickField(revision, ['submittedAt'], null))),
      formattedReviewedAt: formatDateTime(safeDate(pickField(revision, ['reviewedAt'], null))),
      formattedCreatedAt: formatDateTime(safeDate(pickField(revision, ['createdAt'], null))) ?? '',
      isPublishedRevision: safeBoolean(pickField(entry, ['isPublishedRevision'], false)),
      signals: safeArray<ReviewModerationSignalDto | null, ModerationSignal>(
        pickField(entry, ['moderationSignals'], null),
        (signal) => toSignal(signal)
      ),
    };
  },

  toHistory(dto: ReviewHistoryResponseDto | null | undefined): ReviewHistory {
    const data = pickField(dto, ['data'], null);
    const revisions = safeArray<ReviewHistoryEntryDto | null, ReviewRevision>(
      pickField(data, ['revisions'], null),
      (entry) => reviewMapper.toRevision(entry)
    ).filter((revision) => revision.id.length > 0);
    const meta = pickField(dto, ['meta'], null);
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      postStatusLabel: getPostStatusLabel(parsePostStatus(safeString(pickField(data, ['postStatus'], 'DRAFT')))),
      revisions,
      total: safeNumber(pickField(meta, ['total'], revisions.length), revisions.length),
    };
  },
};
