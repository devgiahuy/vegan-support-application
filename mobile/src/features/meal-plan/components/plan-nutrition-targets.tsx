import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Apple, Droplets, Sprout, Utensils, Wheat, type LucideIcon } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import type { EstimatedTargets } from '../types/meal-plan.model';

/** Bảng màu 4 chỉ số dinh dưỡng — cùng tông với web (emerald / sky / purple / amber), có biến thể tối để chữ luôn đọc được. */
export const MACRO_TONES = {
  protein: {
    tile: 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/25',
    dot: 'bg-emerald-500',
    label: 'text-emerald-800 dark:text-emerald-300',
    value: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-100/70 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-700/80 dark:text-emerald-400/80',
    track: 'bg-emerald-100 dark:bg-emerald-950/60',
    bar: 'bg-emerald-500',
    hint: 'text-emerald-800/70 dark:text-emerald-300/70',
    chip: 'border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/20',
    chipText: 'text-emerald-900 dark:text-emerald-200',
    chipMuted: 'text-emerald-900/60 dark:text-emerald-300/60',
  },
  fat: {
    tile: 'border-sky-200/80 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/25',
    dot: 'bg-sky-500',
    label: 'text-sky-800 dark:text-sky-300',
    value: 'text-sky-950 dark:text-sky-100',
    badge: 'bg-sky-100/70 dark:bg-sky-950/70',
    badgeText: 'text-sky-700/80 dark:text-sky-400/80',
    track: 'bg-sky-100 dark:bg-sky-950/60',
    bar: 'bg-sky-500',
    hint: 'text-sky-800/70 dark:text-sky-300/70',
    chip: 'border-sky-200/60 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/20',
    chipText: 'text-sky-900 dark:text-sky-200',
    chipMuted: 'text-sky-900/60 dark:text-sky-300/60',
  },
  fiber: {
    tile: 'border-purple-200/80 bg-purple-50/60 dark:border-purple-800/40 dark:bg-purple-950/25',
    dot: 'bg-purple-500',
    label: 'text-purple-800 dark:text-purple-300',
    value: 'text-purple-950 dark:text-purple-100',
    badge: 'bg-purple-100/70 dark:bg-purple-950/70',
    badgeText: 'text-purple-700/80 dark:text-purple-400/80',
    track: 'bg-purple-100 dark:bg-purple-950/60',
    bar: 'bg-purple-500',
    hint: 'text-purple-800/70 dark:text-purple-300/70',
    chip: 'border-purple-200/60 bg-purple-50/60 dark:border-purple-800/40 dark:bg-purple-950/20',
    chipText: 'text-purple-900 dark:text-purple-200',
    chipMuted: 'text-purple-900/60 dark:text-purple-300/60',
  },
  carbs: {
    tile: 'border-amber-200/80 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/25',
    dot: 'bg-amber-500',
    label: 'text-amber-800 dark:text-amber-300',
    value: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-100/70 dark:bg-amber-950/70',
    badgeText: 'text-amber-700/80 dark:text-amber-400/80',
    track: 'bg-amber-100 dark:bg-amber-950/60',
    bar: 'bg-amber-500',
    hint: 'text-amber-800/70 dark:text-amber-300/70',
    chip: 'border-amber-200/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20',
    chipText: 'text-amber-900 dark:text-amber-200',
    chipMuted: 'text-amber-900/60 dark:text-amber-300/60',
  },
  calories: {
    tile: '',
    dot: '',
    label: '',
    value: '',
    badge: '',
    badgeText: '',
    track: '',
    bar: '',
    hint: '',
    chip: 'border-orange-200/60 bg-orange-50/60 dark:border-orange-800/40 dark:bg-orange-950/20',
    chipText: 'text-orange-900 dark:text-orange-200',
    chipMuted: 'text-orange-900/60 dark:text-orange-300/60',
  },
} as const;

/** Màu icon (hex) cho từng chỉ số — lucide không nhận `className`, nên chọn theo giao diện sáng/tối. */
const ICON_COLOR = {
  light: { protein: '#059669', fat: '#0284c7', fiber: '#9333ea', carbs: '#d97706', emerald: '#059669' },
  dark: { protein: '#34d399', fat: '#38bdf8', fiber: '#c084fc', carbs: '#fbbf24', emerald: '#34d399' },
} as const;

type ToneKey = 'protein' | 'fat' | 'fiber' | 'carbs';

function MacroTile({
  toneKey,
  icon: Icon,
  label,
  share,
  grams,
  hint,
}: {
  toneKey: ToneKey;
  icon: LucideIcon;
  label: string;
  /** Tỷ lệ so với calo, ví dụ `~20% Calo`. */
  share: string;
  grams: number | null;
  hint: string;
}) {
  const { colorScheme } = useColorScheme();
  const tone = MACRO_TONES[toneKey];
  const iconColor = ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light'][toneKey];

  return (
    <View className={cn('w-[48.5%] rounded-2xl border p-3.5', tone.tile)}>
      <View className="flex-row items-center justify-between gap-1">
        <View className="flex-1 flex-row items-center gap-1.5">
          <Icon size={15} color={iconColor} />
          <Text numberOfLines={1} className={cn('flex-1 text-xs font-bold', tone.label)}>
            {label}
          </Text>
        </View>
      </View>
      <View className={cn('mt-1.5 self-start rounded-md px-1.5 py-0.5', tone.badge)}>
        <Text className={cn('text-[10px] font-semibold', tone.badgeText)}>{share}</Text>
      </View>
      <Text className={cn('mt-2 font-mono text-xl font-black', tone.value)}>{grams !== null ? `~${grams}g` : '—'}</Text>
      <View className={cn('mt-2.5 h-1.5 w-full overflow-hidden rounded-full', tone.track)}>
        <View className={cn('h-full w-full rounded-full', tone.bar)} />
      </View>
      <Text className={cn('mt-2 text-[11px]', tone.hint)}>{hint}</Text>
    </View>
  );
}

/** Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày (đạm, béo, xơ, tinh bột) kèm dung sai — đồng bộ khối bento "Mục tiêu 4 chỉ số" của web. */
export function PlanNutritionTargets({ targets }: { targets: EstimatedTargets }) {
  const { colorScheme } = useColorScheme();
  const emerald = ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light'].emerald;

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="gap-2.5">
        <View className="flex-row items-start gap-2">
          <View className="size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Utensils size={16} color={emerald} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground">Mục tiêu 4 chỉ số dinh dưỡng mỗi ngày</Text>
            <Text className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {targets.sourceDetail ||
                'Mục tiêu được ước tính từ thông tin sức khỏe và mục tiêu bạn đã chọn. Đây là khoảng tham khảo, không phải số đo chính xác.'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5 self-start rounded-full border border-border bg-muted/40 px-3 py-1">
          <Text className="text-xs text-muted-foreground">Dung sai cho phép:</Text>
          <Text className="text-xs font-semibold text-foreground">±{targets.tolerancePercent}%</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        <MacroTile toneKey="protein" icon={Sprout} label="Đạm (Protein)" share="~20% Calo" grams={targets.proteinGrams} hint="Nuôi dưỡng cơ bắp & tế bào" />
        <MacroTile toneKey="fat" icon={Droplets} label="Chất béo (Fat)" share="~30% Calo" grams={targets.fatGrams} hint="Chất béo thực vật lành mạnh" />
        <MacroTile toneKey="fiber" icon={Apple} label="Chất xơ (Fiber)" share="Chuẩn WHO" grams={targets.fiberGrams} hint="Tối ưu hệ vi sinh đường ruột" />
        <MacroTile toneKey="carbs" icon={Wheat} label="Tinh bột (Carbs)" share="~50% Calo" grams={targets.carbohydrateGrams} hint="Nguồn năng lượng bền vững" />
      </View>
    </View>
  );
}
