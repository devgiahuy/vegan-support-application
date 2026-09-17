import { Info } from 'lucide-react';

/** Tuyên bố miễn trừ cố định — luôn render kể cả khi trả lời lỗi một phần. */
export function Disclaimer() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Trợ lý cung cấp thông tin tham khảo về ăn chay và dinh dưỡng, không thay thế tư vấn y tế
        chuyên nghiệp. Hãy hỏi ý kiến chuyên gia khi có vấn đề sức khỏe.
      </span>
    </p>
  );
}
