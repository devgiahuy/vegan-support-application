import axios from 'axios';
import { Platform } from 'react-native';
import type { ProviderUploadResponseDto } from '../types/storage.dto';
import type { MediaAsset, ReservationInput, UploadAttempt } from '../types/storage.model';
import { storageMapper } from '../mappers/storage.mapper';
import { storageApi } from './storage.api';
import { runImageUpload, type ImageUploadTransport } from './upload-workflow';

const transport: ImageUploadTransport = {
  reserve: storageApi.reserve,
  commit: storageApi.commit,
  release: storageApi.release,
  async send(config, image, progress) {
    const form = new FormData();
    if (Platform.OS === 'web') {
      if (!image.file) throw new Error('Không đọc được tệp ảnh đã chọn.');
      form.append('file', image.file);
    } else {
      // React Native serializes URI file descriptors as multipart file parts.
      form.append('file', {
        uri: image.uri,
        name: image.name,
        type: image.mimeType,
      } as unknown as Blob);
    }
    Object.entries(config.fields).forEach(([name, value]) => form.append(name, value));
    const res = await axios.post<ProviderUploadResponseDto>(config.url, form, {
      timeout: 120000,
      onUploadProgress: (event) => {
        if (event.total) progress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
      },
    });
    return storageMapper.toProviderReceipt(res.data);
  },
};

export function uploadImage(
  input: ReservationInput,
  progress: (percent: number) => void,
  attempt: UploadAttempt
): Promise<MediaAsset> {
  return runImageUpload(input, progress, attempt, transport);
}
