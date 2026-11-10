# Kế hoạch quản trị danh mục gói tiện ích

Ngày: 2026-11-10
Trạng thái: PLANNED — tài liệu chuẩn bị, chưa có API hay giao diện quản trị mới.

## Mục tiêu và phạm vi

Admin được xem, tạo, sửa và ngừng bán/khôi phục gói mua cho thành viên. Một gói có tên, mô tả, giá VND, số lượt chat, quét tủ lạnh, phân tích hóa đơn và số ô tủ đồ ăn. Gói lẻ cấp quyền lợi cộng dồn; gói có thời hạn cấp lượt theo chu kỳ 30 ngày và ô tủ đồ ăn trong thời gian hiệu lực. Chỉ ADMIN được quản lý; thành viên chỉ xem và mua gói đang bán. Giữ payOS, quy tắc cấp quyền lợi và phạm vi development/test hiện có.

Giả định triển khai: cho phép nhiều gói cùng thời hạn và quyền lợi khác nhau; cho phép tạo cả gói lẻ và gói thời hạn trong giới hạn được backend kiểm chứng. Không thêm loại quyền lợi mới, gia hạn tự động, hoàn tiền, quyền vai trò hay mua dung lượng media. Xóa trong giao diện là ngừng bán có thể khôi phục, không xóa vật lý.

## Hiện trạng và rủi ro

- `BillingProduct` đã có `version`, `active` và các quyền lợi; `PaymentOrder` lưu bản chụp giá, tên, phiên bản, quyền lợi và thời hạn. Subscription cũng lưu quyền lợi riêng. Đơn chờ, đơn đã thanh toán và subscription phải tiếp tục dùng bản chụp của chúng.
- `GET /billing/products` chỉ trả gói đang bán; chưa có API quản trị. Seed có bước nâng catalog phiên bản 1 lên 2 và ngừng bán `combo`; cần tránh seed/migration ghi đè thay đổi của admin hoặc khôi phục gói đã ngừng bán.
- Web và mobile đều nhóm các gói thời hạn và tính giảm giá bằng cách so với gói một tháng đầu tiên. So sánh này không hợp lệ khi quyền lợi khác nhau; hai ứng dụng cũng cần hiển thị đủ tên và quyền lợi từng gói, kể cả trùng thời hạn.
- Tạo đơn hiện gửi `productId` và `idempotencyKey`, không xác nhận phiên bản được hiển thị. Nếu giá hoặc quyền lợi đổi sau khi khách xem, đơn mới có thể dùng thông tin khác. Không mở quản trị thay đổi giá/quyền lợi cho đến khi xử lý đồng bộ cả hai ứng dụng và luồng phiên bản cũ.

## Quy tắc đề xuất

1. Mỗi cập nhật nội dung hoặc trạng thái tăng phiên bản; admin gửi phiên bản đang xem, backend từ chối xung đột để tránh ghi đè. Giá là số nguyên VND dương; số lượng là số nguyên không âm, có ít nhất một quyền lợi dương; quy định giới hạn trên an toàn phù hợp Prisma, payOS và nghiệp vụ trước khi chốt schema. Kiểm tra chuỗi, thời hạn và payload ở server.
2. Khóa loại gói và thời hạn sau khi tạo; thay đổi loại hoặc thời hạn bằng gói mới. Gói thời hạn dùng số chu kỳ được hỗ trợ và chu kỳ cố định 30 ngày; không thay đổi mặc định quota miễn phí. Đây là giới hạn thiết kế đề xuất, không khẳng định đã được triển khai.
3. Tạo đơn mới phải kèm phiên bản khách đã xem; so sánh nguyên tử với gói đang bán khi lưu snapshot. Nếu không khớp, không tạo checkout: báo thay đổi, tải lại danh mục và yêu cầu khách xác nhận mua lại. Retry cùng idempotency key phải trả lại đơn đã tạo trước đó, kể cả catalog đã đổi; không tạo đơn thứ hai.
4. Khi admin cập nhật/ngừng bán cùng lúc khách tạo đơn, thứ tự giao dịch phải xác định rõ: đơn tạo trước dùng snapshot cũ; yêu cầu chưa được ghi nhận phải từ chối nếu phiên bản/trạng thái không còn khớp. Dùng cơ chế transaction và kiểm soát xung đột Mongo phù hợp, kiểm tra retry khi write conflict.
5. Ghi audit bất biến cho tạo/sửa/ngừng bán/khôi phục: admin, thời điểm, phiên bản, dữ liệu trước/sau và lý do thay đổi. Ghi audit và cập nhật catalog trong cùng transaction; không lưu thông tin thanh toán nhạy cảm. Áp dụng bảo vệ quyền ở backend.
6. Không suy diễn phần trăm tiết kiệm giữa các gói khác quyền lợi. Đơn giản nhất là bỏ nhãn này trên web và mobile cho đến khi có quy tắc so sánh được định nghĩa rõ.

## Hợp đồng dự kiến — chưa READY

| Phương thức | Đường dẫn đề xuất | Mục đích |
| --- | --- | --- |
| GET | `/admin/billing/products` | Danh sách cả gói đang bán và đã ngừng, có trạng thái và phiên bản. |
| GET | `/admin/billing/products/{id}` | Chi tiết gói và phiên bản để chỉnh sửa. |
| POST | `/admin/billing/products` | Tạo gói mới với loại, giá và quyền lợi hợp lệ. |
| PATCH | `/admin/billing/products/{id}` | Cập nhật giá, nội dung, quyền lợi với `expectedVersion` và lý do. |
| POST | `/admin/billing/products/{id}/availability` | Ngừng bán hoặc khôi phục với `expectedVersion` và lý do. |

Đề xuất bổ sung `expectedProductVersion` vào `POST /billing/orders`; đây là thay đổi có thể phá vỡ client cũ. Thiết kế migration/versioning trước khi bắt buộc trường này: xác định chính sách client mobile cũ, thời điểm ngừng tương thích, và bảo đảm client cũ không tiếp tục tạo đơn theo giá chưa được xác nhận. Trong giai đoạn chuyển đổi, khóa thay đổi ảnh hưởng giá/quyền lợi nếu chưa có cơ chế bảo vệ mọi client. Document các lỗi validation, không tìm thấy, xung đột phiên bản và gói ngừng bán trong OpenAPI và integration catalog; tên/mã lỗi cụ thể được chốt khi thiết kế API.

## Thứ tự thực hiện

- [ ] **1. Chốt thiết kế:** xác minh giới hạn payOS và kiểu lưu trữ; kiểm tra auth ADMIN, quy ước audit, Mongo validator, các client và quy tắc phiên bản. Chốt chiến lược chuyển đổi client cũ trước khi mở thay đổi catalog.
- [ ] **2. Backend:** mở rộng schema/validator và migration nếu audit cần collection mới; API ADMIN, validation, optimistic concurrency, audit cùng transaction, ngừng/khôi phục. Cập nhật seed/catalog migration để tôn trọng thay đổi đã quản trị và giữ dữ liệu lịch sử.
- [ ] **3. Mua hàng an toàn:** xây dựng kiểm tra phiên bản khi tạo đơn, xử lý idempotency và cạnh tranh đồng thời; giữ nguyên snapshot khi settlement và subscription được cấp. Cập nhật OpenAPI và `frontend/docs/BACKEND_INTEGRATION.md`, theo dõi `CHANGING` khi có breaking change; chỉ đánh dấu `READY` sau đủ cổng backend.
- [ ] **4. Web admin:** sau `npm run sync:swagger`, tạo endpoint constants, DTO, model, mapper và mapper tests, API và TanStack Query; thêm lối vào từ dashboard ADMIN, danh sách, form, trạng thái loading/error/empty, xung đột phiên bản và xác nhận ngừng bán. Giao diện tiếng Việt, responsive và bàn phím truy cập được.
- [ ] **5. Web và mobile mua hàng:** hiển thị từng gói và quyền lợi thực tế, không so sánh sai; gửi phiên bản đã xem, xử lý xung đột bằng tải lại và yêu cầu xác nhận. Điều chỉnh cache và chọn gói khi danh mục thay đổi. Hoàn tất chính sách cho client cũ trước khi bật chỉnh sửa catalog.
- [ ] **6. Hoàn thiện:** đồng bộ trạng thái endpoint/FE integrated và changelog, tài liệu tiến độ web, migration/seed, hướng dẫn rollout và rollback. Không đưa route thành `READY` chỉ vì đã có code.

## Kiểm chứng và điều kiện hoàn thành

- ADMIN tạo, sửa, ngừng bán và khôi phục thành công; member/khách bị từ chối mọi thao tác quản trị. Dữ liệu sai, gói không tồn tại và cập nhật phiên bản cũ được báo rõ.
- Thử hai admin cùng sửa; thử mua đồng thời với thay đổi/ngừng bán; thử retry cùng idempotency key, mất kết nối và settlement lặp. Không có đơn mới dùng giá khác giá đã xác nhận; đơn chờ trước thay đổi và đơn đã trả vẫn cấp đúng snapshot một lần.
- Kiểm tra seed/migration chạy lại không ghi đè gói đã quản lý; audit có actor, phiên bản, trước/sau và lý do; thao tác và audit thành công hoặc thất bại cùng nhau.
- Web và mobile hiển thị chính xác nhiều gói cùng thời hạn nhưng khác quyền lợi, không có giảm giá gây hiểu lầm, và xử lý gói hết bán/giá thay đổi. Xác minh phiên bản client cũ theo chính sách rollout đã chọn.
- Backend: lint, typecheck, build, sinh OpenAPI, kiểm tra HTTP/acceptance phù hợp trên dữ liệu cô lập, `git diff --check`; không thêm hạ tầng unit/integration test backend. Web: mapper tests, `npx tsc --noEmit`, toàn bộ `npm test`, `npm run build`; mobile: kiểm tra type, mapper và các cổng hiện hành của dự án. Ghi rõ mọi cổng không chạy và lý do.
- Kiểm thử UI ADMIN và mua hàng trên màn hình nhỏ/lớn, trạng thái lỗi, truy cập bằng bàn phím; không thực hiện chuyển khoản thật trong kiểm tra tự động. Chỉ bật quản trị sau khi backend, web, mobile và chính sách client cũ hoàn tất.
