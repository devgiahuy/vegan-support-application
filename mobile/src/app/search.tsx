import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { PostCard } from '@/features/post/components/post-card';
import { VideoCard } from '@/features/video/components/video-card';
import { useArticlesQuery } from '@/features/post/queries/post.queries';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useVideosQuery } from '@/features/video/queries/video.queries';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

type Tab = 'all' | 'recipes' | 'articles' | 'videos';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'recipes', label: 'Công thức' },
  { value: 'articles', label: 'Bài viết' },
  { value: 'videos', label: 'Video' },
];

const POPULAR_KEYWORDS = [
  'Phở nấm',
  'Vitamin B12',
  'Đậu hũ',
  'Nem rán chay',
  'Chay Phật giáo',
  'Chả lụa chay',
];

/**
 * Tìm kiếm — đồng bộ `frontend/src/app/(site)/search/page.tsx`: gộp kết quả từ 3 API
 * hiện có (Công thức/Bài viết/Video, đều nhận `q`), không có endpoint search riêng.
 */
export default function SearchScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = React.useState(params.q ?? '');
  const [submittedQuery, setSubmittedQuery] = React.useState(params.q ?? '');
  const [tab, setTab] = React.useState<Tab>('all');

  const hasQuery = submittedQuery.trim().length > 0;
  const limit = tab === 'all' ? 4 : 20;

  const { data: recipesPagination, isLoading: isRecipesLoading } = useRecipesQuery(
    hasQuery && (tab === 'all' || tab === 'recipes') ? { q: submittedQuery, limit } : undefined
  );
  const { data: articlesPagination, isLoading: isArticlesLoading } = useArticlesQuery(
    hasQuery && (tab === 'all' || tab === 'articles') ? { q: submittedQuery, limit } : undefined
  );
  const { data: videosPagination, isLoading: isVideosLoading } = useVideosQuery(
    hasQuery && (tab === 'all' || tab === 'videos') ? { q: submittedQuery, limit } : undefined
  );

  const recipes = tab === 'all' || tab === 'recipes' ? recipesPagination?.items ?? [] : [];
  const articles = tab === 'all' || tab === 'articles' ? articlesPagination?.items ?? [] : [];
  const videos = tab === 'all' || tab === 'videos' ? videosPagination?.items ?? [] : [];
  const isLoading = isRecipesLoading || isArticlesLoading || isVideosLoading;
  const totalResults = recipes.length + articles.length + videos.length;

  const submit = () => setSubmittedQuery(query.trim());

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">Tìm kiếm</Text>

        <View className="flex-row items-center gap-2 rounded-2xl border border-input bg-background px-3.5">
          <SearchIcon size={16} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            returnKeyType="search"
            placeholder="Tìm món ăn, bài viết, video..."
            placeholderTextColor={colors.mutedForeground}
            className="h-12 flex-1 text-sm text-foreground"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setSubmittedQuery('');
              }}
              hitSlop={8}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {!hasQuery ? (
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Từ khóa phổ biến
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR_KEYWORDS.map((kw) => (
                <Pressable
                  key={kw}
                  onPress={() => {
                    setQuery(kw);
                    setSubmittedQuery(kw);
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1.5">
                  <Text className="text-xs font-medium text-foreground">{kw}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-2">
              {TABS.map((t) => {
                const selected = tab === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setTab(t.value)}
                    className={cn('rounded-full px-3.5 py-2', selected ? 'bg-primary' : 'bg-muted')}>
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        selected ? 'font-semibold text-primary-foreground' : 'text-muted-foreground'
                      )}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isLoading ? (
              <Text className="py-6 text-center text-sm text-muted-foreground">Đang tìm kiếm...</Text>
            ) : totalResults === 0 ? (
              <View className="items-center rounded-2xl border border-dashed border-border p-6">
                <Text className="text-center font-semibold text-foreground">Không tìm thấy kết quả</Text>
                <Text className="mt-1 text-center text-sm text-muted-foreground">
                  Thử từ khóa khác hoặc kiểm tra lại chính tả.
                </Text>
              </View>
            ) : (
              <View className="gap-6">
                {recipes.length > 0 ? (
                  <View className="gap-3">
                    <Text className="text-sm font-bold text-foreground">Công thức ({recipes.length})</Text>
                    <View className="flex-row flex-wrap gap-3">
                      {recipes.map((r) => (
                        <RecipeCard key={r.id} recipe={r} className="w-[47%]" />
                      ))}
                    </View>
                  </View>
                ) : null}

                {articles.length > 0 ? (
                  <View className="gap-3">
                    <Text className="text-sm font-bold text-foreground">Bài viết ({articles.length})</Text>
                    <View className="gap-3">
                      {articles.map((a) => (
                        <Link key={a.id} href={`/articles/${a.id}` as Href} asChild>
                          <Pressable>
                            <PostCard post={a} />
                          </Pressable>
                        </Link>
                      ))}
                    </View>
                  </View>
                ) : null}

                {videos.length > 0 ? (
                  <View className="gap-3">
                    <Text className="text-sm font-bold text-foreground">Video ({videos.length})</Text>
                    <View className="gap-3">
                      {videos.map((v) => (
                        <VideoCard key={v.id} video={v} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}
      </View>
    </SiteScreen>
  );
}
