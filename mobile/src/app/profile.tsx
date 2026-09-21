import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Leaf,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import {
  ActivityLevel,
  BiologicalSex,
  DietPattern,
  HealthDataSource,
  MemberStatus,
  PracticeSchedule,
  Tradition,
  UserRole,
} from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { useDetailedProfileQuery, useUpdateBasicProfileMutation } from '@/features/profile/queries/profile.queries';
import { useSaveHealthProfileMutation } from '@/features/profile/queries/health.queries';
import type { HealthProfile } from '@/features/profile/types/health.model';
import type { DetailedProfile } from '@/features/profile/types/profile.model';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

const ACTIVITY_OPTIONS = [
  { value: ActivityLevel.SEDENTARY, label: 'Ít vận động', note: 'Ngồi nhiều' },
  { value: ActivityLevel.LIGHTLY_ACTIVE, label: 'Nhẹ', note: '1-3 buổi/tuần' },
  { value: ActivityLevel.MODERATELY_ACTIVE, label: 'Vừa', note: '3-5 buổi/tuần' },
  { value: ActivityLevel.VERY_ACTIVE, label: 'Nhiều', note: '6-7 buổi/tuần' },
  { value: ActivityLevel.EXTRA_ACTIVE, label: 'Rất nhiều', note: 'Cường độ cao' },
] as const;

const MOCK_PROFILE: DetailedProfile = {
  user: {
    id: 'mock-member-001',
    email: 'demo.member@veggieconnect.vn',
    displayName: 'Nguyễn Minh An',
    avatarUrl: '',
    role: UserRole.MEMBER,
    status: MemberStatus.ACTIVE,
    createdAt: new Date('2026-08-12T08:00:00.000Z'),
    contributorApplication: null,
    initials: 'NA',
  },
  memberSince: '12/08/2026',
  health: {
    heightCm: 165,
    weightKg: 54,
    age: 22,
    sex: BiologicalSex.FEMALE,
    sexLabel: 'Nữ',
    activityLevel: ActivityLevel.MODERATELY_ACTIVE,
    activityLevelLabel: 'Vận động vừa',
    bmi: 19.8,
    bmiCategory: 'Cân đối',
    hasAbnormalBmi: false,
    needsDisclaimer: false,
    bmr: 1308,
    tdee: 2027,
    dataSource: HealthDataSource.MANUAL,
    updatedAt: new Date('2026-09-18T09:30:00.000Z'),
  },
  diet: {
    dietPattern: DietPattern.VEGAN,
    dietPatternLabel: 'Thuần chay',
    practiceSchedule: PracticeSchedule.PERMANENT,
    practiceScheduleLabel: 'An chay truong',
    tradition: Tradition.NONE,
    traditionLabel: 'Không theo truyền thống riêng',
    requiresRuleReview: false,
    confirmedAt: new Date('2026-09-10T10:15:00.000Z'),
    scheduleDates: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
    scheduleTimezone: 'Asia/Ho_Chi_Minh',
    allergies: [
      { allergenCode: 'PEANUT', label: 'Đậu phộng', severity: 'MEDIUM' },
      { allergenCode: 'SOY', label: 'Đậu nành', severity: 'LOW' },
    ],
  },
};

function toNumber(value: string): number {
  return Number(value.replace(',', '.').trim());
}

function validateHealth(heightCm: number, weightKg: number, age: number): string | null {
  if (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250) {
    return 'Chiều cao phải nằm trong khoảng 80-250 cm.';
  }
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500) {
    return 'Cân nặng phải nằm trong khoảng 20-500 kg.';
  }
  if (!Number.isInteger(age) || age < 13 || age > 120) {
    return 'Tuổi phải nằm trong khoảng 13-120.';
  }
  return null;
}

function setHealthForm(
  health: HealthProfile | null | undefined,
  setters: {
    setHeight: (value: string) => void;
    setWeight: (value: string) => void;
    setAge: (value: string) => void;
    setSex: (value: BiologicalSex) => void;
    setActivityLevel: (value: ActivityLevel) => void;
  }
) {
  setters.setHeight(health?.heightCm ? String(health.heightCm) : '');
  setters.setWeight(health?.weightKg ? String(health.weightKg) : '');
  setters.setAge(health?.age ? String(health.age) : '');
  setters.setSex(health?.sex ?? BiologicalSex.MALE);
  setters.setActivityLevel(health?.activityLevel ?? ActivityLevel.SEDENTARY);
}

export default function ProfileScreen() {
  const colors = useIconColors();
  const { isAuthenticated } = useAuthStore();
  const { data: apiProfile, isLoading, isError, refetch, isRefetching } = useDetailedProfileQuery();
  const updateProfile = useUpdateBasicProfileMutation();
  const saveHealth = useSaveHealthProfileMutation();

  const [displayName, setDisplayName] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [age, setAge] = React.useState('');
  const [sex, setSex] = React.useState<BiologicalSex>(BiologicalSex.MALE);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(ActivityLevel.SEDENTARY);
  const profile = isAuthenticated ? apiProfile : MOCK_PROFILE;

  React.useEffect(() => {
    if (!profile) return;
    // Hydrate editable form fields from the loaded profile snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.user.displayName);
    setHealthForm(profile.health, { setHeight, setWeight, setAge, setSex, setActivityLevel });
  }, [profile]);

  const handleSaveBasicProfile = async () => {
    if (!isAuthenticated) {
      Alert.alert('Đang xem bản demo', 'Đăng nhập để cập nhật hồ sơ thật của bạn.');
      return;
    }

    const nextName = displayName.trim();
    if (nextName.length < 2) {
      Alert.alert('Thông tin chưa hợp lệ', 'Tên hiển thị cần có ít nhất 2 ký tự.');
      return;
    }

    try {
      await updateProfile.mutateAsync({ displayName: nextName });
      Alert.alert('Đã cập nhật', 'Hồ sơ cá nhân của bạn đã được lưu.');
    } catch {
      Alert.alert('Không thể cập nhật', 'Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  const handleSaveHealth = async () => {
    if (!isAuthenticated) {
      Alert.alert('Đang xem bản demo', 'Đăng nhập để lưu chỉ số sức khỏe thật của bạn.');
      return;
    }

    const heightCm = toNumber(height);
    const weightKg = toNumber(weight);
    const parsedAge = Math.trunc(toNumber(age));
    const error = validateHealth(heightCm, weightKg, parsedAge);

    if (error) {
      Alert.alert('Thông tin chưa hợp lệ', error);
      return;
    }

    try {
      await saveHealth.mutateAsync({
        heightCm,
        weightKg,
        age: parsedAge,
        sex,
        activityLevel,
      });
      Alert.alert(
        'Đã cập nhật',
        'Thông tin chỉ số BMI và sức khỏe đã được cập nhật thành công!'
      );
      await refetch();
    } catch {
      Alert.alert('Không thể lưu chỉ số', 'Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  if (false && !isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserRound size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-2xl font-bold text-foreground">Đăng nhập để xem hồ sơ</Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              Hồ sơ cá nhân giúp VeggieConnect tính BMI, ghi nhớ chế độ ăn và gợi ý thực đơn phù hợp hơn.
            </Text>
            <View className="mt-5 w-full">
              <Link href="/(auth)/login" asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (isAuthenticated && isLoading) {
    return (
      <SiteScreen>
        <View className="flex-1 items-center justify-center px-5 py-16">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ của bạn...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isAuthenticated && (isError || !profile)) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
            <AlertTriangle size={28} color={colors.destructive} />
            <Text className="mt-3 text-center text-lg font-bold text-foreground">Không tải được hồ sơ</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Backend có thể đang tạm ngắt hoặc phiên đăng nhập đã hết hạn.
            </Text>
            <View className="mt-5 w-full">
              <PrimaryButton
                label="Thử lại"
                variant="outline"
                loading={isRefetching}
                icon={<RefreshCw size={16} color={colors.foreground} />}
                onPress={() => void refetch()}
              />
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  const displayProfile = profile ?? MOCK_PROFILE;
  const health = displayProfile.health;
  const diet = displayProfile.diet;

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Text className="text-base font-extrabold text-primary-foreground">
                {displayProfile.user.initials}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold text-foreground">{displayProfile.user.displayName}</Text>
              <Text className="text-sm text-muted-foreground">{displayProfile.user.email}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <InfoPill icon={<ShieldCheck size={13} color={colors.primary} />} label={displayProfile.user.role} />
            <InfoPill icon={<CalendarDays size={13} color={colors.primary} />} label={`Tham gia ${displayProfile.memberSince}`} />
          </View>
        </View>

        <SectionTitle title="Thông tin cá nhân" subtitle="Cập nhật tên hiển thị trên ứng dụng." />
        <View className="rounded-2xl border border-border bg-card p-4">
          <TextField
            label="Tên hiển thị"
            icon={UserRound}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập tên của bạn"
          />
          <View className="mt-4">
            <PrimaryButton
              label="Lưu tên hiển thị"
              loading={updateProfile.isPending}
              onPress={handleSaveBasicProfile}
            />
          </View>
        </View>

        <SectionTitle
          title="Chỉ số sức khỏe"
          subtitle="Dữ liệu này được dùng để tính BMI, BMR, TDEE và làm nền cho Meal Plan."
        />
        <View className="rounded-2xl border border-border bg-card p-4">
          {health ? (
            <View className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <View className="flex-row items-center gap-2">
                <HeartPulse size={18} color={colors.primary} />
                <Text className="text-base font-bold text-foreground">Tổng quan hiện tại</Text>
              </View>
              <View className="mt-4 flex-row gap-2">
                <MetricCard label="BMI" value={health.bmi.toFixed(1)} note={health.bmiCategory} />
                <MetricCard label="BMR" value={Math.round(health.bmr).toString()} note="kcal/ngày" />
                <MetricCard label="TDEE" value={Math.round(health.tdee).toString()} note="kcal/ngày" />
              </View>
              <Text className="mt-3 text-xs text-muted-foreground">
                Cập nhật gần nhất: {formatDate(health.updatedAt)}
              </Text>
              {health.needsDisclaimer ? (
                <View className="mt-3 flex-row gap-2 rounded-xl bg-destructive/10 p-3">
                  <AlertTriangle size={15} color={colors.destructive} />
                  <Text className="flex-1 text-xs text-destructive">
                    BMI nằm ngoài vùng an toàn thông thường. Nên tham khảo chuyên gia dinh dưỡng khi lập thực đơn.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View className="mb-4 rounded-2xl border border-dashed border-border p-4">
              <Text className="font-semibold text-foreground">Chưa có dữ liệu sức khỏe</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Nhập chiều cao, cân nặng và mức vận động để hệ thống tính BMI và TDEE.
              </Text>
            </View>
          )}

          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Chiều cao"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="cm"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Cân nặng"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="kg"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TextField
              label="Tuổi"
              value={age}
              onChangeText={setAge}
              placeholder="VD: 24"
              keyboardType="numeric"
            />

            <SegmentedLabel label="Giới tính sinh học" />
            <View className="flex-row gap-2">
              <ChoicePill label="Nam" selected={sex === BiologicalSex.MALE} onPress={() => setSex(BiologicalSex.MALE)} />
              <ChoicePill label="Nữ" selected={sex === BiologicalSex.FEMALE} onPress={() => setSex(BiologicalSex.FEMALE)} />
            </View>

            <SegmentedLabel label="Mức vận động" />
            <View className="gap-2">
              {ACTIVITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setActivityLevel(option.value)}
                  className={`rounded-2xl border p-3 ${
                    activityLevel === option.value ? 'border-primary bg-primary/10' : 'border-border bg-background'
                  }`}>
                  <Text className="font-semibold text-foreground">{option.label}</Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">{option.note}</Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton
              label="Lưu chỉ số sức khỏe"
              loading={saveHealth.isPending}
              icon={<CheckCircle2 size={16} color={colors.primaryForeground} />}
              onPress={handleSaveHealth}
            />
          </View>
        </View>

        <SectionTitle
          title="Chế độ ăn & dị ứng"
          subtitle="Dùng để lọc công thức và tránh nguyên liệu không phù hợp."
        />
        <View className="rounded-2xl border border-border bg-card p-4">
          {diet ? (
            <>
              <View className="flex-row items-center gap-2">
                <Leaf size={18} color={colors.primary} />
                <Text className="text-base font-bold text-foreground">{diet.dietPatternLabel}</Text>
              </View>
              <View className="mt-3 gap-2">
                <ProfileRow label="Lịch thực hành" value={diet.practiceScheduleLabel} />
                <ProfileRow label="Truyền thống" value={diet.traditionLabel} />
                <ProfileRow label="Ngày chay kỳ" value={diet.scheduleDates.length ? diet.scheduleDates.join(', ') : '-'} />
                <ProfileRow label="Múi giờ" value={diet.scheduleTimezone} />
              </View>

              <Text className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Thực phẩm dị ứng
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {diet.allergies.length ? (
                  diet.allergies.map((allergy) => (
                    <View key={allergy.allergenCode} className="rounded-full bg-destructive/10 px-3 py-1.5">
                      <Text className="text-xs font-semibold text-destructive">{allergy.label}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-sm text-muted-foreground">Chưa khai báo dị ứng.</Text>
                )}
              </View>
            </>
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-border p-5">
              <Activity size={22} color={colors.primary} />
              <Text className="mt-2 text-center font-semibold text-foreground">Chưa thiết lập chế độ ăn</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Phần này sẽ hiển thị khi bạn lưu diet preferences từ luồng Meal Plan.
              </Text>
            </View>
          )}
        </View>

        <View className="h-6" />
      </View>
    </SiteScreen>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mt-6 mb-3">
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-background p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-lg font-extrabold text-primary">{value}</Text>
      <Text className="text-[11px] text-muted-foreground">{note}</Text>
    </View>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5">
      {icon}
      <Text className="text-xs font-semibold text-foreground">{label}</Text>
    </View>
  );
}

function SegmentedLabel({ label }: { label: string }) {
  return <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>;
}

function ChoicePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl border px-3 py-3 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-background'
      }`}>
      <Text className={`text-center text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
