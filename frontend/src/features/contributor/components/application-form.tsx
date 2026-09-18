'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ContributorType, UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { ContributorApplication } from '../types/contributor.model';
import { useSubmitApplicationMutation } from '../queries/contributor.queries';
import {
  MAX_EXPERIENCE_LENGTH,
  MAX_REFERENCE_LINKS,
  submitApplicationSchema,
  type SubmitApplicationFormValues,
} from '../schemas/contributor.schema';

const TYPE_OPTIONS: Array<{ value: ContributorType; label: string; hint: string }> = [
  {
    value: ContributorType.EXPERIENCED_PRACTITIONER,
    label: 'Người ăn chay kinh nghiệm',
    hint: 'Chia sẻ công thức, mẹo nấu chay thực tế',
  },
  {
    value: ContributorType.NUTRITION_EXPERT,
    label: 'Chuyên gia dinh dưỡng',
    hint: 'Tư vấn, tin tức dinh dưỡng chuyên sâu',
  },
];

/**
 * Form nộp đơn contributor. Chặn: admin, đã có đơn chờ, còn thời gian chờ.
 * Không cấp quyền gì khi nộp — chỉ tạo đơn PENDING.
 */
export function ApplicationForm({ existing }: { existing: ContributorApplication[] }) {
  const { user } = useAuthStore();
  const submitMutation = useSubmitApplicationMutation();
  const [links, setLinks] = React.useState<string[]>(['']);
  const [requestedType, setRequestedType] = React.useState<ContributorType>(
    ContributorType.EXPERIENCED_PRACTITIONER
  );

  const pending = existing.find((app) => app.status === 'PENDING');
  // Chụp 1 lần lúc mount để so cooldown (tránh Date.now() trong render).
  const [now] = React.useState(() => Date.now());
  const cooling = existing.find(
    (app) =>
      app.status === 'REJECTED' && app.reapplyEligibleAt && app.reapplyEligibleAt.getTime() > now
  );
  // Nhóm đã duyệt (nếu có) — đổi subtype phải khác nhóm hiện tại.
  const approved = existing.find((app) => app.status === 'APPROVED');
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<SubmitApplicationFormValues>({
    resolver: zodResolver(submitApplicationSchema),
    defaultValues: {
      requestedType: ContributorType.EXPERIENCED_PRACTITIONER,
      experience: '',
      referenceLinks: [],
    },
  });

  if (user?.role === UserRole.ADMIN) return null;

  if (pending) {
    return (
      <p className="rounded-xl border bg-muted/60 p-4 text-sm">
        Bạn đã có đơn đang chờ duyệt. Hãy theo dõi kết quả ở lịch sử bên dưới thay vì gửi đơn mới.
      </p>
    );
  }

  if (cooling?.reapplyEligibleAt) {
    const date = cooling.reapplyEligibleAt.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return (
      <p className="rounded-xl border bg-muted/60 p-4 text-sm">
        Đơn trước chưa đủ điều kiện. Bạn có thể nộp lại từ ngày {date}.
      </p>
    );
  }

  const onSubmit = async (values: SubmitApplicationFormValues) => {
    // Đổi subtype phải khác nhóm đã duyệt (CONTRIBUTOR_TYPE_UNCHANGED).
    if (approved?.approvedType && values.requestedType === approved.approvedType) {
      setFormError(
        `Bạn đã là ${approved.approvedTypeLabel ?? 'nhóm này'}. Vui lòng chọn nhóm khác để đổi.`
      );
      return;
    }
    setFormError(null);
    try {
      await submitMutation.mutateAsync({
        requestedType: values.requestedType,
        experience: values.experience,
        referenceLinks: values.referenceLinks,
      });
      form.reset();
      setLinks(['']);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  const setLink = (index: number, value: string) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    form.setValue(
      'referenceLinks',
      [...links.slice(0, index), value, ...links.slice(index + 1)].filter(
        (link) => link.trim().length > 0
      ),
      { shouldValidate: false }
    );
  };

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label>Nhóm đóng góp mong muốn</Label>
        <RadioGroup
          value={requestedType}
          onValueChange={(value) => {
            const next = value as ContributorType;
            setRequestedType(next);
            form.setValue('requestedType', next, { shouldValidate: true });
          }}
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {TYPE_OPTIONS.map((option) => {
            const isSelected = requestedType === option.value;
            return (
              <label
                key={option.value}
                htmlFor={`ctype-${option.value}`}
                onClick={() => {
                  setRequestedType(option.value);
                  form.setValue('requestedType', option.value, { shouldValidate: true });
                }}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`ctype-${option.value}`}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </div>
              </label>
            );
          })}
        </RadioGroup>
        {form.formState.errors.requestedType && (
          <p className="text-xs text-destructive">{form.formState.errors.requestedType.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contrib-experience">Kinh nghiệm của bạn (tối thiểu 20 ký tự)</Label>
        <Textarea
          id="contrib-experience"
          rows={5}
          maxLength={MAX_EXPERIENCE_LENGTH}
          placeholder="Mô tả hành trình ăn chay, kinh nghiệm nấu nướng hoặc chuyên môn dinh dưỡng..."
          {...form.register('experience')}
        />
        {form.formState.errors.experience && (
          <p className="text-xs text-destructive">{form.formState.errors.experience.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Link tham khảo{' '}
          <span className="font-normal text-muted-foreground">
            (tùy chọn, tối đa {MAX_REFERENCE_LINKS})
          </span>
        </Label>
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(index, e.target.value)}
            />
            {links.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Xóa link"
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {links.length < MAX_REFERENCE_LINKS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setLinks((prev) => [...prev, ''])}
          >
            <Plus data-icon="inline-start" /> Thêm link
          </Button>
        )}
        {form.formState.errors.referenceLinks && (
          <p className="text-xs text-destructive">{form.formState.errors.referenceLinks.message}</p>
        )}
      </div>

      <Button type="submit" disabled={submitMutation.isPending}>
        {submitMutation.isPending
          ? 'Đang gửi...'
          : approved
            ? 'Gửi yêu cầu đổi nhóm'
            : 'Gửi đơn đăng ký'}
      </Button>
      {formError && <p className="text-xs text-destructive">{formError}</p>}
    </form>
  );
}
