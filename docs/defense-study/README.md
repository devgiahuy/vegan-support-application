# Bộ ôn bảo vệ nghiệp vụ — Vegan Support Application

**Đối chiếu:** 08/11/2026, nhánh `dev`, `HEAD 0feaca2` trước thay đổi tài liệu này. Đây là kiểm tra tĩnh source và registry, không phải bằng chứng đã chạy end-to-end trên môi trường chấm. Các nhánh khác có thể chứa code khác; kiểm tra lại `git status` và commit trước demo.

## Đọc theo thứ tự

1. [Sơ đồ và nguyên tắc nghiệp vụ](01_SO_DO_NGHIEP_VU.md): học thuộc tác nhân, các ranh giới an toàn và vòng đời dữ liệu.
2. [Các luồng nghiệp vụ](02_LUONG_NGHIEP_VU.md): diễn giải từng luồng theo mẫu tác nhân → đầu vào → backend quyết định → trạng thái → lỗi.
3. [Câu hỏi và tình huống lỗi](03_HOI_DAP_VA_TINH_HUONG.md): tự trả lời trước khi xem đáp án gợi ý.
4. [Chiến lược 5 buổi và demo](04_CHIEN_LUOC_BAO_VE.md): luyện nói, chuẩn bị dữ liệu và phương án khi demo gặp lỗi.
5. [Khoảng trống cần xử lý](05_KHOANG_TRONG_CANH_BAO.md): kiểm tra lại trước buổi chấm, đặc biệt các chức năng AI và thay đổi local.
6. [Bộ chạy test tay 16 luồng](06_KICH_BAN_TEST_TAY_16_LUONG.md): dữ liệu demo, thao tác, kết quả mong đợi, ca lỗi và mẫu biên bản PASS/FAIL/BLOCKED.

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
