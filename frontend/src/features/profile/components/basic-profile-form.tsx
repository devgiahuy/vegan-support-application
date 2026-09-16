'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateBasicProfileMutation } from '../queries/profile.queries';
import { basicProfileSchema, type BasicProfileFormValues } from '../schemas/profile.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';

/**
 * Form cập nhật tên hiển thị + ảnh đại diện (URL HTTP(S)).
 * Nút lưu vô hiệu hóa khi không có thay đổi — PATCH yêu cầu ít nhất 1 field.
 */
export function BasicProfileForm({
  initialDisplayName,
  initialAvatarUrl,
  fallbackInitials,
}: {
  initialDisplayName: string;
  initialAvatarUrl: string;
  fallbackInitials: string;
}) {
  const updateMutation = useUpdateBasicProfileMutation();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<BasicProfileFormValues>({
    resolver: zodResolver(basicProfileSchema),
    defaultValues: { displayName: initialDisplayName, avatarUrl: initialAvatarUrl },
  });

  // Đồng bộ lại khi profile tải xong sau lần render đầu.
  React.useEffect(() => {
    form.reset({ displayName: initialDisplayName, avatarUrl: initialAvatarUrl });
  }, [form, initialDisplayName, initialAvatarUrl]);

  const { isDirty } = form.formState;
  const avatarPreview = (form.watch('avatarUrl') ?? '').trim();

  const onSubmit = async (values: BasicProfileFormValues) => {
    setFormError(null);
    const payload: { displayName?: string; avatarUrl?: string | null } = {};
    const name = (values.displayName ?? '').trim();
    const avatar = (values.avatarUrl ?? '').trim();
    if (name.length > 0 && name !== initialDisplayName) payload.displayName = name;
    if (avatar !== initialAvatarUrl) payload.avatarUrl = avatar.length > 0 ? avatar : null;
    if (Object.keys(payload).length === 0) return;

    try {
      await updateMutation.mutateAsync(payload);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            if (
              key === 'displayName' ||
              key === 'display_name' ||
              key === 'avatarUrl' ||
              key === 'avatar_url'
            ) {
              const field = key.includes('avatar') ? 'avatarUrl' : 'displayName';
              const first = Array.isArray(messages) ? messages[0] : messages;
              form.setError(field, {
                message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
              });
              mapped = true;
            }
          }
        }
        if (mapped) return;
      }
      setFormError('Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-2xl">
          {avatarPreview.startsWith('http') && (
            <AvatarImage src={avatarPreview} alt="Xem trước ảnh đại diện" />
          )}
          <AvatarFallback className="rounded-2xl bg-primary/10 text-xl text-primary">
            {fallbackInitials || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="profile-avatarUrl">URL ảnh đại diện (để trống để xóa ảnh)</Label>
          <div className="relative">
            <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-avatarUrl"
              type="url"
              inputMode="url"
              placeholder="https://..."
              className="pl-9"
              {...form.register('avatarUrl')}
            />
          </div>
          {form.formState.errors.avatarUrl && (
            <p className="text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-displayName">Tên hiển thị</Label>
        <Input
          id="profile-displayName"
          placeholder="Tên hiển thị của bạn"
          maxLength={100}
          {...form.register('displayName')}
        />
        {form.formState.errors.displayName && (
          <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="rounded-full"
        disabled={!isDirty || updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Đang lưu...' : 'Cập nhật thông tin'}
      </Button>
    </form>
  );
}
