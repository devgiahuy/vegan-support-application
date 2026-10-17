import * as React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Film, Trash2, Video as VideoIcon } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { ImagePermissionError } from '../lib/pick-image';
import { pickVideo } from '../lib/pick-video';
import { useImageUpload } from '../lib/use-image-upload';
import { formatBytes } from '../mappers/storage.mapper';

export interface PickedVideo {
  assetId: string;
  url: string;
}

/**
 * Ô chọn video: chọn từ thư viện hoặc quay bằng camera, tự tải lên ngay (reserve → Cloudinary → commit) và trả về
 * `assetId` để gắn vào bài video. Hiển thị tiến độ, lỗi (kể cả hết dung lượng) và nút thử lại.
 */
export function VideoPickerField({
  value,
  onChange,
  onBusyChange,
  note,
}: {
  value: PickedVideo | null;
  onChange: (next: PickedVideo | null) => void;
  /** Báo cho form biết đang chọn/tải video để chặn gửi form khi chưa xong. */
  onBusyChange?: (busy: boolean) => void;
  /** Ghi chú hiển thị khi chưa chọn tệp mới (ví dụ khi sửa video đã tải lên trước đó). */
  note?: string;
}) {
  const colors = useIconColors();
  const uploader = useImageUpload('VIDEO');
  const [fileLabel, setFileLabel] = React.useState<string | null>(null);
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
      const video = await pickVideo(source);
      if (!video) return;
      onChange(null);
      setFileLabel(`${video.mimeType.replace('video/', '').toUpperCase()} · ${formatBytes(video.bytes)}`);
      setPicking(false);
      await finishUpload(uploader.start(video));
    } catch (error) {
      if (error instanceof ImagePermissionError) setPermissionDenied(true);
      setPickError(getApiErrorMessage(error, 'Không chọn được video.'));
    } finally {
      setPicking(false);
    }
  };

  const remove = () => {
    uploader.reset();
    setFileLabel(null);
    setPickError('');
    onChange(null);
  };

  const hasNewVideo = Boolean(fileLabel ?? value);
  const error = pickError || uploader.error;

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase text-muted-foreground">Tệp video</Text>
      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-muted/60 p-3.5">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Film size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {hasNewVideo ? 'Đã chọn video' : 'Chưa chọn video'}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {fileLabel ?? 'Hỗ trợ MP4, WebM hoặc MOV. Dung lượng tối đa do hệ thống quy định.'}
          </Text>
        </View>
      </View>

      {!hasNewVideo && note ? (
        <Text className="text-[11px] leading-relaxed text-muted-foreground">{note}</Text>
      ) : null}
      {uploader.uploading ? (
        <Text className="text-sm text-muted-foreground">Đang tải video: {uploader.progress}%</Text>
      ) : value ? (
        <Text className="text-xs text-primary">Video đã tải lên và sẵn sàng.</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        <PrimaryButton
          label={hasNewVideo ? 'Đổi video' : 'Chọn video'}
          variant="outline"
          disabled={busy}
          icon={<Film size={16} color={colors.primary} />}
          onPress={() => void choose('library')}
          className="flex-1"
        />
        {Platform.OS !== 'web' ? (
          <PrimaryButton
            label="Quay"
            variant="outline"
            disabled={busy}
            icon={<VideoIcon size={16} color={colors.primary} />}
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
      {hasNewVideo ? (
        <PrimaryButton
          label="Bỏ video này"
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
