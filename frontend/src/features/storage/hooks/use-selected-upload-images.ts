import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { validateUploadFile } from '@/features/storage/api/storage-upload';
import type { MediaKind } from '@/features/storage/types/storage.model';

export interface SelectedUploadImage {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
  assetId?: string;
}

interface SelectedUploadImagesOptions {
  kind: MediaKind;
  maxImages: number;
  imageLabel?: string;
  idPrefix: string;
  isUploading: boolean;
}

export interface InvalidUploadFile {
  name: string;
  error: string;
}

/**
 * Gom thông báo lỗi xác thực nhiều file thành đúng 1 toast để tránh hiển thị hàng loạt
 * khi người dùng chọn cùng lúc nhiều tệp không hợp lệ.
 */
export function formatInvalidUploadFilesMessage(
  invalidFiles: InvalidUploadFile[]
): { title: string; description?: string } | null {
  if (invalidFiles.length === 0) return null;
  if (invalidFiles.length === 1) {
    const [single] = invalidFiles;
    return { title: `${single.name}: ${single.error}` };
  }

  const preview = invalidFiles.slice(0, 2).map((item) => `${item.name}: ${item.error}`);
  const remaining = invalidFiles.length - preview.length;
  const description =
    remaining > 0 ? [...preview, `... và ${remaining} tệp khác.`].join('\n') : preview.join('\n');

  return {
    title: `Không thể thêm ${invalidFiles.length} ảnh không hợp lệ.`,
    description,
  };
}

export function useSelectedUploadImages({
  kind,
  maxImages,
  imageLabel,
  idPrefix,
  isUploading,
}: SelectedUploadImagesOptions) {
  const [selectedImages, setSelectedImages] = useState<SelectedUploadImage[]>([]);
  const [previewingImage, setPreviewingImage] = useState<SelectedUploadImage | null>(null);
  const selectedImagesRef = useRef(selectedImages);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (selectedImages.length + fileArray.length > maxImages) {
      toast.error(
        `Bạn chỉ có thể chọn tối đa ${maxImages} ảnh${imageLabel ? ` ${imageLabel}` : ''} cho mỗi lần quét.`
      );
      return;
    }

    const newItems: SelectedUploadImage[] = [];
    const invalidFiles: InvalidUploadFile[] = [];
    for (const file of fileArray) {
      const validation = validateUploadFile(file, kind);
      if (!validation.valid) {
        invalidFiles.push({
          name: file.name,
          error: validation.error || 'Tệp không hợp lệ',
        });
        continue;
      }

      newItems.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${idPrefix}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'idle',
      });
    }

    const invalidMessage = formatInvalidUploadFilesMessage(invalidFiles);
    if (invalidMessage) {
      toast.error(
        invalidMessage.title,
        invalidMessage.description ? { description: invalidMessage.description } : undefined
      );
    }

    if (newItems.length > 0) {
      setSelectedImages((previous) => [...previous, ...newItems]);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    if (isUploading) return;
    setSelectedImages((previous) => {
      const target = previous.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return previous.filter((image) => image.id !== id);
    });
    if (previewingImage?.id === id) setPreviewingImage(null);
  };

  const handleClearAll = () => {
    if (isUploading) return;
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    setPreviewingImage(null);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedImages.length || isUploading) return;
    setSelectedImages((previous) => {
      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return {
    selectedImages,
    setSelectedImages,
    previewingImage,
    setPreviewingImage,
    handleFilesAdded,
    handleRemoveImage,
    handleClearAll,
    handleMoveImage,
  };
}
