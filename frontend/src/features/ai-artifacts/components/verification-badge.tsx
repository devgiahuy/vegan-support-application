import * as React from 'react';
import { AlertTriangle, BadgeAlert, BadgeCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AiVerificationConclusion, AiVerificationStatus } from '@/common/enums';
import type { AiVerification } from '../types/ai-verification.model';

export function VerificationBadge({
  verification,
  compact = false,
  className,
}: {
  verification: AiVerification | null;
  compact?: boolean;
  className?: string;
}) {
  if (!verification) return null;

  if (verification.status === AiVerificationStatus.REVOKED) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className={`gap-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 ${className || ''}`}
          >
            <XCircle className="size-3.5" />
            <span>Kiểm chứng đã bị thu hồi</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <p className="font-semibold text-destructive">
            Kiểm chứng này đã bị Quản trị viên thu hồi.
          </p>
          <p className="mt-1 text-muted-foreground">
            {verification.evidenceNote || 'Không còn hiệu lực đánh giá.'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (verification.status === AiVerificationStatus.SUPERSEDED) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 text-muted-foreground border-dashed ${className || ''}`}
          >
            <AlertTriangle className="size-3.5" />
            <span>Kiểm chứng cũ (Đã thay thế)</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <p className="font-medium">
            Bản đánh giá này đã được cập nhật bởi một bản kiểm chứng mới hơn.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Active verification
  const isVerifiedAccurate = verification.conclusion === AiVerificationConclusion.VERIFIED;
  const isCorrectionNeeded = verification.conclusion === AiVerificationConclusion.CORRECTION_NEEDED;
  const isRejected = verification.conclusion === AiVerificationConclusion.REJECTED;

  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let Icon = BadgeCheck;
  let labelText = `Được kiểm chứng bởi ${verification.reviewer.roleLabel}`;

  if (isCorrectionNeeded) {
    badgeVariant = 'secondary';
    Icon = BadgeAlert;
    labelText = `Cần lưu ý · ${verification.reviewer.roleLabel}`;
  } else if (isRejected) {
    badgeVariant = 'destructive';
    Icon = XCircle;
    labelText = `Chưa chuẩn xác · ${verification.reviewer.roleLabel}`;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={badgeVariant}
          className={`gap-1 font-medium transition-colors ${className || ''}`}
        >
          <Icon className="size-3.5" />
          <span>{compact ? verification.conclusionLabel : labelText}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm space-y-2 p-3 text-xs leading-relaxed">
        <div className="flex items-center justify-between border-b pb-1.5 font-semibold">
          <span>Kết luận: {verification.conclusionLabel}</span>
          <span className="text-[10px] text-muted-foreground">
            {verification.reviewer.name} ({verification.reviewer.roleLabel})
          </span>
        </div>
        {verification.scope && (
          <div>
            <span className="font-medium text-foreground">Phạm vi: </span>
            <span className="text-muted-foreground">{verification.scope}</span>
          </div>
        )}
        {verification.evidenceNote && (
          <div>
            <span className="font-medium text-foreground">Ghi chú: </span>
            <span className="text-muted-foreground">{verification.evidenceNote}</span>
          </div>
        )}
        {verification.correction && (
          <div className="rounded bg-muted/60 p-2 text-foreground">
            <span className="font-semibold text-primary">Chỉnh lý đề xuất: </span>
            <span>{verification.correction}</span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
