import { describe, expect, it } from 'vitest';
import { contributorMapper } from './contributor.mapper';
import type { ContributorApplicationListResponseDto } from '../types/contributor.dto';
import { ContributorApplicationStatus, ContributorType } from '@/common/enums';

const pendingDto = {
  id: 'app-1',
  user: {
    id: 'u1',
    email: 'a@x.vn',
    displayName: 'An',
    role: 'MEMBER',
    currentContributorType: null,
  },
  requestedType: 'NUTRITION_EXPERT',
  experience: 'Ăn chay 5 năm, nấu cho gia đình.',
  referenceLinks: ['https://blog.example.com', '', null],
  source: 'PROFILE',
  status: 'PENDING',
  createdAt: '2026-09-16T10:00:00.000Z',
};

describe('ContributorMapper applications', () => {
  it('map đơn PENDING + links lọc rỗng + label Việt', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: pendingDto,
      meta: null,
    });
    expect(app.requestedType).toBe(ContributorType.NUTRITION_EXPERT);
    expect(app.requestedTypeLabel).toBe('Chuyên gia dinh dưỡng');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
    expect(app.statusLabel).toBe('Chờ duyệt');
    expect(app.referenceLinks).toEqual(['https://blog.example.com']);
    expect(app.approvedType).toBeNull();
    expect(app.reapplyEligibleAt).toBeNull();
  });

  it('envelope null → defaults an toàn', () => {
    const app = contributorMapper.toSingleApplication(null);
    expect(app.id).toBe('');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
    expect(app.experienceShort).toBe('');
  });

  it('experience dài bị rút gọn 160 ký tự', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a', experience: 'x'.repeat(200) },
      meta: null,
    });
    expect(app.experienceShort).toHaveLength(161);
    expect(app.experienceShort.endsWith('…')).toBe(true);
  });

  it('list lọc rỗng + snake_case + meta', () => {
    const envelope: ContributorApplicationListResponseDto = {
      success: true,
      data: [
        {
          id: 'a',
          requested_type: 'EXPERIENCED_PRACTITIONER',
          status: 'APPROVED',
          approved_type: 'EXPERIENCED_PRACTITIONER',
        },
        { id: '' },
      ],
      meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
    };
    const result = contributorMapper.toApplicationList(envelope);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].requestedTypeLabel).toBe('Người ăn chay kinh nghiệm');
    expect(result.items[0].approvedType).toBe(ContributorType.EXPERIENCED_PRACTITIONER);
    expect(result.metadata.totalItems).toBe(1);
  });

  it('type lạ → fallback EXPERIENCED_PRACTITIONER, source lạ giữ nguyên', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a', requestedType: 'GHOST', source: 'WEIRD', status: 'GHOST' },
      meta: null,
    });
    expect(app.requestedType).toBe(ContributorType.EXPERIENCED_PRACTITIONER);
    expect(app.sourceLabel).toBe('WEIRD');
    expect(app.status).toBe(ContributorApplicationStatus.PENDING);
  });

  it('reapplyEligibleAt tương lai parse đúng', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a', status: 'REJECTED', reapply_eligible_at: '2026-12-01T00:00:00.000Z' },
      meta: null,
    });
    expect(app.statusLabel).toBe('Bị từ chối');
    expect(app.reapplyEligibleAt).not.toBeNull();
  });
});

describe('ContributorMapper review oneOf', () => {
  it('APPROVE đủ 4 trường', () => {
    expect(
      contributorMapper.toReviewDto({
        decision: 'APPROVE',
        contributorType: ContributorType.NUTRITION_EXPERT,
        approvalBasis: 'Có bằng',
        reviewNote: 'Đạt',
      })
    ).toEqual({
      decision: 'APPROVE',
      contributorType: 'NUTRITION_EXPERT',
      approvalBasis: 'Có bằng',
      reviewNote: 'Đạt',
    });
  });

  it('REJECT chỉ note', () => {
    expect(contributorMapper.toReviewDto({ decision: 'REJECT', reviewNote: 'Chưa đủ' })).toEqual({
      decision: 'REJECT',
      reviewNote: 'Chưa đủ',
    });
  });

  it('toSubmitDto bỏ links khi rỗng', () => {
    expect(
      contributorMapper.toSubmitDto(
        ContributorType.EXPERIENCED_PRACTITIONER,
        'kinh nghiệm dài đủ 20 ký tự nè',
        []
      )
    ).toEqual({
      requestedType: 'EXPERIENCED_PRACTITIONER',
      experience: 'kinh nghiệm dài đủ 20 ký tự nè',
    });
  });

  it('reviewedBy object + label có sẵn từ BE', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: {
        id: 'a',
        status: 'APPROVED',
        requestedTypeLabel: 'Label BE',
        approvedTypeLabel: 'Label duyệt BE',
        reviewedBy: { displayName: 'Admin A' },
        reviewNote: 'OK',
      },
      meta: null,
    });
    expect(app.requestedTypeLabel).toBe('Label BE');
    expect(app.approvedTypeLabel).toBe('Label duyệt BE');
    expect(app.reviewedBy).toBe('Admin A');
  });

  it('applicant rỗng khi own list không có user', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a' },
      meta: null,
    });
    expect(app.applicantId).toBe('');
    expect(app.applicantEmail).toBe('');
  });

  it('source PROFILE label Việt', () => {
    const app = contributorMapper.toSingleApplication({
      success: true,
      data: { id: 'a', source: 'PROFILE' },
      meta: null,
    });
    expect(app.sourceLabel).toBe('Từ hồ sơ');
  });
});
