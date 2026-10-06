import { View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Heart, Leaf, ShieldCheck, Sprout, Target, Users } from 'lucide-react-native';
import { Text } from 'react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { IconCard, StaticHero } from '@/components/shared/static-page';
import { PrimaryButton } from '@/components/ui/primary-button';

/** Giới thiệu VeggieConnect — đồng bộ `/about` của web (sứ mệnh, tầm nhìn, giá trị cốt lõi, lời kêu gọi). */
export default function AboutScreen() {
  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          centered
          badge="Đồng hành cùng lối sống xanh"
          badgeIcon={Sprout}
          title="Về VeggieConnect"
          subtitle="Nền tảng hỗ trợ lối sống ăn chay thông minh, khoa học và kết nối cộng đồng thực vật tại Việt Nam."
        />

        <IconCard
          tone="solid"
          icon={Target}
          title="Sứ mệnh của chúng tôi"
          description="Giúp việc ăn chay trở nên dễ dàng, đủ chất dinh dưỡng và vui vẻ cho tất cả mọi người. Chúng tôi loại bỏ rào cản thiếu thông tin, lo âu thiếu chất thông qua công nghệ phân tích dinh dưỡng và gợi ý thực đơn cá nhân hóa."
        />
        <IconCard
          tone="solid"
          icon={Heart}
          title="Tầm nhìn bền vững"
          description="Xây dựng một hệ sinh thái kết nối người ăn chay, chuyên gia dinh dưỡng, các nhà hàng chay và nông trại xanh, hướng tới một xã hội khỏe mạnh và một hành tinh xanh hơn."
        />

        <View className="gap-3">
          <Text className="text-center text-xl font-bold text-foreground">Giá trị cốt lõi</Text>
          <IconCard
            icon={Leaf}
            title="100% thuần thực vật"
            description="Công thức, món ăn và địa điểm được chọn lọc, minh bạch về trường phái ăn chay."
          />
          <IconCard
            icon={ShieldCheck}
            title="Dinh dưỡng khoa học"
            description="Dữ liệu dinh dưỡng đối chiếu theo nguồn tham chiếu có ghi rõ xuất xứ, không đưa ra lời khuyên y tế võ đoán."
          />
          <IconCard
            icon={Users}
            title="Cộng đồng sẻ chia"
            description="Khuyến khích thành viên cùng đóng góp món ăn, chia sẻ kinh nghiệm sống lành mạnh và đánh giá chân thực."
          />
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-muted/40 p-5">
          <Text className="text-center text-lg font-bold text-foreground">Bắt đầu hành trình ăn chay của bạn ngay hôm nay</Text>
          <Text className="text-center text-sm leading-relaxed text-muted-foreground">
            Khám phá các công thức chay hấp dẫn hoặc tìm quán ăn chay ngon gần bạn nhất.
          </Text>
          <Link href={'/recipes' as Href} asChild>
            <PrimaryButton label="Khám phá món chay" />
          </Link>
          <Link href={'/restaurants' as Href} asChild>
            <PrimaryButton label="Tìm quán chay gần đây" variant="outline" />
          </Link>
        </View>
      </View>
    </SiteScreen>
  );
}
