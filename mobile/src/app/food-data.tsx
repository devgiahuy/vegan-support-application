import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  Users,
  X,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';

import { SiteScreen } from '@/components/layout/site-screen';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import {
  useCookingMethodsQuery,
  useIngredientNutrientsQuery,
  useInteractionRulesQuery,
  useReferenceIntakesQuery,
} from '@/features/food-data/queries/food-data.queries';
import { POPULATION_LABELS } from '@/features/food-data/types/food-data.model';
import type {
  CookingMethodItem,
  FoodInteractionRuleItem,
  FoodRuleSeverity,
  InteractionScope,
  NutrientItem,
  ProvenanceInfo,
  ReferenceIntakeItem,
} from '@/features/food-data/types/food-data.model';
import { FoodGroup } from '@/common/enums';
import { useIconColors } from '@/lib/theme-colors';

type Tab = 'INGREDIENT' | 'COOKING' | 'INTAKE' | 'INTERACTION';

const TABS: { value: Tab; label: string }[] = [
  { value: 'INGREDIENT', label: 'Nguyên liệu' },
  { value: 'COOKING', label: 'Phương pháp nấu' },
  { value: 'INTAKE', label: 'Khuyến nghị' },
  { value: 'INTERACTION', label: 'Tương kỵ' },
];

const FOOD_GROUP_OPTIONS: { value: FoodGroup | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Mọi nhóm' },
  { value: FoodGroup.GRAINS, label: 'Ngũ cốc' },
  { value: FoodGroup.LEGUMES, label: 'Đậu' },
  { value: FoodGroup.VEGETABLES, label: 'Rau' },
  { value: FoodGroup.FRUITS, label: 'Trái cây' },
  { value: FoodGroup.NUTS_SEEDS, label: 'Hạt' },
  { value: FoodGroup.MUSHROOMS, label: 'Nấm' },
  { value: FoodGroup.DAIRY_EGGS, label: 'Trứng sữa' },
  { value: FoodGroup.HERBS_SPICES, label: 'Thảo mộc – gia vị' },
  { value: FoodGroup.OTHER, label: 'Khác' },
];

const POPULATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả đối tượng' },
  ...Object.entries(POPULATION_LABELS).map(([value, label]) => ({ value, label })),
];

const SCOPE_OPTIONS: { value: InteractionScope | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả phạm vi' },
  { value: 'SAME_DISH', label: 'Cùng món' },
  { value: 'SAME_MEAL', label: 'Cùng bữa' },
  { value: 'SAME_DAY', label: 'Cùng ngày' },
];

function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
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
    <View className="items-center rounded-2xl border border-dashed border-border p-6">
      <Text className="text-center text-sm text-muted-foreground">Không tải được dữ liệu. Kiểm tra kết nối mạng và thử lại.</Text>
      <Pressable onPress={onRetry} className="mt-3 rounded-xl border border-input px-4 py-2">
        <Text className="text-sm font-semibold text-foreground">Thử lại</Text>
      </Pressable>
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

function severityBadgeClasses(severity: FoodRuleSeverity): { bg: string; text: string } {
  switch (severity) {
    case 'WARNING':
      return { bg: 'bg-amber-500/15', text: 'text-amber-700' };
    case 'COMPATIBLE':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-700' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

/** Panel dinh dưỡng cho 1 nguyên liệu — đồng bộ nội dung `nutrition-facts-panel.tsx`. */
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
        description="Dữ liệu thành phần trên 100g cho nguyên liệu này đang được chuẩn hoá và kiểm định."
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
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5"
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
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <Award size={18} color="#059669" />
                </View>
                <Text className="text-base font-semibold text-foreground">Minh bạch xuất xứ dữ liệu</Text>
              </View>
              <Pressable onPress={() => setOpen(false)}>
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View className="mt-3 gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Nguồn xuất bản:</Text>
                <Text className="text-xs font-semibold text-foreground">{provenance.sourceName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Nhà cung cấp:</Text>
                <Text className="text-xs font-medium text-foreground">{provenance.provider}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Phiên bản kiểm định:</Text>
                <Text className="font-mono text-xs text-foreground">{provenance.sourceVersion}</Text>
              </View>
              {provenance.effectiveFrom ? (
                <View className="flex-row justify-between">
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

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                Giấy phép: <Text className="font-semibold text-foreground">{provenance.licenseName}</Text>
              </Text>
              {provenance.sourceUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(provenance.sourceUrl as string)}
                  className="flex-row items-center gap-1 rounded-lg border border-input px-2.5 py-1"
                >
                  <Text className="text-xs font-semibold text-foreground">Xem nguồn</Text>
                  <ExternalLink size={12} color={colors.foreground} />
                </Pressable>
              ) : null}
            </View>

            <Text className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
              Dữ liệu dinh dưỡng chuẩn hoá trên 100g phần ăn được, phục vụ giáo dục dinh dưỡng, không thay thế chẩn đoán y khoa.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

function IngredientTab({ colors }: { colors: ReturnType<typeof useIconColors> }) {
  const [keyword, setKeyword] = React.useState('');
  const [foodGroup, setFoodGroup] = React.useState<FoodGroup | 'ALL'>('ALL');
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch } = useIngredientsQuery({
    limit: 20,
    q: keyword.trim() || undefined,
    foodGroup: foodGroup === 'ALL' ? undefined : foodGroup,
  });
  const items = data?.items ?? [];

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm nguyên liệu, vd: đậu phộng..."
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 py-2.5 text-sm text-foreground"
        />
      </View>

      <FilterPills options={FOOD_GROUP_OPTIONS} value={foodGroup} onChange={setFoodGroup} />

      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Không tìm thấy nguyên liệu" description="Thử từ khoá khác hoặc đổi nhóm thực phẩm." />
      ) : (
        <View className="gap-2.5">
          {items.map((item) => (
            <View key={item.id} className="rounded-2xl border border-border bg-card p-3.5">
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Text className="text-sm font-semibold text-foreground">{item.canonicalName}</Text>
                <View className="rounded-full bg-muted px-2 py-0.5">
                  <Text className="text-[11px] text-muted-foreground">{item.foodGroupLabel}</Text>
                </View>
              </View>
              {item.aliases.length > 0 ? (
                <Text className="mt-1 text-xs text-muted-foreground">
                  Còn gọi: {item.aliases.map((a) => a.alias).join(', ')}
                </Text>
              ) : null}
              {item.allergenCodes.length > 0 ? (
                <View className="mt-1.5 flex-row flex-wrap gap-1">
                  {item.allergenCodes.map((code) => (
                    <View key={code} className="rounded-full border border-border px-1.5 py-0.5">
                      <Text className="text-[10px] text-muted-foreground">Dị ứng: {code}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Pressable
                onPress={() => setSelected({ id: item.id, name: item.canonicalName })}
                className="mt-2.5 flex-row items-center justify-end gap-1.5 border-t border-border pt-2"
              >
                <Flame size={13} color="#f59e0b" />
                <Text className="text-xs font-semibold text-emerald-700">Dinh dưỡng (100g)</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Modal visible={Boolean(selected)} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-3xl bg-card p-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-muted-foreground">{selected?.name}</Text>
              <Pressable onPress={() => setSelected(null)}>
                <X size={20} color={colors.mutedForeground} />
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
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <ChefHat size={18} color="#059669" />
          </View>
          <View>
            <Text className="text-sm font-bold text-foreground">{method.name}</Text>
            <Text className="font-mono text-[10px] text-muted-foreground">{method.code}</Text>
          </View>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${method.active ? 'border border-emerald-300' : 'bg-muted'}`}>
          <Text className={`text-[10px] ${method.active ? 'text-emerald-700' : 'text-muted-foreground'}`}>
            {method.active ? 'Đã kiểm định' : 'Đang thử nghiệm'}
          </Text>
        </View>
      </View>

      {method.description ? (
        <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">{method.description}</Text>
      ) : null}

      {method.yieldFactors.length > 0 ? (
        <View className="mt-3 flex-row items-center justify-between rounded-lg bg-muted/40 p-2.5">
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
            <Activity size={13} color="#059669" />
            <Text className="text-[11px] font-semibold text-muted-foreground">Hệ số bảo tồn dinh dưỡng:</Text>
          </View>
          {method.retentionFactors.map((rf) => (
            <View key={rf.nutrientCode} className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-foreground">{rf.nutrientName}</Text>
                <Text className="font-mono text-[11px] font-bold text-emerald-700">{rf.retentionPercent}%</Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                <View className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, rf.retentionPercent)}%` }} />
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

  if (isLoading) return <SectionLoading />;
  if (isError) return <SectionError onRetry={() => void refetch()} />;
  if (items.length === 0) {
    return (
      <SectionEmpty
        title="Chưa có dữ liệu phương pháp chế biến"
        description="Các phương pháp nấu nướng và hệ số bảo tồn dinh dưỡng đang được cập nhật."
      />
    );
  }
  return (
    <View className="gap-3">
      {items.map((m) => (
        <CookingMethodCard key={m.id || m.code} method={m} />
      ))}
    </View>
  );
}

function ReferenceIntakeCard({ item }: { item: ReferenceIntakeItem }) {
  return (
    <View className="rounded-2xl border border-border bg-card p-3.5">
      <View className="flex-row items-start justify-between gap-2">
        <View>
          <Text className="text-sm font-semibold text-foreground">{item.nutrientName}</Text>
          <Text className="font-mono text-[11px] text-muted-foreground">{item.nutrientCode}</Text>
        </View>
        <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5">
          <Text className="text-[10px] font-semibold text-emerald-800">{item.referenceType}</Text>
        </View>
      </View>

      <View className="mt-2.5 gap-1 rounded-lg bg-muted/40 p-2.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-xs text-muted-foreground">Mức khuyến nghị:</Text>
          <Text className="font-mono text-base font-bold text-foreground">
            {item.value} <Text className="text-xs font-normal text-muted-foreground">{item.unit}/ngày</Text>
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-t border-muted pt-1">
          <Text className="text-[11px] text-muted-foreground">Đối tượng:</Text>
          <Text className="text-right text-[11px] font-medium text-foreground">{item.populationName}</Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Award size={11} color="#f59e0b" />
          <Text numberOfLines={1} className="max-w-[140px] text-[11px] text-muted-foreground">
            {item.sourceName}
          </Text>
        </View>
        {item.warningEligible ? (
          <View className="flex-row items-center gap-0.5">
            <AlertTriangle size={11} color="#d97706" />
            <Text className="text-[11px] font-medium text-amber-600">Có cảnh báo</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function IntakeTab() {
  const [population, setPopulation] = React.useState('GENERAL_ADULT');
  const [keyword, setKeyword] = React.useState('');
  const colors = useIconColors();

  const { data, isLoading, isError, refetch } = useReferenceIntakesQuery({
    populationCode: population === 'ALL' ? undefined : population,
    limit: 50,
  });

  const items = React.useMemo(() => {
    const list = data?.items ?? [];
    if (!keyword.trim()) return list;
    const q = keyword.trim().toLowerCase();
    return list.filter((i) => i.nutrientName.toLowerCase().includes(q) || i.nutrientCode.toLowerCase().includes(q));
  }, [data?.items, keyword]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm dưỡng chất (Canxi, Sắt, Vitamin C...)"
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 py-2.5 text-sm text-foreground"
        />
      </View>
      <View className="flex-row items-center gap-1.5">
        <Users size={13} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground">Nhóm đối tượng:</Text>
      </View>
      <FilterPills options={POPULATION_OPTIONS} value={population} onChange={setPopulation} />

      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Không tìm thấy mức khuyến nghị phù hợp" description="Thử từ khoá khác hoặc đổi nhóm đối tượng." />
      ) : (
        <View className="gap-2.5">
          {items.map((item) => (
            <ReferenceIntakeCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

function InteractionCard({ rule }: { rule: FoodInteractionRuleItem }) {
  const sev = severityBadgeClasses(rule.severity);
  const SeverityIcon = rule.severity === 'WARNING' ? AlertTriangle : rule.severity === 'COMPATIBLE' ? CheckCircle2 : Info;
  return (
    <View className="rounded-2xl border border-border bg-card p-3.5">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-semibold text-foreground">
          {rule.ingredientA.name} ⇄ {rule.ingredientB.name}
        </Text>
        <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sev.bg}`}>
          <SeverityIcon size={11} color={sev.text.includes('amber') ? '#b45309' : sev.text.includes('emerald') ? '#047857' : '#6b7280'} />
          <Text className={`text-[10px] font-semibold ${sev.text}`}>{rule.severityLabel}</Text>
        </View>
      </View>

      <View className="mt-1.5 flex-row items-center gap-2">
        <View className="rounded-full border border-border px-2 py-0.5">
          <Text className="text-[10px] text-muted-foreground">{rule.scopeLabel}</Text>
        </View>
        <Text className="text-[11px] text-muted-foreground">Nguồn: {rule.sourceName}</Text>
      </View>

      <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">{rule.explanation}</Text>

      {rule.suggestedAction ? (
        <View className="mt-2 flex-row items-start gap-1.5 rounded-lg border border-primary/15 bg-primary/5 p-2.5">
          <Sparkles size={13} color="#059669" />
          <Text className="flex-1 text-xs font-medium text-primary">Gợi ý: {rule.suggestedAction}</Text>
        </View>
      ) : null}
    </View>
  );
}

function InteractionTab() {
  const [scope, setScope] = React.useState<InteractionScope | 'ALL'>('ALL');
  const [keyword, setKeyword] = React.useState('');
  const colors = useIconColors();

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
    <View className="gap-3">
      <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm theo tên nguyên liệu..."
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 py-2.5 text-sm text-foreground"
        />
      </View>
      <FilterPills options={SCOPE_OPTIONS} value={scope} onChange={setScope} />

      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Không tìm thấy quy tắc tương tác phù hợp" description="Thử từ khoá khác hoặc đổi phạm vi." />
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
 * Công cụ tra cứu dữ liệu dinh dưỡng chuẩn — đồng bộ nhóm công cụ trên
 * `frontend/src/app/(site)/categories/page.tsx` (IngredientSearch + NutritionFactsPanel,
 * CookingMethodCards, ReferenceIntakeExplorer, FoodInteractionTable). Bỏ phần
 * "Hướng dẫn định lượng an toàn" (ingredient-guidelines) vì bản FE cũng chưa có UI tiêu
 * thụ endpoint này.
 */
export default function FoodDataScreen() {
  const colors = useIconColors();
  const [tab, setTab] = React.useState<Tab>('INGREDIENT');

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Layers size={16} color={colors.primary} />
            <Text className="text-2xl font-bold tracking-tight text-foreground">Tra cứu dữ liệu dinh dưỡng</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Thành phần dinh dưỡng, phương pháp nấu, nhu cầu khuyến nghị và quy tắc tương kỵ — theo nguồn kiểm định.
          </Text>
        </View>

        <FilterPills options={TABS} value={tab} onChange={setTab} />

        {tab === 'INGREDIENT' ? <IngredientTab colors={colors} /> : null}
        {tab === 'COOKING' ? <CookingMethodTab /> : null}
        {tab === 'INTAKE' ? <IntakeTab /> : null}
        {tab === 'INTERACTION' ? <InteractionTab /> : null}
      </View>
    </SiteScreen>
  );
}
