# Đổi hồ sơ ăn uống khi đã có thực đơn

**Version:** 1.1
**Updated:** 2026-11-19
**Status:** IMPLEMENTED — backend/web/mobile; kiểm chứng API/browser và giới hạn native tại báo cáo liên kết bên dưới.
**Scope:** Backend, web, mobile; thực đơn tuần và chương trình nhiều tuần phát sinh trong hệ thống mới.

## 1. Quyết định đã chốt

Khi thay đổi profile làm thực đơn không còn phù hợp, người dùng vẫn được lưu profile và chọn:

1. **Tự động thay các món không phù hợp:** backend tìm món thay, hiển thị phương án trước/sau và người dùng áp dụng.
2. **Giữ thực đơn, xử lý sau:** giữ nội dung thực đơn; lưu cảnh báo/thông tin cần xử lý và cho mở lại flow thay món sau.

Giữ thực đơn là giữ một nội dung đã lưu, không phải cho phép hệ thống coi món vi phạm là phù hợp. Dị ứng, explicit exclusions và bốn tùy chọn mới luôn áp dụng với discovery/recommendation/generation/swap/manual-add/confirm.

Không hỗ trợ data/client/schema cũ của phiên bản phần mềm trước; đây là project dev không có người dùng thật. Việc theo dõi profile thay đổi sau khi thực đơn được tạo là yêu cầu runtime của hệ thống mới, vẫn phải thực hiện đầy đủ.

## 2. Luồng khi lưu profile

1. Người dùng chỉnh bốn toggle hoặc dị ứng/kiêng nguyên liệu và bấm Lưu.
2. Backend xem trước tác động của profile dự kiến lên các thực đơn tuần hiện tại/tương lai và selected alternatives của chương trình thuộc người dùng. Trả số thực đơn, số bữa duy nhất, tên món, ngày/bữa, nguyên liệu/nhóm vi phạm và món chưa đủ dữ liệu để đánh giá.
3. Không có tác động: lưu bình thường, refresh constraints/cache; không hiển thị dialog bắt người dùng giải quyết việc không tồn tại.
4. Có tác động: hiển thị ví dụ “Tắt ăn trứng sẽ khiến 4 bữa trong 2 thực đơn không còn phù hợp”, danh sách có thể mở rộng và hai lựa chọn đã chốt. Có Quay lại để sửa/hủy; chưa lưu thì không thay đổi profile hay món ăn.
5. Lưu profile mới atomically cùng dietary revision và invalidation marker. Backend tính/kiểm tra lại tác động tại lúc save; preview cũ không là thẩm quyền nếu dữ liệu đã đổi.
6. Chọn giữ: trả kết quả profile đã lưu, số bữa cần xử lý và link thực đơn. Chọn thay: tiếp tục tạo preview replacement theo profile vừa lưu; người dùng xem và Áp dụng. Không cần chọn thủ công từng món nếu chấp nhận toàn bộ đề xuất.
7. Profile đã lưu không bị rollback nếu tìm/thay món thất bại hoặc người dùng hủy preview replacement. Báo rõ “Đã lưu thiết lập; thực đơn vẫn còn X bữa cần xử lý”, giữ banner và cho retry/đổi thủ công.

Thông báo tức thời trong flow save và banner bền vững ở danh sách/chi tiết thực đơn là yêu cầu tối thiểu. Đóng dialog hoặc bấm giữ không xóa tình trạng vi phạm; không cần thêm push/email hay cron reminder trong scope này.

## 3. Bảng xử lý tình huống

| Tình huống | Hành vi |
|---|---|
| Đổi cho phép → kiêng, có món chứa nhóm đó | Báo đúng các bữa vi phạm, cho thay hoặc giữ kèm cảnh báo. |
| Đổi cho phép → kiêng, thực đơn không chứa nhóm đó | Lưu bình thường, không regenerate vô ích. |
| Đổi kiêng → cho phép | Không tự thêm món hoặc đổi món đang phù hợp; kiểm tra lại và gỡ cảnh báo nào đã hết nguyên nhân. |
| Vừa siết nhóm này vừa nới nhóm khác | Đánh giá toàn bộ profile cuối cùng; không suy tác động chỉ từ hướng thay đổi một toggle. |
| Thêm/sửa dị ứng hoặc nguyên liệu kiêng | Cùng cơ chế impact nhưng hiển thị đúng lý do dị ứng/kiêng; allowance không override. |
| Một bữa vi phạm nhiều nhóm | Một bữa chỉ đếm một lần, kèm đầy đủ nguyên nhân; không nhân đôi tổng affectedMeals. |
| Món cá nhân/thành phần lồng nhau | Dùng cùng canonical resolver; không chỉ kiểm tra recipe-level snapshot. |
| Thành phần/classification chưa đủ dữ liệu | Tách “chưa xác minh được” khỏi vi phạm đã biết; không đánh dấu phù hợp hoặc tự lấy làm món thay. |
| Không có thực đơn hiện tại/tương lai | Không chặn lưu profile, không tạo thực đơn tự động. |
| Nhiều tuần/chương trình cùng tham chiếu một plan | Deduplicate theo planId/itemId cho kiểm tra và sửa; UI nhóm tham chiếu dễ hiểu, không sửa cùng món hai lần. |
| Alternatives chưa được chọn | Không tính vào số bữa đang dùng; vẫn phải kiểm tra profile mới khi chọn/confirm, không dùng snapshot cũ để bypass. |
| Thực đơn hoàn toàn trong quá khứ | Giữ nội dung/snapshot lịch sử, không tự sửa hoặc chặn lưu profile; nếu xem đối chiếu profile hiện tại thì ghi rõ đó là đối chiếu hiện tại. |
| Tuần đang diễn ra | Phạm vi thay tự động mặc định từ ngày hôm nay trở đi theo Asia/Ho_Chi_Minh. Không sửa ngày trước hôm nay. |
| Bữa hôm nay | Hệ thống chỉ có ngày/mealType, chưa có trạng thái đã ăn: không suy bữa nào đã ăn theo giờ; đưa cả ngày hôm nay vào review. Không thêm tracking đã ăn trong scope này. |
| Người dùng bấm giữ | Nội dung giữ nguyên; banner và badges từng bữa còn tồn tại. Không cho confirm là phù hợp khi còn vi phạm. |
| Đã có món mua/nguyên liệu trong pantry | Chỉ tính lại nhu cầu mua gắn với kế hoạch sau khi áp dụng thay món; không tự trừ/xóa/tăng pantry hoặc sửa giao dịch đã xác nhận. |

## 4. Quy tắc thay món tự động

- Chỉ xử lý thực đơn người dùng chọn trong phạm vi được cảnh báo, từ hôm nay trở đi, chỉ các bữa vi phạm hoặc chưa xác minh. Giữ món đang phù hợp và các phần còn lại của kế hoạch.
- Chọn candidate đáp ứng toàn bộ profile hiện tại, kể cả các dị ứng/kiêng khác; rank sau hard filtering. Không dùng fallback bị cấm khi thiếu candidate.
- Preview ghi before/after, các món sẽ giữ/thay, thay đổi khẩu phần/dinh dưỡng, mức đủ dữ liệu và chênh lệch danh sách mua. Sau Áp dụng phải tính lại dinh dưỡng ngày/tuần, warnings, plan-derived shopping requirements và analysis.
- Mỗi plan áp dụng atomically với expected plan version và dietary revision. Không có đủ phương án cho một plan: giữ nguyên plan đó, báo các bữa chưa tìm được và cho đổi thủ công/thử lại. Với nhiều plan, trả kết quả từng plan; plan khác có thể thành công, không báo thành công toàn bộ.
- Retry cùng idempotency key không đổi món thêm lần nữa. Profile/plan/catalog đổi sau preview: báo conflict, tải lại preview; không áp đề xuất cũ bằng cách bỏ qua version.
- Chỉ ghi trạng thái phù hợp sau khi đánh giá lại toàn bộ phạm vi áp dụng bằng profile hiện tại. Nếu một phần vẫn chưa được xử lý, thông báo số bữa còn lại.

## 5. Trạng thái và chương trình đã xác nhận

Compatibility tách khỏi workflow: **COMPATIBLE**, **NEEDS_REVIEW**, **HISTORICAL**. NEEDS_REVIEW có reasons và cờ unverified từng item; loading/checking là trạng thái client. Không sửa workflow CONFIRMED thành một trạng thái cảnh báo tùy tiện; confirmedAt không chứng minh còn phù hợp với profile hiện tại.

Analysis có CURRENT/STALE riêng. Profile đổi khiến fingerprint cũ stale ngay về mặt revision; khi đọc plan/program, backend so với current dietary revision và tính lại/đánh dấu cần review trước khi trả cờ tương thích. Không chỉ dựa client invalidateQueries hoặc một job từng chạy thành công.

Program đã CONFIRMED hiện bị khóa sửa. Giữ quy tắc này: tạo **bản điều chỉnh mới dạng DRAFT** cho phần từ hôm nay trở đi, giữ liên kết bản nguồn và lịch sử. Người dùng xem lại và xác nhận bản điều chỉnh; bản cũ không âm thầm bị chỉnh. Bản điều chỉnh mang liên kết nguồn và ngày bắt đầu thay thế; khi confirm, quan hệ thay thế được ghi atomically cho phạm vi tương lai, UI đánh dấu bản nguồn là đã có bản thay thế trong phạm vi đó. Hủy/thất bại trước confirm không làm mất bản nguồn, nhưng cảnh báo profile hiện tại trên bản nguồn vẫn tồn tại. Không thêm khái niệm một program active toàn cục cho toàn bộ user.

Thiết kế này đã được đưa vào canonical SRS/IMPLEMENTATION_PLAN và backend contract; revision bảo toàn immutable rule của program confirmed.

## 6. Contract và nhất quán backend

- Preview dietary-impact là read-only theo profile dự kiến và user đã auth; không lưu thay đổi. Operation riêng là POST /users/me/diet-preferences/impact-preview; POST /diet-rules/preview chỉ xem policy.
- Payload kết quả có dietary revision dự kiến/current, policy/classification revision, affected plan/program IDs và versions, item reasons, scope date, số lượng dedup, unverified flags. Endpoint/DTO được sinh trong OpenAPI và frontend API catalog; repair preview giới hạn 20 planIds/request, hai client chia nhóm rõ ràng khi vượt giới hạn.
- Save trả profile + impact summary/links, không báo repair đã xong chỉ vì profile PUT thành công. Keep không cần persistence override riêng: compatibility luôn được backend tính lại, không xóa cảnh báo hoặc nới constraints.
- Repair preview và apply có version/ownership/idempotency; không mặc định sửa tất cả plans khi user chỉ chọn một plan. Save/profile revision và mutation/confirm guards phải chống race: không có plan ghi thành phù hợp theo profile cũ sau khi profile mới commit.
- GET list/detail program/plan cũng trả compatibility hiện tại; program snapshots/projections không giữ CURRENT giả. Recheck ở mutation/confirm và khi chọn alternative, dù đã mở màn trước khi profile đổi.
- Các lần sửa profile không thay effective constraints không cần tạo dialog hay repair; metadata không liên quan không được invalidate dietary revision vô ích.

## 7. Web/mobile và kiểm chứng

Cả hai client có cùng flow impact dialog → hai lựa chọn → replacement preview/apply hoặc giữ banner, action xem bữa bị ảnh hưởng, loading/error/retry/no-candidates/conflict. Không xóa bản nháp khi lỗi. Cache profile, plan/list/detail/program/projection/analysis và plan-derived shopping state được refresh sau save/apply; mở lại hoặc đổi thiết bị vẫn thấy cảnh báo từ backend.

Acceptance bổ sung: đủ 16 tổ hợp, cả hai action thay/giữ; không ảnh hưởng; relaxation/mixed changes; actual allergy và uncertainty; tuần quá khứ/đang diễn ra/tương lai; selected/unselected alternatives; confirmed program revision; no candidates; cancel; per-plan failure; profile sửa lần nữa; two-device/version/catalog races; duplicate submit; purchased pantry không bị chỉnh; banner qua refresh/relogin/cross-client và stale data không confirm được.

Đã triển khai và kiểm chứng runtime trên database QA cô lập. Không thêm backend automated unit/integration infrastructure. Xem [DIETARY_PREFERENCES_VERIFICATION.md](DIETARY_PREFERENCES_VERIFICATION.md) để biết các gates, trường hợp API/browser đã chạy và native QA chưa chạy.

**Changelog 2026-11-19 (1.1):** ghi contract/state thực tế, giới hạn batch và kết quả triển khai.
