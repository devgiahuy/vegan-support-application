import * as React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus } from 'lucide-react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useUploadImageMutation } from '@/features/storage/queries/storage.queries';
import type {
  MediaAsset,
  SelectedImage,
  UploadAttempt,
} from '@/features/storage/types/storage.model';
import { validateImage } from '@/features/storage/mappers/storage.mapper';
import { storageErrorMessage } from '@/features/storage/lib/storage-errors';
import { createOperationKey } from '@/lib/operation-key';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useUpdateBasicProfileMutation } from '../queries/profile.queries';

export function AvatarEditor({ onClose }: { onClose: () => void }) {
  const colors = useIconColors();
  const upload = useUploadImageMutation();
  const update = useUpdateBasicProfileMutation();
  const [selected, setSelected] = React.useState<{
    image: SelectedImage;
    attempt: UploadAttempt;
  } | null>(null);
  const [uploaded, setUploaded] = React.useState<MediaAsset | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  const busy = upload.isPending || update.isPending || picking;

  const pick = async (camera: boolean) => {
    setPicking(true);
    setError('');
    setPermissionDenied(false);
    try {
      if (Platform.OS !== 'web') {
        const permission = camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setPermissionDenied(true);
          throw new Error(
            camera ? 'Cần quyền camera để chụp ảnh.' : 'Cần quyền thư viện để chọn ảnh.'
          );
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      const mimeType = asset.file?.type || asset.mimeType || '';
      const extension = (
        {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/avif': 'avif',
        } as Record<string, string>
      )[mimeType];
      const image: SelectedImage = {
        uri: asset.uri,
        name: `avatar.${extension ?? ''}`,
        mimeType,
        bytes: asset.fileSize ?? asset.file?.size ?? 0,
        ...(asset.file ? { file: asset.file } : {}),
      };
      validateImage(image);
      setSelected({
        image,
        attempt: { key: createOperationKey('avatar-upload'), reservationId: null, receipt: null },
      });
      setUploaded(null);
      setProgress(0);
    } catch (value) {
      setError(getApiErrorMessage(value, 'Không chọn được ảnh.'));
    } finally {
      setPicking(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setError('');
    try {
      const asset =
        uploaded ??
        (await upload.mutateAsync({
          input: {
            kind: 'COVER_IMAGE',
            image: selected.image,
            idempotencyKey: selected.attempt.key,
          },
          onProgress: setProgress,
          attempt: selected.attempt,
        }));
      setUploaded(asset);
      await update.mutateAsync({ avatarUrl: asset.url });
      onClose();
    } catch (value) {
      setError(storageErrorMessage(value));
    }
  };

  return (
    <FormSheet title="Ảnh đại diện" onClose={onClose} busy={busy}>
      {selected ? (
        <Image
          source={{ uri: selected.image.uri }}
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            alignSelf: 'center',
          }}
          contentFit="cover"
          accessibilityLabel="Ảnh đại diện đã chọn"
        />
      ) : (
        <Text className="text-sm text-muted-foreground">Chọn ảnh đại diện của bạn.</Text>
      )}
      <View className="gap-3">
        <PrimaryButton
          label="Chọn từ thư viện"
          variant="outline"
          disabled={busy}
          icon={<ImagePlus size={18} color={colors.primary} />}
          onPress={() => void pick(false)}
        />
        {Platform.OS !== 'web' ? (
          <PrimaryButton
            label="Chụp ảnh"
            variant="outline"
            disabled={busy}
            icon={<Camera size={18} color={colors.primary} />}
            onPress={() => void pick(true)}
          />
        ) : null}
      </View>
      {upload.isPending ? (
        <Text className="text-sm text-muted-foreground">Đang tải ảnh: {progress}%</Text>
      ) : null}
      {uploaded && error ? (
        <Text className="text-sm text-muted-foreground">
          Ảnh đã tải lên. Thử lưu lại để cập nhật hồ sơ.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}
      {permissionDenied ? (
        <PrimaryButton
          label="Mở cài đặt quyền"
          variant="outline"
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
      <PrimaryButton
        label="Lưu ảnh đại diện"
        disabled={!selected || picking}
        loading={upload.isPending || update.isPending}
        onPress={() => void save()}
      />
    </FormSheet>
  );
}
