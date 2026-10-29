import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Clock, Edit3, Eye, FileText, Image as ImageIcon, Save, Send, Sparkles, Tag } from 'lucide-react-native';

import { DropdownField } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType, UserRole } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import { TagInput } from '@/features/recipe/components/tag-input';
import { ImagePickerField } from '@/features/storage/components/image-picker-field';
import type { PickedImage } from '@/features/storage/types/storage.model';
import type { CreateArticleInput } from '../api/post.api';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

// Ngưỡng đồng bộ web (`post-editor-form.tsx`) và hợp đồng BE: tiêu đề 5–200, nội dung ≥ 100 ký tự.
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 200;
const MIN_BODY_LENGTH = 100;
const MAX_TAGS = 15;

export type ArticleFormAction = 'DRAFT' | 'SUBMIT';

export interface ArticleFormInitial {
  title?: string;
  excerpt?: string;
  body?: string;
  /** Ảnh bìa hiện có (chỉ để xem trước khi sửa). */
  coverImageUrl?: string | null;
  tags?: string[];
  categoryId?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.CONTRIBUTOR]: 'Người đóng góp',
  [UserRole.MEMBER]: 'Thành viên',
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('gap-3 rounded-2xl border border-border bg-card p-4', className)}>{children}</View>;
}

function RoleBadge({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
      <Text className="text-[11px] font-medium text-primary">{label}</Text>
    </View>
  );
}

/**
 * Form dùng chung cho viết bài mới và sửa bài viết của chính mình — bố cục theo `post-editor-form.tsx` của web:
 * thanh thao tác nhanh, thông tin quyền, tiêu đề/tóm tắt/nội dung (soạn thảo + xem trước), thẻ xuất bản,
 * ảnh bìa, phân loại và thẻ chủ đề. Khác nhau giữa tạo/sửa chỉ ở `initial` và `onSubmit` do màn gọi cung cấp.
 * Không có ảnh bìa dựng sẵn và "trường phái" như web: BE chỉ nhận ảnh đã tải lên (`assetId`) và không lưu trường phái.
 */
export function ArticleForm({
  initial,
  submitLabel = 'Gửi duyệt bài',
  isSubmitting,
  onSubmit,
}: {
  initial?: ArticleFormInitial;
  /** Nhãn nút gửi duyệt chính. */
  submitLabel?: string;
  isSubmitting: boolean;
  onSubmit: (values: CreateArticleInput, action: ArticleFormAction) => void;
}) {
  const colors = useIconColors();
  const user = useAuthStore((state) => state.user);
  const roleLabel = ROLE_LABELS[user?.role ?? UserRole.MEMBER] ?? ROLE_LABELS[UserRole.MEMBER]!;

  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? '');
  const [body, setBody] = React.useState(initial?.body ?? '');
  const [tab, setTab] = React.useState<'edit' | 'preview'>('edit');
  const [cover, setCover] = React.useState<PickedImage | null>(null);
  const [coverBusy, setCoverBusy] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [categoryId, setCategoryId] = React.useState<string | null>(initial?.categoryId ?? null);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryTree, 'Chưa chọn chuyên mục'), [categoryTree]);
  const categoryName = categoryOptions.find((option) => option.value === categoryId && categoryId !== null)?.label;

  const bodyLength = body.trim().length;
  const wordCount = React.useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 160));

  const submit = (action: ArticleFormAction) => {
    if (coverBusy) {
      Alert.alert('Ảnh đang tải lên', 'Vui lòng đợi ảnh bìa tải xong rồi gửi bài viết.');
      return;
    }
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề bài viết!');
      return;
    }
    if (cleanTitle.length < MIN_TITLE_LENGTH || cleanTitle.length > MAX_TITLE_LENGTH) {
      Alert.alert(
        'Tiêu đề chưa hợp lệ',
        `Tiêu đề bài viết cần từ ${MIN_TITLE_LENGTH} đến ${MAX_TITLE_LENGTH} ký tự (hiện có ${cleanTitle.length}).`
      );
      return;
    }
    if (!cleanBody) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập nội dung bài viết!');
      return;
    }
    if (cleanBody.length < MIN_BODY_LENGTH) {
      Alert.alert(
        'Nội dung quá ngắn',
        `Nội dung cần có ít nhất ${MIN_BODY_LENGTH} ký tự để chia sẻ kiến thức hữu ích (hiện có ${cleanBody.length}/${MIN_BODY_LENGTH}). Hãy bổ sung thêm chi tiết nhé!`
      );
      setTab('edit');
      return;
    }

    onSubmit(
      {
        title: cleanTitle,
        excerpt: excerpt.trim() || undefined,
        body: cleanBody,
        ...(cover ? { coverAssetId: cover.assetId } : {}),
        categoryIds: categoryId ? [categoryId] : undefined,
        tags,
        ...(action === 'DRAFT' ? { saveAsDraft: true } : {}),
      },
      action
    );
  };

  const busy = isSubmitting || coverBusy;

  return (
    <View className="gap-5">
      {/* Thanh thao tác nhanh (như thanh dành cho màn hình nhỏ của web) */}
      <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <RoleBadge label={roleLabel} />
          <Text numberOfLines={1} className="shrink text-xs text-muted-foreground">Chờ duyệt</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => submit('DRAFT')}
            className={cn('h-9 flex-row items-center gap-1 rounded-xl border border-input bg-background px-2.5', busy && 'opacity-60')}>
            <Save size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">Lưu nháp</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => submit('SUBMIT')}
            className={cn('h-9 flex-row items-center gap-1 rounded-xl bg-primary px-3', busy && 'opacity-60')}>
            <Send size={14} color={colors.primaryForeground} />
            <Text className="text-xs font-semibold text-primary-foreground">Gửi duyệt</Text>
          </Pressable>
        </View>
      </View>

      {/* Thông tin quyền xuất bản: BE đưa mọi bài vào hàng đợi kiểm duyệt, nên không hứa xuất bản trực tiếp. */}
      <View className="flex-row items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <View className="size-9 items-center justify-center rounded-xl bg-primary">
          <Sparkles size={18} color={colors.primaryForeground} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground">Bài viết sẽ được kiểm duyệt</Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            Bài viết được chuyển vào hàng đợi kiểm duyệt trước khi công khai.
          </Text>
        </View>
        <RoleBadge label={roleLabel} />
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-bold text-foreground">
          Tiêu đề bài viết <Text className="text-destructive">*</Text>
        </Text>
        {/* Nhiều dòng tự giãn chiều cao để tiêu đề/gợi ý dài không bị cắt; loại bỏ ký tự xuống dòng vì tiêu đề là một dòng. */}
        <TextInput
          value={title}
          onChangeText={(text) => setTitle(text.replace(/[\r\n]+/g, ' '))}
          maxLength={MAX_TITLE_LENGTH}
          multiline
          scrollEnabled={false}
          blurOnSubmit
          returnKeyType="done"
          textAlignVertical="center"
          placeholder="VD: Cẩm nang ăn chay không lo thiếu máu và Vitamin B12..."
          placeholderTextColor={colors.mutedForeground}
          className="min-h-12 rounded-xl border border-input bg-card px-3.5 py-3 text-base font-semibold leading-6 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-bold text-foreground">Đoạn trích tóm tắt ngắn (1-2 câu tóm lược nội dung chính)</Text>
        <TextInput
          value={excerpt}
          onChangeText={setExcerpt}
          multiline
          maxLength={500}
          textAlignVertical="top"
          placeholder="VD: Hướng dẫn kết hợp các loại hạt lên men và ngũ cốc để duy trì năng lượng bền bỉ..."
          placeholderTextColor={colors.mutedForeground}
          className="min-h-16 rounded-xl border border-input bg-card px-3.5 py-3 text-sm leading-5 text-foreground"
        />
      </View>

      <View className="gap-3">
        <View className="gap-0.5">
          <View className="flex-row items-center gap-2">
            <FileText size={16} color={colors.primary} />
            <Text className="text-sm font-bold text-foreground">
              Nội dung bài viết <Text className="text-destructive">*</Text>
            </Text>
          </View>
          <Text className="text-xs leading-4 text-muted-foreground">
            Nhập văn bản thông thường (tối thiểu {MIN_BODY_LENGTH} ký tự). Xuống dòng (Enter) để phân tách các đoạn văn.
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text
              className={cn(
                'text-xs font-semibold',
                bodyLength < MIN_BODY_LENGTH ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
              {bodyLength}/{MIN_BODY_LENGTH} ký tự
            </Text>
            <Text className="text-xs text-muted-foreground">• {wordCount} từ •</Text>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color={colors.primary} />
              <Text className="text-xs font-medium text-primary">~{readingMinutes} phút đọc</Text>
            </View>
          </View>
          <View accessibilityRole="tablist" className="flex-row gap-1 rounded-xl border border-border bg-muted/70 p-0.5">
            {(
              [
                { id: 'edit', label: 'Soạn thảo', Icon: Edit3 },
                { id: 'preview', label: 'Xem trước', Icon: Eye },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(id)}
                  className={cn('h-8 flex-row items-center gap-1.5 rounded-lg px-2.5', active ? 'bg-primary' : '')}>
                  <Icon size={13} color={active ? colors.primaryForeground : colors.foreground} />
                  <Text className={cn('text-xs font-medium', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {tab === 'edit' ? (
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            placeholder="Bắt đầu nhập nội dung bài chia sẻ của bạn tại đây... Hãy chia sẻ kinh nghiệm ăn chay, câu chuyện hoặc kiến thức dinh dưỡng với cộng đồng (xuống dòng để chia thành các đoạn văn riêng biệt)."
            placeholderTextColor={colors.mutedForeground}
            className="min-h-72 rounded-2xl border border-input bg-card p-4 text-base leading-6 text-foreground"
          />
        ) : (
          <View className="min-h-72 gap-3 rounded-2xl border border-input bg-card p-4">
            <View className="gap-2">
              <View className="self-start rounded-full border border-border px-2.5 py-0.5">
                <Text className="text-xs text-foreground">{categoryName ?? 'Chưa chọn chuyên mục'}</Text>
              </View>
              <Text className="text-2xl font-bold leading-tight text-foreground">{title.trim() || 'Tiêu đề bài viết'}</Text>
              <Text className="border-b border-border pb-3 text-xs text-muted-foreground">
                Tác giả: <Text className="font-bold text-foreground">{user?.displayName ?? 'Tác giả VeggieConnect'}</Text> • {readingMinutes} phút đọc • {wordCount} từ
              </Text>
            </View>
            {excerpt.trim() ? (
              <Text className="rounded-r-lg border-l-2 border-primary/60 bg-muted/30 py-1 pl-3 text-sm italic leading-5 text-muted-foreground">
                {excerpt.trim()}
              </Text>
            ) : null}
            {body.trim() ? (
              body
                .split(/\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <Text key={index} className="text-base leading-6 text-foreground/90">
                    {paragraph}
                  </Text>
                ))
            ) : (
              <Text className="text-sm italic text-muted-foreground">Chưa có nội dung để xem trước...</Text>
            )}
          </View>
        )}
      </View>

      <Card className="border-primary/30 bg-primary/5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Send size={15} color={colors.primary} />
            <Text className="text-sm font-bold text-foreground">Thao tác xuất bản</Text>
          </View>
          <RoleBadge label={roleLabel} />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Clock size={14} color="#d97706" />
          <Text className="flex-1 text-xs font-medium leading-4 text-amber-600 dark:text-amber-400">
            Bài viết sẽ gửi tới người kiểm duyệt trước khi công khai.
          </Text>
        </View>
        <PrimaryButton
          label={isSubmitting ? 'Đang lưu bài viết...' : submitLabel}
          loading={isSubmitting}
          disabled={coverBusy}
          icon={<Send size={16} color={colors.primaryForeground} />}
          iconPosition="left"
          onPress={() => submit('SUBMIT')}
          className="h-11"
        />
        <PrimaryButton
          label="Lưu bản nháp (DRAFT)"
          variant="outline"
          disabled={busy}
          icon={<Save size={14} color={colors.mutedForeground} />}
          iconPosition="left"
          onPress={() => submit('DRAFT')}
          className="h-10"
        />
      </Card>

      <Card>
        <View className="flex-row items-center gap-2">
          <ImageIcon size={15} color={colors.primary} />
          <Text className="text-sm font-bold text-foreground">Ảnh bìa bài viết</Text>
        </View>
        <ImagePickerField
          label="Ảnh bìa bài viết"
          value={cover}
          onChange={setCover}
          onBusyChange={setCoverBusy}
          existingUrl={initial?.coverImageUrl}
          existingNote="Chọn ảnh mới để thay. Nếu không chọn, bản chỉnh sửa sẽ không có ảnh bìa vì API chưa cho giữ lại ảnh cũ."
        />
      </Card>

      <Card>
        <Text className="text-sm font-bold text-foreground">Phân loại</Text>
        <DropdownField
          variant="field"
          label="Chuyên mục cẩm nang"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
          status={isCategoryLoading ? 'loading' : isCategoryError ? 'error' : undefined}
          onRetry={() => void refetchCategories()}
        />
        <View className="gap-2 border-t border-border pt-3">
          <View className="flex-row items-center gap-1.5">
            <Tag size={14} color={colors.primary} />
            <Text className="text-xs font-semibold text-foreground">Thẻ chủ đề (Tags)</Text>
          </View>
          <TagInput value={tags} onChange={setTags} maxTags={MAX_TAGS} placeholder="Thêm thẻ (vd: AnLanh)..." />
        </View>
      </Card>
    </View>
  );
}
