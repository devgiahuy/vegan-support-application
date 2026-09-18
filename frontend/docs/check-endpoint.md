Bất kỳ khi nào Backend cập nhật thêm endpoint mới, bạn chỉ cần thực hiện 2 bước từ thư mục frontend/:

Bước 1: Đồng bộ catalog API từ Backend Swagger
`npm run sync:swagger`
(Lệnh này tự động phân tích Swagger BE và cập nhật lại docs/api-catalog.json cùng các file trong docs/api/).

Bước 2: Chạy kiểm tra nhanh các endpoint chưa dùng

`npm run check:endpoints`
💡 Các tùy chọn mở rộng hữu ích
Xem toàn bộ 100% endpoint (cả đã dùng và chưa dùng):

bash

`npm run check:endpoints -- --all`
Xuất kết quả dạng JSON (để gắn vào CI/CD pipeline hoặc script khác nếu cần):

bash

`npm run check:endpoints -- --json`
🔍 Cơ chế hoạt động của công cụ này
Script
scripts/check-unused-endpoints.mjs
vừa được tạo sẽ tự động rà soát theo đúng kiến trúc 4 tầng của Frontend:

[docs/api-catalog.json] (Toàn bộ API từ Backend)
│
▼
[src/common/constants/api-endpoints.ts] (Đã khai báo constant URL chưa?)
│
▼
[src/features/**/api/\*.ts] (Đã viết hàm gọi axios/fetch chưa?)
│
▼
[src/features/**/queries/*.ts] (Đã bọc React Query hook chưa?)
│
▼
[src/app/ & src/components/] (Đã thực sự được mount/gọi trên UI/Page chưa?)
Và tự động phân loại kết quả thành 3 nhóm rõ ràng:

❌ Chưa triển khai trong API Layer: Endpoint hoàn toàn chưa có code gọi HTTP nào trên FE.
⚠️ Đã viết API nhưng chưa gắn UI: Đã viết hàm API / Query hook nhưng chưa được màn hình hay component nào sử dụng.
✅ Đã tích hợp đầy đủ: Đã nối thông suốt từ API → React Query → UI Component.
