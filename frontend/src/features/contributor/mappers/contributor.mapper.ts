import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  ContributorApplicationDto,
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
  ReviewApplicationRequestDto,
  SubmitApplicationRequestDto,
} from '../types/contributor.dto';
import type { ContributorApplication, ReviewApplicationInput } from '../types/contributor.model';
import { ContributorApplicationStatus, ContributorType } from '@/common/enums';

const TYPE_LABELS: Record<ContributorType, string> = {
  [ContributorType.EXPERIENCED_PRACTITIONER]: 'Người ăn chay kinh nghiệm',
  [ContributorType.NUTRITION_EXPERT]: 'Chuyên gia dinh dưỡng',
};

const STATUS_LABELS: Record<ContributorApplicationStatus, string> = {
  [ContributorApplicationStatus.PENDING]: 'Chờ duyệt',
  [ContributorApplicationStatus.APPROVED]: 'Đã duyệt',
  [ContributorApplicationStatus.REJECTED]: 'Bị từ chối',
};

const SOURCE_LABELS: Record<string, string> = {
  REGISTRATION: 'Lúc đăng ký',
  PROFILE: 'Từ hồ sơ',
};

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

function toPageMeta(
  meta:
    | { page?: number; limit?: number; total?: number; totalPages?: number; total_pages?: number }
    | null
    | undefined,
  fallbackTotal: number
) {
  const page = safeNumber(pickField(meta, ['page'], 1));
  const limit = safeNumber(pickField(meta, ['limit'], 10));
  const totalItems = safeNumber(pickField(meta, ['total'], fallbackTotal));
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * ContributorMapper: đơn (own + admin), review oneOf.
 * Envelope `{success, data, meta}` đọc trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */
export class ContributorMapper extends BaseMapper<
  ContributorApplicationDto,
  ContributorApplication
> {
  toModel(dto: ContributorApplicationDto | null | undefined): ContributorApplication {
    const requestedType = safeEnum(
      pickField(dto, ['requestedType', 'requested_type'], 'EXPERIENCED_PRACTITIONER'),
      ContributorType,
      ContributorType.EXPERIENCED_PRACTITIONER
    );
    const status = safeEnum(
      pickField(dto, ['status'], 'PENDING'),
      ContributorApplicationStatus,
      ContributorApplicationStatus.PENDING
    );
    const approvedRaw = pickField(dto, ['approvedType', 'approved_type'], null) as string | null;
    const approvedType =
      approvedRaw === null || approvedRaw === undefined
        ? null
        : safeEnum(approvedRaw, ContributorType, null as unknown as ContributorType);
    const experience = safeString(pickField(dto, ['experience'], ''));
    const user = pickField(dto, ['user'], null) as ContributorApplicationDto['user'];
    return {
      id: safeString(pickField(dto, ['id'], '')),
      requestedType,
      requestedTypeLabel:
        safeString(pickField(dto, ['requestedTypeLabel'], '')) || TYPE_LABELS[requestedType],
      experience,
      experienceShort: experience.length > 160 ? `${experience.slice(0, 160)}…` : experience,
      referenceLinks: safeArray<string | null, string>(
        pickField(dto, ['referenceLinks', 'reference_links'], null),
        (link) => safeString(link)
      ).filter((link) => link.length > 0),
      source: safeString(pickField(dto, ['source'], '')),
      sourceLabel:
        SOURCE_LABELS[safeString(pickField(dto, ['source'], '')).toUpperCase()] ??
        safeString(pickField(dto, ['source'], '')),
      status,
      statusLabel: STATUS_LABELS[status],
      approvedType: approvedType ?? null,
      approvedTypeLabel:
        safeString(pickField(dto, ['approvedTypeLabel'], '')) ||
        (approvedType ? TYPE_LABELS[approvedType] : null),
      approvalBasis: safeString(pickField(dto, ['approvalBasis', 'approval_basis'], '')) || null,
      reviewNote: safeString(pickField(dto, ['reviewNote', 'review_note'], '')) || null,
      reviewedBy: (() => {
        const reviewer = pickField(dto, ['reviewedBy', 'reviewed_by'], null) as
          ContributorApplicationDto['reviewedBy'] | null;
        if (!reviewer || typeof reviewer !== 'object') return null;
        return safeString(reviewer.displayName) || null;
      })(),
      reviewedAt: safeDate(pickField(dto, ['reviewedAt', 'reviewed_at'], null)),
      reapplyEligibleAt: safeDate(
        pickField(dto, ['reapplyEligibleAt', 'reapply_eligible_at'], null)
      ),
      applicantId: safeString(pickField(user, ['id'], '')),
      applicantName: safeString(pickField(user, ['displayName', 'display_name'], '')),
      applicantEmail: safeString(pickField(user, ['email'], '')),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  /** `POST /contributor-applications` → đơn PENDING. */
  toSingleApplication(
    dto: ContributorApplicationResponseDto | null | undefined
  ): ContributorApplication {
    const data = pickField(dto, ['data'], null) as ContributorApplicationDto | null;
    return this.toModel(data);
  }

  /** Own list + admin list (kèm applicant) + meta. */
  toApplicationList(
    dto: ContributorApplicationListResponseDto | null | undefined
  ): PaginationResult<ContributorApplication> {
    const rawItems = pickField(dto, ['data'], null) as (ContributorApplicationDto | null)[] | null;
    const items = this.toModelList(
      safeArray<ContributorApplicationDto | null, ContributorApplicationDto | null>(
        rawItems,
        (item) => item
      )
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as ContributorApplicationListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  toSubmitDto(
    requestedType: ContributorType,
    experience: string,
    referenceLinks: string[]
  ): SubmitApplicationRequestDto {
    return {
      requestedType,
      experience,
      ...(referenceLinks.length > 0 ? { referenceLinks } : {}),
    };
  }

  /** Review oneOf: APPROVE đủ 4 / REJECT note. */
  toReviewDto(input: ReviewApplicationInput): ReviewApplicationRequestDto {
    if (input.decision === 'APPROVE') {
      return {
        decision: 'APPROVE',
        contributorType: input.contributorType,
        approvalBasis: input.approvalBasis,
        reviewNote: input.reviewNote,
      };
    }
    return { decision: 'REJECT', reviewNote: input.reviewNote };
  }
}

export const contributorMapper = new ContributorMapper();
