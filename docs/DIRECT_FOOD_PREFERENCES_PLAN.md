# Kế hoạch thay mô hình thiết lập ăn uống

**Version:** 1.2
**Updated:** 2026-11-19
**Status:** IMPLEMENTED — backend/web/mobile đã chuyển contract; API và browser đã kiểm chứng. Native authenticated iOS/Android QA chưa chạy, xem báo cáo kiểm chứng.
**Scope:** Backend, MongoDB/seed/catalog, frontend web, Expo mobile và mọi consumer phụ thuộc dietary profile.

## 1. Quyết định đã chốt với người dùng

- Bỏ lựa chọn Thuần chay / Có trứng sữa và Không theo truyền thống / Phật giáo / Kitô giáo.
- Bỏ setup lịch Trường chay / Chay kỳ; các tùy chọn thực phẩm áp dụng mọi ngày.
- Thay bằng bốn toggle độc lập: **Ăn trứng**, **Ăn sữa**, **Ăn mật ong**, **Ăn ngũ vị tân**. Bật = được ăn; tắt = kiêng nhóm đó.
- Ngũ vị tân của ứng dụng gồm **hành, hẹ, tỏi, kiệu, hưng cừ**; rà và bổ sung canonical catalog cùng approved aliases.
- Giữ nền ăn chay loại thịt/cá và các thành phần từ nhóm cấm. Cho phép một nhóm không vượt qua dị ứng/kiêng nguyên liệu, không bắt buộc gợi ý nhóm đó và không chứng nhận an toàn.
- Không xóa ngày/bữa của meal plan hoặc lịch không liên quan. Bỏ dietary calendar coverage như một điều kiện lập/xác nhận thực đơn.
- Người dùng xác nhận đây là project dev không có người dùng thật: bỏ yêu cầu bảo toàn dữ liệu phiên bản cũ, migration mapping, client compatibility, redirects/deprecation windows và rollback production. Có thể làm lại schema/seed và dữ liệu dev liên quan khi triển khai; schema/seed được kiểm chứng trong MongoDB QA cô lập, không reset database mặc định.
- Khi đổi profile ảnh hưởng thực đơn, cung cấp cả hai lựa chọn: **Tự động thay các món không phù hợp** hoặc **Giữ thực đơn, xử lý sau**, với cảnh báo bền vững và backend validation.

## 2. Kết quả phân tích hiện trạng

| Khu vực | Hiện trạng và hệ quả |
|---|---|
| Profile/backend | Preview/save dùng dietPattern + practiceSchedule + tradition + versioned rules. Cần đổi contract/persistence, không chỉ thay nhãn UI. |
| Rule flags | Seed tradition rules defaultEnabled=false nhưng hardConstraint=true; web/mobile ép hardConstraint thành luôn bật. Mô hình mới phải tách quyền lựa chọn khỏi bắt buộc thực thi khi đã kiêng. |
| Phân loại | VEGAN/LACTO_OVO không biểu diễn “chỉ trứng”, “chỉ sữa” hoặc mật ong độc lập. Cần bốn food groups được review. |
| Nguyên liệu/công thức | Có traditionWarnings trên ingredient và recipe snapshot; resolver duyệt components và Mongo aggregate dùng metadata để lọc/count. Cần đổi nhất quán mọi evaluator. |
| Lịch hiện tại | search-constraints chỉ đặt traditions theo lịch, dietPattern vẫn áp mọi ngày. Không giữ logic lịch này trong contract mới. |
| Planning | Generation/swap/manual-add/custom meals/programs/analysis/confirm và fingerprints phụ thuộc profile/recipe facts; mọi đường phải chuyển cùng nhau. |
| Web | Profile có wizard/card; onboarding khác dùng lựa chọn tôn giáo cũ và setTimeout báo lưu, chưa gọi API. Cần dùng lại dietary flow thật. |
| Mobile | Có flow riêng; edit chưa hydrate đủ saved options/rules/calendar; query invalidation thiếu meal-analysis. Cần sửa cùng refactor. |
| Danh mục | Seed cũ có boaro trong mô tả ngũ vị tân; onboarding ghi hưng cừ. Phải review membership theo danh mục người dùng đã chốt, không suy tên/họ thực vật. |
| Storage | Runtime dùng MongoDB với Prisma và schema provisioning/validators/backfills; không lập SQL migration cho đường chạy hiện tại. |

## 3. Mô hình và UX đích

Profile lưu bốn boolean tường minh: `allowEggs`, `allowDairy`, `allowHoney`, `allowFivePungent`, kèm policy version và thời điểm/trạng thái xác nhận. Backend là thẩm quyền effective constraints. Không giữ dietPattern/tradition như một nguồn sự thật song song cho profile mới.

Luồng web/mobile: **bốn toggle → dị ứng và kiêng nguyên liệu → tóm tắt/xác nhận → lưu**. Có thể trình bày thành một form chia nhóm; không autosave từng toggle qua API đang replace toàn bộ collection. Bỏ bước bật/tắt quy tắc trùng lặp, schedule editor và nhãn lịch. Onboarding dùng cùng flow thực sự lưu dữ liệu. Thiếu dữ liệu/tải profile lỗi không được chuyển thành bốn false rồi ghi đè.

Ingredient classification dùng nhóm thực phẩm có review/coverage/source/license/version/audit, độc lập với allergens. Resolver kiểm tra tất cả thành phần con/cháu; không có positive tag không đồng nghĩa đã chứng minh không chứa. Unknown/partial/inactive/unresolved/cyclic không vượt qua hard constraints. Không dùng AI hay substring name matching để tự phân loại.

Các nhãn VEGAN/LACTO_OVO trên nội dung hoặc explicit filters có thể giữ ý nghĩa riêng. Nội dung bài viết về tôn giáo và restaurant directory tags cũng không phải profile preferences; không xóa theo tìm kiếm chuỗi. Nhà hàng tiếp tục chỉ áp filter được chọn rõ cho request.

## 4. Kế hoạch triển khai theo thứ tự

| Bước | Công việc | Điều kiện hoàn tất |
|---|---|---|
| 1. Đặc tả/contract | Ghi quyết định vào canonical SRS/IMPLEMENTATION_PLAN dưới PLANNED; thiết kế bốn fields, dietary revision, impact/repair flow, errors và hai lựa chọn. | Một contract và bộ acceptance dùng chung backend/web/mobile; endpoint breaking có trạng thái CHANGING đúng lúc. |
| 2. Schema/dữ liệu dev | Làm lại schema/profile/food groups/seed nhất quán; bỏ active tradition/schedule và chuẩn bị seed đủ 16 tổ hợp cùng thực đơn trước/sau đổi profile. | Database dev provision/reseed được theo mô hình mới; không có legacy adapter hoặc dữ liệu demo tạo lại contract đã bỏ. |
| 3. Backend | Đổi profile/constraints/catalog/filtering/planning/chat; xóa diet-schedule; thêm impact preview, save result, compatibility và replacement preview/apply, version guards. | 16 tổ hợp, cả hai lựa chọn thay/giữ, warnings và revalidation đúng qua live API/persistence; backend/OpenAPI gates đạt. |
| 4. Web/admin | Sync Swagger; chuyển đủ DTO/Model/Mapper/API/query/tests; bốn toggle và impact dialog/hai actions/repair preview/banner; chuyển onboarding/catalog/reasons, xóa schedule UI. | Save/edit/cancel/error/conflict đúng, banner tồn tại khi xử lý sau; components đọc Model, cache đầy đủ. |
| 5. Mobile | Cùng bốn toggle và impact/repair/keep flow; hydrate profile, giữ unresolved allergies, chuyển consumer, xóa schedule route/links. | Đọc cùng state/cảnh báo với web; 16 tổ hợp và hai actions nhất quán; native QA riêng. |
| 6. QA/docs | Kiểm tra API + DB + browser + native mobile, 16 tổ hợp và ma trận đổi profile/thay/giữ/lỗi/race; cập nhật docs/status/changelog. | Backend + web + mobile cùng hoàn tất; không còn warnings giả hợp lệ; báo rõ phần chưa chạy và lý do. |

Web/mobile có thể thực hiện song song sau khi contract và backend ổn định. Không phát hành UI mới dựa trên backend contract cũ.

## 5. Dữ liệu dev và phạm vi phiên bản cũ

Người dùng đã bỏ yêu cầu xử lý dữ liệu/client cũ vì đây là project môn học, chưa có người dùng thật. Triển khai trực tiếp contract/schema mới, xóa code/route/setup đã bỏ và cập nhật seed; có thể reset/reseed dữ liệu dev liên quan theo nhu cầu thực tế. Không xây migration mapping, màn xác nhận profile legacy, backward-compatible adapter, hỗ trợ payload cũ hay chiến lược production rollout. Lần triển khai này provision/reseed database QA cô lập; không reset database mặc định.

Bảo toàn provenance/review của food data vẫn là yêu cầu của mô hình mới. Khi hệ thống mới đang chạy, đổi profile phải xử lý thực đơn đã tạo trước lần đổi đó; yêu cầu này độc lập với hỗ trợ dữ liệu phiên bản cũ.

## 6. Đổi profile khi đã có thực đơn

Chi tiết: [DIET_PROFILE_MEAL_PLAN_IMPACT.md](DIET_PROFILE_MEAL_PLAN_IMPACT.md).

- Trước lưu, backend kiểm tra profile dự kiến trên thực đơn hiện tại/tương lai và trả đúng tuần/bữa/món/nhóm nguyên liệu ảnh hưởng; phân biệt vi phạm và chưa đủ dữ liệu. Không ảnh hưởng thì lưu bình thường.
- Có ảnh hưởng thì hiển thị hai lựa chọn đã chốt: tự động tìm món thay và xem trước để áp dụng; hoặc lưu profile và giữ thực đơn kèm cảnh báo để xử lý sau. Người dùng có thể quay lại trước khi lưu.
- Profile mới luôn là thẩm quyền. Giữ thực đơn không có nghĩa xác nhận nó phù hợp. Banner trên list/detail và cảnh báo từng bữa vẫn tồn tại sau refresh/đổi thiết bị cho đến khi nguyên nhân được xử lý.
- Thay tự động chỉ đụng các bữa không phù hợp từ hôm nay trở đi, giữ món phù hợp/ngày trước hôm nay. Dùng Asia/Ho_Chi_Minh; chưa có trạng thái đã ăn nên không suy bữa hôm nay đã được ăn theo giờ.
- Nới giới hạn không tự thêm/thay món; siết/nới hỗn hợp phải đánh giá profile cuối cùng. Dị ứng và ingredient exclusions cũng đi qua impact flow, vẫn ưu tiên cao nhất.
- Không có candidate/repair lỗi: profile vẫn lưu, plan đó giữ nguyên và báo phần chưa xử lý. Mỗi plan áp dụng atomically; nhiều plan trả status từng plan, không báo thành công chung khi có thất bại.
- Program đã CONFIRMED hiện immutable: đề xuất tạo bản điều chỉnh DRAFT, xem và xác nhận riêng; bản nguồn vẫn được lưu và có cảnh báo theo profile hiện tại. Không tự sửa confirmed snapshot.
- Sau apply tính lại nutrition/warnings/plan-derived shopping và analysis. Không tự sửa pantry/giao dịch đã xác nhận. Revision và expectedVersion/idempotency chống profile/plan/catalog race, duplicate submit và stale confirm.

## 7. Ma trận kiểm chứng và Definition of Done

1. **16 tổ hợp** trứng/sữa/mật ong/ngũ vị tân: món chứa riêng từng nhóm, nhiều nhóm, món thực vật khác; kết quả đúng và không tự ép profile về VEGAN/LACTO_OVO.
2. **Precedence:** allowance không vượt qua allergy EGG/MILK, specific ingredient allergy hoặc explicit exclusion. Unknown/classification chưa review và nested components vẫn bị xử lý bảo toàn.
3. **Đồng nhất:** search/count/pagination, suitable/unsuitable reasons, related/recommendations và mọi meal-plan/program/analysis mutation/confirm dùng cùng constraints. Ngày chay legacy không ảnh hưởng kết quả hoặc chặn generation.
4. **State/cache:** save/read/reopen/cancel/error/stale version, web↔mobile, chuyển viewer; recipe/post/recommendation/meal-plan/program/analysis caches cập nhật. Đổi profile khiến analysis cũ phải kiểm tra lại.
5. **Ảnh hưởng thực đơn/auth:** cả hai action thay/giữ, không tác động, no-candidates/cancel/error, ngày quá khứ/hôm nay/tương lai, programs/alternatives, profile đổi lần nữa, version/catalog races, idempotency, ownership và persistence thật. Không kiểm thử compatibility phiên bản cũ.
6. **Backend gates:** lint, typecheck, build, OpenAPI generation và served `/api-docs.json`; existing meal-plans/meal-analysis acceptance + API checks tạm thời. Không thêm backend unit/integration suite.
7. **Client gates:** web sync Swagger/typecheck/lint/tests/build; mobile typecheck/lint/tests/Expo bundling và QA iOS/Android riêng. Expo web/export không được báo là đã kiểm chứng native.
8. **Handoff:** `git diff --check`, cleanup fixtures, evidence, status/error catalog/changelog, root docs/FOOD_DATA_SOURCES/backend maintenance record và web/mobile docs tương ứng. Chưa mark READY khi gate hoặc consumer migration còn thiếu.

## 8. Artifacts chi tiết và trạng thái hiện tại

Spec Kit workspace local: `frontend/specs/035-direct-food-preferences/` gồm spec, research, plan, data-model, contract, quickstart và checklist triển khai. Thư mục specs và .specify bị frontend/.gitignore bỏ qua; tài liệu này và báo cáo kiểm chứng là artifacts tracked chính.

Backend, web và mobile đã triển khai bốn allowances, reviewed food groups, impact/keep/repair, durable compatibility và confirmed-program revision. Các gates backend/client và live API/browser được ghi tại [DIETARY_PREFERENCES_VERIFICATION.md](DIETARY_PREFERENCES_VERIFICATION.md). Phần chưa chạy là authenticated native iOS/Android E2E và web↔native qua UI; không dùng kết quả Expo bundle hoặc responsive web để khẳng định đã qua native QA.

**Changelog 2026-11-19 (1.2):** thay trạng thái kế hoạch bằng kết quả triển khai, liên kết bằng chứng và giữ rõ giới hạn kiểm chứng native.
