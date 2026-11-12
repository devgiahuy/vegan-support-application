import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, ChevronDown, Info, MapPinOff } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { DiscoveryNotice } from '../types/restaurant.model';

const SUMMARY_LABELS: Record<DiscoveryNotice['kind'], string> = {
  UNAVAILABLE: 'Một phần dữ liệu bản đồ chưa tải được',
  SUPPRESSED: 'Bộ lọc đang giới hạn nguồn kết quả',
  TRUNCATED: 'Kết quả có giới hạn từ nhà cung cấp',
  ATTRIBUTION: 'Thông tin nguồn dữ liệu và lưu ý',
  STALE: 'Một số thông tin có thể đã thay đổi',
  PRIVACY: 'Thông tin quyền riêng tư',
};

/**
 * Thông báo nguồn dữ liệu/giới hạn kết quả — đồng bộ `ResultNotice` của web: một dòng tóm tắt thu gọn được, mở ra thấy từng
 * thông báo. Chỉ có thông báo quyền riêng tư thì hiện thành một dòng chữ nhỏ.
 */
export function ResultNotice({ notices }: { notices: DiscoveryNotice[] }) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);
  if (notices.length === 0) return null;

  const privacy = notices.find((notice) => notice.kind === 'PRIVACY');
  const sourceNotices = notices.filter((notice) => notice.kind !== 'PRIVACY');
  const summary = sourceNotices.find((notice) => notice.tone === 'warning') ?? sourceNotices[0];

  if (!summary) {
    return privacy ? (
      <View className="flex-row items-start gap-1.5">
        <MapPinOff size={14} color={colors.mutedForeground} />
        <Text className="flex-1 text-xs leading-5 text-muted-foreground">{privacy.message}</Text>
      </View>
    ) : null;
  }

  return (
    <View className="rounded-xl border border-border bg-muted/30">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thông tin nguồn dữ liệu và lưu ý"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((previous) => !previous)}
        className="min-h-11 flex-row items-center justify-between gap-3 px-3 py-2">
        <View className="min-w-0 flex-1 flex-row items-start gap-2">
          <Info size={16} color={colors.primary} />
          <Text className="flex-1 text-xs leading-5 text-foreground">{SUMMARY_LABELS[summary.kind]}</Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={colors.mutedForeground} />
        </View>
      </Pressable>
      {open ? (
        <View accessibilityRole="summary" className="gap-2 border-t border-border px-3 py-3">
          {notices.map((notice) => (
            <View key={notice.kind} className="flex-row items-start gap-2 rounded-xl bg-background p-3">
              {notice.tone === 'warning' ? <AlertTriangle size={15} color={colors.warning} /> : <Info size={15} color={colors.mutedForeground} />}
              <Text className="flex-1 text-xs leading-5 text-foreground">{notice.message}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
