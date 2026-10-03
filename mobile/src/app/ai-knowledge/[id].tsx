import * as React from 'react';
import { Share, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, History, Settings2, Share2, User } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ArtifactContent } from '@/features/ai-artifact/components/artifact-content';
import { AuthRequiredCard } from '@/features/ai-artifact/components/auth-required-card';
import { ShareArtifactSheet } from '@/features/ai-artifact/components/share-artifact-sheet';
import { VerificationBadge } from '@/features/ai-artifact/components/verification-badge';
import { usePublicAiArtifactsQuery } from '@/features/ai-artifact/queries/ai-artifact.queries';
import { getAiArtifactErrorMessage } from '@/features/ai-artifact/utils/ai-artifact-errors';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

const DISCLAIMER =
  'Thông tin do Trí tuệ Nhân tạo tổng hợp chỉ mang tính tham khảo, không thay thế chẩn đoán y khoa, phác đồ điều trị hay tư vấn của bác sĩ/chuyên gia dinh dưỡng. Hãy tham vấn chuyên gia y tế trước khi thay đổi lớn về chế độ ăn.';

/**
 * Chi tiết một tri thức AI công khai. Backend chưa có endpoint lấy theo id nên màn này tìm trong danh sách công khai
 * (giống `PublicArtifactView` của web); bản ghi đã thu hồi chia sẻ sẽ hiện "không khả dụng".
 */
export default function AiKnowledgeDetailScreen() {
  const colors = useIconColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const artifactId = typeof id === 'string' ? id : '';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, isLoading, isError, error, refetch } = usePublicAiArtifactsQuery({ limit: 50 });
  const [shareOpen, setShareOpen] = React.useState(false);

  const artifact = data?.items.find((item) => item.id === artifactId);

  const back = (
    <Link href={'/ai-knowledge' as Href} asChild>
      <PrimaryButton label="Về danh sách tri thức" variant="outline" icon={<ArrowLeft size={15} color={colors.foreground} />} />
    </Link>
  );

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        {isLoading ? (
          <LoadingState message="Đang tải tri thức AI..." />
        ) : isError && getApiErrorCode(error) === 'AUTH_REQUIRED' ? (
          <AuthRequiredCard />
        ) : isError ? (
          <ErrorState title="Không thể tải nội dung." description={getAiArtifactErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !artifact ? (
          <View className="gap-4">
            <EmptyState
              title="Liên kết không khả dụng"
              description="Tri thức AI này không tồn tại hoặc chủ sở hữu đã thu hồi quyền chia sẻ công khai."
            />
            {back}
          </View>
        ) : (
          <>
            <View className="gap-2.5">
              <View className="flex-row flex-wrap items-center gap-2">
                <View className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-[11px] font-semibold text-primary">{artifact.typeLabel}</Text>
                </View>
                <VerificationBadge verification={artifact.activeVerification} />
              </View>
              <Text className="text-2xl font-extrabold leading-tight text-foreground">{artifact.title}</Text>
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                <View className="flex-row items-center gap-1.5">
                  <User size={12} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">{artifact.authorName}</Text>
                </View>
                {artifact.createdAtLabel ? (
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={12} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">{artifact.createdAtLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <PrimaryButton
                label="Chia sẻ"
                variant="outline"
                className="h-10 px-4"
                icon={<Share2 size={14} color={colors.foreground} />}
                onPress={() => void Share.share({ title: artifact.title, message: `${artifact.title}\n\n${artifact.summary}`.trim() })}
              />
              {isAuthenticated ? (
                <PrimaryButton
                  label="Quản lý chia sẻ"
                  variant="outline"
                  className="h-10 px-4"
                  icon={<Settings2 size={14} color={colors.foreground} />}
                  onPress={() => setShareOpen(true)}
                />
              ) : null}
            </View>

            {artifact.summary.length > 0 ? (
              <View className="rounded-xl bg-muted/50 p-3.5">
                <Text className="text-sm leading-relaxed text-muted-foreground">{artifact.summary}</Text>
              </View>
            ) : null}

            <ArtifactContent content={artifact.content} />

            {artifact.activeVerification ? (
              <View className="gap-1.5 rounded-2xl border border-border bg-card p-3.5">
                <Text className="text-sm font-bold text-foreground">Ý kiến thẩm định</Text>
                <Text className="text-xs text-muted-foreground">
                  {artifact.activeVerification.reviewerName} ({artifact.activeVerification.reviewerRoleLabel}) ·{' '}
                  {artifact.activeVerification.conclusionLabel}
                </Text>
                {artifact.activeVerification.scope ? (
                  <Text className="text-xs leading-relaxed text-foreground">
                    <Text className="font-semibold">Phạm vi: </Text>
                    {artifact.activeVerification.scope}
                  </Text>
                ) : null}
                {artifact.activeVerification.evidenceNote ? (
                  <Text className="text-xs leading-relaxed text-foreground">
                    <Text className="font-semibold">Ghi chú: </Text>
                    {artifact.activeVerification.evidenceNote}
                  </Text>
                ) : null}
                {artifact.activeVerification.correction ? (
                  <View className="rounded-lg bg-muted/70 p-2.5">
                    <Text className="text-xs leading-relaxed text-foreground">
                      <Text className="font-semibold text-primary">Chỉnh lý đề xuất: </Text>
                      {artifact.activeVerification.correction}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <Text className="text-xs font-semibold text-amber-900">Khuyến cáo miễn trừ trách nhiệm dinh dưỡng &amp; y tế</Text>
              <Text className="mt-1 text-xs leading-relaxed text-amber-800">{DISCLAIMER}</Text>
            </View>

            {artifact.verificationHistory.length > 0 ? (
              <View className="gap-2 rounded-2xl border border-border p-3.5">
                <View className="flex-row items-center gap-2">
                  <History size={14} color={colors.mutedForeground} />
                  <Text className="text-xs font-semibold text-muted-foreground">Lịch sử thẩm định</Text>
                </View>
                {artifact.verificationHistory.map((item, index) => (
                  <View key={item.id || index} className="flex-row items-center justify-between gap-2 border-b border-border pb-1.5">
                    <Text className="flex-1 text-xs text-foreground">
                      <Text className="font-semibold">{item.conclusionLabel}</Text> bởi {item.reviewerName}
                    </Text>
                    <Text className="text-[11px] text-muted-foreground">
                      {item.status === 'ACTIVE' ? 'Đang hiệu lực' : item.status === 'REVOKED' ? 'Đã thu hồi' : 'Đã thay thế'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {back}

            <ShareArtifactSheet artifact={artifact} visible={shareOpen} onClose={() => setShareOpen(false)} />
          </>
        )}
      </View>
    </SiteScreen>
  );
}
