# Task: Phase 11 — AI Nutrition Chat Gateway (UC-07)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-11-ai-chat.md`](../../../../backend/docs/prompts/phase-11-ai-chat.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 95% (Live API kết nối, SSE streaming, phản hồi tin nhắn, lưu phiên)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (AC-1..AC-6)**

---

## 1. Bối cảnh & Mục tiêu

Trợ lý ảo tư vấn dinh dưỡng chay chuyên sâu:
- Hỗ trợ cả Khách ẩn danh (Guest cookie 7 ngày) và Thành viên đã đăng nhập (lưu phiên riêng tư vĩnh viễn).
- Phản hồi trực tiếp dạng luồng thời gian thực (SSE - Server-Sent Events) với định dạng Markdown phong phú.
- Luôn hiển thị khuyến cáo miễn trừ y tế (Medical Disclaimer): Không thay thế chẩn đoán của bác sĩ.
- Đánh giá chất lượng câu trả lời (Feedback Thích/Không thích) để cải thiện mô hình.

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 5 endpoints live:
  - `POST /chat/sessions`: Khởi tạo phiên trò chuyện.
  - `GET /chat/sessions`: Danh sách các phiên trò chuyện của user.
  - `GET /chat/sessions/:id/messages`: Lịch sử tin nhắn trong phiên.
  - `POST /chat/sessions/:id/messages`: Gửi câu hỏi và nhận stream SSE trả lời từ LLM.
  - `POST /chat/messages/:id/feedback`: Đánh giá phản hồi (up/down vote).
- [x] Giao diện trợ lý tại `/assistant`: Khung chat responsive, sidebar lịch sử phiên, bộ gõ tin nhắn có đếm ký tự.
- [x] Stream parser xử lý mượt mà 5 sự kiện SSE: `session_started`, `chunk`, `citations`, `message_complete`, `error`.
- [x] Unit tests: `chat.mapper.test.ts` pass 12/12 test cases.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **AC-1**: Khách chưa đăng nhập vào `/assistant` -> Tự động sinh phiên khách (`chatGuest` cookie) -> Gửi câu hỏi thành công.
- [ ] **AC-2**: Đăng nhập Member -> Xem lại được toàn bộ các phiên trò chuyện cũ ở thanh bên trái.
- [ ] **AC-3**: Tạo phiên mới và hỏi: "Người mới ăn chay nên bổ sung vitamin B12 như thế nào?" -> Phản hồi stream chữ chạy mượt mà, định dạng rõ ràng kèm khuyến cáo y tế.
- [ ] **AC-4**: Bấm icon "Hữu ích" (Thích) hoặc "Chưa tốt" (Không thích) -> Ghi nhận feedback thành công.
- [ ] **AC-5**: Kiểm tra giới hạn tốc độ (rate limit): Gửi tin nhắn liên tục -> Nhận thông báo chờ thân thiện.
- [ ] **AC-6**: Đăng xuất và đăng nhập lại -> Các phiên chat của Member vẫn còn nguyên vẹn.
