import * as React from 'react';
import { createOperationKey } from '@/lib/operation-key';
import { useUploadImageMutation } from '../queries/storage.queries';
import type { MediaAsset, SelectedImage, UploadAttempt } from '../types/storage.model';
import { storageErrorMessage } from './storage-errors';

/**
 * Tải một ảnh bìa (hoặc video khi `kind` là `VIDEO`) lên (reserve → gửi Cloudinary → commit) kèm tiến độ và thử lại.
 * `retry` dùng lại cùng `UploadAttempt`, nên nếu phản hồi commit bị mất thì commit lại đúng phiên cũ thay vì tải lại ảnh.
 * Không đụng tới luồng upload sẵn có (`useUploadImageMutation`) mà avatar và scan đang dùng chung.
 */
export function useImageUpload(kind: 'COVER_IMAGE' | 'VIDEO' = 'COVER_IMAGE') {
  const mutation = useUploadImageMutation();
  const pending = React.useRef<{ image: SelectedImage; attempt: UploadAttempt } | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [failed, setFailed] = React.useState(false);

  const run = React.useCallback(async (): Promise<MediaAsset | null> => {
    const current = pending.current;
    if (!current) return null;
    setError('');
    setFailed(false);
    setProgress(0);
    try {
      const asset = await mutation.mutateAsync({
        input: { kind, image: current.image, idempotencyKey: current.attempt.key },
        onProgress: setProgress,
        attempt: current.attempt,
      });
      pending.current = null;
      return asset;
    } catch (value) {
      setError(storageErrorMessage(value));
      setFailed(true);
      return null;
    }
  }, [mutation, kind]);

  const start = React.useCallback(
    (image: SelectedImage) => {
      pending.current = {
        image,
        attempt: { key: createOperationKey(kind === 'VIDEO' ? 'video-upload' : 'cover-upload'), reservationId: null, receipt: null },
      };
      return run();
    },
    [run, kind]
  );

  const reset = React.useCallback(() => {
    pending.current = null;
    setError('');
    setFailed(false);
    setProgress(0);
  }, []);

  return {
    start,
    retry: run,
    reset,
    progress,
    uploading: mutation.isPending,
    error,
    /** Có ảnh đã chọn nhưng tải lên thất bại và còn thử lại được. */
    canRetry: failed,
  };
}
