import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { BadgeCheck, CheckCircle2, Clock, Send, XCircle } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useMyContributorApplicationsQuery,
  useSubmitContributorApplicationMutation,
} from '@/features/contributor/queries/contributor.queries';
import type { ContributorApplicationDetail } from '@/features/contributor/types/contributor.model';
import { ContributorApplicationStatus } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

type Basis = 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';

const BASIS_OPTIONS: { value: Basis; label: string }[] = [
  { value: 'ORGANIZATION_AFFILIATION', label: 'Có tổ chức/đơn vị liên kết' },
  { value: 'PLATFORM_TRACK_RECORD', label: 'Kinh nghiệm thực hành cá nhân' },
];

function StatusBadge({ status, colors }: { status: ContributorApplicationStatus; colors: ReturnType<typeof useIconColors> }) {
  if (status === ContributorApplicationStatus.APPROVED) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
        <CheckCircle2 size={12} color={colors.primary} />
        <Text className="text-xs font-semibold text-primary">Đã duyệt</Text>
      </View>
    );
  }
  if (status === ContributorApplicationStatus.REJECTED) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1">
        <XCircle size={12} color={colors.destructive} />
        <Text className="text-xs font-semibold text-destructive">Từ chối</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-cta/15 px-2.5 py-1">
      <Clock size={12} color={colors.cta} />
      <Text className="text-xs font-semibold text-cta">Đang chờ duyệt</Text>
    </View>
  );
}

function ApplicationCard({ item, colors }: { item: ContributorApplicationDetail; colors: ReturnType<typeof useIconColors> }) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-bold text-foreground">{item.claimedApprovalBasisLabel}</Text>
        <StatusBadge status={item.status} colors={colors} />
      </View>
      {item.organizationClaim ? (
        <Text className="text-xs text-muted-foreground">Tổ chức: {item.organizationClaim}</Text>
      ) : null}
      <Text numberOfLines={3} className="text-xs leading-relaxed text-muted-foreground">
        {item.experience}
      </Text>
      {item.status === ContributorApplicationStatus.APPROVED && item.approvalBasisLabel ? (
        <Text className="text-xs font-medium text-primary">Căn cứ duyệt: {item.approvalBasisLabel}</Text>
      ) : null}
      {item.status === ContributorApplicationStatus.REJECTED && item.reviewNote ? (
        <View className="rounded-xl bg-destructive/5 p-2.5">
          <Text className="text-xs text-destructive">Lý do: {item.reviewNote}</Text>
        </View>
      ) : null}
      {item.status === ContributorApplicationStatus.REJECTED && item.reapplyEligibleAt ? (
        <Text className="text-xs text-muted-foreground">
          Có thể nộp lại từ: {formatDate(item.reapplyEligibleAt)}
        </Text>
      ) : null}
      {item.createdAt ? (
        <Text className="text-[11px] text-muted-foreground">Gửi lúc {formatDate(item.createdAt)}</Text>
      ) : null}
    </View>
  );
}

/**
 * Trạng thái nguyện vọng Contributor — `GET /contributor-applications/me`. Cho phép
 * gửi nguyện vọng mới (`POST /contributor-applications`) khi Member chưa có đơn đang
 * chờ duyệt. Chỉ hiển thị/thu thập nguyện vọng — không tự cấp quyền (BL-01).
 */
export default function ContributorStatusScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: pagination, isLoading, isError, refetch } = useMyContributorApplicationsQuery({ limit: 50 });
  const submitMutation = useSubmitContributorApplicationMutation();
  const applications = pagination?.items ?? [];
  const hasPending = applications.some((a) => a.status === ContributorApplicationStatus.PENDING);

  const [showForm, setShowForm] = React.useState(false);
  const [basis, setBasis] = React.useState<Basis | null>(null);
  const [organizationClaim, setOrganizationClaim] = React.useState('');
  const [experience, setExperience] = React.useState('');
  const [referenceLinks, setReferenceLinks] = React.useState('');

  const resetForm = () => {
    setBasis(null);
    setOrganizationClaim('');
    setExperience('');
    setReferenceLinks('');
    setShowForm(false);
  };

  const submit = async () => {
    if (!basis) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn căn cứ nguyện vọng.');
      return;
    }
    if (basis === 'ORGANIZATION_AFFILIATION' && organizationClaim.trim().length < 2) {
      Alert.alert('Thiếu thông tin', 'Vui lòng ghi tên hoặc mô tả tổ chức (ít nhất 2 ký tự).');
      return;
    }
    if (experience.trim().length < 20) {
      Alert.alert('Thiếu thông tin', 'Vui lòng mô tả kinh nghiệm ít nhất 20 ký tự.');
      return;
    }
    const links = referenceLinks
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (links.length > 5 || links.some((l) => { try { new URL(l); return false; } catch { return true; } })) {
      Alert.alert('Link không hợp lệ', 'Mỗi dòng phải là một đường link hợp lệ (tối đa 5 link).');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        claimedApprovalBasis: basis,
        organizationClaim: basis === 'ORGANIZATION_AFFILIATION' ? organizationClaim.trim() : undefined,
        experience: experience.trim(),
        referenceLinks: links,
      });
      resetForm();
      Alert.alert('Đã gửi', 'Nguyện vọng Contributor của bạn đã được ghi nhận, chờ Admin duyệt.');
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
              Đăng nhập để xem nguyện vọng Contributor
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
      <View className="gap-4 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Nguyện vọng Contributor</Text>
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Tài khoản của bạn vẫn là Member cho tới khi được Admin duyệt. Mọi Contributor đã duyệt có
            cùng quyền hạn như nhau, không phân cấp theo căn cứ duyệt.
          </Text>
        </View>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2].map((i) => (
              <View key={i} className="h-28 rounded-2xl border border-border bg-muted" />
            ))}
          </View>
        ) : isError ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              Không tải được nguyện vọng. Kiểm tra kết nối mạng và thử lại.
            </Text>
            <View className="mt-3 w-full">
              <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            {applications.map((item) => (
              <ApplicationCard key={item.id} item={item} colors={colors} />
            ))}
          </View>
        )}

        {!isLoading && !isError && !hasPending ? (
          showForm ? (
            <View className="gap-3 rounded-2xl border border-dashed border-border p-4">
              <Text className="text-sm font-bold text-foreground">Gửi nguyện vọng mới</Text>

              <View className="gap-2">
                {BASIS_OPTIONS.map((option) => {
                  const selected = basis === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setBasis(option.value);
                        if (option.value !== 'ORGANIZATION_AFFILIATION') setOrganizationClaim('');
                      }}
                      className={cn(
                        'rounded-xl border px-3.5 py-3',
                        selected ? 'border-primary bg-primary/10' : 'border-input bg-background'
                      )}>
                      <Text className={cn('text-sm', selected ? 'font-semibold text-primary' : 'text-foreground')}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {basis === 'ORGANIZATION_AFFILIATION' ? (
                <TextInput
                  value={organizationClaim}
                  onChangeText={setOrganizationClaim}
                  placeholder="Tên/mô tả tổ chức"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={500}
                  className="rounded-xl border border-input bg-background p-3 text-sm text-foreground"
                />
              ) : null}

              <TextInput
                value={experience}
                onChangeText={setExperience}
                placeholder="Mô tả kinh nghiệm của bạn (ít nhất 20 ký tự)"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                maxLength={2000}
                className="min-h-20 rounded-xl border border-input bg-background p-3 text-sm text-foreground"
                textAlignVertical="top"
              />

              <TextInput
                value={referenceLinks}
                onChangeText={setReferenceLinks}
                placeholder={'Link tham khảo (không bắt buộc), mỗi dòng 1 link'}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={2}
                autoCapitalize="none"
                keyboardType="url"
                className="min-h-14 rounded-xl border border-input bg-background p-3 text-sm text-foreground"
                textAlignVertical="top"
              />

              <View className="flex-row gap-2">
                <PrimaryButton label="Huỷ" variant="outline" onPress={resetForm} className="flex-1" />
                <PrimaryButton
                  label={submitMutation.isPending ? 'Đang gửi...' : 'Gửi nguyện vọng'}
                  loading={submitMutation.isPending}
                  icon={<Send size={16} color={colors.primaryForeground} />}
                  onPress={() => void submit()}
                  className="flex-1"
                />
              </View>
            </View>
          ) : (
            <PrimaryButton
              label={applications.length > 0 ? 'Gửi nguyện vọng mới' : 'Gửi nguyện vọng Contributor'}
              icon={<Send size={16} color={colors.primaryForeground} />}
              onPress={() => setShowForm(true)}
            />
          )
        ) : null}
      </View>
    </SiteScreen>
  );
}
