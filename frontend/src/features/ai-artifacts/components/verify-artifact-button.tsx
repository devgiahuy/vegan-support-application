'use client';

import * as React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { AiArtifact } from '../types/ai-artifact.model';
import { VerifyDialog } from './verify-dialog';

export function VerifyArtifactButton({
  artifact,
  variant = 'outline',
  size = 'sm',
  className,
}: {
  artifact: AiArtifact;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  const isEligible = user?.role === UserRole.CONTRIBUTOR || user?.role === UserRole.ADMIN;

  if (!isEligible) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            className={`gap-1.5 ${className || ''}`}
            onClick={() => setOpen(true)}
          >
            <BadgeCheck className="size-4 text-primary" />
            <span>Thẩm định bài viết</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Dành cho Người đóng góp & Quản trị viên thẩm định chuyên môn</p>
        </TooltipContent>
      </Tooltip>

      <VerifyDialog open={open} onOpenChange={setOpen} artifact={artifact} />
    </>
  );
}
