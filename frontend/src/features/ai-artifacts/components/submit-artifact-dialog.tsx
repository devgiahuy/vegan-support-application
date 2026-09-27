'use client';

import * as React from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubmitAiArtifactMutation } from '../queries/ai-artifact.queries';
import type { AiArtifact } from '../types/ai-artifact.model';

export function SubmitArtifactDialog({
  open,
  onOpenChange,
  artifact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: AiArtifact;
}) {
  const submitMutation = useSubmitAiArtifactMutation();

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync({
        id: artifact.id,
        data: {
          expectedLifecycleVersion: artifact.lifecycle.version,
        },
      });
      onOpenChange(false);
    } catch {
      // Toast error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <DialogTitle>Gửi Thẩm định Chuyên môn</DialogTitle>
          </div>
          <DialogDescription>
            Bản ghi tri thức này sẽ được chuyển tới hàng đợi thẩm định của các Người đóng góp
            (Contributor) và Quản trị viên trong cộng đồng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            • Chuyên gia dinh dưỡng và người có kinh nghiệm thực dưỡng chay sẽ đối chiếu số liệu và
            nội dung.
          </p>
          <p>
            • Nếu được đánh giá chính xác hoặc bổ sung chỉnh lý cần thiết, bản ghi sẽ được gắn huy
            hiệu <strong>&quot;Được kiểm chứng bởi Người đóng góp&quot;</strong>.
          </p>
          <p>• Lưu ý: Bạn sẽ không thể tự kiểm chứng bản ghi do chính mình tạo ra.</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="gap-1.5"
          >
            <Send className="size-4" />
            <span>{submitMutation.isPending ? 'Đang gửi...' : 'Xác nhận gửi'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
