import { describe, expect, it } from 'vitest';
import { contributorMapper } from './contributor.mapper';
import type { ContributorApplicationListResponseDto } from '../types/contributor.dto';
import { ContributorApplicationStatus, ContributorApprovalBasis } from '@/common/enums';

const pendingDto = {
  id: 'app-1',
  user: {
    id: 'u1',
    email: 'a@x.vn',
    displayName: 'An',
    role: 'MEMBER',
    currentApprovalBasis: null,
  },
  claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
  experience: 'Ăn chay 5 năm, nấu cho gia đình.',
  referenceLinks: ['https://blog.example.com', '', null],
  source: 'PROFILE',
  status: 'PENDING',
  createdAt: '2026-09-16T10:00:00.000Z',
};

describe('ContributorMapper applications', () => {
  it('map đơn PENDING + PLATFORM_TRACK_RECORD + links lọc rỗng + label Việt', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: pendingDto,
      meta: null,
    });
    expect(app.claimedApprovalBasis).toBe(ContributorApprovalBasis.PLATFORM_TRACK_RECORD);
    expect(app.claimedApprovalBasisLabel).toBe('Thành viên uy tín trên nền tảng');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
    expect(app.statusLabel).toBe('Chờ duyệt');
    expect(app.referenceLinks).toEqual(['https://blog.example.com']);
    expect(app.approvalBasis).toBeNull();
    expect(app.reapplyEligibleAt).toBeNull();
    expect(app.isReapplyBlocked).toBe(false);
  });

  it('map đơn ORGANIZATION_AFFILIATION + organizationClaim', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: {
        id: 'app-org',
        claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
        organizationClaim: 'Hội Ẩm thực Chay Việt Nam',
        experience: 'Giảng viên ẩm thực chay với 8 năm kinh nghiệm...',
        status: 'PENDING',
      },
      meta: null,
    });
    expect(app.claimedApprovalBasis).toBe(ContributorApprovalBasis.ORGANIZATION_AFFILIATION);
    expect(app.claimedApprovalBasisLabel).toBe('Tổ chức đối tác / Viện ẩm thực');
    expect(app.organizationClaim).toBe('Hội Ẩm thực Chay Việt Nam');
  });

  it('map đơn ADMIN_INVITED + invitedBy + invitationReason', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: {
        id: 'app-invite',
        claimedApprovalBasis: 'ADMIN_INVITED',
        approvalBasis: 'ADMIN_INVITED',
        status: 'APPROVED',
        source: 'ADMIN_INVITATION',
        invitedBy: { id: 'admin-1', displayName: 'Admin Tổng' },
        invitationReason: 'Thành viên xuất sắc đóng góp liên tục trong năm 2026',
      },
      meta: null,
    });
    expect(app.claimedApprovalBasis).toBe(ContributorApprovalBasis.ADMIN_INVITED);
    expect(app.approvalBasis).toBe(ContributorApprovalBasis.ADMIN_INVITED);
    expect(app.approvalBasisLabel).toBe('Được Quản trị viên mời');
    expect(app.invitedBy).toEqual({ id: 'admin-1', displayName: 'Admin Tổng' });
    expect(app.invitationReason).toBe('Thành viên xuất sắc đóng góp liên tục trong năm 2026');
  });

  it('envelope null → defaults an toàn không crash', () => {
    const app = contributorMapper.toSingleApplication(null);
    expect(app.id).toBe('');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
    expect(app.experienceShort).toBe('');
    expect(app.claimedApprovalBasis).toBe(ContributorApprovalBasis.PLATFORM_TRACK_RECORD);
    expect(app.applicantName).toBe('');
  });

  it('experience dài bị rút gọn 160 ký tự kèm dấu …', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a', experience: 'x'.repeat(200) },
      meta: null,
    });
    expect(app.experienceShort).toHaveLength(161);
    expect(app.experienceShort.endsWith('…')).toBe(true);
    expect(app.experience).toHaveLength(200);
  });

  it('list lọc rỗng + snake_case + meta', () => {
    const envelope: ContributorApplicationListResponseDto = {
      success: true,
      data: [
        {
          id: 'a',
          claimed_approval_basis: 'ORGANIZATION_AFFILIATION',
          status: 'APPROVED',
          approval_basis: 'ORGANIZATION_AFFILIATION',
        },
        { id: '' },
      ],
      meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
    };
    const result = contributorMapper.toApplicationList(envelope);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].claimedApprovalBasisLabel).toBe('Tổ chức đối tác / Viện ẩm thực');
    expect(result.items[0].approvalBasis).toBe(ContributorApprovalBasis.ORGANIZATION_AFFILIATION);
    expect(result.metadata.totalItems).toBe(1);
  });

  it('basis lạ → fallback PLATFORM_TRACK_RECORD, source lạ giữ nguyên', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: {
        id: 'a',
        claimedApprovalBasis: 'UNKNOWN_BASIS',
        source: 'WEIRD',
        status: 'GHOST',
      },
      meta: null,
    });
    expect(app.claimedApprovalBasis).toBe(ContributorApprovalBasis.PLATFORM_TRACK_RECORD);
    expect(app.sourceLabel).toBe('WEIRD');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
  });

  it('reapplyEligibleAt tương lai → isReapplyBlocked = true', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: {
        id: 'a',
        status: 'REJECTED',
        reapply_eligible_at: futureDate,
      },
      meta: null,
    });
    expect(app.statusLabel).toBe('Bị từ chối');
    expect(app.reapplyEligibleAt).not.toBeNull();
    expect(app.isReapplyBlocked).toBe(true);
  });
});

describe('ContributorMapper review, submit, invite & revoke DTOs', () => {
  it('toReviewDto APPROVE đủ căn cứ duyệt chính thức + reviewNote', () => {
    expect(
      contributorMapper.toReviewDto({
        decision: 'APPROVE',
        approvalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        reviewNote: 'Đã đối soát hợp đồng tổ chức',
      })
    ).toEqual({
      decision: 'APPROVE',
      approvalBasis: 'ORGANIZATION_AFFILIATION',
      reviewNote: 'Đã đối soát hợp đồng tổ chức',
    });
  });

  it('toReviewDto REJECT chỉ có reviewNote', () => {
    expect(
      contributorMapper.toReviewDto({ decision: 'REJECT', reviewNote: 'Hồ sơ chưa đủ' })
    ).toEqual({
      decision: 'REJECT',
      reviewNote: 'Hồ sơ chưa đủ',
    });
  });

  it('toSubmitDto với organizationClaim và lọc links', () => {
    expect(
      contributorMapper.toSubmitDto(
        'ORGANIZATION_AFFILIATION',
        'Kinh nghiệm 5 năm nấu ăn thuần chay',
        'Viện Ẩm thực Chay',
        ['https://example.com']
      )
    ).toEqual({
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Viện Ẩm thực Chay',
      experience: 'Kinh nghiệm 5 năm nấu ăn thuần chay',
      referenceLinks: ['https://example.com'],
    });
  });

  it('toRevokeDto và toRevocationResult map đúng người thu hồi và lý do', () => {
    expect(contributorMapper.toRevokeDto('Vi phạm quy tắc cộng đồng')).toEqual({
      reason: 'Vi phạm quy tắc cộng đồng',
    });

    const result = contributorMapper.toRevocationResult({
      success: true,
      data: {
        userId: 'u1',
        role: 'MEMBER',
        revokedAt: '2026-09-23T12:00:00.000Z',
        revokedBy: { displayName: 'Admin Trưởng' },
        reason: 'Vi phạm quy tắc cộng đồng',
      },
      meta: null,
    });

    expect(result.userId).toBe('u1');
    expect(result.role).toBe('MEMBER');
    expect(result.revokedByName).toBe('Admin Trưởng');
    expect(result.reason).toBe('Vi phạm quy tắc cộng đồng');
    expect(result.revokedAt).not.toBeNull();
  });
});
