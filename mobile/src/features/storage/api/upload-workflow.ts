import { isAxiosError } from 'axios';
import { createOperationKey } from '@/lib/operation-key';
import type {
  MediaAsset,
  ProviderUploadReceipt,
  ReservationInput,
  SelectedImage,
  UploadAttempt,
  UploadConfiguration,
  UploadReservation,
} from '../types/storage.model';

export interface ImageUploadTransport {
  reserve: (input: ReservationInput) => Promise<UploadReservation>;
  send: (
    config: UploadConfiguration,
    image: SelectedImage,
    progress: (percent: number) => void
  ) => Promise<ProviderUploadReceipt>;
  commit: (id: string, receipt: ProviderUploadReceipt) => Promise<UploadReservation>;
  release: (id: string) => Promise<UploadReservation>;
}

export async function runImageUpload(
  input: ReservationInput,
  progress: (percent: number) => void,
  attempt: UploadAttempt,
  transport: ImageUploadTransport
): Promise<MediaAsset> {
  let commitAttempted = Boolean(attempt.receipt);
  try {
    if (!attempt.receipt || !attempt.reservationId) {
      const reservation = await transport.reserve({ ...input, idempotencyKey: attempt.key });
      attempt.reservationId = reservation.id;
      const config = reservation.upload;
      if (
        !config ||
        input.image.bytes > config.maxBytes ||
        !config.allowedMimeTypes.includes(input.image.mimeType)
      )
        throw new Error('Ảnh không đáp ứng giới hạn tải lên của tài khoản.');
      attempt.receipt = await transport.send(config, input.image, progress);
    }
    commitAttempted = true;
    let committed: UploadReservation;
    try {
      committed = await transport.commit(attempt.reservationId, attempt.receipt);
    } catch (error) {
      if (!isAxiosError(error) || error.response) throw error;
      committed = await transport.commit(attempt.reservationId, attempt.receipt);
    }
    if (!committed.asset) throw new Error('Không nhận được ảnh sau khi xác nhận tải lên.');
    progress(100);
    return committed.asset;
  } catch (error) {
    // Retain the receipt when a commit response is lost; retry the same commit.
    if (
      attempt.reservationId &&
      (!commitAttempted || (isAxiosError(error) && error.response && error.response.status < 500))
    ) {
      try {
        await transport.release(attempt.reservationId);
        attempt.key = createOperationKey('image-upload');
        attempt.reservationId = null;
        attempt.receipt = null;
      } catch {
        /* Uncommitted reservations expire on the backend. */
      }
    }
    throw error;
  }
}
