import type { Metadata } from 'next';
import { FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — VeggieConnect',
  description: 'Các quy định và điều khoản ràng buộc khi sử dụng dịch vụ của VeggieConnect.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <FileText className="size-3.5" /> Quy định dịch vụ
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Điều khoản sử dụng
        </h1>
        <p className="text-xs text-muted-foreground">Cập nhật lần cuối: Tháng 09/2026</p>
      </div>

      {/* Tuyên bố miễn trừ trách nhiệm y tế quan trọng (SRS D22) */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex gap-3 items-start">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1 text-amber-900 dark:text-amber-200">
            <p className="font-bold">Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer):</p>
            <p className="leading-relaxed opacity-90">
              Mọi phân tích dinh dưỡng, gợi ý thực đơn và câu trả lời từ Trợ lý AI trên
              VeggieConnect chỉ nhằm mục đích tham khảo và nâng cao kiến thức lối sống. Thông tin
              trên hệ thống không thay thế cho chẩn đoán y khoa, phác đồ điều trị của bác sĩ hoặc tư
              vấn chuyên môn từ chuyên gia dinh dưỡng lâm sàng.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Chấp thuận điều khoản</h2>
          <p>
            Bằng việc tạo tài khoản hoặc tiếp tục duyệt xem nền tảng VeggieConnect, bạn đồng ý tuân
            thủ toàn bộ các điều khoản và quy định được nêu tại trang này.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Trách nhiệm của thành viên</h2>
          <p>Khi tham gia và tương tác trên nền tảng, người dùng cam kết:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cung cấp thông tin xác thực khi đăng ký tài khoản.</li>
            <li>
              Chỉ chia sẻ các công thức món ăn, hình ảnh và bài viết do chính mình sở hữu bản quyền
              hoặc có quyền sử dụng hợp pháp.
            </li>
            <li>
              Không đăng tải nội dung quảng cáo sai sự thật, xúc phạm người khác hoặc nội dung không
              liên quan đến ẩm thực chay.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ giao diện, hình ảnh đồ họa, logo thương hiệu và mã nguồn của ứng dụng thuộc
            quyền sở hữu của VeggieConnect. Các nội dung đóng góp của người dùng (công thức, bài
            viết) được cấp quyền hiển thị cho cộng đồng VeggieConnect theo các quy chuẩn cộng đồng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Thay đổi điều khoản</h2>
          <p>
            VeggieConnect có quyền điều chỉnh, bổ sung các điều khoản này để phù hợp với sự phát
            triển của dịch vụ và quy định pháp luật hiện hành. Những thay đổi quan trọng sẽ được
            thông báo đến người dùng qua ứng dụng.
          </p>
        </section>
      </div>
    </div>
  );
}
