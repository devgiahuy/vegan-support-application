import { AiVerificationConclusion, AiVerificationStatus, UserRole } from '@/common/enums';
import { BaseMapper } from '@/lib/mapper/base-mapper';
import { pickField, safeEnum, safeNumber, safeString } from '@/lib/mapper/field-helpers';
import type {
  AiReviewerDto,
  AiVerificationDto,
  AiVerificationSupersedesDto,
} from '../types/ai-verification.dto';
import type { AiReviewer, AiVerification } from '../types/ai-verification.model';

export class AiVerificationMapper extends BaseMapper<AiVerificationDto, AiVerification> {
  toModel(dto: AiVerificationDto): AiVerification {
    const rawStatus = pickField(dto, ['status'], '');
    const status = safeEnum(rawStatus, AiVerificationStatus, AiVerificationStatus.ACTIVE);

    const rawConclusion = pickField(dto, ['conclusion'], '');
    const conclusion = safeEnum(
      rawConclusion,
      AiVerificationConclusion,
      AiVerificationConclusion.VERIFIED
    );

    const conclusionLabel = this.getConclusionLabel(conclusion);

    const reviewerDto = pickField<AiReviewerDto | null>(dto, ['reviewer'], null);
    const rawRole = reviewerDto?.role;
    const reviewerRole: UserRole.CONTRIBUTOR | UserRole.ADMIN =
      rawRole === UserRole.ADMIN ? UserRole.ADMIN : UserRole.CONTRIBUTOR;

    const reviewer: AiReviewer = {
      name: safeString(reviewerDto?.name, 'Chuyên gia'),
      role: reviewerRole,
      roleLabel: reviewerRole === UserRole.ADMIN ? 'Quản trị viên' : 'Người đóng góp',
    };

    const supersedesDto = pickField<AiVerificationSupersedesDto | null>(dto, ['supersedes'], null);
    const supersedesVerificationId = supersedesDto?.verificationId
      ? safeString(supersedesDto.verificationId, '')
      : null;

    const correctionVal = pickField<string | null>(dto, ['correction'], null);

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      artifactVersion: safeNumber(pickField(dto, ['artifactVersion'], 1), 1),
      conclusion,
      conclusionLabel,
      scope: safeString(pickField(dto, ['scope'], ''), ''),
      evidenceNote: safeString(pickField(dto, ['evidenceNote'], ''), ''),
      correction: correctionVal ? safeString(correctionVal, '') : null,
      status,
      reviewer,
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      supersedesVerificationId,
      createdAt: safeString(pickField(dto, ['createdAt'], ''), ''),
      isActive: status === AiVerificationStatus.ACTIVE,
      isSuperseded: status === AiVerificationStatus.SUPERSEDED,
      isRevoked: status === AiVerificationStatus.REVOKED,
    };
  }

  private getConclusionLabel(conclusion: AiVerificationConclusion): string {
    switch (conclusion) {
      case AiVerificationConclusion.VERIFIED:
        return 'Chính xác';
      case AiVerificationConclusion.CORRECTION_NEEDED:
        return 'Cần chỉnh lý';
      case AiVerificationConclusion.REJECTED:
        return 'Không chuẩn xác';
    }
  }
}

export const aiVerificationMapper = new AiVerificationMapper();
