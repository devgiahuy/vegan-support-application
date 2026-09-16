'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateBasicProfileMutation } from '../queries/profile.queries';
import { basicProfileSchema, type BasicProfileFormValues } from '../schemas/profile.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { AvatarUploader } from './avatar-uploader';

/**
 * Form cập nhật tên hiển thị + ảnh đại diện (upload file → URL Cloudinary).
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
  // `true` khi ảnh hiện tại chỉ là preview mock (`blob:`) vì backend
  // upload chưa phục vụ — phải chặn submit để BE không 400.
  const [isMockAvatar, setIsMockAvatar] = React.useState(false);

  const form = useForm<BasicProfileFormValues>({
    resolver: zodResolver(basicProfileSchema),
    defaultValues: { displayName: initialDisplayName, avatarUrl: initialAvatarUrl },
  });

  // Đồng bộ lại khi profile tải xong sau lần render đầu.
  React.useEffect(() => {
    form.reset({ displayName: initialDisplayName, avatarUrl: initialAvatarUrl });
    setIsMockAvatar(false);
  }, [form, initialDisplayName, initialAvatarUrl]);

  const { isDirty } = form.formState;
  const avatarValue = form.watch('avatarUrl') ?? '';

  const onSubmit = async (values: BasicProfileFormValues) => {
    setFormError(null);
    const payload: { displayName?: string; avatarUrl?: string | null } = {};
    const name = (values.displayName ?? '').trim();
    const avatar = (values.avatarUrl ?? '').trim();
    if (name.length > 0 && name !== initialDisplayName) payload.displayName = name;
    if (avatar !== initialAvatarUrl) {
      // Chặn preview mock (`blob:`) — chỉ gửi URL http(s) thật hoặc xóa ảnh.
      if (avatar.startsWith('blob:') || isMockAvatar) {
        setFormError('Ảnh chưa tải lên máy chủ. Vui lòng thử lại khi backend sẵn sàng.');
        return;
      }
      payload.avatarUrl = avatar.length > 0 ? avatar : null;
    }
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

      <AvatarUploader
        value={avatarValue}
        fallbackInitials={fallbackInitials}
        disabled={updateMutation.isPending}
        onChange={(url, isMock) => {
          setIsMockAvatar(isMock);
          form.setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: false });
        }}
      />
      {form.formState.errors.avatarUrl && (
        <p className="text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p>
      )}

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
