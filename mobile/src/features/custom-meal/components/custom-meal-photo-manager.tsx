import * as React from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ImagePermissionError, pickImage } from '@/features/storage/lib/pick-image';
import { storageErrorMessage } from '@/features/storage/lib/storage-errors';
import { useDeleteStorageAssetMutation } from '@/features/storage/queries/storage.queries';
import { useImageUpload } from '@/features/storage/lib/use-image-upload';
import type { MediaAsset } from '@/features/storage/types/storage.model';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import {
  useAttachCustomMealPhotoMutation,
  useRemoveCustomMealPhotoMutation,
  useReorderCustomMealPhotosMutation,
} from '../queries/custom-meal.queries';
import type { CustomMeal } from '../types/custom-meal.model';
import { getCustomMealErrorMessage } from '../utils/custom-meal-errors';

const MAX_PHOTOS = 10;

/**
 * Quản lý ảnh của món riêng: thêm (chọn/chụp → tải lên → gắn), đặt làm ảnh bìa, đổi thứ tự và gỡ ảnh.
 * Ảnh đầu tiên là ảnh bìa. "Chỉ gỡ khỏi món" giữ tệp (vẫn tính dung lượng); "Gỡ và xóa tệp" xóa luôn để lấy lại dung lượng.
 * Nếu tải lên xong nhưng bước gắn lỗi, ảnh được giữ lại để gắn lại mà không phải tải lần nữa.
 */
export function CustomMealPhotoManager({ meal }: { meal: CustomMeal }) {
  const colors = useIconColors();
  const uploader = useImageUpload();
  const attach = useAttachCustomMealPhotoMutation(meal.id);
  const remove = useRemoveCustomMealPhotoMutation(meal.id);
  const reorder = useReorderCustomMealPhotosMutation(meal.id);
  const deleteAsset = useDeleteStorageAssetMutation();

  const [uploaded, setUploaded] = React.useState<MediaAsset | null>(null);
  const [error, setError] = React.useState('');
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [picking, setPicking] = React.useState(false);

  const photos = meal.photos;
  const full = photos.length >= MAX_PHOTOS;
  const busy = picking || uploader.uploading || attach.isPending || remove.isPending || reorder.isPending || deleteAsset.isPending;

  const attachAsset = async (asset: MediaAsset) => {
    try {
      await attach.mutateAsync({ assetId: asset.id, position: Math.min(photos.length, MAX_PHOTOS - 1) });
      setUploaded(null);
    } catch (value) {
      setUploaded(asset);
      setError(getCustomMealErrorMessage(value));
    }
  };

  const handleUploadResult = async (promise: Promise<MediaAsset | null>) => {
    const asset = await promise;
    if (asset) await attachAsset(asset);
  };

  const choose = async (source: 'camera' | 'library') => {
    setPicking(true);
    setError('');
    setPermissionDenied(false);
    setUploaded(null);
    let image = null;
    try {
      image = await pickImage(source, { baseName: 'meal' });
    } catch (value) {
      if (value instanceof ImagePermissionError) setPermissionDenied(true);
      setError(getApiErrorMessage(value, 'Không chọn được ảnh.'));
    } finally {
      setPicking(false);
    }
    if (image) await handleUploadResult(uploader.start(image));
  };

  const mutateWithError = async <T,>(run: () => Promise<T>) => {
    setError('');
    try {
      await run();
    } catch (value) {
      setError(getCustomMealErrorMessage(value));
    }
  };

  const move = (index: number, target: number) => {
    if (target < 0 || target >= photos.length) return;
    const ids = photos.map((photo) => photo.id);
    const [item] = ids.splice(index, 1);
    ids.splice(target, 0, item);
    void mutateWithError(() => reorder.mutateAsync(ids));
  };

  /** Gỡ khỏi món; khi `deleteFile` thì xóa luôn tệp để giải phóng dung lượng (cần tệp không còn được dùng nơi khác). */
  const removePhoto = async (assetId: string, deleteFile: boolean) => {
    setError('');
    try {
      await remove.mutateAsync(assetId);
    } catch (value) {
      setError(getCustomMealErrorMessage(value));
      return;
    }
    if (!deleteFile) return;
    try {
      await deleteAsset.mutateAsync(assetId);
    } catch (value) {
      setError(`Đã gỡ ảnh khỏi bữa ăn nhưng chưa xóa được tệp: ${storageErrorMessage(value)}`);
    }
  };

  const confirmRemove = (assetId: string) => {
    Alert.alert('Gỡ ảnh', 'Chọn cách gỡ ảnh khỏi bữa ăn này.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Chỉ gỡ khỏi món', onPress: () => void removePhoto(assetId, false) },
      { text: 'Gỡ và xóa tệp', style: 'destructive', onPress: () => void removePhoto(assetId, true) },
    ]);
  };

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-foreground">Hình ảnh thực tế</Text>
        <Text className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PHOTOS}
        </Text>
      </View>

      {photos.length === 0 ? (
        <Text className="text-sm text-muted-foreground">Chưa có ảnh. Thêm ảnh để món dễ nhận ra trong thực đơn.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {photos.map((photo, index) => (
            <View key={photo.id} className="w-[47%] gap-1.5">
              <View className="aspect-square overflow-hidden rounded-xl bg-muted">
                <Image source={{ uri: photo.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                {index === 0 ? (
                  <View className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-primary-foreground">Ảnh bìa</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đặt làm ảnh bìa"
                  disabled={busy || index === 0}
                  onPress={() => move(index, 0)}
                  className={`h-10 w-10 items-center justify-center rounded-full bg-muted ${busy || index === 0 ? 'opacity-40' : ''}`}>
                  <Star size={16} color={colors.cta} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chuyển ảnh lên trước"
                  disabled={busy || index === 0}
                  onPress={() => move(index, index - 1)}
                  className={`h-10 w-10 items-center justify-center rounded-full bg-muted ${busy || index === 0 ? 'opacity-40' : ''}`}>
                  <ChevronLeft size={16} color={colors.foreground} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chuyển ảnh ra sau"
                  disabled={busy || index === photos.length - 1}
                  onPress={() => move(index, index + 1)}
                  className={`h-10 w-10 items-center justify-center rounded-full bg-muted ${busy || index === photos.length - 1 ? 'opacity-40' : ''}`}>
                  <ChevronRight size={16} color={colors.foreground} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Gỡ ảnh"
                  disabled={busy}
                  onPress={() => confirmRemove(photo.id)}
                  className={`h-10 w-10 items-center justify-center rounded-full bg-destructive/10 ${busy ? 'opacity-40' : ''}`}>
                  <Trash2 size={16} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {uploader.uploading ? (
        <Text className="text-sm text-muted-foreground">Đang tải ảnh: {uploader.progress}%</Text>
      ) : attach.isPending ? (
        <Text className="text-sm text-muted-foreground">Đang gắn ảnh vào bữa ăn...</Text>
      ) : null}
      {error || uploader.error ? (
        <Text accessibilityRole="alert" className="text-sm text-destructive">
          {error || uploader.error}
        </Text>
      ) : null}

      {full ? (
        <Text className="text-xs text-muted-foreground">Đã đủ {MAX_PHOTOS} ảnh. Gỡ bớt ảnh để thêm ảnh mới.</Text>
      ) : (
        <View className="flex-row gap-2">
          <PrimaryButton
            label="Thêm ảnh"
            variant="outline"
            disabled={busy}
            icon={<ImagePlus size={16} color={colors.primary} />}
            onPress={() => void choose('library')}
            className="flex-1"
          />
          {Platform.OS !== 'web' ? (
            <PrimaryButton
              label="Chụp"
              variant="outline"
              disabled={busy}
              icon={<Camera size={16} color={colors.primary} />}
              onPress={() => void choose('camera')}
              className="flex-1"
            />
          ) : null}
        </View>
      )}
      {uploader.canRetry ? (
        <PrimaryButton
          label="Thử tải lại"
          variant="outline"
          disabled={busy}
          onPress={() => void handleUploadResult(uploader.retry())}
        />
      ) : null}
      {uploaded ? (
        <PrimaryButton
          label="Gắn lại ảnh đã tải"
          variant="outline"
          disabled={busy}
          onPress={() => void attachAsset(uploaded)}
        />
      ) : null}
      {permissionDenied ? (
        <PrimaryButton label="Mở cài đặt quyền" variant="outline" onPress={() => void Linking.openSettings()} />
      ) : null}
    </View>
  );
}
