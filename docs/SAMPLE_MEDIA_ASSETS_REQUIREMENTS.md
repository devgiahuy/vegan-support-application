# Hướng Dẫn & Yêu Cầu Cung Cấp Tài Nguyên Đa Phương Tiện (Ảnh & Video)
## Nền tảng VeggieConnect — Bộ Dữ Liệu Mẫu Toàn Diện

> **Mục đích**: Tài liệu này tổng hợp toàn bộ danh mục hình ảnh và video cần thiết để phủ kín cơ sở dữ liệu mẫu của VeggieConnect (bao quát đầy đủ 28 Phases từ Auth, Dinh dưỡng, Công thức, Cẩm nang, Video, Tủ lạnh thông minh AI, OCR Hóa đơn đến Mạng xã hội).
> Quý anh/chị có thể chuẩn bị ảnh/video thật, ảnh chụp chụp máy ảnh/điện thoại, hoặc xuất từ các công cụ AI (Midjourney, DALL-E, Nano Banana...) theo đúng thông số và mô tả dưới đây.

---

## 1. Tổng Quan Quy Chuẩn Kỹ Thuật

| Nhóm Tài Nguyên | Tỷ Lệ Khuyến Nghị (Aspect Ratio) | Độ Phân Giải Tối Thiểu | Định Dạng Ưu Tiên | Dung Lượng Tối Đa |
|---|---|---|---|---|
| **Ảnh đại diện người dùng (Avatar)** | `1:1` (Vuông) | 500 × 500 px | JPG, PNG, WebP | < 1 MB |
| **Ảnh món ăn (Recipe Cover)** | `16:9` hoặc `4:3` (Ngang) | 1200 × 800 px (hoặc 1600 × 900) | JPG, WebP | < 2.5 MB |
| **Ảnh cẩm nang / bài viết (Handbook Cover)** | `16:9` (Ngang) | 1280 × 720 px (hoặc 1920 × 1080) | JPG, WebP | < 3 MB |
| **Ảnh bìa Video (Video Thumbnail)** | `16:9` (Ngang chuẩn HD) | 1280 × 720 px | JPG, WebP | < 2 MB |
| **Clip Video nấu ăn (Video Clip)** | `16:9` (Ngang) | 1080p (1920 × 1080) hoặc 720p | MP4 (H.264), YouTube URL | < 50 MB / link YouTube |
| **Ảnh chụp tủ lạnh (Fridge Vision Scan)** | `4:3` hoặc `16:9` | 1280 × 960 px | JPG, PNG | < 4 MB |
| **Ảnh hóa đơn siêu thị (Receipt OCR)** | `9:16` hoặc `3:4` (Dọc) | 1024 × 1600 px | JPG, PNG | < 3 MB |
| **Ảnh bữa ăn tự tạo (Custom Meal)** | `1:1` hoặc `4:3` | 800 × 800 px | JPG, WebP | < 2 MB |

---

## 2. Danh Mục Ảnh Đại Diện Người Dùng (Avatars) — 7 Ảnh

| # | Tên file / `publicId` | Vai Trò / Đối Tượng | Mô Tả Khung Hình / Visual Prompt |
|---|---|---|---|
| 1 | `seed/avatars/admin-avatar.jpg` | Quản trị viên hệ thống | Chân dung phong cách văn phòng chuyên nghiệp, thân thiện, logo VeggieConnect tinh tế phía sau. |
| 2 | `seed/avatars/chef-minh-tam.jpg` | Bếp Trưởng Minh Tâm (Contributor Track Record) | Đầu bếp nam trung niên trong trang phục bếp trắng thanh lịch, nụ cười hiền hậu, đang cầm thìa gỗ hoặc đĩa rau củ tươi. |
| 3 | `seed/avatars/dr-hoai-thu.jpg` | ThS. BS. Hoài Thu (Viện Dinh Dưỡng - Org Affiliation) | Bác sĩ nữ trẻ trung, đeo kính, áo blouse trắng hoặc trang phục công sở y khoa, phong thái khoa học đáng tin cậy. |
| 4 | `seed/avatars/dieu-hanh.jpg` | Nghệ Nhân Diệu Hạnh (Admin Invited) | Nghệ nhân nữ trang phục áo dài truyền thống Huế nhã nhặn, thần thái an nhiên, mang phong vị thiền chay Phật giáo. |
| 5 | `seed/avatars/hoang-nam.jpg` | Hoàng Nam (Member - Gym & Thể thao) | Thanh niên năng động mặc áo thun thể thao khỏe khoắn, ngoại hình săn chắc, phong cách sống lành mạnh. |
| 6 | `seed/avatars/dieu-tam.jpg` | Diệu Tâm (Member - Phật tử tu tập) | Chân dung nữ phật tử dịu dàng, trang phục lam hoặc áo tràng giản dị, nụ cười thanh tịnh. |
| 7 | `seed/avatars/thanh-mai.jpg` | Thanh Mai (Member - Eat Clean & Giảm cân) | Bạn nữ văn phòng hiện đại, nụ cười rạng rỡ, cầm ly sinh tố xanh hoặc dĩa salad rau củ. |

---

## 3. Danh Mục Ảnh Đại Diện Món Ăn (Recipe Covers) — 13 Ảnh

Toàn bộ ảnh chụp theo phong cách **Food Photography** hiện đại: ánh sáng tự nhiên, phông nền gỗ mộc hoặc gốm sứ mộc mạc, trang trí rau thơm, ớt lát tươi mát.

| # | Tên file / `publicId` | Tên Món Ăn | Mô Tả Chi Tiết Góc Chụp & Bày Trí |
|---|---|---|---|
| 1 | `seed/recipes/pho-chay-ha-noi.jpg` | **Phở Nấm Chay Hà Nội** | Tô phở bốc khói nghi ngút, bánh phở mềm trong nước dùng thanh trong ánh vàng nhẹ; bề mặt xếp nấm hương hoa, đậu hũ non, hành boaro chẻ sợi, tiêu đen xay, đĩa chanh ớt và ngò gai bên cạnh. |
| 2 | `seed/recipes/bun-bo-hue-chay.jpg` | **Bún Bò Huế Chay** | Tô bún bò sợi to, nước dùng sả ớt đỏ cam hấp dẫn, lát chả lụa chay, nấm bào ngư xé sợi, đậu hũ chiên phồng vàng rụm; đĩa bắp chuối bào, rau kinh giới, ớt sa tế đặt cạnh. |
| 3 | `seed/recipes/ca-ri-chay-khoai-nam.jpg` | **Cà Ri Chay Khoai Nấm** | Bát cà ri màu vàng nghệ óng ánh với nước cốt dừa sánh mịn, miếng khoai lang mật, khoai môn và nấm đùi gà cắt khối vuông vức, rắc lá húng quế tươi; ăn kèm bánh mì giòn hoặc cơm nóng. |
| 4 | `seed/recipes/nam-dong-co-kho-tieu.jpg` | **Nấm Đông Cô Kho Tiêu** | Tộ đất truyền thống chứa những tai nấm đông cô tươi căng mọng phủ lớp nước sốt màu cánh gián đậm đà, tiêu sọ đen giã dập và lát ớt hiểm đỏ cay nồng. |
| 5 | `seed/recipes/canh-chua-chay-nam-bo.jpg` | **Canh Chua Chay Nam Bộ** | Tô canh chua thủy tinh hoặc sứ trắng thanh thoát, nổi bật với lát dứa (thơm) vàng, cà chua đỏ mọng, đậu bắp xanh, giá đỗ, đậu hũ non và ngò ôm, ngò gai rắc mặt. |
| 6 | `seed/recipes/goi-cuon-chay-ngu-sac.jpg` | **Gỏi Cuốn Chay Ngũ Sắc** | Đĩa đan tre bày 6 cuốn gỏi trong suốt nhìn thấu nhân rau cải bó xôi, cà rốt bào sợi, bún tươi, đậu hũ áp chảo vàng óng; chính giữa là chén xốt bơ đậu phộng sánh mịn rắc đậu phộng rang. |
| 7 | `seed/recipes/com-chien-trai-dua.jpg` | **Cơm Chiên Trái Dứa Hạt Điều** | Cơm gạo lứt hạt tơi vàng xào cùng đậu hà lan, bắp ngọt, cà rốt thái hạt lựu, được bày trí công phu bên trong nửa quả dứa khoét ruột, rắc đầy hạt điều rang giòn thơm phức. |
| 8 | `seed/recipes/banh-mi-chay-pate-nam.jpg` | **Bánh Mì Chay Pate Nấm** | Ổ bánh mì Việt Nam vỏ vàng rụm nứt kẽ, nhân pate nấm đậu gà béo bùi, lát chả lụa chay, đồ chua củ cải cà rốt, dưa leo giòn rụm và vài cọng ngò rí tươi non. |
| 9 | `seed/recipes/sup-bi-do-kem-dua.jpg` | **Súp Bí Đỏ Cốt Dừa** | Bát súp bí đỏ màu cam rực rỡ, bề mặt xoáy nhẹ vệt nước cốt dừa trắng muốt nghệ thuật, rắc hạt bí ngô rang giòn và tiêu đen mịn. |
| 10 | `seed/recipes/chao-yen-mach-nam-huong.jpg` | **Cháo Yến Mạch Nấm Hạt Sen** | Tô cháo nóng màu trắng ngà sánh mịn nấu từ yến mạch nguyên cám, nổi bật hạt sen tươi bở bùi, nấm hương xào thơm, vài giọt dầu mè óng ả và hành boaro phi vàng. |
| 11 | `seed/recipes/salad-bo-dau-ga.jpg` | **Salad Bơ Đậu Gà Sốt Mè Rang** | Đĩa salad phong phú gồm quả bơ sáp cắt lát quạt, đậu gà bùi thơm luộc chín, rau rocket, cà chua bi đỏ rực, hạt chia phủ sốt mè rang béo ngậy. |
| 12 | `seed/recipes/sinh-to-xanh-cai-bo-xoi.jpg` | **Sinh Tố Xanh Cải Bó Xôi Chuối** | Ly thủy tinh cao chứa sinh tố màu xanh lục tươi mát của lá bina và chuối chín, miệng ly rắc hạt chia, hạt gai dầu và cắm ống hút tre thân thiện môi trường. |
| 13 | `seed/recipes/sua-hat-sen-dau-do.jpg` | **Sữa Hạt Sen Đậu Đỏ Yến Mạch** | Chai thủy tinh đựng sữa hạt màu hồng pastel phấn mịn màng, đặt cạnh chén hạt sen tươi và đậu đỏ hạt tròn mẩy trên nền khăn vải thô mộc. |

---

## 4. Danh Mục Ảnh Bìa Cẩm Nang Khoa Học (Handbook Covers) — 4 Ảnh

Ảnh phong cách **Editorial Infographic / Scientific Health Guide** (tinh tế, hiện đại, uy tín).

| # | Tên file / `publicId` | Tiêu Đề Bài Cẩm Nang | Mô Tả Visual |
|---|---|---|---|
| 1 | `seed/handbooks/b12-guide-cover.jpg` | **Cẩm nang bổ sung Vitamin B12 cho người ăn chay thuần** | Hình ảnh khoa học thanh lịch về vi chất dinh dưỡng, viên bổ sung hữu cơ đặt cạnh lọ men dinh dưỡng (nutritional yeast) và sữa thực vật giàu B12, tông màu xanh ngọc - trắng y tế. |
| 2 | `seed/handbooks/protein-pairing-cover.jpg` | **Tối ưu hóa đạm thực vật & hấp thu Sắt toàn diện** | Bức tranh tổng hòa các nguồn đạm thực vật đỉnh cao: đậu gà, đậu lăng, hạt chia, đậu hũ kết hợp cùng quả họ cam chanh giàu vitamin C để minh họa cơ chế kích hoạt hấp thu sắt non-heme. |
| 3 | `seed/handbooks/meal-prep-cover.jpg` | **Bí quyết Meal Prep 7 ngày: Tiết kiệm thời gian, trọn vẹn vi chất** | Bàn bếp ngăn nắp với các hộp thủy tinh bento chuẩn bị sẵn các phần rau củ thái hạt lựu, ngũ cốc nguyên cám, xốt ướp phân loại theo ngày trong tuần, ánh sáng ban mai tươi sáng. |
| 4 | `seed/handbooks/vegan-traditions-cover.jpg` | **Phân biệt các trường phái ăn chay: Thuần chay, Ngũ vị tân và Phật giáo** | Bố cục so sánh trực quan tôn vinh nét đẹp văn hóa ẩm thực chay: đĩa hoa sen thanh tịnh, các loại củ kiệu hành tỏi được gạch chéo tinh tế theo truyền thống Phật giáo, đĩa quả rau củ tự nhiên thuần chay. |

---

## 5. Danh Mục Video Hướng Dẫn Nấu Ăn (Videos & Clips) — 3 Mục

Quý anh/chị có thể cung cấp:
- **Tùy chọn A**: File video thực tế (`.mp4`, chuẩn H.264, thời lượng 1 - 3 phút) kèm ảnh thumbnail JPG.
- **Tùy chọn B**: Cung cấp đường dẫn YouTube video thực tế (URL hoặc YouTube Video ID như `dQw4w9WgXcQ`), chúng tôi sẽ cập nhật thẳng vào DB.

| # | Tên file Thumbnail / `publicId` | YouTube ID Mặc Định | Tiêu Đề Video | Nội Dung Clip / Video Hướng Dẫn |
|---|---|---|---|---|
| 1 | `seed/videos/video-pho-nuoc-dung-cover.jpg` | `kJQP7kiw5Fk` | **Bí quyết hầm nước dùng Phở chay trong veo từ mía và củ cải** | Video quay cận cảnh các bước nướng gừng, nướng hành boaro, thả mía và củ cải vào nồi nước dùng sôi lăn tăn, lọc qua rây để thu được nước dùng trong vắt ngọt thanh. |
| 2 | `seed/videos/video-bua-toi-15-phut-cover.jpg` | `fJ9rUzIMcZQ` | **15 Phút chuẩn bị bữa tối chay đầy đủ dinh dưỡng cho người bận rộn** | Video nhịp điệu nhanh, hiện đại hướng dẫn xào nấm đậu hũ với bông cải xanh và luộc nhanh một đĩa mì gạo lứt, thích hợp cho dân văn phòng. |
| 3 | `seed/videos/video-sua-hat-sen-cover.jpg` | `3JZ_D3ELwOQ` | **Tự làm sữa hạt sen đậu đỏ sánh mịn không cần lọc tại nhà** | Video cận cảnh máy làm sữa hạt đang xay nhuyễn hạt sen và đậu đỏ đã hấp chín, rót ra ly sữa bốc khói thơm nức mũi. |

---

## 6. Danh Mục Ảnh Nhận Diện Thông Minh AI (Fridge Vision & Receipt OCR) — 3 Ảnh

Dành cho module trí tuệ nhân tạo (Phase 20 - Nhận diện tủ lạnh & Phase 21 - Trích xuất hóa đơn siêu thị & Bữa ăn cá nhân):

| # | Tên file / `publicId` | Nghiệp Vụ / Mục Đích | Mô Tả Ảnh Cần Chụp |
|---|---|---|---|
| 1 | `seed/vision/fridge-scan-sample.jpg` | **Quét Tủ Lạnh (Fridge AI Recognition)** | Ảnh chụp thực tế ngăn mát tủ lạnh gia đình: bên trong có hộp đậu hũ non, vài cây nấm đùi gà, bắp cải xanh, 2 củ cà rốt, 1 quả bơ, chai nước tương. Ánh sáng đèn tủ lạnh rõ nét, góc chụp trực diện. |
| 2 | `seed/vision/supermarket-receipt-sample.jpg` | **Trích Xuất Hóa Đơn (Receipt OCR)** | Ảnh chụp hóa đơn mua sắm siêu thị (WinMart / Co.opmart / Bách Hóa Xanh) chụp dọc phẳng trên mặt bàn. Hóa đơn có in rõ tên sản phẩm chay như: "Đậu hũ non", "Nấm kim châm", "Gạo lứt đỏ", "Cà chua bi", "Hạt nêm nấm", kèm giá tiền và ngày mua. |
| 3 | `seed/custom-meals/my-lunch-bowl.jpg` | **Bữa Ăn Tự Tạo (Custom Meal Photo)** | Ảnh chụp đĩa cơm trưa "Buddha Bowl" tự nấu tại nhà: cơm gạo lứt, nấm xào boaro, đậu hũ rán giòn, dưa leo xắt lát, rưới sốt mè rang. Góc chụp 45 độ từ trên xuống. |

---

## 7. Cách Thức Bàn Giao & Tích Hợp Vào Ứng Dụng

Khi quý anh/chị đã chuẩn bị xong bộ ảnh/video, có 3 cách rất thuận tiện để cập nhật vào hệ thống:

### Cách 1: Tải lên Cloudinary / CDN riêng (Khuyên dùng)
- Tải toàn bộ ảnh lên tài khoản Cloudinary của quý anh/chị theo đúng đường dẫn thư mục `seed/...` (Ví dụ: `seed/recipes/pho-chay-ha-noi`).
- Cung cấp cho chúng tôi Cloud Name hoặc URL prefix (ví dụ: `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/...`).
- Chúng tôi chỉ cần 1 lệnh cập nhật URL gốc là toàn bộ ảnh sẽ hiển thị lập tức khắp toàn bộ ứng dụng!

### Cách 2: Gửi thư mục qua Google Drive / Zip
- Quý anh/chị nén toàn bộ ảnh vào các folder con theo cấu trúc:
  ```
  assets/
  ├── avatars/        (7 ảnh)
  ├── recipes/        (13 ảnh)
  ├── handbooks/      (4 ảnh)
  ├── videos/         (3 ảnh thumbnail + video nếu có)
  ├── vision/         (2 ảnh tủ lạnh & hóa đơn)
  └── custom-meals/   (1 ảnh)
  ```
- Gửi link Drive cho chúng tôi. Chúng tôi sẽ đặt trực tiếp vào thư mục tĩnh của Frontend (`frontend/public/seed/...`) hoặc chạy script tự động upload lên Cloudinary.

### Cách 3: Sử dụng YouTube links cho Video
- Quý anh/chị chỉ cần gửi 3 đường link video YouTube bất kỳ về ẩm thực chay Việt Nam mà anh/chị ưng ý, chúng tôi sẽ gán trực tiếp ID đó vào database.

---
*Tài liệu này là đặc tả chuẩn đồng bộ với file hạt giống `backend/prisma/seed-data/media-assets.data.ts` và cơ sở dữ liệu `MediaAsset` của VeggieConnect.*
