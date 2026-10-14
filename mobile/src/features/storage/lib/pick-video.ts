import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { validateVideo, videoExtensionForMime } from '../mappers/storage.mapper';
import type { SelectedMedia } from '../types/storage.model';
import { ImagePermissionError } from './pick-image';

/**
 * Chọn một video từ thư viện hoặc quay bằng camera và kiểm tra định dạng (MP4/WebM/MOV).
 * Giới hạn dung lượng do backend quyết định nên được kiểm tra ở bước đăng ký tải lên.
 * Trả về `null` khi người dùng hủy; ném `ImagePermissionError` khi thiếu quyền.
 */
export async function pickVideo(
  source: 'camera' | 'library',
  options: { baseName?: string } = {}
): Promise<SelectedMedia | null> {
  const camera = source === 'camera';
  if (Platform.OS !== 'web') {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new ImagePermissionError(camera);
  }
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['videos'],
    // Không để hệ thống nén lại: tệp gửi lên giữ đúng định dạng đã khai báo.
    videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(pickerOptions)
    : await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled) return null;

  const asset = result.assets[0];
  const mimeType = asset.file?.type || asset.mimeType || '';
  const video: SelectedMedia = {
    uri: asset.uri,
    name: `${options.baseName ?? 'video'}.${videoExtensionForMime(mimeType)}`,
    mimeType,
    bytes: asset.fileSize ?? asset.file?.size ?? 0,
    ...(asset.file ? { file: asset.file } : {}),
  };
  validateVideo(video);
  return video;
}
