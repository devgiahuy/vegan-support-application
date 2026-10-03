import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { Check, Dumbbell, Flame, Scale, Sparkles } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useCreateMealProgramMutation } from '@/features/meal-program/queries/meal-program.queries';
import type { MealProgramGoalDto } from '@/features/meal-program/types/meal-program.dto';
import {
  formatDateVi,
  getUpcomingMondays,
  isMonday,
  isValidDateOnly,
  snapToNextMonday,
} from '@/features/meal-program/utils/meal-program-dates';
import { getMealProgramErrorMessage } from '@/features/meal-program/utils/meal-program-errors';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const GOALS: { value: MealProgramGoalDto; title: string; desc: string; icon: typeof Flame }[] = [
  {
    value: 'LOSE',
    title: 'Giảm cân & thanh lọc',
    desc: 'Nhiều rau củ, chất xơ, thâm hụt năng lượng nhẹ nhưng vẫn đủ chất.',
    icon: Flame,
  },
  {
    value: 'MAINTAIN',
    title: 'Duy trì vóc dáng',
    desc: 'Cân bằng dinh dưỡng, đa dạng nguồn đạm thực vật.',
    icon: Scale,
  },
  {
    value: 'GAIN',
    title: 'Tăng cân & tăng cơ',
    desc: 'Mật độ năng lượng lành mạnh từ hạt, đậu và ngũ cốc nguyên cám.',
    icon: Dumbbell,
  },
];

const HORIZONS = [
  { weeks: 2, label: '2 tuần', desc: 'Làm quen và hình thành thói quen' },
  { weeks: 4, label: '4 tuần', desc: 'Lộ trình chuẩn điều hòa dinh dưỡng' },
  { weeks: 8, label: '8 tuần', desc: 'Thay đổi lối sống lâu dài' },
  { weeks: 12, label: '12 tuần', desc: 'Chiến lược toàn diện tối đa' },
];

/**
 * Tạo lộ trình nhiều tuần — đồng bộ `program-create-form` của web: tên (tùy chọn), mục tiêu, số tuần và
 * ngày bắt đầu (luôn là Thứ hai). Backend sinh phương án cho từng tuần theo hồ sơ sức khỏe và chế độ ăn.
 */
export default function NewMealProgramScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mutation = useCreateMealProgramMutation();

  const mondays = React.useMemo(() => getUpcomingMondays(4), []);
  const [title, setTitle] = React.useState('');
  const [goal, setGoal] = React.useState<MealProgramGoalDto>('MAINTAIN');
  const [horizonWeeks, setHorizonWeeks] = React.useState(4);
  const [startDate, setStartDate] = React.useState(mondays[0] ?? '');
  const [dateNotice, setDateNotice] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = React.useState(false);

  const changeDate = (value: string) => {
    setDateNotice(null);
    setStartDate(value);
  };

  const submit = async () => {
    setErrorMessage(null);
    setNeedsProfile(false);
    let date = startDate.trim();
    if (!isValidDateOnly(date)) {
      Alert.alert('Ngày chưa hợp lệ', 'Ngày bắt đầu phải đúng dạng YYYY-MM-DD (ví dụ 2026-10-05).');
      return;
    }
    if (!isMonday(date)) {
      const snapped = snapToNextMonday(date);
      setStartDate(snapped);
      setDateNotice(`Lộ trình phải bắt đầu vào Thứ hai. Đã tự chuyển sang ${formatDateVi(snapped)}, hãy bấm tạo lại.`);
      return;
    }
    date = date.trim();
    try {
      const created = await mutation.mutateAsync({ title, goal, startDate: date, horizonWeeks, alternativesPerWeek: 2 });
      router.replace(`/meal-programs/${created.id}` as Href);
    } catch (error) {
      const code = getApiErrorCode(error);
      setNeedsProfile(code === 'HEALTH_PROFILE_INCOMPLETE' || code === 'DIET_SCHEDULE_REQUIRED');
      setErrorMessage(getMealProgramErrorMessage(error));
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để tạo lộ trình</Text>
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
          <Text className="text-2xl font-extrabold text-foreground">Tạo lộ trình nhiều tuần</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Hệ thống tạo thực đơn cho từng tuần theo hồ sơ sức khỏe, dị ứng và chế độ ăn của bạn.
          </Text>
        </View>

        <View>
          <Text className="mb-1.5 text-sm font-semibold text-foreground">Tên lộ trình (không bắt buộc)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="VD: 21 ngày làm quen thuần chay"
            placeholderTextColor={colors.mutedForeground}
            maxLength={200}
            className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Mục tiêu dinh dưỡng</Text>
          {GOALS.map((item) => {
            const selected = goal === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setGoal(item.value)}
                className={cn(
                  'flex-row items-start gap-3 rounded-2xl border p-3.5',
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                )}>
                <View className={cn('h-9 w-9 items-center justify-center rounded-xl', selected ? 'bg-primary' : 'bg-muted')}>
                  <item.icon size={17} color={selected ? colors.primaryForeground : colors.mutedForeground} />
                </View>
                <View className="flex-1">
                  <Text className={cn('text-sm font-bold', selected ? 'text-primary' : 'text-foreground')}>{item.title}</Text>
                  <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</Text>
                </View>
                {selected ? <Check size={16} color={colors.primary} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Thời lượng</Text>
          <View className="flex-row flex-wrap gap-2">
            {HORIZONS.map((item) => {
              const selected = horizonWeeks === item.weeks;
              return (
                <Pressable
                  key={item.weeks}
                  onPress={() => setHorizonWeeks(item.weeks)}
                  className={cn(
                    'min-w-[47%] flex-1 rounded-2xl border p-3',
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}>
                  <Text className={cn('text-sm font-bold', selected ? 'text-primary' : 'text-foreground')}>{item.label}</Text>
                  <Text className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Ngày bắt đầu (Thứ hai)</Text>
          <View className="flex-row flex-wrap gap-2">
            {mondays.map((monday) => {
              const selected = startDate === monday;
              return (
                <Pressable
                  key={monday}
                  onPress={() => changeDate(monday)}
                  className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                  <Text className={cn('text-xs font-medium', selected ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {formatDateVi(monday)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={startDate}
            onChangeText={changeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
          />
          {dateNotice ? <Text className="text-xs text-amber-700">{dateNotice}</Text> : null}
        </View>

        {errorMessage ? (
          <View className="gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <Text className="text-sm text-destructive">{errorMessage}</Text>
            {needsProfile ? (
              <Link href={'/profile' as Href} asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-primary underline">Cập nhật hồ sơ</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        ) : null}

        <PrimaryButton
          label={mutation.isPending ? 'Đang tạo lộ trình...' : 'Tạo lộ trình'}
          loading={mutation.isPending}
          icon={<Sparkles size={16} color={colors.primaryForeground} />}
          onPress={() => void submit()}
        />
        {mutation.isPending ? (
          <Text className="text-center text-xs text-muted-foreground">
            Việc tạo nhiều tuần có thể mất tới một phút, vui lòng không đóng màn hình này.
          </Text>
        ) : null}
      </View>
    </SiteScreen>
  );
}
