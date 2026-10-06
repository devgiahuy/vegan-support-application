import { Text, View } from 'react-native';
import { AlertTriangle, BadgeAlert, BadgeCheck, XCircle } from 'lucide-react-native';

import { AiVerificationConclusion, AiVerificationStatus } from '@/common/enums';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { AiVerification } from '../types/ai-artifact.model';

/**
 * Huy hiệu thẩm định. Chỉ mô tả "người đóng góp/quản trị viên đã thẩm định", không khẳng định
 * nội dung được chứng nhận khoa học hay y khoa.
 */
export function VerificationBadge({ verification, compact = false }: { verification: AiVerification | null; compact?: boolean }) {
  const colors = useIconColors();
  if (!verification) return null;

  if (verification.status === AiVerificationStatus.REVOKED) {
    return (
      <View className="max-w-full flex-row items-center gap-1 self-start rounded-full bg-destructive/10 px-2.5 py-1">
        <XCircle size={12} color={colors.destructive} />
        <Text numberOfLines={1} className="shrink text-[11px] font-semibold text-destructive">
          Thẩm định đã bị thu hồi
        </Text>
      </View>
    );
  }

  if (verification.status === AiVerificationStatus.SUPERSEDED) {
    return (
      <View className="max-w-full flex-row items-center gap-1 self-start rounded-full border border-dashed border-border px-2.5 py-1">
        <AlertTriangle size={12} color={colors.mutedForeground} />
        <Text numberOfLines={1} className="shrink text-[11px] font-medium text-muted-foreground">
          Thẩm định cũ (đã thay thế)
        </Text>
      </View>
    );
  }

  const isVerified = verification.conclusion === AiVerificationConclusion.VERIFIED;
  const isCorrection = verification.conclusion === AiVerificationConclusion.CORRECTION_NEEDED;
  const Icon = isVerified ? BadgeCheck : isCorrection ? BadgeAlert : XCircle;
  const tone = isVerified ? 'bg-primary/10' : isCorrection ? 'bg-amber-500/10' : 'bg-destructive/10';
  const textTone = isVerified ? 'text-primary' : isCorrection ? 'text-amber-700' : 'text-destructive';
  const iconColor = isVerified ? colors.primary : isCorrection ? '#b45309' : colors.destructive;
  const label = compact
    ? verification.conclusionLabel
    : isVerified
      ? `${verification.reviewerRoleLabel} đã thẩm định`
      : isCorrection
        ? `Cần lưu ý · ${verification.reviewerRoleLabel}`
        : `Chưa chuẩn xác · ${verification.reviewerRoleLabel}`;

  return (
    <View className={cn('max-w-full flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', tone)}>
      <Icon size={12} color={iconColor} />
      <Text numberOfLines={1} className={cn('shrink text-[11px] font-semibold', textTone)}>
        {label}
      </Text>
    </View>
  );
}
