import type { Metadata } from 'next';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật — VeggieConnect',
  description:
    'Cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng trên nền tảng VeggieConnect.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ShieldCheck className="size-3.5" /> Quyền riêng tư & An toàn dữ liệu
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Chính sách bảo mật
        </h1>
        <p className="text-xs text-muted-foreground">Cập nhật lần cuối: Tháng 09/2026</p>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Cam kết chung</h2>
          <p>
            VeggieConnect cam kết tôn trọng và bảo vệ tuyệt đối thông tin riêng tư của người dùng.
            Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu khi bạn
            truy cập và sử dụng dịch vụ trên nền tảng.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Thông tin chúng tôi thu thập</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Thông tin tài khoản:</strong> Họ tên, địa chỉ email, ảnh đại diện khi đăng ký
              hoặc đăng nhập qua Google OAuth.
            </li>
            <li>
              <strong>Dữ liệu tùy chọn cá nhân:</strong> Trường phái ăn chay (Thuần chay, Chay có
              trứng/sữa), tiền sử dị ứng thực phẩm và mục tiêu dinh dưỡng cá nhân.
            </li>
            <li>
              <strong>Dữ liệu vị trí:</strong> Tọa độ GPS chỉ được thu thập khi bạn đồng ý cấp quyền
              trên trình duyệt nhằm phục vụ tính năng tìm kiếm quán chay lân cận. Chúng tôi không
              lưu vết vị trí liên tục.
            </li>
            <li>
              <strong>Dữ liệu nội dung đóng góp:</strong> Các công thức, đánh giá, bình luận hoặc
              bài viết bạn chủ động đăng tải.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Mục đích sử dụng dữ liệu</h2>
          <p>Dữ liệu của bạn được sử dụng nhằm mục đích:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Cung cấp và tối ưu hóa tính năng cá nhân hóa thực đơn dinh dưỡng.</li>
            <li>
              Lọc bỏ các món ăn có nguy cơ gây dị ứng hoặc không phù hợp trường phái ăn chay đã
              chọn.
            </li>
            <li>
              Gửi thông báo cập nhật về các tương tác trong cộng đồng (bình luận, phê duyệt công
              thức).
            </li>
            <li>Nâng cao chất lượng dịch vụ và bảo đảm an ninh mạng.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            4. Bảo mật phiên đăng nhập và Cookie
          </h2>
          <p>
            VeggieConnect sử dụng HttpOnly Cookie kết hợp cơ chế Refresh Token xoay vòng (rotating
            refresh) để bảo vệ phiên đăng nhập của bạn, ngăn chặn hoàn toàn nguy cơ rò rỉ mã token
            qua các cuộc tấn công XSS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            5. Cam kết không chia sẻ dữ liệu thương mại
          </h2>
          <p>
            Chúng tôi <strong>tuyệt đối không bán, cho thuê hoặc chia sẻ</strong> thông tin cá nhân
            của người dùng cho bên thứ ba vì mục đích tiếp thị hoặc quảng cáo thương mại.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. Quyền của người dùng</h2>
          <p>
            Bạn có toàn quyền xem, chỉnh sửa thông tin hồ sơ cá nhân hoặc yêu cầu xóa vĩnh viễn tài
            khoản và dữ liệu liên quan bất cứ lúc nào thông qua trang Quản lý tài khoản.
          </p>
        </section>
      </div>
    </div>
  );
}
