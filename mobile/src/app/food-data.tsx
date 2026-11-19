import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  Award,
  ChefHat,
  CheckCircle2,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'nativewind';
import { useLocalSearchParams } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getAllergenName } from '@/common/constants/diet-labels';
import {
  FOOD_GROUP_ORDER,
  FOOD_GROUP_THEMES,
  foodGroupPalette,
  groupIngredientsByFoodGroup,
} from '@/features/ingredient/utils/food-group-themes';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import {
  useCookingMethodsQuery,
  useIngredientNutrientsQuery,
  useInteractionRulesQuery,
  useReferenceIntakesQuery,
} from '@/features/food-data/queries/food-data.queries';
import type {
  CookingMethodItem,
  FoodInteractionRuleItem,
  InteractionScope,
  NutrientItem,
  ProvenanceInfo,
} from '@/features/food-data/types/food-data.model';
import { FoodGroup } from '@/common/enums';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const INGREDIENT_PAGE_SIZE = 12;

const FOOD_GROUP_OPTIONS: DropdownOption<FoodGroup | 'ALL'>[] = [
  { value: 'ALL', label: 'Mọi nhóm', shortLabel: 'Mọi nhóm' },
  ...FOOD_GROUP_ORDER.map((group) => ({ value: group, label: FOOD_GROUP_THEMES[group].label })),
];

const SCOPE_OPTIONS: DropdownOption<InteractionScope | 'ALL'>[] = [
  { value: 'ALL', label: 'Tất cả phạm vi' },
  { value: 'SAME_DISH', label: 'Cùng món' },
  { value: 'SAME_MEAL', label: 'Cùng bữa' },
  { value: 'SAME_DAY', label: 'Cùng ngày' },
];

const SCOPE_COLORS: Record<InteractionScope, { light: string; dark: string }> = {
  SAME_MEAL: { light: '#0284c7', dark: '#38bdf8' },
  SAME_DISH: { light: '#e11d48', dark: '#fb7185' },
  SAME_DAY: { light: '#7c3aed', dark: '#a78bfa' },
};

type SectionKey = 'INGREDIENT' | 'INTERACTION' | 'COOKING';

const FOOD_TABS: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: 'INGREDIENT', label: 'Nguyên liệu 100g', icon: Scale },
  { key: 'INTERACTION', label: 'Kiêng kỵ', icon: Layers },
  { key: 'COOKING', label: 'Chế biến', icon: ChefHat },
];

function resolveInitialTab(tabParam: string | undefined): SectionKey {
  if (tabParam === 'INTERACTION') return 'INTERACTION';
  if (tabParam === 'COOKING') return 'COOKING';
  return 'INGREDIENT';
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <Text className="text-lg font-bold tracking-tight text-foreground">{title}</Text>
      <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

function SearchBox({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const colors = useIconColors();
  return (
    <View className="h-[52px] flex-1 flex-row items-center gap-2 rounded-xl border border-input bg-card pl-3.5 pr-1">
      <Search size={16} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        className="flex-1 text-sm text-foreground"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa tìm kiếm"
          onPress={() => onChangeText('')}
          className="h-10 w-10 items-center justify-center rounded-full">
          <X size={15} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionLoading() {
  return (
    <View className="gap-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="h-20 rounded-2xl border border-border bg-muted" />
      ))}
    </View>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center gap-3 rounded-2xl border border-dashed border-border p-6">
      <Text className="text-center text-sm text-muted-foreground">Không tải được dữ liệu. Kiểm tra kết nối mạng và thử lại.</Text>
      <PrimaryButton label="Thử lại" variant="outline" onPress={onRetry} className="w-full" />
    </View>
  );
}

function SectionEmpty({ title, description }: { title: string; description: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-border p-6">
      <Sparkles size={22} color="#9ca3af" />
      <Text className="mt-2 text-center font-semibold text-foreground">{title}</Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">{description}</Text>
    </View>
  );
}

function NutritionFactsView({ ingredientId, colors }: { ingredientId: string; colors: ReturnType<typeof useIconColors> }) {
  const { data, isLoading, isError, refetch } = useIngredientNutrientsQuery(ingredientId, { preparation: 'raw' });
  const { data: intakes } = useReferenceIntakesQuery({ populationCode: 'GENERAL_ADULT', limit: 100 });

  const calculateDV = (code: string, amount: number | null): number | null => {
    if (amount === null || !intakes?.items?.length) return null;
    const ref = intakes.items.find((r) => r.nutrientCode === code && r.populationCode === 'GENERAL_ADULT');
    if (!ref || ref.value <= 0) return null;
    return Math.round((amount / ref.value) * 100);
  };

  const renderRow = (item: NutrientItem, bold = false) => {
    const dv = calculateDV(item.code, item.amount);
    return (
      <View key={item.id || item.code} className="flex-row items-center justify-between border-b border-muted py-1.5">
        <View className="flex-1 flex-row items-center gap-1.5 pr-2">
          <Text className={bold ? 'text-xs font-bold text-foreground' : 'text-xs text-foreground'}>{item.name}</Text>
          <Text className="font-mono text-[11px] text-muted-foreground">
            {item.isMissing ? 'Chưa xác định' : `${item.amount} ${item.unit}`}
          </Text>
        </View>
        <Text className="font-mono text-xs font-bold text-foreground">{dv !== null ? `${dv}%` : '--'}</Text>
      </View>
    );
  };

  if (isLoading) return <SectionLoading />;
  if (isError) return <SectionError onRetry={() => void refetch()} />;
  if (!data || (data.energyKcal === null && data.macronutrients.length === 0 && data.vitamins.length === 0 && data.minerals.length === 0)) {
    return (
      <SectionEmpty
        title="Chưa có hồ sơ dinh dưỡng kiểm định"
        description="Dữ liệu thành phần trên 100g cho nguyên liệu này đang được chuẩn hóa và kiểm định."
      />
    );
  }

  return (
    <ScrollView className="max-h-[75vh]" showsVerticalScrollIndicator={false}>
      <View className="gap-1 pb-2">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-lg font-black uppercase tracking-tight text-foreground">Giá trị dinh dưỡng</Text>
          <SourceBadge provenance={data.provenance} colors={colors} />
        </View>
        <Text className="text-xs text-muted-foreground">
          Tính trên 100g phần ăn được ({data.ediblePortionPercent}% ăn được)
        </Text>

        {data.householdConversions.length > 0 ? (
          <View className="mt-1 flex-row flex-wrap gap-2 rounded-lg bg-muted/40 px-2 py-1">
            {data.householdConversions.map((c) => (
              <Text key={c.id || c.unitName} className="font-mono text-[11px] text-muted-foreground">
                {c.quantity} {c.unitName} ≈ {c.grams}g
              </Text>
            ))}
          </View>
        ) : null}

        <View className="my-2 flex-row items-baseline justify-between border-y-4 border-foreground py-2">
          <View className="flex-row items-center gap-1.5">
            <Flame size={18} color="#f59e0b" />
            <Text className="text-sm font-black uppercase text-foreground">Năng lượng</Text>
          </View>
          <Text className="font-mono text-2xl font-black text-foreground">
            {data.energyKcal !== null ? data.energyKcal : '--'}
            <Text className="text-xs font-normal text-muted-foreground"> kcal</Text>
          </Text>
        </View>

        <Text className="pb-1 text-right text-[11px] font-bold text-muted-foreground">% Giá trị hàng ngày (% DV)*</Text>

        <View className="border-t border-foreground">
          {data.macronutrients.length > 0 ? (
            data.macronutrients.map((m) => renderRow(m, true))
          ) : (
            <Text className="py-1 text-xs italic text-muted-foreground">Chưa có thông số đa lượng chi tiết.</Text>
          )}
        </View>

        {data.vitamins.length > 0 || data.minerals.length > 0 ? (
          <View className="mt-2 border-t-4 border-foreground pt-2">
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Vitamin & Khoáng chất
            </Text>
            {data.minerals.map((m) => renderRow(m))}
            {data.vitamins.map((v) => renderRow(v))}
          </View>
        ) : null}

        <View className="mt-3 gap-1 border-t-2 border-foreground/40 pt-2">
          <Text className="text-[10px] leading-normal text-muted-foreground">
            * % Giá trị hàng ngày cho biết một khẩu phần 100g đóng góp bao nhiêu vào chế độ dinh dưỡng khuyến nghị.
          </Text>
          <Text className="text-[10px] font-medium leading-normal text-emerald-700">
            ** Ký hiệu (--) là dưỡng chất chưa có dữ liệu kiểm định, không được coi là bằng 0.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SourceBadge({ provenance, colors }: { provenance: ProvenanceInfo; colors: ReturnType<typeof useIconColors> }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="min-h-8 flex-row items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1"
      >
        <ShieldCheck size={12} color="#059669" />
        <Text numberOfLines={1} className="max-w-[110px] text-[11px] font-medium text-emerald-800">
          {provenance.sourceName}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-card p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <Award size={18} color="#059669" />
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">Minh bạch xuất xứ dữ liệu</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={() => setOpen(false)} className="h-11 w-11 items-center justify-center rounded-full">
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View className="mt-3 gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Nguồn xuất bản:</Text>
                <Text className="text-xs font-semibold text-foreground">{provenance.sourceName}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Nhà cung cấp:</Text>
                <Text className="text-xs font-medium text-foreground">{provenance.provider}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Phiên bản kiểm định:</Text>
                <Text className="font-mono text-xs text-foreground">{provenance.sourceVersion}</Text>
              </View>
              {provenance.effectiveFrom ? (
                <View className="flex-row justify-between gap-2">
                  <Text className="text-xs text-muted-foreground">Hiệu lực từ:</Text>
                  <Text className="font-mono text-xs text-foreground">{provenance.effectiveFrom}</Text>
                </View>
              ) : null}
            </View>

            {provenance.attribution ? (
              <View className="mt-2 rounded-md border-l-2 border-emerald-500 bg-emerald-50/60 p-2.5">
                <Text className="text-xs font-medium text-emerald-900">Trích dẫn bản quyền bắt buộc:</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">{provenance.attribution}</Text>
              </View>
            ) : null}

            <View className="mt-3 flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-xs text-muted-foreground">
                Giấy phép: <Text className="font-semibold text-foreground">{provenance.licenseName}</Text>
              </Text>
              {provenance.sourceUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(provenance.sourceUrl as string)}
                  className="min-h-10 flex-row items-center gap-1 rounded-lg border border-input px-3"
                >
                  <Text className="text-xs font-semibold text-foreground">Xem nguồn</Text>
                  <ExternalLink size={12} color={colors.foreground} />
                </Pressable>
              ) : null}
            </View>

            <Text className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
              Dữ liệu dinh dưỡng chuẩn hóa trên 100g phần ăn được, phục vụ giáo dục dinh dưỡng, không thay thế chẩn đoán y khoa.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

function IngredientTab({ colors }: { colors: ReturnType<typeof useIconColors> }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [keyword, setKeyword] = React.useState('');
  const [foodGroup, setFoodGroup] = React.useState<FoodGroup | 'ALL'>('ALL');
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useIngredientsQuery({
    page,
    limit: INGREDIENT_PAGE_SIZE,
    q: keyword.trim() || undefined,
    foodGroup: foodGroup === 'ALL' ? undefined : foodGroup,
  });
  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const groups = React.useMemo(() => groupIngredientsByFoodGroup(items), [items]);
  const totalPages = data?.metadata.totalPages ?? 1;

  return (
    <View className="gap-4">
      <SectionHeader
        title="Tra cứu nguyên liệu & Dinh dưỡng 100g"
        subtitle="Tìm trong danh sách chuẩn theo từ khóa có hoặc không dấu, xem giá trị dinh dưỡng 100g có kiểm định nguồn gốc."
      />

      <View className="flex-row items-stretch gap-2">
        <SearchBox
          value={keyword}
          onChangeText={(value) => {
            setKeyword(value);
            setPage(1);
          }}
          placeholder="Tìm nguyên liệu"
        />
        <DropdownField
          className="w-[116px]"
          label="Nhóm"
          value={foodGroup}
          options={FOOD_GROUP_OPTIONS}
          onChange={(value) => {
            setFoodGroup(value);
            setPage(1);
          }}
        />
      </View>

      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Không tìm thấy nguyên liệu" description="Thử từ khóa khác hoặc đổi nhóm thực phẩm." />
      ) : (
        <View className="gap-5">
          {groups.map(({ theme, items: groupItems }) => {
            const palette = foodGroupPalette(theme, isDark);
            const Icon = theme.icon;
            return (
              <View key={theme.group} className="gap-3">
                <View className="flex-row items-center gap-2">
                  <View
                    style={{ backgroundColor: palette.soft }}
                    className="h-9 w-9 items-center justify-center rounded-full">
                    <Icon size={16} color={palette.fg} />
                  </View>
                  <Text style={{ color: palette.fg }} className="text-base font-bold">
                    {theme.label}
                  </Text>
                  <View
                    style={{ backgroundColor: palette.soft, borderColor: palette.border }}
                    className="rounded-full border px-2 py-0.5">
                    <Text style={{ color: palette.fg }} className="text-[11px] font-semibold">
                      {groupItems.length} nguyên liệu
                    </Text>
                  </View>
                </View>

                {groupItems.map((item) => (
                  <View
                    key={item.id}
                    style={{ borderColor: palette.border }}
                    className="gap-2 rounded-2xl border bg-card p-3.5">
                    <View className="flex-row items-start gap-3">
                      <View
                        style={{ backgroundColor: palette.soft }}
                        className="h-11 w-11 items-center justify-center rounded-full">
                        <Icon size={20} color={palette.fg} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="flex-1 text-base font-semibold text-foreground">{item.canonicalName}</Text>
                          <View
                            style={{ backgroundColor: palette.soft, borderColor: palette.border }}
                            className="rounded-full border px-2 py-0.5">
                            <Text style={{ color: palette.fg }} className="text-[10px] font-semibold">
                              {theme.label}
                            </Text>
                          </View>
                        </View>
                        {item.aliases.length > 0 ? (
                          <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Còn gọi: {item.aliases.map((a) => a.alias).join(', ')}
                          </Text>
                        ) : null}
                        {item.allergenCodes.length > 0 ? (
                          <View className="mt-2 flex-row flex-wrap gap-1.5">
                            {item.allergenCodes.map((code) => (
                              <View key={code} className="rounded-full border border-amber-500/60 px-2 py-0.5">
                                <Text className="text-[10px] font-semibold text-amber-600">
                                  Dị ứng: {getAllergenName(code)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xem dinh dưỡng 100g của ${item.canonicalName}`}
                      onPress={() => setSelected({ id: item.id, name: item.canonicalName })}
                      className="min-h-11 flex-row items-center justify-end gap-1.5 px-1">
                      <Flame size={15} color="#f59e0b" />
                      <Text className="text-sm font-semibold text-primary">Xem dinh dưỡng (100g)</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} disabled={isFetching} />
        </View>
      )}

      <Modal
        visible={Boolean(selected)}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <Pressable accessibilityLabel="Đóng" onPress={() => setSelected(null)} style={StyleSheet.absoluteFill} />
          <View className="max-h-[85%] w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background p-5">
            <View className="mb-2 flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold text-muted-foreground">{selected?.name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setSelected(null)}
                hitSlop={6}
                className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                <X size={18} color={colors.foreground} />
              </Pressable>
            </View>
            {selected ? <NutritionFactsView ingredientId={selected.id} colors={colors} /> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CookingMethodCard({ method }: { method: CookingMethodItem }) {
  const colors = useIconColors();
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/15">
          <ChefHat size={20} color={colors.primary} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-semibold text-foreground">{method.name}</Text>
            <View
              className={`rounded-full border px-2 py-0.5 ${method.active ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}>
              <Text className={`text-[10px] font-semibold ${method.active ? 'text-primary' : 'text-muted-foreground'}`}>
                {method.active ? 'Đã kiểm định' : 'Đang thử nghiệm'}
              </Text>
            </View>
          </View>
          <Text className="mt-0.5 font-mono text-[10px] text-muted-foreground">{method.code}</Text>
        </View>
      </View>

      {method.description ? (
        <Text className="mt-3 text-sm leading-relaxed text-foreground">{method.description}</Text>
      ) : null}

      {method.yieldFactors.length > 0 ? (
        <View className="mt-3 flex-row items-center justify-between rounded-lg border border-border bg-muted p-2.5">
          <View className="flex-row items-center gap-1.5">
            <Scale size={13} color="#f59e0b" />
            <Text className="text-xs text-muted-foreground">Hệ số trọng lượng:</Text>
          </View>
          <Text className="font-mono text-xs font-bold text-foreground">{method.yieldFactors[0].yieldPercent}%</Text>
        </View>
      ) : null}

      {method.retentionFactors.length > 0 ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <View className="flex-row items-center gap-1">
            <Activity size={13} color={colors.primary} />
            <Text className="text-[11px] font-semibold text-muted-foreground">Hệ số bảo tồn dinh dưỡng:</Text>
          </View>
          {method.retentionFactors.map((rf) => (
            <View key={rf.nutrientCode} className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-foreground">{rf.nutrientName}</Text>
                <Text className="font-mono text-[11px] font-bold text-primary">{rf.retentionPercent}%</Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, rf.retentionPercent)}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
          Đang phân tích hệ số bảo tồn vi chất...
        </Text>
      )}
    </View>
  );
}

function CookingMethodTab() {
  const { data, isLoading, isError, refetch } = useCookingMethodsQuery({ limit: 50 });
  const items = data?.items ?? [];

  return (
    <View className="gap-4">
      <SectionHeader
        title="Phương pháp chế biến & Bảo tồn dinh dưỡng"
        subtitle="Tỷ lệ hao hụt khối lượng và hệ số giữ lại các vi chất nhạy cảm (Vitamin C, B-group...) sau khi nấu."
      />
      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty
          title="Chưa có dữ liệu phương pháp chế biến"
          description="Các phương pháp nấu nướng và hệ số bảo tồn dinh dưỡng đang được cập nhật."
        />
      ) : (
        <View className="gap-3">
          {items.map((m) => (
            <CookingMethodCard key={m.id || m.code} method={m} />
          ))}
        </View>
      )}
    </View>
  );
}

function InteractionCard({ rule }: { rule: FoodInteractionRuleItem }) {
  const colors = useIconColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scope = SCOPE_COLORS[rule.scope] ?? SCOPE_COLORS.SAME_MEAL;
  const scopeColor = isDark ? scope.dark : scope.light;
  const severityColor =
    rule.severity === 'WARNING' ? '#d97706' : rule.severity === 'COMPATIBLE' ? '#059669' : colors.mutedForeground;
  const SeverityIcon = rule.severity === 'WARNING' ? AlertTriangle : rule.severity === 'COMPATIBLE' ? CheckCircle2 : Info;

  return (
    <View className="gap-2.5 rounded-2xl border border-border bg-card p-3.5">
      <Text className="text-base font-semibold text-foreground">
        {rule.ingredientA.name} ⇄ {rule.ingredientB.name}
      </Text>

      <View className="flex-row flex-wrap items-center gap-2">
        <View style={{ borderColor: scopeColor }} className="rounded-full border px-2.5 py-0.5">
          <Text style={{ color: scopeColor }} className="text-[11px] font-semibold">
            {rule.scopeLabel}
          </Text>
        </View>
        <View style={{ borderColor: severityColor }} className="flex-row items-center gap-1 rounded-full border px-2.5 py-0.5">
          <SeverityIcon size={11} color={severityColor} />
          <Text style={{ color: severityColor }} className="text-[11px] font-semibold">
            {rule.severityLabel}
          </Text>
        </View>
      </View>

      <Text className="text-sm leading-relaxed text-foreground">{rule.explanation}</Text>

      {rule.suggestedAction ? (
        <View className="flex-row items-start gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
          <Sparkles size={14} color={colors.primary} />
          <Text className="flex-1 text-xs leading-relaxed text-primary">
            <Text className="font-bold">Gợi ý chế biến: </Text>
            {rule.suggestedAction}
          </Text>
        </View>
      ) : null}

      <Text className="text-[11px] text-muted-foreground">Nguồn: {rule.sourceName}</Text>
    </View>
  );
}

function InteractionTab() {
  const [scope, setScope] = React.useState<InteractionScope | 'ALL'>('ALL');
  const [keyword, setKeyword] = React.useState('');

  const { data, isLoading, isError, refetch } = useInteractionRulesQuery({
    scope: scope === 'ALL' ? undefined : scope,
    limit: 50,
  });

  const items = React.useMemo(() => {
    const list = data?.items ?? [];
    if (!keyword.trim()) return list;
    const q = keyword.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.ingredientA.name.toLowerCase().includes(q) ||
        r.ingredientB.name.toLowerCase().includes(q) ||
        r.explanation.toLowerCase().includes(q)
    );
  }, [data?.items, keyword]);

  return (
    <View className="gap-4">
      <SectionHeader
        title="Tra cứu Kiêng kỵ & Tương tác Thực phẩm"
        subtitle="Quy tắc phối hợp nguyên liệu khoa học theo 3 cấp độ phạm vi: Cùng món, Cùng bữa ăn hoặc Cùng ngày."
      />
      <View className="flex-row items-stretch gap-2">
        <SearchBox value={keyword} onChangeText={setKeyword} placeholder="Tìm theo tên nguyên liệu..." />
        <DropdownField
          className="w-[116px]"
          label="Phạm vi"
          value={scope}
          options={SCOPE_OPTIONS}
          onChange={setScope}
        />
      </View>

      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Không tìm thấy quy tắc tương tác phù hợp" description="Thử từ khóa khác hoặc đổi phạm vi." />
      ) : (
        <View className="gap-2.5">
          {items.map((rule) => (
            <InteractionCard key={rule.id} rule={rule} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Tra cứu nguyên liệu & kiến thức dinh dưỡng — chuyển đổi 3 tab trực tiếp trên điện thoại
 * (`Nguyên liệu 100g`, `Kiêng kỵ`, `Chế biến`), mở đúng tab từ tham số `?tab=`.
 */
export default function FoodDataScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = React.useState<SectionKey>(() => resolveInitialTab(params.tab));
  const [seenTabParam, setSeenTabParam] = React.useState(params.tab);
  if (seenTabParam !== params.tab) {
    setSeenTabParam(params.tab);
    setActiveTab(resolveInitialTab(params.tab));
  }

  return (
    <SiteScreen title="Tra cứu dinh dưỡng">
      <View className="gap-4 px-5 pt-4">
        <View
          accessibilityRole="tablist"
          className="flex-row gap-1 rounded-2xl border border-border bg-muted/70 p-1">
          {FOOD_TABS.map((item) => {
            const active = activeTab === item.key;
            const Icon = item.icon;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveTab(item.key)}
                className={cn(
                  'min-h-11 flex-1 flex-row items-center justify-center gap-1 rounded-xl px-2',
                  active ? 'border border-border/60 bg-background' : 'active:bg-background/50'
                )}>
                <Icon size={15} color={active ? colors.primary : colors.mutedForeground} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  className={cn(
                    'text-xs',
                    active ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
                  )}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'INGREDIENT' ? <IngredientTab colors={colors} /> : null}
        {activeTab === 'INTERACTION' ? <InteractionTab /> : null}
        {activeTab === 'COOKING' ? <CookingMethodTab /> : null}
      </View>
    </SiteScreen>
  );
}
