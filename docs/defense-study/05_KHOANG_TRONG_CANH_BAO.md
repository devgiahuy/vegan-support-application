# 5. Khoảng trống, mâu thuẫn tài liệu và việc cần chốt

Các mục dưới đây được đối chiếu tĩnh tại nhánh `dev`, `HEAD 0feaca2`, ngày 08/11/2026. Đây là checklist chuẩn bị bảo vệ, không phải kết luận đã tái hiện mọi lỗi trên browser. Với mỗi mục, chuẩn bị câu trả lời theo trạng thái **hiện có** và bằng chứng source.

## Ưu tiên 0 — không được trình bày sai trạng thái

| Vấn đề | Bằng chứng | Việc nên chốt | Câu trả lời nếu chưa chốt |
|---|---|---|---|
| Scan ảnh tủ lạnh/hóa đơn còn `IN_PROGRESS` | [Phase status](../../backend/docs/IMPLEMENTATION_PHASES.md), [Integration registry](../../frontend/docs/BACKEND_INTEGRATION.md) | Đánh giá provider trên ảnh thật đại diện, failure behavior và native/device acceptance trước khi đổi `READY`. | “Luồng job/confirm chạy trong development, nhưng accuracy và gate production chưa hoàn tất.” |
| Hai `/images` có FE `Yes` trong bảng tổng hợp nhưng bảng chi tiết còn `No`; status vẫn `IN_PROGRESS` | [Backend Integration](../../frontend/docs/BACKEND_INTEGRATION.md), source web scan | Đồng bộ registry và kiểm tra UI đang chạy; không coi `FE integrated = Yes` là backend `READY`. | “Code có luồng development, nhưng status backend và đối chiếu provider còn mở.” |
| Phạm vi Contributor review chưa thống nhất hoàn toàn | [SRS §3](../SRS.md), [moderation repository](../../backend/src/modules/moderation/moderation.repository.ts) | SRS giới hạn Contributor review nội dung Member đủ điều kiện. Hai đường quyết định trong repository đang kiểm tra loại trừ tác giả `ADMIN`, không có kiểm tra rõ `author.role === MEMBER`; cách đếm báo cáo cao cũng khác giữa hai đường. Cần audit/kiểm thử trước khi khẳng định các ca ngoài Member. | “Theo yêu cầu được duyệt, Contributor review bài Member đủ điều kiện; tình huống ngoài phạm vi này cần kiểm tra/fix thêm.” |
| Tài liệu backend tổng quan/release audit còn PostgreSQL và số OpenAPI cũ | [Backend workflows](../../backend/docs/BACKEND_FEATURES_AND_WORKFLOWS.md), [release checklist](../../backend/docs/RELEASE_CHECKLIST.md), [current Prisma schema](../../backend/prisma/schema.prisma), [Mongo migration](../../backend/docs/MONGODB_MIGRATION.md) | Cập nhật các living docs hoặc đánh dấu historical snapshot; dùng MongoDB khi trả lời kiến trúc hiện hành. | “Database hiện tại là MongoDB qua Prisma; thư mục PostgreSQL là legacy migration.” |
| Recipe AI draft còn `IN_PROGRESS` | [Schema](../../backend/src/modules/content/recipe-draft.schemas.ts), [registry](../../frontend/docs/BACKEND_INTEGRATION.md) | Request hiện yêu cầu tên, mô tả và danh sách nguyên liệu; kiểm tra provider thật trước khi demo. | “AI chỉ trả preview; user lưu/gửi qua luồng thông thường.” |

## Ưu tiên 1 — lỗi dễ bị lộ khi demo hoặc bị hỏi sâu

| Vấn đề | Hành vi source hiện tại | Cách sửa/kiểm tra trước bảo vệ |
|---|---|---|
| Fixture fallback có thể biến lỗi ghi thành success giả | [api-fallback.ts](../../frontend/src/features/post/utils/api-fallback.ts) cho network error và 5xx fallback; [recipe.api.ts](../../frontend/src/features/recipe/api/recipe.api.ts) dùng cho mutation. | Tách demo mock explicit khỏi API live; mutation live phải throw, toast success chỉ sau backend success. Kiểm thử create/update/delete khi offline/500. |
| Session đổi nhưng private Query cache có thể còn dữ liệu tài khoản trước | [forceLogout](../../frontend/src/lib/auth-refresh.ts) xóa token/store nhưng không clear QueryClient; manual logout ở [auth.queries.ts](../../frontend/src/features/auth/queries/auth.queries.ts) có clear. | Có một session lifecycle cancel/clear private queries trên mọi đường logout/identity change; kiểm tra A → force logout trên trang public → login B. |
| Cần xác nhận cache sau khi đổi allergy/diet | [diet.queries.ts](../../frontend/src/features/diet-preferences/queries/diet.queries.ts) hiện invalidate recipe, recommendation, post, meal-plan/program/analysis và profile. | Không lặp nhận định cũ rằng chưa invalidate recipe; kiểm tra UI sau đổi cấu hình và khi đổi tài khoản trên snapshot demo. |
| Giá trị nutrition `null` bị mapper đổi thành 0 | [recipe.mapper.ts](../../frontend/src/features/recipe/mappers/recipe.mapper.ts) dùng `safeNumber(..., 0)` cho macro; [SRS](../SRS.md) yêu cầu provenance/uncertainty. | Model/UI phải tách “chưa biết” và 0 thực; sửa mapper và test null/zero. Khi chưa sửa, không dùng card `0 kcal` làm bằng chứng dữ liệu. |
| OTP/onboarding có thông báo thành công theo timer | [verify-otp page](<../../frontend/src/app/(auth)/verify-otp/page.tsx>), [onboarding page](<../../frontend/src/app/(auth)/onboarding/page.tsx>) | Ẩn/ghi rõ demo UI hoặc nối API theo contract `READY` khi scope cho phép. Không trình bày toast như xác thực/lưu backend thật. |

Các điểm trên được đối chiếu tĩnh với source hiện tại; chúng là rủi ro cần tái hiện hoặc giải thích, không phải chứng minh đã khai thác được dữ liệu người khác hay đã gây sự cố production. [Review 15/10](../../frontend/docs/FRONTEND_ARCHITECTURE_REVIEW_2026-10-15.md) là lịch sử.

## Ưu tiên 2 — acceptance và phụ thuộc ngoài

- **Ảnh thật:** fake/local provider và mocked adapter không chứng minh độ chính xác với ảnh tủ lạnh/hóa đơn tiếng Việt. [SCAN_DEV](../../mobile/docs/SCAN_DEV.md) ghi lần real provider trước bị `429 credit_balance_exhausted`; nhà cung cấp mới cần quota/config và tập ảnh được phép. Mobile scan chỉ bật trong dev runtime theo ngoại lệ đã ghi; native camera/permissions còn cần acceptance trên thiết bị.
- **Thêm ảnh sau upload:** nút web mới reserve/upload/commit từng file rồi gọi add-images. Nếu upload đã commit nhưng gọi job thất bại, asset còn tồn tại và có thể tính quota. Cần kiểm tra recovery/retry và trạng thái asset; đừng bấm upload lại mù. Nguồn: [web fridge button](../../frontend/src/features/ingredient-vision/components/fridge-add-photos-button.tsx), [web receipt button](../../frontend/src/features/receipt/components/receipt-add-photos-button.tsx).
- **payOS:** thiếu merchant keys thì checkout tắt; nếu có keys, checkout dev có thể chuyển tiền thật. External merchant/real transfer acceptance còn phụ thuộc tài khoản và không cần để chứng minh luồng settlement ở code. Nguồn: [SRS FR-17](../SRS.md), [billing service](../../backend/src/modules/billing/billing.service.ts).
- **Nhà hàng:** discovery/details không tự dùng personal profile; kiểm tra explicit `dietPattern` riêng, dữ liệu provider vẫn chưa xác minh. [Registry 4.47](../../frontend/docs/BACKEND_INTEGRATION.md).
- **Thông báo:** bảng endpoint ghi web `Yes` nhưng phần ghi chú vẫn nói fixture mock-only. Kiểm tra [consumer](../../frontend/src/features/notification/) và Network trên môi trường demo trước khi tuyên bố web live.
- **Frontend snapshot:** [review 15/10](../../frontend/docs/FRONTEND_ARCHITECTURE_REVIEW_2026-10-15.md) ghi lint/test/build của ngày đó. Không đọc số đó như gate đã pass cho commit demo hiện tại.
- **Thông báo, bản đồ và AI:** in-app notification không phải push; provider map label không đủ chứng minh an toàn dị ứng; AI estimate/verification không phải tư vấn chuyên môn được chứng nhận.

## Checklist chốt bản demo

1. Ghi `HEAD`, branch, `git status` và môi trường backend/frontend/mobile đang chạy. Phân biệt file chưa commit với bản trong Git.
2. Đồng bộ trạng thái trong integration registry và tài liệu cũ trước khi in slide. Với scan, ghi `IN_PROGRESS` cho đến khi đạt gate.
3. Chạy gate phù hợp trên **đúng snapshot demo**: frontend typecheck, mapper tests, build; backend lint/typecheck/build và các acceptance cần thiết nếu có sửa backend. Ghi lệnh, ngày, kết quả, giới hạn.
4. Chạy tay ít nhất: đăng nhập → diet filter; draft → submit → Admin khác approve; 21 slot có/không đủ candidate; Pantry adjustment/shopping gap; một ca version conflict.
5. Nếu chọn demo scan, kiểm tra provider, quota, ảnh, asset, job status và việc confirm thật sự đổi Pantry. Không thử gây lỗi quota của dịch vụ ngoài ngay trước giờ chấm.
6. Chuẩn bị câu nói cho mọi mock, `IN_PROGRESS`, lỗi network và phụ thuộc payment. Không tuyên bố hoàn tất một gate chỉ vì route hoặc nút bấm đã xuất hiện.

## Bằng chứng kiểm tra tài liệu này

Đã đối chiếu tĩnh SRS/Implementation Plan, phase status, integration registry và source liên quan. Không chạy lại API/provider/browser acceptance hoặc test/build trong lượt cập nhật tài liệu này. Các link cho phép lần theo source; kiểm tra lại khi project đổi commit.
