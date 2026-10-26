import * as React from 'react';
import { Text, View } from 'react-native';
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  HardDrive,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  UserRound,
  Video as VideoIcon,
  type LucideIcon,
} from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useStorageAccountQuery } from '../queries/storage.queries';
import { formatBytes } from '../mappers/storage.mapper';
import { storageErrorMessage } from '../lib/storage-errors';

/** Mức dùng dung lượng quyết định màu icon, số %, thanh tiến trình và banner (xanh → vàng → đỏ) — đồng bộ web. */
const TONES = {
  ok: {
    iconBox: 'bg-emerald-100 dark:bg-emerald-950/50',
    percent: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  warning: {
    iconBox: 'bg-amber-100 dark:bg-amber-950/50',
    percent: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  critical: {
    iconBox: 'bg-rose-100 dark:bg-rose-950/50',
    percent: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
} as const;

function Stat({ label, value, align }: { label: string; value: string; align: 'left' | 'center' | 'right' }) {
  return (
    <View className={cn('flex-1', align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start')}>
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="mt-0.5 text-xs font-semibold text-foreground">{value}</Text>
    </View>
  );
}

function ResourceCard({
  icon: Icon,
  iconColor,
  titleClass,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  iconColor: string;
  titleClass: string;
  title: string;
  description: string;
  bullets: React.ReactNode[];
}) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          <Icon size={20} color={iconColor} />
          <Text className={cn('text-base font-semibold', titleClass)}>{title}</Text>
        </View>
        <Text className="text-xs text-muted-foreground">{description}</Text>
      </View>
      <View className="gap-1.5">
        {bullets.map((bullet, index) => (
          <Text key={index} className="text-xs leading-5 text-muted-foreground">
            • {bullet}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  const colors = useIconColors();
  return (
    <View className="flex-row items-start gap-2">
      <View className="mt-0.5">
        <CircleHelp size={16} color={colors.primary} />
      </View>
      <Text className="flex-1 text-xs leading-5 text-muted-foreground">{children}</Text>
    </View>
  );
}

/**
 * Tab "Lưu trữ" ở Hồ sơ — đồng bộ `ProfileStorageTab` của web: hạn ngạch (số %, thanh tiến trình, banner trạng thái),
 * giới hạn từng loại tệp và mẹo tiết kiệm dung lượng.
 */
export function StorageSection() {
  const query = useStorageAccountQuery();
  const colors = useIconColors();
  if (query.isLoading) return <LoadingState message="Đang tải dung lượng..." />;
  if (query.isError)
    return (
      <ErrorState
        title="Không tải được dung lượng"
        description={storageErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data) return null;
  const { usage, policyName } = query.data;
  const tone = TONES[usage.critical ? 'critical' : usage.warning ? 'warning' : 'ok'];
  const iconColor = usage.critical ? colors.destructive : usage.warning ? colors.warning : colors.primary;

  return (
    <View className="gap-4 py-5">
      <View className="gap-4 rounded-xl border border-border bg-card p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-2.5">
            <View className={cn('rounded-lg p-2', tone.iconBox)}>
              <HardDrive size={20} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Hạn ngạch lưu trữ</Text>
              <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
                Chính sách áp dụng: {policyName || 'Mặc định'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className={cn('text-lg font-bold', tone.percent)}>{Math.round(usage.occupiedPercent)}%</Text>
            <Text className="text-xs text-muted-foreground">Đã sử dụng</Text>
          </View>
        </View>

        <View className="gap-2">
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Dung lượng đã dùng và đang giữ"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(usage.occupiedPercent) }}
            className="h-2.5 overflow-hidden rounded-full bg-muted">
            <View className={cn('h-full rounded-full', tone.bar)} style={{ width: `${usage.occupiedPercent}%` }} />
          </View>
          <View className="flex-row">
            <Stat label="Đã dùng" value={formatBytes(usage.usedBytes)} align="left" />
            <Stat label="Còn trống" value={formatBytes(usage.remainingBytes)} align="center" />
            <Stat label="Hạn mức" value={formatBytes(usage.limitBytes)} align="right" />
          </View>
          {usage.reservedBytes > 0 ? (
            <Text className="text-xs text-muted-foreground">
              Đang giữ chỗ cho tệp đang tải lên: {formatBytes(usage.reservedBytes)}
            </Text>
          ) : null}
        </View>

        {usage.critical ? (
          <View className="flex-row items-start gap-2.5 rounded-lg border border-rose-300 bg-rose-50 p-3 dark:border-rose-900/60 dark:bg-rose-950/30">
            <CircleAlert size={16} color={colors.destructive} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-rose-800 dark:text-rose-200">Dung lượng đã đạt hạn mức tối đa</Text>
              <Text className="text-xs leading-5 text-rose-800 dark:text-rose-200">
                {usage.overQuota
                  ? 'Tài khoản của bạn đã vượt quá giới hạn lưu trữ. Vui lòng xóa bớt ảnh hoặc video không còn sử dụng để tiếp tục tải lên.'
                  : 'Bạn đã dùng hết 100% dung lượng khả dụng. Không thể tải thêm file mới.'}
              </Text>
            </View>
          </View>
        ) : usage.warning ? (
          <View className="flex-row items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <TriangleAlert size={16} color={colors.warning} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-amber-800 dark:text-amber-200">Dung lượng sắp đầy</Text>
              <Text className="text-xs leading-5 text-amber-800 dark:text-amber-200">
                Bạn đã sử dụng hơn {usage.warningPercent}% dung lượng tài khoản. Hãy chủ động quản lý các tệp tin để
                tránh gián đoạn trải nghiệm.
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-2.5 dark:border-emerald-800/30 dark:bg-emerald-950/20">
            <CircleCheck size={16} color={colors.primary} />
            <Text className="flex-1 text-xs text-emerald-600 dark:text-emerald-400">
              Dung lượng lưu trữ của bạn đang trong trạng thái tối ưu.
            </Text>
          </View>
        )}

        <PrimaryButton
          label="Cập nhật dung lượng"
          variant="outline"
          loading={query.isFetching}
          className="h-10"
          icon={<RefreshCw size={16} color={colors.primary} />}
          onPress={() => void query.refetch()}
        />
      </View>

      <ResourceCard
        icon={UserRound}
        iconColor={colors.primary}
        titleClass="text-primary"
        title="Ảnh đại diện"
        description="Ảnh cá nhân hiển thị trên hồ sơ và bình luận"
        bullets={[
          <>
            Dung lượng tối đa: <Text className="font-bold text-foreground">10 MB</Text> / tệp
          </>,
          'Định dạng: JPEG, PNG, WebP, AVIF',
          'Tự động tối ưu hoá kích thước khi hiển thị',
        ]}
      />
      <ResourceCard
        icon={ImageIcon}
        iconColor={colors.primary}
        titleClass="text-emerald-600 dark:text-emerald-400"
        title="Ảnh bài viết & công thức"
        description="Ảnh minh họa món ăn và câu chuyện chia sẻ"
        bullets={[
          <>
            Dung lượng tối đa: <Text className="font-bold text-foreground">10 MB</Text> / ảnh
          </>,
          'Định dạng: JPEG, PNG, WebP, AVIF',
          'Khuyến khích ảnh tỉ lệ 16:9 hoặc 4:3',
        ]}
      />
      <ResourceCard
        icon={VideoIcon}
        iconColor={colors.info}
        titleClass="text-indigo-600 dark:text-indigo-400"
        title="Video nấu ăn"
        description="Video ngắn hướng dẫn thực hiện món chay"
        bullets={[
          <>
            Dung lượng tối đa: <Text className="font-bold text-foreground">250 MB</Text> / video
          </>,
          'Định dạng: MP4, WebM, QuickTime MOV',
          'Thời lượng lý tưởng: từ 30 giây đến 3 phút',
        ]}
      />

      <View className="gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color={colors.warning} />
          <Text className="text-sm font-semibold text-foreground">Mẹo tiết kiệm dung lượng lưu trữ</Text>
        </View>
        <Tip>
          <Text className="font-bold text-foreground">Dọn dẹp bài viết cũ:</Text> Khi bạn xóa một bài viết hoặc công
          thức nấu ăn, các ảnh/video liên kết sẽ có thể được xóa an toàn khỏi hệ thống để giải phóng dung lượng.
        </Tip>
        <Tip>
          <Text className="font-bold text-foreground">Ưu tiên ảnh định dạng WebP:</Text> Định dạng WebP có dung lượng
          nhẹ hơn 30-50% so với JPEG/PNG thông thường với chất lượng tương đương.
        </Tip>
        <Tip>
          <Text className="font-bold text-foreground">Chính sách hạn mức:</Text> Mỗi thành viên được cấp mặc định{' '}
          <Text className="font-bold text-foreground">1.00 GB</Text> dung lượng lưu trữ đám mây tốc độ cao hoàn toàn miễn
          phí.
        </Tip>
      </View>
    </View>
  );
}
