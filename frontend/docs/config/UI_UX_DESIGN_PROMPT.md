# UI/UX DESIGN PROMPT — VeggieConnect

**Version:** 2.0 · **Updated:** 2026-09-18

**Scope source:** `/docs/SRS.md` and `/docs/IMPLEMENTATION_PLAN.md`. Roadmap-only concepts are labeled and must not be presented as current capabilities.

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
- **Đối tượng:** Người ăn chay, người theo truyền thống Phật giáo hoặc Thiên Chúa giáo, người quan tâm sức khoẻ, người chia sẻ kinh nghiệm và Contributor được Admin duyệt. Độ tuổi 18–55+, nhiều người **không rành công nghệ** → UI phải cực kỳ rõ ràng, ít thuật ngữ kỹ thuật.
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
- `contributor` xanh ngọc `#0D9488` — nhãn "Đã được Contributor kiểm chứng".
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
6. **Badge phân biệt nội dung:** `AI ước tính — chưa kiểm chứng` (tím), `Tính từ dữ liệu chuẩn` (xanh lá), và `Đã được Contributor [Tên] kiểm chứng` (xanh ngọc). Không gọi nội dung là “chứng nhận khoa học”.

# 4. Phân quyền (RBAC) — ảnh hưởng UI

| Role | Thấy gì khác |
|---|---|
| Guest | Xem công thức/blog/video đã xuất bản; chatbot trial giới hạn; CTA đăng ký nhẹ nhàng |
| Member | Cá nhân hoá, lưu, đăng nội dung, pantry, custom meal, meal plan và đăng ký Contributor |
| Contributor | Toàn bộ quyền Member + khu vực kiểm chứng AI; mọi Contributor có cùng quyền bất kể approval basis |
| Admin | Duyệt Contributor thủ công, duyệt recipe/handbook/video, moderation, food data, quota và AI governance |

`ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED` chỉ là cách được duyệt, không phải role/subtype. Certificates không được xác minh trong MVP.

# 5. Bản đồ màn hình (Screen Map) — THIẾT KẾ TẤT CẢ

> Với mỗi màn hình: đưa ra **layout, các thành phần, trạng thái, tương tác chính** và **luồng đi tiếp**. Tạo nhiều biến thể (mobile + desktop) cho màn quan trọng.

## 5.1. Nhóm AUTH (UC-01)

1. **Splash / Onboarding** (3–4 slide giới thiệu giá trị: cộng đồng, dinh dưỡng, bản đồ, AI).
2. **Đăng nhập** (email/mật khẩu + OAuth Google/Apple, quên mật khẩu, đăng ký).
3. **Đăng ký** — chia bước rõ: tài khoản → xác thực OTP/email → **khai báo chế độ ăn** (bước quan trọng).
4. **Khai báo chay lần đầu (Diet Setup):**
   - Tách ba field: `dietPattern`, `practiceSchedule`, `tradition`.
   - Tradition MVP: **Phật giáo** / **Thiên Chúa giáo** / Không chọn. Không suy diễn tôn giáo từ hành vi.
   - Sau khi chọn, hiển thị bộ rule mặc định có source/version để user xác nhận và toggle từng rule; allergy và explicit exclusion luôn là hard constraint.
   - Nếu `PERIODIC`, cho chọn lịch áp dụng rõ ràng theo ngày/timezone; không tự giả định lịch tôn giáo.
5. **Xác thực email / OTP** (nhập 6 ô, đếm ngược gửi lại, xử lý lỗi resend).
6. **Quên / Đặt lại mật khẩu**.
7. **Hoàn tất hồ sơ sức khoẻ** (dẫn sang UC-13).

## 5.2. Nhóm TRANG CHỦ & KHÁM PHÁ (UC-04, UC-14)

8. **Trang chủ (HomeFeed)** — mobile & desktop:
   - Greeting theo giờ + theo trường phái ("Chào buổi sáng, hôm nay mùng 1 — gợi ý món chay thanh tịnh cho bạn").
   - **Section "Gợi ý cho bạn hôm nay"** (cá nhân hoá theo hành vi — có nút vì sao gợi ý / ẩn gợi ý).
   - Video nổi bật và quán gần đây. Section món theo mùa/vùng miền chỉ là concept Roadmap Phase 2, phải có nhãn hướng phát triển.
   - Nút nổi (FAB) gợi ý AI "Hôm nay ăn gì?".
9. **Tìm kiếm & Khám phá** — search full-text tiếng Việt có dấu; filter theo diet pattern/tradition rule, calo, thời gian nấu và nguyên liệu; chip dễ chạm; season/region là Roadmap Phase 2.
10. **Danh sách Blog/Công thức** (list/grid + card có ảnh lớn, badge phân loại, thời gian nấu, calo, rating).
11. **Chi tiết Công thức/Bài viết** — ảnh hero, nguyên liệu định lượng, structured cooking steps, dinh dưỡng raw/cooking-adjusted theo serving, provenance/confidence/range/unknown coverage, badge kiểm chứng, comment & vote, nút lưu/chia sẻ.
12. **Danh sách Video + Chi tiết Video** — player phù hợp contract, trạng thái duyệt và report. Transcript/tóm tắt AI chỉ là frame nghiên cứu Roadmap Phase 2, không gắn nhãn đang hoạt động.
13. **Upload Video dạy nấu** — reserve quota → chọn file/upload → commit/release, progress, dung lượng còn lại, trạng thái `Bản nháp → Đã gửi duyệt → Được duyệt/Từ chối`; không tuyên bố có DMCA/fingerprinting.
14. **Tạo / Sửa bài viết** — editor markdown, chọn danh mục, ảnh bìa, chọn trường phái chay áp dụng, trạng thái chờ kiểm duyệt.

## 5.3. Nhóm DINH DƯỠNG CÁ NHÂN (UC-06, UC-13)

15. **Hồ sơ sức khoẻ (Health Profile)**:
    - MVP: card nhập tay chiều cao, cân nặng, tuổi, giới và mức vận động; hiển thị BMI/BMR/TDEE cùng công thức, đơn vị và disclaimer.
    - HealthKit / Health Connect / wearable / cảm biến điện thoại là Roadmap Phase 2. Nếu tạo mock nghiên cứu phải dán nhãn “Hướng phát triển”, không mô tả như đã đồng bộ.
16. **Tạo thực đơn tuần** — chọn mục tiêu, xem trước 7 ngày × 3 bữa; thêm recipe hoặc private custom meal; đổi món; hiển thị warning về portion/daily limit/tương tác giữa món; hard constraints không bao giờ được nới.
17. **AI Meal Planner (cá nhân hoá theo hành vi — UC-08)**:
    - Nút "Tạo thực đơn bằng AI", hiện **lý giải cá nhân hoá** ("Vì bạn hay hỏi món đậu hũ và đã lưu 3 món nấm...").
    - Nút "Tạo lại" + feedback nhanh dạng chip ("ít cay hơn", "nhiều đạm hơn", "hợp chay Phật giáo hơn").
    - Công tắc **"Cá nhân hoá theo hành vi"** (bật/tắt) + link "Dữ liệu hành vi của tôi".
    - Trạng thái cold-start giải thích rõ.
18. **Danh sách thực đơn đã lưu / Lịch sử** và **chương trình nhiều tuần** — timeline tuần, draft/confirmed, repeated-pattern/cumulative warnings, version conflict.

## 5.4. Nhóm AI

19. **AI Chatbot dinh dưỡng (UC-07)** — giao diện chat, streaming trả lời (hiệu ứng gõ), câu trả lời có **trích dẫn công thức**, disclaimer cố định, gợi ý câu hỏi mẫu, nút 👍/👎 + "báo sai", guest bị giới hạn → CTA đăng ký khi hết quota (429).
20. **Pantry + nhận diện nguyên liệu qua ảnh tủ lạnh** — chọn nhiều ảnh, tiến trình job, candidate dedupe dạng chip có confidence, ước lượng amount/unit và freshness observation; user sửa/xác nhận/từ chối trước khi cập nhật pantry. Không dùng câu “an toàn để ăn”.
21. **Trung tâm gợi ý / "Vì sao tôi thấy gợi ý này?"** — minh bạch lý do gợi ý, nút tắt cá nhân hoá.
22. **Phân tích hóa đơn** — ảnh hóa đơn, các dòng candidate/quantity/unit/confidence, edit/reject/confirm; chỉ sau confirm mới cập nhật pantry.
23. **Danh sách cần mua** — so sánh required/available/missing theo các món đã chọn, servings, unresolved conversions và assumptions.

## 5.5. Nhóm BẢN ĐỒ & QUÁN ĂN (UC-12 — Google Maps Platform)

24. **Bản đồ quán chay** (mobile & desktop):
    - Bản đồ toàn màn hình (Maps SDK) + bottom sheet danh sách quán kéo lên.
    - Marker quán, cluster khi nhiều, card quán (ảnh, rating, khoảng cách, badge trường phái chay, giờ mở cửa, "đã xác minh").
    - Thanh search theo tên món/tên quán; bộ lọc theo trường phái chay/khoảng cách/giá.
    - Nút **"Chỉ đường"** (mở Directions/Google Maps).
    - Xử lý: user từ chối quyền vị trí → nhập địa chỉ thủ công (Geocoding); hết quota API → chế độ offline bản đồ + banner.
25. **Chi tiết quán** — gallery, menu, giờ mở cửa, đánh giá, quán tương tự, CTA gọi điện/chỉ đường/lưu.
26. **Thêm/Đề xuất quán** (user đóng góp) + form địa chỉ có autocomplete.

## 5.6. Nhóm MEMBER & CUSTOM MEAL

27. **Tạo/Sửa custom meal riêng tư** — serving, nguyên liệu định lượng, nhiều ảnh, notes, source note, tag tự do (ví dụ `shopee`). Tag chỉ là metadata, không hiển thị giá/nút mua từ dịch vụ ngoài.
28. **Thêm món vào plan** — chọn recipe đã duyệt hoặc custom meal, chỉnh portion, xem warning tương thích với món khác và chế độ ăn.
29. **Dashboard nội dung của tôi** — recipe/handbook/video/custom meal, trạng thái nháp/chờ duyệt/được duyệt/từ chối, storage usage.

## 5.7. Nhóm CONTRIBUTOR THỐNG NHẤT

30. **Hàng chờ kiểm chứng AI (Contributor Review Queue)** — artifact đủ điều kiện, filter theo loại/rủi ro/status; không phân queue theo approval basis.
31. **Màn hình kiểm chứng** — AI output bất biến, provenance/confidence/assumptions/source context; hành động verify/correct/reject kèm evidence note; cấm self-review và xử lý conflict.
32. **Hồ sơ Contributor** — badge Contributor, approval basis nếu được phép hiển thị, lịch sử nội dung/verification; không badge chứng chỉ trong MVP.
33. **Form đăng ký Contributor** — user có thể claim `ORGANIZATION_AFFILIATION` hoặc `PLATFORM_TRACK_RECORD`, nhập mô tả/reference links; `ADMIN_INVITED` chỉ xuất hiện trong luồng Admin. Luôn hiển thị “quyền chỉ được cấp sau khi Admin duyệt”.

## 5.8. Nhóm CÁ NHÂN (Profile & Settings)

34. **Trang cá nhân** — avatar, role, diet summary, health summary, storage meter, tab bài viết/đã lưu/thực đơn/đóng góp.
35. **Chỉnh sửa hồ sơ** + đổi diet pattern/practice schedule/tradition và reconfirm rule toggles.
36. **Cài đặt & Quyền riêng tư** — consent sức khoẻ/cá nhân hoá/location/images/receipts, xoá lịch sử hành vi, data deletion, dark mode, thông báo.
37. **Thông báo** — nhóm theo loại, unread/read, empty/error/offline.
38. **Tìm kiếm người dùng / Xem hồ sơ người khác** + theo dõi (nếu contract sau này được duyệt).

## 5.9. Nhóm ADMIN CMS

39. **Admin Dashboard tổng quan** — KPI: nội dung chờ duyệt, người dùng mới, storage usage, AI failure/latency và sự cố.
40. **Duyệt nội dung** — recipe/handbook/video chung state machine; AI flag/report chỉ là signal; Admin approve/reject/hide/restore với reason.
41. **Duyệt Contributor** — xem application, activity/reference context, chọn final approval basis, approve/reject/revoke; không xem/chọn subtype hoặc chứng chỉ.
42. **Quản lý food data** — canonical nutrient provenance/version, import preview, cooking factors, reference limits và evidence-graded interaction rules.
43. **Quản lý storage** — policy, usage/reservation, audited adjustment và reconciliation status; không có payment.
44. **Giám sát AI Models** — request/failure/latency/cost metadata, confidence/coverage/correction metrics, redacted logs và feature/provider toggle với fallback.
45. **Quản lý người dùng, quán ăn, categories và audit log**.

# 6. Luồng người dùng quan trọng cần vẽ flow hoàn chỉnh

1. **Onboarding → khai báo trường phái chay → hồ sơ sức khoẻ → thực đơn đầu tiên** (first value nhanh).
2. **Chat AI → lưu món → AI tự gợi ý thực đơn** (vòng lặp hành vi).
3. **Upload video → reserve/commit dung lượng → gửi duyệt → Admin duyệt/từ chối.**
4. **Mở bản đồ → tìm quán → chỉ đường.**
5. **Nhiều ảnh tủ lạnh → sửa/xác nhận candidate → pantry → chọn món → compatibility analysis → shopping gaps.**
6. **Hóa đơn → sửa/xác nhận → pantry update → danh sách cần mua.**
7. **Người dùng chia sẻ AI artifact → Contributor kiểm chứng → Admin override nếu cần.**
8. **Guest bị giới hạn quota → CTA đăng ký.**

# 7. Yêu cầu đầu ra (Deliverables)

1. **Design System page**: tokens màu (light/dark), typography, spacing, buttons, inputs, chips, badge (AI/Canonical/Contributor verified), confidence/provenance, warning severity, quota meter, card, modal, toast, skeleton, empty state, bottom nav, sidebar.
2. **Wireframe (low-fi)** cho tất cả màn hình ở mục 5, có chú thích luồng.
3. **High-fidelity UI** cho các màn trọng tâm: Trang chủ, Chi tiết công thức/nutrition provenance, Meal Planner/compatibility, Pantry/fridge confirmation, Chatbot, Bản đồ, Contributor Review Queue, Admin Dashboard — **cả mobile và desktop**.
4. **Prototype clickable** cho 8 luồng ở mục 6.
5. Với mỗi màn hình ghi chú: **mục đích, thành phần, trạng thái (loading/empty/error), hành vi responsive, microcopy tiếng Việt đề xuất.**

# 8. Nguyên tắc bắt buộc khi thiết kế

- **Mobile-first**, một tay, nút chạm ≥ 44px, nội dung quan trọng nằm nửa dưới màn hình.
- **AI luôn minh bạch:** mọi output AI có badge + disclaimer + lý giải + cơ chế báo sai.
- **Phân biệt rõ nội dung:** canonical calculation / AI estimate / user-provided / Contributor verified — không gây hiểu nhầm về độ chính xác.
- **Tôn trọng tôn giáo:** Phật giáo và Thiên Chúa giáo là các tradition MVP ngang nhau; user tự xác nhận/toggle rule; không mặc định truyền thống nào là “chuẩn”.
- **Nhạy cảm sức khoẻ:** không chẩn đoán bệnh, dùng ngôn ngữ tham khảo, không gây hoảng loạn.
- **Confirmation boundary:** ảnh tủ lạnh/hóa đơn không được cập nhật pantry trước khi user xác nhận.
- **Roadmap honesty:** wearable, video summary, certificate, payment và DMCA chỉ được vẽ như future concept có nhãn rõ.
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

- **Thứ tự ưu tiên nếu thiếu thời gian:** Auth/Diet Setup → Trang chủ → Chi tiết công thức/nutrition → Meal Planner → Pantry/Fridge/Receipt → AI Chatbot → Bản đồ → Contributor Queue → Admin Dashboard.
- **Khi AI design ra kết quả sai token màu:** nhắc lại nguyên văn mục 3.1 và yêu cầu "dùng đúng token, không đổi primary `#2563EB`".
- **Nếu tool sinh code (v0/Lovable):** nhắc thêm "xuất Tailwind v4 + shadcn/ui, giữ nguyên biến CSS trong `globals.css`, dùng Lucide icons".
