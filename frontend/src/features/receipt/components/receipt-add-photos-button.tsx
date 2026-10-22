'use client';

import * as React from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadWithReservation, validateUploadFile } from '@/features/storage/api/storage-upload';
import { useAddReceiptImagesMutation } from '../queries/receipt.queries';
import type { ReceiptJob } from '../types/receipt.model';

const MAX_RECEIPT_IMAGES = 4;

export interface ReceiptAddPhotosButtonProps {
  job: ReceiptJob;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ReceiptAddPhotosButton({
  job,
  disabled = false,
  className,
  variant = 'outline',
  size = 'sm',
}: ReceiptAddPhotosButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const addImagesMutation = useAddReceiptImagesMutation(job.id);

  const currentCount = job.images.length;
  const remainingSlots = Math.max(0, MAX_RECEIPT_IMAGES - currentCount);
  const canAdd = job.canAddImages && remainingSlots > 0 && !disabled && !isUploading;

  const handleClick = () => {
    if (!canAdd) {
      if (remainingSlots <= 0) {
        toast.warning(`Phiên quét đã đạt giới hạn tối đa ${MAX_RECEIPT_IMAGES} ảnh hóa đơn.`);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    if (fileArray.length > remainingSlots) {
      toast.error(
        `Bạn chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (tổng tối đa ${MAX_RECEIPT_IMAGES} ảnh/phiên).`
      );
      e.target.value = '';
      return;
    }

    // Validate files
    for (const file of fileArray) {
      const validation = validateUploadFile(file, 'RECEIPT_IMAGE');
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error || 'Định dạng tệp không hợp lệ'}`);
        e.target.value = '';
        return;
      }
    }

    try {
      setIsUploading(true);
      const assetIds: string[] = [];

      for (const file of fileArray) {
        const asset = await uploadWithReservation(file, {
          kind: 'RECEIPT_IMAGE',
        });
        assetIds.push(asset.id);
      }

      await addImagesMutation.mutateAsync({ imageAssetIds: assetIds });
    } catch {
      // Error is handled via mutation/storage error toast
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (remainingSlots <= 0 || !job.canAddImages) {
    return null;
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={!canAdd}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={!canAdd}
        onClick={handleClick}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải ảnh...
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-4 w-4" />
            Thêm ảnh ({currentCount}/{MAX_RECEIPT_IMAGES})
          </>
        )}
      </Button>
    </>
  );
}
