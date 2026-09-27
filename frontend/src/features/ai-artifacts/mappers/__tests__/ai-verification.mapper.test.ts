import { describe, expect, it } from 'vitest';
import { AiVerificationConclusion, AiVerificationStatus, UserRole } from '@/common/enums';
import { aiVerificationMapper } from '../ai-verification.mapper';
import type { AiVerificationDto } from '../../types/ai-verification.dto';

describe('AiVerificationMapper', () => {
  it('maps a complete verification DTO correctly', () => {
    const dto: AiVerificationDto = {
      id: 'v-101',
      artifactVersion: 2,
      conclusion: 'VERIFIED',
      scope: 'Đánh giá hàm lượng sắt và vitamin B12',
      evidenceNote: 'Số liệu đối chiếu chuẩn theo Viện Dinh dưỡng Quốc gia',
      correction: null,
      status: 'ACTIVE',
      reviewer: {
        name: 'TS. Nguyễn Văn A',
        role: 'CONTRIBUTOR',
      },
      version: 1,
      supersedes: null,
      createdAt: '2026-09-26T10:00:00Z',
    };

    const model = aiVerificationMapper.toModel(dto);

    expect(model.id).toBe('v-101');
    expect(model.artifactVersion).toBe(2);
    expect(model.conclusion).toBe(AiVerificationConclusion.VERIFIED);
    expect(model.conclusionLabel).toBe('Chính xác');
    expect(model.scope).toBe('Đánh giá hàm lượng sắt và vitamin B12');
    expect(model.evidenceNote).toBe('Số liệu đối chiếu chuẩn theo Viện Dinh dưỡng Quốc gia');
    expect(model.correction).toBeNull();
    expect(model.status).toBe(AiVerificationStatus.ACTIVE);
    expect(model.isActive).toBe(true);
    expect(model.isSuperseded).toBe(false);
    expect(model.isRevoked).toBe(false);
    expect(model.reviewer.name).toBe('TS. Nguyễn Văn A');
    expect(model.reviewer.role).toBe(UserRole.CONTRIBUTOR);
    expect(model.reviewer.roleLabel).toBe('Người đóng góp');
    expect(model.supersedesVerificationId).toBeNull();
  });

  it('maps CORRECTION_NEEDED conclusion with correction text and ADMIN role', () => {
    const dto: AiVerificationDto = {
      id: 'v-102',
      artifactVersion: 1,
      conclusion: 'CORRECTION_NEEDED',
      scope: 'Hàm lượng canxi trong đậu phụ',
      evidenceNote: 'AI tính nhầm lượng đậu phụ rán thành đậu phụ sống',
      correction: 'Cần quy đổi lại hàm lượng canxi cho đậu phụ rán là 350mg',
      status: 'SUPERSEDED',
      reviewer: {
        name: 'Admin Kiên',
        role: 'ADMIN',
      },
      version: 2,
      supersedes: { verificationId: 'v-101' },
      createdAt: '2026-09-26T11:00:00Z',
    };

    const model = aiVerificationMapper.toModel(dto);

    expect(model.conclusion).toBe(AiVerificationConclusion.CORRECTION_NEEDED);
    expect(model.conclusionLabel).toBe('Cần chỉnh lý');
    expect(model.correction).toBe('Cần quy đổi lại hàm lượng canxi cho đậu phụ rán là 350mg');
    expect(model.status).toBe(AiVerificationStatus.SUPERSEDED);
    expect(model.isActive).toBe(false);
    expect(model.isSuperseded).toBe(true);
    expect(model.reviewer.role).toBe(UserRole.ADMIN);
    expect(model.reviewer.roleLabel).toBe('Quản trị viên');
    expect(model.supersedesVerificationId).toBe('v-101');
  });

  it('maps REJECTED conclusion and REVOKED status correctly', () => {
    const dto: AiVerificationDto = {
      id: 'v-103',
      conclusion: 'REJECTED',
      status: 'REVOKED',
    };

    const model = aiVerificationMapper.toModel(dto);

    expect(model.conclusion).toBe(AiVerificationConclusion.REJECTED);
    expect(model.conclusionLabel).toBe('Không chuẩn xác');
    expect(model.status).toBe(AiVerificationStatus.REVOKED);
    expect(model.isRevoked).toBe(true);
    expect(model.isActive).toBe(false);
  });

  it('provides safe fallbacks for missing or empty fields', () => {
    const emptyDto: AiVerificationDto = {};

    const model = aiVerificationMapper.toModel(emptyDto);

    expect(model.id).toBe('');
    expect(model.artifactVersion).toBe(1);
    expect(model.conclusion).toBe(AiVerificationConclusion.VERIFIED);
    expect(model.conclusionLabel).toBe('Chính xác');
    expect(model.scope).toBe('');
    expect(model.evidenceNote).toBe('');
    expect(model.correction).toBeNull();
    expect(model.status).toBe(AiVerificationStatus.ACTIVE);
    expect(model.reviewer.name).toBe('Chuyên gia');
    expect(model.reviewer.role).toBe(UserRole.CONTRIBUTOR);
    expect(model.reviewer.roleLabel).toBe('Người đóng góp');
    expect(model.supersedesVerificationId).toBeNull();
  });

  it('handles invalid enum values gracefully', () => {
    const invalidDto: AiVerificationDto = {
      conclusion: 'UNKNOWN_CONCLUSION' as any,
      status: 'UNKNOWN_STATUS' as any,
      reviewer: {
        role: 'SUPER_USER' as any,
      },
    };

    const model = aiVerificationMapper.toModel(invalidDto);

    expect(model.conclusion).toBe(AiVerificationConclusion.VERIFIED);
    expect(model.status).toBe(AiVerificationStatus.ACTIVE);
    expect(model.reviewer.role).toBe(UserRole.CONTRIBUTOR);
  });
});
