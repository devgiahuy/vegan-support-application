import type { Metadata } from 'next';
import { Users, HeartHandshake, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Quy chế cộng đồng — VeggieConnect',
  description:
    'Tiêu chuẩn văn hóa ứng xử và chia sẻ lành mạnh trong cộng đồng ăn chay VeggieConnect.',
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <HeartHandshake className="size-3.5" /> Văn hóa ứng xử
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Quy chế cộng đồng
        </h1>
        <p className="text-sm text-muted-foreground">
          Cùng nhau xây dựng một không gian chia sẻ văn minh, tích cực và tôn trọng lẫn nhau.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-emerald-500/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5" /> Những điều khuyến khích
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                Chia sẻ công thức nấu ăn thuần thực vật ngon, lành mạnh, có ảnh chụp chân thực.
              </li>
              <li>
                Trao đổi, thảo luận với thái độ tích cực, tôn trọng trường phái ăn chay của người
                khác.
              </li>
              <li>
                Đóng góp nhận xét công tâm về hương vị món ăn và chất lượng các quán chay lân cận.
              </li>
              <li>Báo cáo kịp thời các bài viết có nội dung gây hiểu lầm hoặc vi phạm quy định.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-destructive">
              <ShieldAlert className="size-5" /> Những hành vi nghiêm cấm
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
              <li>Đăng tải nội dung chứa thịt, hải sản hoặc xúc phạm lối sống ăn chay.</li>
              <li>Phỉ báng, thóa mạ hoặc công kích cá nhân đối với các thành viên khác.</li>
              <li>Spam liên kết tiếp thị, bán hàng đa cấp hoặc quảng cáo không liên quan.</li>
              <li>Giả mạo chuyên gia dinh dưỡng hoặc đưa ra các khuyến cáo y khoa nguy hiểm.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-base font-bold text-foreground">
          Quy trình kiểm duyệt & Xử lý vi phạm
        </h2>
        <p>
          Các bài viết, video và công thức gửi lên hệ thống sẽ được đội ngũ Người đóng góp
          (Contributor) và Ban quản trị thẩm định. Đối với tài khoản vi phạm nhiều lần, hệ thống sẽ
          áp dụng biện pháp tạm khóa hoặc hủy tư cách thành viên.
        </p>
      </div>
    </div>
  );
}
