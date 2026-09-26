'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle, HardDrive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStorageUsageQuery } from '@/features/storage/queries/storage.queries';

interface CustomMealPhotoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  maxFiles?: number;
  currentCount?: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CustomMealPhotoUploader: React.FC<CustomMealPhotoUploaderProps> = ({
  onUpload,
  disabled = false,
  maxFiles = 10,
  currentCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Truy vấn hạn ngạch lưu trữ tài khoản từ Phase 15
  const { data: storageUsage } = useStorageUsageQuery();

  const isLimitReached = currentCount >= maxFiles;
  const remainingBytes = storageUsage ? storageUsage.usage.remainingBytes : null;
  const isStorageExceeded = remainingBytes !== null && remainingBytes <= 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Kiểm tra định dạng
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Định dạng tệp không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
      return;
    }

    // Kiểm tra kích thước tệp tối đa (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Dung lượng tệp vượt quá mức cho phép (tối đa 5 MB mỗi ảnh).');
      return;
    }

    // Kiểm tra hạn ngạch lưu trữ tài khoản
    if (remainingBytes !== null && file.size > remainingBytes) {
      toast.error(
        'Dung lượng lưu trữ tài khoản của bạn không đủ để tải ảnh này. Vui lòng dọn dẹp bộ nhớ trước.'
      );
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
      toast.success('Tải ảnh món ăn thành công!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải ảnh lên';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading || isLimitReached || isStorageExceeded}
      />

      <div
        onClick={() => {
          if (!disabled && !isUploading && !isLimitReached && !isStorageExceeded) {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
          disabled || isLimitReached || isStorageExceeded
            ? 'opacity-50 cursor-not-allowed bg-muted/20 border-muted'
            : 'hover:bg-primary/5 hover:border-primary/50 border-input bg-background/50'
        }`}
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <UploadCloud className="w-6 h-6 text-muted-foreground" />
        )}

        <div className="text-xs font-medium text-foreground">
          {isUploading
            ? 'Đang tải ảnh lên...'
            : isLimitReached
              ? `Đã đạt giới hạn tối đa ${maxFiles} ảnh`
              : isStorageExceeded
                ? 'Hạn ngạch lưu trữ tài khoản đã hết'
                : 'Nhấn hoặc kéo thả để tải ảnh món ăn thực tế'}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Hỗ trợ JPG, PNG, WebP (tối đa 5 MB/ảnh) • {currentCount}/{maxFiles} ảnh
        </p>
      </div>

      {/* Thông tin dung lượng còn lại */}
      {storageUsage && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-muted-foreground" />
            Dung lượng khả dụng:
          </span>
          <span
            className={isStorageExceeded ? 'text-destructive font-semibold' : 'text-foreground'}
          >
            {storageUsage.usage.remainingFormatted} / {storageUsage.usage.limitFormatted}
          </span>
        </div>
      )}

      {isStorageExceeded && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Hạn ngạch bộ nhớ đã hết. Bạn cần xóa bớt ảnh cũ để có thể tải thêm ảnh mới.
        </p>
      )}
    </div>
  );
};
