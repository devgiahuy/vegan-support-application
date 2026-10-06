import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight, Dumbbell, Pill, Scale, Soup, Sparkles, type LucideIcon } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';

const SUGGESTED_PROMPTS: { icon: LucideIcon; category: string; title: string; prompt: string }[] = [
  {
    icon: Dumbbell,
    category: 'Đạm thực vật',
    title: 'Thực đơn thể thao giàu đạm',
    prompt: 'Gợi ý thực đơn chay giàu protein cho người tập gym trong 1 ngày, cần đạt khoảng 70g đạm từ thực vật.',
  },
  {
    icon: Soup,
    category: 'Món ngon thuần Việt',
    title: 'Nước dùng phở nấm thanh ngọt',
    prompt:
      'Hướng dẫn cách nấu nước dùng phở nấm chay thanh ngọt tự nhiên chuẩn vị Bắc không dùng bột ngọt hay hạt nêm công nghiệp.',
  },
  {
    icon: Pill,
    category: 'Vi chất & Sức khỏe',
    title: 'Bổ sung B12, Sắt & Kẽm',
    prompt: 'Người mới chuyển sang ăn chay cần lưu ý bổ sung Vitamin B12, Sắt và Kẽm từ những nguồn thực phẩm tự nhiên nào?',
  },
  {
    icon: Scale,
    category: 'Cân bằng Calo',
    title: 'Bữa trưa thuần chay 500 kcal',
    prompt: 'Tính toán định lượng và calo cho một bữa trưa văn phòng thuần chay đủ no, cân đối khoảng 500 kcal.',
  },
];

/** Màn chào của trợ lý với 4 gợi ý câu hỏi — đồng bộ `ChatWelcome` của web. */
export function ChatWelcome({ onSelectPrompt, disabled }: { onSelectPrompt: (prompt: string) => void; disabled?: boolean }) {
  const colors = useIconColors();
  return (
    <View className="items-center px-1 py-3">
      <View className="flex-row items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <Sparkles size={13} color={colors.primary} />
        <Text className="text-xs font-semibold text-primary">Trợ lý Dinh dưỡng Thực vật VeggieConnect</Text>
      </View>
      <Text className="mt-3 text-center text-2xl font-bold leading-tight text-foreground">
        Hôm nay bạn muốn nấu hoặc tìm hiểu món gì?
      </Text>
      <Text className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        Tôi có thể giúp bạn giải đáp về giá trị dinh dưỡng, công thức món chay chuẩn Việt và cân đối calo theo thể trạng.
      </Text>

      <View className="mt-5 w-full gap-2.5">
        {SUGGESTED_PROMPTS.map((item) => (
          <Pressable
            key={item.title}
            disabled={disabled}
            onPress={() => onSelectPrompt(item.prompt)}
            className="rounded-2xl border border-border bg-card p-3.5 active:bg-muted/60">
            <View className="flex-row items-start justify-between gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <item.icon size={16} color={colors.primary} />
              </View>
              <ArrowUpRight size={16} color={colors.mutedForeground} />
            </View>
            <Text className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary">{item.category}</Text>
            <Text className="mt-0.5 text-sm font-semibold text-foreground">{item.title}</Text>
            <Text numberOfLines={2} className="mt-1 text-xs text-muted-foreground">
              {item.prompt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
