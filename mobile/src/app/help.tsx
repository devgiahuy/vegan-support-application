import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { BookOpen, Bot, Calendar, ChevronDown, HelpCircle, Mail, MapPin, type LucideIcon } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { StaticHero } from '@/components/shared/static-page';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const GUIDES: { icon: LucideIcon; title: string; description: string; href: string }[] = [
  { icon: BookOpen, title: 'Công thức & món', description: 'Tìm kiếm và lưu món ăn yêu thích', href: '/recipes' },
  { icon: Calendar, title: 'Kế hoạch tuần', description: 'Lập và theo dõi dinh dưỡng thực đơn 7 ngày', href: '/meal-plans' },
  { icon: MapPin, title: 'Bản đồ quán chay', description: 'Khám phá quán ngon và đề xuất quán mới', href: '/restaurants' },
  { icon: Bot, title: 'Trợ lý AI', description: 'Đặt câu hỏi tư vấn ăn chay', href: '/assistant' },
];

const FAQ_ITEMS = [
  {
    q: 'VeggieConnect phân biệt các trường phái ăn chay như thế nào?',
    a: 'Hệ thống hỗ trợ phân loại: Thuần chay (Vegan - 100% thực vật) và Ăn chay có trứng sữa (Lacto-ovo vegetarian), cùng các truyền thống ăn chay như Phật giáo, Kitô giáo. Khi tìm món hoặc quán chay, bạn có thể lọc theo chế độ ăn của mình.',
  },
  {
    q: 'Chỉ số dinh dưỡng trên món ăn được tính như thế nào?',
    a: 'Dữ liệu dinh dưỡng được ước tính dựa trên cơ sở dữ liệu thực phẩm tham chiếu, có tính đến hao hụt khi nấu nướng (chiên, luộc, hấp). Đây là số liệu ước tính để tham khảo cho kế hoạch ăn uống hằng ngày, kèm độ tin cậy khi có.',
  },
  {
    q: 'Làm thế nào để tìm quán chay gần vị trí của tôi?',
    a: 'Vào mục "Quán chay", cho phép ứng dụng dùng vị trí GPS hoặc nhập địa chỉ khu vực bạn đang ở. Hệ thống sẽ hiển thị danh sách quán chay lân cận kèm khoảng cách.',
  },
  {
    q: 'Tôi có thể chia sẻ công thức món chay của mình không?',
    a: 'Được. Bạn đăng nhập rồi gửi công thức tại mục "Món chay" → "Đăng công thức". Công thức sẽ được kiểm duyệt trước khi hiển thị cho cộng đồng.',
  },
  {
    q: 'Trợ lý AI của VeggieConnect có thể giúp tôi những gì?',
    a: 'Trợ lý AI gợi ý thực đơn chay, giải đáp thắc mắc về dinh dưỡng thực vật và kết hợp món ăn. Nội dung chỉ mang tính tham khảo, không thay thế tư vấn y tế.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable onPress={() => setOpen((value) => !value)} className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-sm font-semibold leading-snug text-foreground">{question}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={colors.mutedForeground} />
        </View>
      </View>
      {open ? <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer}</Text> : null}
    </Pressable>
  );
}

/** Trung tâm trợ giúp — đồng bộ `/help` của web: lối tắt hướng dẫn, FAQ và liên hệ thêm. */
export default function HelpScreen() {
  const colors = useIconColors();
  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          centered
          badge="Hỗ trợ người dùng"
          badgeIcon={HelpCircle}
          title="Trung tâm trợ giúp"
          subtitle="Câu trả lời cho các câu hỏi thường gặp và hướng dẫn nhanh các tính năng trên VeggieConnect."
        />

        <View className="flex-row flex-wrap gap-3">
          {GUIDES.map((guide) => (
            <Link key={guide.title} href={guide.href as Href} asChild>
              <Pressable className="min-w-[46%] flex-1 items-center gap-1.5 rounded-2xl border border-border bg-card p-4 active:bg-muted">
                <guide.icon size={24} color={colors.primary} />
                <Text className="text-center text-sm font-semibold text-foreground">{guide.title}</Text>
                <Text className="text-center text-xs text-muted-foreground">{guide.description}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Câu hỏi thường gặp (FAQ)</Text>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </View>

        <View className={cn('gap-3 rounded-2xl border border-border bg-muted/30 p-5')}>
          <Text className="text-base font-bold text-foreground">Vẫn chưa tìm thấy câu trả lời?</Text>
          <Text className="text-sm text-muted-foreground">Đội ngũ hỗ trợ luôn sẵn sàng lắng nghe và giải đáp.</Text>
          <Link href={'/contact' as Href} asChild>
            <PrimaryButton label="Gửi liên hệ hỗ trợ" icon={<Mail size={15} color={colors.primaryForeground} />} />
          </Link>
        </View>
      </View>
    </SiteScreen>
  );
}
