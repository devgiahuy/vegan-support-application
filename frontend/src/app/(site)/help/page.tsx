import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, BookOpen, Bot, Calendar, MapPin, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Trung tâm trợ giúp — VeggieConnect',
  description: 'Giải đáp thắc mắc và hướng dẫn sử dụng các tính năng trên nền tảng VeggieConnect.',
};

const FAQ_ITEMS = [
  {
    q: 'VeggieConnect phân biệt các trường phái ăn chay như thế nào?',
    a: 'Hệ thống hỗ trợ phân loại chi tiết: Thuần chay (Vegan - 100% thực vật), Ăn chay có sữa (Lacto-vegetarian), Ăn chay có trứng (Ovo-vegetarian), và Ăn chay có cả trứng sữa (Lacto-ovo vegetarian). Khi tìm kiếm món ăn hoặc quán chay, bạn có thể lọc theo đúng trường phái của mình.',
  },
  {
    q: 'Chỉ số dinh dưỡng trên món ăn được tính như thế nào?',
    a: 'Dữ liệu dinh dưỡng được ước tính dựa trên cơ sở dữ liệu thực phẩm chuẩn (USDA và Viện Dinh Dưỡng), có tính đến tỷ lệ hao hụt khi nấu nướng (chiên, luộc, hấp). Đây là dữ liệu tham khảo hữu ích cho kế hoạch ăn uống hàng ngày.',
  },
  {
    q: 'Làm thế nào để tìm quán chay gần vị trí của tôi?',
    a: 'Bạn vào mục "Bản đồ quán", cấp quyền vị trí GPS hoặc nhập địa chỉ khu vực bạn đang ở. Hệ thống sẽ hiển thị bản đồ trực quan kèm danh sách quán chay lân cận với khoảng cách thực tế chính xác.',
  },
  {
    q: 'Tôi có thể chia sẻ công thức món chay của mình lên nền tảng không?',
    a: 'Hoàn toàn được! Bạn có thể đăng ký tài khoản và gửi công thức món ăn mới tại mục "Khám phá món" -> "Đăng công thức". Đội ngũ Người đóng góp (Contributor) và Ban quản trị sẽ hỗ trợ kiểm duyệt để công thức sớm xuất hiện cho cộng đồng.',
  },
  {
    q: 'Trợ lý AI của VeggieConnect có thể giúp tôi những gì?',
    a: 'Trợ lý AI hỗ trợ bạn gợi ý thực đơn chay hàng ngày, giải đáp các thắc mắc về dinh dưỡng thực vật, kết hợp món ăn, và phân tích độ tương thích giữa các nguyên liệu trong bữa ăn.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 lg:px-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="size-3.5" /> Hỗ trợ người dùng
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Trung tâm trợ giúp
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Tìm câu trả lời cho các câu hỏi thường gặp và hướng dẫn sử dụng nhanh các tính năng trên
          VeggieConnect.
        </p>
      </div>

      {/* Danh mục hướng dẫn */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-2 text-center">
            <BookOpen className="size-6 text-primary mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Công thức & Món</h2>
            <p className="text-xs text-muted-foreground">
              Hướng dẫn tìm kiếm và lưu món ăn yêu thích
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-2 text-center">
            <Calendar className="size-6 text-primary mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Kế hoạch tuần</h2>
            <p className="text-xs text-muted-foreground">
              Cách lập và theo dõi dinh dưỡng thực đơn 7 ngày
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-2 text-center">
            <MapPin className="size-6 text-primary mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Bản đồ quán chay</h2>
            <p className="text-xs text-muted-foreground">Khám phá quán ngon và đề xuất quán mới</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-2 text-center">
            <Bot className="size-6 text-primary mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Trợ lý AI</h2>
            <p className="text-xs text-muted-foreground">Tối ưu hóa các câu hỏi tư vấn ăn chay</p>
          </CardContent>
        </Card>
      </div>

      {/* Câu hỏi thường gặp FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Câu hỏi thường gặp (FAQ)</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <Card key={index}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">{item.q}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                {item.a}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Liên hệ khi cần hỗ trợ thêm */}
      <div className="rounded-2xl border bg-muted/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-base font-bold text-foreground">Vẫn chưa tìm thấy câu trả lời?</h2>
          <p className="text-xs text-muted-foreground">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng lắng nghe và giải đáp.
          </p>
        </div>
        <Button asChild size="sm" className="rounded-full shrink-0">
          <Link href="/contact" className="gap-1.5">
            <Mail className="size-3.5" /> Gửi liên hệ hỗ trợ
          </Link>
        </Button>
      </div>
    </div>
  );
}
