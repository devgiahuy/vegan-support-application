'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bookmark, Lock, Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { AiArtifactType } from '@/common/enums';
import { useCreateAiArtifactMutation } from '../queries/ai-artifact.queries';
import {
  createAiArtifactSchema,
  type CreateAiArtifactFormData,
} from '../schemas/ai-artifact.schema';
import type { AiArtifact } from '../types/ai-artifact.model';

export function SaveArtifactDialog({
  open,
  onOpenChange,
  type,
  sourceId,
  defaultTitle = '',
  defaultSummary = '',
  onSuccessSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AiArtifactType;
  sourceId: string;
  defaultTitle?: string;
  defaultSummary?: string;
  onSuccessSaved?: (artifact: AiArtifact) => void;
}) {
  const createMutation = useCreateAiArtifactMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAiArtifactFormData>({
    resolver: zodResolver(createAiArtifactSchema),
    defaultValues: {
      type,
      sourceId,
      title: defaultTitle,
      summary: defaultSummary,
      authorAnonymous: true,
    },
  });

  const authorAnonymous = watch('authorAnonymous');

  React.useEffect(() => {
    if (open) {
      reset({
        type,
        sourceId,
        title: defaultTitle,
        summary: defaultSummary,
        authorAnonymous: true,
      });
    }
  }, [open, type, sourceId, defaultTitle, defaultSummary, reset]);

  const onSubmit = async (values: CreateAiArtifactFormData) => {
    try {
      const created = await createMutation.mutateAsync(values);
      onOpenChange(false);
      onSuccessSaved?.(created);
    } catch {
      // Error đã được toast xử lý tại query layer
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle>Lưu thành Tri thức AI</DialogTitle>
          </div>
          <DialogDescription>
            Đóng gói kết quả AI này thành một bản ghi bất biến để bạn có thể xem lại hoặc chia sẻ
            cho cộng đồng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artifact-title">Tiêu đề tri thức</Label>
            <Input
              id="artifact-title"
              placeholder="Ví dụ: Lời khuyên bổ sung canxi và sắt cho người ăn chay thuần"
              {...register('title')}
            />
            {errors.title?.message && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="artifact-summary">Tóm tắt ngắn gọn</Label>
            <Textarea
              id="artifact-summary"
              placeholder="Tóm lược ý chính hoặc bối cảnh cần lưu ý..."
              rows={3}
              {...register('summary')}
            />
            {errors.summary?.message && (
              <p className="text-xs text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
            <Checkbox
              id="authorAnonymous"
              checked={authorAnonymous}
              onCheckedChange={(checked) =>
                setValue('authorAnonymous', checked === true, { shouldValidate: true })
              }
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="authorAnonymous" className="text-sm font-medium cursor-pointer">
                Ẩn danh tác giả khi chia sẻ công khai
              </Label>
              <p className="text-xs text-muted-foreground">
                Tên của bạn sẽ hiển thị là &quot;Thành viên ẩn danh&quot; để bảo vệ quyền riêng tư.
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <span>
              Sau khi tạo, bản ghi ở chế độ <strong>Riêng tư</strong>. Bạn có thể bật chia sẻ công
              khai bất cứ lúc nào.
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Bookmark className="size-4 mr-1.5" />
              {createMutation.isPending ? 'Đang lưu...' : 'Lưu tri thức AI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
