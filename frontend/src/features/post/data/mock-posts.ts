import type { Post } from '../types/post.model';

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Cẩm nang ăn chay trường theo Phật giáo không lo thiếu máu và Vitamin B12',
    slug: 'an-chay-truong-phat-giao-khong-thieu-mau-b12',
    summary:
      'Hướng dẫn khoa học từ bác sĩ dinh dưỡng về cách kết hợp các loại ngũ cốc lên men, rong biển và nấm men dinh dưỡng để cơ thể luôn tràn đầy sinh lực khi ăn chay trường.',
    contentMarkdown: `## 1. Nỗi lo thiếu máu và Vitamin B12 khi ăn chay trường
Nhiều Phật tử và người bắt đầu ăn chay trường thường lo ngại về nguy cơ thiếu hụt vi chất dinh dưỡng, đặc biệt là **sắt sinh học** và **Vitamin B12** (Cobalamin). Trên thực tế, nếu biết cách phối hợp thực phẩm theo nguyên lý thực dưỡng hiện đại, bạn hoàn toàn có thể duy trì chỉ số huyết sắc tố ổn định mà không cần phụ thuộc vào nguồn gốc động vật.

### 2. Nguồn bổ sung Vitamin B12 thuần thực vật
- **Men dinh dưỡng (Nutritional Yeast):** Chỉ cần 1-2 thìa cà phê men dinh dưỡng rắc lên món súp hoặc salad mỗi ngày có thể cung cấp đủ 100% nhu cầu B12 khuyến nghị.
- **Thực phẩm lên men truyền thống:** Tương chao, tempeh đậu nành lên men và dưa cải muối tự nhiên có chứa một lượng vi khuẩn sinh tổng hợp B12 có lợi cho đường ruột.
- **Sữa hạt tăng cường:** Các loại sữa hạt óc chó, hạnh nhân hoặc yến mạch hiện nay đều được tăng cường Vitamin B12 và Canxi.

### 3. Tối ưu hóa hấp thu Sắt non-heme
Sắt trong thực vật (nấm, đậu gà, rau bó xôi, mè đen) là sắt non-heme, cần môi trường axit để chuyển hóa tối đa:
1. **Luôn kết hợp thực phẩm giàu Vitamin C:** Vắt một lát chanh tươi hoặc ăn kèm ớt chuông, cà chua khi dùng món đậu hoặc canh rong biển.
2. **Tránh uống trà đặc / cà phê ngay sau bữa ăn:** Chất tannin trong trà sẽ ức chế hấp thu sắt tới 50%. Hãy uống cách bữa ăn ít nhất 1 giờ.

> *"Ăn chay không đơn thuần là kiêng khem thịt cá, mà là nghệ thuật nuôi dưỡng thân tâm bằng nguồn năng lượng thanh lành của đất trời."*

### 4. Lời khuyên từ chuyên gia
Mỗi 6 tháng, người ăn chay trường nên làm xét nghiệm tổng phân tích tế bào máu và đo nồng độ Ferritin, Serum B12 để có lộ trình bổ sung phù hợp nhất.`,
    coverImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    category: 'Sức khỏe & Dinh dưỡng',
    dietSchool: 'PHAT_GIAO',
    tags: ['ChayPhậtGiáo', 'VitaminB12', 'DinhDưỡngThuầnChay', 'ThựcDưỡng'],
    status: 'PUBLISHED',
    statusLabel: 'Đã duyệt',
    author: {
      id: 'a1',
      name: 'ThS. Bác sĩ Lan Anh',
      avatar: 'https://i.pravatar.cc/80?img=47',
      role: 'NUTRITION_EXPERT',
      roleTitle: 'Chuyên gia Dinh dưỡng & Y học Cổ truyền',
      verified: true,
    },
    readingMinutes: 6,
    publishedAt: '12/10/2026',
    views: 3240,
    score: 86,
    commentCount: 14,
    saved: true,
  },
  {
    id: 'p2',
    title: 'Bí quyết nấu nước dùng phở nấm thanh ngọt tự nhiên không cần mì chính',
    slug: 'bi-quyet-nau-nuoc-dung-pho-nam-thanh-ngot',
    summary:
      'Công thức hầm nước dùng gia truyền từ mía lau, củ sen, lê ngọt và thảo quả nướng giúp bát phở chay thơm lừng chuẩn phong vị Hà Nội xưa.',
    contentMarkdown: `## Tinh túy của bát phở chay nằm ở nồi nước dùng
Nhiều người nghĩ rằng nước dùng phở chay sẽ nhạt nhòa nếu không nêm bột ngọt hay hạt nêm công nghiệp. Điều đó hoàn toàn sai nếu bạn nắm được **quy tắc hầm củ quả lấy vị ngọt tự nhiên (umami thực vật)**.

### Bộ tứ nguyên liệu vàng tạo vị ngọt hậu:
- **Mía lau chẻ đôi:** Cung cấp vị ngọt thanh mát, không gây gắt cổ.
- **Củ cải trắng và bắp ngọt:** Tiết ra đường thực vật tự nhiên khi ninh lửa liu riu.
- **Lê ngọt hoặc táo tây:** Tạo độ sánh và thanh tao cho nước dùng.
- **Nấm hương khô:** Nguồn axit glutamic tự nhiên tuyệt hảo thay thế mì chính.

### Hương thơm gia vị thảo mộc
Nướng xém cạnh hoa hồi, thảo quả, quế thanh và một củ gừng nhỏ trước khi cho vào túi vải lọc thả vào nồi hầm. Hương thơm nồng ấm sẽ lan tỏa khắp gian bếp!`,
    coverImage: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    category: 'Mẹo nhà bếp',
    dietSchool: 'THUAN_CHAY',
    tags: ['PhởChay', 'NướcDùngChay', 'MẹoNấuĂn', 'ĂnChayNgon'],
    status: 'PUBLISHED',
    statusLabel: 'Đã duyệt',
    author: {
      id: 'a2',
      name: 'Bếp Mẹ An',
      avatar: 'https://i.pravatar.cc/80?img=45',
      role: 'EXPERIENCED_COOK',
      roleTitle: 'Người nấu chay 10 năm kinh nghiệm',
      verified: true,
    },
    readingMinutes: 4,
    publishedAt: '05/10/2026',
    views: 2150,
    score: 64,
    commentCount: 9,
  },
  {
    id: 'p3',
    title: 'Ý nghĩa của việc ăn chay kỳ mùng 1 và ngày rằm trong văn hóa Việt',
    slug: 'y-nghia-an-chay-ky-mung-1-ngay-ram',
    summary:
      'Tìm hiểu về nguồn gốc của tập tục ăn chay sóc vọng, chu kỳ tuần trăng và tác động tích cực đến tâm sinh lý con người theo quan niệm truyền thống.',
    contentMarkdown: `## Tập tục ăn chay ngày Sóc Vọng
Từ ngàn đời nay, người Việt dù theo đạo Phật, đạo Cao Đài hay không theo tôn giáo nào, vẫn có thói quen ăn chay vào ngày mùng 1 (ngày Sóc) và ngày rằm (ngày Vọng) hàng tháng.

### 1. Dưới góc nhìn khoa học và chu kỳ tuần trăng
Vào những ngày trăng non và trăng tròn, lực hấp dẫn từ mặt trăng tác động mạnh nhất lên thủy triều và cả lượng nước trong cơ thể con người (chiếm hơn 70%). Vào những ngày này, thần kinh và huyết áp dễ bị kích thích. Ăn các món chay thanh đạm, giàu chất xơ và ít muối giúp cơ thể nhẹ nhàng, cân bằng cảm xúc và giảm áp lực cho hệ tim mạch.

### 2. Dưới góc nhìn văn hóa tâm linh
- **Ngày mùng 1:** Khởi đầu một tháng mới với sự thanh tịnh, cầu mong may mắn, bình an cho gia đạo.
- **Ngày rằm:** Trăng tròn viên mãn, nhắc nhở con người hướng thiện, nuôi dưỡng lòng từ bi và trân trọng sự sống của muôn loài.`,
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    category: 'Kinh nghiệm ăn chay',
    dietSchool: 'DAO_GIAO',
    tags: ['ĂnChayKỳ', 'VănHóaViệt', 'NgàyRằm', 'ChayTịnh'],
    status: 'PUBLISHED',
    statusLabel: 'Đã duyệt',
    author: {
      id: 'a3',
      name: 'Thầy Thích Tuệ Minh',
      avatar: 'https://i.pravatar.cc/80?img=20',
      role: 'NUTRITION_EXPERT',
      roleTitle: 'Giảng sư Văn hóa Phật giáo',
      verified: true,
    },
    readingMinutes: 5,
    publishedAt: '28/09/2026',
    views: 1890,
    score: 52,
    commentCount: 7,
  },
  {
    id: 'p4',
    title: 'Phở Nấm Thuần Chay Dưỡng Sinh Nước Dùng Thanh Ngọt (Bài đăng cá nhân)',
    slug: 'pho-nam-thuan-chay-duong-sinh',
    summary:
      'Bài viết cá nhân của bạn chia sẻ về cách nấu nước dùng ngọt mát từ nấm rơm và củ cải.',
    contentMarkdown:
      'Bí quyết ninh củ cải trắng, mía lau và các loại nấm tươi để có nồi nước dùng ngọt tự nhiên.',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    category: 'Kinh nghiệm ăn chay',
    dietSchool: 'THUAN_CHAY',
    tags: ['BàiCủaTôi', 'PhởChay', 'ThựcDưỡng'],
    status: 'PUBLISHED',
    statusLabel: 'Đã duyệt',
    author: {
      id: 'my-user',
      name: 'HuongLan.Vegan',
      avatar: 'https://i.pravatar.cc/80?img=32',
      role: 'AUTHORIZED_USER',
      roleTitle: 'Thành viên Vàng',
      verified: true,
    },
    readingMinutes: 3,
    publishedAt: '12/10/2026',
    views: 1420,
    score: 38,
    commentCount: 5,
  },
  {
    id: 'p5',
    title: 'Nem Rán Chay Nhân Nấm Mộc Nhĩ & Đậu Xanh Bùi Béo',
    slug: 'nem-ran-chay-nhan-nam-moc-nhi-dau-xanh',
    summary:
      'Vỏ bánh ram giòn rụm nhiều giờ, công thức nhân đậu bùi thơm dinh dưỡng cho ngày lễ rằm.',
    contentMarkdown: 'Hướng dẫn cuộn nem chặt tay và mẹo giữ vỏ ram giòn suốt 4 tiếng đồng hồ.',
    coverImage: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
    category: 'Mẹo nhà bếp',
    dietSchool: 'PHAT_GIAO',
    tags: ['NemChay', 'MónRằm', 'ChờDuyệt'],
    status: 'PENDING',
    statusLabel: 'Chờ duyệt',
    moderationReason: 'Hệ thống kiểm duyệt tự động đang xử lý nội dung',
    author: {
      id: 'my-user',
      name: 'HuongLan.Vegan',
      avatar: 'https://i.pravatar.cc/80?img=32',
      role: 'AUTHORIZED_USER',
      roleTitle: 'Thành viên Vàng',
      verified: true,
    },
    readingMinutes: 4,
    publishedAt: 'Hôm nay',
    views: 12,
    score: 0,
    commentCount: 0,
  },
  {
    id: 'p6',
    title: 'Cà Tím Kho Tiêu Nồi Đất Cay Nồng Đậm Đà Đưa Cơm',
    slug: 'ca-tim-kho-tieu-noi-dat',
    summary: 'Món cà tím om đậm vị tiêu đen ăn cùng cơm trắng nóng hổi.',
    contentMarkdown:
      'Lý do cần chỉnh sửa: Vui lòng bổ sung định lượng chi tiết cho nguyên liệu gia vị tiêu và nước tương.',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    category: 'Mẹo nhà bếp',
    dietSchool: 'THUAN_CHAY',
    tags: ['CầnChỉnhSửa', 'MónKhoChay'],
    status: 'FLAGGED',
    statusLabel: 'Cần chỉnh sửa',
    moderationReason:
      'Vui lòng bổ sung định lượng chi tiết cho nguyên liệu gia vị tiêu và nước tương.',
    author: {
      id: 'my-user',
      name: 'HuongLan.Vegan',
      avatar: 'https://i.pravatar.cc/80?img=32',
      role: 'AUTHORIZED_USER',
      roleTitle: 'Thành viên Vàng',
      verified: true,
    },
    readingMinutes: 3,
    publishedAt: '2 ngày trước',
    views: 45,
    score: 4,
    commentCount: 1,
  },
];
