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
  ContributorRevocationResponseDto,
  InviteContributorRequestDto,
  ReviewApplicationRequestDto,
  RevokeContributorRequestDto,
  SubmitApplicationRequestDto,
} from '../types/contributor.dto';
import type {
  ContributorApplication,
  ContributorRevocationResult,
  ReviewApplicationInput,
} from '../types/contributor.model';
import { ContributorApplicationStatus, ContributorApprovalBasis } from '@/common/enums';

export const APPROVAL_BASIS_LABELS: Record<ContributorApprovalBasis, string> = {
  [ContributorApprovalBasis.ORGANIZATION_AFFILIATION]: 'Tổ chức đối tác / Viện ẩm thực',
  [ContributorApprovalBasis.PLATFORM_TRACK_RECORD]: 'Thành viên uy tín trên nền tảng',
  [ContributorApprovalBasis.ADMIN_INVITED]: 'Được Quản trị viên mời',
};

export const STATUS_LABELS: Record<ContributorApplicationStatus, string> = {
  [ContributorApplicationStatus.PENDING]: 'Chờ duyệt',
  [ContributorApplicationStatus.APPROVED]: 'Đã duyệt',
  [ContributorApplicationStatus.REJECTED]: 'Bị từ chối',
  [ContributorApplicationStatus.WITHDRAWN]: 'Đã rút đơn',
};

export const SOURCE_LABELS: Record<string, string> = {
  REGISTRATION: 'Lúc đăng ký',
  PROFILE: 'Từ hồ sơ',
  ADMIN_INVITATION: 'Quản trị viên mời',
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
 * ContributorMapper: chuyển đổi DTO đơn xét duyệt, lịch sử và kết quả kiểm toán.
 * Tuân thủ chuẩn 7 tầng Scaffold, đọc trực tiếp envelope `{success, data, meta}`.
 */
export class ContributorMapper extends BaseMapper<
  ContributorApplicationDto,
  ContributorApplication
> {
  toModel(dto: ContributorApplicationDto | null | undefined): ContributorApplication {
    const rawClaimedBasis = pickField(
      dto,
      ['claimedApprovalBasis', 'claimed_approval_basis'],
      'PLATFORM_TRACK_RECORD'
    );
    const claimedApprovalBasis = safeEnum(
      rawClaimedBasis,
      ContributorApprovalBasis,
      ContributorApprovalBasis.PLATFORM_TRACK_RECORD
    );

    const status = safeEnum(
      pickField(dto, ['status'], 'PENDING'),
      ContributorApplicationStatus,
      ContributorApplicationStatus.PENDING
    );

    const rawApprovalBasis = pickField(dto, ['approvalBasis', 'approval_basis'], null);
    const approvalBasis =
      rawApprovalBasis === null || rawApprovalBasis === undefined
        ? null
        : safeEnum(
            rawApprovalBasis,
            ContributorApprovalBasis,
            null as unknown as ContributorApprovalBasis
          );

    const experience = safeString(pickField(dto, ['experience'], ''));
    const user = pickField(dto, ['user'], null) as ContributorApplicationDto['user'];
    const invitedBy = pickField(dto, ['invitedBy', 'invited_by'], null) as
      ContributorApplicationDto['invitedBy'] | null;

    const source = safeString(pickField(dto, ['source'], 'PROFILE'));
    const reapplyEligibleAt = safeDate(
      pickField(dto, ['reapplyEligibleAt', 'reapply_eligible_at'], null)
    );

    const isReapplyBlocked =
      status === ContributorApplicationStatus.REJECTED &&
      Boolean(reapplyEligibleAt && reapplyEligibleAt.getTime() > Date.now());

    return {
      id: safeString(pickField(dto, ['id'], '')),
      applicantId: safeString(pickField(user, ['id'], '')),
      applicantName: safeString(pickField(user, ['displayName', 'display_name'], '')),
      applicantEmail: safeString(pickField(user, ['email'], '')),
      currentRole: safeString(pickField(user, ['role'], 'MEMBER')),
      currentApprovalBasis: (() => {
        const raw = pickField(user, ['currentApprovalBasis', 'current_approval_basis'], null);
        return raw
          ? safeEnum(raw, ContributorApprovalBasis, null as unknown as ContributorApprovalBasis)
          : null;
      })(),

      claimedApprovalBasis,
      claimedApprovalBasisLabel:
        safeString(
          pickField(dto, ['claimedApprovalBasisLabel', 'claimed_approval_basis_label'], '')
        ) || APPROVAL_BASIS_LABELS[claimedApprovalBasis],
      organizationClaim:
        safeString(pickField(dto, ['organizationClaim', 'organization_claim'], '')) || null,
      experience,
      experienceShort: experience.length > 160 ? `${experience.slice(0, 160)}…` : experience,
      referenceLinks: safeArray<string | null, string>(
        pickField(dto, ['referenceLinks', 'reference_links'], null),
        (link) => safeString(link)
      ).filter((link) => link.length > 0),
      source,
      sourceLabel: SOURCE_LABELS[source.toUpperCase()] ?? source,

      invitedBy:
        invitedBy && typeof invitedBy === 'object' && safeString(invitedBy.id).length > 0
          ? {
              id: safeString(invitedBy.id),
              displayName: safeString(pickField(invitedBy, ['displayName', 'display_name'], '')),
            }
          : null,
      invitationReason:
        safeString(pickField(dto, ['invitationReason', 'invitation_reason'], '')) || null,

      status,
      statusLabel: STATUS_LABELS[status] ?? 'Chờ duyệt',
      approvalBasis: approvalBasis ?? null,
      approvalBasisLabel:
        safeString(pickField(dto, ['approvalBasisLabel', 'approval_basis_label'], '')) ||
        (approvalBasis ? APPROVAL_BASIS_LABELS[approvalBasis] : null),
      reviewEvidence:
        (pickField(dto, ['reviewEvidence', 'review_evidence'], null) as Record<
          string,
          unknown
        > | null) ?? null,
      reviewNote: safeString(pickField(dto, ['reviewNote', 'review_note'], '')) || null,
      reviewedBy: (() => {
        const reviewer = pickField(dto, ['reviewedBy', 'reviewed_by'], null) as
          ContributorApplicationDto['reviewedBy'] | null;
        if (!reviewer || typeof reviewer !== 'object') return null;
        return safeString(pickField(reviewer, ['displayName', 'display_name'], '')) || null;
      })(),
      reviewedAt: safeDate(pickField(dto, ['reviewedAt', 'reviewed_at'], null)),
      reapplyEligibleAt,
      isReapplyBlocked,

      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  /** `POST /api/v1/contributor-applications` → đơn PENDING. */
  toSingleApplication(
    dto: ContributorApplicationResponseDto | null | undefined
  ): ContributorApplication {
    const data = pickField(dto, ['data'], null) as ContributorApplicationDto | null;
    return this.toModel(data);
  }

  /** Own list + admin list kèm phân trang. */
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

  /** Chuyển đổi dữ liệu form nộp đơn sang DTO. */
  toSubmitDto(
    claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD',
    experience: string,
    organizationClaim?: string,
    referenceLinks?: string[]
  ): SubmitApplicationRequestDto {
    return {
      claimedApprovalBasis,
      experience,
      ...(organizationClaim?.trim() ? { organizationClaim: organizationClaim.trim() } : {}),
      ...(referenceLinks && referenceLinks.length > 0 ? { referenceLinks } : {}),
    };
  }

  /** Review oneOf: APPROVE kèm căn cứ + ghi chú / REJECT kèm ghi chú. */
  toReviewDto(input: ReviewApplicationInput): ReviewApplicationRequestDto {
    if (input.decision === 'APPROVE') {
      return {
        decision: 'APPROVE',
        approvalBasis: input.approvalBasis,
        reviewNote: input.reviewNote,
      };
    }
    return { decision: 'REJECT', reviewNote: input.reviewNote };
  }

  /** DTO gửi lời mời Contributor. */
  toInviteDto(userId: string, reason: string): InviteContributorRequestDto {
    return {
      userId,
      reason,
    };
  }

  /** DTO thu hồi tư cách Contributor. */
  toRevokeDto(reason: string): RevokeContributorRequestDto {
    return {
      reason,
    };
  }

  /** Chuyển đổi phản hồi thu hồi quyền sang UI Model. */
  toRevocationResult(
    dto: ContributorRevocationResponseDto | null | undefined
  ): ContributorRevocationResult {
    const data = pickField(dto, ['data'], null) as ContributorRevocationResponseDto['data'];
    const revokedBy = pickField(data, ['revokedBy', 'revoked_by'], null) as {
      displayName?: string;
      display_name?: string;
    } | null;

    return {
      userId: safeString(pickField(data, ['userId', 'user_id'], '')),
      role: safeString(pickField(data, ['role'], 'MEMBER')),
      revokedAt: safeDate(pickField(data, ['revokedAt', 'revoked_at'], null)),
      revokedByName: safeString(
        pickField(revokedBy, ['displayName', 'display_name'], 'Quản trị viên')
      ),
      reason: safeString(pickField(data, ['reason'], '')),
    };
  }
}

export const contributorMapper = new ContributorMapper();
