'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { AiVerification } from '../types/ai-verification.model';
import { AdminVerificationDialog } from './admin-verification-dialog';

export function AdminVerificationActionMenu({
  verification,
}: {
  verification: AiVerification | null;
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  if (user?.role !== UserRole.ADMIN || !verification) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <ShieldAlert className="size-3.5" />
        <span>Quản trị kiểm chứng</span>
      </Button>

      <AdminVerificationDialog open={open} onOpenChange={setOpen} verification={verification} />
    </>
  );
}
