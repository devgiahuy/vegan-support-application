import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { Image } from 'expo-image';
import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  Camera,
  Info,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Leaf,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Trash2,
  UtensilsCrossed,
  UserRound,
  Warehouse,
  type LucideIcon,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import {
  ActivityLevel,
  BiologicalSex,
  PracticeSchedule,
  UserRole,
} from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { useDetailedProfileQuery, useUpdateBasicProfileMutation } from '@/features/profile/queries/profile.queries';
import { AvatarEditor } from '@/features/profile/components/avatar-editor';
import { StorageSection } from '@/features/storage/components/storage-section';
import { useSaveHealthProfileMutation } from '@/features/profile/queries/health.queries';
import type { HealthProfile } from '@/features/profile/types/health.model';
import { useLogoutMutation } from '@/features/auth/queries/auth.queries';
import {
  usePersonalizationConsentQuery,
  useSetPersonalizationConsentMutation,
  RECOMMENDATION_QUERY_KEYS,
} from '@/features/recommendation/queries/recommendation.queries';
import { useDeleteBehaviorHistoryMutation } from '@/features/safety/queries/safety.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, formatDate } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

/** Nhãn đồng bộ form sức khỏe của web (`health-profile-form.tsx`). */
const SEX_OPTIONS: DropdownOption<BiologicalSex>[] = [
  { value: BiologicalSex.MALE, label: 'Nam' },
  { value: BiologicalSex.FEMALE, label: 'Nữ' },
];

const ACTIVITY_OPTIONS: DropdownOption<ActivityLevel>[] = [
  { value: ActivityLevel.SEDENTARY, label: 'Ít vận động (văn phòng, ngồi nhiều)' },
  { value: ActivityLevel.LIGHTLY_ACTIVE, label: 'Vận động nhẹ (yoga, đi bộ 1–3 ngày/tuần)' },
  { value: ActivityLevel.MODERATELY_ACTIVE, label: 'Vận động vừa (3–5 ngày/tuần)' },
  { value: ActivityLevel.VERY_ACTIVE, label: 'Vận động nhiều (cường độ cao 6–7 ngày/tuần)' },
  { value: ActivityLevel.EXTRA_ACTIVE, label: 'Vận động rất nhiều (lao động nặng / 2 buổi mỗi ngày)' },
];

/** Một dòng trong danh sách "Nội dung của bạn". */
interface ProfileMenuEntry {
  href: Href;
  title: string;
  note: string;
  icon: LucideIcon;
}

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
  const logoutMutation = useLogoutMutation();

  const [displayName, setDisplayName] = React.useState('');
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [profileTab, setProfileTab] = React.useState<'PROFILE' | 'STORAGE'>(
    tabParam === 'storage' ? 'STORAGE' : 'PROFILE'
  );
  // Thông báo dung lượng mở thẳng tab "Lưu trữ" kể cả khi màn Hồ sơ đã được mở sẵn (đổi state ngay lúc render).
  const [seenTabParam, setSeenTabParam] = React.useState(tabParam);
  if (seenTabParam !== tabParam) {
    setSeenTabParam(tabParam);
    if (tabParam === 'storage') setProfileTab('STORAGE');
  }
  const [avatarEditing, setAvatarEditing] = React.useState(false);
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [age, setAge] = React.useState('');
  const [sex, setSex] = React.useState<BiologicalSex>(BiologicalSex.MALE);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(ActivityLevel.SEDENTARY);
  const profile = isAuthenticated ? apiProfile : undefined;

  React.useEffect(() => {
    if (!profile) return;
    // Hydrate editable form fields from the loaded profile snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.user.displayName);
    setHealthForm(profile.health, { setHeight, setWeight, setAge, setSex, setActivityLevel });
  }, [profile]);

  const handleSaveBasicProfile = async () => {
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

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi VeggieConnect?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logoutMutation.mutate(undefined),
      },
    ]);
  };

  if (!isAuthenticated) {
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

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="flex-1 items-center justify-center px-5 py-16">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ của bạn...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !profile) {
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

  const displayProfile = profile;
  const health = displayProfile.health;
  const diet = displayProfile.diet;
  const contributionNote = displayProfile.user.contributorProfile
    ? `Đã duyệt • ${displayProfile.user.contributorProfile.approvalBasisLabel}`
    : displayProfile.user.contributorApplication
      ? `Trạng thái: ${displayProfile.user.contributorApplication.rawStatus}`
      : 'Chưa gửi nguyện vọng nào.';
  // Cùng thứ tự/nhãn với menu tài khoản của web. Mục "Hóa đơn mua sắm" và "Tra cứu dinh dưỡng 100g" đã được web gỡ khỏi
  // menu này nên không đặt ở đây (hóa đơn vẫn quét được từ Tủ bếp). Bảng điều khiển Contributor chỉ hiện với Contributor;
  // app không có màn quản trị Admin.
  const menuItems: ProfileMenuEntry[] = [
    { href: '/my-content' as Href, icon: BookOpen, title: 'Bài viết của tôi', note: 'Công thức, cẩm nang, video bạn đã đăng — sửa, xoá, theo dõi trạng thái duyệt.' },
    { href: '/meal-plans' as Href, icon: CalendarDays, title: 'Kế hoạch bữa ăn tuần', note: 'Tạo và xem thực đơn tuần theo chế độ ăn của bạn.' },
    { href: '/meal-plans/saved' as Href, icon: UtensilsCrossed, title: 'Thực đơn đã lưu', note: 'Các thực đơn tuần bạn đã tạo, kèm cảnh báo và phân tích.' },
    { href: '/custom-meals' as Href, icon: Leaf, title: 'Món ăn của tôi', note: 'Lưu món ăn cá nhân, thẻ phân loại và đưa vào thực đơn tuần.' },
    { href: '/meal-programs' as Href, icon: Target, title: 'Lộ trình nhiều tuần', note: 'Tạo lộ trình 2-12 tuần và xem phân tích tích lũy.' },
    { href: '/billing' as Href, icon: Package, title: 'Gói tiện ích', note: 'Mua thêm lượt AI và ô tủ đồ ăn.' },
    { href: '/pantry' as Href, icon: Warehouse, title: 'Tủ bếp gia đình', note: 'Quản lý nguyên liệu đã xác nhận, số lượng và hạn dùng.' },
    { href: '/restaurants/mine' as Href, icon: Store, title: 'Quán chay tôi đề xuất', note: 'Theo dõi trạng thái duyệt các quán bạn đã gửi.' },
    { href: '/ai-knowledge' as Href, icon: Sparkles, title: 'Khám phá Tri thức AI', note: 'Câu trả lời AI do cộng đồng chia sẻ và được thẩm định.' },
    { href: '/contributor-status' as Href, icon: BadgeCheck, title: 'Đóng góp', note: contributionNote },
    ...(displayProfile.user.role === UserRole.CONTRIBUTOR
      ? [{ href: '/contributor-dashboard' as Href, icon: ClipboardCheck, title: 'Bảng điều khiển Contributor', note: 'Hàng chờ kiểm duyệt, lối tắt đóng góp và quy chuẩn duyệt bài.' }]
      : []),
  ];

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="rounded-3xl border border-border bg-card p-5">
          <View className="flex-row gap-4">
            <View className="mb-2 mr-2">
              <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
                {displayProfile.user.avatarUrl ? (
                  <Image
                    source={{ uri: displayProfile.user.avatarUrl }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                    accessibilityLabel="Ảnh đại diện"
                  />
                ) : (
                  <Text className="text-2xl font-bold text-primary">{displayProfile.user.initials || 'U'}</Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đổi ảnh đại diện"
                onPress={() => setAvatarEditing(true)}
                hitSlop={6}
                className="absolute -bottom-2 -right-2 h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                <Camera size={16} color={colors.primary} />
              </Pressable>
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold text-foreground">{displayProfile.user.displayName}</Text>
              <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1">
                  <Award size={13} color="#d97706" />
                  <Text className="text-xs font-semibold text-amber-600">{displayProfile.user.role}</Text>
                </View>
                {diet ? (
                  <View className="rounded-full bg-muted px-2.5 py-1">
                    <Text className="text-xs font-semibold text-foreground">
                      {diet.dietPatternLabel} · {diet.practiceScheduleLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-2 text-sm text-muted-foreground">{displayProfile.user.email}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row">
            <View>
              <Text className="text-lg font-bold text-primary">{displayProfile.memberSince}</Text>
              <Text className="text-xs text-muted-foreground">Ngày tham gia</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          {(['PROFILE', 'STORAGE'] as const).map((tab) => (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: profileTab === tab }}
              onPress={() => setProfileTab(tab)}
              className={`min-h-12 flex-1 items-center justify-center rounded-lg border px-3 ${profileTab === tab ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <Text className="text-sm font-semibold text-foreground">
                {tab === 'PROFILE' ? 'Hồ sơ' : 'Lưu trữ'}
              </Text>
            </Pressable>
          ))}
        </View>
        {profileTab === 'STORAGE' ? <StorageSection /> : <>
        <SectionTitle title="Thông tin cá nhân" subtitle="Cập nhật tên hiển thị trên ứng dụng." />
        <View className="rounded-2xl border border-border bg-card p-4">
          <PrimaryButton label="Đổi ảnh đại diện" variant="outline" className="mb-4" onPress={() => setAvatarEditing(true)} />
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

        {health ? (
          <View className="mt-6 rounded-2xl border border-border bg-card p-4">
            <Text className="text-lg font-bold text-foreground">Kết quả sức khỏe</Text>
            <View className="mt-4 flex-row gap-2">
              <MetricCard label="BMI" value={health.bmi.toFixed(2)} note={health.bmiCategory} />
              <MetricCard label="BMR" value={health.bmr.toFixed(2)} note="kcal/ngày" />
              <MetricCard label="TDEE" value={health.tdee.toFixed(2)} note="kcal/ngày" />
            </View>
            <View className="mt-4 gap-1.5">
              <Text className="text-sm text-muted-foreground">
                {health.heightCm} cm · {health.weightKg} kg · {health.age} tuổi · {health.sexLabel} · {health.activityLevelLabel}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Nguồn: nhập tay · Cập nhật: {formatDate(health.updatedAt)}
              </Text>
            </View>
            {health.hasAbnormalBmi ? (
              <View
                accessibilityRole="alert"
                className="mt-4 flex-row items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle size={16} color="#d97706" />
                <Text className="flex-1 text-sm text-foreground">
                  Chỉ số BMI của bạn nằm ngoài khoảng thông thường (12–45). Hãy kiểm tra lại số liệu đã nhập hoặc tham khảo ý kiến chuyên gia dinh dưỡng.
                </Text>
              </View>
            ) : null}
            {health.needsDisclaimer ? (
              <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <Info size={16} color={colors.primary} />
                <Text className="flex-1 text-sm text-foreground">
                  Lưu ý: BMI của bạn thuộc nhóm cần quan tâm đặc biệt. Thực đơn sẽ kèm khuyến nghị phù hợp, không thay thế tư vấn y tế chuyên sâu.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="mt-6 rounded-2xl border border-dashed border-border p-4">
            <Text className="font-semibold text-foreground">Chưa có dữ liệu sức khỏe.</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Nhập chiều cao, cân nặng, tuổi, giới tính và mức vận động để xem BMI, BMR và TDEE của bạn.
            </Text>
          </View>
        )}

        <View className="mt-4 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">Nhập chỉ số thể trạng</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Lưu để xem BMI, BMR và TDEE do hệ thống tính cho bạn.
          </Text>

          <View className="mt-4 gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  labelVariant="plain"
                  label="Chiều cao (cm)"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Ví dụ: 162"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <TextField
                  labelVariant="plain"
                  label="Cân nặng (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Ví dụ: 52.5"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  labelVariant="plain"
                  label="Tuổi"
                  value={age}
                  onChangeText={setAge}
                  placeholder="Ví dụ: 27"
                  keyboardType="numeric"
                />
              </View>
              <DropdownField
                variant="field"
                className="flex-1"
                label="Giới tính"
                value={sex}
                options={SEX_OPTIONS}
                onChange={setSex}
              />
            </View>

            <DropdownField
              variant="field"
              label="Mức vận động"
              value={activityLevel}
              options={ACTIVITY_OPTIONS}
              onChange={setActivityLevel}
            />

            <PrimaryButton
              label="Lưu chỉ số sức khỏe"
              loading={saveHealth.isPending}
              style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 24 }}
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
                <Text numberOfLines={1} className="flex-1 text-base font-bold text-foreground">
                  {diet.dietPatternLabel}
                </Text>
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
                {diet.allergies.length || diet.ingredientAllergies.length ? (
                  <>
                    {diet.allergies.map((allergy) => (
                      <View key={allergy.allergenCode} className="rounded-full bg-destructive/10 px-3 py-1.5">
                        <Text className="text-xs font-semibold text-destructive">{allergy.label}</Text>
                      </View>
                    ))}
                    {diet.ingredientAllergies.map((allergy) => (
                      <View key={allergy.ingredientId} className="rounded-full bg-destructive/10 px-3 py-1.5">
                        <Text className="text-xs font-semibold text-destructive">
                          {allergy.ingredientName}
                          {allergy.ingredientActive ? '' : ' (đã gỡ khỏi danh mục)'}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text className="text-sm text-muted-foreground">Chưa khai báo dị ứng.</Text>
                )}
              </View>
              <View className="mt-4 flex-row gap-2">
                <Link href={'/diet-preferences' as Href} asChild>
                  <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input py-2.5">
                    <Text className="text-sm font-semibold text-foreground">Chỉnh sửa chế độ ăn</Text>
                  </Pressable>
                </Link>
                {diet.practiceSchedule === PracticeSchedule.PERIODIC ? (
                  <Link href={'/diet-schedule' as Href} asChild>
                    <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5">
                      <Text className="text-sm font-semibold text-primary">Sửa lịch chay kỳ</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
            </>
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-border p-5">
              <Activity size={22} color={colors.primary} />
              <Text className="mt-2 text-center font-semibold text-foreground">Chưa thiết lập chế độ ăn</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Thiết lập kiểu ăn, dị ứng và nguyên liệu loại trừ để lọc công thức phù hợp hơn.
              </Text>
              <Link href={'/diet-preferences' as Href} asChild>
                <PrimaryButton label="Thiết lập ngay" className="mt-4 w-full" />
              </Link>
            </View>
          )}
        </View>

        <SectionTitle title="Nội dung của bạn" subtitle="Nội dung và nguyện vọng bạn đã lưu/gửi trên VeggieConnect." />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {menuItems.map((entry, index) => {
            const Icon = entry.icon;
            return (
              <Link key={entry.title} href={entry.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  className={cn('flex-row items-center gap-3 p-4 active:bg-muted', index < menuItems.length - 1 ? 'border-b border-border' : '')}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{entry.title}</Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">{entry.note}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </Link>
            );
          })}
        </View>

        <PrivacySection />

        <SectionTitle title="Tài khoản & hệ thống" subtitle="Quản lý phiên đăng nhập trên thiết bị này." />
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Pressable
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex-row items-center gap-3 p-4 active:bg-muted"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <LogOut size={18} color={colors.destructive} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-destructive">
                {logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Thoát khỏi tài khoản trên thiết bị này.
              </Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        </>}
        <View className="h-6" />
      </View>
      {avatarEditing ? <AvatarEditor onClose={() => setAvatarEditing(false)} /> : null}
    </SiteScreen>
  );
}

/**
 * Cá nhân hoá & dữ liệu — bật/tắt gợi ý theo hành vi (`PUT /users/me/personalization`) và xoá
 * toàn bộ lịch sử hành vi (`DELETE /users/me/behavior-history`). Đồng bộ tab "Cá nhân hoá & Dữ liệu"
 * của web.
 */
function PrivacySection() {
  const colors = useIconColors();
  const queryClient = useQueryClient();
  const consentQuery = usePersonalizationConsentQuery();
  const setConsent = useSetPersonalizationConsentMutation();
  const deleteHistory = useDeleteBehaviorHistoryMutation();
  const consent = consentQuery.data;

  const toggleConsent = (enabled: boolean) => {
    if (!consent?.consentVersion) return;
    setConsent.mutate(
      { enabled, consentVersion: consent.consentVersion },
      {
        onError: (error) => {
          Alert.alert('Không cập nhật được', getApiErrorMessage(error, 'Vui lòng thử lại.'));
          void consentQuery.refetch();
        },
      }
    );
  };

  const confirmDeleteHistory = () => {
    Alert.alert(
      'Xóa toàn bộ lịch sử hành vi?',
      'Mọi bản ghi hành vi dùng để cá nhân hóa gợi ý sẽ bị xóa vĩnh viễn và không thể khôi phục. Gợi ý sẽ chuyển sang chế độ phổ biến. Muốn dừng hẳn, hãy tắt cá nhân hóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận xóa',
          style: 'destructive',
          onPress: () => {
            deleteHistory.mutate(undefined, {
              onSuccess: (result) => {
                void queryClient.invalidateQueries({ queryKey: RECOMMENDATION_QUERY_KEYS.all });
                Alert.alert('Đã xóa', `Đã xóa ${result.deletedCount} bản ghi hành vi.`);
              },
              onError: (error) => Alert.alert('Không xóa được', getApiErrorMessage(error, 'Vui lòng thử lại.')),
            });
          },
        },
      ]
    );
  };

  return (
    <>
      <SectionTitle
        title="Cá nhân hoá & Dữ liệu"
        subtitle="Kiểm soát việc dùng hành vi của bạn để gợi ý món ăn."
      />
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <View className="flex-row items-start gap-3 border-b border-border p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Gợi ý món theo hành vi</Text>
            <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Cho phép dùng món bạn xem, lưu, đánh giá để tinh chỉnh gợi ý. Khi tắt, bạn vẫn thấy gợi ý phổ biến.
              {consent?.consentVersion ? ` Phiên bản điều khoản: ${consent.consentVersion}.` : ''}
            </Text>
            {consentQuery.isError ? (
              <Text className="mt-1 text-xs text-destructive">Không tải được cài đặt gợi ý.</Text>
            ) : null}
          </View>
          {consentQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Switch
              value={consent?.enabled ?? false}
              disabled={!consent?.consentVersion || setConsent.isPending}
              onValueChange={toggleConsent}
              accessibilityLabel="Bật hoặc tắt gợi ý cá nhân hóa"
            />
          )}
        </View>
        <Pressable
          onPress={confirmDeleteHistory}
          disabled={deleteHistory.isPending}
          className="flex-row items-center gap-3 p-4 active:bg-muted">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={18} color={colors.destructive} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-destructive">
              {deleteHistory.isPending ? 'Đang xóa...' : 'Xóa lịch sử hành vi'}
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              Xóa vĩnh viễn dữ liệu dùng để cá nhân hóa gợi ý.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </>
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
    <View className="flex-1 items-center rounded-xl border border-border bg-muted p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit className="text-xl font-bold text-primary">
        {value}
      </Text>
      <Text numberOfLines={1} className="text-xs text-muted-foreground">
        {note}
      </Text>
    </View>
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
