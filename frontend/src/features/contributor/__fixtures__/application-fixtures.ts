import type {
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
} from '../types/contributor.dto';

/** Fixture đơn contributor chuẩn Phase 14 (Unified Contributor). */
export const myPendingApplicationFixture: ContributorApplicationResponseDto = {
  success: true,
  data: {
    id: 'app-pending-1',
    user: { id: 'me', email: 'member@example.com', displayName: 'Bạn', role: 'MEMBER' },
    claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
    experience: 'Ăn chay 5 năm, tư vấn cho gia đình và bạn bè, viết blog món chay.',
    referenceLinks: ['https://blog.example.com/mon-chay'],
    source: 'PROFILE',
    status: 'PENDING',
    createdAt: '2026-09-16T10:00:00.000Z',
  },
  meta: null,
};

export const myApplicationsFixture: ContributorApplicationListResponseDto = {
  success: true,
  data: [
    {
      id: 'app-rejected-future',
      claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
      experience: 'Nấu chay 2 năm.',
      source: 'PROFILE',
      status: 'REJECTED',
      reviewNote: 'Kinh nghiệm chưa đủ dày, mời bạn nộp lại sau.',
      reviewedAt: '2026-09-10T10:00:00.000Z',
      reapplyEligibleAt: '2026-12-10T00:00:00.000Z',
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'app-rejected-past',
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Hội Ẩm thực Chay',
      experience: 'Từng học dinh dưỡng cơ bản.',
      source: 'REGISTRATION',
      status: 'REJECTED',
      reviewNote: 'Thiếu link tham khảo.',
      reapplyEligibleAt: '2026-09-01T00:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'app-approved-1',
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Viện Ẩm thực Chay Việt Nam',
      approvalBasis: 'ORGANIZATION_AFFILIATION',
      reviewNote: 'Đạt yêu cầu hồ sơ.',
      reviewedBy: { displayName: 'Admin Demo' },
      status: 'APPROVED',
      source: 'PROFILE',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
};

export const adminQueueFixture: ContributorApplicationListResponseDto = {
  success: true,
  data: [
    {
      id: 'app-q1',
      user: { id: 'u1', email: 'cook@example.com', displayName: 'Bếp Chay', role: 'MEMBER' },
      claimedApprovalBasis: 'PLATFORM_TRACK_RECORD',
      experience: 'Nấu chay 8 năm, 200 bài blog.',
      referenceLinks: ['https://blog.example.com'],
      source: 'PROFILE',
      status: 'PENDING',
      createdAt: '2026-09-15T08:00:00.000Z',
    },
    {
      id: 'app-q2',
      user: { id: 'u2', email: 'expert@example.com', displayName: 'Dinh Dưỡng', role: 'MEMBER' },
      claimedApprovalBasis: 'ORGANIZATION_AFFILIATION',
      organizationClaim: 'Hiệp hội Dinh dưỡng Chay',
      experience: 'Cử nhân dinh dưỡng.',
      source: 'REGISTRATION',
      status: 'PENDING',
      createdAt: '2026-09-14T08:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export function createdApplicationFixture(
  claimedApprovalBasis: string,
  experience: string,
  organizationClaim?: string
): ContributorApplicationResponseDto {
  return {
    success: true,
    data: {
      id: 'app-new-1',
      claimedApprovalBasis,
      organizationClaim,
      experience,
      source: 'PROFILE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    meta: null,
  };
}
