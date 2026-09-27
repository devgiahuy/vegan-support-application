'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Globe, Lock, Send, ShieldCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AiArtifactVisibility } from '@/common/enums';
import { useUpdateAiArtifactVisibilityMutation } from '../queries/ai-artifact.queries';
import type { AiArtifact } from '../types/ai-artifact.model';
import { SubmitArtifactDialog } from './submit-artifact-dialog';

export function ShareArtifactDialog({
  open,
  onOpenChange,
  artifact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: AiArtifact;
}) {
  const updateVisibilityMutation = useUpdateAiArtifactVisibilityMutation();
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [manualCopy, setManualCopy] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/assistant/public?share=${artifact.id}`;

  const handleToggleShare = async (newVisibility: AiArtifactVisibility) => {
    if (newVisibility === AiArtifactVisibility.PUBLIC && !acknowledged) {
      toast.error('Vui lòng xác nhận trước khi chia sẻ công khai.');
      return;
    }

    try {
      await updateVisibilityMutation.mutateAsync({
        id: artifact.id,
        data: {
          visibility: newVisibility,
          expectedLifecycleVersion: artifact.lifecycle.version,
        },
      });
    } catch {
      // Toast error handled in mutation
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã sao chép liên kết chia sẻ!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setManualCopy(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {artifact.isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
              </div>
              <DialogTitle>
                {artifact.isPublic ? 'Liên kết Chia sẻ Công khai' : 'Cấu hình Chia sẻ Tri thức'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {artifact.isPublic
                ? 'Tri thức AI này hiện đang ở chế độ công khai. Bất kỳ ai có liên kết đều có thể xem mà không cần đăng nhập.'
                : 'Bản ghi này đang ở chế độ Riêng tư. Bạn có thể bật chia sẻ công khai để gửi liên kết cho người khác.'}
            </DialogDescription>
          </DialogHeader>

          {artifact.isPublic ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="share-link-input" className="text-xs text-muted-foreground">
                  Liên kết truy cập công khai:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="share-link-input"
                    value={shareUrl}
                    readOnly
                    className="font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0 gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </Button>
                </div>
                {manualCopy && (
                  <p className="text-[11px] text-amber-600">
                    Trình duyệt đã chặn truy cập bộ nhớ tạm. Hãy bôi đen liên kết trên và nhấn
                    Ctrl+C để sao chép.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/assistant/public?share=${artifact.id}`} target="_blank">
                    <ExternalLink className="size-3.5" />
                    <span>Xem trang công khai</span>
                  </Link>
                </Button>

                {!artifact.isSubmitted && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setSubmitOpen(true)}
                  >
                    <Send className="size-3.5" />
                    <span>Gửi thẩm định chuyên gia</span>
                  </Button>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <p>
                  <strong>Lưu ý quyền riêng tư:</strong> Toàn bộ lịch sử trò chuyện hoặc ảnh chụp
                  gốc không được chia sẻ. Chỉ câu trả lời trích xuất này hiển thị.
                </p>
              </div>

              <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleToggleShare(AiArtifactVisibility.PRIVATE)}
                  disabled={updateVisibilityMutation.isPending}
                  className="gap-1.5"
                >
                  <Undo2 className="size-3.5" />
                  <span>Thu hồi chia sẻ</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-md border p-3">
                <Checkbox
                  id="share-ack"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="share-ack" className="text-sm font-normal cursor-pointer">
                    Tôi hiểu rằng nội dung trích xuất này sẽ được công khai cho cộng đồng và có thể
                    được thẩm định bởi chuyên gia.
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={() => handleToggleShare(AiArtifactVisibility.PUBLIC)}
                  disabled={!acknowledged || updateVisibilityMutation.isPending}
                  className="gap-1.5"
                >
                  <Globe className="size-4" />
                  <span>Bật chia sẻ công khai</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SubmitArtifactDialog open={submitOpen} onOpenChange={setSubmitOpen} artifact={artifact} />
    </>
  );
}
