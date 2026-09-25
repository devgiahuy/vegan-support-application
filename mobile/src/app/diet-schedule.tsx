import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { CalendarPlus, CheckCircle2, X } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { useSaveDietScheduleMutation } from '@/features/diet-preferences/queries/diet-preferences.queries';
import { PracticeSchedule } from '@/common/enums';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sửa riêng ngày chay kỳ — `PUT /users/me/diet-schedule`, đồng bộ
 * `frontend/src/features/diet-preferences/components/schedule-editor.tsx`. Không đụng
 * tới rule set/dị ứng/loại trừ đã lưu, chỉ thay danh sách ngày; cho phép lưu rỗng để
 * xoá hết ngày. Chỉ áp dụng khi đã lưu chế độ ăn và đang chọn lịch "Chay kỳ".
 */
export default function DietScheduleScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: profile, isLoading } = useDetailedProfileQuery();
  const saveMutation = useSaveDietScheduleMutation();

  const [dates, setDates] = React.useState<string[]>([]);
  const [dateInput, setDateInput] = React.useState('');
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (profile?.diet && !hydrated) {
      setDates(profile.diet.scheduleDates);
      setHydrated(true);
    }
  }, [profile?.diet, hydrated]);

  const addDate = () => {
    const value = dateInput.trim();
    if (!DATE_RE.test(value)) {
      Alert.alert('Ngày không hợp lệ', 'Ngày phải đúng dạng YYYY-MM-DD (ví dụ 2026-09-15).');
      return;
    }
    if (dates.includes(value)) {
      Alert.alert('Đã tồn tại', 'Ngày này đã có trong danh sách.');
      return;
    }
    setDates((prev) => [...prev, value].sort());
    setDateInput('');
  };

  const save = async () => {
    try {
      await saveMutation.mutateAsync(dates);
      Alert.alert('Đã lưu', 'Lịch chay kỳ đã được cập nhật.');
      router.back();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DIET_PREFERENCES_REQUIRED') {
        Alert.alert('Chưa thiết lập chế độ ăn', 'Vui lòng lưu lựa chọn chế độ ăn trước khi sửa lịch.');
        return;
      }
      if (code === 'DIET_SCHEDULE_NOT_APPLICABLE') {
        Alert.alert('Không áp dụng', 'Lịch ngày chỉ áp dụng cho lịch thực hành "Chay kỳ".');
        return;
      }
      if (code === 'DIET_SCHEDULE_REQUIRED') {
        Alert.alert('Thiếu ngày', 'Cần chọn ít nhất một ngày cho lịch chay kỳ.');
        return;
      }
      Alert.alert('Không lưu được', getApiErrorMessage(error));
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để sửa lịch chay kỳ</Text>
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

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="items-center justify-center px-5 py-20">
          <Text className="text-sm text-muted-foreground">Đang tải...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (!profile?.diet) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Chưa thiết lập chế độ ăn</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Cần lưu lựa chọn chế độ ăn trước khi sửa lịch chay kỳ.
          </Text>
          <View className="mt-6">
            <Link href="/diet-preferences" asChild>
              <PrimaryButton label="Thiết lập chế độ ăn" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (profile.diet.practiceSchedule !== PracticeSchedule.PERIODIC) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Không áp dụng</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Lịch ngày chỉ áp dụng khi lịch thực hành đang chọn là "Chay kỳ". Hiện bạn đang chọn "
            {profile.diet.practiceScheduleLabel}".
          </Text>
          <View className="mt-6">
            <Link href="/diet-preferences" asChild>
              <PrimaryButton label="Đổi lịch thực hành" variant="outline" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Lịch chay kỳ</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Sửa ngày chay kỳ mà không cần chạy lại toàn bộ thiết lập chế độ ăn.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-1.5">
            <CalendarPlus size={14} color={colors.primary} />
            <Text className="text-sm font-bold text-foreground">Các ngày đã chọn ({dates.length})</Text>
          </View>

          {dates.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {dates.map((d) => (
                <View key={d} className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-xs font-medium text-primary">{d}</Text>
                  <Pressable onPress={() => setDates((prev) => prev.filter((x) => x !== d))}>
                    <X size={11} color={colors.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">Chưa có ngày nào — có thể lưu rỗng để xoá hết.</Text>
          )}

          <View className="flex-row gap-2">
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 rounded-xl border border-input bg-background p-2.5 text-sm text-foreground"
            />
            <Pressable onPress={addDate} className="items-center justify-center rounded-xl bg-primary px-4">
              <Text className="text-sm font-semibold text-primary-foreground">Thêm</Text>
            </Pressable>
          </View>
        </View>

        <PrimaryButton
          label={saveMutation.isPending ? 'Đang lưu...' : 'Lưu lịch chay kỳ'}
          loading={saveMutation.isPending}
          icon={<CheckCircle2 size={16} color={colors.primaryForeground} />}
          onPress={() => void save()}
        />
      </View>
    </SiteScreen>
  );
}
