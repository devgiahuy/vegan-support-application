import { Text, View } from 'react-native';
import { CheckCircle2, HeartHandshake, ShieldAlert } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { BulletList, Paragraph, StaticHero, StaticSection } from '@/components/shared/static-page';
import { useIconColors } from '@/lib/theme-colors';

/** Quy chế cộng đồng — đồng bộ `/guidelines` của web. */
export default function GuidelinesScreen() {
  const colors = useIconColors();
  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          badge="Văn hóa ứng xử"
          badgeIcon={HeartHandshake}
          title="Quy chế cộng đồng"
          subtitle="Cùng nhau xây dựng một không gian chia sẻ văn minh, tích cực và tôn trọng lẫn nhau."
        />

        <View className="gap-3 rounded-2xl border border-emerald-500/30 bg-card p-5">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={18} color="#047857" />
            <Text className="text-base font-bold text-emerald-700">Những điều khuyến khích</Text>
          </View>
          <BulletList
            items={[
              { text: 'Chia sẻ công thức thuần thực vật ngon, lành mạnh, có ảnh chụp chân thực.' },
              { text: 'Trao đổi với thái độ tích cực, tôn trọng chế độ ăn chay của người khác.' },
              { text: 'Đóng góp nhận xét công tâm về hương vị món ăn và chất lượng các quán chay lân cận.' },
              { text: 'Báo cáo kịp thời các nội dung gây hiểu lầm hoặc vi phạm quy định.' },
            ]}
          />
        </View>

        <View className="gap-3 rounded-2xl border border-destructive/30 bg-card p-5">
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={18} color={colors.destructive} />
            <Text className="text-base font-bold text-destructive">Những hành vi nghiêm cấm</Text>
          </View>
          <BulletList
            items={[
              { text: 'Đăng nội dung chứa thịt, hải sản hoặc xúc phạm lối sống ăn chay.' },
              { text: 'Phỉ báng, thóa mạ hoặc công kích cá nhân đối với thành viên khác.' },
              { text: 'Spam liên kết tiếp thị, bán hàng đa cấp hoặc quảng cáo không liên quan.' },
              { text: 'Giả mạo chuyên gia dinh dưỡng hoặc đưa ra khuyến cáo y khoa nguy hiểm.' },
            ]}
          />
        </View>

        <StaticSection title="Quy trình kiểm duyệt & xử lý vi phạm">
          <Paragraph>
            Bài viết, video và công thức gửi lên hệ thống sẽ được Người đóng góp (Contributor) và Ban quản trị xem xét. Các cảnh báo tự động chỉ là tín hiệu
            tham khảo, quyết định cuối cùng do con người đưa ra. Với tài khoản vi phạm nhiều lần, hệ thống có thể áp dụng biện pháp tạm khóa.
          </Paragraph>
        </StaticSection>
      </View>
    </SiteScreen>
  );
}
