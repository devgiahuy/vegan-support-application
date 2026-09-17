import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AnswerVerification } from '../types/chat-sharing.model';

/** Huy hiệu đã kiểm chứng (null → không render). */
export function VerificationBadge({
  verification,
  compact = false,
}: {
  verification: AnswerVerification | null;
  compact?: boolean;
}) {
  if (!verification) return null;
  const label = `Đã kiểm chứng · ${verification.verifierRoleLabel}`;
  const title = verification.note ? `${label}: ${verification.note}` : label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="gap-1">
          <BadgeCheck className="size-3.5 text-primary" />
          {compact ? 'Đã kiểm chứng' : label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-60 text-xs">{title}</p>
      </TooltipContent>
    </Tooltip>
  );
}
