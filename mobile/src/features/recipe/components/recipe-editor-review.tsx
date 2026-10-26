import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, CircleAlert, ImageOff, Pencil } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import {
  difficultyLabel,
  issueLocation,
  parseAmount,
  stepTitle,
  type RecipeContentStep,
  type RecipeEditorValues,
  type RecipeFieldIssue,
} from '../utils/recipe-editor';

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  const colors = useIconColors();
  return (
    <View className="gap-3 border-t border-border pt-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sửa ${title.toLowerCase()}`} onPress={onEdit} hitSlop={8} className="flex-row items-center gap-1 px-1 py-1">
          <Pencil size={12} color={colors.primary} />
          <Text className="text-xs font-semibold text-primary">Sửa</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function formatNumber(text: string, suffix: string): string {
  const value = parseAmount(text);
  return Number.isFinite(value) ? `${value} ${suffix}` : '—';
}

/** Bước cuối: hiển thị toàn bộ công thức một lần, kèm danh sách mục còn thiếu (chạm để nhảy tới bước cần sửa). */
export function RecipeEditorReview({
  values,
  issues,
  categoryName,
  coverUrl,
  onEdit,
  onFixIssue,
}: {
  values: RecipeEditorValues;
  issues: RecipeFieldIssue[];
  categoryName?: string;
  coverUrl: string | null;
  onEdit: (step: RecipeContentStep) => void;
  onFixIssue: (issue: RecipeFieldIssue) => void;
}) {
  const colors = useIconColors();
  const ingredients = values.ingredients.filter((item) => item.name.trim());
  const steps = values.steps.filter((item) => item.instruction.trim());

  return (
    <View className="gap-4">
      {issues.length > 0 ? (
        <View className="gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <View className="flex-row items-center gap-2">
            <CircleAlert size={16} color={colors.destructive} />
            <Text className="flex-1 text-sm font-semibold text-destructive">Còn {issues.length} mục cần bổ sung trước khi gửi</Text>
          </View>
          {issues.slice(0, 6).map((issue) => {
            const location = issueLocation(issue.path);
            return (
              <Pressable key={issue.path} accessibilityRole="link" onPress={() => onFixIssue(issue)} className="py-0.5">
                <Text className="text-xs leading-5 text-destructive underline">
                  {stepTitle(issue.step)}
                  {location ? ` · ${location}` : ''}: {issue.message}
                </Text>
              </Pressable>
            );
          })}
          {issues.length > 6 ? <Text className="text-xs text-destructive">… và {issues.length - 6} mục khác</Text> : null}
        </View>
      ) : (
        <View className="gap-1 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <View className="flex-row items-center gap-2">
            <Check size={16} color={colors.primary} />
            <Text className="flex-1 text-sm font-semibold text-foreground">Công thức đã đủ thông tin bắt buộc</Text>
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            Sau khi gửi, công thức vào hàng chờ duyệt. Hệ thống tự tính dinh dưỡng từ nguyên liệu.
          </Text>
        </View>
      )}

      <ReviewSection title="Thông tin cơ bản" onEdit={() => onEdit('basics')}>
        <View className="gap-3">
          <View className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="Ảnh bìa món ăn" />
            ) : (
              <View className="h-full items-center justify-center gap-1">
                <ImageOff size={20} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">Chưa có ảnh bìa</Text>
              </View>
            )}
          </View>
          <Text className="text-base font-semibold text-foreground">{values.title.trim() || 'Chưa có tên món'}</Text>
          {values.description.trim() ? <Text className="text-sm leading-5 text-muted-foreground">{values.description.trim()}</Text> : null}
          <View className="flex-row flex-wrap gap-x-5 gap-y-1">
            <Text className="text-sm text-muted-foreground">Khẩu phần: <Text className="text-foreground">{formatNumber(values.servings, 'người')}</Text></Text>
            <Text className="text-sm text-muted-foreground">Sơ chế: <Text className="text-foreground">{formatNumber(values.prepTime, 'phút')}</Text></Text>
            <Text className="text-sm text-muted-foreground">Nấu: <Text className="text-foreground">{formatNumber(values.cookTime, 'phút')}</Text></Text>
          </View>
        </View>
      </ReviewSection>

      <ReviewSection title={`Nguyên liệu (${ingredients.length})`} onEdit={() => onEdit('ingredients')}>
        {ingredients.length === 0 ? (
          <Text className="text-sm text-muted-foreground">Chưa có nguyên liệu.</Text>
        ) : (
          <View className="gap-1.5">
            {ingredients.map((ingredient) => (
              <View key={ingredient.key} className="flex-row items-baseline justify-between gap-2">
                <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
                  <Text className="text-sm text-foreground">{ingredient.name}</Text>
                  {!ingredient.ingredientId ? (
                    <View className="rounded-full border border-amber-500/40 px-1.5 py-0.5">
                      <Text className="text-[10px] text-amber-700 dark:text-amber-400">Chưa liên kết</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-sm text-muted-foreground">{Number.isFinite(parseAmount(ingredient.amount)) ? parseAmount(ingredient.amount) : '—'} {ingredient.unit}</Text>
              </View>
            ))}
          </View>
        )}
      </ReviewSection>

      <ReviewSection title={`Các bước nấu (${steps.length})`} onEdit={() => onEdit('steps')}>
        {steps.length === 0 ? (
          <Text className="text-sm text-muted-foreground">Chưa có bước nấu.</Text>
        ) : (
          <View className="gap-2.5">
            {steps.map((step, index) => (
              <View key={step.key} className="flex-row gap-3">
                <View className="size-6 items-center justify-center rounded-full bg-primary">
                  <Text className="text-xs font-semibold text-primary-foreground">{index + 1}</Text>
                </View>
                <Text className="flex-1 pt-0.5 text-sm leading-5 text-foreground">{step.instruction.trim()}</Text>
              </View>
            ))}
          </View>
        )}
      </ReviewSection>

      <ReviewSection title="Phân loại" onEdit={() => onEdit('classify')}>
        <View className="flex-row flex-wrap gap-x-5 gap-y-1">
          <Text className="text-sm text-muted-foreground">Danh mục: <Text className="text-foreground">{categoryName ?? 'Chưa chọn'}</Text></Text>
          <Text className="text-sm text-muted-foreground">Độ khó: <Text className="text-foreground">{difficultyLabel(values.difficulty)}</Text></Text>
        </View>
      </ReviewSection>
    </View>
  );
}
