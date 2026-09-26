# Task: Phase 21 — Multi-image Fridge Recognition

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-21-fridge-vision.md`](../../../../backend/docs/prompts/phase-21-fridge-vision.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED`
> **Phụ thuộc**: Phase 11 (AI Chat), Phase 15 (Storage), Phase 20 (Pantry)
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Nhận diện thực phẩm trong tủ lạnh qua hình ảnh (Fridge Vision):
- Người dùng chụp từ 1 đến nhiều góc ảnh bên trong tủ lạnh.
- Hệ thống AI phân tích và đưa ra danh sách ứng viên thực phẩm nhận diện được kèm độ tin cậy (Confidence).
- **Quy tắc an toàn nghiệp vụ**: AI không được tự ý thêm thực phẩm vào kho. Người dùng **bắt buộc phải xem lại, sửa đổi và bấm "Xác nhận"** thì thực phẩm mới được cập nhật vào Tủ bếp (`/pantry`).
- Không cam kết độ tươi sống hay an toàn vệ sinh thực phẩm (Freshness is an uncertain observation).

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/ingredient-recognition/jobs` | Member | Tải nhiều ảnh lên và khởi tạo tác vụ nhận diện bất đồng bộ |
| `GET` | `/api/v1/ingredient-recognition/jobs/:id` | Member | Lấy danh sách ứng viên thực phẩm, độ tin cậy và trạng thái tác vụ |
| `PATCH` | `/api/v1/ingredient-recognition/jobs/:id/candidates/:candidateId` | Member | Người dùng sửa đổi tên nguyên liệu hoặc loại bỏ ứng viên sai |
| `POST` | `/api/v1/ingredient-recognition/jobs/:id/confirm` | Member | Điểm chốt xác nhận: chỉ bước này mới ghi dữ liệu vào Tủ bếp |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Xây dựng module `features/ingredient-vision` theo 7 tầng scaffold.
- [ ] Giao diện chụp/tải nhiều ảnh tủ lạnh (hỗ trợ kéo thả, camera trên di động).
- [ ] Màn hình duyệt ứng viên (`CandidateReviewScreen`):
  - Hiển thị ảnh chụp có đóng khung vật thể (bounding box nếu có).
  - Danh sách thẻ nguyên liệu nhận diện kèm thanh độ tin cậy.
  - Nút sửa tên nguyên liệu nhanh liên kết với bộ giải quyết nguyên liệu `resolve`.
  - Nút "Xác nhận thêm vào tủ bếp".
