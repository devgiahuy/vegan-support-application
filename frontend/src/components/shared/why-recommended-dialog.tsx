'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Scale,
  Compass,
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WhyRecommendedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle?: string;
}

export function WhyRecommendedDialog({
  isOpen,
  onClose,
  targetTitle = 'Kế hoạch thực đơn 7 ngày',
}: WhyRecommendedDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-lg font-bold text-foreground">
              Vì sao tôi thấy gợi ý này?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Minh bạch thuật toán &amp; căn cứ gợi ý chủ động từ AI (Theo chuẩn SRS UC-08 &amp; Nghị
            định 13/2023/NĐ-CP)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target item indicator */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <span className="text-muted-foreground">Gợi ý áp dụng cho: </span>
            <strong className="text-foreground">{targetTitle}</strong>
          </div>

          {/* Behavioral Signals Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Các tín hiệu hành vi đã ghi nhận (với sự đồng thuận của bạn):
            </h4>

            <div className="space-y-2.5">
              {/* Signal 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 text-xs">
                <Compass className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    Trường phái ăn chay đã chọn
                  </span>
                  <p className="text-muted-foreground">
                    Bạn chọn <strong>Chay Phật giáo</strong> và bật kiêng{' '}
                    <strong>Ngũ vị tân</strong>. Hệ thống tự động loại trừ mọi công thức chứa hành,
                    tỏi, hẹ.
                  </p>
                </div>
              </div>

              {/* Signal 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 text-xs">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    Chủ đề trao đổi gần đây với Trợ lý AI (UC-07)
                  </span>
                  <p className="text-muted-foreground">
                    Hôm qua bạn hỏi Chatbot:{' '}
                    <em>"Bổ sung protein thuần chay từ nguồn nào tốt nhất?"</em> &rarr; AI tăng tỷ
                    lệ nấm đùi gà, đậu phụ và hạt sen vào thực đơn.
                  </p>
                </div>
              </div>

              {/* Signal 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 text-xs">
                <Bookmark className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    Món ăn yêu thích đã lưu
                  </span>
                  <p className="text-muted-foreground">
                    Bạn đã lưu 3 món canh dưỡng sinh và món kho tiêu nồi đất &rarr; AI ưu tiên đưa
                    vào bữa trưa và tối của Thứ Ba &amp; Thứ Sáu.
                  </p>
                </div>
              </div>

              {/* Signal 4 */}
              <div className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20 text-xs">
                <Scale className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    Chỉ số thể trạng &amp; Calo mục tiêu (BMI / TDEE)
                  </span>
                  <p className="text-muted-foreground">
                    BMI 21.5 (Bình thường) • TDEE mục tiêu 1,850 kcal/ngày. Thực đơn tuần đạt 98.4%
                    độ chuẩn xác calo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Decree 13 Disclosure */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" /> Quyền riêng tư dữ liệu cá nhân
            </div>
            <p className="leading-relaxed">
              Dữ liệu lịch sử chat và tương tác của bạn chỉ được sử dụng để tối ưu gợi ý nội bộ và
              không chia sẻ cho bất kỳ bên thứ ba nào. Bạn có toàn quyền{' '}
              <strong>tắt tính năng cá nhân hóa</strong> hoặc <strong>xóa lịch sử hành vi</strong>{' '}
              bất cứ lúc nào trong cài đặt tài khoản.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" asChild size="sm" className="gap-1.5 text-xs">
            <Link href="/profile" onClick={onClose}>
              Quản lý cài đặt cá nhân hoá <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs">
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
