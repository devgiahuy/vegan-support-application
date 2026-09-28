import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import { ContributorApplicationStatus, ContributorApprovalBasis } from '@/common/enums';
import type { PaginationResult } from '@/types/api';
import type {
  ContributorApplicationItemDto,
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
  ContributorReviewerDto,
} from '../types/contributor.dto';
import type { ContributorApplicationDetail, ContributorReviewer } from '../types/contributor.model';

function toReviewer(dto: ContributorReviewerDto | null | undefined): ContributorReviewer | null {
  if (!dto || typeof dto !== 'object') return null;
  const id = safeString(pickField(dto, ['id'], ''));
  if (!id) return null;
  return { id, displayName: safeString(pickField(dto, ['displayName'], 'Người dùng')) };
}

export class ContributorMapper extends BaseMapper<ContributorApplicationItemDto, ContributorApplicationDetail> {
  toModel(dto: ContributorApplicationItemDto | null | undefined): ContributorApplicationDetail {
    const rawStatus = safeString(pickField(dto, ['status'], 'PENDING'));
    const claimedBasis = safeEnum(
      pickField(dto, ['claimedApprovalBasis'], null),
      ContributorApprovalBasis,
      null as unknown as ContributorApprovalBasis
    );
    const approvalBasis = safeEnum(
      pickField(dto, ['approvalBasis'], null),
      ContributorApprovalBasis,
      null as unknown as ContributorApprovalBasis
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      claimedApprovalBasis: claimedBasis ?? null,
      claimedApprovalBasisLabel: safeString(pickField(dto, ['claimedApprovalBasisLabel'], '')),
      organizationClaim: safeString(pickField(dto, ['organizationClaim'], '')) || null,
      experience: safeString(pickField(dto, ['experience'], '')),
      referenceLinks: safeArray<string>(pickField(dto, ['referenceLinks'], [])),
      status: safeEnum(rawStatus, ContributorApplicationStatus, ContributorApplicationStatus.PENDING),
      rawStatus,
      approvalBasis: approvalBasis ?? null,
      approvalBasisLabel: safeString(pickField(dto, ['approvalBasisLabel'], '')) || null,
      reviewNote: safeString(pickField(dto, ['reviewNote'], '')) || null,
      reviewedBy: toReviewer(pickField(dto, ['reviewedBy'], null)),
      reviewedAt: safeDate(pickField(dto, ['reviewedAt'], null)),
      reapplyEligibleAt: safeDate(pickField(dto, ['reapplyEligibleAt'], null)),
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
    };
  }

  toApplicationListModel(
    dto: ContributorApplicationListResponseDto | null | undefined
  ): PaginationResult<ContributorApplicationDetail> {
    const items = safeArray<ContributorApplicationItemDto | null, ContributorApplicationDetail>(
      pickField(dto, ['data'], []),
      (item) => this.toModel(item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField<ContributorApplicationListResponseDto['meta']>(dto, ['meta'], null);
    const page = safeNumber(meta?.page, 1);
    const limit = safeNumber(meta?.limit, 20);
    const totalPages = safeNumber(meta?.totalPages, 1);
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems: safeNumber(meta?.total, items.length),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  toSingleApplicationModel(
    dto: ContributorApplicationResponseDto | null | undefined
  ): ContributorApplicationDetail {
    return this.toModel(pickField(dto, ['data'], null));
  }
}

export const contributorMapper = new ContributorMapper();
