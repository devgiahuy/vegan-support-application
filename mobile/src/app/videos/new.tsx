import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useRouter } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Link as LinkIcon, Send, Tags } from 'lucide-react-native';

import { CategoryType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { useCreateVideoMutation } from '@/features/video/queries/video.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 15);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function optionalPositiveNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default function CreateVideoScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createVideoMutation = useCreateVideoMutation();

  const [title, setTitle] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [coverSecureUrl, setCoverSecureUrl] = React.useState('');
  const [coverPublicId, setCoverPublicId] = React.useState('');
  const [coverMimeType, setCoverMimeType] = React.useState('image/jpeg');
  const [coverBytes, setCoverBytes] = React.useState('');
  const [coverWidth, setCoverWidth] = React.useState('');
  const [coverHeight, setCoverHeight] = React.useState('');

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng video nấu ăn mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const submit = async () => {
    const cleanTitle = title.trim();
    const cleanUrl = youtubeUrl.trim();
    const cleanBody = body.trim();
    const cleanExcerpt = excerpt.trim();
    const cleanCoverUrl = coverSecureUrl.trim();
    const cleanCoverPublicId = coverPublicId.trim();
    const cleanCoverMimeType = coverMimeType.trim();
    const coverBytesNumber = optionalPositiveNumber(coverBytes);
    const coverWidthNumber = optionalPositiveNumber(coverWidth);
    const coverHeightNumber = optionalPositiveNumber(coverHeight);
    const hasCoverInput = Boolean(
      cleanCoverUrl || cleanCoverPublicId || coverBytes.trim() || coverWidth.trim() || coverHeight.trim()
    );

    if (cleanTitle.length < 3) {
      Alert.alert('Thiếu tiêu đề', 'Tiêu đề video cần ít nhất 3 ký tự.');
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      Alert.alert('Link video chưa hợp lệ', 'Vui lòng nhập link YouTube hoặc video dạng URL đầy đủ.');
      return;
    }
    if (cleanBody.length < 20) {
      Alert.alert('Thiếu tóm tắt', 'Tóm tắt công thức cần ít nhất 20 ký tự.');
      return;
    }
    if (hasCoverInput) {
      if (!isValidUrl(cleanCoverUrl)) {
        Alert.alert('Ảnh bìa chưa hợp lệ', 'Secure URL ảnh bìa phải là URL http(s) từ Cloudinary.');
        return;
      }
      if (!cleanCoverPublicId || !cleanCoverMimeType || !coverBytesNumber) {
        Alert.alert('Thiếu metadata ảnh bìa', 'Ảnh bìa cần đủ publicId, MIME type và dung lượng bytes.');
        return;
      }
      if (!cleanCoverMimeType.startsWith('image/')) {
        Alert.alert('MIME ảnh bìa chưa hợp lệ', 'MIME type ảnh bìa phải bắt đầu bằng image/.');
        return;
      }
    }

    try {
      const created = await createVideoMutation.mutateAsync({
        title: cleanTitle,
        excerpt: cleanExcerpt || undefined,
        youtubeUrl: cleanUrl,
        body: cleanBody,
        categoryIds: categoryId ? [categoryId] : undefined,
        tags: splitTags(tags),
        ...(hasCoverInput && coverBytesNumber
          ? {
              coverMedia: {
                publicId: cleanCoverPublicId,
                secureUrl: cleanCoverUrl,
                mimeType: cleanCoverMimeType,
                bytes: coverBytesNumber,
                ...(coverWidthNumber ? { width: coverWidthNumber } : {}),
                ...(coverHeightNumber ? { height: coverHeightNumber } : {}),
              },
            }
          : {}),
      });
      Alert.alert('Đã gửi video', 'Video đã được gửi lên hệ thống nội dung.');
      router.replace(`/videos/${created.id}` as Href);
    } catch (error) {
      Alert.alert('Không đăng được video', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
    }
  };

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Link href={'/videos' as Href} asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ArrowLeft size={18} color={colors.foreground} />
          </Pressable>
        </Link>

        <View>
          <Text className="text-2xl font-extrabold text-foreground">Đăng video nấu ăn</Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tiêu đề</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Cơm gạo lứt đậu hũ nhiều rau"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Link video</Text>
            <View className="flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
              <LinkIcon size={16} color={colors.mutedForeground} />
              <TextInput
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor={colors.mutedForeground}
                className="h-12 flex-1 text-sm text-foreground"
              />
            </View>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Mô tả ngắn</Text>
            <TextInput
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Mô tả ngắn hiển thị ở danh sách video"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center gap-2">
              <ImageIcon size={16} color={colors.primary} />
              <Text className="text-xs font-bold uppercase text-muted-foreground">Ảnh bìa Cloudinary</Text>
            </View>
            <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Mobile hiện chưa có luồng chọn ảnh/upload trực tiếp. Dán metadata ảnh đã upload Cloudinary để backend lưu media COVER_IMAGE.
            </Text>

            {isValidUrl(coverSecureUrl.trim()) ? (
              <View className="mt-3 aspect-video overflow-hidden rounded-xl bg-muted">
                <Image source={{ uri: coverSecureUrl.trim() }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
            ) : null}

            <View className="mt-3 gap-3">
              <View>
                <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">Secure URL</Text>
                <TextInput
                  value={coverSecureUrl}
                  onChangeText={setCoverSecureUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                  placeholder="https://res.cloudinary.com/.../image/upload/..."
                  placeholderTextColor={colors.mutedForeground}
                  className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                />
              </View>

              <View>
                <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">Public ID</Text>
                <TextInput
                  value={coverPublicId}
                  onChangeText={setCoverPublicId}
                  autoCapitalize="none"
                  placeholder="vegan-app/..."
                  placeholderTextColor={colors.mutedForeground}
                  className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">MIME type</Text>
                  <TextInput
                    value={coverMimeType}
                    onChangeText={setCoverMimeType}
                    autoCapitalize="none"
                    placeholder="image/jpeg"
                    placeholderTextColor={colors.mutedForeground}
                    className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">Bytes</Text>
                  <TextInput
                    value={coverBytes}
                    onChangeText={setCoverBytes}
                    keyboardType="numeric"
                    placeholder="120000"
                    placeholderTextColor={colors.mutedForeground}
                    className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">Width</Text>
                  <TextInput
                    value={coverWidth}
                    onChangeText={setCoverWidth}
                    keyboardType="numeric"
                    placeholder="1280"
                    placeholderTextColor={colors.mutedForeground}
                    className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-semibold text-muted-foreground">Height</Text>
                  <TextInput
                    value={coverHeight}
                    onChangeText={setCoverHeight}
                    keyboardType="numeric"
                    placeholder="720"
                    placeholderTextColor={colors.mutedForeground}
                    className="h-12 rounded-2xl border border-input bg-background px-3.5 text-sm text-foreground"
                  />
                </View>
              </View>
            </View>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tóm tắt công thức</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              placeholder="Nguyên liệu chính, các bước nấu, lưu ý dinh dưỡng..."
              placeholderTextColor={colors.mutedForeground}
              className="min-h-32 rounded-2xl border border-input bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground"
              textAlignVertical="top"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tag</Text>
            <View className="flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
              <Tags size={16} color={colors.mutedForeground} />
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="đậu hũ, bữa tối, nhiều rau"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 flex-1 text-sm text-foreground"
              />
            </View>
          </View>

          <View className="border-t border-border pt-4">
            <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground">Chủ đề</Text>
            {isCategoryLoading ? (
              <View className="h-8 rounded-lg bg-muted" />
            ) : isCategoryError ? (
              <Pressable onPress={() => void refetchCategories()}>
                <Text className="text-sm text-primary underline">Không tải được danh mục. Thử lại.</Text>
              </Pressable>
            ) : categoryTree.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Có thể đăng video mà không chọn chủ đề.</Text>
            ) : (
              <CategoryFilterPills items={categoryTree} selectedId={categoryId} onSelect={setCategoryId} />
            )}
          </View>
        </View>

        <PrimaryButton
          label={createVideoMutation.isPending ? 'Đang gửi...' : 'Gửi video'}
          loading={createVideoMutation.isPending}
          icon={<Send size={16} color={colors.primaryForeground} />}
          onPress={() => void submit()}
        />
      </View>
    </SiteScreen>
  );
}
