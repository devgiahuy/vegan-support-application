import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Lock,
  RefreshCw,
  ShieldAlert,
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
import { AllergySeverity, DietPattern, PracticeSchedule, Tradition } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { IngredientPicker } from '@/features/ingredient/components/ingredient-picker';
import { AllergenPicker } from '@/features/allergen/components/allergen-picker';
import type { AllergenOption } from '@/features/allergen/types/allergen.model';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { useAuthStore } from '@/store/useAuthStore';

const PATTERN_OPTIONS: { value: DietPattern; label: string; note: string }[] = [
  { value: DietPattern.VEGAN, label: 'Thuần chay', note: '100% thực vật, không trứng/sữa/mật ong' },
  { value: DietPattern.LACTO_OVO, label: 'Có trứng sữa', note: 'Cho phép trứng và sữa động vật' },
];

const SCHEDULE_OPTIONS: { value: PracticeSchedule; label: string; note: string }[] = [
  { value: PracticeSchedule.PERMANENT, label: 'Trường chay', note: 'Ăn chay quanh năm' },
  { value: PracticeSchedule.PERIODIC, label: 'Chay kỳ', note: 'Ăn chay theo ngày cố định trong tháng' },
];

const TRADITION_OPTIONS: { value: Tradition; label: string }[] = [
  { value: Tradition.NONE, label: 'Không theo truyền thống' },
  { value: Tradition.BUDDHIST, label: 'Phật giáo' },
  { value: Tradition.CHRISTIAN, label: 'Kitô giáo' },
];

const SEVERITY_OPTIONS: { value: AllergySeverity; label: string }[] = [
  { value: AllergySeverity.MILD, label: 'Nhẹ' },
  { value: AllergySeverity.MODERATE, label: 'Trung bình' },
  { value: AllergySeverity.SEVERE, label: 'Nặng' },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Step = 'select' | 'review' | 'done';

function toSeverity(value: string): DraftAllergy['severity'] {
  return value === 'MILD' || value === 'SEVERE' ? value : 'MODERATE';
}

function OptionPill({
  selected,
  label,
  note,
  onPress,
}: {
  selected: boolean;
  label: string;
  note?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-xl border px-3.5 py-3',
        selected ? 'border-primary bg-primary/10' : 'border-input bg-background'
      )}>
      <Text className={cn('text-sm', selected ? 'font-semibold text-primary' : 'text-foreground')}>{label}</Text>
      {note ? <Text className="mt-0.5 text-xs text-muted-foreground">{note}</Text> : null}
    </Pressable>
  );
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

  const [allergenQuery, setAllergenQuery] = React.useState('');
  const [ingredientAllergyValue, setIngredientAllergyValue] = React.useState<{
    displayName: string;
    ingredientId: string | null;
  }>({ displayName: '', ingredientId: null });
  const [allergenSeverity, setAllergenSeverity] = React.useState<AllergySeverity>(AllergySeverity.MODERATE);
  const [exclusionName, setExclusionName] = React.useState('');
  const [exclusionIngredientId, setExclusionIngredientId] = React.useState<string | null>(null);
  const [exclusionReason, setExclusionReason] = React.useState('');
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

  const selectedAllergenCodes = React.useMemo(() => new Set(allergies.map((a) => a.allergenCode)), [allergies]);

  const addAllergy = (option: AllergenOption) => {
    if (selectedAllergenCodes.has(option.code)) {
      Alert.alert('Đã tồn tại', 'Chất này đã có trong danh sách.');
      return;
    }
    setAllergies((prev) => [...prev, { allergenCode: option.code, label: option.label, severity: allergenSeverity }]);
    setAllergenQuery('');
  };

  const addIngredientAllergy = () => {
    const { ingredientId, displayName } = ingredientAllergyValue;
    if (!ingredientId) {
      Alert.alert('Chưa chọn nguyên liệu', 'Hãy chọn một nguyên liệu trong danh sách gợi ý.');
      return;
    }
    if (ingredientAllergies.some((a) => a.ingredientId === ingredientId)) {
      Alert.alert('Đã tồn tại', 'Nguyên liệu này đã có trong danh sách.');
      return;
    }
    setIngredientAllergies((prev) => [...prev, { ingredientId, ingredientName: displayName, severity: allergenSeverity }]);
    setIngredientAllergyValue({ displayName: '', ingredientId: null });
  };

  const addExclusion = () => {
    const name = exclusionName.trim();
    if (!name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nguyên liệu cần loại trừ.');
      return;
    }
    setExclusions((prev) => [
      ...prev,
      {
        ingredientName: name,
        ...(exclusionIngredientId ? { ingredientId: exclusionIngredientId } : {}),
        reason: exclusionReason.trim() || undefined,
      },
    ]);
    setExclusionName('');
    setExclusionIngredientId(null);
    setExclusionReason('');
  };

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
    const pendingIngredientText =
      ingredientAllergyValue.displayName.trim().length > 0 && !ingredientAllergyValue.ingredientId;
    if (allergenQuery.trim().length > 0 || pendingIngredientText) {
      setSaveError('Bạn đang nhập dị ứng nhưng chưa chọn từ gợi ý. Hãy chọn một mục hoặc xoá chữ đã nhập.');
      return;
    }
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
          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kiểu ăn
              </Text>
              <View className="gap-2">
                {PATTERN_OPTIONS.map((o) => (
                  <OptionPill key={o.value} selected={dietPattern === o.value} label={o.label} note={o.note} onPress={() => setDietPattern(o.value)} />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lịch thực hành
              </Text>
              <View className="gap-2">
                {SCHEDULE_OPTIONS.map((o) => (
                  <OptionPill key={o.value} selected={practiceSchedule === o.value} label={o.label} note={o.note} onPress={() => setPracticeSchedule(o.value)} />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Truyền thống
              </Text>
              <View className="gap-2">
                {TRADITION_OPTIONS.map((o) => (
                  <OptionPill key={o.value} selected={tradition === o.value} label={o.label} onPress={() => setTradition(o.value)} />
                ))}
              </View>
            </View>

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

            <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
              <View className="flex-row items-center gap-1.5">
                <ShieldAlert size={14} color={colors.destructive} />
                <Text className="text-sm font-bold text-foreground">Dị ứng (luôn là ràng buộc cứng)</Text>
              </View>
              {allergies.length > 0 ? (
                <View className="flex-row flex-wrap gap-1.5">
                  {allergies.map((a) => (
                    <View key={a.allergenCode} className="flex-row items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1">
                      <Text className="text-xs font-medium text-destructive">{a.label}</Text>
                      <Pressable onPress={() => setAllergies((prev) => prev.filter((x) => x.allergenCode !== a.allergenCode))}>
                        <X size={11} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text className="text-[11px] text-muted-foreground">
                Chọn mức độ, rồi tìm và chạm chọn dị ứng trong danh mục (áp dụng cho cả dị ứng theo nguyên liệu bên dưới).
              </Text>
              <View className="flex-row gap-1.5">
                {SEVERITY_OPTIONS.map((o) => (
                  <Pressable
                    key={o.value}
                    onPress={() => setAllergenSeverity(o.value)}
                    className={cn('flex-1 items-center rounded-lg border px-2 py-2', allergenSeverity === o.value ? 'border-destructive bg-destructive/10' : 'border-input')}>
                    <Text className={cn('text-xs', allergenSeverity === o.value ? 'font-semibold text-destructive' : 'text-foreground')}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
              <AllergenPicker
                query={allergenQuery}
                onQueryChange={setAllergenQuery}
                selectedCodes={selectedAllergenCodes}
                onSelect={addAllergy}
              />
            </View>

            <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
              <View className="flex-row items-center gap-1.5">
                <ShieldAlert size={14} color={colors.destructive} />
                <Text className="text-sm font-bold text-foreground">Dị ứng theo nguyên liệu (ràng buộc cứng)</Text>
              </View>
              {ingredientAllergies.length > 0 ? (
                <View className="flex-row flex-wrap gap-1.5">
                  {ingredientAllergies.map((a) => (
                    <View key={a.ingredientId} className="flex-row items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1">
                      <Text className="text-xs font-medium text-destructive">{a.ingredientName}</Text>
                      <Pressable onPress={() => setIngredientAllergies((prev) => prev.filter((x) => x.ingredientId !== a.ingredientId))}>
                        <X size={11} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <IngredientPicker
                placeholder="Tên nguyên liệu (VD: Đậu phộng rang)"
                value={ingredientAllergyValue}
                onChange={setIngredientAllergyValue}
              />
              <Text className="text-[11px] text-muted-foreground">
                Phải chọn một nguyên liệu chuẩn trong gợi ý, không dùng tên tự nhập.
              </Text>
              <PrimaryButton label="Thêm nguyên liệu dị ứng" variant="outline" onPress={addIngredientAllergy} />
            </View>

            <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
              <Text className="text-sm font-bold text-foreground">Nguyên liệu loại trừ</Text>
              {exclusions.length > 0 ? (
                <View className="gap-1.5">
                  {exclusions.map((e, idx) => (
                    <View key={`${e.ingredientName}-${idx}`} className="flex-row items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                      <Text className="flex-1 text-xs text-foreground">{e.ingredientName}</Text>
                      <Pressable onPress={() => setExclusions((prev) => prev.filter((_, i) => i !== idx))}>
                        <X size={13} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <IngredientPicker
                placeholder="Tên nguyên liệu (VD: Nấm hương)"
                value={{ displayName: exclusionName, ingredientId: exclusionIngredientId }}
                onChange={(next) => {
                  setExclusionName(next.displayName);
                  setExclusionIngredientId(next.ingredientId);
                }}
              />
              <TextInput
                value={exclusionReason}
                onChangeText={setExclusionReason}
                placeholder="Lý do (không bắt buộc)"
                placeholderTextColor={colors.mutedForeground}
                className="rounded-xl border border-input bg-background p-2.5 text-sm text-foreground"
              />
              <PrimaryButton label="Thêm loại trừ" variant="outline" onPress={addExclusion} />
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
