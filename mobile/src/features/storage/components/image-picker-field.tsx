import * as React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { ImagePermissionError, pickImage } from '../lib/pick-image';
import { useImageUpload } from '../lib/use-image-upload';
import type { PickedImage } from '../types/storage.model';

/**
 * Ô chọn ảnh bìa dùng chung: chọn từ thư viện hoặc chụp ảnh, tự tải lên ngay (reserve → Cloudinary → commit) và trả về
 * `assetId` để gắn vào bài đăng. Hiển thị tiến độ, lỗi (kể cả hết dung lượng) và nút thử lại.
 * `existingUrl` chỉ để xem trước ảnh hiện có khi sửa; API chưa trả `assetId` của ảnh cũ nên không thể giữ lại nó.
 */
export function ImagePickerField({
  label,
  value,
  onChange,
  onBusyChange,
  existingUrl,
  existingNote,
  baseName = 'cover',
}: {
  label: string;
  value: PickedImage | null;
  onChange: (next: PickedImage | null) => void;
  /** Báo cho form biết đang chọn/tải ảnh để chặn gửi form khi chưa xong. */
  onBusyChange?: (busy: boolean) => void;
  existingUrl?: string | null;
  existingNote?: string;
  baseName?: string;
}) {
  const colors = useIconColors();
  const uploader = useImageUpload();
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [pickError, setPickError] = React.useState('');
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [picking, setPicking] = React.useState(false);

  const busy = picking || uploader.uploading;
  React.useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const finishUpload = async (promise: Promise<{ id: string; url: string } | null>) => {
    const asset = await promise;
    if (asset) onChange({ assetId: asset.id, url: asset.url });
  };

  const choose = async (source: 'camera' | 'library') => {
    setPicking(true);
    setPickError('');
    setPermissionDenied(false);
    try {
      const image = await pickImage(source, { baseName });
      if (!image) return;
      onChange(null);
      setPreviewUri(image.uri);
      setPicking(false);
      await finishUpload(uploader.start(image));
    } catch (value) {
      if (value instanceof ImagePermissionError) setPermissionDenied(true);
      setPickError(getApiErrorMessage(value, 'Không chọn được ảnh.'));
    } finally {
      setPicking(false);
    }
  };

  const remove = () => {
    uploader.reset();
    setPreviewUri(null);
    setPickError('');
    onChange(null);
  };

  const shownUri = previewUri ?? value?.url ?? existingUrl ?? null;
  const hasNewImage = Boolean(previewUri ?? value);
  const error = pickError || uploader.error;

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase text-muted-foreground">{label}</Text>
      <View className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
        {shownUri ? (
          <Image
            source={{ uri: shownUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={label}
          />
        ) : (
          <View className="h-full items-center justify-center gap-1">
            <ImagePlus size={24} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Chưa có ảnh</Text>
          </View>
        )}
      </View>

      {!hasNewImage && existingUrl && existingNote ? (
        <Text className="text-[11px] leading-relaxed text-muted-foreground">{existingNote}</Text>
      ) : null}
      {uploader.uploading ? (
        <Text className="text-sm text-muted-foreground">Đang tải ảnh: {uploader.progress}%</Text>
      ) : value ? (
        <Text className="text-xs text-primary">Ảnh đã tải lên và sẵn sàng.</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        <PrimaryButton
          label={hasNewImage ? 'Đổi ảnh' : 'Chọn ảnh'}
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
      {uploader.canRetry ? (
        <PrimaryButton
          label="Thử tải lại"
          variant="outline"
          disabled={busy}
          onPress={() => void finishUpload(uploader.retry())}
        />
      ) : null}
      {hasNewImage ? (
        <PrimaryButton
          label="Bỏ ảnh này"
          variant="outline"
          disabled={busy}
          icon={<Trash2 size={16} color={colors.destructive} />}
          onPress={remove}
        />
      ) : null}
      {permissionDenied ? (
        <PrimaryButton label="Mở cài đặt quyền" variant="outline" onPress={() => void Linking.openSettings()} />
      ) : null}
    </View>
  );
}
