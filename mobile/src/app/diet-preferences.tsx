import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Lock,
  RefreshCw,
  X,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { DatePickerModal } from '@/components/ui/date-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  usePreviewDietRulesMutation,
  useSaveDietPreferencesMutation,
} from '@/features/diet-preferences/queries/diet-preferences.queries';
import type { DietSelection } from '@/features/diet-preferences/api/diet-preferences.api';
import type {
  DietRulePreview,
  DraftAllergy,
  DraftIngredientAllergy,
  DraftIngredientExclusion,
} from '@/features/diet-preferences/types/diet-preferences.model';
import { DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { AllergyEditor } from '@/features/diet-preferences/components/allergy-editor';
import { ExclusionEditor } from '@/features/diet-preferences/components/exclusion-editor';
import {
  DietOptionGroup,
  PATTERN_OPTIONS,
  SCHEDULE_OPTIONS,
  TRADITION_OPTIONS,
} from '@/features/diet-preferences/components/diet-option-group';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Step = 'select' | 'review' | 'done';

function toSeverity(value: string): DraftAllergy['severity'] {
  return value === 'MILD' || value === 'SEVERE' ? value : 'MODERATE';
}

/**
 * Thiết lập chế độ ăn/dị ứng/loại trừ — wizard 3 bước đồng bộ
 * `frontend/src/features/diet-preferences/components/diet-wizard.tsx` (chọn bộ ba →
 * xem trước rule set + dị ứng/kiêng → xác nhận lưu). Đây là ràng buộc backend-enforced
 * (BL); UI chỉ thu thập, KHÔNG tự lọc công thức thay backend.
 */
export default function DietPreferencesScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [step, setStep] = React.useState<Step>('select');
  const [dietPattern, setDietPattern] = React.useState<DietPattern | null>(null);
  const [practiceSchedule, setPracticeSchedule] = React.useState<PracticeSchedule | null>(null);
  const [tradition, setTradition] = React.useState<Tradition | null>(null);

  const [confirmed, setConfirmed] = React.useState<DietSelection | null>(null);
  const [preview, setPreview] = React.useState<DietRulePreview | null>(null);
  const [ruleOverrides, setRuleOverrides] = React.useState<Record<string, boolean>>({});
  const [scheduleDates, setScheduleDates] = React.useState<string[]>([]);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [configUnavailable, setConfigUnavailable] = React.useState(false);

  const [allergySearch, setAllergySearch] = React.useState('');
  const [exclusionSearch, setExclusionSearch] = React.useState('');
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Dị ứng đang lưu được dùng làm giá trị ban đầu để lưu lại không xoá nhầm lựa chọn đã khai báo ở nơi khác (web).
  // Người dùng sửa thì `*Draft` thay thế hẳn bản ban đầu. `ingredientAllergies` chỉ gửi khi hồ sơ đã tải xong;
  // chưa tải thì bỏ qua để BE giữ nguyên.
  const profileQuery = useDetailedProfileQuery();
  const profileLoaded = profileQuery.isSuccess;
  const savedAllergies = React.useMemo<DraftAllergy[]>(
    () =>
      (profileQuery.data?.diet?.allergies ?? []).map((a) => ({
        allergenCode: a.allergenCode,
        label: a.label,
        severity: toSeverity(a.severity),
      })),
    [profileQuery.data]
  );
  const savedIngredientAllergies = React.useMemo<DraftIngredientAllergy[]>(
    () =>
      (profileQuery.data?.diet?.ingredientAllergies ?? []).map((a) => ({
        ingredientId: a.ingredientId,
        ingredientName: a.ingredientName,
        severity: toSeverity(a.severity),
      })),
    [profileQuery.data]
  );
  const [allergiesDraft, setAllergiesDraft] = React.useState<DraftAllergy[] | null>(null);
  const [ingredientAllergiesDraft, setIngredientAllergiesDraft] = React.useState<DraftIngredientAllergy[] | null>(null);
  const savedExclusions = React.useMemo<DraftIngredientExclusion[]>(
    () =>
      (profileQuery.data?.diet?.ingredientExclusions ?? []).map((e) => ({
        ingredientName: e.ingredientName,
        ...(e.ingredientId ? { ingredientId: e.ingredientId } : {}),
        ...(e.reason ? { reason: e.reason } : {}),
      })),
    [profileQuery.data]
  );
  const [exclusionsDraft, setExclusionsDraft] = React.useState<DraftIngredientExclusion[] | null>(null);
  const exclusions = exclusionsDraft ?? savedExclusions;
  const setExclusions = (update: (current: DraftIngredientExclusion[]) => DraftIngredientExclusion[]) =>
    setExclusionsDraft((draft) => update(draft ?? savedExclusions));
  const allergies = allergiesDraft ?? savedAllergies;
  const ingredientAllergies = ingredientAllergiesDraft ?? savedIngredientAllergies;
  const setAllergies = (update: (current: DraftAllergy[]) => DraftAllergy[]) =>
    setAllergiesDraft((draft) => update(draft ?? savedAllergies));
  const setIngredientAllergies = (update: (current: DraftIngredientAllergy[]) => DraftIngredientAllergy[]) =>
    setIngredientAllergiesDraft((draft) => update(draft ?? savedIngredientAllergies));

  const previewMutation = usePreviewDietRulesMutation();
  const saveMutation = useSaveDietPreferencesMutation();

  const isPeriodic = confirmed?.practiceSchedule === PracticeSchedule.PERIODIC;

  const loadPreview = async (selection: DietSelection) => {
    setSaveError(null);
    setConfigUnavailable(false);
    try {
      const result = await previewMutation.mutateAsync(selection);
      setPreview(result);
      setRuleOverrides({});
      setConfirmed(selection);
      setStep('review');
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DIET_RULES_UNAVAILABLE') {
        setConfigUnavailable(true);
      }
      Alert.alert('Không tải được bộ quy tắc', getApiErrorMessage(error));
    }
  };

  const startPreview = () => {
    if (!dietPattern || !practiceSchedule || !tradition) return;
    void loadPreview({ dietPattern, practiceSchedule, tradition });
  };

  const toggleRule = (id: string) => {
    setRuleOverrides((prev) => ({ ...prev, [id]: !(prev[id] ?? undefined) }));
  };

  const mergedRules = (preview?.rules ?? []).map((r) => ({
    ...r,
    enabled: r.hardConstraint ? true : (ruleOverrides[r.id] ?? r.defaultEnabled),
  }));

  const addDate = (value: string) => {
    if (!DATE_RE.test(value)) {
      Alert.alert('Ngày không hợp lệ', 'Ngày phải đúng dạng YYYY-MM-DD (ví dụ 2026-09-15).');
      return;
    }
    if (scheduleDates.includes(value)) {
      Alert.alert('Đã tồn tại', 'Ngày này đã có trong danh sách.');
      return;
    }
    setScheduleDates((prev) => [...prev, value].sort());
  };

  const handleSave = async () => {
    if (!confirmed || !preview) return;
    if (isPeriodic && scheduleDates.length === 0) {
      setSaveError('Lịch chay kỳ cần ít nhất một ngày. Hãy chọn ngày bên dưới rồi xác nhận.');
      return;
    }
    setSaveError(null);
    try {
      const result = await saveMutation.mutateAsync({
        dietPattern: confirmed.dietPattern,
        practiceSchedule: confirmed.practiceSchedule,
        tradition: confirmed.tradition,
        ruleSetVersion: preview.ruleSetVersion,
        ruleSelections: mergedRules.map((r) => ({ ruleDefinitionId: r.id, enabled: r.enabled })),
        ...(isPeriodic ? { scheduleDates } : {}),
        allergies,
        ...(profileLoaded ? { ingredientAllergies } : {}),
        ingredientExclusions: exclusions,
      });
      setStep('done');
      if (result?.requiresRuleReview) {
        setStep('review');
        void loadPreview(confirmed);
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DIET_RULE_RECONFIRMATION_REQUIRED' || code === 'INVALID_DIET_RULE_SELECTION') {
        setSaveError('Bộ quy tắc đã thay đổi. Đang tải lại, vui lòng xác nhận lại.');
        void loadPreview(confirmed);
        return;
      }
      if (code === 'DIET_RULES_UNAVAILABLE') {
        setConfigUnavailable(true);
        setSaveError('Cấu hình diet chưa sẵn sàng từ hệ thống. Vui lòng thử lại sau.');
        return;
      }
      if (code === 'DIET_SCHEDULE_REQUIRED') {
        setSaveError('Lịch chay kỳ cần chọn ngày. Hãy thêm ít nhất một ngày rồi lưu lại.');
        return;
      }
      if (code === 'INVALID_ALLERGEN_SELECTION') {
        const invalid = getApiErrorFields(error)?.invalidAllergenCodes;
        const invalidCodes = Array.isArray(invalid) ? invalid.filter((c): c is string => typeof c === 'string') : [];
        if (invalidCodes.length > 0) {
          setAllergies((prev) => prev.filter((a) => !invalidCodes.includes(a.allergenCode)));
        }
        setSaveError('Có dị ứng không còn trong danh mục nên đã được bỏ khỏi danh sách. Hãy chọn lại từ gợi ý rồi lưu.');
        return;
      }
      if (code === 'INVALID_INGREDIENT_ALLERGIES') {
        setSaveError('Có nguyên liệu dị ứng không còn hoạt động trong danh mục. Hãy bỏ hoặc chọn nguyên liệu khác.');
        return;
      }
      if (code === 'INVALID_INGREDIENT_EXCLUSIONS') {
        setSaveError('Danh sách kiêng có mục rỗng hoặc trùng. Vui lòng kiểm tra lại.');
        return;
      }
      setSaveError(getApiErrorMessage(error, 'Lưu lựa chọn thất bại. Vui lòng thử lại.'));
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="mt-2 text-center text-xl font-bold text-foreground">
              Đăng nhập để thiết lập chế độ ăn
            </Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Chế độ ăn & dị ứng</Text>
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Quy tắc này do hệ thống áp dụng khi lọc công thức và tạo thực đơn — dị ứng và nguyên liệu
            loại trừ luôn là ràng buộc cứng, không thể tắt.
          </Text>
        </View>

        {step === 'select' ? (
          <View className="gap-6 rounded-2xl border border-border bg-card p-4">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground">Chế độ ăn</Text>
              <Text className="text-sm text-muted-foreground">Chọn kiểu ăn, thời gian thực hành và truyền thống bạn theo.</Text>
            </View>

            <DietOptionGroup
              title="Bạn ăn chay theo kiểu nào?"
              description="Quyết định nhóm thực phẩm động vật bị loại khỏi gợi ý."
              options={PATTERN_OPTIONS}
              value={dietPattern}
              onChange={setDietPattern}
              columns={2}
            />
            <DietOptionGroup
              title="Bạn ăn chay khi nào?"
              description="Chay kỳ chỉ lọc món vào những ngày bạn đánh dấu."
              options={SCHEDULE_OPTIONS}
              value={practiceSchedule}
              onChange={setPracticeSchedule}
              columns={2}
            />
            <DietOptionGroup
              title="Bạn có theo truyền thống nào không?"
              description="Truyền thống bổ sung các quy tắc riêng ngoài kiểu ăn."
              options={TRADITION_OPTIONS}
              value={tradition}
              onChange={setTradition}
              columns={1}
            />

            <PrimaryButton
              label={previewMutation.isPending ? 'Đang tải quy tắc...' : 'Xem trước quy tắc'}
              loading={previewMutation.isPending}
              disabled={!dietPattern || !practiceSchedule || !tradition}
              icon={<ArrowRight size={16} color={colors.primaryForeground} />}
              onPress={startPreview}
            />
          </View>
        ) : null}

        {step === 'review' && preview ? (
          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-bold text-foreground">Bộ quy tắc áp dụng</Text>
              {mergedRules.map((rule) => (
                <View key={rule.id} className="flex-row items-start gap-3 rounded-xl border border-border p-3">
                  <Pressable
                    disabled={rule.hardConstraint}
                    onPress={() => toggleRule(rule.id)}
                    className={cn(
                      'mt-0.5 h-5 w-5 items-center justify-center rounded-md border',
                      rule.enabled ? 'border-primary bg-primary' : 'border-input bg-background'
                    )}>
                    {rule.enabled ? <CheckCircle2 size={14} color={colors.primaryForeground} /> : null}
                  </Pressable>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-sm font-semibold text-foreground">{rule.label}</Text>
                      {rule.hardConstraint ? <Lock size={12} color={colors.mutedForeground} /> : null}
                    </View>
                    <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{rule.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="gap-6 rounded-2xl border border-border bg-card p-4">
              <View className="gap-1">
                <Text className="text-lg font-semibold text-foreground">Dị ứng & kiêng</Text>
                <Text className="text-sm text-muted-foreground">Khai báo thực phẩm gây dị ứng và nguyên liệu bạn không muốn ăn.</Text>
              </View>
              <AllergyEditor
                allergies={allergies}
                onAllergiesChange={(next) => setAllergies(() => next)}
                ingredientAllergies={ingredientAllergies}
                onIngredientAllergiesChange={(next) => setIngredientAllergies(() => next)}
                search={allergySearch}
                onSearchChange={setAllergySearch}
              />
              <ExclusionEditor
                value={exclusions}
                onChange={(next) => setExclusions(() => next)}
                search={exclusionSearch}
                onSearchChange={setExclusionSearch}
              />
            </View>

            {isPeriodic ? (
              <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
                <View className="flex-row items-center gap-1.5">
                  <CalendarPlus size={14} color={colors.primary} />
                  <Text className="text-sm font-bold text-foreground">Ngày chay kỳ (bắt buộc)</Text>
                </View>
                {scheduleDates.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5">
                    {scheduleDates.map((d) => (
                      <View key={d} className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                        <Text className="text-xs font-medium text-primary">{d}</Text>
                        <Pressable onPress={() => setScheduleDates((prev) => prev.filter((x) => x !== d))}>
                          <X size={11} color={colors.primary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                <PrimaryButton
                  label="Thêm ngày chay"
                  variant="outline"
                  icon={<CalendarPlus size={16} color={colors.primary} />}
                  onPress={() => setPickerOpen(true)}
                />
                <DatePickerModal
                  visible={pickerOpen}
                  title="Chọn ngày chay"
                  onSelect={addDate}
                  onClose={() => setPickerOpen(false)}
                />
              </View>
            ) : null}

            {saveError ? (
              <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <AlertTriangle size={16} color={colors.destructive} />
                <Text className="flex-1 text-sm text-destructive">{saveError}</Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-2">
              <PrimaryButton
                label="Chọn lại"
                variant="outline"
                icon={<ArrowLeft size={16} color={colors.foreground} />}
                onPress={() => setStep('select')}
                className="flex-1"
              />
              <PrimaryButton
                label="Tải lại"
                variant="outline"
                icon={<RefreshCw size={16} color={colors.foreground} />}
                onPress={() => confirmed && void loadPreview(confirmed)}
                className="flex-1"
              />
            </View>
            <PrimaryButton
              label={saveMutation.isPending ? 'Đang lưu...' : 'Xác nhận lưu'}
              loading={saveMutation.isPending}
              disabled={configUnavailable || profileQuery.isLoading}
              icon={<CheckCircle2 size={16} color={colors.primaryForeground} />}
              onPress={() => void handleSave()}
            />
          </View>
        ) : null}

        {step === 'done' ? (
          <View className="items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <CheckCircle2 size={32} color={colors.primary} />
            <Text className="text-center text-lg font-bold text-foreground">
              Đã lưu chế độ ăn của bạn
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              Quy tắc mới sẽ được áp dụng khi lọc công thức và tạo thực đơn.
            </Text>
            <Link href="/profile" asChild>
              <PrimaryButton label="Về Hồ sơ" />
            </Link>
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}