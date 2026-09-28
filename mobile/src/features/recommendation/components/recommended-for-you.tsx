import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Sparkles, SlidersHorizontal } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useHomeRecommendationsQuery, usePersonalizationConsentQuery, useSetPersonalizationConsentMutation } from '../queries/recommendation.queries';

export function RecommendedForYou() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError } = useHomeRecommendationsQuery({ limit: 4 });
  const consentQuery = usePersonalizationConsentQuery();
  const consentMutation = useSetPersonalizationConsentMutation();
  const recommendations = data?.items ?? [];
  const consent = consentQuery.data;

  const toggleConsent = () => {
    if (!consent) return;
    consentMutation.mutate({ enabled: !consent.enabled, consentVersion: consent.consentVersion });
  };

  return (
    <View className="mt-8 px-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color={colors.cta} />
            <Text className="text-xs font-semibold uppercase tracking-wide text-cta">Goi y cho ban</Text>
          </View>
          <Text className="mt-1 text-xl font-bold text-foreground">Mon phu hop thoi quen cua ban</Text>
        </View>
        {consent ? (
          <Pressable
            onPress={toggleConsent}
            disabled={consentMutation.isPending}
            className={consent.enabled ? 'rounded-full bg-primary px-3 py-1.5' : 'rounded-full bg-muted px-3 py-1.5'}>
            <Text className={consent.enabled ? 'text-xs font-semibold text-primary-foreground' : 'text-xs font-semibold text-muted-foreground'}>
              {consent.enabled ? 'Ca nhan hoa' : 'Quy chuan'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-4 gap-3">
        {!isAuthenticated ? (
          <View className="rounded-2xl border border-dashed border-border p-5">
            <Text className="font-semibold text-foreground">Dang nhap de nhan goi y rieng</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Goi y ca nhan dung lich su xem, luu mon va meal plan da duoc ban cho phep.
            </Text>
            <Link href={'/(auth)/login' as Href} asChild>
              <PrimaryButton label="Dang nhap" className="mt-4 w-full" />
            </Link>
          </View>
        ) : isLoading ? (
          [1, 2].map((item) => <View key={item} className="h-28 rounded-2xl border border-border bg-muted" />)
        ) : isError ? (
          <View className="rounded-2xl border border-dashed border-border p-5">
            <Text className="text-sm text-muted-foreground">
              Chua tai duoc goi y ca nhan hoa. Ban van co the xem cac mon xu huong ben duoi.
            </Text>
          </View>
        ) : recommendations.length === 0 ? (
          <View className="rounded-2xl border border-dashed border-border p-5">
            <Text className="font-semibold text-foreground">Chua co goi y rieng</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Luu mon, xem cong thuc hoac tao meal plan de he thong co tin hieu goi y tot hon.
            </Text>
          </View>
        ) : (
          recommendations.map((item) => (
            <Link key={item.id} href={`/recipes/${item.id}` as Href} asChild>
              <Pressable className="flex-row gap-3 rounded-2xl border border-border bg-card p-3">
                <View className="h-20 w-24 overflow-hidden rounded-xl bg-muted">
                  {item.coverImageUrl ? (
                    <Image source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : null}
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={2} className="text-sm font-bold text-foreground">{item.title}</Text>
                  <Text numberOfLines={2} className="mt-1 text-xs text-muted-foreground">
                    {item.reasonLabels.join(' · ') || 'Phu hop voi che do an cua ban'}
                  </Text>
                  <Text className="mt-2 text-xs font-semibold text-primary">
                    {item.calories ? `${item.calories} kcal` : 'Xem chi tiet'}
                  </Text>
                </View>
              </Pressable>
            </Link>
          ))
        )}
      </View>

      {isAuthenticated && consent ? (
        <View className="mt-3">
          <PrimaryButton
            label={consent.enabled ? 'Tat ca nhan hoa' : 'Bat ca nhan hoa'}
            variant="outline"
            loading={consentMutation.isPending}
            icon={<SlidersHorizontal size={16} color={colors.foreground} />}
            onPress={toggleConsent}
          />
        </View>
      ) : null}
    </View>
  );
}
