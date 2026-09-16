# UI/UX DESIGN PROMPT — VeggieConnect

## Prompt dành cho AI Design (v0 / Lovable / Figma Make / Claude Artifacts / Framer AI...)

> **Cách dùng:** Copy toàn bộ nội dung trong khối `=== BẮT ĐẦU PROMPT ===` … `=== KẾT THÚC PROMPT ===` bên dưới, dán vào AI design tool.
> Nếu tool có giới hạn độ dài, dán theo từng PHẦN (A → B → C) và nói "tiếp tục phần trước, giữ nguyên design system".
> Giao diện/brand: **VeggieConnect** — nền tảng cộng đồng + dinh dưỡng + bản đồ cho người ăn chay tại Việt Nam.

---

=== BẮT ĐẦU PROMPT ===

# Vai trò

Bạn là **Senior Product Designer (UI/UX)** chuyên thiết kế sản phẩm mobile-first cho thị trường Việt Nam. Hãy thiết kế **toàn bộ UI/UX cho hệ thống VeggieConnect** — một ứng dụng hỗ trợ người ăn chay (mạng xã hội công thức + công cụ dinh dưỡng cá nhân hoá + bản đồ quán chay + hệ sinh thái AI).

# 1. Thông tin sản phẩm (Product Context)

- **Tên:** VeggieConnect.
- **Ngôn ngữ:** Tiếng Việt là ngôn ngữ chính (100% copy tiếng Việt, có dấu). Chuẩn bị sẵn cấu trúc i18n cho tiếng Anh.
- **Nền tảng:** Responsive Web (desktop ≥1280px, tablet, mobile web) + Native Mobile App cảm giác (iOS/Android). **Ưu tiên thiết kế mobile-first**, sau đó mở rộng desktop.
- **Đối tượng:** Người ăn chay/phật tử/đạo giáo, người quan tâm sức khoẻ, food blogger chay, chuyên gia dinh dưỡng. Độ tuổi 18–55+, nhiều người **không rành công nghệ** → UI phải cực kỳ rõ ràng, ít thuật ngữ kỹ thuật.
- **Bối cảnh sử dụng:** mạng 3G/4G phổ biến, thường dùng 1 tay trên điện thoại, đôi khi ngoài đường/trong quán → tối ưu tốc độ đọc, nút to, không phụ thuộc hover.

# 2. Tính cách thương hiệu & Phong cách hình ảnh

- **Từ khoá thương hiệu:** thiên nhiên, thanh tịnh, ấm áp, lành mạnh, đáng tin cậy, cộng đồng, từ bi (không phán xét chế độ ăn của người khác).
- **Cảm giác:** tươi mát, nhiều khoảng trắng, ảnh món ăn thật (food photography) là nhân vật chính.
- **Tránh:** cảm giác "y tế lạnh lẽo", màu đỏ gắt, icon lá cây sến/lặp lại quá nhiều, chữ quá nhỏ.
- **Bo góc:** mềm (radius ~10–16px). **Bóng đổ:** nhẹ, tự nhiên. **Viền:** mảnh 1px màu xám nhạt.

# 3. Design System (BẮT BUỘC tuân thủ)

> Đây là token đang dùng trong code (Tailwind v4 + shadcn/ui). Hãy thiết kế **bám sát token này**, chỉ gợi ý mở rộng thêm nếu cần.

## 3.1. Màu sắc (Light mode)

| Token              | Hex       | Dùng cho                |
| ------------------ | --------- | ----------------------- |
| background         | `#F8FAFC` | nền app                 |
| foreground         | `#0F172A` | chữ chính               |
| card               | `#FFFFFF` | nền card/sheet          |
| primary            | `#2563EB` | CTA chính, link, active |
| primary-foreground | `#FFFFFF` | chữ trên primary        |
| secondary          | `#F1F5F9` | nền phụ, chip           |
| muted-foreground   | `#64748B` | chữ phụ, caption        |
| destructive        | `#EF4444` | cảnh báo, xoá, từ chối  |
| border             | `#E2E8F0` | viền                    |
| ring               | `#3B82F6` | focus ring              |

**Màu ngữ nghĩa bổ sung (thiết kế thêm, giữ tương phản WCAG AA):**

- `success` xanh lá `#16A34A` — đã kiểm chứng, đã duyệt, healthy.
- `warning` hổ phách `#F59E0B` — chờ duyệt, cảnh báo AI độ tin cậy thấp.
- `ai` tím `#7C3AED` — mọi thứ do AI tạo (badge "AI gợi ý").
- `expert` xanh ngọc `#0D9488` — nhãn "Đã kiểm chứng bởi chuyên gia".
- `vegan-green` `#15803D` — accent thương hiệu cho header/hero (bổ trợ primary).
- **Dark mode** phải được thiết kế song song (nền `#090D16`, card `#111827`, primary `#3B82F6`).

## 3.2. Typography

- Font đề xuất: **Be Vietnam Pro** (hỗ trợ tiếng Việt tốt) hoặc Inter.
- Thang bậc: Display 32/40, H1 28/36, H2 22/30, H3 18/26, Body 15/24, Caption 13/18, Tiny 11/16.
- Chữ tối thiểu trên mobile 14px cho body; không dùng chữ nhạt khó đọc trên nền màu.

## 3.3. Spacing & Layout

- Grid 4px. Padding màn hình mobile 16px; desktop content max-width 1280px.
- Bottom navigation mobile: 5 tab (Trang chủ, Khám phá, Chat AI, Bản đồ, Cá nhân).
- Desktop: sidebar trái (thu gọn được) + topbar.

## 3.4. Component library

Dùng chuẩn **shadcn/ui + Lucide icons**. Cần thể hiện đủ các state: default / hover / active / focus / disabled / loading / error / empty.

## 3.5. Accessibility

- Chuẩn **WCAG 2.1 AA**: contrast ≥ 4.5:1 cho text, focus ring rõ, target chạm ≥ 44x44px, có nhãn cho icon-only button, hỗ trợ phóng to chữ.

## 3.6. Trạng thái bắt buộc cho MỌI màn hình

1. **Loading** (skeleton, không spinner trắng trơn) — đặc biệt AI có thể 2–8s.
2. **Empty state** (minh hoạ + câu hướng dẫn + CTA).
3. **Error state** (thông báo dễ hiểu + nút "Thử lại", không lộ mã lỗi kỹ thuật).
4. **Offline/3G chậm** (banner nhẹ).
5. **Disclaimer AI (bắt buộc, cố định):** "Thông tin mang tính tham khảo, không thay thế tư vấn từ chuyên gia dinh dưỡng/bác sĩ."
6. **Badge phân biệt nội dung:** `AI gợi ý — chưa kiểm chứng` (tím) vs `Đã kiểm chứng bởi Chuyên gia [Tên]` (xanh ngọc). Tuyệt đối không dùng nhãn expert cho nội dung chưa duyệt.

# 4. Phân quyền (RBAC) — ảnh hưởng UI

| Role                                     | Thấy gì khác                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Guest (chưa đăng nhập)                   | Xem công thức/blog/video/bản đồ; chatbot trial giới hạn; CTA đăng ký nhẹ nhàng              |
| Người dùng (AUTHORIZED_USER)             | Đầy đủ tính năng cá nhân hoá, lưu, đăng bài, menu                                           |
| Người có kinh nghiệm (EXPERIENCED_COOK)  | Thêm nút "Tạo món ăn", "Tạo thực đơn cộng đồng"; badge `Người đóng góp`                     |
| Chuyên gia dinh dưỡng (NUTRITION_EXPERT) | Thêm khu vực **Kiểm chứng AI** (duyệt/sửa/từ chối nội dung); badge `Chuyên gia` (xanh ngọc) |
| Admin                                    | Admin CMS: duyệt nội dung, duyệt role, giám sát AI, dashboard                               |

# 5. Bản đồ màn hình (Screen Map) — THIẾT KẾ TẤT CẢ

> Với mỗi màn hình: đưa ra **layout, các thành phần, trạng thái, tương tác chính** và **luồng đi tiếp**. Tạo nhiều biến thể (mobile + desktop) cho màn quan trọng.

## 5.1. Nhóm AUTH (UC-01)

1. **Splash / Onboarding** (3–4 slide giới thiệu giá trị: cộng đồng, dinh dưỡng, bản đồ, AI).
2. **Đăng nhập** (email/mật khẩu + OAuth Google/Apple, quên mật khẩu, đăng ký).
3. **Đăng ký** — chia bước rõ: tài khoản → xác thực OTP/email → **khai báo chế độ ăn** (bước quan trọng).
4. **Khai báo chay lần đầu (Diet Setup):**
   - Chọn `Trường phái chay`: **Phật giáo** / **Đạo giáo (Cao Đài)** / Không theo tôn giáo — dùng card có minh hoạ + mô tả ngắn (Phật giáo: kiêng thịt cá, tuỳ chọn kiêng **Ngũ vị tân** gồm hành, hẹ, tỏi, kiệu, hưng cừ; Đạo giáo/Cao Đài: kiêng theo giới luật + có **lịch chay kỳ** mùng 1, rằm...).
   - Chọn `Chế độ`: chay trường / chay kỳ / vegan / lacto-ovo.
   - Chọn ngày chay kỳ (nếu có) bằng date picker trực quan theo âm lịch (hiển thị cả dương lịch).
5. **Xác thực email / OTP** (nhập 6 ô, đếm ngược gửi lại, xử lý lỗi resend).
6. **Quên / Đặt lại mật khẩu**.
7. **Hoàn tất hồ sơ sức khoẻ** (dẫn sang UC-13).

## 5.2. Nhóm TRANG CHỦ & KHÁM PHÁ (UC-04, UC-14)

8. **Trang chủ (HomeFeed)** — mobile & desktop:
   - Greeting theo giờ + theo trường phái ("Chào buổi sáng, hôm nay mùng 1 — gợi ý món chay thanh tịnh cho bạn").
   - **Section "Gợi ý cho bạn hôm nay"** (cá nhân hoá theo hành vi — có nút vì sao gợi ý / ẩn gợi ý).
   - Section món theo mùa/vùng miền, video nổi bật, quán gần đây.
   - Nút nổi (FAB) gợi ý AI "Hôm nay ăn gì?".
9. **Tìm kiếm & Khám phá** — search full-text tiếng Việt có dấu; filter theo: trường phái chay, chế độ, calo, thời gian nấu, mùa/vùng, nguyên liệu; chip filter dễ chạm; gợi ý từ khoá khi không có kết quả.
10. **Danh sách Blog/Công thức** (list/grid + card có ảnh lớn, badge phân loại, thời gian nấu, calo, rating).
11. **Chi tiết Công thức/Bài viết** — ảnh hero, nguyên liệu (có nút thêm vào giỏ/tủ lạnh), các bước dạng step, dinh dưỡng (BMI-friendly), badge kiểm chứng, comment & vote, nút lưu chia sẻ.
12. **Danh sách Video + Chi tiết Video** — player HLS, **tóm tắt công thức do AI sinh** (có badge AI + nút báo sai), transcript, nguyên liệu trích xuất.
13. **Upload Video dạy nấu** — kéo thả / chọn file, hiện tiến trình upload (resume), trạng thái `Đang xử lý → Sẵn sàng`, thông báo khi xong.
14. **Tạo / Sửa bài viết** — editor markdown, chọn danh mục, ảnh bìa, chọn trường phái chay áp dụng, trạng thái chờ kiểm duyệt.

## 5.3. Nhóm DINH DƯỠNG CÁ NHÂN (UC-06, UC-13)

15. **Hồ sơ sức khoẻ (Health Profile)**:
    - Card nhập chiều cao, cân nặng, vòng eo, tuổi, giới, mức vận động.
    - **Nguồn dữ liệu hiển thị rõ:** HealthKit / Google Fit / Health Connect / **Cảm biến điện thoại** / Nhập tay.
    - Flow "Kết nối ứng dụng sức khoẻ" (Tầng 1) + fallback thông minh: nếu không kết nối được → màn hình giải thích và mời **dùng cảm biến điện thoại** (đếm bước, vận động, nhịp tim) kèm nhập thủ công các chỉ số còn thiếu.
    - Cảnh báo độ tin cậy: "TDEE ước tính từ cảm biến — độ chính xác thấp hơn HealthKit."
    - Hiển thị kết quả: **BMI** (thang màu phân loại châu Á), **BMR, TDEE, WHtR** dạng vòng gauge trực quan + giải thích ngắn ngôn ngữ dễ hiểu.
16. **Tạo thực đơn tuần (rule-based)** — chọn calo mục tiêu/mục tiêu cân nặng, xem trước 7 ngày × 3–4 bữa dạng lịch; kéo-thả đổi món; cảnh báo khi phải nới lọc trường phái.
17. **AI Meal Planner (cá nhân hoá theo hành vi — UC-08)**:
    - Nút "Tạo thực đơn bằng AI", hiện **lý giải cá nhân hoá** ("Vì bạn hay hỏi món đậu hũ và đã lưu 3 món nấm...").
    - Nút "Tạo lại" + feedback nhanh dạng chip ("ít cay hơn", "nhiều đạm hơn", "hợp chay Phật giáo hơn").
    - Công tắc **"Cá nhân hoá theo hành vi"** (bật/tắt) + link "Dữ liệu hành vi của tôi".
    - Trạng thái cold-start giải thích rõ.
18. **Danh sách thực đơn đã lưu / Lịch sử**.

## 5.4. Nhóm AI

19. **AI Chatbot dinh dưỡng (UC-07)** — giao diện chat, streaming trả lời (hiệu ứng gõ), câu trả lời có **trích dẫn công thức**, disclaimer cố định, gợi ý câu hỏi mẫu, nút 👍/👎 + "báo sai", guest bị giới hạn → CTA đăng ký khi hết quota (429).
20. **Nhận diện nguyên liệu qua ảnh tủ lạnh (UC-09)** — camera/thư viện, kết quả detect dạng chip có **độ tin cậy** (thấp → viền vàng + "vui lòng xác nhận lại"), chỉnh/sửa/thêm nguyên liệu, gợi ý món từ nguyên liệu sẵn có.
21. **Trung tâm gợi ý / "Vì sao tôi thấy gợi ý này?"** — minh bạch lý do gợi ý, nút tắt cá nhân hoá.

## 5.5. Nhóm BẢN ĐỒ & QUÁN ĂN (UC-12 — Google Maps Platform)

22. **Bản đồ quán chay** (mobile & desktop):
    - Bản đồ toàn màn hình (Maps SDK) + bottom sheet danh sách quán kéo lên.
    - Marker quán, cluster khi nhiều, card quán (ảnh, rating, khoảng cách, badge trường phái chay, giờ mở cửa, "đã xác minh").
    - Thanh search theo tên món/tên quán; bộ lọc theo trường phái chay/khoảng cách/giá.
    - Nút **"Chỉ đường"** (mở Directions/Google Maps).
    - Xử lý: user từ chối quyền vị trí → nhập địa chỉ thủ công (Geocoding); hết quota API → chế độ offline bản đồ + banner.
23. **Chi tiết quán** — gallery, menu, giờ mở cửa, đánh giá, quán tương tự, CTA gọi điện/chỉ đường/lưu.
24. **Thêm/Đề xuất quán** (user đóng góp) + form địa chỉ có autocomplete.

## 5.6. Nhóm NGƯỜI CÓ KINH NGHIỆM (UC-16)

25. **Tạo / Sửa Món ăn cộng đồng** — form nguyên liệu định lượng, các bước, ảnh/video, calo ước tính, chọn `dietSchool`, mùa/vùng, độ khó; nút "Gửi Chuyên gia kiểm chứng".
26. **Tạo Thực đơn cộng đồng** — ghép món có sẵn + món tự tạo, ghi chú đối tượng phù hợp.
27. **Dashboard Người đóng góp** — thống kê món đã đăng, rating, lượt lưu, trạng thái kiểm chứng (`Chưa kiểm chứng / Chờ duyệt / Đã kiểm chứng / Bị từ chối`), uy tín.

## 5.7. Nhóm CHUYÊN GIA DINH DƯỠNG (UC-17)

28. **Hàng chờ kiểm chứng AI (Expert Review Queue)** — danh sách nội dung AI bị báo sai/chờ duyệt, filter theo loại/mức rủi ro.
29. **Màn hình kiểm chứng** — hiển thị nội dung AI + nguồn RAG + công thức gốc + lý do nghi ngờ; 3 hành động lớn: **Phê duyệt / Chỉnh sửa (có ghi chú chuyên môn) / Từ chối (có lý do)**; trạng thái "Cần ý kiến chuyên gia thứ hai".
30. **Hồ sơ công khai của Chuyên gia** — bằng cấp, món đã kiểm chứng, badge `EXPERT_VERIFIED`.
31. **Form đăng ký trở thành Chuyên gia / Người có kinh nghiệm** — upload bằng cấp/chứng chỉ (Chuyên gia) hoặc mô tả kinh nghiệm + link món (Người có kinh nghiệm); trạng thái chờ Admin duyệt (SLA 3 ngày).

## 5.8. Nhóm CÁ NHÂN (Profile & Settings)

32. **Trang cá nhân** — avatar, badge role, trường phái chay, chỉ số sức khoẻ tóm tắt, tab: bài viết / đã lưu / thực đơn / đóng góp.
33. **Chỉnh sửa hồ sơ** + đổi trường phái chay/chế độ.
34. **Cài đặt & Quyền riêng tư** — consent riêng từng mục (sức khoẻ, cá nhân hoá hành vi), **"Dữ liệu hành vi của tôi"**, nút **"Xoá dữ liệu của tôi"** (right to erasure) có xác nhận 2 bước; ngôn ngữ; dark mode; thông báo.
35. **Thông báo** — nhóm theo loại (xã hội, AI, hệ thống/duyệt).
36. **Tìm kiếm người dùng / Xem hồ sơ người khác** + theo dõi.

## 5.9. Nhóm ADMIN CMS

37. **Admin Dashboard tổng quan** — KPI: nội dung chờ duyệt, người dùng mới, chi phí AI, sự cố.
38. **Duyệt nội dung (Moderation)** — hàng chờ `FLAGGED`, xem lý do AI, **Approve/Reject**, chuyển Chuyên gia kiểm chứng nội dung dinh dưỡng; ghi chú override.
39. **Duyệt vai trò** — hồ sơ xin lên Experienced/Expert, xem chứng chỉ, duyệt/từ chối.
40. **Giám sát AI Models (UC-15)** — biểu đồ request/chi phí/latency/lỗi/fallback, accuracy CV theo thời gian, tỷ lệ Expert verify & Admin override; nút **"Đóng băng tính năng AI"** (feature toggle) có cảnh báo.
41. **Quản lý người dùng** — tìm, xem, khoá, thu hồi role.
42. **Quản lý quán ăn & nội dung địa điểm**.
43. **Audit log / Nhật ký can thiệp AI** — ai, khi nào, lý do.

# 6. Luồng người dùng quan trọng cần vẽ flow hoàn chỉnh

1. **Onboarding → khai báo trường phái chay → hồ sơ sức khoẻ → thực đơn đầu tiên** (first value nhanh).
2. **Chat AI → lưu món → AI tự gợi ý thực đơn** (vòng lặp hành vi).
3. **Upload video → AI tóm tắt → Chuyên gia kiểm chứng → hiển thị nhãn verified.**
4. **Mở bản đồ → tìm quán → chỉ đường.**
5. **Người dùng báo AI sai → vào hàng chờ → Chuyên gia xử lý → phản hồi cải thiện model.**
6. **Guest bị giới hạn quota → CTA đăng ký.**

# 7. Yêu cầu đầu ra (Deliverables)

1. **Design System page**: tokens màu (light/dark), typography, spacing, buttons, inputs, chips, badge (AI/Expert/Verified), card, modal, toast, skeleton, empty state, bottom nav, sidebar.
2. **Wireframe (low-fi)** cho tất cả màn hình ở mục 5, có chú thích luồng.
3. **High-fidelity UI** cho các màn trọng tâm: Trang chủ, Chi tiết công thức, Hồ sơ sức khoẻ, AI Meal Planner, Chatbot, Bản đồ quán, Expert Review Queue, Admin Dashboard — **cả mobile và desktop**.
4. **Prototype clickable** cho 6 luồng ở mục 6.
5. Với mỗi màn hình ghi chú: **mục đích, thành phần, trạng thái (loading/empty/error), hành vi responsive, microcopy tiếng Việt đề xuất.**

# 8. Nguyên tắc bắt buộc khi thiết kế

- **Mobile-first**, một tay, nút chạm ≥ 44px, nội dung quan trọng nằm nửa dưới màn hình.
- **AI luôn minh bạch:** mọi output AI có badge + disclaimer + lý giải + cơ chế báo sai.
- **Phân biệt rõ nội dung:** AI / Cộng đồng / Đã kiểm chứng chuyên gia — không gây hiểu nhầm.
- **Tôn trọng tôn giáo:** trường phái Phật giáo và Đạo giáo là bình đẳng, không mặc định coi chay Phật giáo là "chuẩn"; copy trung tính, tôn trọng.
- **Nhạy cảm sức khoẻ:** không chẩn đoán bệnh, dùng ngôn ngữ tham khảo, không gây hoảng loạn.
- **Tối ưu 3G/4G:** ảnh nén, lazy-load, skeleton, thao tác chính hoạt động được khi mạng chậm.
- **Accessibility WCAG 2.1 AA** xuyên suốt.

# 9. Định dạng trả lời mong muốn

- Trình bày theo thứ tự: (1) Design System → (2) danh sách màn hình kèm wireframe → (3) high-fi các màn trọng tâm → (4) flow → (5) ghi chú microcopy/trạng thái.
- Ưu tiên tạo **artifact/frame thực tế** có thể click nếu tool hỗ trợ; nếu không, tạo mô tả chi tiết + ASCII/mock layout.
- Cuối cùng liệt kê **checklist màn hình** đã hoàn thành để dễ theo dõi tiến độ.

Hãy bắt đầu bằng **Design System** (mục 7.1) trước, sau đó lần lượt thiết kế từng màn hình theo mục 5. Hỏi lại tôi nếu cần làm rõ bất kỳ nhóm chức năng nào trước khi tiếp tục.

=== KẾT THÚC PROMPT ===

---

## Ghi chú dùng prompt (không copy vào AI)

- **Thứ tự ưu tiên nếu thiếu thời gian:** Auth/Diet Setup → Trang chủ → Chi tiết công thức → Hồ sơ sức khoẻ → AI Chatbot/Meal Planner → Bản đồ → Expert Queue → Admin Dashboard.
- **Khi AI design ra kết quả sai token màu:** nhắc lại nguyên văn mục 3.1 và yêu cầu "dùng đúng token, không đổi primary `#2563EB`".
- **Nếu tool sinh code (v0/Lovable):** nhắc thêm "xuất Tailwind v4 + shadcn/ui, giữ nguyên biến CSS trong `globals.css`, dùng Lucide icons".
