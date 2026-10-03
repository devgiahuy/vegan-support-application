import { Text, View } from 'react-native';
import { AlertTriangle, FileText } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { BulletList, Paragraph, StaticHero, StaticSection } from '@/components/shared/static-page';

/** Điều khoản sử dụng — đồng bộ `/terms` của web, kèm tuyên bố miễn trừ trách nhiệm y tế. */
export default function TermsScreen() {
  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero badge="Quy định dịch vụ" badgeIcon={FileText} title="Điều khoản sử dụng" updatedAt="Cập nhật lần cuối: Tháng 09/2026" />

        <View className="flex-row items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle size={18} color="#b45309" style={{ marginTop: 2 }} />
          <View className="flex-1 gap-1">
            <Text className="text-xs font-bold text-amber-900">Tuyên bố miễn trừ trách nhiệm y tế</Text>
            <Text className="text-xs leading-relaxed text-amber-800">
              Mọi phân tích dinh dưỡng, gợi ý thực đơn và câu trả lời từ Trợ lý AI trên VeggieConnect chỉ nhằm mục đích tham khảo và nâng cao kiến thức lối
              sống. Thông tin trên hệ thống không thay thế chẩn đoán y khoa, phác đồ điều trị của bác sĩ hoặc tư vấn của chuyên gia dinh dưỡng lâm sàng.
            </Text>
          </View>
        </View>

        <StaticSection title="1. Chấp thuận điều khoản">
          <Paragraph>
            Bằng việc tạo tài khoản hoặc tiếp tục sử dụng VeggieConnect, bạn đồng ý tuân thủ các điều khoản và quy định nêu tại trang này.
          </Paragraph>
        </StaticSection>

        <StaticSection title="2. Trách nhiệm của thành viên">
          <Paragraph>Khi tham gia và tương tác trên nền tảng, người dùng cam kết:</Paragraph>
          <BulletList
            items={[
              { text: 'Cung cấp thông tin xác thực khi đăng ký tài khoản.' },
              { text: 'Chỉ chia sẻ công thức, hình ảnh và bài viết do chính mình sở hữu bản quyền hoặc có quyền sử dụng hợp pháp.' },
              { text: 'Không đăng nội dung quảng cáo sai sự thật, xúc phạm người khác hoặc không liên quan đến ẩm thực chay.' },
            ]}
          />
        </StaticSection>

        <StaticSection title="3. Quyền sở hữu trí tuệ">
          <Paragraph>
            Giao diện, hình ảnh đồ họa, logo thương hiệu và mã nguồn của ứng dụng thuộc quyền sở hữu của VeggieConnect. Nội dung do người dùng đóng góp
            (công thức, bài viết) được cấp quyền hiển thị cho cộng đồng VeggieConnect theo quy chế cộng đồng.
          </Paragraph>
        </StaticSection>

        <StaticSection title="4. Thay đổi điều khoản">
          <Paragraph>
            VeggieConnect có quyền điều chỉnh, bổ sung các điều khoản này để phù hợp với sự phát triển của dịch vụ và quy định pháp luật hiện hành. Những thay
            đổi quan trọng sẽ được thông báo đến người dùng qua ứng dụng.
          </Paragraph>
        </StaticSection>
      </View>
    </SiteScreen>
  );
}
