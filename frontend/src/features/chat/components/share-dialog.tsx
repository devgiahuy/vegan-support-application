'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Copy, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { ChatMessage } from '../types/chat.model';
import { useShareAnswerMutation } from '../queries/chat-sharing.queries';
import { shareConfirmSchema } from '../schemas/chat-sharing.schema';

/**
 * Dialog chia sẻ: xác nhận phạm vi công khai bắt buộc → hiện link + copy
 * + thu hồi. Validate bằng `shareConfirmSchema.safeParse` (không RHF vì
 * chỉ có 1 checkbox). Copy dùng clipboard, fallback chọn tay khi bị chặn.
 */
export function ShareDialog({
  message,
  open,
  onOpenChange,
}: {
  message: ChatMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shareMutation = useShareAnswerMutation();
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [ackError, setAckError] = React.useState<string | null>(null);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [shared, setShared] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [manualCopy, setManualCopy] = React.useState(false);

  const handleShare = async () => {
    const parsed = shareConfirmSchema.safeParse({ acknowledged });
    if (!parsed.success) {
      setAckError(parsed.error.issues[0]?.message ?? 'Vui lòng xác nhận.');
      return;
    }
    setAckError(null);
    try {
      const result = await shareMutation.mutateAsync({ messageId: message.id, shared: true });
      setShareUrl(result.shareUrl);
      setShared(true);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  const handleRevoke = async () => {
    try {
      await shareMutation.mutateAsync({ messageId: message.id, shared: false });
      setShared(false);
      setShareUrl(null);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
      setCopied(true);
    } catch {
      setManualCopy(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chia sẻ câu trả lời</DialogTitle>
          <DialogDescription>
            Liên kết công khai mở được cho mọi người mà không cần đăng nhập.
          </DialogDescription>
        </DialogHeader>

        {!shared ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="share-ack"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <Label htmlFor="share-ack" className="text-sm font-normal">
                Tôi hiểu ai cũng xem được nội dung này sau khi chia sẻ.
              </Label>
            </div>
            {ackError && <p className="text-xs text-destructive">{ackError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={() => void handleShare()} disabled={shareMutation.isPending}>
                {shareMutation.isPending ? 'Đang xử lý...' : 'Xác nhận chia sẻ'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="break-all rounded-lg bg-muted px-3 py-2 text-sm">{shareUrl}</p>
            {manualCopy && (
              <p className="text-xs text-muted-foreground">
                Trình duyệt chặn sao chép tự động — hãy bôi đen liên kết trên để copy tay.
              </p>
            )}
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleRevoke()}
                disabled={shareMutation.isPending}
              >
                <Undo2 data-icon="inline-start" />
                Thu hồi
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
                <Button type="button" onClick={() => void handleCopy()}>
                  {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                  {copied ? 'Đã copy' : 'Copy link'}
                </Button>
              </div>
            </DialogFooter>
            <Button asChild variant="link" size="sm">
              <Link href={shareUrl ?? '/assistant'}>Mở trang công khai</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
