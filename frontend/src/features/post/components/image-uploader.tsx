'use client';

import * as React from 'react';
import { SafeImage } from '@/components/shared/safe-image';
import { UploadCloud, X, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { validateImageFile } from '../utils/media-validator';
import { uploadApi, toUploadedMeta, type UploadedMediaMeta } from '../api/upload.api';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string, meta?: UploadedMediaMeta | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = React.useState<number>(0);
  const [dragOver, setDragOver] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error('Tệp không hợp lệ', {
        description: validation.error,
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadPercent(0);

      const signatureData = await uploadApi.getUploadSignature({
        resourceType: 'image',
      });

      const res = await uploadApi.uploadToCloudinary(file, signatureData, (pct) => {
        setUploadPercent(pct);
      });

      onChange(res.secure_url || res.url, toUploadedMeta(res, file.type));
      if (signatureData.apiKey === 'mock_api_key') {
        // Backend chưa phục vụ chữ ký: URL chỉ là preview tạm (blob:), tạo bài
        // sẽ bị backend từ chối. Báo rõ để user không submit trong im lặng.
        toast.warning('Máy chủ upload chưa phản hồi — ảnh chỉ xem trước tạm thời.', {
          description:
            'Bài viết dùng ảnh này sẽ bị từ chối khi gửi. Hãy thử lại khi backend sẵn sàng.',
        });
      } else {
        toast.success('Đã tải ảnh lên thành công!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh lên';
      toast.error('Lỗi khi tải ảnh', {
        description: msg,
      });
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('', null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {value ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-muted">
          <SafeImage
            src={value}
            fallbackSrc="/logo/logo-mark.png"
            alt="Ảnh xem trước"
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              disabled={disabled || isUploading}
              className="rounded-full gap-1.5 shadow-md"
            >
              <X className="h-4 w-4" /> Xóa ảnh
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="rounded-full gap-1.5 shadow-md"
            >
              <ImagePlus className="h-4 w-4" /> Thay ảnh khác
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-colors text-center',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/30',
            (disabled || isUploading) && 'pointer-events-none opacity-60'
          )}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3 py-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold text-foreground">
                Đang tải ảnh lên... {uploadPercent}%
              </p>
              <Progress value={uploadPercent} className="h-2" />
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Kéo thả hoặc bấm để chọn ảnh bìa
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Định dạng hỗ trợ: JPG, PNG, WebP • Dung lượng tối đa: 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
