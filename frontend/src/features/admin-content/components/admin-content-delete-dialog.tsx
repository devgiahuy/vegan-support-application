'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { adminContentMapper } from '../mappers/admin-content.mapper';
import { useDeleteAdminContentMutation } from '../queries/admin-content.queries';
import type { AdminContentRow } from '../types/admin-content.model';

interface AdminContentDeleteDialogProps {
  row: AdminContentRow | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Xác nhận xoá nội dung (FR-028).
 *
 * ⚠️ Máy chủ **không** có endpoint ẩn/khôi phục cho tác giả — `PostStatus.HIDDEN`
 * chỉ được đặt bởi quyết định kiểm duyệt. Nên cách duy nhất gỡ nội dung của chính
 * mình khỏi khu vực công khai là **xoá mềm** `DELETE /posts/:id`: bằng chứng kiểm
 * toán được giữ (FR-029) nhưng **không hoàn tác được** ở MVP. Hộp thoại nói rõ điều
 * này. Xem `specs/029-admin-content-crud/contracts/cg-02-author-hide-restore.md`.
 */
export function AdminContentDeleteDialog({
  row,
  onOpenChange,
  onDeleted,
}: AdminContentDeleteDialogProps) {
  const deleteMutation = useDeleteAdminContentMutation();
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!row) return;
    setFormError(null);
    try {
      await deleteMutation.mutateAsync({ id: row.id, expectedVersion: row.version });
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      setFormError(adminContentMapper.mapErrorObject(error));
    }
  };

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoá nội dung này?</DialogTitle>
          <DialogDescription>
            Bạn đang xoá &quot;{row?.title ?? ''}&quot;. Hành động này sẽ gỡ nội dung khỏi khu vực
            công khai và không thể hoàn tác ở phiên bản MVP.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            Thông tin kiểm toán vẫn được giữ để tra cứu: tiêu đề, tác giả, thời điểm xoá và lịch sử
            duyệt.
          </AlertDescription>
        </Alert>

        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Đang xoá...' : 'Xác nhận xoá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
