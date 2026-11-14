import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Bookmark, Compass, Lock, MessageSquare, Search, ShieldCheck, Sparkles } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { usePersonalizationConsentQuery } from '../queries/recommendation.queries';
import type { RecommendationMeta } from '../types/recommendation.model';

interface WhyRecommendedSheetProps {
  meta: RecommendationMeta | undefined;
  onClose: () => void;
}

/**
 * "Vì sao tôi thấy gợi ý này?" — đồng bộ `WhyRecommendedDialog` của web nhưng chỉ nêu thông tin thật:
 * trạng thái cá nhân hóa và ràng buộc backend đã áp dụng, không dùng số liệu minh họa.
 */
export function WhyRecommendedSheet({ meta, onClose }: WhyRecommendedSheetProps) {
  const colors = useIconColors();
  const consent = usePersonalizationConsentQuery();
  const behaviorOn = Boolean(consent.data?.enabled);

  const signals = [
    {
      icon: Compass,
      title: 'Chế độ ăn và dị ứng của bạn',
      body: meta?.constraintsSummary
        ? `${meta.constraintsSummary}. Đây là ràng buộc cứng do hệ thống áp dụng, món vi phạm sẽ bị loại trước khi xếp hạng.`
        : 'Trường phái ăn chay, nguyên liệu kiêng và dị ứng trong hồ sơ là ràng buộc cứng: món vi phạm sẽ bị loại trước khi xếp hạng.',
    },
    {
      icon: Search,
      title: 'Từ khóa bạn đã tìm',
      body: behaviorOn ? 'Đang được dùng để ưu tiên món cùng chủ đề (chỉ sắp xếp lại, không đưa lại món bị loại).' : 'Không dùng vì bạn đang tắt cá nhân hóa.',
    },
    {
      icon: Bookmark,
      title: 'Món bạn xem, lưu và đánh giá',
      body: behaviorOn ? 'Đang được dùng để ưu tiên các món tương tự.' : 'Không dùng vì bạn đang tắt cá nhân hóa.',
    },
    {
      icon: MessageSquare,
      title: 'Chủ đề trao đổi với Trợ lý AI',
      body: behaviorOn ? 'Chỉ ghi nhận mã chủ đề, không lưu nội dung hội thoại.' : 'Không dùng vì bạn đang tắt cá nhân hóa.',
    },
  ];

  return (
    <FormSheet title="Vì sao tôi thấy gợi ý này?" onClose={onClose}>
      <View className="gap-4 pb-4">
        <View className="flex-row items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <Sparkles size={16} color={colors.primary} />
          <Text className="flex-1 text-xs leading-5 text-foreground">
            {meta?.personalized
              ? 'Danh sách này được cá nhân hóa cho bạn. Hành vi chỉ làm thay đổi thứ tự, không bao giờ đưa lại món đã bị loại bởi chế độ ăn hay dị ứng.'
              : 'Hiện đây là gợi ý phổ biến cho mọi người. Bật cá nhân hóa trong Hồ sơ để thứ tự phù hợp hơn với bạn.'}
          </Text>
        </View>

        <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Căn cứ gợi ý</Text>
        {signals.map(({ icon: Icon, title, body }) => (
          <View key={title} className="flex-row items-start gap-3 rounded-2xl border border-border bg-muted/30 p-3">
            <Icon size={16} color={colors.primary} />
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-semibold text-foreground">{title}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">{body}</Text>
            </View>
          </View>
        ))}

        <View className="gap-1.5 rounded-2xl border border-border bg-muted/40 p-3.5">
          <View className="flex-row items-center gap-1.5">
            <Lock size={14} color={colors.primary} />
            <Text className="text-xs font-semibold text-foreground">Quyền riêng tư dữ liệu cá nhân</Text>
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            Dữ liệu hành vi chỉ dùng để tối ưu gợi ý trong ứng dụng. Bạn có thể tắt cá nhân hóa hoặc xóa lịch sử hành vi bất cứ lúc nào ở Hồ sơ.
          </Text>
        </View>
        {meta?.scoringVersion ? (
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={12} color={colors.mutedForeground} />
            <Text className="text-[11px] text-muted-foreground">Phiên bản chấm điểm: {meta.scoringVersion}</Text>
          </View>
        ) : null}

        <Link href={'/profile' as Href} asChild>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="flex-row items-center justify-center gap-1.5 rounded-xl border border-border py-3">
            <Text className="text-sm font-semibold text-foreground">Quản lý cài đặt cá nhân hóa</Text>
            <ArrowRight size={14} color={colors.foreground} />
          </Pressable>
        </Link>
        <PrimaryButton label="Đã hiểu" onPress={onClose} />
      </View>
    </FormSheet>
  );
}
