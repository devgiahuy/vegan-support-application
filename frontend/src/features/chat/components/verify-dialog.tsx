'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVerifyAnswerMutation } from '../queries/chat-sharing.queries';
import { verifyNoteSchema } from '../schemas/chat-sharing.schema';

/**
 * Dialog kiểm chứng của chuyên gia/admin: ghi chú bắt buộc.
 * Phân quyền render ở caller (chỉ role phù hợp mới thấy nút mở).
 */
export function VerifyDialog({
  messageId,
  open,
  onOpenChange,
}: {
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const verifyMutation = useVerifyAnswerMutation();
  const [note, setNote] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    const parsed = verifyNoteSchema.safeParse({ note });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Vui lòng nhập ghi chú.');
      return;
    }
    setFieldError(null);
    try {
      await verifyMutation.mutateAsync({ messageId, note: parsed.data.note });
      setNote('');
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kiểm chứng câu trả lời</DialogTitle>
          <DialogDescription>
            Xác nhận của bạn hiển thị công khai cùng vai trò chuyên môn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="verify-note">Ghi chú kiểm chứng</Label>
          <Textarea
            id="verify-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nội dung chính xác vì..."
          />
          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
