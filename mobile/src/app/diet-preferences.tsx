import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Link, useRouter, type Href } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ErrorState } from '@/components/shared/state-views';
import { FoodPreferencesForm } from '@/features/diet-preferences/components/food-preferences-form';
import { DietImpactReview } from '@/features/diet-preferences/components/diet-impact-review';
import { useDietaryImpactMutation, usePreviewDietRulesMutation, useSaveDietPreferencesMutation } from '@/features/diet-preferences/queries/diet-preferences.queries';
import type { SaveDietPreferencesInput, SavedDietPreferences } from '@/features/diet-preferences/types/diet-preferences.model';
import type { DietaryImpact } from '@/features/diet-preferences/types/diet-impact.model';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';

function severity(value: string): 'MILD' | 'MODERATE' | 'SEVERE' {
  return value === 'MILD' || value === 'SEVERE' ? value : 'MODERATE';
}

export default function DietPreferencesScreen() {
  const router = useRouter();
  const colors = useIconColors();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const profile = useDetailedProfileQuery();
  const policy = usePreviewDietRulesMutation();
  const impactMutation = useDietaryImpactMutation();
  const save = useSaveDietPreferencesMutation();
  const [draft, setDraft] = React.useState<SaveDietPreferencesInput | null>(null);
  const [review, setReview] = React.useState<{ input: SaveDietPreferencesInput; impact: DietaryImpact } | null>(null);
  const [saved, setSaved] = React.useState<SavedDietPreferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [allergySearch, setAllergySearch] = React.useState('');
  const [exclusionSearch, setExclusionSearch] = React.useState('');
  const busy = policy.isPending || impactMutation.isPending || save.isPending;

  const initial = React.useMemo<SaveDietPreferencesInput>(() => {
    const diet = profile.data?.diet;
    return {
      allowEggs: diet?.allowEggs ?? false, allowDairy: diet?.allowDairy ?? false,
      allowHoney: diet?.allowHoney ?? false, allowFivePungent: diet?.allowFivePungent ?? false,
      policyVersion: diet?.policyVersion ?? 1, expectedDietaryRevision: diet?.dietaryRevision ?? 0,
      allergies: (diet?.allergies ?? []).map((item) => ({ ...item, severity: severity(item.severity) })),
      ingredientAllergies: (diet?.ingredientAllergies ?? []).map((item) => ({ ...item, severity: severity(item.severity) })),
      ingredientExclusions: (diet?.ingredientExclusions ?? []).map((item) => ({
        ingredientName: item.ingredientName, ...(item.ingredientId ? { ingredientId: item.ingredientId } : {}),
        ...(item.reason ? { reason: item.reason } : {}),
      })),
    };
  }, [profile.data]);
  const current = draft ?? initial;
  const update = (changes: Partial<SaveDietPreferencesInput>) => {
    setError(null);
    setDraft((value) => ({ ...(value ?? initial), ...changes }));
  };
  const explainError = (cause: unknown) => {
    const code = getApiErrorCode(cause);
    setError(code === 'DIETARY_REVISION_CONFLICT'
      ? 'Hồ sơ đã thay đổi ở nơi khác. Hãy tải lại thiết lập trước khi lưu tiếp.'
      : code === 'INVALID_ALLERGEN_SELECTION'
        ? 'Có dị ứng không còn trong danh mục. Danh sách của bạn vẫn được giữ lại; hãy kiểm tra và chọn lại trước khi lưu.'
        : getApiErrorMessage(cause, 'Không hoàn tất được thao tác. Vui lòng thử lại.'));
  };
  const reload = async () => {
    const result = await profile.refetch();
    if (result.isSuccess) { setDraft(null); setReview(null); setSaved(null); setError(null); }
  };
  const startReview = async () => {
    if (!profile.isSuccess) return;
    setError(null);
    try {
      const config = await policy.mutateAsync(current);
      const input = { ...current, policyVersion: config.policyVersion };
      const impact = await impactMutation.mutateAsync(input);
      setDraft(input);
      setReview({ input, impact });
    } catch (cause) { explainError(cause); }
  };
  const openRepair = (result: SavedDietPreferences) => {
    const ids = result.impact?.plans.filter((plan) => plan.items.length > 0).map((plan) => plan.planId) ?? [];
    if (ids.length === 0) return;
    router.push({ pathname: '/diet-repair', params: {
      planIds: ids.join(','), revision: String(result.preference.dietaryRevision),
    } } as unknown as Href);
  };
  const handleSave = async (replace: boolean) => {
    if (!review || busy) return;
    setError(null);
    try {
      const result = await save.mutateAsync(review.input);
      setSaved(result);
      setReview(null);
      if (replace && !result.impactUnavailable) openRepair(result);
    } catch (cause) { explainError(cause); }
  };
  const retryAssessment = async () => {
    if (!saved) return;
    setError(null);
    try {
      const impact = await impactMutation.mutateAsync({
        ...current, policyVersion: saved.preference.policyVersion,
        expectedDietaryRevision: saved.preference.dietaryRevision,
      });
      setSaved({ ...saved, impact, impactUnavailable: false });
    } catch (cause) { explainError(cause); }
  };

  if (!authenticated) return (
    <SiteScreen><View className="gap-4 px-5 pt-8">
      <Text className="text-xl font-semibold text-foreground">Đăng nhập để thiết lập ăn uống</Text>
      <Link href={'/(auth)/login' as Href} asChild><PrimaryButton label="Đăng nhập" /></Link>
    </View></SiteScreen>
  );
  if (profile.isPending) return (
    <SiteScreen><View className="items-center gap-3 p-8"><ActivityIndicator color={colors.primary} />
      <Text className="text-sm text-muted-foreground">Đang tải thiết lập đã lưu...</Text>
    </View></SiteScreen>
  );
  if (profile.isError) return (
    <SiteScreen><View className="px-5 pt-6"><ErrorState title="Không tải được hồ sơ ăn uống"
      description="Hãy tải lại trước khi chỉnh sửa để không ghi đè dữ liệu đã lưu."
      onRetry={() => void profile.refetch()} /></View></SiteScreen>
  );

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Thiết lập ăn uống</Text>
          <Text className="text-sm leading-5 text-muted-foreground">Lựa chọn thực phẩm, dị ứng và nguyên liệu bạn muốn kiêng.</Text>
        </View>
        {saved ? (
          <View className="gap-4">
            <View className="gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Text className="text-lg font-semibold text-foreground">Đã lưu thiết lập ăn uống</Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                {saved.impactUnavailable
                  ? 'Chưa kiểm tra được ảnh hưởng tới thực đơn. Thiết lập đã lưu vẫn được áp dụng; hãy thử kiểm tra lại.'
                  : saved.impact?.affectedMealCount
                    ? `Bạn đang giữ thực đơn với ${saved.impact.affectedMealCount} bữa cần xem lại. Cảnh báo vẫn hiển thị tại thực đơn cho đến khi được xử lý.`
                    : 'Không có bữa ăn sắp tới bị ảnh hưởng. Những món đang phù hợp được giữ nguyên.'}
              </Text>
            </View>
            {saved.impactUnavailable ? <PrimaryButton label="Kiểm tra lại thực đơn" loading={busy} onPress={() => void retryAssessment()} /> : null}
            {!saved.impactUnavailable && (saved.impact?.affectedMealCount ?? 0) > 0
              ? <PrimaryButton label="Tìm món thay thế" onPress={() => openRepair(saved)} /> : null}
            {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
            <Link href={'/(tabs)/profile' as Href} asChild><PrimaryButton label="Về hồ sơ" variant="outline" /></Link>
          </View>
        ) : review ? (
          <DietImpactReview selection={review.input} impact={review.impact} busy={busy} error={error}
            onKeep={() => void handleSave(false)} onReplace={() => void handleSave(true)} onBack={() => setReview(null)} />
        ) : (
          <FoodPreferencesForm allowances={current} onAllowancesChange={(allowances) => update(allowances)}
            allergies={current.allergies} onAllergiesChange={(allergies) => update({ allergies })}
            ingredientAllergies={current.ingredientAllergies ?? []} onIngredientAllergiesChange={(ingredientAllergies) => update({ ingredientAllergies })}
            exclusions={current.ingredientExclusions} onExclusionsChange={(ingredientExclusions) => update({ ingredientExclusions })}
            allergySearch={allergySearch} onAllergySearchChange={setAllergySearch}
            exclusionSearch={exclusionSearch} onExclusionSearchChange={setExclusionSearch}
            busy={busy} error={error} onReview={() => void startReview()}
            onCancel={() => router.replace('/(tabs)/profile' as Href)} />
        )}
        {error ? <PrimaryButton label="Tải lại thiết lập đã lưu" variant="outline" disabled={busy} onPress={() => void reload()} /> : null}
      </View>
    </SiteScreen>
  );
}
