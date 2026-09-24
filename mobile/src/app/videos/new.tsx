import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Link as LinkIcon, Send, Tags } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType } from '@/common/enums';
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

    try {
      const created = await createVideoMutation.mutateAsync({
        title: cleanTitle,
        excerpt: cleanExcerpt || undefined,
        youtubeUrl: cleanUrl,
        body: cleanBody,
        categoryIds: categoryId ? [categoryId] : undefined,
        tags: splitTags(tags),
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
        <View>
          <Text className="text-2xl font-extrabold tracking-tight text-foreground">Đăng video nấu ăn</Text>
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
