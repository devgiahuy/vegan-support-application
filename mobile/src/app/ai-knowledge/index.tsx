import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Search, Sparkles, User } from 'lucide-react-native';

import { AiArtifactType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { AuthRequiredCard } from '@/features/ai-artifact/components/auth-required-card';
import { VerificationBadge } from '@/features/ai-artifact/components/verification-badge';
import { useInfinitePublicAiArtifactsQuery } from '@/features/ai-artifact/queries/ai-artifact.queries';
import type { AiArtifact } from '@/features/ai-artifact/types/ai-artifact.model';
import { getAiArtifactErrorMessage } from '@/features/ai-artifact/utils/ai-artifact-errors';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const TABS: { label: string; type?: AiArtifactType }[] = [
  { label: 'Tất cả' },
  { label: 'Trợ lý AI', type: AiArtifactType.CHAT_ANSWER },
  { label: 'Dinh dưỡng', type: AiArtifactType.RECIPE_NUTRITION },
  { label: 'Tủ lạnh', type: AiArtifactType.FRIDGE_RECOGNITION },
  { label: 'Hóa đơn', type: AiArtifactType.RECEIPT_EXTRACTION },
];

function ArtifactCard({ artifact }: { artifact: AiArtifact }) {
  const colors = useIconColors();
  return (
    <Link href={`/ai-knowledge/${artifact.id}` as Href} asChild>
      <Pressable className="gap-2.5 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full border border-border px-2.5 py-1">
            <Text className="text-[11px] text-muted-foreground">{artifact.typeLabel}</Text>
          </View>
          <VerificationBadge verification={artifact.activeVerification} compact />
        </View>
        <Text numberOfLines={2} className="text-base font-bold leading-snug text-foreground">
          {artifact.title}
        </Text>
        <Text numberOfLines={3} className="text-xs leading-relaxed text-muted-foreground">
          {artifact.summary || 'Bản ghi tri thức AI chia sẻ từ cộng đồng ăn chay VeggieConnect.'}
        </Text>
        <View className="flex-row items-center justify-between gap-2 border-t border-border pt-2.5">
          <View className="flex-1 flex-row items-center gap-1.5">
            <User size={12} color={colors.mutedForeground} />
            <Text numberOfLines={1} className="shrink text-[11px] text-muted-foreground">
              {artifact.authorName}
              {artifact.createdAtLabel ? ` · ${artifact.createdAtLabel}` : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-primary">Xem</Text>
            <ArrowRight size={12} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Khám phá tri thức AI công khai — mở được khi chưa đăng nhập. Tương đương `/assistant/public` của web:
 * lọc theo loại, tìm theo từ khóa trong danh sách đã tải.
 */
export default function AiKnowledgeScreen() {
  const colors = useIconColors();
  const [tab, setTab] = React.useState(0);
  const [keyword, setKeyword] = React.useState('');
  const activeType = TABS[tab]?.type;
  const { data, isLoading, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfinitePublicAiArtifactsQuery({ type: activeType, limit: 50 });
  const loadedCount = data?.pages.reduce((sum, page) => sum + page.items.length, 0) ?? 0;
  const total = data?.pages[0]?.total ?? loadedCount;

  const items = React.useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    const query = keyword.trim().toLowerCase();
    if (query.length === 0) return all;
    return all.filter((item) => item.title.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query));
  }, [data?.pages, keyword]);

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles size={16} color={colors.primary} />
            </View>
            <Text className="flex-1 text-2xl font-extrabold text-foreground">Tri thức AI công khai</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Các giải đáp, phân tích dinh dưỡng do cộng đồng chia sẻ, có thể kèm ý kiến thẩm định của Người đóng góp. Chỉ mang tính
            tham khảo, không thay thế tư vấn y khoa.
          </Text>
        </View>

        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm chủ đề hoặc từ khóa..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 text-sm text-foreground"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {TABS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => setTab(index)}
              className={cn('rounded-full px-3.5 py-2', tab === index ? 'bg-primary' : 'bg-muted')}>
              <Text className={cn('text-xs font-semibold', tab === index ? 'text-primary-foreground' : 'text-muted-foreground')}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <LoadingState message="Đang tải tri thức AI..." />
        ) : isError && getApiErrorCode(error) === 'AUTH_REQUIRED' ? (
          <AuthRequiredCard />
        ) : isError ? (
          <ErrorState title="Không thể tải danh sách." description={getAiArtifactErrorMessage(error)} onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có bản ghi nào"
            description={keyword.trim().length > 0 ? 'Không tìm thấy tri thức phù hợp với từ khóa.' : 'Chưa có tri thức AI nào được chia sẻ trong mục này.'}
            icon={<Sparkles size={26} color={colors.primary} />}
          />
        ) : (
          <View className="gap-3">
            {items.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
            />
            {total > loadedCount ? (
              <Text className="text-center text-xs text-muted-foreground">
                Đang hiển thị {loadedCount}/{total} bản ghi mới nhất.
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
