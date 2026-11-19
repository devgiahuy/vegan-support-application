# Bộ ôn bảo vệ nghiệp vụ — Vegan Support Application

**Đối chiếu:** 08/11/2026, nhánh `dev`, `HEAD 0feaca2` trước thay đổi tài liệu này. Đây là kiểm tra tĩnh source và registry, không phải bằng chứng đã chạy end-to-end trên môi trường chấm. Các nhánh khác có thể chứa code khác; kiểm tra lại `git status` và commit trước demo.

**Cập nhật 16/11/2026 (bổ sung kỹ thuật):** thêm [chiến lược tổng duyệt](07_CHIEN_LUOC_TONG_DUYET.md), [bản đồ luồng code](08_LUONG_CODE_CHI_TIET.md) và [ngân hàng câu hỏi](09_NGAN_HANG_CAU_HOI.md), đối chiếu `dev` @ `3c6c59c`, SRS 1.8, BACKEND_INTEGRATION 4.78. Ghi chú đính chính: AI recipe draft hiện `READY` (2026-11-07), không còn `IN_PROGRESS` như dòng tổng kết cũ bên dưới; scan ảnh vẫn `IN_PROGRESS`.

> **ĐỌC TRƯỚC — cập nhật 19/11/2026:** dùng [Tổng ôn toàn diện](00_TONG_ON_TOAN_DIEN.md) làm tài liệu chính. Mô hình chế độ ăn đã thay đổi ngày 18/11/2026: bỏ `dietPattern`/`tradition`/lịch ăn, thay bằng bốn quyền `allowEggs`/`allowDairy`/`allowHoney`/`allowFivePungent`. Các tài liệu [01](01_SO_DO_NGHIEP_VU.md), [02](02_LUONG_NGHIEP_VU.md), [13](13_THONG_TIN_CHE_DO_AN.md), [14](14_NOI_DON_GIAN_VE_CHE_DO_AN.md) là snapshot trước thay đổi đó; không dùng phần diet pattern/tradition của chúng khi trả lời hội đồng.

## Đọc theo thứ tự

1. [Sơ đồ và nguyên tắc nghiệp vụ](01_SO_DO_NGHIEP_VU.md): học thuộc tác nhân, các ranh giới an toàn và vòng đời dữ liệu.
2. [Các luồng nghiệp vụ](02_LUONG_NGHIEP_VU.md): diễn giải từng luồng theo mẫu tác nhân → đầu vào → backend quyết định → trạng thái → lỗi.
3. [Câu hỏi và tình huống lỗi](03_HOI_DAP_VA_TINH_HUONG.md): tự trả lời trước khi xem đáp án gợi ý.
4. [Chiến lược 5 buổi và demo](04_CHIEN_LUOC_BAO_VE.md): luyện nói, chuẩn bị dữ liệu và phương án khi demo gặp lỗi.
5. [Khoảng trống cần xử lý](05_KHOANG_TRONG_CANH_BAO.md): kiểm tra lại trước buổi chấm, đặc biệt các chức năng AI và thay đổi local.
6. [Bộ chạy test tay 16 luồng](06_KICH_BAN_TEST_TAY_16_LUONG.md): dữ liệu demo, thao tác, kết quả mong đợi, ca lỗi và mẫu biên bản PASS/FAIL/BLOCKED.
7. [Chiến lược tổng duyệt](07_CHIEN_LUOC_TONG_DUYET.md): định vị 20 giây, 3 phương án demo, fallback matrix, lịch 7 ngày, checklist 24h.
8. [Bản đồ luồng code](08_LUONG_CODE_CHI_TIET.md): request pipeline, auth/refresh, SSE chat, AI recipe draft, scan tủ lạnh/hóa đơn, meal plan, duyệt nội dung, pantry, billing — kèm file để mở.
9. [Ngân hàng câu hỏi](09_NGAN_HANG_CAU_HOI.md): ~80 câu nghiệp vụ/kỹ thuật/bẫy, đáp án 45 giây và file bằng chứng.
10. [Kịch bản nói 2 phút — tạo recipe](10_KICH_BAN_NOI_TAO_RECIPE.md): lời nói từng câu, chỗ dừng mở file, bản rút gọn 45 giây và các câu tuyệt đối tránh.
11. [Luồng hồ sơ Member → tìm kiếm → lọc cứng → xếp hạng](11_LUONG_HO_SO_VA_KHAM_PHA.md): đánh giá sơ đồ Personalized recipe discovery, constraint, composition, consent và kịch bản 90 giây.
12. [Kịch bản nói 2 phút — khám phá cá nhân hóa](12_KICH_BAN_NOI_KHAM_PHA.md): lời nói từng câu, chỗ dừng mở file, bản 45 giây và các câu tuyệt đối tránh.
13. [Các loại thông tin ăn chay của User](13_THONG_TIN_CHE_DO_AN.md): giải thích DietPattern, PracticeSchedule, Tradition, rule seed, dị ứng/kiêng và thứ tự ưu tiên.
14. [Nói đơn giản về chế độ ăn chay](14_NOI_DON_GIAN_VE_CHE_DO_AN.md): 4 câu hỏi, ví dụ một người, kịch bản 30/60 giây và bảng dịch thuật ngữ khi bị hỏi sâu.
15. [Luồng Scan tủ lạnh](15_LUONG_SCAN_TU_LANH.md): upload → job nền → candidate → confirm → Pantry, state machine, credit, retry và giới hạn demo.

[Bản bổ sung 21/10](BO_SUNG_CAP_NHAT_2026-10-21.md) giữ lịch sử các thay đổi meal plan, đa ảnh, payOS và mobile, có ghi chú đính chính hiện hành. [Bản review frontend 15/10](../../frontend/docs/FRONTEND_ARCHITECTURE_REVIEW_2026-10-15.md) là snapshot kỹ thuật cũ; không dùng số lint/test/build ở đó như số hiện tại.

**Các điểm dễ nhầm:** Contributor được duyệt có thể review nội dung Member đủ điều kiện, không được tự duyệt; Admin xử lý các ca leo thang. Khám phá nhà hàng không tự áp hồ sơ ăn uống. Duyệt recipe cần đủ 5 chỉ số dinh dưỡng cuối cùng. AI recipe draft còn `IN_PROGRESS` và hiện yêu cầu tên, mô tả, nguyên liệu. Chi tiết và các sai lệch source/registry xem [khoảng trống](05_KHOANG_TRONG_CANH_BAO.md).

## Cách phân biệt mức hoàn thành khi trả lời hội đồng

| Nhãn | Cách nói ngắn |
|---|---|
| `READY` | Contract và các gate backend được ghi hoàn tất trong registry; vẫn phải phân biệt với acceptance trên thiết bị/provider thật. |
| `IN_PROGRESS` | Có thể có route/source và UI development nhưng còn gate mở; chỉ demo với điều kiện phù hợp và nói rõ giới hạn. |
| `PLANNED` | Yêu cầu hoặc thiết kế, chưa trình bày như chức năng đã chạy. |
| Mock/fixture | UI/dữ liệu mẫu; không dùng làm bằng chứng backend ghi nhận thành công. |
| Working tree | Code hiện trên máy nhưng chưa nằm trong `HEAD`; cần kiểm chứng trước khi chốt bản demo. |

Thứ tự nguồn khi có mâu thuẫn: [SRS](../SRS.md) → [Implementation Plan](../IMPLEMENTATION_PLAN.md) cho luật được duyệt; [Backend Integration](../../frontend/docs/BACKEND_INTEGRATION.md) và [Backend Phases](../../backend/docs/IMPLEMENTATION_PHASES.md) cho mức sẵn sàng; source backend/frontend/mobile cho hành vi hiện tại. Tài liệu nghiệp vụ cũ có thể sai dù văn phong rất chắc chắn.

## Công thức trả lời một câu hỏi nghiệp vụ

> **Ai được làm?** → **Dữ liệu vào và điều kiện?** → **Backend kiểm tra/quyết định gì?** → **State hoặc dữ liệu nào thay đổi?** → **Lỗi/retry được xử lý ra sao?** → **Bằng chứng ở file nào?**

Trả lời trong 30–60 giây, sau đó mở một file source hoặc contract nếu giảng viên muốn xem kỹ. Với AI/dinh dưỡng/thanh toán, thêm một câu về giới hạn chính xác, provenance hoặc xác nhận từ provider.
