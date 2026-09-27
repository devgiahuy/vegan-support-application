'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AiVerificationConclusion } from '@/common/enums';
import { useCreateAiVerificationMutation } from '../queries/ai-verification.queries';
import {
  createAiVerificationSchema,
  type CreateAiVerificationFormData,
} from '../schemas/ai-verification.schema';
import type { AiArtifact } from '../types/ai-artifact.model';

export function VerifyDialog({
  open,
  onOpenChange,
  artifact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: AiArtifact;
}) {
  const verifyMutation = useCreateAiVerificationMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAiVerificationFormData>({
    resolver: zodResolver(createAiVerificationSchema),
    defaultValues: {
      expectedArtifactVersion: artifact.version,
      conclusion: AiVerificationConclusion.VERIFIED,
      scope: 'Đánh giá tính an toàn thực vật và hàm lượng dinh dưỡng',
      evidenceNote: '',
      correction: '',
    },
  });

  const selectedConclusion = watch('conclusion');

  React.useEffect(() => {
    if (open) {
      reset({
        expectedArtifactVersion: artifact.version,
        conclusion: AiVerificationConclusion.VERIFIED,
        scope: 'Đánh giá tính an toàn thực vật và hàm lượng dinh dưỡng',
        evidenceNote: '',
        correction: '',
      });
    }
  }, [open, artifact.version, reset]);

  const onSubmit = async (values: CreateAiVerificationFormData) => {
    try {
      await verifyMutation.mutateAsync({
        artifactId: artifact.id,
        data: values,
      });
      onOpenChange(false);
    } catch {
      // Toast error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BadgeCheck className="size-4" />
            </div>
            <DialogTitle>Thẩm định & Kiểm chứng Tri thức</DialogTitle>
          </div>
          <DialogDescription>
            Đưa ra nhận xét chuyên môn và thẩm định tính chính xác của câu trả lời AI này để cộng
            đồng tham khảo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Kết luận thẩm định</Label>
            <RadioGroup
              value={selectedConclusion}
              onValueChange={(val) =>
                setValue('conclusion', val as AiVerificationConclusion, { shouldValidate: true })
              }
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                <RadioGroupItem
                  value={AiVerificationConclusion.VERIFIED}
                  id="conclusion-verified"
                />
                <Label htmlFor="conclusion-verified" className="text-xs font-normal cursor-pointer">
                  Chính xác
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                <RadioGroupItem
                  value={AiVerificationConclusion.CORRECTION_NEEDED}
                  id="conclusion-correction"
                />
                <Label
                  htmlFor="conclusion-correction"
                  className="text-xs font-normal cursor-pointer"
                >
                  Cần chỉnh lý
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                <RadioGroupItem
                  value={AiVerificationConclusion.REJECTED}
                  id="conclusion-rejected"
                />
                <Label htmlFor="conclusion-rejected" className="text-xs font-normal cursor-pointer">
                  Không chuẩn
                </Label>
              </div>
            </RadioGroup>
            {errors.conclusion?.message && (
              <p className="text-xs text-destructive">{errors.conclusion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-scope">Phạm vi thẩm định</Label>
            <Input
              id="verification-scope"
              placeholder="Ví dụ: Đối chiếu nguồn đạm thực vật và liều lượng khuyến nghị"
              {...register('scope')}
            />
            <p className="text-[11px] text-muted-foreground">
              Giới hạn cụ thể phần nội dung hoặc tiêu chí dinh dưỡng bạn đã kiểm tra.
            </p>
            {errors.scope?.message && (
              <p className="text-xs text-destructive">{errors.scope.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-evidenceNote">Ghi chú lập luận & Bằng chứng</Label>
            <Textarea
              id="verification-evidenceNote"
              placeholder="Nêu rõ căn cứ khoa học, tài liệu tham khảo hoặc kinh nghiệm thực chứng..."
              rows={3}
              {...register('evidenceNote')}
            />
            {errors.evidenceNote?.message && (
              <p className="text-xs text-destructive">{errors.evidenceNote.message}</p>
            )}
          </div>

          {selectedConclusion === AiVerificationConclusion.CORRECTION_NEEDED && (
            <div className="rounded-md border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <ShieldAlert className="size-3.5" />
                <span>Nội dung chỉnh lý đề xuất (Bắt buộc)</span>
              </div>
              <Textarea
                placeholder="Nêu rõ điểm chưa chuẩn của AI và cách điều chỉnh chính xác cho người đọc..."
                rows={3}
                className="mt-2 bg-background"
                {...register('correction')}
              />
              {errors.correction?.message && (
                <p className="text-xs text-destructive">{errors.correction.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={verifyMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? 'Đang gửi...' : 'Gửi kiểm chứng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
