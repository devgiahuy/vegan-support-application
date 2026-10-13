import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  Link2,
  Plus,
  Sparkles,
  XCircle,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useMyContributorApplicationsQuery,
  useSubmitContributorApplicationMutation,
} from '@/features/contributor/queries/contributor.queries';
import type { ContributorApplicationDetail } from '@/features/contributor/types/contributor.model';
import { ContributorApplicationStatus, UserRole } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn, formatDate } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

type Basis = 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';

const MAX_REFERENCE_LINKS = 5;
const MIN_EXPERIENCE_LENGTH = 20;
const MAX_EXPERIENCE_LENGTH = 2000;

/** Căn cứ đề xuất phê duyệt — chữ đồng bộ `application-form.tsx` của web. */
const BASIS_OPTIONS: { value: Basis; label: string; hint: string; icon: LucideIcon }[] = [
  {
    value: 'ORGANIZATION_AFFILIATION',
    label: 'Tổ chức đối tác / Viện ẩm thực',
    hint: 'Trực thuộc hoặc đại diện tổ chức, viện nghiên cứu, hội đoàn ẩm thực chay',
    icon: Building2,
  },
  {
    value: 'PLATFORM_TRACK_RECORD',
    label: 'Thành viên uy tín trên nền tảng',
    hint: 'Đã có lịch sử hoạt động tích cực, chia sẻ nội dung chay chất lượng cho cộng đồng',
    icon: Sparkles,
  },
];

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function StatusBadge({ status, label }: { status: ContributorApplicationStatus; label: string }) {
  const colors = useIconColors();
  if (status === ContributorApplicationStatus.APPROVED) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-primary px-2.5 py-1">
        <CheckCircle2 size={12} color={colors.primaryForeground} />
        <Text className="text-xs font-semibold text-primary-foreground">{label}</Text>
      </View>
    );
  }
  if (status === ContributorApplicationStatus.REJECTED) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-destructive px-2.5 py-1">
        <XCircle size={12} color="#ffffff" />
        <Text className="text-xs font-semibold text-white">{label}</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
      <Clock size={12} color={colors.mutedForeground} />
      <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
    </View>
  );
}

/** Một đơn trong "Lịch sử đơn của bạn" — nội dung theo `my-applications.tsx` của web. */
function ApplicationCard({ item }: { item: ContributorApplicationDetail }) {
  const statusLabel =
    item.status === ContributorApplicationStatus.APPROVED
      ? 'Đã duyệt'
      : item.status === ContributorApplicationStatus.REJECTED
        ? 'Từ chối'
        : 'Đang chờ duyệt';
  return (
    <View className="gap-1.5 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">{item.claimedApprovalBasisLabel}</Text>
          {item.organizationClaim ? (
            <Text className="text-xs text-muted-foreground">({item.organizationClaim})</Text>
          ) : null}
        </View>
        <StatusBadge status={item.status} label={statusLabel} />
      </View>

      {item.approvalBasisLabel ? (
        <Text className="text-sm text-foreground">
          Căn cứ phê duyệt chính thức: <Text className="font-bold">{item.approvalBasisLabel}</Text>
        </Text>
      ) : null}
      {item.reviewNote ? (
        <Text className="text-sm text-muted-foreground">
          Ghi chú thẩm định: <Text className="text-foreground">{item.reviewNote}</Text>
        </Text>
      ) : null}
      {item.reviewedBy ? (
        <Text className="text-xs text-muted-foreground">
          Người duyệt: {item.reviewedBy.displayName}
          {item.reviewedAt ? ` · ${formatDate(item.reviewedAt)}` : ''}
        </Text>
      ) : null}
      {item.status === ContributorApplicationStatus.REJECTED && item.reapplyEligibleAt ? (
        <Text className="text-xs font-medium text-amber-600">
          Được phép nộp lại hồ sơ từ ngày: {formatDate(item.reapplyEligibleAt)}
        </Text>
      ) : null}
      <Text className="mt-1 border-t border-border pt-2 text-xs text-muted-foreground">
        Nộp ngày {formatDate(item.createdAt)}
      </Text>
    </View>
  );
}

/**
 * Trang "Đóng góp" — bố cục theo tab Đóng góp của web: khối "Đăng ký Người đóng góp (Contributor)" rồi
 * "Lịch sử đơn của bạn". Chỉ thu thập nguyện vọng và căn cứ đề xuất, không tự cấp quyền (BL-01): quyền Contributor
 * chỉ có sau khi Quản trị viên duyệt thủ công.
 */
export default function ContributorStatusScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const { data: pagination, isLoading, isError, refetch } = useMyContributorApplicationsQuery({ limit: 50 });
  const submitMutation = useSubmitContributorApplicationMutation();
  const applications = React.useMemo(() => pagination?.items ?? [], [pagination?.items]);

  const [basis, setBasis] = React.useState<Basis>('ORGANIZATION_AFFILIATION');
  const [organizationClaim, setOrganizationClaim] = React.useState('');
  const [experience, setExperience] = React.useState('');
  const [links, setLinks] = React.useState<string[]>(['']);
  const [errors, setErrors] = React.useState<{ organization?: string; experience?: string; links?: string }>({});
  // Chụp một lần lúc mở màn để so với thời hạn được nộp lại.
  const [now] = React.useState(() => Date.now());

  const hasPending = applications.some((a) => a.status === ContributorApplicationStatus.PENDING);
  const cooling = applications.find(
    (a) =>
      a.status === ContributorApplicationStatus.REJECTED && a.reapplyEligibleAt && a.reapplyEligibleAt.getTime() > now
  );

  const submit = async () => {
    const next: typeof errors = {};
    const organization = organizationClaim.trim();
    const experienceText = experience.trim();
    const cleanLinks = links.map((link) => link.trim()).filter((link) => link.length > 0);

    if (basis === 'ORGANIZATION_AFFILIATION' && organization.length < 2) {
      next.organization = 'Vui lòng ghi tên hoặc mô tả tổ chức (ít nhất 2 ký tự).';
    }
    if (experienceText.length < MIN_EXPERIENCE_LENGTH) {
      next.experience = `Vui lòng mô tả kinh nghiệm ít nhất ${MIN_EXPERIENCE_LENGTH} ký tự.`;
    }
    if (cleanLinks.length > MAX_REFERENCE_LINKS || cleanLinks.some((link) => !isValidUrl(link))) {
      next.links = `Mỗi liên kết phải là một đường link hợp lệ (tối đa ${MAX_REFERENCE_LINKS}).`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await submitMutation.mutateAsync({
        claimedApprovalBasis: basis,
        organizationClaim: basis === 'ORGANIZATION_AFFILIATION' ? organization : undefined,
        experience: experienceText,
        referenceLinks: cleanLinks,
      });
      setBasis('ORGANIZATION_AFFILIATION');
      setOrganizationClaim('');
      setExperience('');
      setLinks(['']);
      Alert.alert('Đã gửi', 'Nguyện vọng Contributor của bạn đã được ghi nhận, chờ Quản trị viên duyệt.');
    } catch (error) {
      Alert.alert('Không gửi được', getApiErrorMessage(error));
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BadgeCheck size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-foreground">
              Đăng nhập để đăng ký Người đóng góp
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

  const inputClass = 'h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground';

  let formBody: React.ReactNode;
  if (role === UserRole.CONTRIBUTOR) {
    formBody = (
      <View className="flex-row items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <CheckCircle2 size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-primary">Bạn đang là Người đóng góp (Contributor)</Text>
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Tài khoản của bạn đã được Quản trị viên kích hoạt toàn bộ quyền hạn đóng góp công thức, cẩm nang ẩm thực chay
            và xác thực nội dung cộng đồng.
          </Text>
        </View>
      </View>
    );
  } else if (role === UserRole.ADMIN) {
    formBody = (
      <Text className="text-sm text-muted-foreground">Tài khoản Quản trị viên không cần đăng ký làm Người đóng góp.</Text>
    );
  } else if (hasPending) {
    formBody = (
      <View className="rounded-xl border border-border bg-muted p-4">
        <Text className="text-sm font-medium text-foreground">Hồ sơ của bạn đang được xử lý</Text>
        <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Bạn đã có một đơn đăng ký đang ở trạng thái chờ duyệt. Vui lòng theo dõi kết quả thẩm định tại bảng lịch sử
          bên dưới thay vì gửi thêm đơn mới.
        </Text>
      </View>
    );
  } else if (cooling?.reapplyEligibleAt) {
    formBody = (
      <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Text className="text-sm font-medium text-amber-600">Chưa đến thời hạn nộp lại hồ sơ</Text>
        <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Hồ sơ trước của bạn chưa đủ điều kiện. Bạn có thể cập nhật thêm thông tin và gửi lại đơn xét duyệt từ ngày{' '}
          <Text className="font-bold text-foreground">{formatDate(cooling.reapplyEligibleAt)}</Text>.
        </Text>
      </View>
    );
  } else {
    formBody = (
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Căn cứ đề xuất phê duyệt</Text>
          {BASIS_OPTIONS.map((option) => {
            const selected = basis === option.value;
            const Icon = option.icon;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setBasis(option.value)}
                className={cn(
                  'flex-row items-start gap-3 rounded-xl border p-3.5',
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-background'
                )}>
                <View
                  className={cn(
                    'mt-0.5 h-5 w-5 items-center justify-center rounded-full border',
                    selected ? 'border-primary' : 'border-input'
                  )}>
                  {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-1.5">
                    <Icon size={16} color={colors.primary} />
                    <Text className="flex-1 text-sm font-semibold text-foreground">{option.label}</Text>
                  </View>
                  <Text className="text-xs leading-relaxed text-muted-foreground">{option.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {basis === 'ORGANIZATION_AFFILIATION' ? (
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              Tên tổ chức / Hội đoàn liên kết <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              value={organizationClaim}
              onChangeText={setOrganizationClaim}
              placeholder="Ví dụ: Hội Đầu bếp Chay Việt Nam, Viện Ẩm thực..."
              placeholderTextColor={colors.mutedForeground}
              maxLength={500}
              className={inputClass}
            />
            {errors.organization ? <Text className="text-xs text-destructive">{errors.organization}</Text> : null}
          </View>
        ) : null}

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">
            Kinh nghiệm & Nguyện vọng đóng góp (tối thiểu {MIN_EXPERIENCE_LENGTH} ký tự)
          </Text>
          <TextInput
            value={experience}
            onChangeText={setExperience}
            placeholder="Mô tả hành trình thực hành ăn chay, kinh nghiệm xây dựng thực đơn hoặc chuyên môn dinh dưỡng của bạn..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={MAX_EXPERIENCE_LENGTH}
            textAlignVertical="top"
            className="min-h-32 rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground"
          />
          {errors.experience ? <Text className="text-xs text-destructive">{errors.experience}</Text> : null}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            Liên kết minh chứng tham khảo{' '}
            <Text className="font-normal text-muted-foreground">(tùy chọn, tối đa {MAX_REFERENCE_LINKS})</Text>
          </Text>
          {links.map((link, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <Link2 size={16} color={colors.mutedForeground} />
              <TextInput
                value={link}
                onChangeText={(value) => setLinks((prev) => prev.map((item, i) => (i === index ? value : item)))}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="url"
                className={`${inputClass} flex-1`}
              />
              {links.length > 1 ? (
                <Pressable
                  accessibilityLabel="Xóa liên kết"
                  onPress={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                  className="h-10 w-10 items-center justify-center rounded-full">
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {links.length < MAX_REFERENCE_LINKS ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLinks((prev) => [...prev, ''])}
              className="h-10 flex-row items-center gap-1.5 self-start rounded-xl border border-input bg-background px-3.5">
              <Plus size={16} color={colors.foreground} />
              <Text className="text-sm font-semibold text-foreground">Thêm liên kết</Text>
            </Pressable>
          ) : null}
          {errors.links ? <Text className="text-xs text-destructive">{errors.links}</Text> : null}
        </View>

        <PrimaryButton
          label={submitMutation.isPending ? 'Đang gửi đơn...' : 'Gửi đơn đăng ký Contributor'}
          loading={submitMutation.isPending}
          onPress={() => void submit()}
        />
      </View>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="gap-1 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">Đăng ký Người đóng góp (Contributor)</Text>
          <Text className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Hồ sơ sẽ được Quản trị viên thẩm định thủ công. Mọi Contributor được phê duyệt đều có quyền hạn đóng góp ngang
            nhau.
          </Text>
          {formBody}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Lịch sử đơn của bạn</Text>
          {isLoading ? (
            <View className="gap-3">
              {[1, 2].map((i) => (
                <View key={i} className="h-28 rounded-2xl border border-border bg-muted" />
              ))}
            </View>
          ) : isError ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-6">
              <Text className="text-center text-sm text-muted-foreground">
                Không tải được lịch sử đơn. Kiểm tra kết nối mạng và thử lại.
              </Text>
              <View className="mt-3 w-full">
                <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
              </View>
            </View>
          ) : applications.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox size={22} color={colors.mutedForeground} />
              </View>
              <Text className="mt-3 text-center text-base font-semibold text-foreground">Chưa có hồ sơ nào</Text>
              <Text className="mt-1 text-center text-sm leading-relaxed text-muted-foreground">
                Gửi đơn đầu tiên ở biểu mẫu bên trên để trở thành Người đóng góp cho cộng đồng.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {applications.map((item) => (
                <ApplicationCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
