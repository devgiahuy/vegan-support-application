'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteHistoryDialog } from './delete-history-dialog';

/** Nút xóa toàn bộ lịch sử hành vi (mở dialog xác nhận không-khôi-phục). */
export function DeleteHistoryButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" /> Xóa toàn bộ lịch sử hành vi &amp; chat AI
      </Button>
      <DeleteHistoryDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
