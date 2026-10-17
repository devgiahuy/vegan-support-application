import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { validateImage } from '../mappers/storage.mapper';
import type { SelectedImage } from '../types/storage.model';

/** Người dùng từ chối quyền camera/thư viện; màn gọi có thể gợi ý mở cài đặt. */
export class ImagePermissionError extends Error {
  constructor(camera: boolean) {
    super(camera ? 'Cần quyền camera để chụp ảnh.' : 'Cần quyền thư viện để chọn ảnh.');
    this.name = 'ImagePermissionError';
  }
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Chọn một ảnh từ thư viện hoặc camera và kiểm tra định dạng/dung lượng theo chính sách upload.
 * Trả về `null` khi người dùng hủy. Ném `ImagePermissionError` khi thiếu quyền, `Error` khi ảnh không hợp lệ.
 */
export async function pickImage(
  source: 'camera' | 'library',
  options: { baseName?: string; aspect?: [number, number] } = {}
): Promise<SelectedImage | null> {
  const camera = source === 'camera';
  if (Platform.OS !== 'web') {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new ImagePermissionError(camera);
  }
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.85,
    ...(options.aspect ? { allowsEditing: true, aspect: options.aspect } : {}),
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(pickerOptions)
    : await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled) return null;

  const asset = result.assets[0];
  const mimeType = asset.file?.type || asset.mimeType || '';
  const image: SelectedImage = {
    uri: asset.uri,
    name: `${options.baseName ?? 'image'}.${EXTENSIONS[mimeType] ?? ''}`,
    mimeType,
    bytes: asset.fileSize ?? asset.file?.size ?? 0,
    ...(asset.file ? { file: asset.file } : {}),
  };
  validateImage(image);
  return image;
}
