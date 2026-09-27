import { ChatMessageRole } from '@prisma/client';

export interface SeedChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface SeedChatSession {
  userEmail: string;
  title: string;
  messages: SeedChatMessage[];
}

export const chatSessionDefinitions: readonly SeedChatSession[] = [
  {
    userEmail: 'member@example.com',
    title: 'Tư vấn bổ sung đạm và vi chất cho người tập gym thuần chay',
    messages: [
      {
        role: ChatMessageRole.USER,
        content: 'Chào chuyên gia, mình cao 1m75, nặng 68.5kg, tập gym 4 buổi/tuần. Mình mới chuyển sang ăn thuần chay hoàn toàn được 1 tháng. Làm sao để mình đảm bảo nạp đủ 110-120g protein mỗi ngày mà không bị đầy bụng do ăn quá nhiều đậu?',
      },
      {
        role: ChatMessageRole.ASSISTANT,
        content: `Chào bạn Huy, rất hoan nghênh quyết định chuyển đổi sang lối sống thuần chay khoa học của bạn!

Với mục tiêu 110-120g protein/ngày (khoảng 1.6-1.7g/kg thể trọng), đây là mức hoàn toàn khả thi và tối ưu cho việc tăng cơ. Để tránh đầy bụng khi nạp nhiều đạm thực vật, bạn hãy áp dụng các nguyên tắc sau:

1. **Đa dạng hóa nguồn đạm, không dồn vào một loại đậu:**
- **Tempeh đậu nành lên men:** Quá trình lên men đã phân giải oligosaccharide (nguyên nhân chính gây đầy hơi), giúp tiêu hóa êm dịu và hấp thu nhanh. 100g tempeh cho ~20g protein.
- **Đậu hũ ép ráo hoặc đậu hũ ky:** Cung cấp hàm lượng đạm cô đặc và canxi dồi dào.
- **Đậu gà & đậu lăng luộc chín mềm:** Ngâm đậu ít nhất 8-12 tiếng với một chút muối hoặc chanh trước khi nấu để trung hòa acid phytic và ức chế enzyme gây khó tiêu.
- **Hạt dinh dưỡng:** Thêm 30g hạt bí ngô (~9g đạm) hoặc hạt điều vào bữa phụ.
- **Men dinh dưỡng (Nutritional Yeast):** Rắc 2 muỗng canh vào cháo, súp hoặc nui xào cung cấp thêm 8g protein và 100% nhu cầu Vitamin B12.

2. **Gợi ý phân bổ 4 bữa trong ngày (~115g Protein):**
- **Bữa sáng (25g):** Bát yến mạch ngâm hạt chia (15g protein) + 1 ly sữa đậu nành tươi (8g).
- **Bữa trưa (35g):** Cơm gạo lứt (5g) + 150g Đậu hũ xào bông cải (15g) + 100g Tempeh áp chảo (15g).
- **Bữa phụ chiều trước tập (15g):** 1 trái chuối + 2 muỗng bơ đậu phộng + 1 nắm hạt bí ngô.
- **Bữa tối (40g):** Phở nấm sườn non chay đậu gà (25g) + 1 chén canh rong biển đậu hũ non (10g) + rắc men dinh dưỡng (5g).

3. **Lưu ý hỗ trợ tiêu hóa:**
- Uống đủ 2.5 - 3 lít nước mỗi ngày vì chế độ ăn giàu chất xơ đòi hỏi nhiều nước để nhu động ruột vận hành trơn tru.
- Tăng dần lượng đậu trong vòng 2 tuần để hệ vi sinh đường ruột thích nghi.`,
      },
      {
        role: ChatMessageRole.USER,
        content: 'Cảm ơn chuyên gia rất nhiều! Bác sĩ cho mình hỏi thêm về Vitamin B12 và Sắt, mình có cần uống thêm viên bổ sung không hay ăn uống tự nhiên là đủ?',
      },
      {
        role: ChatMessageRole.ASSISTANT,
        content: `Câu hỏi rất chuẩn xác và kịp thời bạn nhé!

1. **Về Vitamin B12:**
- **Bắt buộc phải bổ sung:** Thực vật không tự tổng hợp được B12 có hoạt tính sinh học. Dù bạn có ăn rong biển hay nấm thì lượng B12 đó cơ thể người không hấp thu hiệu quả.
- **Khuyến nghị:** Bạn nên dùng viên uống B12 (Cyanocobalamin hoặc Methylcobalamin) liều 50-100 mcg mỗi ngày, hoặc 1.000-2.000 mcg mỗi tuần một lần; kết hợp sử dụng men dinh dưỡng tăng cường B12 (Fortified Nutritional Yeast).

2. **Về Sắt thực vật (Non-Heme Iron):**
- Đậu đen, đậu lăng, cải bó xôi, hạt bí ngô rất giàu sắt.
- **Mẹo tối ưu hấp thu:** Luôn kết hợp thực phẩm giàu sắt với thực phẩm giàu Vitamin C (vắt chanh, ăn ớt chuông, cà chua hoặc cam/chanh dây). Tránh uống trà xanh hoặc cà phê ngay trong hoặc sau bữa ăn 1-2 tiếng vì chất Tannin sẽ làm giảm hấp thu sắt.`,
      },
    ],
  },
] as const;
