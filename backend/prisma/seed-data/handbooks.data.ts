export interface SeedHandbookDefinition {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  authorEmail: string;
  tags: string[];
  coverMedia: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
  };
}

export const handbookDefinitions: readonly SeedHandbookDefinition[] = [
  // 1. Cẩm nang Bổ sung Vitamin B12
  {
    slug: 'cam-nang-bo-sung-vitamin-b12',
    title: 'Cẩm Nang Bổ Sung Vitamin B12 Toàn Diện Cho Người Ăn Thuần Chay',
    excerpt: 'Hiểu đúng về nguồn gốc, nhu cầu sinh lý và giải pháp bổ sung Vitamin B12 an toàn, bền vững.',
    body: `Vitamin B12 (Cobalamin) là vi chất thiết yếu đóng vai trò sống còn trong việc duy trì chức năng hệ thần kinh, tổng hợp DNA và sản sinh hồng cầu khỏe mạnh. Khác với thực vật có thể quang hợp tự dưỡng, Vitamin B12 được tổng hợp tự nhiên duy nhất bởi các vi sinh vật (vi khuẩn) sống trong đất và ruột động vật.

### 1. Hiểu đúng về Vitamin B12 trong thực phẩm thực vật
Nhiều quan niệm sai lầm cho rằng tảo xoắn Spirulina, rong biển nori hoặc các sản phẩm đậu nành lên men truyền thống chứa đủ B12 hoạt tính. Thực tế khoa học chứng minh:
- Phần lớn B12 trong tảo là dạng "đồng phân giả" (pseudo-B12), không có hoạt tính sinh học ở người và có thể cạnh tranh hấp thu với B12 thật.
- Men dinh dưỡng (Nutritional Yeast) chỉ chứa B12 khi được nhà sản xuất chủ động bổ sung (fortified).

### 2. Nhu cầu khuyến nghị hằng ngày (RDA)
- Người trưởng thành: 2.4 mcg/ngày.
- Phụ nữ mang thai và cho con bú: 2.6 - 2.8 mcg/ngày.

### 3. Chiến lược bổ sung thông minh
1. Sử dụng thực phẩm tăng cường: Uống sữa thực vật, ngũ cốc dinh dưỡng hoặc men dinh dưỡng có nhãn ghi rõ "Fortified with Vitamin B12".
2. Sử dụng viên uống bổ sung định kỳ: Uống viên ngậm Cyanocobalamin hoặc Methylcobalamin liều 50-100 mcg mỗi ngày hoặc 2000 mcg mỗi tuần theo hướng dẫn chuyên gia.
3. Xét nghiệm định kỳ: Kiểm tra nồng độ B12 huyết thanh kết hợp chỉ số Methylmalonic Acid (MMA) mỗi năm một lần.`,
    categorySlug: 'vi-chat-thiet-yeu',
    authorEmail: 'org.contributor@example.com',
    tags: ['vitamin b12', 'vi chất', 'dinh dưỡng khoa học', 'người mới'],
    coverMedia: {
      publicId: 'seed/handbooks/b12-guide-cover',
      secureUrl: '/seed/handbooks/b12-guide-cover.jpg',
      width: 1200,
      height: 675,
      bytes: 52229,
    },
  },

  // 2. Tối Ưu Hóa Nguồn Đạm Thực Vật
  {
    slug: 'toi-uu-nguon-dam-thuc-vat',
    title: 'Tối Ưu Hóa Nguồn Đạm Thực Vật: Cách Phối Hợp Các Loại Đậu & Ngũ Cốc',
    excerpt: 'Nguyên tắc vàng tạo chuỗi axit amin hoàn chỉnh và tối đa hóa hiệu suất xây dựng cơ bắp.',
    body: `Một trong những băn khoăn lớn nhất của người mới chuyển sang chế độ ăn thực vật là: "Làm sao để nạp đủ protein mà không cần thịt cá?". Sự thật là vương quốc thực vật cung cấp nguồn đạm vô cùng phong phú và an toàn cho tim mạch.

### 1. Axit amin thiết yếu và nguyên tắc bù trừ
Cơ thể cần 9 loại axit amin thiết yếu mà không thể tự tổng hợp được:
- Nhóm Đậu (Legumes): Rất giàu axit amin Lysine nhưng tương đối nghèo Methionine.
- Nhóm Ngũ cốc (Grains): Rất giàu Methionine nhưng lại hạn chế về Lysine.
=> Khi kết hợp Đậu và Ngũ cốc (như Cơm gạo lứt ăn cùng Đậu hũ, Bánh mì nguyên cám ăn cùng Bơ đậu phộng, hoặc Đậu gà hầm ăn cùng Quinoa), bạn tạo nên nguồn Protein hoàn chỉnh (Complete Protein) có giá trị sinh học không thua kém ức gà hay thịt bò.

### 2. Không nhất thiết phải ăn cùng một đĩa thức ăn
Khoa học dinh dưỡng hiện đại đã chứng minh: Cơ thể duy trì một "bể dự trữ axit amin" (amino acid pool) trong gan và huyết tương trong suốt 24 giờ. Miễn là trong ngày bạn nạp đa dạng các nhóm hạt, đậu và ngũ cốc, cơ thể sẽ tự động tổng hợp đạm tối ưu.

### 3. Bảng phân bố protein tiêu biểu
- 100g Tempeh: ~20g Protein
- 100g Đậu hũ trắng: ~8-10g Protein
- 1 chén Đậu lăng nấu chín: ~18g Protein
- 1 chén Đậu gà luộc: ~15g Protein
- 2 muỗng canh Men dinh dưỡng: ~8g Protein`,
    categorySlug: 'kien-thuc-protein',
    authorEmail: 'org.contributor@example.com',
    tags: ['protein thực vật', 'tập gym', 'xây dựng cơ bắp', 'kết hợp đậu'],
    coverMedia: {
      publicId: 'seed/handbooks/protein-pairing-cover',
      secureUrl: '/seed/handbooks/protein-pairing-cover.webp',
      width: 1200,
      height: 675,
      bytes: 256753,
    },
  },

  // 3. Bí Quyết Meal Prep 7 Ngày
  {
    slug: 'bi-quyet-meal-prep-7-ngay',
    title: '7 Nguyên Tắc Vàng Meal Prep Chay: Tiết Kiệm Thời Gian & Luôn Đủ Chất Cả Tuần',
    excerpt: 'Phương pháp chuẩn bị hộp cơm mang đi làm gọn gàng, rau củ luôn tươi giòn không chảy nước.',
    body: `Meal Prep (chuẩn bị trước bữa ăn) là chìa khóa vàng giúp bạn duy trì lối sống lành mạnh ngay cả trong những tuần lễ bận rộn nhất.

### 1. Quy tắc phân chia nhóm nguyên liệu
Thay vì nấu từng món ăn hoàn chỉnh rồi để tủ lạnh nhiều ngày khiến hương vị suy giảm, hãy áp dụng phương pháp "Component Cooking" (chuẩn bị theo từng khối nguyên liệu):
- Khối 1: Tinh bột nền (Nấu sẵn 1 nồi cơm gạo lứt, quinoa hoặc yến mạch chia hộp kín).
- Khối 2: Đạm thực vật (Luộc sẵn 1 hộp đậu gà, rán áp chảo đậu hũ hoặc nướng tempeh giòn).
- Khối 3: Rau củ nướng hoặc xào sơ (Cà rốt, bí đỏ nướng nồi chiên không dầu giữ được 4-5 ngày).
- Khối 4: Rau sống và sốt chấm (Bảo quản riêng biệt, chỉ rưới sốt trước khi ăn 5 phút).

### 2. Kỹ thuật sơ chế giữ rau tươi giòn
- Rửa rau bằng nước muối loãng, dùng rổ quay ly tâm để rau thật ráo nước trước khi cho vào hộp thủy tinh lót một lớp khăn giấy thực phẩm.
- Không cắt thái trước các loại quả mọng nước như dưa leo, cà chua bi nếu chưa dùng ngay.`,
    categorySlug: 'bi-quyet-bao-quan-meal-prep',
    authorEmail: 'platform.contributor@example.com',
    tags: ['meal prep', 'cơm văn phòng', 'tiết kiệm thời gian', 'bảo quản'],
    coverMedia: {
      publicId: 'seed/handbooks/meal-prep-cover',
      secureUrl: '/seed/handbooks/meal-prep-cover.jpg',
      width: 1200,
      height: 675,
      bytes: 39996,
    },
  },

  // 4. Phân Biệt Các Trường Phái Ăn Chay
  {
    slug: 'phan-biet-cac-truong-phai-an-chay',
    title: 'Phân Biệt Các Trường Phái Ăn Chay & Lộ Trình Chuyển Đổi Không Mệt Mỏi',
    excerpt: 'Từ Chay Kỳ, Lacto-Ovo đến Thuần Chay Vegan: Đâu là lựa chọn phù hợp nhất với thể trạng của bạn?',
    body: `Ẩm thực chay không có một khuôn mẫu cứng nhắc duy nhất, mà là một phổ thực hành phong phú tôn trọng sự lựa chọn và thể trạng của mỗi cá nhân.

### 1. Các trường phái phổ biến
1. Thuần chay (Vegan): Loại bỏ 100% sản phẩm từ động vật, bao gồm cả sữa bò, trứng gia cầm, mật ong và gelatin. Thường đi kèm triết lý bảo vệ động vật và môi trường.
2. Chay có sữa và trứng (Lacto-Ovo Vegetarian): Không ăn thịt, cá nhưng có sử dụng sữa chua, phô mai và trứng gia cầm. Đây là bước đệm tuyệt vời cho người mới bắt đầu.
3. Chay kỳ (Periodic Fasting): Ăn chay vào các ngày cố định trong tháng (Rằm, Mùng Một, hoặc 10 ngày chay) theo truyền thống Phật giáo, thường kết hợp kiêng Ngũ vị tân (hành, tỏi, hẹ, kiệu).
4. Chay linh hoạt (Flexitarian): Chế độ ăn lấy thực vật làm trung tâm (80%), chỉ dùng một lượng nhỏ thịt cá trong các dịp đặc biệt.

### 2. Lời khuyên cho lộ trình chuyển đổi nhẹ nhàng
- Bắt đầu với "Thứ Hai Không Thịt" (Meatless Monday).
- Học cách nấu ngon 3 món chay bạn yêu thích nhất trước khi cắt giảm hoàn toàn đạm động vật.
- Luôn lắng nghe cơ thể và nạp đủ năng lượng từ tinh bột phức và chất béo tốt.`,
    categorySlug: 'van-hoa-am-thuc-chay',
    authorEmail: 'invited.contributor@example.com',
    tags: ['trường phái ăn chay', 'thuần chay', 'người mới', 'lối sống'],
    coverMedia: {
      publicId: 'seed/handbooks/vegan-traditions-cover',
      secureUrl: '/seed/handbooks/vegan-traditions-cover.jpg',
      width: 1200,
      height: 675,
      bytes: 48554,
    },
  },
] as const;
