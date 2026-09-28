'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2, Link2, Plus, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ContributorApprovalBasis, UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { ContributorApplication } from '../types/contributor.model';
import { useSubmitApplicationMutation } from '../queries/contributor.queries';
import {
  MAX_EXPERIENCE_LENGTH,
  MAX_REFERENCE_LINKS,
  submitApplicationSchema,
  type SubmitApplicationFormValues,
} from '../schemas/contributor.schema';

const BASIS_OPTIONS = [
  {
    value: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
    label: 'Tổ chức đối tác / Viện ẩm thực',
    hint: 'Trực thuộc hoặc đại diện tổ chức, viện nghiên cứu, hội đoàn ẩm thực chay',
    icon: Building2,
  },
  {
    value: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
    label: 'Thành viên uy tín trên nền tảng',
    hint: 'Đã có lịch sử hoạt động tích cực, chia sẻ nội dung chay chất lượng cho cộng đồng',
    icon: Sparkles,
  },
] as const;

/**
 * Form nộp đơn đăng ký Contributor chuẩn Phase 14 (Unified Contributor).
 * Không phân quyền subtype; chỉ ghi nhận nguyện vọng và căn cứ đề xuất.
 */
export function ApplicationForm({ existing }: { existing: ContributorApplication[] }) {
  const { user } = useAuthStore();
  const submitMutation = useSubmitApplicationMutation();
  const [links, setLinks] = React.useState<string[]>(['']);
  const [claimedBasis, setClaimedBasis] = React.useState<
    | ContributorApprovalBasis.ORGANIZATION_AFFILIATION
    | ContributorApprovalBasis.PLATFORM_TRACK_RECORD
  >(ContributorApprovalBasis.ORGANIZATION_AFFILIATION);

  const pending = existing.find((app) => app.status === 'PENDING');
  // Chụp 1 lần lúc mount để so sánh cooldown
  const [now] = React.useState(() => Date.now());
  const cooling = existing.find(
    (app) =>
      app.status === 'REJECTED' && app.reapplyEligibleAt && app.reapplyEligibleAt.getTime() > now
  );

  const form = useForm<SubmitApplicationFormValues>({
    resolver: zodResolver(submitApplicationSchema),
    defaultValues: {
      claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
      organizationClaim: '',
      experience: '',
      referenceLinks: [],
    },
  });

  if (user?.role === UserRole.ADMIN) return null;

  if (user?.role === UserRole.CONTRIBUTOR) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-primary">Bạn đang là Người đóng góp (Contributor)</p>
          <p className="mt-1 text-muted-foreground">
            Tài khoản của bạn đã được Quản trị viên kích hoạt toàn bộ quyền hạn đóng góp công thức,
            cẩm nang ẩm thực chay và xác thực nội dung cộng đồng.
          </p>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="rounded-xl border bg-muted/60 p-4 text-sm text-foreground">
        <p className="font-medium text-foreground">Hồ sơ của bạn đang được xử lý</p>
        <p className="mt-1 text-muted-foreground">
          Bạn đã có một đơn đăng ký đang ở trạng thái chờ duyệt. Vui lòng theo dõi kết quả thẩm định
          tại bảng lịch sử bên dưới thay vì gửi thêm đơn mới.
        </p>
      </div>
    );
  }

  if (cooling?.reapplyEligibleAt) {
    const date = cooling.reapplyEligibleAt.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-foreground">
        <p className="font-medium text-amber-700 dark:text-amber-400">
          Chưa đến thời hạn nộp lại hồ sơ
        </p>
        <p className="mt-1 text-muted-foreground">
          Hồ sơ trước của bạn chưa đủ điều kiện. Bạn có thể cập nhật thêm thông tin và gửi lại đơn
          xét duyệt từ ngày <strong className="text-foreground">{date}</strong>.
        </p>
      </div>
    );
  }

  const onSubmit = async (values: SubmitApplicationFormValues) => {
    try {
      await submitMutation.mutateAsync({
        claimedApprovalBasis: values.claimedApprovalBasis,
        experience: values.experience,
        organizationClaim: values.organizationClaim,
        referenceLinks: values.referenceLinks,
      });
      form.reset({
        claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        organizationClaim: '',
        experience: '',
        referenceLinks: [],
      });
      setLinks(['']);
    } catch {
      // Lỗi đã được xử lý toast ở query layer
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
        <Label>Căn cứ đề xuất phê duyệt</Label>
        <RadioGroup
          value={claimedBasis}
          onValueChange={(value) => {
            const next = value as typeof claimedBasis;
            setClaimedBasis(next);
            form.setValue('claimedApprovalBasis', next, { shouldValidate: true });
          }}
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {BASIS_OPTIONS.map((option) => {
            const isSelected = claimedBasis === option.value;
            const IconComponent = option.icon;
            return (
              <label
                key={option.value}
                htmlFor={`basis-${option.value}`}
                onClick={() => {
                  setClaimedBasis(option.value);
                  form.setValue('claimedApprovalBasis', option.value, { shouldValidate: true });
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
                  id={`basis-${option.value}`}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <IconComponent className="size-4 text-primary" />
                    <span>{option.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </div>
              </label>
            );
          })}
        </RadioGroup>
        {form.formState.errors.claimedApprovalBasis && (
          <p className="text-xs text-destructive">
            {form.formState.errors.claimedApprovalBasis.message}
          </p>
        )}
      </div>

      {claimedBasis === ContributorApprovalBasis.ORGANIZATION_AFFILIATION && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contrib-org-claim">
            Tên tổ chức / Hội đoàn liên kết <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contrib-org-claim"
            placeholder="Ví dụ: Hội Đầu bếp Chay Việt Nam, Viện Ẩm thực..."
            {...form.register('organizationClaim')}
          />
          {form.formState.errors.organizationClaim && (
            <p className="text-xs text-destructive">
              {form.formState.errors.organizationClaim.message}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contrib-experience">
          Kinh nghiệm & Nguyện vọng đóng góp (tối thiểu 20 ký tự)
        </Label>
        <Textarea
          id="contrib-experience"
          rows={5}
          maxLength={MAX_EXPERIENCE_LENGTH}
          placeholder="Mô tả hành trình thực hành ăn chay, kinh nghiệm xây dựng thực đơn hoặc chuyên môn dinh dưỡng của bạn..."
          {...form.register('experience')}
        />
        {form.formState.errors.experience && (
          <p className="text-xs text-destructive">{form.formState.errors.experience.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Liên kết minh chứng tham khảo{' '}
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
            <Plus data-icon="inline-start" /> Thêm liên kết
          </Button>
        )}
        {form.formState.errors.referenceLinks && (
          <p className="text-xs text-destructive">{form.formState.errors.referenceLinks.message}</p>
        )}
      </div>

      <Button type="submit" disabled={submitMutation.isPending} className="mt-2">
        {submitMutation.isPending ? 'Đang gửi đơn...' : 'Gửi đơn đăng ký Contributor'}
      </Button>
    </form>
  );
}
