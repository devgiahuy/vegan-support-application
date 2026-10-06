import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { BulletList, Paragraph, StaticHero, StaticSection } from '@/components/shared/static-page';

/**
 * Chính sách bảo mật — đồng bộ `/privacy` của web. Đã điều chỉnh cho ứng dụng di động: bỏ phần nhắc "Google OAuth"
 * (backend chỉ có đăng ký/đăng nhập email) và đổi "trình duyệt" thành "thiết bị".
 */
export default function PrivacyScreen() {
  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          badge="Quyền riêng tư & an toàn dữ liệu"
          badgeIcon={ShieldCheck}
          title="Chính sách bảo mật"
          updatedAt="Cập nhật lần cuối: Tháng 09/2026"
        />

        <StaticSection title="1. Cam kết chung">
          <Paragraph>
            VeggieConnect cam kết tôn trọng và bảo vệ thông tin riêng tư của người dùng. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ
            và bảo vệ dữ liệu khi bạn sử dụng dịch vụ.
          </Paragraph>
        </StaticSection>

        <StaticSection title="2. Thông tin chúng tôi thu thập">
          <BulletList
            items={[
              { lead: 'Thông tin tài khoản:', text: 'họ tên, địa chỉ email và ảnh đại diện (nếu có) khi đăng ký.' },
              {
                lead: 'Dữ liệu tùy chọn cá nhân:',
                text: 'chế độ ăn (thuần chay, chay có trứng/sữa), tiền sử dị ứng thực phẩm và mục tiêu dinh dưỡng cá nhân.',
              },
              {
                lead: 'Dữ liệu vị trí:',
                text: 'tọa độ GPS chỉ được dùng khi bạn đồng ý cấp quyền trên thiết bị, nhằm phục vụ tìm quán chay lân cận. Chúng tôi không theo dõi vị trí liên tục.',
              },
              { lead: 'Dữ liệu nội dung đóng góp:', text: 'công thức, đánh giá, bình luận hoặc bài viết bạn chủ động đăng tải.' },
            ]}
          />
        </StaticSection>

        <StaticSection title="3. Mục đích sử dụng dữ liệu">
          <Paragraph>Dữ liệu của bạn được sử dụng nhằm:</Paragraph>
          <BulletList
            items={[
              { text: 'Cung cấp và tối ưu tính năng cá nhân hóa thực đơn dinh dưỡng.' },
              { text: 'Lọc bỏ các món có nguy cơ gây dị ứng hoặc không phù hợp chế độ ăn đã chọn.' },
              { text: 'Gửi thông báo về các tương tác trong cộng đồng (bình luận, kết quả duyệt bài).' },
              { text: 'Nâng cao chất lượng dịch vụ và bảo đảm an ninh hệ thống.' },
            ]}
          />
        </StaticSection>

        <StaticSection title="4. Bảo mật phiên đăng nhập">
          <Paragraph>
            VeggieConnect dùng cơ chế token truy cập ngắn hạn kết hợp refresh token xoay vòng được giữ trong cookie HttpOnly để bảo vệ phiên đăng nhập của
            bạn.
          </Paragraph>
        </StaticSection>

        <StaticSection title="5. Không chia sẻ dữ liệu vì mục đích thương mại">
          <Paragraph>
            Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của người dùng cho bên thứ ba vì mục đích tiếp thị hoặc quảng cáo thương mại.
          </Paragraph>
        </StaticSection>

        <StaticSection title="6. Quyền của người dùng">
          <Paragraph>
            Bạn có quyền xem, chỉnh sửa thông tin hồ sơ cá nhân, tắt thu thập hành vi và xóa lịch sử hành vi ngay trong mục Hồ sơ → Quyền riêng tư.
          </Paragraph>
        </StaticSection>
      </View>
    </SiteScreen>
  );
}
