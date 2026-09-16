Bạn là một Senior Frontend Engineer / UI Motion Engineer có kinh nghiệm với React/Next.js, TypeScript, Tailwind CSS và Framer Motion.

Hãy inspect toàn bộ project hiện tại trước khi thay đổi code. Không được tự ý refactor các phần không liên quan.

==================================================

1. MỤC TIÊU
   \==================================================

Tôi muốn thay thế IMAGE hiện tại ở phía bên phải của Hero Section trang Home/Landing Page bằng một animation 2D cao cấp, hiện đại, nhẹ và phù hợp với thương hiệu VeggieConnect.

UI hiện tại cần được giữ nguyên về:

- Navbar
- Hero text
- Heading
- Description
- CTA buttons
- Statistics
- Category section bên dưới
- Typography
- Spacing tổng thể
- Responsive layout
- Branding hiện tại

Chỉ tập trung thay thế visual/image block bên phải Hero Section bằng animation.

Animation phải trở thành điểm nhấn chính của Hero Section.

================================================== 2. Ý TƯỞNG ANIMATION
==================================================

Animation kể một câu chuyện:

EMPTY / FOOD BOWL
↓
TÔ XOAY LẦN 1
↓
CÁC NGUYÊN LIỆU TÁCH RA
↓
NGUYÊN LIỆU BAY RA XUNG QUANH
↓
TÔ / SCENE XOAY LẦN 2
↓
CÁC NGUYÊN LIỆU HỘI TỤ
↓
TẠO THÀNH MỘT MÓN ĂN HOÀN CHỈNH
↓
PAUSE NGẮN
↓
LOOP

Animation phải tự động chạy, không yêu cầu user click hoặc hover để bắt đầu.

================================================== 3. FLOW CHI TIẾT
==================================================

Tổng animation loop khoảng 7–9 giây.

Phase 1 — Initial Bowl

- Hiển thị một tô / bowl món ăn ở chính giữa visual area.
- Có floating rất nhẹ.
- Không được quá nhiều hiệu ứng.
- Visual phải sạch và premium.

Phase 2 — First Rotation

- Bowl tự xoay khoảng 360° một lần.
- Duration khoảng 1–1.5 giây.
- Rotation nên có easing mềm.
- Không được xoay liên tục vô hạn.
- Sau khi xoay xong phải có cảm giác "transition".

Phase 3 — Ingredient Reveal
Sau lần xoay thứ nhất:

- Các nguyên liệu xuất hiện từ khu vực bowl.
- Ingredients bay ra các vị trí khác nhau xung quanh bowl.
- Có scale + opacity + translation.
- Không xuất hiện cùng một lúc một cách cứng nhắc; có stagger nhẹ.
- Chuyển động phải mềm, organic.

Ví dụ bố cục:

                CARROT

        LETTUCE       TOMATO


                  BOWL


        BEANS        AVOCADO

Không bắt buộc đúng vị trí này, hãy dùng layout cân đối và tự nhiên.

Phase 4 — Ingredient Orbit

- Các nguyên liệu đã bung ra không đứng im hoàn toàn.
- Có thể orbit / floating rất nhẹ quanh trung tâm.
- Không được làm chuyển động quá mạnh.
- Ingredients không nên tự xoay tại chỗ quá nhiều.
- Mục tiêu là tạo cảm giác các nguyên liệu đang "kết nối" với nhau.

Phase 5 — Second Rotation

- Scene thực hiện transition / rotation lần thứ hai.
- Rotation phải tạo cảm giác chuẩn bị "assemble meal".
- Đây là transition từ nguyên liệu rời rạc sang món ăn hoàn chỉnh.

Phase 6 — Ingredient Convergence

- Tất cả ingredients di chuyển về trung tâm.
- Scale giảm nhẹ.
- Opacity có thể thay đổi nhẹ.
- Chuyển động phải có cảm giác bị hút về tâm.
- Dùng easing kiểu smooth / easeOut mạnh.

Phase 7 — Completed Meal

- Khi ingredients đã hội tụ:
  - hiển thị một món ăn hoàn chỉnh.
  - chuyển đổi từ trạng thái ingredients sang final dish bằng crossfade hoặc transform phù hợp.
- Final meal phải đẹp, rõ ràng và có cảm giác hoàn thiện.
- Có thể thêm một pulse/scale rất nhẹ khi món ăn hoàn thành.

Phase 8 — Pause

- Giữ completed meal khoảng 0.8–1.2 giây.
- Có floating rất nhẹ.

Phase 9 — Loop

- Chuyển mượt về trạng thái ban đầu.
- Loop liên tục nhưng không gây cảm giác loading spinner.

================================================== 4. VISUAL STYLE
==================================================

Phong cách tổng thể:

- Minimal
- Modern
- Premium
- Clean
- Healthy
- Plant-based
- Technology + Community

Brand colors hiện tại:

- #15803D
- #16A34A
- #0D9488
- #0F172A
- #F8FAFC

Có thể sử dụng:

- soft green glow
- subtle teal glow
- subtle shadow
- very light blur

Không được:

- Neon quá mạnh
- Glow quá sáng
- Particle quá nhiều
- Flashing
- Animation gây rối
- 3D quá nặng
- Visual giống game
- Animation kiểu loading spinner

================================================== 5. VỊ TRÍ TRONG HERO
==================================================

Animation sẽ thay thế trực tiếp image block hiện tại ở bên phải Hero Section.

Hiện tại Hero có layout đại loại:

LEFT:

- Badge
- Heading
- Description
- CTA
- Statistics

RIGHT:

- Food image
- Small nutrition/info badges

Giữ nguyên bố cục 2 cột hiện tại.

Food animation phải nằm trong vùng bên phải tương đương kích thước image cũ.

Desktop:

- Visual chiếm khoảng 45–50% Hero width.
- Không làm Hero bị overflow.
- Không đẩy text sang trái/phải.
- Không làm thay đổi chiều cao Hero quá nhiều.

Animation nên có đủ không gian để ingredients bung ra nhưng vẫn nằm trong visual container.

================================================== 6. CÁC BADGE HIỆN TẠI
==================================================

Nếu image hiện tại đang có các badge như:

- Lịch Chay: Hôm nay Mùng Một
- kcal
- protein
  hoặc các information card nhỏ,

hãy giữ lại ý tưởng này nếu chúng đang là một phần của Hero UI.

Có thể reposition chúng quanh animation.

Ví dụ:

TOP RIGHT:
"Lịch Chay: Hôm nay..."

BOTTOM LEFT:
"385 kcal"
"18g Protein thực vật"

Nhưng:

- Không để badge che ingredients.
- Không để badge trở thành focal point.
- Animation vẫn là visual focus chính.

================================================== 7. ASSET / IMAGE POLICY — CỰC KỲ QUAN TRỌNG
==================================================

Đây là yêu cầu bắt buộc.

KHÔNG được tự ý:

- lấy ảnh random từ Internet
- hotlink ảnh từ website khác
- dùng ảnh copyrighted không rõ nguồn
- dùng placeholder mà không báo
- bịa ra filename asset
- tham chiếu đến image không tồn tại
- tạo giả một asset bằng CSS nếu animation thực sự cần image asset mà project chưa có

Nếu project ĐÃ CÓ asset phù hợp:

- Hãy reuse asset đó.
- Kiểm tra kích thước, format, background, style.
- Không duplicate asset nếu không cần.

Nếu project KHÔNG CÓ asset phù hợp:

- Hãy kiểm tra xem image generation tool có khả dụng hay không.
- Nếu tool có khả năng tự tạo image asset trong môi trường Agent và tạo được asset phù hợp:
  - Có thể tự tạo asset.
  - Lưu đúng vào thư mục assets/public tương ứng.
  - Đảm bảo format phù hợp cho web.
  - Không thay đổi style thương hiệu một cách tùy tiện.

Nếu KHÔNG thể tự tạo asset:

- KHÔNG được dùng placeholder như "/images/foo.png".
- KHÔNG được dùng ảnh random.
- KHÔNG được tiếp tục hoàn thiện animation bằng cách giả định asset tồn tại.

Thay vào đó phải DỪNG tại dependency đó và báo cho tôi rõ ràng.

Format báo cáo bắt buộc:

"THIẾU ASSET — CẦN USER CUNG CẤP

1. Tên asset:
2. Mục đích:
3. Format đề xuất:
4. Kích thước đề xuất:
5. Background:
6. Style:
7. Tôi cần cung cấp asset này để tiếp tục bước nào:"

Ví dụ:

THIẾU ASSET — CẦN USER CUNG CẤP

1. Tên asset: finished-veggie-bowl.webp
2. Mục đích: Món ăn hoàn chỉnh ở phase cuối
3. Format: WebP hoặc PNG transparent
4. Kích thước: 1024x1024
5. Background: Transparent
6. Style: Top-down food photography, clean, consistent lighting
7. Dependency: Phase Completed Meal

Nếu thiếu nhiều asset, gom lại thành một danh sách rõ ràng.

KHÔNG được tự tạo ra danh sách asset giả nếu thực tế không cần.

================================================== 8. ƯU TIÊN SVG / WEBP
==================================================

Ưu tiên theo thứ tự:

1. Existing project assets
2. SVG
3. WebP transparent
4. PNG transparent

Không sử dụng GIF.

Không sử dụng video nếu không cần.

Không dùng canvas/WebGL nếu Framer Motion + SVG/WebP có thể giải quyết.

================================================== 9. TECHNICAL IMPLEMENTATION
==================================================

Ưu tiên:

- React
- TypeScript
- Framer Motion
- Tailwind CSS

Nếu project đang dùng Next.js App Router:

- Component animation phải là client component nếu cần hooks / Framer Motion.
- Không chuyển toàn bộ Hero Section thành client component chỉ vì animation.
- Tách animation thành component riêng.

Ví dụ architecture mong muốn:

components/
└── home/
├── HeroSection.tsx
└── FoodHeroAnimation/
├── FoodHeroAnimation.tsx
├── FoodBowl.tsx
├── Ingredient.tsx
├── CompletedMeal.tsx
└── ingredients.ts

Có thể thay đổi structure nếu project đang có architecture khác tốt hơn.

================================================== 10. STATE MANAGEMENT CỦA ANIMATION
==================================================

Không hard-code một animation khổng lồ trong một file nếu có thể chia nhỏ.

Có thể dùng state:

type AnimationStage =
| "bowl"
| "ingredients"
| "completed";

Hoặc state chi tiết hơn:

type AnimationStage =
| "idle"
| "rotate-one"
| "ingredient-reveal"
| "ingredient-orbit"
| "rotate-two"
| "converge"
| "completed";

Chọn phương án phù hợp nhất với implementation.

================================================== 11. ANIMATION QUALITY
==================================================

Animation phải:

- Smooth
- Premium
- Organic
- Không giật
- Không teleport
- Không hard cut trừ khi intentional
- Không bị overlap khó chịu

Sử dụng:

- stagger
- spring hoặc cubic-bezier
- easeOut
- easeInOut
- opacity
- scale
- translate
- rotate

Tránh:

- linear animation cho mọi thứ
- tất cả element chạy cùng timing
- quá nhiều simultaneous transforms
- continuous infinite rotation cho toàn bộ scene

================================================== 12. RESPONSIVE
==================================================

Desktop:

- Animation lớn, rõ ràng, là visual focal point.

Tablet:

- Scale animation xuống.
- Giảm khoảng cách ingredients.

Mobile:

- Animation vẫn phải hiển thị đẹp.
- Không gây horizontal overflow.
- Không che Hero heading/CTA.
- Có thể đơn giản hóa trajectory.
- Có thể giảm số lượng ingredient nếu performance/layout yêu cầu.

Breakpoint phải dựa trên project hiện tại, không hard-code bất hợp lý.

================================================== 13. ACCESSIBILITY
==================================================

- Nếu animation là decorative:
  - aria-hidden="true"
  - không tạo screen-reader noise.

- Nếu final meal có meaning/content:
  - dùng alt phù hợp ở element semantic tương ứng.

- Không được để animation cản trở thao tác CTA.

================================================== 14. PERFORMANCE
==================================================

Animation nằm trên Hero Section nên performance rất quan trọng.

Ưu tiên:

- GPU-friendly transforms
- transform / opacity
- asset nhỏ vừa đủ
- WebP/SVG
- tránh layout thrashing
- tránh setState quá thường xuyên nếu không cần
- không render thừa hàng loạt DOM

Không dùng:

- heavy 3D
- Three.js
- WebGL
- canvas particle system

trừ khi inspect project cho thấy có lý do thật sự cần.

================================================== 15. REDUCED MOTION
==================================================

Phải hỗ trợ prefers-reduced-motion.

Nếu user bật reduced motion:

- tắt rotation mạnh
- giảm movement
- hoặc hiển thị final state / static bowl.
- Không để animation tự chạy mạnh.

Ví dụ có thể dùng Framer Motion:
useReducedMotion()

================================================== 16. CODE QUALITY
==================================================

Trước khi code:

1. Inspect project structure.
2. Xác định framework.
3. Xác định animation library đã có.
4. Xác định asset hiện tại.
5. Xác định Hero component hiện tại.
6. Xác định style/token hiện tại.

Sau đó mới implementation.

Không:

- cài package mới nếu package tương đương đã tồn tại.
- tạo duplicate utility.
- refactor unrelated code.
- đổi naming convention của project nếu không cần.
- thay đổi business logic.

================================================== 17. VALIDATION
==================================================

Sau khi code:

- chạy lint
- chạy typecheck nếu project có
- chạy build nếu có thể
- kiểm tra console error
- kiểm tra animation loop
- kiểm tra responsive
- kiểm tra overflow
- kiểm tra hydration issue nếu Next.js
- kiểm tra asset path
- kiểm tra reduced motion

Nếu command nào fail:

- xác định nguyên nhân
- sửa nếu liên quan đến thay đổi của bạn
- không che giấu lỗi

================================================== 18. EXPECTED FINAL RESULT
==================================================

Hero sau khi hoàn thành phải có cảm giác:

"Đây là một platform công nghệ về plant-based lifestyle"

chứ không phải:

"Đây là một website có animation trang trí."

Animation phải giúp truyền đạt câu chuyện:

INGREDIENTS
↓
CONNECTION
↓
MEAL
↓
HEALTHY LIFESTYLE

Animation phải hòa hợp với visual hiện tại của VeggieConnect.

================================================== 19. QUY TẮC QUAN TRỌNG NHẤT
==================================================

Nếu thiếu asset mà bạn không thể tự tạo một asset chất lượng phù hợp:

KHÔNG được đoán.
KHÔNG được placeholder âm thầm.
KHÔNG được dùng image random.
KHÔNG được giả định file tồn tại.

Hãy dừng ở dependency đó và báo chính xác asset nào tôi cần cung cấp.

Sau khi implementation hoàn tất, hãy trả report theo format:

IMPLEMENTED

- Files changed:
- Components created:
- Animation flow:
- Assets reused:
- Assets generated:
- Responsive handled:
- Reduced motion handled:
- Validation:
- Remaining issues:

Nếu còn thiếu asset:

BLOCKED BY ASSETS

- Asset cần cung cấp:
- Asset đang được dùng ở phase nào:
- Format:
- Kích thước:
- Background:
- Style yêu cầu:

Không báo "done" nếu animation thực tế chưa thể chạy vì thiếu asset.
