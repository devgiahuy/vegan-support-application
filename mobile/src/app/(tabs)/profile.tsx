import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Database,
  FileText,
  HelpCircle,
  Info,
  Leaf,
  LogOut,
  MessageSquare,
  Moon,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
  Target,
  Trash2,
  UserRound,
  UtensilsCrossed,
  Warehouse,
  type LucideIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useQueryClient } from '@tanstack/react-query';

import {
  ActivityLevel,
  BiologicalSex,
  UserRole,
} from '@/common/enums';
import { FOOD_ALLOWANCE_OPTIONS } from '@/features/diet-preferences/components/food-allowance-switches';
import { SiteScreen } from '@/components/layout/site-screen';
import { FormSheet } from '@/components/shared/form-sheet';
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

type ProfileTab = 'MAIN' | 'HEALTH' | 'STORAGE';

/** Một dòng trong danh sách liên kết ở màn Hồ sơ. */
interface ProfileMenuEntry {
  href: Href;
  title: string;
  note: string;
  icon: LucideIcon;
}

const SUPPORT_SHEET_ITEMS: ProfileMenuEntry[] = [
  { href: '/help' as Href, icon: HelpCircle, title: 'Hướng dẫn sử dụng', note: 'Cách dùng thực đơn tuần, tủ bếp và bộ lọc an toàn.' },
  { href: '/feedback' as Href, icon: MessageSquare, title: 'Gửi góp ý', note: 'Phản hồi trải nghiệm và báo lỗi ứng dụng.' },
  { href: '/contact' as Href, icon: Phone, title: 'Liên hệ', note: 'Kênh tiếp nhận hỗ trợ từ đội ngũ vận hành.' },
];

const LEGAL_SHEET_ITEMS: ProfileMenuEntry[] = [
  { href: '/about' as Href, icon: Info, title: 'Về VeggieConnect', note: 'Giới thiệu ứng dụng, phạm vi hỗ trợ và nguồn dữ liệu.' },
  { href: '/guidelines' as Href, icon: BookOpen, title: 'Quy chuẩn cộng đồng', note: 'Nguyên tắc đăng công thức, bài viết và đề xuất quán.' },
  { href: '/privacy' as Href, icon: Shield, title: 'Chính sách bảo mật', note: 'Cách lưu trữ và bảo vệ dữ liệu cá nhân.' },
  { href: '/terms' as Href, icon: FileText, title: 'Điều khoản sử dụng', note: 'Quy định sử dụng và lưu ý thông tin tham khảo.' },
];

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
  const [profileTab, setProfileTab] = React.useState<ProfileTab>(
    tabParam === 'storage' ? 'STORAGE' : tabParam === 'health' ? 'HEALTH' : 'MAIN'
  );
  // Thông báo dung lượng hoặc liên kết sâu mở thẳng tab đích kể cả khi màn Hồ sơ đã được mở sẵn.
  const [seenTabParam, setSeenTabParam] = React.useState(tabParam);
  if (seenTabParam !== tabParam) {
    setSeenTabParam(tabParam);
    if (tabParam === 'storage') setProfileTab('STORAGE');
    else if (tabParam === 'health') setProfileTab('HEALTH');
  }
  const [editingBasic, setEditingBasic] = React.useState(false);
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
      setEditingBasic(false);
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
        <View className="px-5 pt-6">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserRound size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-2xl font-bold text-foreground">Tài khoản VeggieConnect</Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              Đăng nhập để tính chỉ số sức khỏe, lưu chế độ ăn, quản lý tủ bếp và đồng bộ thực đơn cá nhân.
            </Text>
            <View className="mt-5 w-full gap-2.5">
              <Link href="/(auth)/login" asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
              <Link href="/(auth)/register" asChild>
                <PrimaryButton label="Tạo tài khoản mới" variant="outline" />
              </Link>
            </View>
          </View>

          <SectionTitle title="Giao diện ứng dụng" subtitle="Chọn chế độ hiển thị phù hợp khi sử dụng." />
          <AppearanceSettingCard />

          <SectionTitle title="Tra cứu & Hỗ trợ" subtitle="Thông tin mở dùng ngay không cần đăng nhập." />
          <SupportAndLegalMenu includeFoodData />
          <View className="h-4" />
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
      <SiteScreen onRefresh={() => refetch()}>
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
  const allowedGroupCount = diet
    ? FOOD_ALLOWANCE_OPTIONS.filter((option) => diet[option.key]).length
    : 0;
  const allergyCount = diet
    ? diet.allergies.length + diet.ingredientAllergies.length
    : 0;
  const contributionNote = displayProfile.user.contributorProfile
    ? `Đã duyệt • ${displayProfile.user.contributorProfile.approvalBasisLabel}`
    : displayProfile.user.contributorApplication
      ? `Trạng thái: ${displayProfile.user.contributorApplication.rawStatus}`
      : 'Chưa gửi nguyện vọng nào.';

  const kitchenItems: ProfileMenuEntry[] = [
    { href: '/pantry' as Href, icon: Warehouse, title: 'Tủ bếp gia đình', note: 'Nguyên liệu, hạn dùng và quét tủ lạnh / hóa đơn.' },
    { href: '/meal-plans' as Href, icon: CalendarDays, title: 'Kế hoạch bữa ăn tuần', note: 'Tạo và xem thực đơn tuần theo chế độ ăn của bạn.' },
    { href: '/meal-plans/saved' as Href, icon: UtensilsCrossed, title: 'Thực đơn đã lưu', note: 'Các thực đơn tuần đã tạo, kèm cảnh báo và phân tích.' },
    { href: '/custom-meals' as Href, icon: Leaf, title: 'Món ăn của tôi', note: 'Lưu món ăn cá nhân, thẻ phân loại và đưa vào thực đơn.' },
    { href: '/meal-programs' as Href, icon: Target, title: 'Lộ trình nhiều tuần', note: 'Tạo lộ trình 2–12 tuần và xem phân tích tích lũy.' },
    { href: '/shopping-preview' as Href, icon: ShoppingBag, title: 'Danh sách cần mua', note: 'Tính nguyên liệu cần mua dựa trên thực đơn của bạn.' },
  ];

  const contributionItems: ProfileMenuEntry[] = [
    { href: '/my-content' as Href, icon: BookOpen, title: 'Bài viết của tôi', note: 'Công thức, cẩm nang, video đã đăng và trạng thái duyệt.' },
    { href: '/restaurants/mine' as Href, icon: Store, title: 'Quán chay tôi đề xuất', note: 'Theo dõi trạng thái duyệt các quán bạn đã gửi.' },
    { href: '/contributor-status' as Href, icon: BadgeCheck, title: 'Đóng góp', note: contributionNote },
    ...(displayProfile.user.role === UserRole.CONTRIBUTOR
      ? [{ href: '/contributor-dashboard' as Href, icon: ClipboardCheck, title: 'Bảng điều khiển Contributor', note: 'Hàng chờ kiểm duyệt, lối tắt đóng góp và quy chuẩn duyệt bài.' }]
      : []),
  ];

  const accountUtilityItems: ProfileMenuEntry[] = [
    { href: '/billing' as Href, icon: Package, title: 'Gói tiện ích', note: 'Mua thêm lượt AI và mở rộng ô lưu trữ tủ đồ ăn.' },
    { href: '/food-data' as Href, icon: Database, title: 'Tra cứu dữ liệu thực phẩm', note: 'Dinh dưỡng 100g, kiêng kỵ và giữ chất khi chế biến.' },
  ];

  return (
    <SiteScreen onRefresh={() => refetch()}>
      <View className="px-5 pt-4">
        <View className="rounded-3xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
              {displayProfile.user.avatarUrl ? (
                <Image
                  source={{ uri: displayProfile.user.avatarUrl }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                  accessibilityLabel="Ảnh đại diện"
                />
              ) : (
                <Text className="text-2xl font-bold text-primary">{displayProfile.user.initials || 'U'}</Text>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text numberOfLines={2} className="text-lg font-bold text-foreground">
                {displayProfile.user.displayName}
              </Text>
              <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
                <View className="flex-row items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5">
                  <Award size={12} color="#d97706" />
                  <Text className="text-xs font-semibold text-amber-600">{displayProfile.user.role}</Text>
                </View>
                <Text className="text-xs text-muted-foreground">Tham gia: {displayProfile.memberSince}</Text>
              </View>
              <Text numberOfLines={1} className="mt-1 text-xs text-muted-foreground">
                {displayProfile.user.email}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setEditingBasic((prev) => !prev)}
            accessibilityRole="button"
            accessibilityState={{ expanded: editingBasic }}
            className="mt-4 min-h-11 flex-row items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2 active:bg-muted">
            <View className="flex-row items-center gap-2">
              <Pencil size={15} color={colors.foreground} />
              <Text className="text-sm font-semibold text-foreground">Sửa tên & ảnh đại diện</Text>
            </View>
            {editingBasic ? (
              <ChevronUp size={16} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={16} color={colors.mutedForeground} />
            )}
          </Pressable>

          {editingBasic ? (
            <View className="mt-3 gap-3 border-t border-border pt-3">
              <PrimaryButton
                label="Đổi ảnh đại diện"
                variant="outline"
                onPress={() => setAvatarEditing(true)}
              />
              <TextField
                label="Tên hiển thị"
                icon={UserRound}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Nhập tên của bạn"
              />
              <View className="flex-row gap-2">
                <PrimaryButton
                  label="Đóng"
                  variant="outline"
                  className="flex-1"
                  onPress={() => {
                    setDisplayName(displayProfile.user.displayName);
                    setEditingBasic(false);
                  }}
                />
                <PrimaryButton
                  label="Lưu tên"
                  className="flex-1"
                  loading={updateProfile.isPending}
                  onPress={handleSaveBasicProfile}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row gap-2">
          {(
            [
              { key: 'MAIN', label: 'Tiện ích' },
              { key: 'HEALTH', label: 'Sức khỏe & Ăn' },
              { key: 'STORAGE', label: 'Lưu trữ' },
            ] as const
          ).map((item) => {
            const active = profileTab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setProfileTab(item.key)}
                className={cn(
                  'min-h-11 flex-1 items-center justify-center rounded-xl border px-2',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-card'
                )}>
                <Text
                  numberOfLines={1}
                  className={cn(
                    'text-xs font-semibold',
                    active ? 'text-primary' : 'text-foreground'
                  )}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {profileTab === 'STORAGE' ? (
          <StorageSection />
        ) : profileTab === 'MAIN' ? (
          <>
            <View className="mt-4 flex-row gap-2.5">
              <Pressable
                onPress={() => setProfileTab('HEALTH')}
                accessibilityRole="button"
                accessibilityLabel="Xem và chỉnh sửa chỉ số sức khỏe"
                className="min-h-[84px] flex-1 justify-between rounded-2xl border border-border bg-card p-3.5 active:bg-muted">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-muted-foreground">Chỉ số BMI / TDEE</Text>
                  <Activity size={15} color={colors.primary} />
                </View>
                {health ? (
                  <View className="mt-1.5">
                    <Text numberOfLines={1} className="text-base font-bold text-primary">
                      BMI {health.bmi.toFixed(1)}
                    </Text>
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                      {Math.round(health.tdee)} kcal/ngày
                    </Text>
                  </View>
                ) : (
                  <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-foreground">
                    Nhấn để nhập chỉ số thể trạng
                  </Text>
                )}
              </Pressable>

              <Link href={'/diet-preferences' as Href} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Thiết lập chế độ ăn và dị ứng"
                  className="min-h-[84px] flex-1 justify-between rounded-2xl border border-border bg-card p-3.5 active:bg-muted">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-muted-foreground">Chế độ ăn</Text>
                    <Leaf size={15} color={colors.primary} />
                  </View>
                  {diet ? (
                    <View className="mt-1.5">
                      <Text numberOfLines={1} className="text-base font-bold text-foreground">
                        {allergyCount} dị ứng
                      </Text>
                      <Text numberOfLines={1} className="text-xs text-muted-foreground">
                        {allowedGroupCount}/4 nhóm được dùng
                      </Text>
                    </View>
                  ) : (
                    <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-primary">
                      Thiết lập chế độ ăn →
                    </Text>
                  )}
                </Pressable>
              </Link>
            </View>

            <SectionTitle title="Bếp & Kế hoạch" subtitle="Công cụ ăn uống hằng ngày của bạn." />
            <MenuGroup items={kitchenItems} />

            <SectionTitle title="Nội dung & Đóng góp" subtitle="Bài viết, quán chay và vai trò cộng đồng." />
            <MenuGroup items={contributionItems} />

            <SectionTitle title="Tài khoản & Tiện ích" subtitle="Nâng cấp giới hạn, giao diện và tra cứu nguyên liệu." />
            <View className="gap-3">
              <AppearanceSettingCard />
              <MenuGroup items={accountUtilityItems} />
            </View>

            <SectionTitle title="Hỗ trợ & Pháp lý" subtitle="Hướng dẫn, góp ý và thông tin quy định." />
            <SupportAndLegalMenu />

            <SectionTitle title="Phiên đăng nhập" subtitle="Quản lý tài khoản trên thiết bị này." />
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              <Pressable
                onPress={handleLogout}
                disabled={logoutMutation.isPending}
                accessibilityRole="button"
                className="min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
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
          </>
        ) : (
          <>
            {health ? (
              <View className="mt-4 rounded-2xl border border-border bg-card p-4">
                <Text className="text-lg font-bold text-foreground">Kết quả sức khỏe</Text>
                <View className="mt-4 flex-row gap-2">
                  <MetricCard label="BMI" value={health.bmi.toFixed(1)} note={health.bmiCategory} />
                  <MetricCard label="BMR" value={String(Math.round(health.bmr))} note="kcal/ngày" />
                  <MetricCard label="TDEE" value={String(Math.round(health.tdee))} note="kcal/ngày" />
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
              <View className="mt-4 rounded-2xl border border-dashed border-border p-4">
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
                      Thực phẩm bạn dùng
                    </Text>
                  </View>
                  <View className="mt-3 gap-2">
                    {FOOD_ALLOWANCE_OPTIONS.map((option) => (
                      <ProfileRow key={option.key} label={option.label} value={diet[option.key] ? 'Được ăn' : 'Kiêng'} />
                    ))}
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
                  <View className="mt-4">
                    <Link href={'/diet-preferences' as Href} asChild>
                      <PrimaryButton label="Chỉnh sửa chế độ ăn" variant="outline" />
                    </Link>
                  </View>
                </>
              ) : (
                <View className="items-center rounded-2xl border border-dashed border-border p-5">
                  <Activity size={22} color={colors.primary} />
                  <Text className="mt-2 text-center font-semibold text-foreground">Chưa thiết lập chế độ ăn</Text>
                  <Text className="mt-1 text-center text-sm text-muted-foreground">
                    Thiết lập thực phẩm được ăn, dị ứng và nguyên liệu kiêng để lọc công thức phù hợp hơn.
                  </Text>
                  <Link href={'/diet-preferences' as Href} asChild>
                    <PrimaryButton label="Thiết lập ngay" className="mt-4 w-full" />
                  </Link>
                </View>
              )}
            </View>

            <PrivacySection />
          </>
        )}

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

function AppearanceSettingCard() {
  const colors = useIconColors();
  const { colorScheme, setColorScheme } = useColorScheme();
  const current = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="mb-3">
        <Text className="text-sm font-semibold text-foreground">Giao diện hiển thị</Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">
          Đang dùng chế độ {current === 'dark' ? 'Tối' : 'Sáng'}.
        </Text>
      </View>
      <View className="flex-row gap-2">
        {(
          [
            { value: 'light', label: 'Sáng', Icon: Sun },
            { value: 'dark', label: 'Tối', Icon: Moon },
          ] as const
        ).map(({ value, label, Icon }) => {
          const active = current === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setColorScheme(value)}
              className={cn(
                'min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-3',
                active ? 'border-primary bg-primary/10' : 'border-input bg-background'
              )}>
              <Icon size={16} color={active ? colors.primary : colors.foreground} />
              <Text className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MenuGroup({ items }: { items: ProfileMenuEntry[] }) {
  const colors = useIconColors();
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((entry, index) => {
        const Icon = entry.icon;
        return (
          <Link key={entry.title} href={entry.href} asChild>
            <Pressable
              accessibilityRole="link"
              className={cn(
                'min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted',
                index < items.length - 1 ? 'border-b border-border' : ''
              )}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon size={18} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                  {entry.title}
                </Text>
                <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
                  {entry.note}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

function SupportAndLegalMenu({ includeFoodData = false }: { includeFoodData?: boolean }) {
  const router = useRouter();
  const colors = useIconColors();
  const [openSheet, setOpenSheet] = React.useState<'support' | 'legal' | null>(null);

  const activeItems = openSheet === 'support' ? SUPPORT_SHEET_ITEMS : openSheet === 'legal' ? LEGAL_SHEET_ITEMS : [];
  const activeTitle = openSheet === 'support' ? 'Trung tâm hỗ trợ' : 'Giới thiệu & Pháp lý';

  const navigateFromSheet = (href: Href) => {
    setOpenSheet(null);
    router.push(href);
  };

  return (
    <>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        {includeFoodData ? (
          <Link href={'/food-data' as Href} asChild>
            <Pressable
              accessibilityRole="link"
              className="min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Database size={18} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                  Tra cứu dữ liệu thực phẩm
                </Text>
                <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
                  Dinh dưỡng 100g, kiêng kỵ và giữ chất chế biến.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          </Link>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => setOpenSheet('support')}
          className={cn(
            'min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted',
            includeFoodData ? 'border-t border-border' : ''
          )}>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle size={18} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
              Trung tâm hỗ trợ
            </Text>
            <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
              Hướng dẫn sử dụng, gửi góp ý và liên hệ.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setOpenSheet('legal')}
          className="min-h-14 flex-row items-center gap-3 border-t border-border px-4 py-3.5 active:bg-muted">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Shield size={18} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
              Giới thiệu & Pháp lý
            </Text>
            <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
              Về VeggieConnect, quy chuẩn, bảo mật và điều khoản.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {openSheet ? (
        <FormSheet
          title={activeTitle}
          variant="bottom-sheet"
          onClose={() => setOpenSheet(null)}
        >
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {activeItems.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <Pressable
                  key={entry.title}
                  accessibilityRole="button"
                  onPress={() => navigateFromSheet(entry.href)}
                  className={cn(
                    'min-h-14 flex-row items-center gap-3 px-4 py-3.5 active:bg-muted',
                    index > 0 ? 'border-t border-border' : ''
                  )}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon size={18} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                      {entry.title}
                    </Text>
                    <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
                      {entry.note}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </View>
        </FormSheet>
      ) : null}
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
      <Text numberOfLines={1} adjustsFontSizeToFit className="mt-0.5 text-lg font-bold text-primary">
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
