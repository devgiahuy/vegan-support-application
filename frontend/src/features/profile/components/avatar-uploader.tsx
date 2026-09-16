'use client';

import * as React from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { avatarUploadApi } from '../api/avatar-upload.api';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return `Định dạng ảnh không hợp lệ (${file.type || 'không rõ'}). Chỉ chấp nhận JPG, PNG hoặc WebP.`;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'Dung lượng ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.';
  }
  return null;
}

/**
 * Uploader ảnh đại diện: chọn file → xin signature → upload Cloudinary
 * → trả `secure_url` qua `onChange`. Nhận Model `string`, không đọc DTO.
 * Upload mock (`blob:`) chỉ để xem trước, form sẽ chặn submit.
 */
export function AvatarUploader({
  value,
  fallbackInitials,
  disabled = false,
  onChange,
}: {
  value: string;
  fallbackInitials: string;
  disabled?: boolean;
  onChange: (url: string, isMock: boolean) => void;
}) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadPercent, setUploadPercent] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const trimmed = (value ?? '').trim();

  const handleFile = async (file: File) => {
    const error = validateAvatarFile(file);
    if (error) {
      toast.error('Tệp không hợp lệ', { description: error });
      return;
    }
    try {
      setIsUploading(true);
      setUploadPercent(0);
      const signature = await avatarUploadApi.getSignature();
      const result = await avatarUploadApi.uploadToCloudinary(file, signature, (pct) =>
        setUploadPercent(pct)
      );
      onChange(result.secureUrl, signature.isMock);
      if (signature.isMock) {
        toast.warning('Máy chủ upload chưa phản hồi — ảnh chỉ xem trước tạm thời.', {
          description: 'Hãy thử lại khi backend sẵn sàng trước khi bấm Cập nhật.',
        });
      } else {
        toast.success('Đã tải ảnh lên thành công!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh lên';
      toast.error('Lỗi khi tải ảnh', { description: msg });
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('', false);
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-2xl">
        {trimmed.length > 0 && <AvatarImage src={trimmed} alt="Xem trước ảnh đại diện" />}
        <AvatarFallback className="rounded-2xl bg-primary/10 text-xl text-primary">
          {fallbackInitials || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">Ảnh đại diện</p>
        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Đang tải ảnh lên... {uploadPercent}%
            </p>
            <Progress value={uploadPercent} className="h-2" />
          </div>
        ) : (
          <div className={cn('flex flex-wrap items-center gap-2')}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> {trimmed ? 'Thay ảnh khác' : 'Chọn ảnh'}
            </Button>
            {trimmed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={disabled || isUploading}
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" /> Xóa ảnh
              </Button>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Tối đa 5 MB.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || isUploading}
          aria-label="Chọn ảnh đại diện"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void handleFile(e.target.files[0]);
            }
          }}
        />
      </div>
    </div>
  );
}
