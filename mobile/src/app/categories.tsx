import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ChevronRight, FolderTree } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryType } from '@/common/enums';
import type { Category } from '@/features/category/types/category.model';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

type TypeFilter = CategoryType | 'ALL';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: CategoryType.RECIPE_GROUP, label: 'Nhóm công thức' },
  { value: CategoryType.CONTENT_TOPIC, label: 'Chủ đề nội dung' },
  { value: CategoryType.FOOD_TYPE, label: 'Loại thực phẩm' },
];

/** Danh mục con dẫn tới đâu tuỳ loại: nhóm công thức → Món chay, chủ đề → Cẩm nang. */
function hrefForCategory(type: CategoryType, id: string): Href | null {
  if (type === CategoryType.RECIPE_GROUP) return `/recipes?category=${id}` as Href;
  if (type === CategoryType.CONTENT_TOPIC) return `/articles?category=${id}` as Href;
  return null;
}

/**
 * Duyệt cây danh mục public (đồng bộ `frontend/src/app/(site)/categories/page.tsx`,
 * bản rút gọn — chưa gồm các khối tra cứu nguyên liệu/dinh dưỡng riêng của food-data).
 * Bấm danh mục con điều hướng thẳng tới Món chay/Cẩm nang đã lọc sẵn theo danh mục đó.
 */
export default function CategoriesScreen() {
  const colors = useIconColors();
  const [type, setType] = React.useState<TypeFilter>('ALL');
  const { data: tree = [], isLoading, isError, refetch } = useCategoryTreeQuery(
    type === 'ALL' ? undefined : type
  );

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Danh mục</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Khám phá món chay và bài viết theo từng nhóm, chủ đề.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => {
            const selected = type === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setType(option.value)}
                className={cn(
                  'rounded-full px-3.5 py-2',
                  selected ? 'bg-primary' : 'bg-muted'
                )}>
                <Text
                  className={cn(
                    'text-xs font-medium',
                    selected ? 'font-semibold text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2, 3].map((i) => (
              <View key={i} className="h-24 rounded-2xl border border-border bg-muted" />
            ))}
          </View>
        ) : isError ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              Không tải được danh mục. Kiểm tra kết nối mạng và thử lại.
            </Text>
            <Pressable onPress={() => void refetch()} className="mt-3 rounded-full bg-primary px-4 py-2">
              <Text className="text-xs font-semibold text-primary-foreground">Thử lại</Text>
            </Pressable>
          </View>
        ) : tree.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-6">
            <FolderTree size={22} color={colors.mutedForeground} />
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Chưa có danh mục nào thuộc loại này.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {tree.map((parent: Category) => (
              <View key={parent.id} className="rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="font-semibold text-foreground">{parent.name}</Text>
                  <Text className="text-xs text-muted-foreground">{parent.typeLabel}</Text>
                </View>

                {parent.children.length > 0 ? (
                  <View className="mt-2">
                    {parent.children.map((child) => {
                      const href = hrefForCategory(child.type, child.id);
                      const row = (
                        <View className="flex-row items-center gap-1 rounded-lg px-1 py-2">
                          <ChevronRight size={14} color={colors.mutedForeground} />
                          <Text className="text-sm text-muted-foreground">{child.name}</Text>
                        </View>
                      );
                      return href ? (
                        <Link key={child.id} href={href} asChild>
                          <Pressable>{row}</Pressable>
                        </Link>
                      ) : (
                        <View key={child.id}>{row}</View>
                      );
                    })}
                  </View>
                ) : (
                  (() => {
                    const href = hrefForCategory(parent.type, parent.id);
                    if (!href) {
                      return <Text className="mt-2 text-xs text-muted-foreground">Chưa có danh mục con.</Text>;
                    }
                    return (
                      <Link href={href} asChild>
                        <Pressable className="mt-2 flex-row items-center gap-1">
                          <ChevronRight size={14} color={colors.primary} />
                          <Text className="text-sm font-medium text-primary">Xem nội dung nhóm này</Text>
                        </Pressable>
                      </Link>
                    );
                  })()
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
