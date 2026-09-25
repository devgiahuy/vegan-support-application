import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link as LinkIcon, Send, Tags } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType } from '@/common/enums';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { useIconColors } from '@/lib/theme-colors';

export interface VideoFormValues {
  title: string;
  excerpt?: string;
  youtubeUrl: string;
  body: string;
  tags?: string[];
  categoryIds?: string[];
}

function splitTags(value: string): string[] {
  return value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 15);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Form dùng chung cho đăng video mới và sửa video của chính mình — chỉ khác nhau ở
 * `initial` (giá trị điền sẵn) và `onSubmit`/`submitLabel` do màn gọi cung cấp.
 */
export function VideoForm({
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
}: {
  initial?: { title?: string; excerpt?: string; youtubeUrl?: string; body?: string; tags?: string[]; categoryId?: string | null };
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: VideoFormValues) => void;
}) {
  const colors = useIconColors();
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? '');
  const [youtubeUrl, setYoutubeUrl] = React.useState(initial?.youtubeUrl ?? '');
  const [body, setBody] = React.useState(initial?.body ?? '');
  const [tags, setTags] = React.useState(initial?.tags?.join(', ') ?? '');
  const [categoryId, setCategoryId] = React.useState<string | null>(initial?.categoryId ?? null);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const submit = () => {
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

    onSubmit({
      title: cleanTitle,
      excerpt: cleanExcerpt || undefined,
      youtubeUrl: cleanUrl,
      body: cleanBody,
      categoryIds: categoryId ? [categoryId] : undefined,
      tags: splitTags(tags),
    });
  };

  return (
    <View className="gap-5">
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
        label={isSubmitting ? 'Đang gửi...' : submitLabel}
        loading={isSubmitting}
        icon={<Send size={16} color={colors.primaryForeground} />}
        onPress={submit}
      />
    </View>
  );
}
