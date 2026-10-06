# WORK-LOG — Nhật ký làm việc (agent cập nhật sau mỗi task)

> Agent BẮT BUỘC append 1 entry sau mỗi task xong (xem `ARCHITECTURE.md` mục 7).
> Mỗi entry ghi: đã làm gì, file đổi, cách verify, % PROGRESS đổi ra sao.

## [2026-10-06] — Redesign và khắc phục lỗi responsive, sidebar phần /admin/dashboard?tab=content

- Mục tiêu:
  - Khắc phục triệt để lỗi sidebar desktop bị cuộn trôi khỏi màn hình tạo khoảng trắng khổng lồ (media_1791224719019.png) do thiếu `sticky` và cố định `h-screen`.
  - Khắc phục lỗi sidebar mobile: menu bị drop inline gây vỡ giao diện; chuyển sang Sheet Drawer (`side="left"`) chuẩn mực, có backdrop và đóng tự động khi bấm link.
  - Sửa lỗi căn giữa vô lý ở tiêu đề bảng và nút "Tạo nội dung" trong `AdminContentManager` (media_1791224721038.png).
  - Khắc phục lỗi bảng nội dung bị cuộn tràn mất cột "Tiêu đề" bên trái và các nút thao tác "Lịch sử", "Xoá", "Sửa" bị ép hẹp chồng lên nhau thành 3 hàng dọc.
  - Thiết kế kiến trúc hiển thị kép cho `AdminContentTable`: Giao diện Desktop bảng dữ liệu chuẩn chống tràn với DropdownMenu thao tác gọn gàng + Giao diện Mobile Cards tối ưu màn hình cảm ứng.
  - Tối ưu bộ lọc `AdminContentFilters` theo lưới chuẩn 4 cột, nút xoá từ khoá nhanh và đồng bộ tab URL qua `useRouter`.
- Đã làm:
  - **Tối ưu Admin Layout (`src/app/(admin)/admin/layout.tsx`)**:
    - Chuyển sidebar desktop sang `sticky top-0 h-screen overflow-y-auto` đảm bảo luôn bám sát màn hình khi cuộn trang, triệt tiêu hoàn toàn khoảng trắng vô tận ở giữa.
    - Tích hợp `Sheet` drawer chuẩn Radix/shadcn cho mobile/tablet kèm nút hamburger trên header, hiển thị trọn vẹn danh mục, đo lường dung lượng DB và thông tin Admin thật từ `useAuthStore`.
    - Đồng bộ tiêu đề Breadcrumb động theo tab đang xem (Quản lý nội dung, Kiểm duyệt, v.v.).
  - **Đồng bộ Tab Navigation (`src/app/(admin)/admin/dashboard/page.tsx`)**:
    - Dùng `useRouter` để khi người dùng click tab trên dashboard sẽ cập nhật URL `?tab=...`, giữ sidebar và nội dung đồng bộ hai chiều 100%.
  - **Tái thiết kế `AdminContentManager` (`admin-content-manager.tsx`)**:
    - Thay thế header căn giữa bằng bố cục ngang phân cách rõ nét: Tiêu đề + badge số lượng bên trái, nút "Tạo nội dung" bên phải.
    - Chuẩn hóa style cho Alert cảnh báo tự duyệt và Alert danh sách nội dung xuất bản với nền màu dịu mắt, icon đồng điệu.
  - **Tối ưu `AdminContentFilters` (`admin-content-filters.tsx`)**:
    - Bố cục lưới 4 cột (Từ khoá tìm kiếm, Loại nội dung, Chuyên mục, Trạng thái) với nút X xoá từ khoá nhanh.
    - Khu vực bộ lọc nâng cao (Tác giả, Khoảng ngày) hiển thị gọn gàng, có nhãn ghi chú "Chờ CG-01" và giải thích rõ ràng theo FR-003.
    - Nút "Xoá bộ lọc" tích hợp huy hiệu đếm số lượng bộ lọc đang kích hoạt.
  - **Tái thiết kế `AdminContentTable` (`admin-content-table.tsx`)**:
    - Bảng desktop có chiều rộng các cột cố định (`min-w`), đường viền gọn gàng.
    - Cột "Thao tác" dùng nút "Sửa" trực tiếp + DropdownMenu (`...`) cho các hành động phụ (Gửi duyệt, Lịch sử, Xoá) giúp chiều rộng luôn cố định ~100px, tuyệt đối không bị ngắt thành 3 dòng.
    - Bổ sung giao diện thẻ Mobile Card cho màn hình nhỏ (`< md`), loại bỏ việc phải cuộn ngang bất tiện trên điện thoại.
- File tạo/sửa:
  - `src/app/(admin)/admin/layout.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/features/admin-content/components/admin-content-manager.tsx`
  - `src/features/admin-content/components/admin-content-filters.tsx`
  - `src/features/admin-content/components/admin-content-table.tsx`
  - `src/features/admin-content/components/admin-content-self-review-notice.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npx vitest run src/features/admin-content`: 47/47 tests pass 100%.
  - `npm run build`: Turbopack build thành công 46/46 routes tĩnh và dynamic.
- PROGRESS: Giao diện Quản trị viên và Quản lý nội dung (`/admin/dashboard?tab=content`) hoàn thiện 100% chuẩn responsive và desktop UX.
- Còn lại / rủi ro: Không có.

## [2026-10-05] — Redesign giao diện tải ảnh quét tủ lạnh trang /pantry/scan (in-frame showcase, Lightbox zoom, hỗ trợ 1–6 ảnh các ngăn tủ)

- Mục tiêu:
  - Khắc phục lỗi tương tự trang scan hóa đơn trên trang quét tủ lạnh `/pantry/scan`: ảnh sau khi tải lên bị rơi ra ngoài khung dropzone, khung rỗng chiếm diện tích phía trên, thiếu công cụ xem trước chi tiết (Lightbox phóng to/xoay/kiểm tra nét thực phẩm).
  - Tái thiết kế toàn bộ khu vực tải và duyệt ảnh tủ lạnh (`FridgeUploadZone`) theo chuẩn UI/UX cao cấp, tích hợp ảnh hiển thị trực tiếp trong khung làm việc, hỗ trợ kiểm kê đa ngăn tủ (1 đến 6 ảnh).
- Đã làm:
  - **Tái thiết kế `FridgeUploadZone` (`src/features/ingredient-vision/components/fridge-upload-zone.tsx`)**:
    - Chuyển đổi trạng thái linh hoạt: Khung kéo thả đứt nét rỗng ban đầu tự động biến đổi thành bàn làm việc ảnh tủ lạnh tích hợp khi đã chọn từ 1 đến 6 ảnh.
    - Hỗ trợ xem ảnh đơn nổi bật: Layout rộng rãi, hiển thị ảnh toàn cảnh/ngăn chính bằng `object-contain`, tên tệp co giãn tự động `min-w-0 flex-1 truncate`, nút "Phóng to" ngắn gọn, thông số dung lượng và trạng thái rõ ràng.
    - Dải mời thêm ngăn tủ tiếp theo (ngăn rau củ, ngăn đông, cánh tủ...) nằm ngang co giãn linh hoạt toàn màn hình.
    - Bố cục lưới đa ảnh (2–6 ảnh): Hỗ trợ đổi thứ tự các ảnh (`←` / `→`), nút xóa từng ảnh, ô thêm ảnh tiếp theo với hiệu ứng kéo thả mượt mà.
    - Tích hợp Lightbox Preview Dialog: Bấm trực tiếp vào ảnh hoặc nút "Phóng to" để mở modal phóng to, thu nhỏ, xoay 90°, đặt lại góc nhìn giúp người dùng kiểm tra rõ từng loại rau củ, thực phẩm trước khi khởi tạo AI.
    - Thanh tiến trình tải lên chi tiết và nút CTA "Bắt đầu nhận diện AI (X ảnh)" kèm loading spinner.
- File tạo/sửa:
  - `src/features/ingredient-vision/components/fridge-upload-zone.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 46 test files, 527/527 tests pass (100%).
  - `npm run build`: Turbopack build thành công 46/46 routes tĩnh và động.
- PROGRESS: Trải nghiệm quét tủ lạnh tại `/pantry/scan` hoàn thiện cao cấp, 100% responsive và đồng bộ thiết kế với `/receipts/scan`.
- Còn lại / rủi ro: Không có.

## [2026-10-05] — Redesign giao diện tải ảnh hóa đơn trang /receipts/scan (hiển thị trực tiếp trong khung làm việc, Lightbox zoom, sắp xếp đoạn ảnh)

- Mục tiêu:
  - Khắc phục lỗi trải nghiệm khi người dùng tải ảnh hóa đơn lên trang `/receipts/scan`: ảnh bị hiển thị ngoài khung dropzone ("bị hiển thị ngoài khung"), khung dropzone trống cũ vẫn chiếm nửa trên màn hình gây thừa thãi, ảnh hóa đơn dài bị cắt mép do `object-cover`, tên tệp bị đè che chữ trên hóa đơn.
  - Tái thiết kế toàn bộ khu vực tải và xem trước ảnh hóa đơn theo chuẩn UI/UX cao cấp, tích hợp ảnh trực tiếp vào khung làm việc liền mạch (in-frame showcase).
- Đã làm:
  - **Tái thiết kế `ReceiptUploadZone` (`src/features/receipt/components/receipt-upload-zone.tsx`)**:
    - Chuyển đổi trạng thái linh hoạt: Khi chưa chọn ảnh, hiển thị khung kéo thả & nút chọn ảnh / chụp camera thân thiện. Khi đã chọn từ 1 đến 4 ảnh, khung tải biến đổi thành bàn làm việc trực quan ngay trong khung (không còn khung đứt nét rỗng thừa thãi phía trên).
    - Hỗ trợ xem ảnh 1 hóa đơn nổi bật: Layout 2 cột rộng rãi, ảnh hóa đơn hiển thị bằng `object-contain` giữ trọn vẹn 100% tỉ lệ hóa đơn không bị xén viền, thanh thông số tách rời sạch sẽ bên dưới ảnh (không đè text lên hóa đơn).
    - Bố cục đa đoạn (2–4 ảnh): Hiển thị lưới thẻ theo từng đoạn, hỗ trợ đổi vị trí thứ tự các đoạn (chuyển trước / sau) để AI ghép nối đúng chiều từ trên xuống dưới, kèm ô thêm đoạn tiếp theo trực quan.
    - Tích hợp Lightbox Preview Dialog: Cho phép người dùng bấm vào ảnh hoặc nút "Phóng to xem nét chữ" để phóng to, thu nhỏ, xoay 90°, đặt lại góc nhìn nhằm kiểm tra độ rõ nét của chữ trên hóa đơn trước khi bóc tách.
    - Hỗ trợ kéo thả ảnh ở mọi trạng thái: Kéo thả tệp ảnh đè lên vùng làm việc để thêm đoạn tiếp theo với hiệu ứng drag-over mượt mà.
    - Tối ưu thanh hành động & tiến trình: Thanh tiến trình chi tiết khi upload, nút Hủy / Chọn lại và nút CTA "Bắt đầu bóc tách hóa đơn (X ảnh)" với hiệu ứng loading spinner.
    - Sửa triệt để lỗi responsive: Loại bỏ bố cục 2 cột gây ép chiều ngang khiến chữ bị tràn "Phóng to xem nét ch...", chuyển sang bố cục đơn cột rộng rãi, file name có `min-w-0 flex-1 truncate` không đẩy nút ra ngoài, đổi nút thành "Phóng to" ngắn gọn, di chuyển tooltip hover xuống góc dưới tránh che chữ món ăn trên hóa đơn, dải thêm đoạn 2 co giãn linh hoạt toàn màn hình.
  - **Cập nhật `ReceiptScanClientView` (`src/app/(site)/receipts/scan/receipt-scan-client-view.tsx`)**:
    - Loại bỏ thẻ bọc viền thừa ngoài `ReceiptUploadZone` để tránh tình trạng lồng 2 lớp viền (card inside card).
- File tạo/sửa:
  - `src/features/receipt/components/receipt-upload-zone.tsx`
  - `src/app/(site)/receipts/scan/receipt-scan-client-view.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 46 test files, 527/527 tests pass (100%).
  - `npm run build`: Turbopack build thành công 46/46 routes tĩnh và động.
- PROGRESS: Trải nghiệm quét hóa đơn tại `/receipts/scan` hoàn thiện cao cấp, 100% responsive trên mọi kích thước màn hình.
- Còn lại / rủi ro: Không có.

## [2026-10-03] — Switch development scan providers to real OpenAI

- User explicitly requested real providers after completing fake-provider acceptance. Restarted only the dedicated backend/mobile dev processes on ports 4003/8084 with VISION_PROVIDER=openai, RECEIPT_PROVIDER=openai and matching EXPO_PUBLIC_SCAN_PROVIDER=openai. No shared .env, API key or model changes.
- Updated mobile provider label/policy and tests, contextual provider error copy, .env.example and dev restart instructions. Existing fake jobs retain their original identity/results; new scans are required. Production guard and backend IN_PROGRESS statuses unchanged.
- Verify: mobile typecheck and targeted lint pass; provider-policy tests pass. Created new jobs from committed owned sample assets: both persisted provider openai, then FAILED with no candidates. Cancelled diagnostic jobs without Pantry confirmation. Direct OpenAI diagnostic still returns 429 credit_balance_exhausted / insufficient_quota. This verifies selection, not successful recognition or model validity.
- Remaining: replenish provider credits or configure an authorized key with quota; real-image and physical-device acceptance remain open. No commit/push.

## [2026-10-03] — Mobile scan workflows integrated under approved dev exception

- Muc tieu: finish fridge and receipt mobile integration with fake development providers after explicit user approval of the IN_PROGRESS exception.
- Da lam: centralized six endpoints per scan kind; dev-only opt-in guards on UI/API; create/get/edit/confirm/cancel/retry API functions through mappers; owner-scoped TanStack queries/mutations and polling; camera/library picker, validation, image ordering, signed Cloudinary upload/commit, recovery without redundant upload, resumable job ID in route; editable/rejectable candidates and explicit selected-version confirmation diff; invalidate Pantry/shopping caches only at confirmation boundary; new routes and Pantry links. Session-keyed workspace clears previous account state. PrimaryButton now exposes its accessible button role. Shared backend .env and OpenAI defaults unchanged.
- File tao/sua: mobile/src/features/scanning/{api,queries,components,lib,mappers}, mobile/src/app/{fridge-scan,receipt-scan,pantry}.tsx, endpoint constants, PrimaryButton, mobile/.env.example, mobile/docs/SCAN_DEV.md; integration/progress/work-log docs.
- Verify: sync:swagger pass (168 endpoints). Mobile typecheck/targeted lint pass; 23/23 related tests pass including production guard and confirmation/retry mapping. Android export pass; web export pass (65 routes). HTTP checks pass create/replay, edit/version conflict, explicit confirm/replay, partial failure, retry/cancel for both scan groups. Standalone Chrome/Playwright UI checks pass seed login, actual Cloudinary upload/commit, fake results, candidate edit/select and Pantry confirmation on both routes; no browser runtime errors or horizontal page overflow. Mobile/desktop screenshots inspected and constrained layout refined. Integrated browser tool remained unavailable, so standalone Playwright was used. QA cache/dependencies/screenshots stay under ignored .expo/.
- PROGRESS: both mobile scan workflows integrated and verified in dev. Backend status remains IN_PROGRESS, production scans disabled. Fake confirmations changed seed-account demo inventory during acceptance; no user content or unrelated changes reverted.
- Preview: http://localhost:8084/pantry against fake-provider backend http://localhost:4003/api/v1. Ports override only these dedicated processes; setup and restart steps are in mobile/docs/SCAN_DEV.md.
- Con lai: successful OpenAI recognition still blocked by exhausted credits; physical-device camera/library permissions and recognition-quality acceptance remain pending. Full mobile lint had pre-existing unrelated failures in the earlier audit; no backend domain changes or new backend test infrastructure. No commit/push requested.

## [2026-10-03] — Real upload/provider diagnostic and shared mobile scan UI

- Muc tieu: finish remaining fridge/receipt mobile workflows where contract gates permit, and identify the real-image blocker with actual requests.
- Da lam: real signed Cloudinary upload and backend commit of repository fridge/receipt samples pass. Started a network-enabled backend on port 4002 because sandboxed backend requests could not reach Cloudinary. Created/cancelled both scan jobs; no Pantry confirmation. Direct OpenAI request returned 429 credit_balance_exhausted / insufficient_quota. No key/model/provider configuration changed.
- File tao/sua: mobile/src/features/scanning/{types,mappers,lib,components}; shared result view with original-image inspection, uncertainty, selection controls and action callbacks; candidate editor with canonical picker, quantities, freshness/receipt text/prices/currency; request mappers and validation tests. API/query/routes intentionally not wired while the READY-only rule applies.
- Verify: mobile typecheck and scanning ESLint pass; all 21 related mobile mapper/workflow/validation tests pass. Real Cloudinary upload/commit 200; scan create 202 followed by FAILED; direct provider diagnostic confirms exhausted credits. Native camera and UI visual acceptance not run; screens are not yet wired into app.
- PROGRESS: shared mobile implementation prepared, not an integrated scan capability. Status remains IN_PROGRESS. Requested explicit approval for a development-only fake-provider integration exception; no approval received at time of this record. Successful live recognition still requires provider credit and a passing readiness gate.

## [2026-10-03] — Scan readiness audit and local database setup

- Muc tieu: investigate actual blockers for mobile fridge/receipt integration rather than infer missing backend implementation from conflicting status tables.
- Da lam: backed up local database, deployed 24 pending migrations, regenerated Prisma Client, seeded data and built/started current backend on port 4001. Mobile web on port 8083 uses this backend. Reconciled current scan status tables to the latest Phase 21/22 IN_PROGRESS gate; preserved historical web integration records.
- Verify: backend lint/typecheck pass; existing vision and receipt fake-provider acceptance scripts pass, including correction, retry/cancel, ownership/idempotency and explicit Pantry confirmation. Running OpenAI HTTP create returns 202; local seed image jobs reach FAILED with PARTIAL_PROVIDER_FAILURE / PARTIAL_RECEIPT_EXTRACTION and zero candidates. Audit jobs cancelled; no confirmation performed. Seed URLs are relative local fixtures, rejected by the owned HTTPS Cloudinary input restriction before provider inference.
- PROGRESS: database blocker cleared and documentation contradiction resolved. Mobile scan consumers remain not integrated under the READY-only rule; real Cloudinary upload, representative-image recognition and device acceptance remain open. No claim about key/model validity or provider outage follows from these fixture failures.
- File doi: BACKEND_INTEGRATION.md, PROGRESS.md, WORK-LOG.md. No backend domain or mobile behavior changes in this readiness audit.

## [2026-10-03] — Mobile Pantry, shopping preview, storage and avatar completion

- Mục tiêu: tiếp tục các phần mobile còn lại trong `DOC_WDP.docx` trên `feature/mobile-table-completion`, dùng contract `READY` và kiến trúc DTO/Model/Mapper/API/Query.
- Đã làm: hoàn thiện Pantry với phân trang, lọc hạn trong 7 ngày, quan sát/ngày mua-ngày mở-hạn dùng, consume/restore/adjust, lịch sử, gộp có preview và xác nhận; sửa nhãn hạn dùng theo contract mới và bỏ `freshnessNote: null` khỏi request create. Thêm shopping preview với món công khai/món riêng, khẩu phần, lượng thiếu/dư và dòng chưa quy đổi. Thêm tab Dung lượng ở Profile, ảnh đại diện từ thư viện/camera, preview, signed reservation upload, commit/release, phục hồi commit khi mất response và retry lưu hồ sơ không upload lại.
- File tạo/sửa: `mobile/src/features/{pantry,shopping,storage}`, `mobile/src/features/profile/components/avatar-editor.tsx`, `mobile/src/app/{pantry,shopping-preview}.tsx`, Profile, endpoint constants, `mobile/app.json`, dependency `expo-image-picker`; sync generated API catalog từ backend OpenAPI hiện tại.
- Verify: 15/15 mapper/workflow tests pass bằng Node test runner qua tsx hiện có trong backend; `npx tsc --noEmit`, targeted lint, Expo web export (63 routes) và Android bundle export pass; `git diff --check` pass. Full mobile lint vẫn có 6 lỗi và 5 warnings có sẵn trong các file ngoài phạm vi task (my-content, bottom-tab-bar, AI artifact sheets, restore-session, community-panel). Camera/library và Cloudinary chưa kiểm thử trên thiết bị; browser automation không kết nối được do lỗi môi trường công cụ. Expo web preview: `http://localhost:8082`.
- PROGRESS: ghi riêng tiến độ mobile ở `PROGRESS.md`; không đổi tỷ lệ hoàn thành của web hoặc tuyên bố đã qua acceptance native/live.
- Còn lại / rủi ro: scan tủ lạnh/hóa đơn giữ chưa tích hợp do latest phase `IN_PROGRESS`. Backend cũ ở cổng 4000 trả 404 cho các route mới. Backend current-source ở cổng kiểm tra riêng lỗi login vì database thiếu `contributor_profiles.approval_evidence`; `prisma migrate status` cho thấy 24 migration chưa áp dụng. Chỉ regenerate Prisma Client; không migrate/reset database.

## Mẫu entry (copy khi ghi mới)

```md
## [YYYY-MM-DD] — <tên task>

- Mục tiêu:
- Đã làm:
- File tạo/sửa:
- Verify: `npx tsc --noEmit` (kết quả), `npm test` (kết quả), test tay (mô tả)
- PROGRESS: <task> <cũ>% → <mới>% (lý do)
- Còn lại / rủi ro:
```

## [2026-10-03] — Cập nhật màu sắc trực quan cho các ô thông tin dinh dưỡng tại trang chi tiết thực đơn (/meal-plans/[id])

- Mục tiêu:
  - Thêm màu sắc phân biệt trực quan và hài hòa cho 4 ô chỉ số dinh dưỡng mục tiêu mỗi ngày (Đạm, Béo, Xơ, Bột) và các huy hiệu dinh dưỡng ngày theo yêu cầu người dùng.
- Đã làm:
  - Cập nhật 4 ô thông tin dinh dưỡng mục tiêu tại `src/app/(site)/meal-plans/[id]/page.tsx`:
    - Đạm (Protein): Tông Emerald (`bg-emerald-50/60`, viền `border-emerald-200/80`, dot `bg-emerald-500`, dark mode `dark:bg-emerald-950/25`).
    - Chất béo (Fat): Tông Sky (`bg-sky-50/60`, viền `border-sky-200/80`, dot `bg-sky-500`, dark mode `dark:bg-sky-950/25`).
    - Chất xơ (Fiber): Tông Purple (`bg-purple-50/60`, viền `border-purple-200/80`, dot `bg-purple-500`, dark mode `dark:bg-purple-950/25`).
    - Tinh bột (Carbs): Tông Amber (`bg-amber-50/60`, viền `border-amber-200/80`, dot `bg-amber-500`, dark mode `dark:bg-amber-950/25`).
    - Nâng cấp typography, visual hierarchy và hover state nhẹ nhàng cho các ô chỉ số.
    - Cải thiện header khối với Badge hiển thị dung sai cho phép rõ ràng.
  - Đồng bộ hệ màu tương ứng cho các huy hiệu dinh dưỡng tổng hàng ngày trong `DayGrid` (`src/features/meal-plan/components/day-grid.tsx`): Calo (Orange), Đạm (Emerald), Béo (Sky), Xơ (Purple), Bột (Amber) khi chưa vượt ngưỡng, và chuyển cảnh báo Rose khi vượt ngưỡng.
- File tạo/sửa:
  - `src/app/(site)/meal-plans/[id]/page.tsx`
  - `src/features/meal-plan/components/day-grid.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typecheck.
  - `npm test`: 46 test files, 526/526 tests pass (100%).
  - `npm run build`: Turbopack build thành công 46/46 pages.
- PROGRESS: Giữ nguyên tiến độ hoàn thành các tính năng cốt lõi, cải thiện thẩm mỹ UI/UX theo phản hồi người dùng.
- Còn lại / rủi ro: Không có rủi ro; tương thích đầy đủ với cả light mode và dark mode.

## [2026-10-03] — Convergence lần 3 `/restaurants`: đưa `providerLabel`/`locationStored` tới UI, gỡ code chết, xử lý mâu thuẫn US3/AC4 (spec 006 Phase 9, T071–T073)

- Mục tiêu:
  - Đóng 3 khoảng trống còn lại sau 2 lượt hội tụ trước (T071–T073).
- Đã làm:
  - **T071 — xử lý mâu thuẫn giữa `US3/AC4` và mục `## Phạm vi`**:
    - **Vấn đề**: `US3/AC4` yêu cầu *"đề xuất bị từ chối → lý do từ chối hiển thị rõ ràng bằng tiếng Việt"*, nhưng `## Phạm vi` loại danh sách "quán của tôi" (`GET /restaurants/mine`) khỏi đợt này. Từ chối xảy ra **bất đồng bộ** bởi quản trị viên nên không có bề mặt nào trong phạm vi để hiện lý do từ chối. Đây là hệ quả của `/speckit-clarify` Q1 (chọn phạm vi hẹp): khi bỏ User Story 4 và thu gọn User Story 3, AC4 cũ của US3 bị sót lại.
    - **Quyết định**: giữ nguyên phạm vi (không thêm `mine`), làm phần trong phạm vi và **nói rõ với người dùng** kết quả sẽ được thông báo sau:
      - `restaurant.queries.ts` — toast thành công nay ghi rõ *"Kết quả duyệt — kể cả lý do nếu bị từ chối — sẽ được thông báo cho bạn sau"*, tăng `duration` lên 6000ms để người dùng đọc kịp.
      - `submit-form.tsx` — ghi chú trong hộp thoại cũng nêu rõ điều tương tự, để thông tin xuất hiện **trước khi** gửi chứ không chỉ sau khi gửi.
    - **Kênh thông báo thực tế**: backend đã phát notification cho quyết định duyệt đề xuất quán của thành viên (Phase 25, `BACKEND_INTEGRATION.md`). Vì vậy lý do từ chối **sẽ** tới người dùng qua kênh notification, không phải qua trang khám phá.
    - **Việc còn lại**: hiển thị lý do từ chối ngay trong trang khám phá cần `GET /restaurants/mine` → tách sang đợt sau cùng "quán của tôi". `US3/AC4` giữ nguyên trong spec làm acceptance scenario cho đợt đó.
  - **T072 — đưa `providerLabel` và `locationStored` tới giao diện**:
    - `locationStored` và `providerLabel` trước đó được `toDiscoveryMeta` map ra và có test nhưng **không `.tsx` nào dùng**, trái với ý định ghi ở `data-model.md` §2.2.
    - Thêm `DiscoveryNoticeKind` `'PRIVACY'`; `buildNotices` sinh cam kết *"Vị trí bạn dùng để tìm kiếm chỉ dùng cho lần tìm này và không được lưu giữ"* khi `meta.locationStored === false` — đây là bằng chứng hiển thị cho `SC-007`.
    - Thông báo `ATTRIBUTION` nay **nêu đích danh nhà cung cấp** (`Google Maps` / `SerpApi` / `dữ liệu minh hoạ`) thay vì nói chung "nhà cung cấp bên ngoài".
    - `result-notice.tsx` render `PRIVACY` với kiểu nhạt (chữ 11px, không nền cảnh báo) vì đây là thông tin điều kiện chứ không phải cảnh báo — tránh gây nhiễu.
    - Bổ sung 2 test; **cập nhật 2 test cũ** vì backend luôn trả `locationStored: false` nên `PRIVACY` luôn xuất hiện (trước đó 2 test giả định không có notice nào).
  - **T073 — gỡ code chết, nhưng chọn nối vào dùng thay vì xoá khi có giá trị thực**:
    - **Nối vào dùng**: `formatBoundsLabel` được hiển thị trên `page.tsx` khi đang ở chế độ tìm theo vùng, để người dùng biết chính xác vùng đang tìm (`FR-006`).
    - **Xoá**: `estimateBoundsRadiusM` (thừa vì đã có `meta.providerResultLimit`), `boundsSchema`, `advancedFiltersSchema`, `locationQuerySchema` và biến `radiusM` sinh ra từ nó, `GeocodeLocation`, `RestaurantReviewAction`.
    - **An toàn**: đã xác minh ràng buộc của bộ lọc nâng cao được thực thi ở `restaurant.mapper.toDiscoveryParams` (`toIntInRange`/`toNumberInRange`) và bounds ở `isBoundsUsable`, nên xoá schema thừa **không làm mất validation nào**. UI dùng `Select` giá trị cố định nên zod không tham gia vào đường nhập liệu.
- File tạo/sửa:
  - `src/features/restaurant/queries/restaurant.queries.ts` (T071)
  - `src/features/restaurant/components/submit-form.tsx` (T071)
  - `src/features/restaurant/types/restaurant.model.ts` (T072 — thêm kind `PRIVACY`; T073 — gỡ 2 type chết)
  - `src/features/restaurant/mappers/restaurant.mapper.ts` (T072 — sinh `PRIVACY` + nêu tên provider)
  - `src/features/restaurant/components/result-notice.tsx` (T072 — render `PRIVACY`)
  - `src/features/restaurant/mappers/restaurant.mapper.test.ts` (T072 — +2 test, cập nhật 1 test)
  - `src/features/restaurant/api/restaurant.api.test.ts` (T072 — cập nhật 1 test)
  - `src/features/restaurant/utils/restaurant-bounds.ts` (T073 — gỡ `estimateBoundsRadiusM`)
  - `src/features/restaurant/utils/restaurant-bounds.test.ts` (T073 — gỡ test tương ứng)
  - `src/features/restaurant/schemas/restaurant.schema.ts` (T073 — gỡ 3 schema + 1 biến chết)
  - `src/app/(site)/restaurants/page.tsx` (T073 — nối `formatBoundsLabel`)
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 46 test files, **526/526** tests pass (100%). Lượt trước 527 → **-1** do gỡ test của hàm đã xoá; **+2** test mới cho `PRIVACY`/`providerLabel`; **+1** test cho `emptyStateCopy` ở Phase 8. Không regress.
  - `npm run build`: Turbopack compile thành công, 46/46 static pages.
  - `npm run lint` riêng phạm vi đã sửa: **4 error, 3 warning — bằng đúng baseline**; không file mới/sửa nào tạo thêm lint error.
  - Test tay: **vẫn chưa chạy được** — backend chưa khởi động ở `localhost:4000`. VS-14 là kịch bản kiểm chứng phần trong phạm vi của T071.
- PROGRESS: Task #8 (UC-12) giữ 100% — hoàn thiện ý định đã nêu trong data-model và dọn code chết, không thêm capability mới; không thêm dòng `Lịch sử cập nhật` vì `%` không đổi.
- Còn lại / rủi ro:
  - **T003 + T056 + VS-01..VS-18 vẫn chưa chạy** vì backend chưa chạy. Đây là hạng mục bàn giao duy nhất còn mở sau 3 lượt hội tụ.
  - `US3/AC4` được giữ nguyên trong spec làm acceptance scenario cho đợt sau; nếu quyết định chuyển sang kênh notification vĩnh viễn thì cần sửa spec ở lần `/speckit-clarify` sau (ngoài phạm vi `/speckit-converge` vì lệnh này không được sửa `spec.md`).
  - Cam kết riêng tư (`PRIVACY`) hiện hiển thị ở mọi lần tìm vì backend luôn trả `locationStored: false`. Nếu sau này thấy gây nhiễu, có thể chỉ hiện ở lần tìm đầu tiên của phiên.
  - 4 lint error `react-hooks/set-state-in-effect` còn lại **có sẵn từ trước tính năng này** ở `restaurant-map.tsx`, `use-google-maps.ts`, `review-restaurant-dialog.tsx`; chưa xử lý vì ngoài phạm vi.

## [2026-10-03] — Convergence lần 2 `/restaurants`: nút xoá từ khoá, trạng thái nút tìm vùng, điện thoại trên thẻ quán (spec 006 Phase 8, T067–T070)

- Mục tiêu:
  - Đóng 4 khoảng trống mà `/speckit-converge` lượt 2 phát hiện sau Phase 7 (T067–T070). Tất cả đều là khoảng trống mức UX/a11y, không phải sai logic dữ liệu.
- Đã làm:
  - **T067 — nút xoá nhanh từ khoá (MEDIUM, `US2/AC3`)**: ô "Tìm theo tên quán hoặc món ăn" giờ có icon tìm kiếm bên trái và nút `X` bên phải (chỉ hiện khi có từ khoá, `aria-label` tiếng Việt). Hỗ trợ thêm phím `Escape` để xoá. Trước đây người dùng phải xoá tầm từng ký tự vì nút "Xoá tất cả" reset cả bán kính và trường phái ăn — không phải cùng ý nghĩa.
  - **T068 — nút "Tìm trong vùng đang xem" có trạng thái (MEDIUM, `FR-005`/`SC-005`)**: thêm prop `canSearchThisArea` cho cả `RestaurantMap` và `MapFallback`; nút bị vô hiệu hoá khi bản đồ chưa có khung vùng hợp lệ, kèm `title` giải thích "Hãy kéo hoặc thu phóng bản đồ để chọn vùng cần tìm". Trước đó nút luôn bật còn `handleSearchThisArea` im lặng `return` → người dùng bấm mà không có phản hồi. `page.tsx` thêm state mirror `hasViewBounds` (không nằm trong `searchState` nên không đổi `queryKey`) và được reset cùng `boundsRef` ở mọi đường đổi vị trí.
  - **T069 — số điện thoại trên thẻ quán (LOW, `FR-007`)**: `FR-007` liệt kê "thông tin liên hệ" là nội dung bắt buộc của thẻ trong danh sách nhưng thẻ chỉ có ở trang chi tiết. Thêm link `tel:` kèm `stopPropagation` để không kích hoạt chọn quán, và `aria-label` nêu rõ tên quán.
  - **T070 — hành động gợi ý khi rỗng nhất quán (LOW, `FR-010`)**: `emptyStateCopy('KEYWORD')` bổ sung "Đổi vị trí" để cả ba chế độ đều cho lối thoát; `page.tsx` tách gate của "Xoá bộ lọc" và "Xoá bộ lọc nâng cao" — trước đó cả hai dùng chung `hasFilters` khiến nút "Xoá bộ lọc nâng cao" hiện cả khi không có bộ lọc nâng cao nào, bấm vào không làm gì. Nay dùng `countActiveAdvancedFilters`. Bổ sung 1 test.
- File tạo/sửa:
  - `src/features/restaurant/components/restaurant-filters.tsx` (T067)
  - `src/features/restaurant/components/restaurant-map.tsx` (T068)
  - `src/features/restaurant/components/map-fallback.tsx` (T068)
  - `src/app/(site)/restaurants/page.tsx` (T068, T070)
  - `src/features/restaurant/components/restaurant-card.tsx` (T069)
  - `src/features/restaurant/utils/restaurant-search.ts` (T070)
  - `src/features/restaurant/utils/restaurant-search.test.ts` (T070 — thêm 1 test)
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 46 test files, **527/527** tests pass (100%). Lượt trước 526 → +1 test. Không regress.
  - `npm run build`: Turbopack compile thành công, 46/46 static pages.
  - `npm run lint` riêng phạm vi đã sửa: **4 error, 3 warning — bằng đúng baseline**; không file mới/sửa nào tạo thêm lint error.
  - Test tay: **vẫn chưa chạy được** — backend chưa khởi động ở `localhost:4000`. VS-06 (xoá từ khoá quay lại chế độ lân cận) và VS-08 (tìm theo vùng) là hai kịch bản chứng minh T067/T068.
- PROGRESS: Task #8 (UC-12) giữ 100% — hoàn thiện trải nghiệm và a11y, không thêm capability mới; không thêm dòng `Lịch sử cập nhật` vì `%` không đổi.
- Còn lại / rủi ro:
  - **T003 + T056 + VS-01..VS-18 vẫn chưa chạy** vì backend chưa chạy. Đây là hạng mục bàn giao duy nhất còn mở sau 3 lượt hội tụ.
  - `handleBoundsChange` giờ gọi `setHasViewBounds` — đây là setState trong callback của bản đồ (không phải trong thân effect) nên không vi phạm `react-hooks/set-state-in-effect`.
  - 4 lint error `react-hooks/set-state-in-effect` còn lại **có sẵn từ trước tính năng này** ở `restaurant-map.tsx`, `use-google-maps.ts`, `review-restaurant-dialog.tsx`; chưa xử lý vì ngoài phạm vi.

## [2026-10-03] — Convergence `/restaurants`: sửa bug chế độ BOUNDS, debounce từ khoá, a11y bàn phím, dọn code chết

- Mục tiêu:
  - Đóng 8 khoảng trống mà `/speckit-converge` phát hiện sau khi `spec 006` đã triển khai xong (Phase 7, T059–T066).
  - Trọng tâm là **F1**: bug làm chế độ tìm theo vùng bản đồ không hoạt động, lọt qua 4 gate tự động vì nằm trong file `.tsx` mà `vitest` không chạy.
- Đã làm:
  - **T059 — sửa bug BOUNDS (HIGH, `contradicts`)**: `page.tsx` hardcode `mode: 'NEARBY'` trong `searchState`. `restaurantMapper.toDiscoveryParams` rẽ nhánh theo `state.mode` và `restaurantApi.getNearby` giữ nguyên mode, nên chế độ BOUNDS gửi `lat`/`lng` thay vì `north`/`south`/`east`/`west`. Hệ quả: nút "Tìm trong vùng đang xem" chỉ đổi cache key mà **không** đổi request → người dùng thấy y hệt kết quả cũ. Sửa bằng cách tính `resolvedMode` qua `resolveSearchMode` và truyền vào `searchState`.
  - **T060 — debounce từ khoá (HIGH, `partial`)**: dùng `useDebounce` đã có sẵn ở `src/hooks/useDebounce` (400ms) cho `debouncedQuery`; ô nhập vẫn phản hồi tức thì vì gắn vào `query`. Giữ nguyên ngưỡng ≥2 ký tự của `resolveSearchMode`.
  - **T061 — nội dung trạng thái rỗng theo chế độ (MEDIUM)**: `emptyStateCopy(mode)` trước đó chỉ có test, không nơi nào dùng nên mọi chế độ rỗng đều rơi về một chuỗi mặc định. Nay `page.tsx` truyền `emptyTitle`/`emptyDescription` xuống `RestaurantList`, và nút hành động được lọc theo chế độ: "Nới bán kính" chỉ hiện khi không phải BOUNDS và còn dưới trần 50km; "Xoá từ khoá" chỉ hiện khi từ khoá đã đủ 2 ký tự.
  - **T062 — vòng tròn bán kính trên Google Maps thật (MEDIUM)**: `MapFallback` đã vẽ vòng bán kính nhưng `RestaurantMap` không vẽ, nên bản đồ thật không phản ánh ranh giới khu vực tìm (FR-004). Thêm `google.maps.Circle` trong ref, dùng `setMap(null)` khi dọn, bỏ qua lỗi không dùng setState trong effect, và ẩn khi đang ở chế độ tìm theo vùng.
  - **T063 — thao tác bàn phím cho thẻ quán (MEDIUM, SC-004)**: `RestaurantCard` trước đó chỉ có `onClick` chuột, không chọn được bằng bàn phím. Thêm `tabIndex={0}`, `aria-current`, xử lý Enter/Space (chặn Space để không cuộn trang) và vòng focus hiển thị.
  - **T064 — một nguồn sự thật cho ngày trong tuần (LOW)**: thay string literal `'mon' | 'tue' | ...` bằng `RestaurantWeekday` enum trong `advanced-filters.tsx`, `restaurant.mapper.toDiscoveryParams` và `sanitizeAdvancedFilters`.
  - **T065 — notice `STALE` (LOW)**: `DiscoveryNoticeKind` khai báo `'STALE'` nhưng không nơi nào sinh. Nay `toDiscoveryModel` sinh notice khi có quán quá 30 ngày chưa cập nhật, kèm số lượng; bổ sung 1 test.
  - **T066 — dọn code chết (LOW, `unrequested`)**: gỡ `hasUsableBounds` và `clearPersistedFilters` (định nghĩa nhưng không dùng). `RestaurantPriceLevel` và `RestaurantWeekday` được đưa vào sử dụng thật ở T064 thay vì xoá.
- File tạo/sửa:
  - `src/app/(site)/restaurants/page.tsx` (T059, T060, T061)
  - `src/features/restaurant/components/restaurant-map.tsx` (T062)
  - `src/features/restaurant/components/restaurant-card.tsx` (T063)
  - `src/features/restaurant/components/advanced-filters.tsx` (T064, T066)
  - `src/features/restaurant/mappers/restaurant.mapper.ts` (T064, T065)
  - `src/features/restaurant/mappers/restaurant.mapper.test.ts` (T065 — thêm 1 test notice `STALE`)
  - `src/features/restaurant/utils/restaurant-search.ts` (T064, T066)
  - `src/features/restaurant/utils/use-restaurant-search-session.ts` (T066)
  - `src/common/enums/index.ts` (T066 — bổ sung tài liệu cho `RestaurantPriceLevel`)
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 46 test files, **526/526** tests pass (100%). Lượt trước 525 → +1 test (notice `STALE`). Không regress.
  - `npm run build`: Turbopack compile thành công, 46/46 static pages.
  - `npm run lint` riêng phạm vi đã sửa: **4 error, 3 warning — bằng đúng baseline**; không file mới/sửa nào tạo thêm lint error.
  - Test tay: **vẫn chưa chạy được** — backend chưa khởi động ở `localhost:4000`. Riêng VS-08 (kiểm chứng tìm theo vùng) là kịch bản chứng minh bug T059 đã hết; cần chạy khi backend sẵn sàng.
- PROGRESS: Task #8 (UC-12) giữ 100% — sửa lỗi và hoàn thiện trải nghiệm, không thêm capability mới; chưa thêm dòng `Lịch sử cập nhật` vì `%` không đổi, chỉ bổ sung nội dung vào entry redesign ngày 2026-10-03.
- Còn lại / rủi ro:
  - **T003 + T056 + VS-01..VS-18 vẫn chưa chạy** vì backend chưa chạy. Đây là hạng mục bàn giao duy nhất còn mở.
  - Bug T059 lọt qua cả 4 gate tự động vì `page.tsx` là `.tsx` và `vitest.config.ts` chỉ chạy `.test.ts` trong env node. Mọi logic quyết định ở trang phải tiếp tục đẩy xuống `utils/*.ts` để có test.
  - `restaurant-map.tsx`, `use-google-maps.ts`, `review-restaurant-dialog.tsx` còn 4 lint error `react-hooks/set-state-in-effect` **có sẵn từ trước tính năng này**; chưa xử lý vì ngoài phạm vi.

## [2026-10-03] — Redesign toàn bộ giao diện `/restaurants` + gắn đủ endpoint Phase 24 (spec `006-restaurants-discovery-redesign`)

- Mục tiêu:
  - Thiết kế lại toàn bộ trải nghiệm tìm quán chay theo vị trí / theo địa điểm / theo món ăn trên route `/restaurants` (UC-12 / BL-16), và nối đầy đủ các endpoint `READY` sẵn có mà giao diện cũ chưa dùng tới.
  - Ba lỗi trình bày dữ liệu sai có sẵn được phát hiện trong lúc đối chiếu contract và phải sửa, không phải thiếu sót giao diện.
- Đã làm:
  - **Đối chiếu contract**: đọc `backend/src/modules/restaurants/restaurant.openapi.ts` + `restaurant.schemas.ts` + `prisma/schema.prisma` vì `docs/api/restaurants.md` bị sinh tự động và cắt cụt (`"_truncated": true`), không đủ xác định `meta`.
  - **Tầng enum**: `RestaurantSource` đổi thành đúng 4 giá trị contract (`INTERNAL`/`GOOGLE`/`SERPAPI`/`FAKE`, bỏ `GOOGLE_PLACES`); thêm `RestaurantOpenState`, `RestaurantDietTag`, `RestaurantWeekday`, `RestaurantPriceLevel`.
  - **DTO**: `RestaurantDto` mở rộng lên 36 field có alias `pickField` (tọa độ `latitude/longitude`, `rating`, `reviewCount`, `price`, `openState`, `operatingHours`, `phone`, `website`, `thumbnailUrl`, `mapsUrl`, `externalPlaceId`, `attribution`, `matchReasons`, `dietaryReviewed`); `meta` bổ sung 5 trường provider; `GeocodeResponseDto` theo `data.address`; `SubmitRestaurantRequestDto` viết lại theo `submitRestaurantSchema`.
  - **Model**: thêm 13 field có nhãn tiếng Việt chuẩn bị sẵn, 2 cờ dữ liệu `isExternal` / `requiresDietaryWarning`, `hasCoordinates`; thêm `RestaurantDiscoveryMeta`, `RestaurantDiscoveryResult`, `DiscoveryNotice`, `RestaurantSearchState`, `RestaurantBounds`, `RestaurantAdvancedFilters`, `RestaurantGeocodeResult`.
  - **Mapper**: `toDiscoveryModel` (map 8 field meta + sinh `notices` UNAVAILABLE/TRUNCATED/ATTRIBUTION), `toDiscoveryParams` (phân nhánh NEARBY/BOUNDS/KEYWORD, clamp `radiusMeters` 100–50000, chỉ gửi 6 tham số lọc nâng cao ở mode KEYWORD, **không** gửi `page`/`limit`), `toGeocodeResult` (`isAvailable: false` khi `data: null`), `toSubmitDto` (chỉ field trong schema, lọc `dietTags` ngoài enum). Bỏ suy đoán `totalPages` — backend không gửi field này nên `hasNextPage` luôn sai trước đây.
  - **Sửa 3 lỗi dữ liệu sai**:
    1. `RestaurantSource` cũ chỉ có 2 giá trị và mapper gộp mọi nguồn lạ về `INTERNAL` → quán `FAKE`/`SERPAPI` bị hiển thị với nhãn "Cộng đồng VeggieConnect", tức bị trình bày như quán nội bộ đã kiểm duyệt.
    2. `address-form.tsx` khi geocode trả `data: null` dùng tọa độ trung tâm Hà Nội (21.0285, 105.8542) → người dùng ở TP.HCM thấy kết quả hoàn toàn không liên quan mà không hiểu vì sao.
    3. `dietPattern` gửi `LACTO_VEGETARIAN`/`OVO_VEGETARIAN` trong khi Prisma `enum DietPattern` chỉ có `VEGAN`/`LACTO_OVO` và là chuỗi đơn → lọc cứng trường phái ăn không hoạt động đúng ý nghĩa.
  - **Logic thuần tách ra module riêng** (`utils/restaurant-bounds.ts`, `utils/restaurant-search.ts`): `vitest.config.ts` đặt `environment: 'node'` + `include: ['src/**/*.test.ts']` nên không test được component `.tsx`; các quy tắc quyết định (chế độ tìm, đếm bộ lọc, hợp lệ bounds, loại tọa độ khỏi dữ liệu phiên) phải nằm ở module `.ts` thuần.
  - **Ràng buộc riêng tư**: `sanitizePersistedFilters` là điểm chặn duy nhất giữa dữ liệu phiên và tọa độ người dùng; dùng `sessionStorage` (không `localStorage`), chỉ ghi `{query, radiusM, dietPattern, advanced}`. Vị trí chỉ nằm trong state của trang → mỗi lần mở trang phải xác nhận lại.
  - **Giao diện**: viết lại `page.tsx` (shell split-view, bounds nằm trong ref để kéo/zoom không phát sinh request), `restaurant-filters.tsx` (3 lọc cơ bản + badge đếm), `restaurant-card.tsx` (rating/giá/trạng thái mở cửa/attribution/cảnh báo chế độ ăn/dữ liệu cũ), `restaurant-list.tsx` (4 trạng thái + skeleton đúng chiều cao thẻ + nút hành động khi rỗng), `restaurant-map.tsx` + `map-fallback.tsx` (phát bounds, nút "Tìm trong vùng đang xem"), `address-form.tsx` (bỏ bịa tọa độ), `submit-form.tsx` (payload mới, `latitude`/`longitude` bắt buộc).
  - **Tạo mới**: `components/result-notice.tsx`, `components/advanced-filters.tsx` (`Sheet` của shadcn, mọi điều khiển là giá trị cố định đúng ràng buộc backend), `utils/restaurant-bounds.ts`, `utils/restaurant-search.ts` và 2 file test tương ứng.
  - **Phạm vi giữ nguyên**: trang chi tiết `/restaurants/[id]` và khu vực kiểm duyệt trong bảng quản trị chỉ vá tối thiểu (nhãn `dietaryTagLabels`, `priceLabel`, cảnh báo chế độ ăn), không thiết kế lại bố cục.
- File tạo/sửa:
  - Tạo: `src/features/restaurant/utils/restaurant-bounds.ts`, `src/features/restaurant/utils/restaurant-bounds.test.ts`, `src/features/restaurant/utils/restaurant-search.ts`, `src/features/restaurant/utils/restaurant-search.test.ts`, `src/features/restaurant/utils/use-restaurant-search-session.ts`, `src/features/restaurant/components/result-notice.tsx`, `src/features/restaurant/components/advanced-filters.tsx`.
  - Sửa: `src/common/enums/index.ts`, `src/features/restaurant/types/restaurant.dto.ts`, `src/features/restaurant/types/restaurant.model.ts`, `src/features/restaurant/mappers/restaurant.mapper.ts`, `src/features/restaurant/mappers/restaurant.mapper.test.ts`, `src/features/restaurant/api/restaurant.api.ts`, `src/features/restaurant/api/restaurant.api.test.ts`, `src/features/restaurant/queries/restaurant.queries.ts`, `src/features/restaurant/schemas/restaurant.schema.ts`, `src/features/restaurant/__fixtures__/restaurant-fixtures.ts`, `src/features/restaurant/components/location-prompt.tsx`, `src/features/restaurant/components/address-form.tsx`, `src/features/restaurant/components/restaurant-filters.tsx`, `src/features/restaurant/components/restaurant-list.tsx`, `src/features/restaurant/components/restaurant-card.tsx`, `src/features/restaurant/components/restaurant-map.tsx`, `src/features/restaurant/components/map-fallback.tsx`, `src/features/restaurant/components/submit-form.tsx`, `src/features/restaurant/components/restaurant-detail.tsx`, `src/app/(site)/restaurants/page.tsx`, `docs/PROGRESS.md`.
  - Tài liệu spec: `specs/006-restaurants-discovery-redesign/` (spec, plan, research, data-model, contracts, quickstart, tasks, checklists).
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 46 test files, 525/525 tests pass (100%). Baseline trước khi sửa: 44 files / 427 tests → **+2 file, +98 test**, không regress.
  - `npm run build`: Turbopack compile thành công, 46/46 static pages.
  - `npm run lint` (Gate 4): repo có **116 lỗi pre-existing** không thuộc phạm vi này (ví dụ `src/lib/mapper/field-helpers.ts` dùng `any`). Lint riêng `src/features/restaurant` + `src/app/(site)/restaurants` + `src/common/enums/index.ts`: **4 error, 3 warning — bằng đúng baseline** của các file đó (đã xác minh bằng `git stash` và lint lại bản gốc). **Không file mới/sửa nào của tính năng này tạo thêm lint error.**
  - Test tay: **chưa chạy được** — backend chưa khởi động ở `localhost:4000` (`BACKEND_UNREACHABLE`) nên bỏ trống 18 kịch bản VS-01..VS-18 trong `quickstart.md`. Các kiểm tra thay thế đã chạy: xác nhận tọa độ không lưu qua `sanitizePersistedFilters` (có test riêng), geocode `data: null` trả `isAvailable: false` (có test riêng), nguồn `FAKE`/`SERPAPI` không mang nhãn nội bộ (có test riêng), payload đề xuất đúng tên field (có test riêng), không gửi `page`/`limit` (có test riêng).
- PROGRESS: Task #8 (UC-12) giữ 100% — không phải thêm capability mà nâng cấp chất lượng hiện có; thêm 1 dòng vào `Lịch sử cập nhật` mô tả 3 lỗi đã sửa và danh sách năng lực mới.
- Còn lại / rủi ro:
  - **18 kịch bản kiểm chứng tay (VS-01..VS-18) chưa chạy** vì backend chưa chạy. Cần chạy lại khi backend `:4000` sẵn sàng; đặc biệt VS-05 (không còn bịa tọa độ Hà Nội), VS-09 (quán ngoài không mang nhãn nội bộ), VS-15 (session storage không chứa tọa độ), VS-18 (trang chi tiết + bảng quản trị không hỏng).
  - Chưa có quà hoàn toàn hợp lệ để kiểm tra kích hoạt `resultsTruncated` và `externalDataUnavailable` từ phía backend — hiện đã có test đơn vị cho đúng nhánh sinh notice.
  - `minPrice`/`maxPrice` là thang 4 mức của provider, không phải số tiền VND; UI đã ghi rõ trong nhãn nhưng cần kiểm lại khi có dữ liệu thật.
  - Danh sách "quán của tôi" (`GET /restaurants/mine`), lịch sử kiểm duyệt và chỉnh sửa quán nội bộ của quản trị viên vẫn `READY` nhưng nằm ngoài phạm vi đợt này.

## [2026-09-28] — Ẩn bảng phân tích dinh dưỡng tĩnh (mock) tại sidebar trang /recipes/[id]

- Mục tiêu:
  - Ẩn thẻ "Phân tích dinh dưỡng (1 khẩu phần)" tĩnh ở cột phải trang chi tiết công thức (`/recipes/[id]`).
  - Nguyên nhân: Thẻ này hiển thị số liệu tĩnh / giá trị mặc định (`recipe.carbs || 35`, `fat || 8`, `fiber || 6`) và nội dung tuyên bố viện dẫn tổ chức bên ngoài không thuộc dữ liệu tính toán thực tế, gây trùng lặp với thẻ phân tích dinh dưỡng động có xét hao hụt chế biến (`RecipeNutritionCard` Phase 13) đang hiển thị ở cột chính.
- Đã làm:
  - Loại bỏ khối Card "Phân tích dinh dưỡng (1 khẩu phần)" trong sidebar phải tại [`src/features/recipe/components/recipe-detail-view.tsx`](file:///d:/Project/vegan-support-application/frontend/src/features/recipe/components/recipe-detail-view.tsx).
  - Giữ lại phần hiển thị "Món chay cùng chuyên mục" (`relatedRecipes`) để người dùng tiếp tục khám phá công thức liên quan.
- File tạo/sửa:
  - `src/features/recipe/components/recipe-detail-view.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests pass (100%).
  - `npm run build`: Turbopack compile thành công 46/46 routes.
- PROGRESS: Giao diện chi tiết công thức tinh gọn, chính xác, chỉ giữ lại thẻ tính toán dinh dưỡng thực tế chuẩn xác của hệ thống.
- Còn lại / rủi ro: Không có.

## [2026-09-28] — Bổ sung UI Picker trực quan cho phần chọn mục tiêu tại trang /meal-plans

- Mục tiêu:
  - Khắc phục tình trạng các thẻ chọn Mục tiêu ("Giữ cân", "Giảm cân", "Tăng cân") trong form Tạo thực đơn mới (`/meal-plans`) không có phản hồi thị giác khi được chọn, khiến người dùng không phân biệt được mục tiêu nào đang kích hoạt.
  - Nguyên nhân: Trước đó component dùng selector Tailwind `has-checked:...` trong khi `RadioGroupItem` của Radix UI render thẻ `<button role="radio">` (dùng `data-state="checked"`, không khớp pseudo-class `:checked` của CSS) và ẩn `sr-only` mà không truyền state `isSelected` vào style của thẻ bao ngoài, đồng thời thiếu biểu tượng chỉ báo đã chọn (check indicator).
- Đã làm:
  - Cập nhật [`src/features/meal-plan/components/generate-form.tsx`](file:///d:/Project/vegan-support-application/frontend/src/features/meal-plan/components/generate-form.tsx):
    - Đưa trạng thái chọn `isSelected = goal === option.value` vào điều kiện hiển thị của thẻ Card `Label`.
    - Khi được chọn: viền nổi bật `border-primary`, nền nhấn nhẹ `bg-primary/5 dark:bg-primary/10`, viền sáng `ring-1 ring-primary`, đổ bóng `shadow-xs`, tiêu đề chuyển màu `text-primary font-semibold`.
    - Bổ sung UI Picker indicator hình tròn ở góc phải tiêu đề mỗi thẻ: khi được chọn hiển thị vòng tròn màu chủ đạo có icon checkmark (`Check` stroke 3); khi chưa chọn hiển thị vòng tròn viền mờ `border-muted-foreground/35`.
    - Bảo toàn khả năng điều hướng bàn phím (phím mũi tên, Tab, Space) và accessibility (`aria-labelledby`, `sr-only` RadioGroupItem).
- File tạo/sửa:
  - `src/features/meal-plan/components/generate-form.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests pass (100%).
  - `npm run build`: Turbopack compile thành công 46/46 routes.
- PROGRESS: Form tạo thực đơn tuần hiển thị UI picker rõ ràng, tức thì khi thay đổi mục tiêu.
- Còn lại / rủi ro: Không có.

## [2026-09-28] — Khắc phục lỗi mất Header và Footer tại trang /pantry và /pantry/scan

- Mục tiêu:
  - Khắc phục tình trạng khi truy cập trang `/pantry` (Tủ bếp gia đình) và `/pantry/scan` bị mất thanh điều hướng đầu trang (SiteHeader) và chân trang (SiteFooter).
  - Nguyên nhân: Thư mục định tuyến `pantry` trước đó được đặt trực tiếp ở cấp gốc `src/app/pantry` thay vì nằm trong route group `src/app/(site)/pantry`, dẫn tới Next.js chỉ sử dụng `src/app/layout.tsx` (chỉ chứa Providers) mà bỏ qua `src/app/(site)/layout.tsx` (nơi bọc `SiteHeader` và `SiteFooter`).
- Đã làm:
  - Di chuyển toàn bộ cấu trúc thư mục từ `src/app/pantry` sang `src/app/(site)/pantry` bằng `git mv`:
    - `src/app/(site)/pantry/page.tsx`
    - `src/app/(site)/pantry/pantry-client-view.tsx`
    - `src/app/(site)/pantry/scan/page.tsx`
    - `src/app/(site)/pantry/scan/fridge-scan-client-view.tsx`
  - Giữ nguyên toàn bộ đường dẫn URL (`/pantry`, `/pantry/scan`), mã nguồn logic, các import `@/` và Suspense boundary.
  - Xóa cache build `.next` và kiểm tra lại TypeScript, Vitest và Turbopack build.
- File tạo/sửa:
  - `src/app/(site)/pantry/page.tsx` (di chuyển từ `src/app/pantry/page.tsx`)
  - `src/app/(site)/pantry/pantry-client-view.tsx` (di chuyển từ `src/app/pantry/pantry-client-view.tsx`)
  - `src/app/(site)/pantry/scan/page.tsx` (di chuyển từ `src/app/pantry/scan/page.tsx`)
  - `src/app/(site)/pantry/scan/fridge-scan-client-view.tsx` (di chuyển từ `src/app/pantry/scan/fridge-scan-client-view.tsx`)
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests pass (100%).
  - `npm run build`: Next.js Turbopack build thành công 46/46 routes, `/pantry` và `/pantry/scan` nằm trong app router layout chuẩn có `SiteHeader` và `SiteFooter`.
- PROGRESS: Trang `/pantry` và `/pantry/scan` hiển thị đầy đủ Header & Footer đồng bộ toàn hệ thống.
- Còn lại / rủi ro: Không có.

## [2026-09-28] — Loại bỏ hoàn toàn Mock/Fixture data và bổ sung Logging chi tiết luồng Map & Restaurants (Phase 24)

- Mục tiêu:
  - Loại bỏ hoàn toàn mock data / fixture fallback trong `src/features/restaurant/api/restaurant.api.ts`, chuyển 100% sang gọi live backend API endpoints (`/restaurants/nearby`, `/restaurants/search`, `/location/geocode`, `/restaurants/:id`, `/restaurants`).
  - Bổ sung console.log trực quan, có cấu trúc chi tiết tại API client và Page component để lập trình viên theo dõi trọn vẹn luồng gửi request và dữ liệu nhận về từ Backend.
- Đã làm:
  - **Dọn sạch Mock Data (`restaurant.api.ts`)**:
    - Xóa bỏ các biến cục bộ và logic fallback giả lập: `USE_FIXTURES`, `delay`, `clone`, `queueStore`, `submittedStore`, `withDistance`, `applyFilters`, `haversineMeters`, `__resetRestaurantFixtures`.
    - Gọi trực tiếp instance `api` (Axios) cho tất cả các phương thức: `getNearby`, `search`, `getDetail`, `submitRestaurant`, `geocode`, `getQueue`, `reviewRestaurant`.
  - **Bổ sung Console Logs chi tiết**:
    - In rõ thông tin Request URL + Query parameters / Body payload (kèm icon `📡 Request`).
    - In dữ liệu thô nhận về từ Backend DTO (kèm icon `📥 Response raw DTO`).
    - In dữ liệu đã qua Mapper thành UI Model chuyển cho Map & List Component (kèm icon `🗺️ Mapped`).
    - Tại `src/app/(site)/restaurants/page.tsx`, bổ sung log tọa độ người dùng `coords` và danh sách `restaurants` nhận được từ TanStack Query.
  - **Cập nhật Unit Tests (`restaurant.api.test.ts`)**:
    - Sử dụng `vi.spyOn(api, 'get')` để kiểm chứng luồng truyền đúng `radiusMeters`, `lat`, `lng`, `q` và chuyển tiếp an toàn giữa search và nearby.
- File tạo/sửa:
  - `src/features/restaurant/api/restaurant.api.ts`
  - `src/features/restaurant/api/restaurant.api.test.ts`
  - `src/app/(site)/restaurants/page.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests pass (100%).
  - `npm run build`: Turbopack compile thành công 46/46 routes.
- PROGRESS: Phase 24 kết nối 100% Live REST Backend, không phụ thuộc mock fixtures.
- Còn lại / rủi ro: Không có.

## [2026-09-28] — Khắc phục triệt để chùm 8 lỗi 404 Not Found từ Next.js prefetch tại Footer

- Mục tiêu:
  - Khắc phục 8 lỗi `GET /... 404 (Not Found)` xuất hiện đồng loạt trên DevTools Console: `/posts`, `/about`, `/help`, `/privacy`, `/terms`, `/guidelines`, `/contact`, `/feedback`.
  - Nguyên nhân: Do `<Link>` tại `site-footer.tsx` trỏ tới `/posts` (trong khi trang bài viết thực tế là `/articles`) và các trang thông tin/chính sách chưa tồn tại, khiến cơ chế tự động nạp trước (pre-fetch `_rsc`) của Next.js gọi lên server và trả về mã lỗi 404.
- Đã làm:
  - **Sửa đường dẫn & Thêm Redirect**:
    - Sửa `<Link href="/posts">` thành `<Link href="/articles">` tại `src/components/layout/site-footer.tsx`.
    - Bổ sung quy tắc chuyển hướng vĩnh viễn (permanent redirect 308) từ `/posts` và `/posts/:id` sang `/articles` và `/articles/:id` trong `next.config.ts`.
  - **Khởi tạo 7 trang thông tin & chính sách chuẩn mực**:
    - `src/app/(site)/about/page.tsx`: Giới thiệu sứ mệnh, tầm nhìn, giá trị cốt lõi của VeggieConnect.
    - `src/app/(site)/help/page.tsx`: Trung tâm trợ giúp kèm danh mục FAQ giải đáp thắc mắc thường gặp.
    - `src/app/(site)/privacy/page.tsx`: Chính sách bảo mật dữ liệu, cookie HttpOnly, cam kết không bán dữ liệu.
    - `src/app/(site)/terms/page.tsx`: Điều khoản sử dụng và tuyên bố miễn trừ y tế (Medical Disclaimer SRS D22).
    - `src/app/(site)/guidelines/page.tsx`: Quy chế ứng xử và chuẩn mực cộng đồng ăn chay.
    - `src/app/(site)/contact/page.tsx`: Thông tin liên hệ, hotline, email và biểu mẫu gửi tin nhắn trực tiếp.
    - `src/app/(site)/feedback/page.tsx`: Biểu mẫu góp ý cải tiến và báo lỗi kỹ thuật với các phân loại cụ thể.
- File tạo/sửa:
  - `src/components/layout/site-footer.tsx`
  - `next.config.ts`
  - `src/app/(site)/about/page.tsx`
  - `src/app/(site)/help/page.tsx`
  - `src/app/(site)/privacy/page.tsx`
  - `src/app/(site)/terms/page.tsx`
  - `src/app/(site)/guidelines/page.tsx`
  - `src/app/(site)/contact/page.tsx`
  - `src/app/(site)/feedback/page.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests pass (100%).
  - `npm run build`: Turbopack compile thành công 46/46 routes tĩnh và động.
- PROGRESS: Triệt tiêu 100% console errors 404, bảo đảm không còn broken links tại Footer.
- Còn lại / rủi ro: Không có.

## [2026-09-28] — Tái thiết kế trải nghiệm Bản đồ & Khám phá quán chay phong cách Google Maps / GrabFood và sửa triệt để tính toán cự ly khoảng cách (Phase 24)

- Mục tiêu:
  - Khắc phục lỗi tính toán khoảng cách: người dùng ở TP.HCM tìm quán lại ra kết quả quán ở Hà Nội chỉ cách vài trăm mét (do fixture có `distanceMeters: 850` tĩnh, mapper ưu tiên `distanceMeters`, và hàm lọc `applyFilters` không lọc bán kính `radiusM`).
  - Tái thiết kế giao diện Khám phá quán chay (`/restaurants`) theo phong cách Google Maps / GrabFood Split View: bản đồ cố định ở cột trái (sticky map), danh sách thẻ quán cuộn mượt mà ở cột phải (scrollable list), chống cắt cụt tên quán (`Quán...`), đồng bộ hai chiều mượt mà.
  - Khắc phục lỗi nhãn marker bị đè/chồng chéo chữ trên bản đồ; bổ sung cụm phím điều khiển zoom (+, -, đặt lại tầm nhìn) và thẻ xem nhanh (Quick Preview Popup) khi bấm vào marker.
- Đã làm:
  - **Sửa lỗi tính cự ly & Lọc bán kính (`restaurant-fixtures.ts`, `restaurant.api.ts`)**:
    - Xóa bỏ `distanceMeters: 850` tĩnh trong fixture các quán Hà Nội.
    - Bổ sung các quán chay thực tế tại Gò Vấp (Quang Trung, Nguyễn Văn Khối) có cự ly lân cận 800m–1.2km.
    - Cập nhật hàm `withDistance` trong `restaurant.api.ts` tự động tính khoảng cách Haversine chuẩn xác theo tọa độ thực tế của người dùng và quán, ghi đè cả `distanceM` và `distanceMeters`.
    - Cập nhật `applyFilters` trong `restaurant.api.ts` lọc nghiêm ngặt theo `radiusM` (loại bỏ hoàn toàn các quán ngoài bán kính đã chọn).
    - Bổ sung sắp xếp cự ly tăng dần (từ gần nhất đến xa nhất) cho cả `search` và `getNearby`.
    - Viết unit test suite mới `restaurant.api.test.ts` (3/3 test pass) kiểm tra tìm quán ở TP.HCM loại trừ 100% quán Hà Nội và ngược lại.
  - **Tái thiết kế giao diện Google Maps / GrabFood (`page.tsx`, `restaurant-list.tsx`, `restaurant-card.tsx`)**:
    - Chuyển đổi bố cục sang Split View chuẩn mực:
      - Cột trái (`lg:col-span-7`): Sticky Map cao vừa vặn màn hình (`h-[calc(100vh-170px)] min-h-[420px] max-h-[750px]`).
      - Cột phải (`lg:col-span-5`): Khung cuộn độc lập (`max-h-[calc(100vh-220px)] overflow-y-auto`) chứa danh sách thẻ quán 1 cột rộng rãi (`grid-cols-1 gap-3`), hiển thị trọn vẹn tên quán, địa chỉ, tag chế độ ăn, món tiêu biểu và nút chi tiết mà không bị co cụm thành `Quán...`.
    - Đồng bộ 2 chiều: Khi bấm marker trên map, danh sách thẻ tự động cuộn mượt (`scrollIntoView`) đến thẻ tương ứng và highlight; khi bấm thẻ quán, marker trên map tương ứng được kích hoạt.
  - **Nâng cấp trải nghiệm Bản đồ (`MapFallback`, `RestaurantMap`)**:
    - Khắc phục đè chữ marker: Nhãn tên quán trên bản đồ chỉ hiển thị khi rê chuột (hover) hoặc khi đang chọn (`isSelected`), giữ mặt phẳng bản đồ thoáng đãng, tinh gọn.
    - Bổ sung cụm phím điều khiển phóng to (+), thu nhỏ (-), và đặt lại tầm nhìn (LocateFixed) theo tỷ lệ zoomFactor động.
    - Bổ sung thẻ xem nhanh (Quick Preview Popup) ở góc dưới bản đồ khi marker được chọn: hiển thị tên quán, badge cự ly, địa chỉ, nút Chỉ đường Google Maps và nút Chi tiết.
    - Hỗ trợ `size-full min-h-[400px]` co giãn linh hoạt theo container cha.
- File tạo/sửa:
  - `src/features/restaurant/__fixtures__/restaurant-fixtures.ts`
  - `src/features/restaurant/api/restaurant.api.ts`
  - `src/features/restaurant/api/restaurant.api.test.ts`
  - `src/features/restaurant/types/restaurant.model.ts`
  - `src/features/restaurant/components/restaurant-card.tsx`
  - `src/features/restaurant/components/restaurant-list.tsx`
  - `src/features/restaurant/components/restaurant-map.tsx`
  - `src/features/restaurant/components/map-fallback.tsx`
  - `src/app/(site)/restaurants/page.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 42 test files, 408/408 tests passed (100%).
  - `npm run build`: Turbopack compile thành công 39/39 routes bao gồm `/restaurants` và `/restaurants/[id]`.
- PROGRESS: Phase 24 UI/UX & Quality refinement hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-27] — Khắc phục triệt để lỗi bản đồ trắng, lỗi 400 Bad Request và tối ưu tìm kiếm quán chay (Phase 24)

- Mục tiêu:
  - Khắc phục lỗi 400 Bad Request khi truy vấn `/api/v1/restaurants/search`: do schema backend áp dụng `.strict()` và yêu cầu bắt buộc tham số `q` (min 2 ký tự), trong khi frontend trước đó luôn gọi `/restaurants/search` ngay cả khi không có từ khóa và truyền các tham số không hợp lệ (`radius` thay vì `radiusMeters`, `diet` thay vì `dietPattern`).
  - Khắc phục lỗi bản đồ (Map) hiển thị khung trắng tinh: do Google Maps JS SDK không thể tải khi thiếu API key hoặc bị Google API chặn, trong khi component map trước đó chưa bọc try-catch runtime exception và fallback chỉ dựa vào items.
  - Khắc phục lỗi tìm kiếm địa điểm / geocode không ra kết quả: do backend geocode trả về `latitude`, `longitude`, `address` nhưng mapper frontend chỉ đọc `lat`, `lng`, `label`; đồng thời mở rộng từ điển geocode thông minh hỗ trợ toàn diện các quận/huyện ở TP.HCM và Hà Nội khi backend dùng FakeMapsProvider.
  - Nâng cấp `MapFallback` thành Bản đồ tương tác Radar trực quan độc lập (Interactive Radar Map), đồng bộ 2 chiều với danh sách quán, hiển thị tâm người dùng, sóng radar và vòng quét bán kính tìm kiếm.
- Đã làm:
  - **DTO & Mapper**:
    - Cập nhật `RestaurantDto` và `GeocodeResponseDto` bổ sung `distanceMeters`, `dietTags`, `phone`, `website`, `operatingHours`, `latitude`, `longitude`, `address`.
    - Sửa `restaurantMapper.toModel` hỗ trợ đầy đủ các trường mới trả về từ backend, tính `distanceM` và nhãn cự ly `distanceLabel` chính xác.
    - Sửa `restaurantMapper.toCoordinates` đọc đúng các alias `latitude`/`longitude` và `address`.
    - Sửa `restaurantMapper.toLocationQuery` tuân thủ 100% strict schema của backend: truyền `radiusMeters` (100–50000), loại bỏ các tham số lạ, chỉ truyền `q` khi có từ khóa >= 2 ký tự, ánh xạ `dietPattern` sang enum `VEGAN` / `LACTO_OVO`.
    - Bổ sung 2 unit test mới cho mapper trong `restaurant.mapper.test.ts` (10/10 tests pass).
  - **API Layer (`restaurant.api.ts`)**:
    - Trong `search`: tự động chuyển sang `getNearby` nếu không có từ khóa `q` hoặc từ khóa < 2 ký tự, ngăn chặn triệt để lỗi 400 Bad Request.
    - Trong `geocode`: ưu tiên đọc tọa độ từ backend; nếu backend trả về null/lỗi thì tự động đối chiếu từ điển địa danh thông minh phong phú phủ kín các quận huyện TP.HCM và Hà Nội.
    - Mở rộng fixture dữ liệu quán chay tại các khu vực TP.HCM (Gò Vấp, Tân Bình, Phú Nhuận, Q1, Q10) và Hà Nội để khi test ở bất kỳ vị trí nào đều có quán lân cận.
  - **Bản đồ trực quan tương tác (`MapFallback` & `RestaurantMap`)**:
    - Nâng cấp `MapFallback` thành một Canvas Radar tương tác tuyệt đẹp: hiển thị tâm vị trí người dùng (chấm xanh VeggieConnect với sóng lan tỏa), vòng tròn bán kính quét (2km, 5km, 10km, 20km), các marker quán lân cận được định vị theo tỷ lệ khoảng cách địa lý thực tế.
    - Đồng bộ 2 chiều: click vào marker trên bản đồ sẽ highlight thẻ quán tương ứng ở danh sách và hiển thị card mini xem nhanh; click vào thẻ quán sẽ zoom marker trên bản đồ.
    - Khi danh sách trống: bản đồ hiển thị radar quét và gợi ý các nút bấm nhanh: "Mở rộng 10 km", "Mở rộng 20 km", "50 km".
    - Trong `RestaurantMap`: bọc an toàn try-catch khi khởi tạo `window.google.maps.Map` và markers, tự động chuyển đổi sang `MapFallback` nếu Google Maps ném lỗi DOM/runtime.
  - **Trang Khám Phá (`src/app/(site)/restaurants/page.tsx`)**:
    - Dùng hook `useRestaurantDiscoveryQuery` hợp nhất, tự động phân nhánh mượt mà giữa `nearby` và `search`.
    - Bổ sung nút "Đổi vị trí" tiện lợi cho phép người dùng thay đổi địa chỉ hoặc lấy lại GPS mà không cần reload trang.
    - Truyền `radiusM` và `onRadiusChange` đồng bộ giữa bộ lọc và bản đồ.
- File tạo/sửa:
  - `src/features/restaurant/types/restaurant.dto.ts`
  - `src/features/restaurant/mappers/restaurant.mapper.ts`
  - `src/features/restaurant/mappers/restaurant.mapper.test.ts`
  - `src/features/restaurant/__fixtures__/restaurant-fixtures.ts`
  - `src/features/restaurant/api/restaurant.api.ts`
  - `src/features/restaurant/queries/restaurant.queries.ts`
  - `src/features/restaurant/components/use-google-maps.ts`
  - `src/features/restaurant/components/map-fallback.tsx`
  - `src/features/restaurant/components/restaurant-map.tsx`
  - `src/app/(site)/restaurants/page.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi compilation.
  - `npm test`: 41 test files, 405/405 tests passed (100%).
  - `npm run build`: biên dịch thành công toàn bộ 39 routes Turbopack.
- PROGRESS: Phase 24: 100% Hoàn thiện & ổn định thực chiến.
- Còn lại / rủi ro: Không có.

## [2026-09-27] — Hoàn thành tích hợp Phase 26: Admin AI Governance & Safety (spec 027, T001–T022)

- Mục tiêu:
  - Tích hợp toàn diện 7 live endpoints quản trị AI theo Backend Phase 26: `GET /admin/ai/health`, `GET /admin/ai/metrics`, `GET /admin/ai/requests`, `GET /admin/ai/flags`, `GET /admin/ai/features`, `GET /admin/ai/features/audit`, `PATCH /admin/ai/features/:feature`.
  - Loại bỏ hoàn toàn fixture runtime (`USE_FIXTURES = false`), kết nối Axios qua `apiClient` (`src/lib/axios.ts`).
  - Bảo đảm an toàn bảo mật và quyền riêng tư: triệt tiêu 100% rủi ro rò rỉ dữ liệu cá nhân (PII), thông tin sức khỏe, ảnh, hóa đơn và raw prompt vào DOM/UI state thông qua cơ chế Mapper defense-in-depth.
  - Quản lý phiên bản lạc quan (Optimistic Concurrency Control): xử lý lỗi HTTP 409 `VERSION_CONFLICT` với thông báo tiếng Việt trực quan và tự động làm mới cấu hình.
  - Kiểm soát cấu hình tính năng AI yêu cầu chọn lý do kiểm toán từ danh mục cho phép (`PROVIDER_INCIDENT`, `QUALITY_INVESTIGATION`, `SAFETY_HOLD`, `PLANNED_MAINTENANCE`, `RESTORE_SERVICE`).
  - Hiển thị cờ kiểm duyệt an toàn AI dưới dạng tín hiệu cảnh báo hỗ trợ ra quyết định (không tự động xử phạt/xóa cứng).
- Đã làm:
  - **T001**: Khai báo 7 endpoint tập trung `API_ENDPOINTS.AI_GOVERNANCE.*` trong `src/common/constants/api-endpoints.ts`.
  - **T002**: Định nghĩa đầy đủ DTOs theo chuẩn OpenAPI Backend Phase 26 trong `ai-governance.dto.ts`.
  - **T003**: Cập nhật UI Models trong `ai-governance.model.ts` phục vụ trình diễn UI sạch.
  - **T004**: Xây dựng `AiGovernanceMapper` kế thừa `BaseMapper`, chuẩn hóa null-safety, tỷ lệ phần trăm và ẩn hoàn toàn raw prompts/sensitive fields.
  - **T005**: Cập nhật bộ unit test `ai-governance.mapper.test.ts` (11/11 tests pass 100%).
  - **T006**: Kết nối API calls thật trong `ai-governance.api.ts`, tắt runtime fixtures.
  - **T007, T010, T012, T015**: Triển khai React Query hooks (`useAiHealthQuery`, `useAiMetricsQuery`, `useAiRequestsQuery`, `useAiFeaturesQuery`, `useAiFeatureAuditQuery`, `useToggleAiFeatureMutation`) với query key factories và stale time 60s.
  - **T008**: Tạo component `HealthSummary` hiển thị trạng thái vận hành 24h, tỷ lệ lỗi, fallback và thời hạn lưu trữ dữ liệu 90 ngày.
  - **T009**: Cập nhật `MetricsOverview` với bộ lọc ngày (tối đa 90 ngày) và chỉ số hiệu năng tổng hợp.
  - **T011**: Nâng cấp `RequestsTable` hỗ trợ phân trang, bộ lọc và huy hiệu bảo vệ dữ liệu (Redacted).
  - **T013, T014**: Nâng cấp `FeaturesTable` và `FeatureToggleDialog` với dropdown chọn lý do bắt buộc và phiên bản kiểm soát.
  - **T016**: Nâng cấp `FlagsList` hiển thị điểm rủi ro và trạng thái xem xét.
  - **T017**: Tạo component `FeaturesAuditTable` hiển thị lịch sử thay đổi cấu hình tính năng của quản trị viên.
  - **T018**: Tích hợp toàn diện các thành phần vào Bảng điều khiển Quản trị (`/admin/dashboard?tab=ai-governance`).
  - **T019, T020**: Kiểm tra toàn bộ verification gates (`npx tsc --noEmit`: 0 lỗi, `npm test`: 403/403 tests pass, `npm run build`: compile thành công 39 routes).
  - **T021, T022**: Đồng bộ tài liệu `BACKEND_INTEGRATION.md` (`FE integrated = Yes (2026-09-27)`), `PROGRESS.md` (Task 15: 100% Xong, Phase 26 READY), và `specs/027-ai-governance-live-integration/tasks.md` (100% hoàn thành).
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/ai-governance/types/ai-governance.dto.ts`
  - `src/features/ai-governance/types/ai-governance.model.ts`
  - `src/features/ai-governance/mappers/ai-governance.mapper.ts`
  - `src/features/ai-governance/mappers/ai-governance.mapper.test.ts`
  - `src/features/ai-governance/api/ai-governance.api.ts`
  - `src/features/ai-governance/queries/ai-governance.queries.ts`
  - `src/features/ai-governance/components/health-summary.tsx`
  - `src/features/ai-governance/components/metrics-overview.tsx`
  - `src/features/ai-governance/components/requests-table.tsx`
  - `src/features/ai-governance/components/features-table.tsx`
  - `src/features/ai-governance/components/feature-toggle-dialog.tsx`
  - `src/features/ai-governance/components/flags-list.tsx`
  - `src/features/ai-governance/components/features-audit-table.tsx`
  - `src/features/ai-governance/index.ts`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `docs/BACKEND_INTEGRATION.md`
  - `docs/PROGRESS.md`
  - `docs/tasks/phase-26-ai-governance.md`
  - `specs/027-ai-governance-live-integration/tasks.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 41 test suites pass, 403/403 tests pass (11/11 tests pass cho ai-governance).
  - `npm run build`: 39/39 static & dynamic routes compiled và build production thành công.
- PROGRESS: Task 15 (Admin AI Governance & Safety): 70% → 100% (Hoàn thành tích hợp live API).
- Còn lại / rủi ro: Không có.

## [2026-09-27] — Hoàn thành tích hợp Phase 25: In-app Notifications Live Integration (spec 026, T001–T017)

- Mục tiêu:
  - Tích hợp live 4 endpoints thông báo nội bộ Phase 25: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
  - Loại bỏ hoàn toàn mock fixture runtime, chuyển `__fixtures__` sang test-only.
  - Phân tách riêng `useUnreadCountQuery` polling 60s cho thành viên đăng nhập, tự động tạm dừng khi tab ẩn (`refetchIntervalInBackground: false`).
  - Cập nhật DTO, Mapper, Types theo chuẩn allowlist payload v1 của Backend Phase 25.
  - Hỗ trợ optimistic updates cho thao tác đánh dấu đã đọc 1 mục và đánh dấu tất cả.
- Đã làm:
  - Bổ sung `API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT` vào `src/common/constants/api-endpoints.ts`.
  - Cập nhật `notification.dto.ts` với đầy đủ schemas OpenAPI.
  - Nâng cấp `notification.mapper.ts`: bổ sung `toUnreadCountFromDto`, map đủ nhãn tiếng Việt cho các loại thông báo Phase 25, lọc link an toàn nội bộ (`/` và không `//`).
  - Cập nhật `notification.mapper.test.ts` (14 unit tests pass 100%).
  - Chuyển `notification.api.ts` sang gọi Axios thật qua `apiClient`.
  - Nâng cấp `notification.queries.ts`: `useUnreadCountQuery`, `useNotificationsQuery`, optimistic update + rollback error handling.
  - Tối ưu `NotificationBell` và `NotificationPanel` kết nối live query và mutation.
  - Cập nhật `docs/BACKEND_INTEGRATION.md` (`FE integrated = Yes (2026-09-27)`), `docs/tasks/phase-25-notifications.md` (`COMPLETED`) và `docs/PROGRESS.md` (100% Xong).
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/notification/types/notification.dto.ts`
  - `src/features/notification/mappers/notification.mapper.ts`
  - `src/features/notification/mappers/notification.mapper.test.ts`
  - `src/features/notification/api/notification.api.ts`
  - `src/features/notification/queries/notification.queries.ts`
  - `src/features/notification/components/notification-bell.tsx`
  - `docs/BACKEND_INTEGRATION.md`
  - `docs/tasks/phase-25-notifications.md`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify: `npx tsc --noEmit` (0 lỗi), `npx vitest run src/features/notification` (14/14 tests pass).
- PROGRESS: Phase 25 (Notifications): 70% → 100% (Hoàn thành tích hợp live API).
- Còn lại / rủi ro: Không có.

## [2026-09-27] — Hoàn thành tích hợp Phase 24: Restaurants & Google Maps Integration (spec 025, T001–T041)

- Mục tiêu:
  - Tích hợp toàn diện tính năng Khám phá Quán Chay & Google Maps (UC-12 / BL-16) theo chuẩn kiến trúc 7 tầng quy định tại `docs/ARCHITECTURE.md`.
  - Kết nối live Google Maps JavaScript SDK với cơ chế suy giảm êm dịu `MapFallback` (EC-05).
  - Lọc cứng chế độ ăn (`Dietary Hard Filtering`: Vegan, Lacto, Ovo) và tính khoảng cách Haversine.
  - Hỗ trợ Geocoding địa chỉ khi từ chối cấp quyền GPS (EC-01, EC-02).
  - Thành viên gửi đề xuất quán mới (`POST /restaurants`) và Quản trị viên duyệt quán kèm lý do kiểm toán tại Admin Dashboard.
  - Hiển thị nguồn dữ liệu (`INTERNAL` vs `GOOGLE_PLACES`), ghi nhận bản quyền (`Attribution`) và cảnh báo dữ liệu cũ (>30 ngày).
- Đã làm:
  - Cài đặt dependency `@googlemaps/js-api-loader` và `@types/google.maps`.
  - Khai báo endpoint tập trung: `API_ENDPOINTS.RESTAURANTS.*`, `LOCATION.GEOCODE`, `ADMIN_RESTAURANTS.*`.
  - Nâng cấp DTO, Model, Zod schema (`addressGeocodeSchema`, `submitRestaurantSchema`, `reviewRestaurantSchema`).
  - Nâng cấp `RestaurantMapper` kế thừa `BaseMapper` xử lý an toàn các trường, format distance, gắn nhãn nguồn và tính `isStale`.
  - Viết 8 unit tests cho mapper (`restaurant.mapper.test.ts`) kiểm tra đầy đủ các trường hợp.
  - Xây dựng hook `useGoogleMaps` tải dynamic SDK và component `RestaurantMap` đồng bộ 2 chiều (Marker <-> Card), kèm `MapFallback`.
  - Nâng cấp `RestaurantFilters`, `RestaurantCard`, `RestaurantDetail`, `SubmitForm`, và `ReviewRestaurantDialog`.
  - Kích hoạt tab "Quán chờ duyệt" (`RestaurantQueueTable`) trên Bảng điều khiển Quản trị (`/admin/dashboard`).
  - Cập nhật trạng thái `FE integrated = Yes` trong `docs/BACKEND_INTEGRATION.md` và đồng bộ tiến độ trong `docs/PROGRESS.md`.
- File tạo/sửa:
  - `package.json`
  - `src/common/constants/api-endpoints.ts`
  - `src/common/enums/index.ts`
  - `src/features/restaurant/types/restaurant.dto.ts`
  - `src/features/restaurant/types/restaurant.model.ts`
  - `src/features/restaurant/schemas/restaurant.schema.ts`
  - `src/features/restaurant/mappers/restaurant.mapper.ts`
  - `src/features/restaurant/mappers/restaurant.mapper.test.ts`
  - `src/features/restaurant/api/restaurant.api.ts`
  - `src/features/restaurant/queries/restaurant.queries.ts`
  - `src/features/restaurant/components/use-google-maps.ts`
  - `src/features/restaurant/components/map-fallback.tsx`
  - `src/features/restaurant/components/restaurant-map.tsx`
  - `src/features/restaurant/components/restaurant-filters.tsx`
  - `src/features/restaurant/components/restaurant-card.tsx`
  - `src/features/restaurant/components/restaurant-list.tsx`
  - `src/features/restaurant/components/restaurant-detail.tsx`
  - `src/features/restaurant/components/submit-form.tsx`
  - `src/features/restaurant/components/queue-table.tsx`
  - `src/features/restaurant/components/review-restaurant-dialog.tsx`
  - `src/app/(site)/restaurants/page.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `docs/BACKEND_INTEGRATION.md`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 41 test suites pass, 402/402 tests pass 100%.
  - `npm run build`: 39/39 static & dynamic routes compiled và build thành công không lỗi.
- PROGRESS: Phase 24 Restaurants & Google Maps Integration hoàn thành 100% (FE Integrated).



- Mục tiêu:
  - Khắc phục triệt để lỗi giao diện khi vào trang Trợ lý AI (`/assistant`), `SiteFooter` hiển thị đè lên khung soạn thảo tin nhắn (composer) và thanh cuộn hội thoại.
  - Đảm bảo trang `/assistant` có không gian làm việc hội thoại dạng canvas toàn màn hình chuẩn xác, trong khi các trang phụ như `/assistant/public` vẫn hiển thị Footer bình thường.
- Đã làm:
  - Kiểm tra `src/components/layout/site-footer.tsx`: Sử dụng `usePathname()` từ `next/navigation` để ẩn chân trang khi `pathname === '/assistant'`.
  - Giữ nguyên cấu trúc Server Component của `SiteLayout` (`src/app/(site)/layout.tsx`), không gây tải thêm hoặc phá vỡ cơ chế streaming của Next.js App Router.
  - Bảo toàn hiển thị chân trang đầy đủ trên toàn bộ các route còn lại bao gồm cả trang Khám phá tri thức AI (`/assistant/public`).
- File tạo/sửa:
  - `src/components/layout/site-footer.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 41 test suites pass, 403/403 tests pass 100%.
  - `npm run build`: 39/39 static & dynamic routes compiled và build thành công không lỗi.
- PROGRESS: Giao diện `/assistant` hoàn thiện hiển thị sạch đẹp, không còn xung đột layout.

## [2026-09-27] — Khắc phục 3 lỗi kiểm thử thủ công Phase 20 Pantry Inventory (Kịch bản 2, 3, 5)

- Mục tiêu:
  - Khắc phục lỗi `Invalid UUID` khi nhập nguyên liệu tự do (`unmatchedText`) ở Kịch bản 2.
  - Sửa lỗi điều chỉnh số lượng ở Kịch bản 3: Các nút hình thức điều chỉnh không đổi màu rõ rệt và lỗi khi để trống lý do ghi nhận.
  - Tối ưu trải nghiệm gộp nguyên liệu ở Kịch bản 5: Tự động tính toán xem trước (auto-preview), thêm nút gợi ý chọn nhóm trùng lặp 1 chạm, hiển thị badge "Có trùng lặp", và cho phép gộp trực tiếp từ thẻ nguyên liệu.
- Đã làm:
  - **Kịch bản 2 (Fix lỗi Invalid UUID)**:
    - Sửa `pantryItemFormSchema` (`pantry.schema.ts`): cho phép `ingredientId: z.string().uuid().optional().or(z.literal(''))`, dùng `.superRefine` để gắn thông báo lỗi chính xác theo trường (`ingredientId` hoặc `unmatchedText`).
    - Sửa `PantryItemDialog`: hiển thị đúng `errors.unmatchedText` và reset giá trị đối ứng khi chuyển đổi công tắc `isCanonical`.
  - **Kịch bản 3 (Fix giao diện & lý do điều chỉnh)**:
    - Sửa `PantryAdjustmentDialog`: Thay thế RadioGroup bằng 3 nút Segmented trực quan (Tiêu hao, Bổ sung, Bù sai lệch) với màu emerald active rõ rệt.
    - Sửa `pantry.mapper.ts`: Hàm `toAdjustmentCreateDto` chỉ gửi `reason` khi có nội dung (không gửi chuỗi rỗng `""` tránh lỗi validation backend Zod `.min(1)`).
  - **Kịch bản 5 (Tối ưu gộp nguyên liệu trùng lặp)**:
    - Xây dựng tiện ích `pantry-helpers.ts` (`getPantryItemIdentityKey`, `findPantryDuplicateGroups`, `isDuplicatePantryItem`) kèm 5/5 unit tests.
    - Cập nhật `PantryMergeDialog`: Tự động tính toán xem trước qua `useEffect` khi chọn >= 2 mục, hỗ trợ gợi ý 1 chạm các nhóm trùng lặp, tự động kích hoạt nút "Xác nhận gộp nguyên liệu" khi tính toán thành công.
    - Cập nhật `PantryClientView` & `PantryHeader`: Hiển thị banner thông báo khi phát hiện nhóm trùng lặp và gắn số lượng nhóm trùng lên nút "Gộp trùng lặp".
    - Cập nhật `PantryItemCard`: Thêm badge "Có trùng lặp" và tùy chọn "Gộp mục trùng lặp..." trong menu 3 chấm mở thẳng modal gộp với các mục cùng loại đã được tích chọn sẵn.
- File tạo/sửa:
  - `src/features/pantry/schemas/pantry.schema.ts`
  - `src/features/pantry/components/pantry-item-dialog.tsx`
  - `src/features/pantry/mappers/pantry.mapper.ts`
  - `src/features/pantry/components/pantry-adjustment-dialog.tsx`
  - `src/features/pantry/components/pantry-merge-dialog.tsx`
  - `src/features/pantry/components/pantry-header.tsx`
  - `src/features/pantry/components/pantry-item-card.tsx`
  - `src/features/pantry/components/pantry-item-list.tsx`
  - `src/features/pantry/utils/pantry-helpers.ts`
  - `src/features/pantry/utils/__tests__/pantry-helpers.test.ts`
  - `src/app/pantry/pantry-client-view.tsx`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 41 test files pass, 403/403 tests pass 100%.
  - `npm run build`: 39/39 routes build thành công.
- PROGRESS: Phase 20 hoàn thiện 100%, trải nghiệm người dùng đạt độ mượt mà cao.

## [2026-09-27] — Khắc phục lỗi dữ liệu seed không hiển thị: Liên kết `publishedRevisionId` cho toàn bộ bài đăng mẫu

- Mục tiêu:
  - Khắc phục nguyên nhân khiến toàn bộ công thức, cẩm nang và video mới đã seed nhưng không hiển thị trên giao diện hoặc API discovery.
  - Sửa logic trong `seeder.ts` để luôn cập nhật `publishedRevisionId` cho các bài viết có trạng thái `PUBLISHED`.
- Đã làm:
  - Phát hiện nguyên nhân gốc: Câu lệnh `await prisma.post.update({ data: { publishedRevisionId: revision.id } })` bị lồng bên trong khối `if (!revision)`. Khi revision đã tồn tại từ lần chạy trước, câu lệnh update bị bỏ qua dẫn đến `post.publishedRevisionId = null`. Backend query lọc `where: { publishedRevisionId: { not: null } }` nên đã loại bỏ toàn bộ dữ liệu mới.
  - Cập nhật `backend/prisma/seed-data/seeder.ts`: Đưa logic cập nhật `publishedRevisionId` ra ngoài điều kiện `if (!revision)` cho cả Recipes, Handbooks và Videos.
  - Bổ sung kiểm tra trùng lặp cho bình luận (`prisma.comment.findFirst`) để quá trình seed đạt tính idempotent 100%.
  - Chạy lại `npm run seed`: Toàn bộ 28 công thức xuất bản (bao gồm 13 công thức mới), 4 cẩm nang, 3 video và 7 avatar người dùng đã liên kết chuẩn xác `publishedRevisionId`.
  - Kiểm tra API trực tiếp: `GET /api/v1/posts?type=RECIPE`, `GET /api/v1/posts?type=BLOG`, `GET /api/v1/posts?type=VIDEO` và `POST /api/v1/auth/login` đều phản hồi thành công 200 OK với đầy đủ dữ liệu và ảnh bìa cục bộ.
- File tạo/sửa:
  - `backend/prisma/seed-data/seeder.ts`
  - `backend/src/modules/auth/auth.schemas.ts`
  - `backend/src/modules/community/community.schemas.ts`
  - `frontend/docs/WORK-LOG.md`
- Verify:
  - `npm run seed`: Hoàn thành 100% không lỗi.
  - `npm run typecheck` (backend): 0 lỗi.
  - `npm run build` (backend): Build thành công `dist/`.
  - `npm test` (frontend): 40 test files pass, 398 tests pass.
  - `npx tsc --noEmit` (frontend): 0 lỗi.
- PROGRESS: 100% dữ liệu seed đã hiển thị qua API và sẵn sàng trên giao diện người dùng.

## [2026-09-27] — Fix lỗi VALIDATION_ERROR khi đăng nhập: Chuẩn hóa `mediaUrlSchema` hỗ trợ URI cục bộ tĩnh

- Mục tiêu:
  - Khắc phục lỗi `VALIDATION_ERROR: data.user.avatarUrl: Invalid URL` khi đăng nhập do Zod `.url()` chỉ chấp nhận URL tuyệt đối `http(s)://` mà từ chối đường dẫn cục bộ `/seed/avatars/...`.
  - Đảm bảo toàn bộ các schema response backend (`auth`, `profile`, `content`, `community`, `meal-plans`, `recommendations`, `moderation`, `storage`, `ingredient-recognition`, `receipts`) hỗ trợ cả URL đầy đủ lẫn đường dẫn tương đối `/seed/...`.
- Đã làm:
  - Khởi tạo và export `mediaUrlSchema` trong `backend/src/common/validation/zod.ts` cho phép cả `https?://` và đường dẫn gốc `/...`.
  - Thay thế `z.string().url()` bằng `mediaUrlSchema` tại:
    - `backend/src/modules/auth/auth.schemas.ts` (`userResponseSchema.avatarUrl`)
    - `backend/src/modules/profile/profile.schemas.ts` (`updateBasicProfileRequestSchema.avatarUrl`)
    - `backend/src/modules/content/content.schemas.ts` (`mediaSchema.secureUrl`)
    - `backend/src/modules/community/community.schemas.ts` (`bookmarkItemSchema.coverImageUrl`)
    - `backend/src/modules/meal-plans/meal-plan.schemas.ts` (`recipeSummarySchema.coverImageUrl`)
    - `backend/src/modules/recommendations/recommendation.schemas.ts` (`recommendationItemSchema.coverImageUrl`)
    - `backend/src/modules/moderation/moderation.schemas.ts` (`reviewMediaSchema.secureUrl`)
    - `backend/src/modules/storage/storage.schemas.ts` (`assetSchema.secureUrl`)
    - `backend/src/modules/ingredient-recognition/ingredient-recognition.schemas.ts` (`imageSchema.url`)
    - `backend/src/modules/receipts/receipt.schemas.ts` (`receiptImageSchema.url`)
  - Chạy `npm run openapi:generate` và `node scripts/sync-swagger.mjs ../backend/openapi.json`.
- Verify:
  - Unit test parse `userResponseSchema` và `authSessionResponseSchema`: Passed.
  - `npm run typecheck` & `npm run lint` & `npm run build` backend: 0 lỗi.
  - `npm test` frontend: 40/40 test files pass, 398/398 tests pass (100%).
  - `npx tsc --noEmit` frontend: 0 lỗi.

## [2026-09-27] — Tích hợp trọn bộ dữ liệu mẫu (Sample Dataset), đồng bộ Media Assets từ Google Drive và tạo 7 User Avatars

- Mục tiêu:
  1. Tải và phân loại toàn bộ tài nguyên đa phương tiện thực tế từ Google Drive người dùng cung cấp (13 ảnh món ăn, 4 ảnh cẩm nang, 3 video clips, 3 ảnh thị giác AI tủ lạnh/hóa đơn).
  2. Tạo 7 ảnh chân dung avatar theo đúng cá tính nhân vật bằng AI (`generate_image`) theo yêu cầu người dùng: Admin, Bếp trưởng Minh Tâm, Bác sĩ Hoài Thu, Nghệ nhân Diệu Hạnh, Vận động viên Hoàng Nam, Phật tử Diệu Tâm, Thành viên Thanh Mai.
  3. Tổ chức và lưu trữ toàn bộ media vào `frontend/public/seed/` (`avatars/`, `recipes/`, `handbooks/`, `videos/`, `vision/`).
  4. Chuẩn hóa đường dẫn cục bộ tĩnh, MIME types, đuôi mở rộng (`.png`, `.webp`, `.jpg`, `.mp4`) và dung lượng byte chính xác trong toàn bộ seed data backend (`users.data.ts`, `recipes.data.ts`, `handbooks.data.ts`, `videos.data.ts`, `media-assets.data.ts`, `seeder.ts`, `seed.ts`).
  5. Chạy seed vào cơ sở dữ liệu PostgreSQL đảm bảo dữ liệu hiển thị mượt mà trên UI không phụ thuộc CDN bên ngoài.
- Đã làm:
  - Tải tài nguyên Google Drive và di chuyển vào `frontend/public/seed/`:
    - 13 ảnh công thức: `banh-mi-chay-pate-nam.jpg`, `bun-bo-hue-chay.png`, `ca-ri-chay-khoai-nam.png`, `canh-chua-chay-nam-bo.jpg`, `chao-yen-mach-nam-huong.jpg`, `com-chien-trai-dua.jpg`, `goi-cuon-chay-ngu-sac.jpg`, `nam-dong-co-kho-tieu.png`, `pho-chay-ha-noi.png`, `salad-bo-dau-ga.webp`, `sinh-to-xanh-cai-bo-xoi.webp`, `sua-hat-sen-dau-do.jpg`, `sup-bi-do-kem-dua.jpg`.
    - 4 ảnh cẩm nang: `b12-guide-cover.jpg`, `meal-prep-cover.jpg`, `protein-pairing-cover.webp`, `vegan-traditions-cover.jpg`.
    - 3 video clips chất lượng cao: `video-pho-nuoc-dung.mp4` (13.5MB), `video-bua-toi-15-phut.mp4` (12.1MB), `video-sua-hat-sen.mp4` (9.18MB).
    - 3 ảnh thị giác: `fridge-scan-sample.jpg`, `my-lunch-bowl.jpg`, `supermarket-receipt-sample.jpg`.
  - Sinh 7 ảnh avatar chuyên nghiệp lưu vào `frontend/public/seed/avatars/`:
    - `admin-avatar.jpg` (System Administrator), `chef-minh-tam.jpg` (Bếp trưởng Minh Tâm), `dr-hoai-thu.jpg` (Bác sĩ Hoài Thu), `dieu-hanh.jpg` (Nghệ nhân Diệu Hạnh), `hoang-nam.jpg` (Fitness Hoàng Nam), `dieu-tam.jpg` (Phật tử Diệu Tâm), `thanh-mai.jpg` (Thanh Mai).
  - Cập nhật seed data backend:
    - `backend/prisma/seed-data/users.data.ts`: Gán avatarUrl chuẩn `/seed/avatars/...` cho 7 tài khoản.
    - `backend/prisma/seed-data/recipes.data.ts`: Đồng bộ `coverMedia` cho cả 13 công thức với dung lượng và URL chính xác.
    - `backend/prisma/seed-data/handbooks.data.ts`: Đồng bộ `coverMedia` cho 4 cẩm nang.
    - `backend/prisma/seed-data/videos.data.ts`: Gán URL video clip cục bộ `.mp4` và ảnh bìa món ăn.
    - `backend/prisma/seed-data/media-assets.data.ts`: Khai báo chi tiết 25+ media assets chuẩn hóa với đúng dung lượng và metadata.
    - `backend/prisma/seed-data/seeder.ts`: Bổ sung upsert `postMedia` trên từng revision để luôn tự động đồng bộ tài nguyên khi chạy seed.
    - `backend/prisma/seed.ts`: Cập nhật fixtures tủ lạnh và hóa đơn trỏ về `/seed/vision/...`.
  - Chạy `npm run seed`: Toàn bộ dữ liệu được nạp thành công vào PostgreSQL.
- File tạo/sửa:
  - `backend/prisma/seed-data/users.data.ts`
  - `backend/prisma/seed-data/recipes.data.ts`
  - `backend/prisma/seed-data/handbooks.data.ts`
  - `backend/prisma/seed-data/videos.data.ts`
  - `backend/prisma/seed-data/media-assets.data.ts`
  - `backend/prisma/seed-data/seeder.ts`
  - `backend/prisma/seed.ts`
  - `frontend/public/seed/` (toàn bộ thư mục avatars, recipes, handbooks, videos, vision)
  - `docs/WORK-LOG.md`
- Verify:
  - `npm run seed` backend: Thành công 100%, kiểm tra trực tiếp qua PostgreSQL client xác nhận 100% URL đã chuyển sang `/seed/...`.
  - `npm run typecheck` backend: 0 lỗi.
  - `npm run lint` backend: 0 lỗi.
  - `npm test` frontend: 40/40 test files pass, 398/398 tests pass (100%).
  - `npx tsc --noEmit` frontend: 0 lỗi.
- PROGRESS: Toàn bộ bộ dữ liệu mẫu lớn hoàn chỉnh, đa phương tiện tĩnh sẵn sàng sử dụng lâu dài.

## [2026-09-27] — Phase 18 Meal Portion & Compatibility Analysis: Tinh chỉnh UI/UX, gom gọn cảnh báo & đảo vị trí DayGrid

- Mục tiêu:
  1. Khắc phục lỗi rò rỉ mã UUID kỹ thuật trong banner dữ liệu dinh dưỡng chưa hoàn chỉnh (`IncompleteDataBanner`).
  2. Đảo vị trí ưu tiên: đưa Lưới thực đơn tuần 7 ngày x 3 bữa (`DayGrid`) lên TRÊN khối cảnh báo chi tiết, giúp người dùng vào trang thấy ngay lịch ăn tuần.
  3. Bổ sung cơ chế phân trang / thu gọn (chỉ hiển thị 3 cảnh báo đầu tiên + nút "Xem thêm cảnh báo khác") cho `MealAnalysisAlerts` để tránh 27 thẻ cảnh báo chiếm hết chiều dọc trang.
  4. Đặt tiêu đề thẻ cảnh báo thông minh theo từng loại mã quy tắc (`NUTRIENT_LIMIT_EXCEEDED`, `INGREDIENT_INTERACTION`, `INGREDIENT_GUIDELINE_EXCEEDED`, `PORTION_MULTIPLIER_HIGH`) thay vì fallback một tiêu đề chung chung.
  5. Thêm liên kết neo trỏ nhanh từ `MealAnalysisSummaryBar` xuống `#canh-bao-chi-tiet`.
- Đã làm:
  - Cập nhật `src/features/meal-analysis/mappers/meal-analysis.mapper.ts`:
    - Ánh xạ tiêu đề thông minh theo mã `code` của backend: *Vượt ngưỡng khuyến nghị trong ngày*, *Vượt khuyến nghị tiêu thụ nguyên liệu*, *Tương tác thành phần thực phẩm*, *Khẩu phần món ăn vượt mức thông thường*.
  - Cập nhật `src/features/meal-analysis/components/incomplete-data-banner.tsx`:
    - Gom chuỗi danh sách Recipe item UUID thành thông điệp thân thiện: *"Thực đơn có X món ăn chưa có dữ liệu kiểm định vi chất hoặc phân tích nấu nướng chi tiết (cooking-aware)..."*.
    - Bổ sung nút bấm thu gọn / mở rộng *"Chi tiết kỹ thuật (X món)"* với danh sách cuộn gọn gàng `max-h-36`.
  - Cập nhật `src/features/meal-analysis/components/meal-analysis-alerts.tsx`:
    - Thêm cơ chế giới hạn hiển thị ban đầu 3 cảnh báo + nút *"Xem thêm X cảnh báo khác"* / *"Thu gọn bớt cảnh báo"*.
    - Gắn `id="canh-bao-chi-tiet"` hỗ trợ cuộn mượt mà từ thanh tóm tắt.
  - Cập nhật `src/features/meal-analysis/components/meal-analysis-summary-bar.tsx`:
    - Thêm liên kết *"Xem danh sách chi tiết ↓"* điều hướng ngay đến khối cảnh báo.
  - Cập nhật `src/app/(site)/meal-plans/[id]/page.tsx`:
    - Đổi vị trí: Đưa `DayGrid` lên ngay sau `IncompleteDataBanner` và trước `MealAnalysisAlerts`.
- File tạo/sửa:
  - `src/features/meal-analysis/mappers/meal-analysis.mapper.ts`
  - `src/features/meal-analysis/components/incomplete-data-banner.tsx`
  - `src/features/meal-analysis/components/meal-analysis-alerts.tsx`
  - `src/features/meal-analysis/components/meal-analysis-summary-bar.tsx`
  - `src/app/(site)/meal-plans/[id]/page.tsx`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 40/40 test suites pass, 398/398 tests pass (100%).
  - `npm run build`: Turbopack build Next.js 16 thành công, 39/39 static routes pass.
- PROGRESS: Phase 18 UI/UX refinement hoàn tất.

## [2026-09-27] — Phase 18 Meal Portion & Compatibility Analysis: Tích hợp trọn vẹn vào UI thực đơn tuần và DayGrid

- Mục tiêu:
  1. Tích hợp trọn vẹn Phase 18 vào UI thực đơn `/meal-plans/[id]` và lưới tuần `DayGrid`.
  2. Kết nối API `POST /api/v1/meal-plans/:id/analyze` gửi đúng Zod schema backend `{ expectedPlanVersion, items? }` (không gửi `{}` rỗng).
  3. Bổ sung endpoint `GET /api/v1/meal-plans/:id/analysis` và `PATCH /api/v1/meal-plans/:id/items/:itemId/manual-add` (cho phép thêm món cá nhân từ Phase 17 hoặc công thức cộng đồng vào ô thực đơn).
  4. Nâng cấp selector `MealPlanItemSelector` cho phép chọn Món cá nhân / Công thức kèm số khẩu phần `servings`.
  5. Đạt verification gates: `npx tsc --noEmit` (0 lỗi), `npm test` (100% pass), `npm run build` thành công.
- Đã làm:
  - Cập nhật constants `src/common/constants/api-endpoints.ts`:
    - Thêm `MEAL_PLANS.MANUAL_ADD: (id, itemId) => /meal-plans/${id}/items/${itemId}/manual-add`
    - Thêm `MEAL_PLANS.ANALYSIS: (id) => /meal-plans/${id}/analysis`
  - Cập nhật Meal Plan types, model & mappers:
    - `src/features/meal-plan/types/meal-plan.dto.ts`: Bổ sung `sourceType`, `customMeal`, `servings` vào `MealSlotDto`; thêm `ManualAddMealPlanItemRequestDto`.
    - `src/features/meal-plan/types/meal-plan.model.ts`: Thêm `sourceType`, `isCustomMeal`, `customMealId`, `customMealName`, `customMealCoverage` vào `MealSlot`.
    - `src/features/meal-plan/mappers/meal-plan.mapper.ts`: Cập nhật `toSlot` nhận diện `CUSTOM_MEAL`, hiển thị tên món cá nhân và badge cá nhân.
    - `src/features/meal-plan/api/meal-plan.api.ts`: Thêm hàm `manualAddItem` gọi `PATCH /manual-add`.
    - `src/features/meal-plan/queries/meal-plan.queries.ts`: Thêm hook `useManualAddMealItemMutation` (xử lý lỗi `MEAL_PLAN_HARD_CONSTRAINT_VIOLATION`, invalidate cả `MEAL_PLAN_QUERY_KEYS` và `MEAL_ANALYSIS_KEYS`).
    - `src/features/meal-plan/mappers/meal-plan.mapper.test.ts`: Bổ sung unit test ánh xạ slot chứa `CUSTOM_MEAL` (15/15 tests pass).
  - Cập nhật Meal Analysis types, API, mapper & queries:
    - `src/features/meal-analysis/types/meal-analysis.dto.ts`: Chuẩn hóa DTO theo backend Zod schema (`AnalyzeMealPlanRequestDto`, `planVersion`, `version`, `status`, `incompleteData`, `confidence`, `ruleVersions`, `disclaimer`, `measured: { value, unit }`, `limit: { value, unit }`, `AffectedPlanItemDto` có `itemId`, `sourceType`, `name`).
    - `src/features/meal-analysis/api/meal-analysis.api.ts`: Cập nhật `analyzeMealPlan` nhận `AnalyzeMealPlanRequestDto` (gửi `expectedPlanVersion`); bổ sung `getCurrentAnalysis` gọi `GET /analysis`.
    - `src/features/meal-analysis/mappers/meal-analysis.mapper.ts`: Cập nhật ánh xạ `itemId`, `sourceType`, `name`, `highCount`/`cautionCount`, `confidence`, `incompleteData`.
    - `src/features/meal-analysis/queries/meal-analysis.queries.ts`: Cập nhật `useMealAnalysisQuery` fetch từ API; cập nhật `useAnalyzeMealPlanMutation` nhận `expectedPlanVersion`.
    - `src/features/meal-analysis/mappers/meal-analysis.mapper.test.ts`: Bổ sung 2 test cases kiểm thử live shape từ backend Phase 18 (14/14 tests pass).
  - UI Components:
    - `src/features/meal-plan/components/day-grid.tsx`: Hiển thị badge "Món cá nhân" khi `slot.isCustomMeal`; hiển thị chi tiết khẩu phần.
    - `src/features/meal-plan/components/meal-plan-item-selector.tsx`: Nâng cấp giao diện với bộ đếm khẩu phần `servings` (1-20), Tab "Món ăn cá nhân" và Tab "Công thức cộng đồng", tìm kiếm phân trang.
    - `src/app/(site)/meal-plans/[id]/page.tsx`: Tích hợp `MealPlanItemSelector`, nút "Đổi món" / "Chọn món" trên slot, tự động phân tích lại thực đơn (`analyzeMutation`) sau khi thêm/đổi món thành công.
  - Cập nhật tài liệu:
    - `docs/BACKEND_INTEGRATION.md`: Đánh dấu `FE integrated: Yes (2026-09-27)` cho cả 3 endpoints Phase 18, bổ sung changelog v5.2.
    - `docs/PROGRESS.md`: Cập nhật Phase 18 lên 100% FE Integrated.
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/meal-plan/types/meal-plan.dto.ts`
  - `src/features/meal-plan/types/meal-plan.model.ts`
  - `src/features/meal-plan/mappers/meal-plan.mapper.ts`
  - `src/features/meal-plan/mappers/meal-plan.mapper.test.ts`
  - `src/features/meal-plan/api/meal-plan.api.ts`
  - `src/features/meal-plan/queries/meal-plan.queries.ts`
  - `src/features/meal-plan/components/day-grid.tsx`
  - `src/features/meal-plan/components/meal-plan-item-selector.tsx`
  - `src/features/meal-analysis/types/meal-analysis.dto.ts`
  - `src/features/meal-analysis/api/meal-analysis.api.ts`
  - `src/features/meal-analysis/mappers/meal-analysis.mapper.ts`
  - `src/features/meal-analysis/mappers/meal-analysis.mapper.test.ts`
  - `src/features/meal-analysis/queries/meal-analysis.queries.ts`
  - `src/app/(site)/meal-plans/[id]/page.tsx`
  - `docs/BACKEND_INTEGRATION.md`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 40/40 test suites pass, 398/398 tests pass (100%).
  - `npm run build`: Turbopack build Next.js 16 thành công, 39/39 static routes pass.
- PROGRESS: Phase 18 0% → 100% (FE Integrated).
- Còn lại: Sẵn sàng chuyển tiếp sang Phase tiếp theo (Phase 19 Multi-week Meal Programs hoặc kiểm thử end-to-end trên trình duyệt).

## [2026-09-27] — Phase 17 Custom Meals: Khắc phục lỗi VALIDATION_ERROR khi gọi API tạo món ăn cá nhân

- Mục tiêu: Sửa lỗi 400 VALIDATION_ERROR khi gửi yêu cầu `POST /api/v1/custom-meals`:
  1. `_root`: `Unrecognized keys: "userProtein", "userCarbs", "userFat"`
  2. `ingredients.x`: `Unrecognized keys: "name", "quantity"`
  3. `ingredients.x.position`: `expected number, received undefined`
  4. `ingredients.x.displayName`: `expected string, received undefined`
  5. `ingredients.x.amount`: `expected number, received undefined`
  6. `ingredients.x.ingredientId`: `expected string, received null`
- Nguyên nhân:
  1. Backend Zod schema `createCustomMealSchema` sử dụng `.strict()` nên từ chối các khóa không được định nghĩa. Tên trường chuẩn của backend là `userProteinGrams`, `userCarbsGrams`, `userFatGrams` thay vì `userProtein`, `userCarbs`, `userFat`.
  2. Nguyên liệu trong backend schema yêu cầu các trường bắt buộc `position` (number >= 0), `displayName` (string min 1), `amount` (number > 0), `unit` (string min 1) thay vì `name` và `quantity`.
  3. `ingredientId` trong backend schema là `z.string().uuid().optional()` (không chấp nhận `null`). Việc frontend gửi `ingredientId: null` đã gây lỗi `expected string, received null`.
  4. Các trường tùy chọn (`notes`, `sourceNote`, macros) gửi `null` cũng vi phạm quy tắc validation khi backend chỉ chấp nhận kiểu `string`/`number` hoặc không gửi trường đó (`optional`).
- Đã làm:
  - Cập nhật `src/features/custom-meal/types/custom-meal.dto.ts`:
    - Đồng bộ `CreateCustomMealIngredientRequestDto`: `position: number`, `displayName: string`, `amount: number`, `unit: string`, `ingredientId?: string`.
    - Đồng bộ `CreateCustomMealRequestDto`: `userProteinGrams?: number`, `userCarbsGrams?: number`, `userFatGrams?: number`, `userCalories?: number`.
    - Đồng bộ `CustomMealResponseDto` và `CustomMealListItemDto` hỗ trợ cả `records` array, `displayName`, `amount`, `secureUrl`, `position` và tags object (`{ tag, normalizedTag }`).
  - Cập nhật `src/features/custom-meal/components/custom-meal-form.tsx`:
    - Đóng gói payload tạo món chuẩn 100%: ánh xạ `position: index`, `displayName: ing.name.trim()`, `amount: Number(ing.quantity)`, chỉ đính kèm `ingredientId` nếu là chuỗi UUID hợp lệ (không gửi `null`).
    - Các trường tùy chọn (`notes`, `sourceNote`, `userCalories`, `userProteinGrams`, `userCarbsGrams`, `userFatGrams`) chỉ được gắn vào payload nếu người dùng có nhập giá trị hợp lệ, loại bỏ hoàn toàn các trường rỗng hoặc `null`.
    - Bổ sung validation kiểm tra từng nguyên liệu có số lượng lớn hơn 0 trước khi submit.
  - Cập nhật `src/features/custom-meal/mappers/custom-meal.mapper.ts`:
    - Ánh xạ linh hoạt từ DTO backend sang UI Model cho cả `userProteinGrams/CarbsGrams/FatGrams`, `displayName/amount`, `records` array và tags object.
  - Cập nhật `src/features/custom-meal/api/custom-meal.api.ts`:
    - Đồng bộ endpoint ảnh chuẩn `/photos` (thay vì `/media`) và kết hợp với `uploadWithReservation` (Phase 15 Storage Reservation) để upload ảnh lên Cloudinary trước khi gắn `assetId` vào món ăn.
  - Cập nhật `src/common/constants/api-endpoints.ts`:
    - Bổ sung `ATTACH_PHOTO`, `REMOVE_PHOTO`, `REORDER_PHOTOS` bám sát backend router.
  - Thêm 2 unit test mới kiểm tra chuyển đổi payload `records` và chi tiết món từ backend trong `custom-meal.mapper.test.ts` (13/13 tests pass).
- File tạo/sửa:
  - `src/features/custom-meal/types/custom-meal.dto.ts`
  - `src/features/custom-meal/components/custom-meal-form.tsx`
  - `src/features/custom-meal/mappers/custom-meal.mapper.ts`
  - `src/features/custom-meal/mappers/custom-meal.mapper.test.ts`
  - `src/features/custom-meal/api/custom-meal.api.ts`
  - `src/features/custom-meal/queries/custom-meal.queries.ts`
  - `src/common/constants/api-endpoints.ts`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 40/40 test suites pass, 395/395 tests pass.
- PROGRESS: Sửa dứt điểm lỗi tạo Custom Meal, đảm bảo 100% khớp schema Backend.

## [2026-09-27] — Phase 17 Custom Meals: Sửa lỗi thẻ phân loại (Enter/gạch dưới) và Nâng cấp Sizing/Typography UI/UX

- Mục tiêu: Khắc phục lỗi nhập thẻ phân loại cá nhân (User Tags) khi gõ phím Enter không nhận thẻ (như trường hợp gõ `bua_trua nhanh_gon`), và giải quyết tình trạng giao diện bị thu nhỏ (inputs/buttons h-8, typography text-xs/text-[10px], thiếu khoảng cách).
- Nguyên nhân:
  1. `tag-normalizer.ts`: `VALID_TAG_REGEX` chỉ cho phép chữ cái, số, khoảng trắng và dấu gạch nối (-), thiếu dấu gạch dưới (_), dẫn đến các thẻ như `bua_trua`, `nhanh_gon` bị loại bỏ và báo lỗi.
  2. `custom-meal-tag-input.tsx`: Không có nút "Thêm thẻ" trực quan, người dùng chỉ phụ thuộc vào phím Enter trên bàn phím. Khi nhấn Enter không có `e.stopPropagation()`, và chưa hỗ trợ tách chuỗi nhập nhiều thẻ phân tách bằng dấu phẩy.
  3. Kích thước giao diện: Toàn bộ form tạo/sửa món ăn sử dụng `h-8`, `text-xs`, `text-[10px]`, `text-[11px]`, tạo cảm giác chật chội và không đồng nhất với các trang khác trong ứng dụng.
- Đã làm:
  - Cập nhật `src/features/custom-meal/utils/tag-normalizer.ts`:
    - Cập nhật `VALID_TAG_REGEX = /^[\p{L}\p{N}\s\-_]+$/u` hỗ trợ toàn bộ Unicode tiếng Việt có dấu, chữ số, khoảng trắng, gạch nối (-) và gạch dưới (_).
    - Cập nhật `normalizeUserTag` tự động bóc tách ký tự `#` ở đầu chuỗi (phòng ngừa trường hợp người dùng gõ theo thói quen hashtag `#shopee`).
  - Viết 14 unit tests mới tại `src/features/custom-meal/utils/tag-normalizer.test.ts` kiểm thử toàn diện các trường hợp gạch dưới, hashtag, tiếng Việt, deduplication và giới hạn thẻ (14/14 tests pass).
  - Nâng cấp `src/features/custom-meal/components/custom-meal-tag-input.tsx`:
    - Bổ sung nút "+ Thêm thẻ" rõ ràng bên cạnh input.
    - Hỗ trợ phím Enter, phẩy (,) và click nút Thêm.
    - Hỗ trợ nhập/paste hàng loạt thẻ phân tách bằng dấu phẩy hoặc chấm phẩy.
    - Thêm `e.stopPropagation()` và kiểm tra `isComposing` ngăn chặn IME và form submit ngoài ý muốn.
    - Nâng cấp thẻ badge lên `text-sm`, bo góc đẹp, có nút xóa rõ ràng.
  - Nâng cấp Sizing & Spacing toàn diện theo chuẩn `baseline-ui`:
    - `custom-meal-form.tsx`: Nâng cấp inputs từ `h-8 text-xs` lên `h-10 text-sm`, tên món ăn `h-11 text-base`, card padding `p-5 sm:p-6`, action buttons `h-10 text-sm px-5 font-medium`.
    - `custom-meal-ingredient-input.tsx`: Nâng cấp inputs tên, số lượng, dropdown đơn vị và nút xóa lên `h-10 text-sm`, padding hàng `p-3 rounded-xl`.
    - `custom-meal-nutrition-bar.tsx`: Nâng cấp card tóm tắt `p-5`, nhãn `text-xs font-medium`, chỉ số `text-base font-bold`, flame icon `w-5 h-5`.
    - `custom-meal-list.tsx`: Nâng cấp search input `h-10 text-sm`, nút Tạo món mới `h-10 text-sm font-medium`, phân trang `h-9 text-sm`.
    - `custom-meals/new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`: Nâng cấp header typography `text-2xl`/`text-3xl font-bold`, nút thao tác `h-9 text-sm font-medium`.
- File tạo/sửa:
  - `src/features/custom-meal/utils/tag-normalizer.ts`
  - `src/features/custom-meal/utils/tag-normalizer.test.ts`
  - `src/features/custom-meal/components/custom-meal-tag-input.tsx`
  - `src/features/custom-meal/components/custom-meal-ingredient-input.tsx`
  - `src/features/custom-meal/components/custom-meal-nutrition-bar.tsx`
  - `src/features/custom-meal/components/custom-meal-form.tsx`
  - `src/features/custom-meal/components/custom-meal-list.tsx`
  - `src/app/(site)/custom-meals/new/page.tsx`
  - `src/app/(site)/custom-meals/[id]/page.tsx`
  - `src/app/(site)/custom-meals/[id]/edit/page.tsx`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 40/40 test suites pass, 393/393 tests pass (14/14 tests tag-normalizer, 11/11 tests custom-meal mapper).
  - `npm run build`: Next.js Turbopack build thành công 100%.
- PROGRESS: Phase 17 Custom Meals hoàn thiện và nâng cấp UI/UX chuẩn mực.
- Còn lại / rủi ro: Không.

## [2026-09-26] — Phase 15 Storage Quota Bugfix (Sửa lỗi không hiển thị danh sách tài khoản lưu trữ Admin)

- Mục tiêu: Khắc phục lỗi trang `http://localhost:3000/admin/storage?tab=accounts` gọi API 200 OK nhưng hiển thị "Không tìm thấy tài khoản nào".
- Nguyên nhân:
  1. Endpoint Backend `GET /api/v1/admin/storage/accounts` trả về cấu trúc `data: [ { user, policy, usage, updatedAt } ]` và metadata phân trang `meta: { page, limit, total, totalPages }`.
  2. Frontend `storage.api.ts` trước đó giả định `res.data.data` là object `{ items: [...] }`, dẫn đến `data?.items` bị `undefined` và danh sách rỗng `[]`.
  3. Mapper `StorageMapper.toAccountModel` trước đó đọc `dto.userId`, `dto.usedBytes` ở root của item thay vì bóc tách từ `dto.user.id` và `dto.usage.usedBytes`.
- Đã làm:
  - Cập nhật `src/features/storage/types/storage.dto.ts`: Bổ sung cấu trúc `user`, `usage`, `updatedAt`, `actorId` vào `StorageAccountDto` và `StorageAdjustmentDto`.
  - Cập nhật `src/features/storage/api/storage.api.ts`: Hỗ trợ linh hoạt cả 2 định dạng (mảng `data` trực tiếp kèm top-level `meta`, hoặc object `{ items }`) cho `getAdminAccounts`, `getAdminPolicies`, và `getAdminAdjustments`.
  - Cập nhật `src/features/storage/mappers/storage.mapper.ts`: Bóc tách an toàn các trường từ `dto.user` (`id`, `email`, `displayName`, `avatarUrl`) và `dto.usage` (`usedBytes`, `limitBytes`, `remainingBytes`, `overQuota`).
  - Bổ sung unit test số 13 cho `storage.mapper.test.ts` kiểm thử chuẩn xác định dạng payload Backend.
- File tạo/sửa:
  - `src/features/storage/types/storage.dto.ts`
  - `src/features/storage/api/storage.api.ts`
  - `src/features/storage/mappers/storage.mapper.ts`
  - `src/features/storage/mappers/storage.mapper.test.ts`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 39/39 test suites pass, 379/379 tests pass.
  - `npm run build`: 39 routes compile thành công 100%.
- PROGRESS: Bước 3 của Phase 15 đã được khắc phục hoàn toàn.
- Còn lại / rủi ro: Không.

## [2026-09-26] — Phase 13 Recipe Nutrition Bugfix (Sửa lỗi crash render sau khi tính toán dinh dưỡng)

- Mục tiêu: Sửa lỗi crash trang (`src/app/error.tsx`: "Đã xảy ra sự cố!") khi hoàn tất tính toán dinh dưỡng cho công thức tại `/recipes/dau-hu-xao-bong-cai-demo`, đồng thời chuẩn hóa ánh xạ mã dinh dưỡng từ Backend (`ENERGY_KCAL`).
- Nguyên nhân:
  1. Thẻ `SaveArtifactButton` (Phase 23) được mount vào `RecipeNutritionCard` khi có `nutrition.id` hợp lệ. Component này sử dụng `<Tooltip>` từ Radix UI nhưng trong `src/app/layout.tsx` chưa được bọc `<TooltipProvider>`, dẫn đến lỗi runtime `Tooltip components must be used within TooltipProvider` làm crash toàn bộ route.
  2. Mapper `RecipeNutritionMapper.calculateMacroDistribution` chỉ tìm `ENERC_KCAL` và `CALORIES`, trong khi Backend trả về mã chuẩn `ENERGY_KCAL`, dẫn đến lượng Calo hiển thị bằng 0.
  3. Bảng vi chất `NutrientListTable` chưa có `ENERGY_KCAL` trong `EXCLUDED_CODES`.
- Đã làm:
  - Bọc `<TooltipProvider delayDuration={200}>` toàn cục trong `src/app/layout.tsx` và bọc phòng vệ nội bộ trong `SaveArtifactButton` và `VerificationBadge`.
  - Cập nhật `RecipeNutritionMapper` nhận diện đầy đủ các alias mã dinh dưỡng: `ENERGY_KCAL`, `ENERC_KCAL`, `CALORIES`, `ENERGY`, `KCAL`, `PROTEIN`, `PROCNT`, `PRO`, `CARBS`, `CHOCDF`, `FAT`, `FAT_TOTAL`, `FATCE`.
  - Cập nhật `EXCLUDED_CODES` trong `NutrientListTable` để ẩn năng lượng macro khỏi bảng vi chất.
  - Bổ sung unit test số 13 cho `RecipeNutritionMapper` kiểm chứng dữ liệu Backend `ENERGY_KCAL`.
- File tạo/sửa:
  - `src/app/layout.tsx`
  - `src/features/ai-artifacts/components/save-artifact-button.tsx`
  - `src/features/chat/components/verification-badge.tsx`
  - `src/features/recipe-nutrition/mappers/recipe-nutrition.mapper.ts`
  - `src/features/recipe-nutrition/components/nutrient-list-table.tsx`
  - `src/features/recipe-nutrition/mappers/recipe-nutrition.mapper.test.ts`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 39/39 test suites pass, 378/378 tests pass.
  - `npm run build`: 39 routes compile thành công 100%.
- PROGRESS: Phase 13 kiểm thử bước 1 sẵn sàng để tiếp tục flow test.
- Còn lại / rủi ro: Không.

## [2026-09-26] — Phase 23 AI Sharing & Unified Contributor Verification (Chia sẻ & Thẩm định Tri thức AI Hợp nhất)

- Mục tiêu: Triển khai toàn diện 7 tầng scaffold cho Phase 23 Chia sẻ & Thẩm định Tri thức AI Hợp nhất theo spec `specs/024-ai-artifacts-verification/` và task `docs/tasks/phase-23-ai-review.md`. Đóng gói đầu ra từ 4 nguồn AI (Chat, Dinh dưỡng, Tủ lạnh, Hóa đơn) thành AI Artifact bất biến; quản lý chia sẻ công khai/riêng tư an toàn (bảo vệ quyền riêng tư, ẩn danh tác giả); quy trình thẩm định chuyên môn hợp nhất chỉ cho phép Contributor/Admin với kết luận khoa học quy chuẩn (VERIFIED, CORRECTION_NEEDED, REJECTED), cấm tự kiểm chứng; huy hiệu "Được kiểm chứng bởi Người đóng góp", tuyệt đối không dùng "chứng nhận khoa học"; và can thiệp kiểm toán của Admin (Override / Revoke).
- Đã làm:
  - **Tầng 1 (Endpoints)**: Thêm hằng số `AI_ARTIFACTS` (5 routes: `BASE`, `VISIBILITY`, `SUBMIT`, `PUBLIC`, `VERIFICATIONS`) và `AI_VERIFICATIONS_ADMIN` (`ACTION`) vào `src/common/constants/api-endpoints.ts`.
  - **Tầng 2 (Enums, DTOs & Clean UI Models)**:
    - Khai báo các enum nghiệp vụ: `AiArtifactType`, `AiArtifactStatus`, `AiArtifactVisibility`, `AiVerificationConclusion`, `AiVerificationStatus`, `AiVerificationAdminActionType` tại `src/common/enums/index.ts`.
    - Xây dựng raw DTOs tại `src/features/ai-artifacts/types/ai-artifact.dto.ts` và `ai-verification.dto.ts`.
    - Xây dựng Clean UI Models tại `src/features/ai-artifacts/types/ai-artifact.model.ts` (`AiArtifact`, `AiArtifactContent`, `AiArtifactAuthor`, `AiArtifactLifecycle`) và `ai-verification.model.ts` (`AiVerification`, `AiReviewer`, `AiVerificationAdminAction`).
  - **Tầng 3 (Validation Schemas)**:
    - Xây dựng Zod validation schemas tại `src/features/ai-artifacts/schemas/ai-artifact.schema.ts` (`createAiArtifactSchema`, `updateAiArtifactVisibilitySchema`, `submitAiArtifactSchema`, `publicAiArtifactsQuerySchema`).
    - Xây dựng Zod validation schemas tại `src/features/ai-artifacts/schemas/ai-verification.schema.ts` (`createAiVerificationSchema`, `adminAiVerificationActionSchema`).
  - **Tầng 4 (Mappers & Unit Tests)**:
    - Xây dựng `AiArtifactMapper` và `AiVerificationMapper` kế thừa `BaseMapper` với `pickField` và `safe*`.
    - Viết 6 unit tests cho `AiArtifactMapper` tại `src/features/ai-artifacts/mappers/__tests__/ai-artifact.mapper.test.ts` (100% pass).
    - Viết 5 unit tests cho `AiVerificationMapper` tại `src/features/ai-artifacts/mappers/__tests__/ai-verification.mapper.test.ts` (100% pass).
  - **Tầng 5 (API Clients & TanStack Query Hooks)**:
    - Triển khai `aiArtifactApi` (`create`, `updateVisibility`, `submit`, `listPublic`) và `aiVerificationApi` (`verify`, `adminAction`).
    - Tạo Query Key Factories `AI_ARTIFACT_QUERY_KEYS` và `AI_VERIFICATION_QUERY_KEYS` kèm các custom hooks (`usePublicAiArtifactsQuery`, `useCreateAiArtifactMutation`, `useUpdateAiArtifactVisibilityMutation`, `useSubmitAiArtifactMutation`, `useCreateAiVerificationMutation`, `useAdminAiVerificationActionMutation`).
  - **Tầng 6 (UI Components)**:
    - `MedicalDisclaimer`: Khuyến cáo miễn trừ trách nhiệm y tế chuẩn mực.
    - `VerificationBadge`: Huy hiệu kiểm chứng hiển thị kết luận chuyên môn, cấm tuyệt đối chữ "chứng nhận khoa học", tooltip chi tiết phạm vi và bằng chứng.
    - `ArtifactContentRenderer`: Hiển thị định dạng trực quan cho 4 loại nội dung AI (`CHAT_ANSWER`, `RECIPE_NUTRITION`, `FRIDGE_RECOGNITION`, `RECEIPT_EXTRACTION`).
    - `SaveArtifactDialog` & `SaveArtifactButton`: Form đóng gói kết quả AI bất biến có nhập tiêu đề, tóm tắt và tùy chọn ẩn danh tác giả.
    - `ShareArtifactDialog`: Quản lý bật/tắt chia sẻ công khai, sao chép liên kết, thu hồi riêng tư và chống xung đột phiên bản lạc quan.
    - `SubmitArtifactDialog`: Gửi bài cho Contributor thẩm định.
    - `VerifyDialog` & `VerifyArtifactButton`: Form thẩm định chuyên môn (Contributor/Admin), tự động ẩn/chặn nếu là chủ sở hữu (cấm tự kiểm chứng).
    - `AdminVerificationDialog` & `AdminVerificationActionMenu`: Can thiệp quản trị viên ghi đè (Override) hoặc thu hồi (Revoke) có bắt buộc lý do kiểm toán.
    - `PublicArtifactCard` & `PublicArtifactsList`: Thẻ hiển thị và danh sách tri thức công khai có tìm kiếm, bộ lọc tabs và phân trang.
    - `PublicArtifactView`: Màn hình xem chi tiết tri thức công khai qua query `?share=[id]`.
    - `AiVerificationTable`: Bảng quản trị danh sách kiểm chứng cho Admin.
  - **Tầng 7 (Routes & Tích hợp vào hệ sinh thái)**:
    - Nâng cấp trang `/assistant/public` với `PublicArtifactsList` và `PublicArtifactView`.
    - Thay thế nút chia sẻ cũ trong Trợ lý Chat (`/assistant`) bằng `SaveArtifactButton`.
    - Tích hợp `SaveArtifactButton` vào Dinh dưỡng công thức (`recipe-nutrition-card.tsx`), Quét tủ lạnh (`candidate-review-screen.tsx`), Bóc tách hóa đơn (`receipt-inspection-view.tsx`).
    - Bổ sung tab "Kiểm chứng AI" (`ai-verifications`) vào trang `/admin/dashboard` và link trong layout sidebar `/admin/layout.tsx`.
    - Bổ sung link "Khám phá Tri thức AI" vào menu dropdown Trợ lý Chat trên `SiteHeader` (No Orphan Pages).
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/common/enums/index.ts`
  - `src/features/ai-artifacts/types/ai-artifact.dto.ts`
  - `src/features/ai-artifacts/types/ai-verification.dto.ts`
  - `src/features/ai-artifacts/types/ai-artifact.model.ts`
  - `src/features/ai-artifacts/types/ai-verification.model.ts`
  - `src/features/ai-artifacts/schemas/ai-artifact.schema.ts`
  - `src/features/ai-artifacts/schemas/ai-verification.schema.ts`
  - `src/features/ai-artifacts/mappers/ai-artifact.mapper.ts`
  - `src/features/ai-artifacts/mappers/ai-verification.mapper.ts`
  - `src/features/ai-artifacts/mappers/__tests__/ai-artifact.mapper.test.ts`
  - `src/features/ai-artifacts/mappers/__tests__/ai-verification.mapper.test.ts`
  - `src/features/ai-artifacts/api/ai-artifact.api.ts`
  - `src/features/ai-artifacts/api/ai-verification.api.ts`
  - `src/features/ai-artifacts/queries/ai-artifact.queries.ts`
  - `src/features/ai-artifacts/queries/ai-verification.queries.ts`
  - `src/features/ai-artifacts/components/medical-disclaimer.tsx`
  - `src/features/ai-artifacts/components/verification-badge.tsx`
  - `src/features/ai-artifacts/components/artifact-content-renderer.tsx`
  - `src/features/ai-artifacts/components/save-artifact-button.tsx`
  - `src/features/ai-artifacts/components/save-artifact-dialog.tsx`
  - `src/features/ai-artifacts/components/share-artifact-dialog.tsx`
  - `src/features/ai-artifacts/components/submit-artifact-dialog.tsx`
  - `src/features/ai-artifacts/components/verify-artifact-button.tsx`
  - `src/features/ai-artifacts/components/verify-dialog.tsx`
  - `src/features/ai-artifacts/components/admin-verification-action-menu.tsx`
  - `src/features/ai-artifacts/components/admin-verification-dialog.tsx`
  - `src/features/ai-artifacts/components/public-artifact-card.tsx`
  - `src/features/ai-artifacts/components/public-artifact-view.tsx`
  - `src/features/ai-artifacts/components/public-artifacts-list.tsx`
  - `src/features/ai-artifacts/components/ai-verification-table.tsx`
  - `src/features/ai-artifacts/index.ts`
  - `src/app/(site)/assistant/page.tsx`
  - `src/app/(site)/assistant/public/page.tsx`
  - `src/features/chat/components/share-answer-button.tsx`
  - `src/features/recipe-nutrition/components/recipe-nutrition-card.tsx`
  - `src/features/ingredient-vision/components/candidate-review-screen.tsx`
  - `src/features/receipt/components/receipt-inspection-view.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/app/(admin)/admin/layout.tsx`
  - `src/components/layout/site-header.tsx`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npx vitest run src/features/ai-artifacts/mappers/__tests__/`: 2 test files, 11 tests pass (100%).
  - `npm test`: 39 test files, 377 tests pass (100% không hồi quy).
  - `npm run build`: 39 static & dynamic routes build thành công mỹ mãn.
- PROGRESS: Phase 23 0% → 100% (Hoàn thành tích hợp Phase 23 AI Artifacts & Unified Contributor Verification).
- Còn lại / rủi ro: Không có.

## [2026-09-26] — Phase 22 Receipt Analysis & Pantry-aware Shopping Gaps (Bóc tách hóa đơn siêu thị & Tối ưu danh sách đi chợ)

- Mục tiêu: Triển khai toàn diện 7 tầng scaffold cho Phase 22 Bóc tách hóa đơn siêu thị & Tối ưu danh sách đi chợ theo spec `specs/023-receipts-shopping/` và task `docs/tasks/phase-22-receipts-shopping.md`. Đảm bảo tích hợp trọn vẹn với Storage module (1–4 ảnh `kind: RECEIPT_IMAGE`), theo dõi tiến trình OCR real-time, giao diện đối chiếu kép 2 cột (Viewer ảnh hóa đơn tương tác zoom/pan/rotate và danh sách mặt hàng bóc tách), chỉnh sửa có khóa lạc quan (`expectedVersion`), tuân thủ quy tắc BL-12 (chỉ xác nhận tường minh mới nhập kho Tủ bếp), và tính năng Pantry-aware Shopping Gaps phân tách rành mạch lượng có sẵn, lượng còn thiếu và các món chưa quy đổi được.
- Đã làm:
  - **Tầng 1 (Endpoints)**: Thêm hằng số `RECEIPT_JOBS` (6 paths: `BASE`, `DETAIL`, `CANDIDATE`, `CONFIRM`, `CANCEL`, `RETRY`) và `SHOPPING_LISTS.PREVIEW` vào `src/common/constants/api-endpoints.ts`.
  - **Tầng 2 (Storage Integration & DTOs)**:
    - Xác nhận và hỗ trợ `RECEIPT_IMAGE` trong Storage model, DTO và hàm `validateUploadFile` (giới hạn 10MB, tối đa 4 ảnh).
    - Xây dựng raw DTOs tại `src/features/receipt/types/receipt.dto.ts` và `src/features/receipt/types/shopping-gap.dto.ts`.
  - **Tầng 3 (Clean UI Models)**:
    - Xây dựng UI Models tại `src/features/receipt/types/receipt.model.ts` (`ReceiptJob`, `ReceiptCandidate`, `ReceiptImage`, `ReceiptConfirmationResult`, `ReceiptMetadata`, trạng thái helper `canConfirm`, `canRetry`, `canCancel`, format tiền tệ VNĐ).
    - Xây dựng UI Models tại `src/features/receipt/types/shopping-gap.model.ts` (`ShoppingGapPreview`, `ShoppingGapItem`, `UnresolvedShoppingItem`, `ShoppingGapSummary`, helper `gapBadgeVariant`).
  - **Tầng 4 (Validation Schemas)**:
    - Xây dựng Zod validation schemas tại `src/features/receipt/schemas/receipt.schema.ts` (kiểm tra `expectedVersion`, `detectedName`, `quantity`, `unit`, `unitPrice`, `lineTotal`, `uncertaintyNote`).
    - Xây dựng Zod validation schemas tại `src/features/receipt/schemas/shopping-gap.schema.ts` (validate payload `planMeals`).
  - **Tầng 5 (Mappers & Unit Tests)**:
    - Xây dựng `ReceiptMapper` kế thừa `BaseMapper` tại `src/features/receipt/mappers/receipt.mapper.ts`.
    - Xây dựng `ShoppingGapMapper` kế thừa `BaseMapper` tại `src/features/receipt/mappers/shopping-gap.mapper.ts`.
    - Viết 7 unit tests tại `src/features/receipt/mappers/__tests__/receipt.mapper.test.ts` (100% pass).
    - Viết 4 unit tests tại `src/features/receipt/mappers/__tests__/shopping-gap.mapper.test.ts` (100% pass).
  - **Tầng 6 (API Clients & TanStack Query Hooks)**:
    - Triển khai `receiptApi` tại `src/features/receipt/api/receipt.api.ts` (6 endpoints) và `shoppingApi` tại `src/features/receipt/api/shopping.api.ts`.
    - Tạo Query Key Factories `RECEIPT_QUERY_KEYS` và `SHOPPING_QUERY_KEYS` kèm các custom hooks (`useReceiptJobQuery` tự động polling 2s khi `QUEUED`/`PROCESSING`, `useConfirmReceiptJobMutation` tự động invalidate cache `PANTRY_QUERY_KEYS.all`, `useCancelReceiptJobMutation`, `useRetryReceiptJobMutation`, `useShoppingGapPreviewQuery`, `usePreviewShoppingGapsMutation`).
  - **Tầng 7 (UI Components, Client Coordinators & Routes)**:
    - `ReceiptUploadZone`: Kéo thả & chọn từ 1 đến 4 ảnh hóa đơn, xem trước thumbnail, tích hợp tải lên qua storage reservation.
    - `ReceiptProgressTracker`: Thanh tiến trình bóc tách OCR 60 FPS GPU-composited, hiển thị tiến độ phân tích chi tiết.
    - `ReceiptImageViewer`: Trình xem ảnh hóa đơn tương tác hỗ trợ Zoom (1x–3x), Pan kéo rê, Rotate xoay 90 độ, và chuyển đổi giữa các ảnh hóa đơn (1..4).
    - `ReceiptMetadataHeader`: Thẻ thông tin siêu thị/cửa hàng, ngày mua, tổng tiền hóa đơn, và huy hiệu độ tin cậy trích xuất.
    - `ReceiptCandidateRow`: Dòng sản phẩm trích xuất hiển thị tên nhận diện, dòng chữ gốc OCR, gợi ý nguyên liệu chuẩn, số lượng, đơn vị, giá cả, và thanh tin cậy màu sắc.
    - `ReceiptCandidateEditDialog`: Hộp thoại modal chỉnh sửa sản phẩm có tìm kiếm nguyên liệu chuẩn từ từ điển, sửa số lượng/đơn vị, đơn giá và truyền `expectedVersion` chống xung đột.
    - `ReceiptInspectionView`: Màn hình đối chiếu kép 2 cột (Viewer ảnh bên trái + Danh sách sản phẩm bên phải) với tabs "Cần duyệt" và "Đã loại bỏ", thanh sticky footer chốt xác nhận nhập kho Tủ bếp.
    - `ReceiptConfirmationSummary`: Modal thông báo tóm tắt kết quả nhập kho (`CREATED` / `UPDATED`) sau khi xác nhận, kèm nút chuyển sang `/pantry`.
    - `ShoppingGapItemRow`: Dòng nguyên liệu đi chợ thông minh hiển thị 4 cột khối lượng (Yêu cầu, Có sẵn trong tủ, Còn thiếu cần mua, Dư thừa) kèm badge trạng thái Đủ/Thiếu và ghi chú giả định quy đổi.
    - `UnresolvedItemsCard`: Thẻ cảnh báo các nguyên liệu chưa quy đổi được khối lượng chuẩn (g) hoặc chưa tìm thấy trong từ điển để người dùng kiểm tra thủ công.
    - `ShoppingGapView`: Bảng điều phối danh sách đi chợ thông minh gồm 4 thẻ chỉ số tóm tắt, bộ lọc (Tất cả, Cần mua, Đã đủ sẵn), danh sách dòng nguyên liệu và khối cảnh báo.
    - Tích hợp ShoppingGapView vào component `ShoppingList` và trang thực đơn tuần `/meal-plans/[id]`.
    - Tạo 3 trang Route Shell: `/receipts` (trung tâm quản lý và lịch sử hóa đơn), `/receipts/scan` (màn hình tải lên và theo dõi OCR), `/receipts/[id]` (màn hình đối chiếu và xác nhận hóa đơn).
    - **No Orphan Pages**: Bổ sung nút "Quét hóa đơn" trên `PantryHeader` và mục "Hóa đơn mua sắm" trên dropdown menu người dùng tại `SiteHeader`.
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/receipt/types/receipt.dto.ts`
  - `src/features/receipt/types/shopping-gap.dto.ts`
  - `src/features/receipt/types/receipt.model.ts`
  - `src/features/receipt/types/shopping-gap.model.ts`
  - `src/features/receipt/schemas/receipt.schema.ts`
  - `src/features/receipt/schemas/shopping-gap.schema.ts`
  - `src/features/receipt/mappers/receipt.mapper.ts`
  - `src/features/receipt/mappers/shopping-gap.mapper.ts`
  - `src/features/receipt/mappers/__tests__/receipt.mapper.test.ts`
  - `src/features/receipt/mappers/__tests__/shopping-gap.mapper.test.ts`
  - `src/features/receipt/api/receipt.api.ts`
  - `src/features/receipt/api/shopping.api.ts`
  - `src/features/receipt/queries/receipt.queries.ts`
  - `src/features/receipt/queries/shopping.queries.ts`
  - `src/features/receipt/components/receipt-upload-zone.tsx`
  - `src/features/receipt/components/receipt-progress-tracker.tsx`
  - `src/features/receipt/components/receipt-image-viewer.tsx`
  - `src/features/receipt/components/receipt-metadata-header.tsx`
  - `src/features/receipt/components/receipt-candidate-row.tsx`
  - `src/features/receipt/components/receipt-candidate-edit-dialog.tsx`
  - `src/features/receipt/components/receipt-inspection-view.tsx`
  - `src/features/receipt/components/receipt-confirmation-summary.tsx`
  - `src/features/receipt/components/shopping-gap-item-row.tsx`
  - `src/features/receipt/components/unresolved-items-card.tsx`
  - `src/features/receipt/components/shopping-gap-view.tsx`
  - `src/features/meal-plan/components/shopping-list.tsx`
  - `src/app/(site)/meal-plans/[id]/page.tsx`
  - `src/app/(site)/receipts/receipts-client-view.tsx`
  - `src/app/(site)/receipts/page.tsx`
  - `src/app/(site)/receipts/scan/receipt-scan-client-view.tsx`
  - `src/app/(site)/receipts/scan/page.tsx`
  - `src/app/(site)/receipts/[id]/receipt-job-client-view.tsx`
  - `src/app/(site)/receipts/[id]/page.tsx`
  - `src/features/pantry/components/pantry-header.tsx`
  - `src/components/layout/site-header.tsx`
  - `frontend/docs/BACKEND_INTEGRATION.md`
  - `frontend/docs/PROGRESS.md`
  - `specs/023-receipts-shopping/tasks.md`
- Verify:
  - `npx tsc --noEmit`: Đạt 0 lỗi type (hoàn toàn sạch sẽ).
  - `npm test`: Đạt 37/37 test suites, 366/366 tests pass 100% (bao gồm 11 tests mới cho receipt và shopping gap mappers).
  - `npm run build`: Next.js 16 build thành công 100%, 39 routes biên dịch tối ưu (bao gồm `/receipts`, `/receipts/scan`, `/receipts/[id]`).
- PROGRESS: Phase 22: 0% → 100% (Hoàn thành trọn vẹn 7 tầng scaffold, kiểm thử và tích hợp lối vào tự nhiên).
- Còn lại / rủi ro: Không có.

## [2026-09-26] — Phase 21 Multi-Image Fridge Recognition (Nhận diện thực phẩm trong tủ lạnh qua hình ảnh)

- Mục tiêu: Triển khai toàn diện 7 tầng scaffold cho Phase 21 Nhận diện thực phẩm trong tủ lạnh qua nhiều ảnh (1–6 ảnh) theo spec `specs/022-fridge-vision/` và task `docs/tasks/phase-21-fridge-vision.md`. Đảm bảo tích hợp trọn vẹn với Storage module (reserve + commit với `kind: FRIDGE_IMAGE`), theo dõi tiến trình polling thời gian thực, giao diện chỉnh sửa ứng viên có khóa lạc quan (`expectedVersion`), và tuân thủ tuyệt đối quy tắc an toàn nghiệp vụ: chỉ có bước xác nhận (`POST /api/v1/ingredient-recognition/jobs/:id/confirm`) mới được phép đột biến số lượng tồn kho tủ bếp.
- Đã làm:
  - **Tầng 1 (Endpoints)**: Thêm hằng số `INGREDIENT_RECOGNITION` vào `src/common/constants/api-endpoints.ts` (`JOBS`, `JOB_DETAIL`, `JOB_CANDIDATE`, `JOB_CONFIRM`, `JOB_CANCEL`, `JOB_RETRY`).
  - **Tầng 2 (Storage Integration & DTOs)**:
    - Bổ sung `FRIDGE_IMAGE` và `RECEIPT_IMAGE` vào `MediaKind` trong `src/features/storage/types/storage.model.ts` và `storage.dto.ts`.
    - Cập nhật hàm `validateUploadFile` trong `src/features/storage/api/storage-upload.ts` để kiểm tra kích thước tối đa (10MB) và định dạng hợp lệ (JPEG, PNG, WebP, AVIF) cho `FRIDGE_IMAGE`.
    - Xây dựng bộ DTOs tại `src/features/ingredient-vision/types/ingredient-recognition.dto.ts` (`RecognitionJobDto`, `RecognitionCandidateDto`, `RecognitionInputDto`, `RecognitionPantryDiffDto`, `RecognitionConfirmResponseDto`, v.v.).
  - **Tầng 3 (Clean UI Models)**: Tạo UI Models tại `src/features/ingredient-vision/types/ingredient-recognition.model.ts` (`RecognitionJob`, `RecognitionCandidate`, `RecognitionImageInput`, `RecognitionPantryDiff`, status helper enums, confidence score helpers, display badge helpers).
  - **Tầng 4 (Validation Schemas)**: Xây dựng Zod validation schemas tại `src/features/ingredient-vision/schemas/ingredient-recognition.schema.ts` cho chỉnh sửa ứng viên (tên, số lượng, đơn vị, liên kết nguyên liệu chuẩn `ingredientId`, trạng thái từ chối `REJECTED`).
  - **Tầng 5 (Mapper & Unit Tests)**:
    - Xây dựng `IngredientRecognitionMapper` kế thừa `BaseMapper` tại `src/features/ingredient-vision/mappers/ingredient-recognition.mapper.ts`, sử dụng `pickField`, `safeNumber`, `safeString`, `safeEnum`, tính toán badge variants, nhãn tiếng Việt và tỉ lệ phần trăm tin cậy.
    - Viết 15 unit tests toàn diện tại `src/features/ingredient-vision/mappers/__tests__/ingredient-recognition.mapper.test.ts` (100% pass) kiểm tra map job, candidate, pagination, diff, empty arrays, null/undefined fields, enum fallbacks.
  - **Tầng 6 (API Client & TanStack Query Hooks)**:
    - Triển khai `ingredientRecognitionApi` tại `src/features/ingredient-vision/api/ingredient-recognition.api.ts` (6 phương thức axios sạch sẽ).
    - Tạo Query Key Factory `INGREDIENT_RECOGNITION_QUERY_KEYS` và custom hooks tại `src/features/ingredient-vision/queries/ingredient-recognition.queries.ts`: `useRecognitionJobQuery` (tự động polling 1500ms khi job đang chạy), `useCreateRecognitionJobMutation`, `useUpdateRecognitionCandidateMutation`, `useConfirmRecognitionJobMutation` (tự động làm mới cache pantry), `useCancelRecognitionJobMutation`, `useRetryRecognitionJobMutation`.
  - **Tầng 7 (UI Components, Client Coordinator & Route Shell)**:
    - `FridgeUploadZone`: Dropzone kéo thả tải lên từ 1 đến 6 ảnh thực tế, preview thumbnail, nút xóa từng ảnh, tích hợp trực tiếp `uploadWithReservation` của module Storage.
    - `RecognitionProgressTracker`: Thanh tiến độ thời gian thực (0%..100%), hoạt cảnh 60 FPS GPU-composited (`transform` + `opacity`), hiển thị bước xử lý chi tiết (OCR, Phát hiện vật thể, Đối soát danh mục) và huy hiệu cảnh báo nếu có ảnh lỗi từng phần (`PARTIAL_FAILED`).
    - `CandidateCard`: Thẻ hiển thị ứng viên nhận diện với điểm tin cậy (High/Medium/Low), liên kết nguyên liệu chuẩn/chưa chuẩn, bằng chứng ảnh thu nhỏ (crop/box), cảnh báo thiếu thông tin, và nút chỉnh sửa/từ chối.
    - `CandidateEditDialog`: Modal chỉnh sửa chi tiết ứng viên với autocomplete nguyên liệu chuẩn từ `useIngredientsQuery`, chỉnh số lượng/đơn vị, nút loại bỏ ứng viên, và truyền `expectedVersion` chống xung đột chỉnh sửa.
    - `FreshnessDisclaimerBanner`: Biểu ngữ cảnh báo an toàn thực phẩm hiển thị nguyên văn `freshnessDisclaimer` từ backend, tuân thủ nguyên tắc cẩn trọng, không khẳng định chất lượng vệ sinh hay an toàn vi sinh.
    - `EvidenceImageModal`: Modal phóng to ảnh bằng chứng gốc với bounding box minh họa tọa độ vật thể phát hiện.
    - `CandidateReviewScreen`: Màn hình duyệt toàn bộ ứng viên, lọc ứng viên hợp lệ/từ chối, hiển thị danh sách ảnh nguồn, nút "Hủy tác vụ", nút "Thử lại", và nút "Xác nhận & Thêm vào tủ bếp".
    - `RecognitionConfirmationSummary`: Bảng tổng hợp đối soát thay đổi sau khi xác nhận (`POST /confirm`), hiển thị rõ ràng nguyên liệu tạo mới (`CREATED`) và nguyên liệu cập nhật tăng số lượng (`UPDATED`) kèm nút điều hướng về `/pantry`.
    - `FridgeScanClientView`: Điều phối mượt mà 4 bước trải nghiệm (Upload -> Processing -> Review -> Summary).
    - `src/app/pantry/scan/page.tsx`: Server Component Route Shell với SEO metadata tiếng Việt và `Suspense`.
    - **No Orphan Pages**: Bổ sung nút hành động "Nhận diện từ ảnh" vào `PantryHeader` (`src/features/pantry/components/pantry-header.tsx`) trỏ trực tiếp đến `/pantry/scan`.
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/storage/types/storage.model.ts`
  - `src/features/storage/types/storage.dto.ts`
  - `src/features/storage/api/storage-upload.ts`
  - `src/features/ingredient-vision/types/ingredient-recognition.dto.ts`
  - `src/features/ingredient-vision/types/ingredient-recognition.model.ts`
  - `src/features/ingredient-vision/schemas/ingredient-recognition.schema.ts`
  - `src/features/ingredient-vision/mappers/ingredient-recognition.mapper.ts`
  - `src/features/ingredient-vision/mappers/__tests__/ingredient-recognition.mapper.test.ts`
  - `src/features/ingredient-vision/api/ingredient-recognition.api.ts`
  - `src/features/ingredient-vision/queries/ingredient-recognition.queries.ts`
  - `src/features/ingredient-vision/components/fridge-upload-zone.tsx`
  - `src/features/ingredient-vision/components/recognition-progress-tracker.tsx`
  - `src/features/ingredient-vision/components/candidate-card.tsx`
  - `src/features/ingredient-vision/components/candidate-edit-dialog.tsx`
  - `src/features/ingredient-vision/components/freshness-disclaimer-banner.tsx`
  - `src/features/ingredient-vision/components/evidence-image-modal.tsx`
  - `src/features/ingredient-vision/components/candidate-review-screen.tsx`
  - `src/features/ingredient-vision/components/recognition-confirmation-summary.tsx`
  - `src/app/pantry/scan/fridge-scan-client-view.tsx`
  - `src/app/pantry/scan/page.tsx`
  - `src/features/pantry/components/pantry-header.tsx`
  - `frontend/docs/BACKEND_INTEGRATION.md`
  - `frontend/docs/PROGRESS.md`
  - `specs/022-fridge-vision/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 35/35 test suites pass, 355/355 tests pass (trong đó 15 mapper tests mới của Phase 21 pass 100%).
  - `npm run build`: 37/37 routes biên dịch thành công, bao gồm `/pantry/scan`.
- PROGRESS: Phase 21 Multi-image fridge candidate confirmation 0% → 100% (READY).
- Còn lại / rủi ro: Không có rủi ro logic; tính năng sẵn sàng phục vụ người dùng. Khi backend bật provider AI thật, chỉ cần duy trì đúng API contract hiện hành.

## [2026-09-26] — Phase 20 Pantry Inventory Management (Tủ bếp gia đình)

- Mục tiêu: Triển khai toàn diện 7 tầng scaffold cho Phase 20 Quản lý Tủ bếp Gia đình (Pantry Inventory Management) theo spec `specs/021-pantry-inventory/`, kế thừa `BaseMapper`, hỗ trợ quản lý nguyên liệu (chuẩn hoặc tự do), cảnh báo sắp hết hạn, sổ cái điều chỉnh số lượng bất biến chống số dư âm, gộp trùng lặp nguyên tử, và trang bị khuyến cáo an toàn thực phẩm.
- Đã làm:
  - **Tầng 1 (Endpoints)**: Thêm hằng số `PANTRY` vào `src/common/constants/api-endpoints.ts` (`ITEMS`, `ITEM_DETAIL`, `EXPIRING_SOON`, `ADJUSTMENTS`, `MERGE_PREVIEW`, `MERGE`).
  - **Tầng 2 (DTOs)**: Xây dựng bộ DTOs phản ánh chính xác schema từ backend OpenAPI tại `src/features/pantry/types/pantry.dto.ts` (`PantryItemDto`, `PantryAdjustmentDto`, `PantryMergePreviewDto`, `PantryMergeResponseDto`, envelopes và request payloads).
  - **Tầng 3 (Clean UI Models)**: Tạo các Clean UI Models tại `src/features/pantry/types/pantry.model.ts` (`PantryItem`, `PantryAdjustment`, `PantryMergePreview`, `PantryFilter`, formatted fields `formattedQuantity`, `expiryStatus`, `expiryBadgeVariant`, `sourceLabel`, `actionLabel`).
  - **Tầng 4 (Schemas & Validation)**: Xây dựng Zod validation schemas tại `src/features/pantry/schemas/pantry.schema.ts` cho thêm mới/chỉnh sửa nguyên liệu (hỗ trợ dual-identity: `ingredientId` hoặc `unmatchedText`), sổ cái điều chỉnh (`CONSUME`, `RESTORE`, `ADJUST`), và gộp nguyên liệu.
  - **Tầng 5 (Mapper & Unit Tests)**:
    - Xây dựng `PantryMapper` kế thừa `BaseMapper` tại `src/features/pantry/mappers/pantry.mapper.ts`, sử dụng triệt để `pickField`, `safeNumber`, `safeString`, `safeDateString` và xử lý envelope pagination `toPantryPaginationModel`.
    - Viết 14 Vitest unit tests tại `src/features/pantry/mappers/__tests__/pantry.mapper.test.ts` kiểm thử toàn diện các trường hợp null/undefined, thiếu trường, tính toán trạng thái hết hạn (`EXPIRED`, `EXPIRING_SOON`, `SAFE`), format số lượng, sổ cái điều chỉnh và xem trước gộp (100% pass).
  - **Tầng 6 (API Client & TanStack Query Hooks)**:
    - Triển khai `pantryApi` tại `src/features/pantry/api/pantry.api.ts` (10 phương thức axios, chuyển đổi sạch sẽ qua mapper).
    - Tạo Query Key Factory `PANTRY_QUERY_KEYS` và 10 custom query/mutation hooks tại `src/features/pantry/queries/pantry.queries.ts` với tính năng invalidation tự động và toast thông báo tiếng Việt.
  - **Tầng 7 (UI Components & Route Shell)**:
    - `PantrySafetyBanner`: Khuyến cáo an toàn thực phẩm trung thực, không tuyên bố chứng nhận chất lượng thực phẩm.
    - `PantryHeader`: Thanh tìm kiếm và bộ lọc nguồn (Tất cả, Thủ công, Nhận diện tủ lạnh, Hóa đơn) và nút thao tác nhanh.
    - `PantryTabs`: Chuyển đổi giữa "Tất cả tủ bếp" và "Sắp hết hạn" kèm badge đếm số lượng.
    - `PantryItemCard`: Thẻ hiển thị nguyên liệu với badge hạn sử dụng, thông tin dinh dưỡng tham chiếu, menu hành động, và nút điều chỉnh nhanh (+ / -).
    - `PantryItemList`: Xử lý triệt để 4 trạng thái Loading (Skeleton), Error, Empty, và Success.
    - `PantryItemDialog`: Modal thêm/sửa nguyên liệu tích hợp tìm kiếm autocomplete nguyên liệu chuẩn từ `useIngredientsQuery` hoặc nhập tự do `unmatchedText`.
    - `PantryAdjustmentDialog`: Modal điều chỉnh tồn kho hỗ trợ 3 loại `CONSUME`, `RESTORE`, `ADJUST` với cơ chế client-side chặn số dư âm và yêu cầu lý do kiểm toán.
    - `PantryHistoryDialog`: Modal xem lịch sử sổ cái bất biến với biến động số lượng delta và số dư trước/sau.
    - `PantryDeleteDialog`: Modal xác nhận xóa mềm kèm truyền `expectedVersion` chống xung đột đồng thời.
    - `PantryMergeDialog`: Modal chọn nhiều nguyên liệu trùng lặp, xem trước số dư tính toán trước khi thực thi gộp nguyên tử.
    - `PantryClientView` & `/pantry/page.tsx`: Giao diện tổng hợp với SEO metadata và React Suspense.
    - **No Orphan Pages**: Bổ sung liên kết "Tủ bếp gia đình" vào User Dropdown Menu trên `SiteHeader`.
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/pantry/types/pantry.dto.ts`
  - `src/features/pantry/types/pantry.model.ts`
  - `src/features/pantry/schemas/pantry.schema.ts`
  - `src/features/pantry/mappers/pantry.mapper.ts`
  - `src/features/pantry/mappers/__tests__/pantry.mapper.test.ts`
  - `src/features/pantry/api/pantry.api.ts`
  - `src/features/pantry/queries/pantry.queries.ts`
  - `src/features/pantry/components/pantry-safety-banner.tsx`
  - `src/features/pantry/components/pantry-header.tsx`
  - `src/features/pantry/components/pantry-tabs.tsx`
  - `src/features/pantry/components/pantry-item-card.tsx`
  - `src/features/pantry/components/pantry-item-list.tsx`
  - `src/features/pantry/components/pantry-item-dialog.tsx`
  - `src/features/pantry/components/pantry-adjustment-dialog.tsx`
  - `src/features/pantry/components/pantry-history-dialog.tsx`
  - `src/features/pantry/components/pantry-delete-dialog.tsx`
  - `src/features/pantry/components/pantry-merge-dialog.tsx`
  - `src/features/pantry/index.ts`
  - `src/app/pantry/page.tsx`
  - `src/app/pantry/pantry-client-view.tsx`
  - `src/components/layout/site-header.tsx`
  - `specs/021-pantry-inventory/tasks.md`
  - `docs/tasks/phase-20-pantry.md`
  - `docs/PROGRESS.md`
  - `docs/BACKEND_INTEGRATION.md`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx vitest run src/features/pantry/mappers/__tests__/pantry.mapper.test.ts`: 14/14 unit tests pass 100%.
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 34/34 test files passed (340/340 tests passed, 0 regressions).
  - `npm run build`: Next.js 16 build thành công 36/36 routes (bao gồm `/pantry`).
- PROGRESS: Phase 20: 0% → 100% (Hoàn thành toàn diện 7 tầng scaffold và tích hợp 6 API endpoints READY).
- Còn lại / rủi ro: Không có. Phase 21 (Nhận diện tủ lạnh bằng ảnh) vẫn giữ trạng thái PLANNED chờ backend.

## [2026-09-24] — Khắc phục lỗi gom toàn bộ món ăn vào ngày đầu tiên của tuần (Phase 19 Meal Program)

- Mục tiêu: Phân bổ chính xác các món ăn trong tuần về đúng 7 ngày dựa trên trường `date` (YYYY-MM-DD) và phân loại trực quan theo `mealType` (Bữa sáng, Bữa trưa, Bữa tối, Bữa phụ) thay vì dồn tất cả 21 món vào Ngày thứ nhất.
- Đã làm:
  - **Phân tích nguyên nhân**:
    1. Trong `mealProgramMapper.groupSlotsIntoDays`: code cũ đọc `slot.dayOfWeek` hoặc `slot.day_of_week`. Tuy nhiên, backend `MealPlan` lưu trữ danh sách phẳng 21 slot trong `items` với trường định danh ngày là `date` (`"YYYY-MM-DD"`), không có `dayOfWeek`. Khi không tìm thấy `dayOfWeek`, mapper fallback về `1` cho toàn bộ 21 món, dẫn đến hiện tượng Ngày 1 chứa cả 21 món còn các ngày 2–7 bị rỗng.
    2. Các món ăn chưa được sắp xếp theo thứ tự bữa ăn tự nhiên (`BREAKFAST` -> `LUNCH` -> `DINNER` -> `SNACK`).
  - **Triển khai chuẩn hóa**:
    - **Mapper (`mealProgramMapper.groupSlotsIntoDays`)**:
      - Quét toàn bộ các giá trị `slot.date` duy nhất trong `items` để xác định chính xác 7 ngày theo chu kỳ tuần bắt đầu từ `startDate` / `weekStart`.
      - Nhóm từng món ăn vào đúng ngày dựa trên trường `slot.date` (kèm fallback `dayOfWeek` và `position` an toàn).
      - Bổ sung `dayOfWeekLabel` (`Thứ Hai`, `Thứ Ba`, ..., `Chủ Nhật`) cho từng ngày.
      - Sắp xếp các món ăn trong ngày theo trình tự thời gian: Bữa sáng (`BREAKFAST`) ➔ Bữa trưa (`LUNCH`) ➔ Bữa tối (`DINNER`) ➔ Bữa phụ (`SNACK`).
    - **UI (`WeekPlanView` & `DayMealChecklist`)**:
      - Hiển thị tiêu đề ngày rõ ràng: Tên thứ + Ngày tháng (vd: `Thứ Hai (28/09)`, `Thứ Ba (29/09)`, ...).
      - Trang bị badge màu sắc và icon riêng biệt theo `mealType`:
        - ☀️ Bữa sáng (`amber` badge + icon `Sun`)
        - 🍽️ Bữa trưa (`orange` badge + icon `Utensils`)
        - 🌙 Bữa tối (`indigo` badge + icon `Moon`)
        - ✨ Bữa phụ (`emerald` badge + icon `Sparkles`)
    - **Unit Test**: Bổ sung test case 11 trong `meal-program.mapper.test.ts` kiểm thử 21 slot xáo trộn được phân bổ chuẩn xác thành 7 ngày, mỗi ngày 3 món đúng thứ tự `BREAKFAST` ➔ `LUNCH` ➔ `DINNER`.
- File tạo/sửa:
  - `src/features/meal-program/types/meal-program.model.ts`
  - `src/features/meal-program/mappers/meal-program.mapper.ts`
  - `src/features/meal-program/mappers/meal-program.mapper.test.ts`
  - `src/features/meal-program/components/week-plan-view.tsx`
  - `src/features/meal-program/components/day-meal-checklist.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 33/33 test files passed (326/326 tests passed).
- PROGRESS: Hoàn thiện hiển thị lịch thực đơn tuần Phase 19 đạt 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Khắc phục lỗi VALIDATION_ERROR khi tạo lộ trình dinh dưỡng Phase 19

- Mục tiêu: Khắc phục triệt để lỗi `VALIDATION_ERROR` từ backend khi tạo lộ trình (`goal` enum, `startDate` phải là Thứ Hai, `horizonWeeks`, `idempotencyKey`, và lỗi unrecognized keys snake_case do backend `.strict()`).
- Đã làm:
  - **Phân tích nguyên nhân**:
    1. Backend `createMealProgramRequestSchema` sử dụng `.strict()` với định dạng camelCase (`startDate`, `horizonWeeks`), trong khi form trước đó gửi payload snake_case (`start_date`, `horizon_weeks`), dẫn đến lỗi `Unrecognized keys: "start_date", "horizon_weeks"`.
    2. Backend bắt buộc `goal` là enum `MealGoal` (`'MAINTAIN' | 'LOSE' | 'GAIN'`), trong khi form trước đó là textarea tự do (gửi "GIẢM CÂN ĂN UỐNG HEALTHI").
    3. Backend kiểm tra `(value) => new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1` - ngày bắt đầu BẮT BUỘC là Thứ Hai, trong khi người dùng chọn ngày Thứ Sáu (2026-09-25).
    4. Backend yêu cầu `idempotencyKey` (8-120 ký tự) không được để trống.
  - **Triển khai khắc phục chuẩn kiến trúc**:
    - Tạo bộ tiện ích ngày tháng `meal-program-date.utils.ts` và unit test `meal-program-date.utils.test.ts`: tính toán Thứ Hai tiếp theo (`getNextMonday`), kiểm tra Thứ Hai (`isMonday`), tự động nắn ngày sang Thứ Hai gần nhất (`snapToNextMonday`), gợi ý danh sách Thứ Hai dạng pills (`getUpcomingMondays`).
    - Cập nhật `program-create-form.tsx`: Thay textarea tự do bằng 3 card chọn mục tiêu chuẩn enum (`LOSE`: Giảm cân & Thanh lọc, `MAINTAIN`: Duy trì vóc dáng, `GAIN`: Tăng cân & Tăng cơ) kèm icon và badge. Thêm date picker Thứ Hai kèm auto-snap và pills chọn nhanh 1 click. Gửi payload thuần camelCase khớp 100% backend schema.
    - Cập nhật `meal-program.api.ts`: Chuẩn hóa `createMealProgram` tự động sinh `idempotencyKey` UUID chuẩn nếu chưa có, loại bỏ hoàn toàn các trường thừa chống lỗi `.strict()`. Đồng bộ các endpoint PATCH (`CONFIRM`, `REANALYZE`, `REGENERATE_WEEK`, `UPDATE_METADATA`, `SELECT_ALTERNATIVE`).
    - Cập nhật `meal-program.queries.ts`, `program-confirm-dialog.tsx`, `downstream-invalidation-banner.tsx`, `program-analysis-tab.tsx`, `regenerate-week-dialog.tsx` đồng bộ với backend action schemas.
- File tạo/sửa:
  - `src/features/meal-program/utils/meal-program-date.utils.ts` (mới)
  - `src/features/meal-program/utils/meal-program-date.utils.test.ts` (mới)
  - `src/features/meal-program/types/meal-program.dto.ts`
  - `src/features/meal-program/types/meal-program.model.ts`
  - `src/features/meal-program/mappers/meal-program.mapper.ts`
  - `src/features/meal-program/api/meal-program.api.ts`
  - `src/features/meal-program/queries/meal-program.queries.ts`
  - `src/features/meal-program/components/program-create-form.tsx`
  - `src/features/meal-program/components/program-confirm-dialog.tsx`
  - `src/features/meal-program/components/downstream-invalidation-banner.tsx`
  - `src/features/meal-program/components/program-analysis-tab.tsx`
  - `src/features/meal-program/components/regenerate-week-dialog.tsx`
  - `src/app/(site)/meal-programs/[id]/page.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 33/33 test files passed (325/325 tests passed).
- PROGRESS: Phase 19 Meal Program Form & API Validation đã sửa triệt để 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Khắc phục lỗi animation khi click chuyển trang Tra cứu dinh dưỡng và Cẩm nang trên Navbar

- Mục tiêu: Khắc phục triệt để lỗi animation bị giật, nhấp nháy, chữ biến mất hoặc xung đột đo đạc tọa độ khi người dùng click vào các mục "Tra cứu dinh dưỡng" và "Cẩm nang" trên thanh Header.
- Đã làm:
  - **Phân tích nguyên nhân**:
    1. Khi sử dụng `layoutId="header-active-pill"` cho trạng thái Active kết hợp với `layoutId="header-hover-pill"` cho Hover: lúc người dùng click vào một mục mới (vd: Cẩm nang), mục đó lập tức chuyển sang `active = true` và chữ nhận màu trắng `text-primary-foreground`. Tuy nhiên, thẻ nền xanh `header-active-pill` cần thời gian chuyển động lò xo (~300ms) để bay từ trang cũ sang. Trong 300ms đó, nền hover xám đã bị huỷ (`!active`), khiến chữ màu trắng nằm trên nền thanh menu màu trắng/trong suốt -> chữ bị biến mất tạm thời (chớp trắng).
    2. Riêng mục "Tra cứu dinh dưỡng" (`/categories#tra-cuu`), khi click vào thì trình duyệt thực hiện scroll nhảy xuống anchor `#tra-cuu`. Việc scroll đột ngột cùng lúc Framer Motion đang đo tọa độ `getBoundingClientRect()` cho `layoutId="header-active-pill"` khiến khung tính toán bị lệch vị trí hoặc giật khung hình.
    3. `hoveredHref` không được reset khi click, dẫn đến trạng thái hover bị kẹt ngay trên liên kết vừa click.
  - **Giải pháp xử lý chuẩn UI/UX & Motion**:
    - **Active Badge tĩnh & ổn định**: Gán trực tiếp lớp màu chuẩn `bg-primary font-semibold text-primary-foreground shadow-sm` cho mục trang đang chọn (`active`), loại bỏ việc di chuyển `header-active-pill` giữa các trang khác nhau. Điều này triệt tiêu hoàn toàn lỗi chớp chữ trắng, giật layout và xung đột scroll anchor.
    - **Hover Pill mượt mà 60 FPS**: Giữ nguyên `layoutId="header-hover-pill"` chuyển động lướt dính theo con trỏ chuột (`stiffness: 380, damping: 30`) giữa các mục chưa active.
    - **Reset `hoveredHref` khi click**: Thêm `onClick={() => setHoveredHref(null)}` trên mỗi thẻ `<Link>` để ngay khi click điều hướng, thanh hover tự động dọn dẹp sạch sẽ, không gây chồng chéo hiệu ứng.
- File tạo/sửa:
  - `src/components/layout/site-header.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319/319 tests passed).
  - `npm run build`: Build Next.js thành công 35/35 routes.
- PROGRESS: Tinh chỉnh chuyển động Click & Hover Navbar Header hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Tối ưu hiệu ứng lướt hover (Gliding Pill Animation) trên thanh điều hướng Header

- Mục tiêu: Khắc phục lỗi animation hover bị giật, nhấp nháy hoặc xung đột layoutId trên thanh điều hướng (`SiteHeader`) khi có nhiều trang/mục menu.
- Đã làm:
  - **Phân tích nguyên nhân**: Việc bọc `<AnimatePresence>` kèm `initial={{ opacity: 0 }}` và `exit={{ opacity: 0 }}` bên trong từng phần tử lặp `.map()` khiến khi con trỏ chuột di chuyển nhanh giữa các mục menu, phần tử cũ vẫn tồn tại trong DOM trong suốt thời gian exit animation. Cả 2 phần tử cùng mang `layoutId="header-hover-pill"` dẫn đến xung đột vị trí tính toán của Framer Motion / Motion LayoutGroup, gây hiện tượng bóng ma hoặc giật cục.
  - **Tối ưu hóa chuyển động (Performance & Motion guidelines)**:
    - Loại bỏ việc bọc `<AnimatePresence>` riêng lẻ từng mục để `layoutId="header-hover-pill"` chuyển đổi vị trí mượt mà (smooth gliding) giữa các bounding box qua physics spring (`stiffness: 380, damping: 30`).
    - Giữ `pointer-events-none` và `-z-0` trên thẻ `motion.span` để không can thiệp hoặc ngắt quãng các sự kiện `onMouseEnter` / `onMouseLeave` của thẻ `<Link>`.
    - Phân tách rõ rệt giữa `header-active-pill` (trang hiện tại) và `header-hover-pill` (mục đang hover), khi rê chuột vào trang đang active thì hover pill tự tắt sạch sẽ, tránh đè 2 lớp nền.
    - Duy trì hỗ trợ `shouldReduceMotion` cho người dùng cấu hình giảm tải chuyển động.
- File tạo/sửa:
  - `src/components/layout/site-header.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319/319 tests passed).
  - `npm run build`: Build Next.js thành công 35/35 routes.
- PROGRESS: Tinh chỉnh chuyển động Navbar Header hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Khắc phục lỗi tràn viền phải & lệch trang khi mở popup menu trên Header

- Mục tiêu: Khắc phục hiện tượng khi người dùng click vào popup mở menu điều hướng (Avatar hồ sơ cá nhân hoặc Chuông thông báo trên Header) thì giao diện bị giật, lệch và tràn viền sang bên phải làm mất góc nhìn bên trái và hở viền trắng bên phải.
- Đã làm:
  - **Phân tích nguyên nhân**:
    1. DropdownMenu của Radix UI mặc định kích hoạt `modal={true}`, sử dụng `react-remove-scroll` để khóa cuộn `body`. Khi khóa, thư viện tự động thêm `padding-right: 17px` (độ rộng scrollbar Windows) và ẩn scrollbar, gây layout shift dịch chuyển toàn bộ trang web.
    2. Trong `globals.css`, cấu hình `max-width: 100vw` tính cả bề rộng scrollbar (vốn rộng hơn `clientWidth` 17px), khi kết hợp với `padding-right` của Radix khiến popper vượt quá màn hình, làm trình duyệt tự động cuộn ngang cửa sổ sang phải (`window.scrollX > 0`).
  - **Giải pháp xử lý**:
    - **Cấu hình `modal={false}` cho Header Dropdown**: Thiết lập `modal = false` mặc định cho `DropdownMenu` trong `src/components/ui/dropdown-menu.tsx` và cụ thể tại `SiteHeader` (Avatar menu) và `NotificationBell`. Menu hoạt động như một popover điều hướng tự nhiên: không khóa scroll body, không thêm `padding-right`, không làm nhảy khung hình và không gây cuộn ngang.
    - **Thêm `collisionPadding = 8`**: Đảm bảo Popper của Radix luôn giữ khoảng cách an toàn ít nhất 8px so với mép phải màn hình, không bao giờ tì sát hay cấn viền.
    - **Chỉnh `max-width: 100%` trong `globals.css`**: Thay thế `100vw` bằng `width: 100%; max-width: 100%;` để giới hạn chính xác theo `clientWidth`, triệt tiêu hoàn toàn khả năng tính dư pixel của scrollbar.
    - **Responsive max-width cho DropdownContent**: Đặt `max-w-[calc(100vw-2rem)]` cho menu Avatar và `w-[calc(100vw-2rem)] max-w-sm sm:w-90` cho Notification panel để đảm bảo hiển thị hoàn hảo trên mọi kích cỡ màn hình.
- File tạo/sửa:
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/layout/site-header.tsx`
  - `src/features/notification/components/notification-bell.tsx`
  - `src/app/globals.css`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319/319 tests passed).
  - `npm run build`: Build Next.js thành công 35/35 routes.
- PROGRESS: Tinh chỉnh UI Header Dropdowns hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Tối ưu thanh công cụ Tab trang Hồ sơ (Profile) hiển thị 1 hàng & bổ sung thanh cuộn / nút báo hiệu nội dung

- Mục tiêu:
  - Khắc phục tình trạng văn bản trên các nút tab của trang Hồ sơ (`/profile`) bị bẻ dòng thành nhiều hàng.
  - Bổ sung thanh scrollbar thanh mảnh tinh tế và các nút điều hướng / báo hiệu trực quan để người dùng nhận biết ngay khi phía sau còn nhiều tab nội dung.
- Đã làm:
  - **Hiển thị 1 hàng duy nhất**: Bổ sung `whitespace-nowrap` cho toàn bộ nút tab, nhãn text và các badge (`AI Phân tích`, `NĐ 13/2023`).
  - **Thanh cuộn tùy biến (`custom-scrollbar`)**: Khai báo utility `.custom-scrollbar` trong `src/app/globals.css` với chiều cao 4px, thumb bo tròn thanh mảnh theo màu theme, hiển thị tự nhiên khi danh sách bị tràn.
  - **Nút báo hiệu & cuộn tự động (`ChevronLeft` / `ChevronRight`)**:
    - Sử dụng `tabsContainerRef` và bộ lắng nghe sự kiện cuộn/resize để tính toán `canScrollLeft` và `canScrollRight`.
    - Khi phía sau còn nội dung, nút mũi tên phải (`ChevronRight`) xuất hiện nổi bật với hiệu ứng nhịp thở nhẹ (`animate-pulse`) để thu hút sự chú ý của người dùng; khi click, thanh tab tự động cuộn mượt mà sang các mục tiếp theo.
    - Khi đã cuộn, nút mũi tên trái (`ChevronLeft`) hỗ trợ quay về đầu trang nhanh chóng.
- File tạo/sửa:
  - `src/app/globals.css`
  - `src/app/(site)/profile/page.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319/319 tests passed).
  - `npm run build`: Build Next.js thành công 35/35 routes.
- PROGRESS: Tinh chỉnh UI Profile Tab Bar hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-24] — Khắc phục triệt để lỗi tràn ngang (Horizontal Overflow) trên giao diện toàn trang

- Mục tiêu: Điều chỉnh toàn bộ layout và header trang web VeggieConnect để nằm gọn trong 1 khung hình (1 viewport width), xóa bỏ hoàn toàn thanh cuộn ngang (horizontal scrollbar) và ngăn chặn việc icon/avatar người dùng bị cắt ở cạnh phải màn hình.
- Đã làm:
  - **Phân tích nguyên nhân**: Trên màn hình laptop (độ phân giải 1280px–1366px hoặc có tỷ lệ display scale 125%–150%), header có tổng chiều rộng cố định các phần tử (Logo 215px + 7 mục điều hướng chữ dài 744px + Search input 160px + Actions 215px + gaps = ~1390px) vượt quá bề ngang container 1232px, làm tràn 140px ra cạnh phải, đẩy avatar người dùng bị cắt đôi và kích hoạt thanh cuộn ngang trên trình duyệt.
  - **Tối ưu SiteHeader (`src/components/layout/site-header.tsx`)**:
    - Bổ sung `shortLabel` cho `NAV_ITEMS`: Hiển thị nhãn rút gọn tinh tế trên các màn hình vừa/laptop (`shortLabel`: "Khám phá", "Dinh dưỡng", "Video", "Thực đơn", "Bản đồ") và chỉ bung nhãn đầy đủ trên màn hình cực lớn (`2xl:` 1536px+).
    - Tối ưu padding và font-size cho các link nav (`px-1.5 py-1 text-xs xl:px-2.5 2xl:px-3.5`).
    - Nút "AI Trợ lý": Thu gọn về icon mầm lá + sao khi ở kích thước `lg`, hiển thị đầy đủ chữ trên `xl:` và `2xl:`.
    - Thanh tìm kiếm: Điều chỉnh độ rộng co giãn thông minh `lg:w-28 xl:w-36 2xl:w-56`.
    - Nút Đăng nhập / Avatar: Đồng bộ kích thước `h-8.5 w-8.5` (co giãn sang `2xl:h-9 2xl:w-9`) để vừa khít hoàn hảo.
  - **Tối ưu BrandLogo (`src/components/layout/brand-logo.tsx`)**: Cho phép `imageClassName` kiểm soát chiều cao (`h-7 xl:h-8 2xl:h-9`) với `width: auto; maxWidth: 100%`, tránh cố định cứng pixel inline style.
  - **Tối ưu CSS Toàn Cục & Khung Trang (`src/app/globals.css`, `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`)**:
    - Thiết lập `html, body { max-width: 100vw; overflow-x: clip; }` ngăn ngừa thanh cuộn ngang mà không gây ảnh hưởng đến `position: sticky`.
    - Thêm `overflow-x-clip` và `w-full` cho wrapper layout trang `SiteLayout`.
    - Thêm `overflow-hidden` và `pointer-events-none` cho phần tử Hero section và các vòng sáng ambient blur (`-left-24`) tại trang chủ.
- File tạo/sửa:
  - `src/components/layout/brand-logo.tsx`
  - `src/components/layout/site-header.tsx`
  - `src/app/globals.css`
  - `src/app/(site)/layout.tsx`
  - `src/app/(site)/page.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319/319 tests passed).
  - `npm run build`: Compiled successfully, sinh thành công 35/35 static/dynamic pages.
- PROGRESS: Tối ưu UI/UX Responsive & Chống tràn layout ngang hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Kiểm tra Response và Đồng bộ Swagger / API Catalog cho Phase 12 đến Phase 19

- Mục tiêu: Kiểm tra toàn diện các thay đổi response, OpenAPI schema và tài liệu audit cho Phase 12 đến Phase 19 theo cập nhật mới nhất từ Backend; đồng bộ Swagger vào API Catalog frontend.
- Đã làm:
  - Rà soát tài liệu `phase12_19_response_audit.md` ghi nhận toàn bộ cấu trúc response, mapper và kiểm tra rò rỉ trường nội bộ (FKs, `reviewedById`, `importBatchId`...): tất cả endpoint client-facing đều sạch; các trường kiểm toán của Admin được giữ lại đúng thiết kế.
  - Chạy `node scripts/sync-swagger.mjs ../backend/openapi.json`: Đồng bộ thành công 118 endpoints, 27 nhóm OpenAPI vào `docs/API-CATALOG.md` và `docs/api/*.md` (bao gồm `custom-meals.md`, `meal-analysis.md`, `meal-programs.md` mới).
  - Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`:
    - Dọn dẹp bảng Section 6.12 bỏ các hàng trùng lặp / PLANNED cũ; cập nhật đúng các endpoint thật của Custom Meals (Phase 17 - `/photos` thay vì `/media`), Meal Analysis (Phase 18) và Meal Programs (Phase 19).
    - Bổ sung chi tiết Section 6.13 (Meal Analysis - Phase 18) và 6.14 (Multi-Week Meal Programs - Phase 19) bao gồm business rules và bảng mã lỗi chi tiết.
    - Cập nhật Changelog (v5.0 - 2026-09-23).
- File tạo/sửa:
  - `frontend/docs/API-CATALOG.md`
  - `frontend/docs/api-catalog.json`
  - `frontend/docs/api/*.md` (các file api docs sinh tự động)
  - `frontend/docs/BACKEND_INTEGRATION.md`
  - `frontend/docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi typescript.
  - `npm test`: 32/32 test files passed (319 tests passed).
- PROGRESS: Đồng bộ contract BE/FE Phase 12–19 hoàn tất 100%.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Triển khai hoàn tất Phase 14: Hợp nhất Quyền hạn & Căn cứ Xác minh Contributor (Unified Contributor Trust & Verification Parity)

- Mục tiêu: Thực hiện breaking migration toàn diện phân hệ Contributor theo SRS §3.3 và IMPLEMENTATION_PLAN BL-01. Loại bỏ toàn bộ phân tầng subtype RBAC (ContributorType: EXPERIENCED_PRACTITIONER, NUTRITION_EXPERT). Thống nhất một vai trò CONTRIBUTOR duy nhất với 3 căn cứ phê duyệt chuẩn (ContributorApprovalBasis: ORGANIZATION_AFFILIATION, PLATFORM_TRACK_RECORD, ADMIN_INVITED). Căn cứ phê duyệt chỉ mang tính giải trình kiểm toán, không tạo ra nhánh phân quyền. Triển khai API và UI cho Admin mời trực tiếp (POST /api/v1/admin/contributor-invitations) và thu hồi tư cách Contributor kèm lý do kiểm toán bắt buộc (PATCH /api/v1/admin/contributors/:userId/revoke). Biểu mẫu nộp đơn công khai chỉ cho phép chọn ORGANIZATION_AFFILIATION hoặc PLATFORM_TRACK_RECORD (cấm tự chọn ADMIN_INVITED). Ngăn chặn tự duyệt đơn trong Review dialog. Tuân thủ 100% quy chuẩn kiến trúc 7 tầng scaffold, DTO/Model/BaseMapper, không sử dụng `any`, giao diện 100% tiếng Việt.
- Đã làm:
  - **Tầng Enums & Constants** (`src/common/enums/index.ts`, `src/common/constants/api-endpoints.ts`):
    - Khai báo enum `ContributorApprovalBasis` (`ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`).
    - Bổ sung `WITHDRAWN` vào `ContributorApplicationStatus`.
    - Đánh dấu `@deprecated` enum `ContributorType`.
    - Bổ sung endpoints `ADMIN_CONTRIBUTOR.INVITE` (`POST /admin/contributor-invitations`) và `ADMIN_CONTRIBUTOR.REVOKE(userId)` (`PATCH /admin/contributors/:userId/revoke`).
  - **Tầng DTO & UI Model** (`src/features/contributor/types/contributor.dto.ts`, `src/features/contributor/types/contributor.model.ts`):
    - Raw DTOs phản chiếu API backend: `claimedApprovalBasis`, `organizationClaim`, `reviewEvidence`, `invitedBy`, `invitationReason`, `InviteContributorRequestDto`, `RevokeContributorRequestDto`, `ContributorRevocationResponseDto`.
    - Clean UI Models: `ContributorApplicationModel` (với `claimedApprovalBasis`, `organizationClaim`, `reviewEvidence`, `approvalBasis`, `isReapplyBlocked`), `ContributorRevocationResult`.
    - Cập nhật `src/features/auth/types/auth.model.ts` và `src/features/auth/mappers/auth.mapper.ts` hỗ trợ trường `claimedApprovalBasis`.
  - **Tầng Schema & Mapper & Unit Tests** (`contributor.schema.ts`, `contributor.mapper.ts`, `contributor.mapper.test.ts`):
    - Zod schemas: `submitApplicationSchema` (superRefine bắt buộc `organizationClaim` khi chọn `ORGANIZATION_AFFILIATION`), `reviewApplicationSchema` (discriminatedUnion bắt buộc `approvalBasis` khi duyệt, bắt buộc `reviewNotes` >= 10 ký tự khi từ chối), `inviteContributorSchema`, `revokeContributorSchema` (lý do >= 10 ký tự).
    - `ContributorMapper` kế thừa `BaseMapper`: mapping an toàn, format ngày tháng tiếng Việt, cắt ngắn snippet 160 ký tự, `APPROVAL_BASIS_LABELS`, phương thức chuyển đổi `toRevocationResult`, `toInviteDto`, `toRevokeDto`.
    - 12/12 Vitest unit tests pass 100% (`contributor.mapper.test.ts`).
  - **Tầng API Client & TanStack Queries** (`contributor.api.ts`, `contributor.queries.ts`):
    - Centralized API methods: `submitApplication`, `getMyApplications`, `getQueue`, `reviewApplication`, `inviteContributorAdmin`, `revokeContributorAdmin`.
    - Query Key Factory `CONTRIBUTOR_KEYS` và 6 hooks: `useMyApplicationsQuery`, `useSubmitApplicationMutation`, `useContributorQueueQuery`, `useReviewApplicationMutation`, `useInviteContributorAdminMutation`, `useRevokeContributorAdminMutation` với query invalidation tự động.
  - **Tầng UI Components & Dialogs** (`src/features/contributor/components/`, `src/features/moderation/components/`):
    - `application-form.tsx`: Cập nhật form nộp đơn theo 2 căn cứ hợp lệ (`ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`), conditional input cho tổ chức/chứng nhận, cảnh báo thời gian cooldown khi bị từ chối.
    - `review-application-dialog.tsx`: Hộp thoại thẩm định đơn cho Admin, chọn căn cứ phê duyệt cuối cùng, nhập ghi chú giải trình, kiểm tra bằng chứng / liên kết, chống tự duyệt đơn của chính mình.
    - `contrib-queue-table.tsx`: Hàng đợi xét duyệt đơn có bộ lọc theo căn cứ và trạng thái, hiển thị tổ chức/bằng chứng, nút mở hộp thoại "Mời Contributor".
    - `invite-contributor-dialog.tsx`: Hộp thoại Admin mời trực tiếp người dùng làm Contributor với lý do mời rõ ràng.
    - `revoke-contributor-dialog.tsx`: Hộp thoại xác nhận thu hồi tư cách Contributor kèm cảnh báo hạ cấp về vai trò MEMBER và ô nhập lý do kiểm toán bắt buộc.
    - `mod-users-table.tsx`: Tích hợp nút "Thu hồi quyền" cho Contributor và "Mời Contributor" cho Member trong bảng quản trị người dùng.
    - `my-applications.tsx`: Hiển thị lịch sử nộp đơn của cá nhân với nhãn căn cứ tiếng Việt, thông tin tổ chức, lý do mời và mốc thời gian được nộp lại.
    - `application-fixtures.ts`: Cập nhật fixtures chuẩn theo schema mới.
- File tạo/sửa:
  - `src/common/enums/index.ts`
  - `src/common/constants/api-endpoints.ts`
  - `src/features/contributor/types/contributor.dto.ts`
  - `src/features/contributor/types/contributor.model.ts`
  - `src/features/contributor/schemas/contributor.schema.ts`
  - `src/features/auth/types/auth.model.ts`
  - `src/features/auth/mappers/auth.mapper.ts`
  - `src/features/contributor/mappers/contributor.mapper.ts`
  - `src/features/contributor/mappers/contributor.mapper.test.ts`
  - `src/features/contributor/api/contributor.api.ts`
  - `src/features/contributor/queries/contributor.queries.ts`
  - `src/features/contributor/components/application-form.tsx`
  - `src/features/contributor/components/review-application-dialog.tsx`
  - `src/features/contributor/components/contrib-queue-table.tsx`
  - `src/features/contributor/components/invite-contributor-dialog.tsx`
  - `src/features/contributor/components/revoke-contributor-dialog.tsx`
  - `src/features/moderation/components/mod-users-table.tsx`
  - `src/features/contributor/components/my-applications.tsx`
  - `src/features/contributor/__fixtures__/application-fixtures.ts`
  - `src/app/(site)/profile/page.tsx`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
  - `specs/013-unified-contributors/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type trên toàn dự án.
  - `npm test`: 319/319 tests pass (32 test files bao gồm 12/12 mapper tests mới).
  - `npm run build`: Next.js 16 build thành công 35/35 routes tĩnh & động.
- PROGRESS: Phase 14 Contributor Parity hoàn thành 100% (Row 10 trong bảng tổng đạt 95%, chờ verification live BE khi backend deploy).
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Triển khai hoàn tất Phase 13: Cooking-aware Recipe Nutrition (Đặc tả specs/012-recipe-nutrition)

- Mục tiêu: Triển khai trọn vẹn mô hình 7 tầng scaffold cho tính năng Phân tích Dinh dưỡng Công thức Nấu nướng có tính đến hao hụt nhiệt và phương pháp chế biến (Cooking-aware), phân định rạch ròi giữa số liệu tính toán khoa học chuẩn và số liệu ước lượng bổ trợ từ AI; cảnh báo nguyên liệu chưa có dữ liệu thành phần; nhận diện dữ liệu cũ (STALE) và cung cấp tính năng xem trước (Preview) trong trình soạn thảo công thức.
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `recipe-nutrition.api.ts`): Bổ sung nhánh `RECIPE_NUTRITION` gồm 5 endpoints (`PREVIEW`, `RECALCULATE`, `CURRENT`, `HISTORY`, `STATUS`).
  - **Tầng DTO & UI Model** (`recipe-nutrition.dto.ts`, `recipe-nutrition.model.ts`):
    - Đầy đủ DTOs từ OpenAPI: `RecipeNutritionEstimateDto`, `NutrientAmountDto`, `EstimateLineDto`, `UncoveredIngredientDto`, `RecipeNutritionStatusDto`, `RecipeNutritionPreviewRequestDto`, `RecipeNutritionRecalculateRequestDto`, `NutritionValueOriginDto`.
    - Clean UI Models: `RecipeNutritionEstimateModel`, `NutrientItemModel`, `MacroDistributionModel`, `UncoveredIngredientModel`, `RecipeNutritionStatusModel`, `RecipeNutritionHistoryItemModel`.
  - **Tầng Mapper & Unit Tests** (`recipe-nutrition.mapper.ts`, `recipe-nutrition.mapper.test.ts`):
    - Kế thừa `BaseMapper`, bảo vệ null-safety 100% bằng `safeNumber`, `safeString`, `safeBoolean`, `safeArray`.
    - Tính toán tỷ lệ % năng lượng calo đa lượng chất (Carb, Protein, Fat) chống chia cho 0.
    - 12/12 Vitest unit tests pass 100%.
  - **Tầng TanStack Queries** (`recipe-nutrition.queries.ts`):
    - Query Key Factory `RECIPE_NUTRITION_KEYS`.
    - 5 custom hooks: `useRecipeNutritionQuery`, `useRecipeNutritionStatusQuery`, `useRecipeNutritionHistoryQuery`, `usePreviewNutritionMutation`, `useRecalculateNutritionMutation` với tự động invalidate queries liên quan.
  - **Tầng UI Components** (`components/*`):
    - `NutritionOriginBadge`: Huy hiệu minh bạch nguồn gốc (Xanh ngọc: Tính toán khoa học, Tím: AI ước lượng, Xanh dương: Kiểm duyệt viên) kèm tooltip giải thích.
    - `MacroDistributionBar`: Biểu đồ thanh tỷ lệ phân bổ năng lượng Macro (Protein, Carb, Fat) và calo per-serving tăng tốc GPU 60fps.
    - `UncoveredIngredientsAlert`: Cảnh báo nguyên liệu chưa có dữ liệu trong cơ sở dữ liệu kèm tỷ lệ bao phủ dinh dưỡng.
    - `NutrientListTable`: Bảng chi tiết vi chất trên mỗi khẩu phần với chế độ xem thu gọn / mở rộng.
    - `RecipeNutritionCard`: Thẻ dinh dưỡng trung tâm xử lý 4 trạng thái Loading Skeleton, Empty State, Stale State (với nút tính toán lại ngay) và Success State.
    - `RecipeNutritionPreviewDrawer`: Drawer xem trước dinh dưỡng khi tạo/sửa công thức.
    - `RecipeNutritionHistoryDialog`: Hộp thoại phân trang tra cứu lịch sử các lần tính toán.
  - **Tích hợp UI (No Orphan Pages)**:
    - Nhúng `RecipeNutritionCard` vào trang chi tiết công thức `src/features/recipe/components/recipe-detail-view.tsx` (`/recipes/[id]`).
    - Nhúng nút "Xem trước tính toán chi tiết" và Drawer vào Section 4 của `src/features/recipe/components/recipe-editor-form.tsx` (dùng chung cho `/recipes/new` và `/recipes/[id]/edit`).
    - Truyền `postId={id}` từ `src/app/(site)/recipes/[id]/edit/page.tsx` vào editor form.
- File tạo/sửa:
  - `src/common/constants/api-endpoints.ts`
  - `src/features/recipe-nutrition/types/recipe-nutrition.dto.ts`
  - `src/features/recipe-nutrition/types/recipe-nutrition.model.ts`
  - `src/features/recipe-nutrition/mappers/recipe-nutrition.mapper.ts`
  - `src/features/recipe-nutrition/mappers/recipe-nutrition.mapper.test.ts`
  - `src/features/recipe-nutrition/api/recipe-nutrition.api.ts`
  - `src/features/recipe-nutrition/queries/recipe-nutrition.queries.ts`
  - `src/features/recipe-nutrition/components/nutrition-origin-badge.tsx`
  - `src/features/recipe-nutrition/components/macro-distribution-bar.tsx`
  - `src/features/recipe-nutrition/components/uncovered-ingredients-alert.tsx`
  - `src/features/recipe-nutrition/components/nutrient-list-table.tsx`
  - `src/features/recipe-nutrition/components/recipe-nutrition-card.tsx`
  - `src/features/recipe-nutrition/components/recipe-nutrition-preview-drawer.tsx`
  - `src/features/recipe-nutrition/components/recipe-nutrition-history-dialog.tsx`
  - `src/features/recipe/components/recipe-detail-view.tsx`
  - `src/features/recipe/components/recipe-editor-form.tsx`
  - `src/app/(site)/recipes/[id]/edit/page.tsx`
  - `docs/PROGRESS.md`
  - `docs/WORK-LOG.md`
  - `specs/012-recipe-nutrition/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type trên toàn dự án.
  - `npm test`: 319/319 tests pass (32 test files).
  - `npm run build`: 35/35 routes compile & optimize thành công 100%.
- PROGRESS: Phase 13 hoàn thành 100% FE Scaffold & Integration, sẵn sàng kết nối live backend khi backend hoàn tất build gate.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Tự động Gửi Duyệt Video sau khi Tạo & Đồng bộ Hàng đợi Kiểm duyệt Admin

- Mục tiêu: Khắc phục trường hợp người dùng tạo video thành công nhưng không thấy xuất hiện trong bảng điều khiển Admin (`/admin/dashboard?tab=queue`).
- Nguyên nhân:
  - Khi gọi `POST /api/v1/posts`, backend lưu video ở trạng thái `DRAFT` (Bản nháp riêng tư của tác giả).
  - Hàng đợi kiểm duyệt Admin (`/admin/dashboard?tab=queue`) theo đặc tả Phase 16 chỉ truy vấn các bản ghi có trạng thái `PENDING_REVIEW` (Chờ duyệt), `FLAGGED`, hoặc `QUARANTINED`. Bản nháp `DRAFT` không thuộc hàng đợi duyệt.
  - Form tạo video trước đó chỉ dừng lại ở bước tạo post mà chưa kích hoạt `reviewApi.submitPost()` (`POST /api/v1/posts/:id/submit`).
- Đã làm:
  - Cập nhật hàm `onSubmit` trong `src/app/(site)/videos/new/page.tsx`: Sau khi tạo video thành công qua `createVideoMutation`, hệ thống tự động gọi `reviewApi.submitPost(created.id, { revisionId, expectedVersion })` để chuyển video sang `PENDING_REVIEW` và đưa thẳng vào hàng đợi duyệt của Admin.
  - Tự động hủy cache query (`CONTENT_REVIEW_KEYS.all`) để Bảng điều khiển Admin tự cập nhật ngay lập tức.
  - Bổ sung thông báo toast rõ ràng: báo thành công khi video đã gửi duyệt, hoặc hướng dẫn gửi duyệt từ trang chi tiết nếu có lỗi mạng.
- File tạo/sửa:
  - `src/app/(site)/videos/new/page.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 307/307 tests pass.
- PROGRESS: Trải nghiệm đăng video liền mạch, tự động kết nối luồng tạo video với hàng đợi kiểm duyệt Phase 16.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Sửa lỗi Validation Error khi Tạo Video / Bài viết với Media Payload Phase 15

- Mục tiêu: Khắc phục lỗi `400 Bad Request` (`VALIDATION_ERROR: media.0.assetId is required, Unrecognized keys: "publicId", "secureUrl", "mimeType", "bytes"`) khi người dùng tạo video (nhúng link YouTube hoặc tải tệp) hoặc tạo bài viết / công thức có ảnh bìa.
- Nguyên nhân:
  - Backend Phase 15 áp dụng `mediaInputSchema` với `.strict()`. Đối với Cloudinary media, backend yêu cầu định dạng `{ provider: 'CLOUDINARY', kind: 'COVER_IMAGE' | 'VIDEO', assetId: string }`.
  - Frontend trước đó gửi định dạng legacy `{ provider: 'CLOUDINARY', kind: 'COVER_IMAGE', publicId, secureUrl, mimeType, bytes }` gây lỗi `Unrecognized keys` và thiếu `assetId`.
- Đã làm:
  - Cập nhật hàm `coverMediaInput()` trong `src/features/post/mappers/post.mapper.ts`: chỉ trả về `{ provider: 'CLOUDINARY', kind: 'COVER_IMAGE', assetId: meta.assetId }` khi có `assetId` hợp lệ, loại bỏ hoàn toàn các key dư thừa.
  - Cập nhật hàm `toCreateDto()` trong `src/features/video/mappers/video.mapper.ts`: mapping Cloudinary video chuẩn `{ provider: 'CLOUDINARY', kind: 'VIDEO', assetId: domain.videoMedia.assetId }`.
  - Cập nhật Zod schemas `videoFormSchema` (`video-form.schema.ts`) và `recipeFormSchema` (`recipe-form.schema.ts`) để hỗ trợ trường `assetId: z.string().optional()`.
  - Cập nhật form state tại `src/app/(site)/videos/new/page.tsx`, `src/features/recipe/components/recipe-editor-form.tsx`, `src/features/post/components/post-editor-form.tsx`: bảo toàn `assetId: meta.assetId` từ `ImageUploader` / `VideoUploader` (lấy từ commit reservation của Phase 15).
  - Bổ sung unit tests trong `post.mapper.test.ts` và `video.mapper.test.ts` kiểm thử 100% các case video YouTube + ảnh bìa reservation, video Cloudinary upload, và drop legacy mock data.
- File tạo/sửa:
  - `src/features/post/mappers/post.mapper.ts`
  - `src/features/video/mappers/video.mapper.ts`
  - `src/features/video/schemas/video-form.schema.ts`
  - `src/features/recipe/schemas/recipe-form.schema.ts`
  - `src/app/(site)/videos/new/page.tsx`
  - `src/features/recipe/components/recipe-editor-form.tsx`
  - `src/features/post/components/post-editor-form.tsx`
  - `src/features/post/mappers/post.mapper.test.ts`
  - `src/features/video/mappers/video.mapper.test.ts`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 307/307 tests pass (31 files).
  - `npm run build`: 35/35 routes compile & optimize thành công 100%.
- PROGRESS: Luồng tạo nội dung (Video, Bài viết, Công thức) hoàn toàn tương thích với Storage Quota & Media Asset Schema của Backend Phase 15.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Bổ sung Lối vào Điều hướng Tra cứu Dinh dưỡng (No Orphan Navigation Entry Points)

- Mục tiêu: Khắc phục triệt để tình trạng thiếu lối vào tự nhiên (No Orphan Pages / No Orphan Sections) dẫn đến trang Tra cứu Dinh dưỡng & Nguyên liệu chuẩn (`/categories#tra-cuu`), giúp người dùng dễ dàng phát hiện và truy cập từ mọi màn hình chính.
- Đã làm:
  - **Thanh Điều hướng Chính (SiteHeader)** (`src/components/layout/site-header.tsx`):
    - Bổ sung mục **"Tra cứu dinh dưỡng"** (`/categories#tra-cuu`) vào danh sách `NAV_ITEMS` trên cả màn hình Desktop và Mobile drawer menu.
    - Cập nhật hàm `isActive` hỗ trợ nhận diện hash URL (`href.split('#')[0]`) để highlight tab đang chọn mượt mà.
    - Thêm lối tắt **"Tra cứu dinh dưỡng 100g"** vào Menu hồ sơ cá nhân (User Dropdown Menu).
  - **Chân trang (SiteFooter)** (`src/components/layout/site-footer.tsx`):
    - Bổ sung các liên kết trực tiếp vào cột "Khám phá": **"Tra cứu dinh dưỡng 100g"** (`/categories#tra-cuu`), **"Kiêng kỵ thực phẩm"** (`/categories#kieng-ky`), **"Phương pháp chế biến"** (`/categories#phuong-phap-nau`).
  - **Trang chủ (HomePage)** (`src/app/(site)/page.tsx`):
    - Xây dựng phân đoạn Bento Card nổi bật **"Tra cứu Dinh dưỡng & Kiến thức Khoa học"**: 4 thẻ chức năng dẫn trực tiếp đến Dinh dưỡng 100g (`#tra-cuu`), Kiêng kỵ thực phẩm (`#kieng-ky`), Phương pháp nấu nướng (`#phuong-phap-nau`), và Nhu cầu khuyến nghị (`#nhu-cau-khuyen-nghi`).
- File tạo/sửa:
  - `src/components/layout/site-header.tsx`
  - `src/components/layout/site-footer.tsx`
  - `src/app/(site)/page.tsx`
  - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 305/305 tests pass.
  - `npm run build`: 35/35 routes pass thành công.
- PROGRESS: Hoàn thiện 100% trải nghiệm điều hướng tự nhiên không trang mồ côi.
- Còn lại / rủi ro: Không có.

## [2026-09-23] — Triển khai hoàn tất Phase 18: Phân Tích Khẩu Phần & Tương Thích Thực Đơn (Meal Portion & Compatibility Analysis)

- Mục tiêu: Triển khai toàn diện tính năng Phân tích Khẩu phần & Độ tương thích Thực đơn theo đặc tả `specs/010-meal-analysis` (Phase 18). Hỗ trợ kiểm tra cả công thức chuẩn và món cá nhân, phát hiện vượt ngưỡng an toàn vi chất hàng ngày (Natri, Sắt, Vitamin A) và khẩu phần lệch; kiểm tra tương thích nguyên liệu ở 3 phạm vi (`SAME_DISH`, `SAME_MEAL`, `SAME_DAY`) với cơ chế triệt tiêu cảnh báo trùng lặp; minh bạch cấp độ bằng chứng (Grade A–D) và tuân thủ an toàn y khoa D22 (ngôn ngữ giáo dục hỗ trợ, không chẩn đoán bệnh); cung cấp gợi ý đổi món an toàn bảo toàn 100% ràng buộc ăn kiêng/dị ứng; xử lý dữ liệu chưa hoàn thiện (không gán 0) và tự động vô hiệu hóa cache cũ (`isStale: true`) khi thực đơn thay đổi.
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `meal-analysis.api.ts`): Bổ sung endpoint `MEAL_PLANS.ANALYZE(id)` -> `POST /api/v1/meal-plans/:id/analyze`.
  - **Tầng DTO & UI Model** (`meal-analysis.dto.ts`, `meal-analysis.model.ts`):
    - DTOs phản chiếu API backend: `MealPlanAnalysisResponseDto`, `MealWarningDto`, `AffectedPlanItemDto`, `SwapSuggestionDto`, `AnalysisSummaryDto`.
    - Clean UI Models: `MealPlanAnalysis`, `MealWarning`, `AffectedPlanItem`, `SwapSuggestion`, `AnalysisSummary`, enums `MealWarningSeverity`, `MealWarningScope`, `EvidenceGrade`, `DishSourceType`.
  - **Tầng Mapper & Unit Test** (`meal-analysis.mapper.ts`, `meal-analysis.mapper.test.ts`):
    - Kế thừa `BaseMapper<MealPlanAnalysisResponseDto, MealPlanAnalysis>`, sử dụng `pickField` và `safe*`.
    - Viết 12/12 Vitest unit tests bao phủ: mapping camelCase/snake_case, nested data envelope, tính toán `isStale` so khớp `planLockVersion`, fallback summary counts, 4 Evidence Grades, scopes, null-safety.
  - **Tầng Queries & Mutations** (`meal-analysis.queries.ts`, `meal-plan.queries.ts`):
    - `MEAL_ANALYSIS_KEYS` Key Factory tập trung.
    - Hooks `useMealAnalysisQuery`, `useAnalyzeMealPlanMutation` với toast thông báo kết quả thân thiện.
    - Tích hợp Stale Invalidation: tự động hủy cache phân tích khi mutation swap hoặc delete thực đơn thành công.
  - **Tầng UI Components & Dialogs** (`src/features/meal-analysis/components/`):
    - `meal-analysis-summary-bar.tsx`: Thanh tóm tắt chỉ số cảnh báo nguy cơ/chú ý, nút "Phân tích thực đơn" / "Phân tích lại", trạng thái `isStale`.
    - `meal-analysis-card.tsx`: Thẻ chi tiết từng cảnh báo với màu sắc chuẩn mực (Đỏ `DANGER`, Vàng `WARNING`), thanh so sánh định lượng đo được vs ngưỡng an toàn tối đa (UL), danh sách món liên quan.
    - `meal-analysis-alerts.tsx`: Danh sách cảnh báo gom nhóm có Tabs lọc phạm vi (`Tất cả`, `Cùng món`, `Cùng bữa`, `Cả ngày`).
    - `evidence-grade-badge.tsx`: Huy hiệu trực quan cấp độ bằng chứng (Grade A đến D).
    - `meal-analysis-badge.tsx`: Huy hiệu cảnh báo hiển thị trên ô bữa ăn trong `DayGrid` có Tooltip giải thích nhanh.
    - `meal-analysis-detail-dialog.tsx`: Hộp thoại giải thích cơ chế khoa học, tài liệu trích dẫn, phiên bản quy tắc, độ tin cậy và khung tuyên bố miễn trừ y khoa D22.
    - `meal-analysis-swap-dialog.tsx`: Hộp thoại gợi ý đổi món thay thế an toàn, hiển thị calo, lý do phù hợp, nút đổi món và tự động phân tích lại.
    - `incomplete-data-banner.tsx`: Banner thông báo dữ liệu chưa hoàn thiện, điểm tin cậy và cam kết không gán 0 cho nguyên liệu tự do.
  - **Tích hợp Màn hình Chi tiết Thực đơn** (`/meal-plans/[id]/page.tsx`, `day-grid.tsx`):
    - Nhúng `MealAnalysisSummaryBar`, `IncompleteDataBanner`, `MealAnalysisAlerts` trên đầu trang chi tiết.
    - Truyền `slotBadge` vào `DayGrid` hiển thị `MealAnalysisBadge` trên các ô bữa ăn có món vi phạm.
    - Kết nối mở `MealAnalysisDetailDialog` và `MealAnalysisSwapDialog`.
- File tạo/sửa:
  - Tạo mới:
    - `src/features/meal-analysis/types/meal-analysis.dto.ts`
    - `src/features/meal-analysis/types/meal-analysis.model.ts`
    - `src/features/meal-analysis/mappers/meal-analysis.mapper.ts`
    - `src/features/meal-analysis/mappers/meal-analysis.mapper.test.ts`
    - `src/features/meal-analysis/api/meal-analysis.api.ts`
    - `src/features/meal-analysis/queries/meal-analysis.queries.ts`
    - `src/features/meal-analysis/components/meal-analysis-summary-bar.tsx`
    - `src/features/meal-analysis/components/meal-analysis-card.tsx`
    - `src/features/meal-analysis/components/meal-analysis-alerts.tsx`
    - `src/features/meal-analysis/components/evidence-grade-badge.tsx`
    - `src/features/meal-analysis/components/meal-analysis-badge.tsx`
    - `src/features/meal-analysis/components/meal-analysis-detail-dialog.tsx`
    - `src/features/meal-analysis/components/meal-analysis-swap-dialog.tsx`
    - `src/features/meal-analysis/components/incomplete-data-banner.tsx`
    - `src/features/meal-analysis/index.ts`
  - Sửa đổi:
    - `src/common/constants/api-endpoints.ts` (thêm ANALYZE endpoint)
    - `src/features/meal-plan/queries/meal-plan.queries.ts` (invalidation MEAL_ANALYSIS_KEYS)
    - `src/features/meal-plan/components/day-grid.tsx` (thêm slotBadge)
    - `src/app/(site)/meal-plans/[id]/page.tsx` (nhúng toàn bộ module phân tích)
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type toàn bộ dự án.
  - `npm test`: 31/31 test files pass, 305/305 tests pass (bao gồm 12/12 mapper tests mới).
  - `npm run build`: Next.js 16 build thành công 35 routes.
- PROGRESS: Phase 18: 0% → 100% (Triển khai hoàn tất 25/25 tasks theo spec 010-meal-analysis).

## [2026-09-23] — Triển khai hoàn tất Phase 19: Lộ trình Dinh dưỡng Nhiều tuần (Multi-week Meal Programs)

- Mục tiêu: Triển khai toàn diện tính năng Lộ trình Dinh dưỡng Nhiều tuần theo đặc tả `specs/011-meal-programs` (Phase 19). Đảm bảo tuân thủ nghiêm ngặt quy tắc nghiệp vụ BL-11 trong `IMPLEMENTATION_PLAN.md` và hướng dẫn backend prompt `phase-19-meal-programs.md`:
  - Ranh giới xác nhận người dùng: Lộ trình mới tạo là `DRAFT`, người dùng có thể xem trước, đổi món, sinh lại từng tuần trước khi bấm `Xác nhận tham gia` (`CONFIRMED`).
  - Bản chụp bất biến: Khi xác nhận, hệ thống lưu `WeeklyPlanSnapshot` độc lập cho từng tuần để việc chỉnh sửa hoặc xóa công thức gốc sau này không làm thay đổi lịch sử đã chốt.
  - Cơ chế vô hiệu hóa hạ lưu: Chỉnh sửa hoặc tạo lại Tuần $k$ sẽ tự động gắn cờ vô hiệu hóa (`isDownstreamInvalidated: true`) cho phân tích tích lũy và danh sách mua sắm từ Tuần $k+1$ trở đi, kèm nút "Cập nhật phân tích" để đồng bộ số liệu.
  - Kiểm soát xung đột phiên bản: Áp dụng khóa lạc quan với trường `version`, bắt lỗi HTTP 409 `VERSION_CONFLICT` và hiển thị modal hướng dẫn người dùng làm mới trang.
  - Phân tích tích lũy & Lặp món: Trực quan hóa năng lượng Kcal và vi chất trung bình hàng ngày qua `CumulativeNutritionChart`, phát hiện và cảnh báo món ăn lặp lại dày đặc qua `RepeatedPatternWarnings`.
  - Dòng thời gian trực quan: `ProgramTimelineView` phân định các tuần `COMPLETED`, `ACTIVE`, `UPCOMING` với thanh tiến độ tuân thủ (%) theo thời gian thực.
  - Không trang mồ côi: Tích hợp 4 lối vào tự nhiên tại Header Nav, User Dropdown, trang `/meal-plans` và Profile (`/profile`).
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `meal-program.api.ts`): Bổ sung nhóm `MEAL_PROGRAMS` (7 endpoints: LIST, CREATE, DETAIL, UPDATE, REGENERATE_WEEK, REANALYZE, UPDATE_PROGRESS).
  - **Tầng DTO & UI Model** (`meal-program.dto.ts`, `meal-program.model.ts`):
    - DTOs phản chiếu API backend: `MealProgramDto`, `ProgramWeekDto`, `WeeklyPlanSnapshotDto`, `CumulativeAnalysisDto`, `RepeatedPatternWarningDto`, `CreateMealProgramRequestDto`, `UpdateMealProgramRequestDto`, `RegenerateWeekRequestDto`, `UpdateWeekProgressRequestDto`.
    - UI Models sạch: `MealProgram`, `ProgramWeek`, `WeeklyPlanSnapshot`, `CumulativeAnalysis`, `RepeatedPatternWarning`, `MealItemSummary`, `ProgramDaySummary`, `MealProgramListItem`, `MealProgramListResult`.
  - **Tầng Mapper & Unit Test** (`meal-program.mapper.ts`, `meal-program.mapper.test.ts`):
    - Kế thừa `BaseMapper<MealProgramDto, MealProgram>`, sử dụng `pickField` với candidate keys array và `safe*`.
    - Viết 10/10 Vitest tests kiểm thử toàn diện: mapping null/empty, status DRAFT/CONFIRMED/COMPLETED/ARCHIVED, snapshot days & meals, cumulative analysis & repeated patterns, calculation overall compliance rate, downstream invalidation flag; 100% tests pass.
  - **Tầng Queries & Mutations** (`meal-program.queries.ts`):
    - Query Key Factory `MEAL_PROGRAM_KEYS`.
    - Hooks: `useMealProgramsQuery`, `useMealProgramDetailQuery`, `useCreateMealProgramMutation`, `useUpdateMealProgramMutation`, `useRegenerateProgramWeekMutation`, `useReanalyzeMealProgramMutation`, `useUpdateWeekProgressMutation`.
  - **Tầng UI Components**:
    - `program-card.tsx`: Card hiển thị lộ trình với ảnh bìa/gradient, badges trạng thái, ngày tháng và thanh tiến độ.
    - `program-create-form.tsx`: Form tạo mới lộ trình với Zod validation, chọn thời lượng 2/4/8 tuần, phát hiện múi giờ tự động.
    - `program-list.tsx`: Danh sách lộ trình hỗ trợ 2 tabs "Chương trình mẫu" và "Lộ trình của tôi", bộ lọc trạng thái và empty state thân thiện.
    - `program-header.tsx`: Header hiển thị thông tin lộ trình, mốc ngày, múi giờ, version, nút xác nhận lộ trình và nút lưu trữ.
    - `week-plan-view.tsx`: Lưới hiển thị 7 ngày ăn trong tuần từ bản chụp snapshot tĩnh, thanh tóm tắt macro và các bữa ăn chi tiết.
    - `program-timeline-view.tsx`: Dòng thời gian trực quan hóa các tuần COMPLETED, ACTIVE, UPCOMING với animation GPU 60 FPS.
    - `day-meal-checklist.tsx`: Checklist đánh dấu các bữa ăn đã hoàn thành và lưu tiến độ tuân thủ.
    - `cumulative-nutrition-chart.tsx`: Biểu đồ trực quan hóa năng lượng Kcal trung bình ngày, phân bổ đa lượng AMDR và tiến độ các tuần.
    - `repeated-pattern-warnings.tsx`: Danh sách cảnh báo các món ăn bị lặp lại nhiều lần trong chu kỳ.
    - `program-analysis-tab.tsx`: Tab kết hợp biểu đồ dinh dưỡng tích lũy, cảnh báo lặp món và nút kích hoạt tái phân tích.
    - `program-confirm-dialog.tsx`: Hộp thoại xác nhận lộ trình, chốt bản chụp snapshot tĩnh.
    - `regenerate-week-dialog.tsx`: Hộp thoại tạo lại thực đơn một tuần lẻ và cảnh báo vô hiệu hóa hạ lưu.
    - `downstream-invalidation-banner.tsx`: Thanh thông báo màu vàng cảnh báo dữ liệu phân tích cần cập nhật kèm nút đồng bộ số liệu.
    - `version-conflict-modal.tsx`: Modal xử lý xung đột phiên bản đồng thời (HTTP 409).
  - **Tầng Routes & No Orphan Pages**:
    - Các route: `/meal-programs` (danh mục), `/meal-programs/new` (khởi tạo), `/meal-programs/[id]` (chi tiết).
    - 4 lối vào tự nhiên: Header Navigation Bar, Header User Dropdown Menu, Trang Kế hoạch Bữa ăn (`/meal-plans`), Trang Hồ sơ cá nhân (`/profile`).
  - **Tài liệu**: Cập nhật `PROGRESS.md` và đánh dấu 32/32 tasks trong `specs/011-meal-programs/tasks.md`.
- File tạo/sửa:
  - Tạo mới:
    - `src/features/meal-program/types/meal-program.dto.ts`
    - `src/features/meal-program/types/meal-program.model.ts`
    - `src/features/meal-program/mappers/meal-program.mapper.ts`
    - `src/features/meal-program/mappers/meal-program.mapper.test.ts`
    - `src/features/meal-program/api/meal-program.api.ts`
    - `src/features/meal-program/queries/meal-program.queries.ts`
    - `src/features/meal-program/index.ts`
    - `src/features/meal-program/components/program-card.tsx`
    - `src/features/meal-program/components/program-create-form.tsx`
    - `src/features/meal-program/components/program-list.tsx`
    - `src/features/meal-program/components/program-header.tsx`
    - `src/features/meal-program/components/week-plan-view.tsx`
    - `src/features/meal-program/components/program-timeline-view.tsx`
    - `src/features/meal-program/components/day-meal-checklist.tsx`
    - `src/features/meal-program/components/cumulative-nutrition-chart.tsx`
    - `src/features/meal-program/components/repeated-pattern-warnings.tsx`
    - `src/features/meal-program/components/program-analysis-tab.tsx`
    - `src/features/meal-program/components/program-confirm-dialog.tsx`
    - `src/features/meal-program/components/regenerate-week-dialog.tsx`
    - `src/features/meal-program/components/downstream-invalidation-banner.tsx`
    - `src/features/meal-program/components/version-conflict-modal.tsx`
    - `src/app/(site)/meal-programs/page.tsx`
    - `src/app/(site)/meal-programs/new/page.tsx`
    - `src/app/(site)/meal-programs/[id]/page.tsx`
  - Chỉnh sửa:
    - `src/common/constants/api-endpoints.ts`: Thêm nhóm `MEAL_PROGRAMS`
    - `src/components/layout/site-header.tsx`: Thêm icon Target, link "Lộ trình nhiều tuần" ở Nav và User Dropdown
    - `src/app/(site)/profile/page.tsx`: Thêm nút Lộ trình dinh dưỡng ở Header Profile
    - `src/app/(site)/meal-plans/page.tsx`: Thêm nút Lộ trình nhiều tuần
    - `docs/PROGRESS.md`: Cập nhật bảng backlog và thêm dòng lịch sử Phase 19
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 31 test suites, 305 tests passed (10/10 tests mới cho MealProgramMapper).
  - `npm run build`: Build Next.js 16 thành công, sinh ra 35 routes tĩnh & động bao gồm `/meal-programs`, `/meal-programs/new`, `/meal-programs/[id]`.
- PROGRESS: Phase 19: 0% → 100% (FE Scaffold).
- Còn lại / rủi ro: Backend Phase 19 hiện đang `NOT_STARTED`. Khi Backend READY, chạy `npm run sync:swagger` và kết nối kiểm thử trực tiếp máy chủ.

## [2026-09-23] — Triển khai hoàn tất Phase 17: Món Ăn Cá Nhân Hóa (Custom Meals, Photos & User Tags)

- Mục tiêu: Triển khai toàn diện tính năng Món ăn cá nhân hóa theo đặc tả `specs/009-custom-meals` (Phase 17). Đảm bảo quyền riêng tư người dùng (owner-scoped, không catalog chung, không voting), quản lý nhiều hình ảnh tích hợp hạn mức lưu trữ Cloudinary (Phase 15 Storage Quota), hệ thống nhãn người dùng linh hoạt (`shopee`, etc. chỉ là plain metadata, không gọi external API), liên kết nguyên liệu chuẩn hóa (Phase 12 Food Data) với cơ chế cảnh báo chưa bao phủ đầy đủ (không coi nguyên liệu tự do là 0 kcal), và cơ chế chặn xóa an toàn khi món đang được sử dụng trong thực đơn tuần (409 Conflict).
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `custom-meal.api.ts`): Bổ sung nhóm `CUSTOM_MEALS` (7 endpoints gồm CRUD, upload/delete photo, set cover).
  - **Tầng DTO & UI Model** (`custom-meal.dto.ts`, `custom-meal.model.ts`):
    - Khai báo DTOs tương thích hoàn toàn với schema backend: `CustomMealResponseDto`, `CustomMealListResponseDto`, `CreateCustomMealRequestDto`, `UpdateCustomMealRequestDto`, `CustomMealIngredientDto`, `CustomMealPhotoDto`, `CustomMealNutritionSummaryDto`.
    - UI Models sạch (`CustomMeal`, `CustomMealIngredient`, `CustomMealPhoto`, `CustomMealNutritionSummary`, `CustomMealFilters`).
  - **Tầng Mapper & Unit Test** (`custom-meal.mapper.ts`, `custom-meal.mapper.test.ts`):
    - Kế thừa `BaseMapper<CustomMealResponseDto, CustomMeal>`, sử dụng `pickField` và `safe*`.
    - Viết 11/11 Vitest tests kiểm thử toàn diện: mapping null/empty, chuẩn hóa photo/tag/nguyên liệu, tính toán coverage dinh dưỡng và fallback giá trị mặc định.
  - **Tầng Queries & Mutations** (`custom-meal.queries.ts`):
    - `CUSTOM_MEALS_KEYS` Query Key Factory tập trung.
    - Hooks `useCustomMealsQuery`, `useCustomMealDetailQuery`, `useCreateCustomMealMutation`, `useUpdateCustomMealMutation`, `useDeleteCustomMealMutation`, `useUploadMealPhotoMutation`, `useDeleteMealPhotoMutation`, `useSetMealCoverPhotoMutation`.
  - **Tầng UI Components & Utilities**:
    - `tag-normalizer.ts`: Tiện ích chuẩn hóa và kiểm tra hợp lệ nhãn (lowercase, không khoảng trắng, 2-30 ký tự, max 10 tags).
    - `custom-meal-tag-input.tsx`: Giao diện nhập nhãn dạng chip tag trực quan.
    - `custom-meal-tag-filter-bar.tsx`: Thanh lọc danh sách món ăn theo nhãn.
    - `custom-meal-nutrition-bar.tsx`: Hiển thị thanh tiến độ năng lượng (Kcal), Macros (Đạm/Béo/Tinh bột) và cảnh báo minh bạch khi có nguyên liệu chưa có dữ liệu dinh dưỡng.
    - `custom-meal-ingredient-input.tsx`: Bảng nhập danh sách nguyên liệu động, tìm kiếm liên kết nguyên liệu chuẩn Phase 12 hoặc nhập tự do.
    - `custom-meal-photo-manager.tsx`: Trình quản lý thư viện ảnh món ăn (chọn ảnh bìa, sắp xếp, xóa ảnh).
    - `custom-meal-photo-uploader.tsx`: Tải ảnh lên với kiểm tra giới hạn dung lượng và kiểm tra quota bộ nhớ Phase 15.
    - `custom-meal-delete-dialog.tsx`: Dialog xác nhận xóa an toàn, cảnh báo chi tiết và ngăn chặn xóa khi món đang nằm trong thực đơn tuần.
    - `custom-meal-card.tsx`: Card hiển thị món ăn cá nhân trong danh sách với ảnh bìa, badges dinh dưỡng và tags.
    - `custom-meal-form.tsx`: Form tạo/sửa món ăn toàn diện với validation Zod.
    - `custom-meal-list.tsx`: Danh sách món ăn với tìm kiếm, lọc tags, phân trang và trạng thái trống (empty state).
  - **Tầng Routes & No Orphan Pages**:
    - Các route: `/custom-meals` (danh sách), `/custom-meals/new` (tạo món), `/custom-meals/[id]` (chi tiết), `/custom-meals/[id]/edit` (chỉnh sửa).
    - Lối vào điều hướng tự nhiên: Menu người dùng (`SiteHeader`), Trang cá nhân (`/profile`), Modal chọn món cho thực đơn (`MealPlanItemSelector` & `/meal-plans`).
  - **Tài liệu**: Cập nhật `BACKEND_INTEGRATION.md` (mục 6.12 và changelog v4.7), cập nhật `PROGRESS.md`, hoàn thành tất cả tasks trong `specs/009-custom-meals/tasks.md`.
- File tạo/sửa:
  - Tạo mới:
    - `src/features/custom-meal/types/custom-meal.dto.ts`
    - `src/features/custom-meal/types/custom-meal.model.ts`
    - `src/features/custom-meal/mappers/custom-meal.mapper.ts`
    - `src/features/custom-meal/mappers/custom-meal.mapper.test.ts`
    - `src/features/custom-meal/api/custom-meal.api.ts`
    - `src/features/custom-meal/queries/custom-meal.queries.ts`
    - `src/features/custom-meal/utils/tag-normalizer.ts`
    - `src/features/custom-meal/components/custom-meal-tag-input.tsx`
    - `src/features/custom-meal/components/custom-meal-tag-filter-bar.tsx`
    - `src/features/custom-meal/components/custom-meal-nutrition-bar.tsx`
    - `src/features/custom-meal/components/custom-meal-ingredient-input.tsx`
    - `src/features/custom-meal/components/custom-meal-photo-manager.tsx`
    - `src/features/custom-meal/components/custom-meal-photo-uploader.tsx`
    - `src/features/custom-meal/components/custom-meal-delete-dialog.tsx`
    - `src/features/custom-meal/components/custom-meal-card.tsx`
    - `src/features/custom-meal/components/custom-meal-form.tsx`
    - `src/features/custom-meal/components/custom-meal-list.tsx`
    - `src/features/custom-meal/index.ts`
    - `src/app/(site)/custom-meals/page.tsx`
    - `src/app/(site)/custom-meals/new/page.tsx`
    - `src/app/(site)/custom-meals/[id]/page.tsx`
    - `src/app/(site)/custom-meals/[id]/edit/page.tsx`
  - Sửa đổi:
    - `src/common/constants/api-endpoints.ts`
    - `src/components/layout/site-header.tsx`
    - `src/app/(site)/profile/page.tsx`
    - `src/app/(site)/meal-plans/page.tsx`
    - `src/features/meal-plan/components/meal-plan-item-selector.tsx`
    - `frontend/docs/BACKEND_INTEGRATION.md`
    - `frontend/docs/PROGRESS.md`
    - `frontend/docs/WORK-LOG.md`
    - `specs/009-custom-meals/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test -- src/features/custom-meal/mappers/custom-meal.mapper.test.ts --run`: 11/11 tests pass.
  - `npm run build`: Build thành công tất cả route, bao gồm `/custom-meals`, `/custom-meals/new`, `/custom-meals/[id]`, `/custom-meals/[id]/edit`.
- PROGRESS: Phase 17 Custom Meals: 0% → 100% (Hoàn thành đầy đủ 7 tầng kiến trúc, scaffold hoàn tất sẵn sàng kết nối live khi BE Phase 17 READY).
- Còn lại / rủi ro: Backend Phase 17 hiện ở trạng thái `NOT_STARTED`. Khi backend hoàn tất triển khai và cung cấp live endpoints, chạy `npm run sync:swagger` để kiểm tra sai lệch contract nếu có.

## [2026-09-23] — Triển khai hoàn tất Phase 12: Cơ sở Dữ liệu & Kiến thức Dinh dưỡng Thực phẩm (Food & Nutrient Knowledge Base)

- Mục tiêu: Tích hợp đầy đủ 11 endpoints của Phase 12 Food Data (5 endpoints tra cứu công cộng + 6 endpoints quản trị và nạp dữ liệu chuẩn). Áp dụng quy tắc cốt lõi "Missing is NOT zero" (không gán 0 cho vi chất thiếu số liệu), minh bạch xuất xứ dữ liệu (provenance/license/version), tự động tính tỷ lệ % DV theo nhu cầu khuyến nghị (RDA/AI) và cảnh báo ngưỡng tối đa (UL), tra cứu phương pháp nấu nướng với hệ số hao hụt (yield factor) và hệ số bảo tồn vi chất (retention factor), bảng tra cứu kiêng kỵ thực phẩm theo 3 phạm vi (SAME_DISH, SAME_MEAL, SAME_DAY), bảng quản lý bản ghi đa dạng theo kind cho Admin và quy trình nạp dữ liệu chuẩn 2 bước Xem trước (Preview) & Cam kết (Commit) có tính chất chống lặp an toàn (idempotent replay).
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `food-data.api.ts`): Bổ sung nhóm `FOOD_DATA` (5 endpoints) và `ADMIN_FOOD_DATA` (4 endpoints gồm CRUD polymorphic record và 2-step preview/commit import).
  - **Tầng DTO & UI Model** (`food-data.dto.ts`, `food-data.model.ts`):
    - Khai báo DTOs tương thích 100% với OpenAPI schema backend: `IngredientNutrientsResponseDto`, `NutrientReferenceIntakeDto`, `IngredientIntakeGuidelineDto`, `CookingMethodDto`, `IngredientInteractionRuleDto`, `AdminFoodDataRecordDto`, `PreviewFoodDataImportRequestDto`, `CommitFoodDataImportRequestDto`.
    - Định nghĩa UI Models sạch (`IngredientNutrientsModel`, `NutrientItem`, `ReferenceIntakeItem`, `IngredientGuidelineItem`, `CookingMethodItem`, `FoodInteractionRuleItem`, `AdminRecordItem`, `FoodDataImportPreviewResult`).
    - Phân tách nhóm vi chất (`macros`, `vitamins`, `minerals`, `otherNutrients`) và bảo toàn `isMissing: true` khi không có số liệu.
  - **Tầng Mapper & Unit Test** (`food-data.mapper.ts`, `food-data.mapper.test.ts`):
    - Kế thừa `BaseMapper`, chuẩn hóa nhãn tiếng Việt (`POPULATION_LABELS`, `SEVERITY_LABELS`, `SCOPE_LABELS`).
    - Viết 13/13 Vitest tests kiểm thử toàn diện: mapping null/empty, missing nutrient preservation, phân loại vi chất, tính % DV, và phân giải polymorphic admin record.
  - **Tầng Queries & Mutations** (`food-data.queries.ts`):
    - `FOOD_DATA_KEYS` Query Key Factory tập trung.
    - 5 public query hooks: `useIngredientNutrientsQuery`, `useReferenceIntakesQuery`, `useIngredientGuidelinesQuery`, `useCookingMethodsQuery`, `useInteractionRulesQuery` với staleTime 5 phút.
    - 5 admin query/mutation hooks: `useAdminRecordsQuery`, `useCreateAdminRecordMutation`, `useReplaceAdminRecordMutation`, `useArchiveAdminRecordMutation`, `useAdminImportPreviewMutation`, `useAdminImportCommitMutation` tự động invalidate cache.
  - **Tầng UI Components Tra cứu Người dùng**:
    - `source-provenance-badge.tsx`: Huy hiệu xuất xứ hiển thị tên nguồn, tổ chức, phiên bản, giấy phép và liên kết mở tài liệu gốc.
    - `nutrition-facts-panel.tsx`: Bảng thành phần dinh dưỡng 100g kiểu FDA chuẩn mực, tuân thủ luật "Missing is NOT zero", hiển thị thanh tiến độ % DV tính theo RDA/AI của nhóm nhân khẩu học được chọn và cảnh báo khi vượt ngưỡng an toàn (UL).
    - `reference-intake-explorer.tsx`: Bộ công cụ tra cứu nhu cầu khuyến nghị (RDA/AI) và ngưỡng an toàn (UL) theo từng nhóm đối tượng (người trưởng thành, nam, nữ, phụ nữ mang thai, người cao tuổi).
    - `cooking-method-cards.tsx`: Danh mục phương pháp chế biến với thẻ tỷ lệ hao hụt khối lượng và thanh phần trăm giữ lại các vi chất nhạy cảm sau nhiệt.
    - `food-interaction-table.tsx`: Bảng tra cứu kiêng kỵ thực phẩm lọc theo 3 cấp phạm vi (`Cùng món`, `Cùng bữa`, `Cùng ngày`), 3 mức độ cảnh báo (`Cảnh báo`, `Lưu ý`, `Hợp khẩu vị`), giải thích cơ chế khoa học và gợi ý sơ chế giảm thiểu tương kỵ.
  - **Tầng UI Quản trị Admin**:
    - `admin-record-dialog.tsx`: Dialog tạo/sửa bản ghi dinh dưỡng hỗ trợ `react-hook-form` + `zod` cho các phân loại chính (`NUTRIENT`, `SOURCE`, `COOKING_METHOD`, `INTERACTION_RULE`) và chế độ chỉnh sửa JSON nâng cao.
    - `admin-import-manager.tsx`: Bộ điều khiển nạp dữ liệu chuẩn 2 bước: Xem trước (Preview) kiểm tra hợp lệ, hiển thị báo cáo tóm tắt số liệu và lỗi; Cam kết (Commit) lưu vào CSDL với cơ chế xử lý idempotent replay an toàn.
    - `admin-records-manager.tsx`: Giao diện quản trị bản ghi phân loại theo `kind`, phân trang, tìm kiếm, sửa đổi và lưu trữ mềm.
  - **Tích hợp No Orphan Pages**:
    - Tích hợp nút xem Dinh dưỡng 100g vào `IngredientSearch` tại `/categories#tra-cuu`.
    - Tích hợp nút xem Dinh dưỡng 100g vào `RecipeDetailView` tại `/recipes/[id]`.
    - Nhúng `FoodInteractionTable`, `CookingMethodCards` và `ReferenceIntakeExplorer` vào trang `/categories`.
    - Thêm tab `Dữ liệu dinh dưỡng` (`food-data`) vào thanh điều hướng bên `admin/layout.tsx` và trang `admin/dashboard/page.tsx`.
  - **Tài liệu**: Cập nhật `BACKEND_INTEGRATION.md` (chuyển 11 endpoints sang `FE integrated = Yes`, thêm changelog v4.6), cập nhật `PROGRESS.md` (Phase 12: 100%), hoàn thành toàn bộ tasks trong `specs/008-food-data/tasks.md`.
- File tạo/sửa:
  - Tạo mới:
    - `src/features/food-data/types/food-data.dto.ts`
    - `src/features/food-data/types/food-data.model.ts`
    - `src/features/food-data/mappers/food-data.mapper.ts`
    - `src/features/food-data/mappers/food-data.mapper.test.ts`
    - `src/features/food-data/api/food-data.api.ts`
    - `src/features/food-data/queries/food-data.queries.ts`
    - `src/features/food-data/components/source-provenance-badge.tsx`
    - `src/features/food-data/components/nutrition-facts-panel.tsx`
    - `src/features/food-data/components/reference-intake-explorer.tsx`
    - `src/features/food-data/components/cooking-method-cards.tsx`
    - `src/features/food-data/components/food-interaction-table.tsx`
    - `src/features/food-data/components/admin-record-dialog.tsx`
    - `src/features/food-data/components/admin-import-manager.tsx`
    - `src/features/food-data/components/admin-records-manager.tsx`
  - Sửa đổi:
    - `src/common/constants/api-endpoints.ts`
    - `src/features/ingredient/components/ingredient-search.tsx`
    - `src/features/recipe/components/recipe-detail-view.tsx`
    - `src/app/(site)/categories/page.tsx`
    - `src/app/(admin)/admin/layout.tsx`
    - `src/app/(admin)/admin/dashboard/page.tsx`
    - `docs/BACKEND_INTEGRATION.md`
    - `docs/PROGRESS.md`
    - `specs/008-food-data/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 272/272 tests pass (13/13 food-data mapper unit tests pass).
  - `npm run build`: Build Next.js thành công 100%, 31 routes pass.
- PROGRESS: Phase 12 (Food Data Knowledge Base) 0% → 100%.
- Còn lại / rủi ro: Không có. Toàn bộ 11 endpoints đã READY trên Backend và tích hợp hoàn chỉnh.

## [2026-09-23] — Triển khai hoàn tất Phase 16: Hợp nhất Vòng đời Đăng tải & Kiểm duyệt Video (Video Review Parity & Content Submission Lifecycle)

- Mục tiêu: Hợp nhất vòng đời kiểm duyệt nội dung cho cả 3 định dạng: Công thức món chay (`RECIPE`), Bài viết (`BLOG`), và Video nấu ăn (`VIDEO`). Xóa bỏ cơ chế tự động xuất bản (bài mới tạo và chỉnh sửa đều bắt đầu từ `DRAFT`). Tích hợp luồng tác giả nộp duyệt chủ động (`POST /api/v1/posts/:id/submit`), xem lịch sử kiểm duyệt (`GET /api/v1/posts/:id/review-history`). Nâng cấp phân hệ hàng đợi kiểm duyệt Admin (`GET /api/v1/admin/content-review`), kiểm tra chi tiết bản sửa đổi bất biến kèm video preview player (`GET /api/v1/admin/content-review/:id`), quyết định duyệt/từ chối bắt buộc lý do giải trình (>= 10 ký tự khi từ chối) và chống tự duyệt (`PATCH /api/v1/admin/content-review/:id`). Triển khai hỗ trợ Dual-revision (giữ bài đã xuất bản công khai khi đang sửa bản thảo mới) và nộp lại sau khi bị từ chối.
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `review.api.ts`): Bổ sung `CONTENT_REVIEW` (`/posts/:id/submit`, `/posts/:id/review-history`) và `ADMIN_CONTENT_REVIEW` (`/admin/content-review`, `/admin/content-review/:id`), đánh dấu `@deprecated` các endpoint cũ `/review-queue/posts*`.
  - **Tầng DTO & UI Model** (`content-review.dto.ts`, `content-review.model.ts`): Khai báo đầy đủ raw DTOs và UI Models sạch (`AdminContentReviewListItemModel`, `AdminContentReviewDetailModel`, `ContentReviewHistoryModel`, `PostSubmitResultModel`), hỗ trợ cờ AI cảnh báo (`hasAiFlags`), phân loại video/recipe/article, thông tin dual-revision (`revisionId`, `revisionVersion`, `publishedRevisionVersion`).
  - **Tầng Schema & Mapper** (`review-decision.schema.ts`, `content-review.mapper.ts`):
    - Khai báo Zod schema `adminContentReviewDecisionSchema` bắt buộc `reason` (10–1000 ký tự) khi từ chối (`REJECTED`) và tùy chọn khi duyệt (`APPROVED`).
    - Xây dựng mapper an toàn kế thừa `BaseMapper` với bộ unit test 11/11 tests pass 100%.
  - **Tầng TanStack Query Key Factory & Hooks** (`review.queries.ts`):
    - Cung cấp `CONTENT_REVIEW_KEYS` factory tập trung.
    - Cung cấp 5 custom hooks: `useSubmitPostMutation`, `usePostReviewHistoryQuery`, `useAdminContentReviewQueueQuery`, `useAdminContentReviewDetailQuery`, `useAdminContentReviewDecisionMutation` tự động invalidate cache liên quan.
  - **Tầng UI Tác giả (Author Lifecycle & Dual-revision)**:
    - `review-status-banner.tsx`: Banner trạng thái nội dung đa năng gắn trên các trang chi tiết và chỉnh sửa (`DRAFT`, `PENDING_REVIEW`, `REJECTED`, `PUBLISHED`). Hỗ trợ hiển thị cảnh báo Dual-revision khi đang chỉnh sửa bài viết đã xuất bản, nút gửi duyệt / nộp lại, nút xem lịch sử kiểm duyệt.
    - `submit-review-dialog.tsx`: Dialog xác nhận nộp kiểm duyệt có ô ghi chú tùy chọn cho kiểm duyệt viên, xử lý chuẩn xác các mã lỗi nghiệp vụ từ backend (`CONTENT_NOT_SUBMITTABLE`, `CONTENT_ALREADY_SUBMITTED`, `VERSION_CONFLICT`).
    - `review-history-dialog.tsx` & `review-history-timeline.tsx`: Modal và timeline hiển thị lịch sử kiểm duyệt trực quan theo thời gian thực (trạng thái, người duyệt, thời gian, lý do giải trình).
    - Tích hợp vào màn hình Bài viết (`/articles/[id]/edit`), Công thức (`/recipes/[id]/edit` và `/recipes/[id]`), Video (`/videos/[id]`). Cập nhật `post.model.ts`, `recipe.model.ts`, `video.model.ts` và các mapper tương ứng để trích xuất `revisionId`, `revisionVersion`, `publishedRevisionVersion`.
    - Cập nhật `post-card.tsx` hiển thị badge trạng thái cho bài chưa xuất bản (`DRAFT`, `PENDING_REVIEW`, `REJECTED`).
    - Nâng cấp `/profile`: Thêm tab/bộ lọc `Bị từ chối` (`REJECTED`), hiển thị badge trạng thái chuẩn màu, bổ sung nút Sửa trực tiếp cho công thức và bài viết.
  - **Tầng Quản trị Admin (Moderation Parity & Inspection)**:
    - `review-queue-table.tsx`: Nâng cấp bảng hàng đợi kiểm duyệt với bộ lọc loại nội dung (`Tất cả`, `Bài viết`, `Công thức`, `Video`), badge độ ưu tiên (`URGENT`, `HIGH`, `NORMAL`, `LOW`), cờ cảnh báo AI (`hasAiFlags`), nút mở chi tiết thẩm định.
    - `review-detail-modal.tsx`: Modal thẩm định chi tiết bản sửa đổi bất biến (snapshot nội dung tại thời điểm nộp duyệt), hiển thị tiêu đề, tóm tắt, tag, nguyên liệu & bước làm của công thức, và cảnh báo AI nếu có vi phạm.
    - `video-preview-player.tsx`: Trình phát video chuyên dụng trong modal duyệt, tự động nhận diện và phát video từ Cloudinary MP4/WebM hoặc YouTube iframe nhúng, kèm badge dung lượng/thời lượng.
    - `review-decision-dialog.tsx`: Nâng cấp dialog phê duyệt/từ chối: ép buộc nhập lý do giải trình tối thiểu 10 ký tự khi từ chối, kiểm tra và chặn tự duyệt bài của chính mình (`SELF_REVIEW_PROHIBITED`), hiển thị toast lỗi chi tiết (`CONFLICT_RESOLVED`, `REVISION_NOT_PENDING`).
    - Cập nhật `/admin/dashboard`: Đổi KPI hàng đợi sang sử dụng hook `useAdminContentReviewQueueQuery`.
  - **Tài liệu & Hồ sơ**: Cập nhật `BACKEND_INTEGRATION.md` (đánh dấu `FE integrated = Yes` cho 4 endpoints Phase 16, thêm changelog v4.5), cập nhật `PROGRESS.md`, `specs/007-video-review-parity/tasks.md` (31/31 tasks hoàn thành).
- File tạo/sửa:
  - Tạo mới:
    - `src/features/review/types/content-review.dto.ts`
    - `src/features/review/types/content-review.model.ts`
    - `src/features/review/mappers/content-review.mapper.ts`
    - `src/features/review/mappers/content-review.mapper.test.ts`
    - `src/features/review/components/review-status-banner.tsx`
    - `src/features/review/components/submit-review-dialog.tsx`
    - `src/features/review/components/review-history-timeline.tsx`
    - `src/features/review/components/review-history-dialog.tsx`
    - `src/features/review/components/review-detail-modal.tsx`
    - `src/features/review/components/video-preview-player.tsx`
    - `src/app/(site)/recipes/[id]/edit/page.tsx`
  - Sửa đổi:
    - `src/common/constants/api-endpoints.ts`
    - `src/features/review/schemas/review-decision.schema.ts`
    - `src/features/review/api/review.api.ts`
    - `src/features/review/queries/review.queries.ts`
    - `src/features/review/components/review-queue-table.tsx`
    - `src/features/review/components/review-decision-dialog.tsx`
    - `src/features/post/types/post.model.ts`
    - `src/features/post/mappers/post.mapper.ts`
    - `src/features/post/components/post-card.tsx`
    - `src/features/recipe/types/recipe.model.ts`
    - `src/features/recipe/mappers/recipe.mapper.ts`
    - `src/features/recipe/components/recipe-detail-view.tsx`
    - `src/features/video/types/video.model.ts`
    - `src/features/video/mappers/video.mapper.ts`
    - `src/features/video/components/video-detail-view.tsx`
    - `src/app/(site)/articles/[id]/edit/page.tsx`
    - `src/app/(site)/profile/page.tsx`
    - `src/app/(admin)/admin/dashboard/page.tsx`
    - `docs/BACKEND_INTEGRATION.md`
    - `docs/PROGRESS.md`
    - `docs/WORK-LOG.md`
    - `specs/007-video-review-parity/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 27/27 test files passed, 259/259 unit tests passed (trong đó có 11/11 mapper tests mới của content-review).
  - `npm run build`: Next.js 16 build thành công toàn bộ 31 routes (bao gồm các route edit mới).
- PROGRESS: Phase 16 Video Review Parity & Content Submission Lifecycle: 0% → 100%.
- Còn lại / rủi ro: Không có. Tất cả các endpoint Phase 16 đã READY và tích hợp trọn vẹn theo chuẩn kiến trúc dự án.

## [2026-09-27] — Phase 27 Contributor registration contract audit

- Mục tiêu: Resolve the Phase 14 registration contract mismatch found during the backend release audit.
- Đã làm: Synced all 168 OpenAPI operations; changed registration from removed Contributor subtypes to `claimedApprovalBasis`, conditional organization claim, and bounded evidence links; removed old subtype model/enum/UI references; refreshed endpoint statuses and documented the production-only fake-provider gap.
- File tạo/sửa: `src/features/auth/{schemas,types,mappers,components}`, `src/features/profile/components/profile-view.tsx`, `src/features/review/types/content-review.dto.ts`, `src/common/enums/index.ts`, `docs/API-CATALOG.md`, `docs/api/*`, `docs/BACKEND_INTEGRATION.md`, `docs/PROGRESS.md`, `docs/WORK-LOG.md`.
- Verify: `npx tsc --noEmit` passed after Next type generation; `npm test` passed 33 files / 326 tests; `npm run build` passed 35 routes. HTTP registration with Contributor intent returned 201, retained Member role, and denied Admin access with 403.
- PROGRESS: Auth stays 95% because its manual/OAuth work remains; Phase 13 backend status becomes READY; Phase 27 is IN_PROGRESS.
- Còn lại: Production image inference and receipt OCR are absent; the Phase 27 release gate remains open.

---

## [2026-09-23] — Triển khai hoàn tất Phase 15: Hạn mức lưu trữ & Kiểm toán tải lên (Storage Quota & Upload Accounting)

- Mục tiêu: Khắc phục triệt để breaking change khi backend loại bỏ `POST /api/v1/uploads/signature` và áp dụng hạn ngạch lưu trữ 1 GiB/user. Triển khai trọn vẹn luồng upload reservation 3 bước với rollback tự động, migrate toàn bộ các uploader cũ, hiển thị thanh hạn mức lưu trữ trực quan cho người dùng, và xây dựng phân hệ quản trị lưu trữ hoàn chỉnh cho Admin (`/admin/storage`).
- Đã làm:
  - **Tầng Constants & API Client** (`api-endpoints.ts`, `storage.api.ts`): Bổ sung đầy đủ 10 endpoint theo Phase 15 contract (`GET /storage/me`, `POST /uploads/reservations`, `POST /uploads/reservations/:id/commit`, `DELETE /uploads/reservations/:id`, `DELETE /storage/assets/:id`, và 5 endpoint `/admin/storage/*`).
  - **Tầng DTO & UI Model** (`storage.dto.ts`, `storage.model.ts`): Khai báo tường minh tất cả raw DTOs và UI Models sạch, không leak DTO ra UI layer, `MediaKind` chuẩn `'COVER_IMAGE' | 'VIDEO'`.
  - **Tầng Format Utils & Mapper** (`format-bytes.ts`, `storage.mapper.ts`): Viết hàm chuyển đổi dung lượng (`formatBytes`, `calculateUsedPercent`, `formatDeltaBytes`), xây dựng mapper an toàn kế thừa `BaseMapper` với bộ unit test toàn diện 12/12 case pass 100%.
  - **Tầng TanStack Query Key Factory & Hooks** (`storage.queries.ts`): Cung cấp query keys tập trung và đầy đủ 7 custom hooks cho cả Member và Admin (`useStorageUsageQuery`, `useDeleteMediaAssetMutation`, `useUploadWithReservationMutation`, `useAdminStorageAccountsQuery`, `useAdminStoragePoliciesQuery`, `useUpdateStoragePolicyMutation`, `useCreateStorageAdjustmentMutation`, `useAdminStorageAdjustmentsQuery`).
  - **Tầng Helper Upload 3 Bước & Rollback** (`storage-upload.ts`): Triển khai `uploadWithReservation` tự động: Bước 1 (Tạo reservation) → Bước 2 (Upload trực tiếp lên Cloudinary) → Bước 3 (Commit reservation). Nếu có lỗi hoặc người dùng ấn Hủy (`AbortSignal`), tự động gọi `releaseReservation` giải phóng dung lượng.
  - **Migrate 3 Uploader hiện hữu**:
    - `image-uploader.tsx`: Đổi sang dùng `uploadWithReservation`, hiển thị widget hạn mức compact.
    - `video-uploader.tsx`: Đổi sang dùng `uploadWithReservation`, hỗ trợ hủy upload giữa chừng với `AbortController`, hiển thị widget hạn mức compact.
    - `avatar-uploader.tsx`: Đổi sang dùng `uploadWithReservation`.
    - Đánh dấu `@deprecated` các hàm lấy signature cũ tại `src/features/post/api/upload.api.ts` và `src/features/profile/api/avatar-upload.api.ts`.
  - **Tầng UI Member**:
    - `storage-quota-widget.tsx`: Component hiển thị dung lượng 3 mức cảnh báo (Xanh ngọc <80%, Cam ≥80%, Đỏ 100%/vượt hạn ngạch), hỗ trợ 2 biến thể `compact` và `full`.
    - `profile-storage-tab.tsx`: Tab quản lý dung lượng trong trang Hồ sơ cá nhân (`/profile?tab=storage`).
    - `storage-delete-asset-dialog.tsx`: Dialog xác nhận xóa media asset vĩnh viễn, giải phóng dung lượng, xử lý lỗi `MEDIA_ASSET_IN_USE`.
  - **Tầng Quản trị Admin (`/admin/storage`)**:
    - `storage-account-list.tsx`: Bảng danh sách tài khoản, dung lượng đã dùng/hạn mức, trạng thái `overQuota`, tìm kiếm và lọc phân trang.
    - `storage-adjustment-dialog.tsx`: Modal điều chỉnh hạn mức (+/-) kèm lý do giải trình bắt buộc (10–1000 ký tự) và `idempotencyKey` UUIDv4.
    - `storage-adjustment-list.tsx`: Bảng lịch sử kiểm toán điều chỉnh dung lượng.
    - `storage-policy-form.tsx`: Form xem và cập nhật chính sách hệ thống (`quotaBytes`, `reservationTtlSeconds`, `warningPercent`) kèm Optimistic Concurrency Control (`expectedVersion`).
    - `src/app/(admin)/admin/storage/page.tsx`: Layout phân tab bảo vệ bởi `AuthGuard` role `ADMIN`.
    - `src/app/(admin)/admin/layout.tsx`: Thêm mục "Lưu trữ & Quota" vào Sidebar Admin, đảm bảo không có trang mồ côi.
  - **Tài liệu & Hồ sơ**: Cập nhật `BACKEND_INTEGRATION.md` (đánh dấu `FE integrated = Yes` cho 10 endpoints, thêm changelog v4.5), cập nhật `PROGRESS.md` và `tasks.md`.
- File tạo/sửa:
  - Tạo mới:
    - `src/features/storage/types/storage.dto.ts`
    - `src/features/storage/types/storage.model.ts`
    - `src/features/storage/utils/format-bytes.ts`
    - `src/features/storage/mappers/storage.mapper.ts`
    - `src/features/storage/mappers/storage.mapper.test.ts`
    - `src/features/storage/api/storage.api.ts`
    - `src/features/storage/api/storage-upload.ts`
    - `src/features/storage/queries/storage.queries.ts`
    - `src/features/storage/components/storage-quota-widget.tsx`
    - `src/features/storage/components/storage-delete-asset-dialog.tsx`
    - `src/features/storage/components/storage-account-list.tsx`
    - `src/features/storage/components/storage-adjustment-dialog.tsx`
    - `src/features/storage/components/storage-adjustment-list.tsx`
    - `src/features/storage/components/storage-policy-form.tsx`
    - `src/features/profile/components/profile-storage-tab.tsx`
    - `src/app/(admin)/admin/storage/page.tsx`
  - Sửa đổi:
    - `src/common/constants/api-endpoints.ts`
    - `src/features/post/components/image-uploader.tsx`
    - `src/features/video/components/video-uploader.tsx`
    - `src/features/profile/components/avatar-uploader.tsx`
    - `src/features/post/api/upload.api.ts`
    - `src/features/profile/api/avatar-upload.api.ts`
    - `src/app/(site)/profile/page.tsx`
    - `src/app/(admin)/admin/layout.tsx`
    - `docs/BACKEND_INTEGRATION.md`
    - `docs/PROGRESS.md`
    - `docs/WORK-LOG.md`
    - `specs/006-storage-quota/tasks.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 26/26 test suites passed, 248/248 unit tests passed (trong đó có 12/12 mapper tests mới).
  - `npm run build`: Next.js 16 build thành công toàn bộ 31 routes (bao gồm `/admin/storage`).
- PROGRESS: Phase 15 Storage Quota & Upload Accounting: 0% → 100%.
- Còn lại / rủi ro: Không có. Khi backend triển khai Phase 16 (Video Review Parity), tiếp tục migrate workflow submit bài viết video.

---

## [2026-09-17] — Thiết kế mới cho thẻ Dinh dưỡng 385 kcal / 18g Protein & Khắc phục Autoplay Remotion Player

- Mục tiêu: Nâng cấp thiết kế cho thẻ dinh dưỡng thực vật ("385 kcal", "18g Protein thực vật") tại Hoạt cảnh ẩm thực Hero (`HeroFoodAnimation`) với đường sáng neon chuyển động liên tục quanh viền; đồng thời khắc phục triệt để hiện tượng chiếc tô và 5 nguyên liệu bị khựng/không xoay do chính sách Browser Autoplay Policy & Strict Mode delayRender.
- Đã làm:
  - Tầng CSS Keyframes & GPU Compositor (`globals.css`): Khai báo animation `@keyframes border-beam-spin` và class `.animate-border-beam` (3.5s linear infinite, xoay qua `transform: translate(-50%, -50%) rotate(360deg)` mượt mà 60 FPS, tuân thủ `fixing-motion-performance`, hỗ trợ `@media (prefers-reduced-motion)`).
  - Tầng UI (`HeroFoodAnimation`):
    - Tái cấu trúc khung viền đồng tâm (concentric 2px border) với cấu trúc `overflow-hidden` và conic gradient đa sắc (emerald tail, mint body, gold accent, white core spark).
    - Thêm quầng sáng ambient neon mềm mại phía sau thẻ (`-inset-1 bg-emerald-500 blur-md`).
    - Nâng cấp typography và icon badges: Icon Lửa (Flame) đặt trong badge tròn hổ phách (`bg-amber-500/15 text-amber-500`), Icon Lá cây (Leaf) đặt trong badge ngọc bích (`bg-emerald-500/15 text-emerald-500`).
    - Tách biệt component `NutritionBadge` độc lập quản lý state `pulseActive` để ngăn ngừa việc re-render lại component cha `HeroFoodAnimation` và `HeroFoodPlayer`.
  - Khắc phục lỗi Animation chiếc tô và nguyên liệu bị dừng (`HeroFoodPlayer` & `HeroFoodComposition`):
    - Loại bỏ `delayRender()` bên trong `hero-food-composition.tsx` (nguyên nhân gây rò rỉ render handle và đóng băng timeline khi chạy trên React Strict Mode).
    - Bổ sung các thuộc tính thiết yếu vào Remotion `<Player />`: `initiallyMuted`, `numberOfSharedAudioTags={0}`, `moveToBeginningWhenEnded` để đáp ứng hoàn toàn chính sách Autoplay Policy của trình duyệt hiện đại (Chrome/Edge), kích hoạt phát tự động ngay khi tải trang mà không cần tương tác chuột.
- File tạo/sửa:
  - Sửa đổi: `src/app/globals.css`, `src/components/home/hero-food-animation/hero-food-animation.tsx`, `src/components/home/hero-food-animation/hero-food-player.tsx`, `src/components/home/hero-food-animation/hero-food-composition.tsx`, `docs/WORK-LOG.md`.
- Verify: `npx tsc --noEmit` (0 lỗi), `npm test` (25/25 test files passed, 236/236 tests passed), kiểm tra trực quan trên trình duyệt (xác nhận chu kỳ 8s của chiếc tô xoay 360°, nguyên liệu xoáy tụ thành món và bung tỏa ra lặp lại liên tục tự động).
- PROGRESS: Hoàn thiện tính năng Hero Animation và thẻ dinh dưỡng cao cấp.
- Còn lại / rủi ro: Không có.

---

## [2026-09-17] — Tích hợp Live API Trust & Safety Leftovers: Báo cáo vi phạm & Xóa lịch sử hành vi (spec 013)

- Mục tiêu: Kết nối trực tiếp API Backend `:4000` cho tính năng Báo cáo vi phạm (`POST /api/v1/reports`) và Xóa toàn bộ lịch sử hành vi cá nhân hóa (`DELETE /api/v1/users/me/behavior-history`), tắt hoàn toàn fixture mock.
- Đã làm:
  - Tầng API Client: Chuyển `USE_FIXTURES = false` trong `src/features/safety/api/safety.api.ts`, gọi live endpoint qua axios client.
  - Tầng Validation & Schema: Bổ sung validation refine cho trường `details` tối thiểu 10 ký tự nếu người dùng nhập trong `safety.schema.ts`, đồng bộ với ràng buộc Backend.
  - Tầng UI: Cập nhật `ReportDialog` hiển thị rõ điều kiện chi tiết tối thiểu 10 ký tự; mở comment hiển thị nút `<DeleteHistoryButton />` tại tab Quyền riêng tư (`/profile?tab=privacy`). Sửa lỗi type compatibility `submitRestaurantSchema` cho form thêm quán ăn.
  - Docs sync: Cập nhật `docs/BACKEND_INTEGRATION.md` (đổi 2 endpoint sang READY + FE integrated: Yes) và `docs/PROGRESS.md`.
- File tạo/sửa:
  - Sửa đổi: `src/features/safety/api/safety.api.ts`, `src/features/safety/schemas/safety.schema.ts`, `src/components/shared/report-dialog.tsx`, `src/app/(site)/profile/page.tsx`, `src/features/restaurant/schemas/restaurant.schema.ts`, `docs/BACKEND_INTEGRATION.md`, `docs/PROGRESS.md`, `docs/WORK-LOG.md`.
- Verify: `npx tsc --noEmit` (0 lỗi), `npm test` (24/24 test files passed, 224/224 unit tests passed), `npm run build` (Next.js 16 build thành công toàn bộ 30 routes).
- PROGRESS: Task #13 (Trust & Safety Leftovers) 70% → 95%.
- Còn lại / rủi ro: Không có.

---

## [2026-09-17] — Khắc phục ẩn bài khi đăng nhập: Hiển thị bộ lọc an toàn ăn kiêng + Gợi ý nguyên liệu chuẩn hóa

- Mục tiêu: Khắc phục hiện tượng người dùng đăng nhập không thấy công thức vừa tạo hoặc món cũ (do Backend tự động kích hoạt Dietary Safety Engine lọc bỏ các món có nguyên liệu tự do `UNKNOWN` hoặc xung đột với Chế độ ăn/Dị ứng cá nhân), đồng thời cung cấp công cụ chuẩn hóa nguyên liệu ngay khi tạo món.
- Đã làm:
  - Tầng DTO/Model/Mapper: Mở rộng `RecipeListResponseDto.meta` và `RecipePaginationMetadata` ánh xạ `appliedConstraints` (gồm `authenticated`, `dietPattern`, `allergyCount`, `ingredientExclusionCount`, `traditions`). Thêm unit test kiểm tra ánh xạ và truyền `ingredientId`.
  - Tầng UI Tạo món (`/recipes/new`): Tạo component `RecipeIngredientRow` tích hợp tìm kiếm và gợi ý nguyên liệu chuẩn (`/api/v1/ingredients`) với debounce, tự động gắn `ingredientId` và hiển thị huy hiệu `✓ Chuẩn hóa` (xanh) hoặc `Tự do` (amber), kèm mẹo an toàn ăn chay.
  - Tầng UI Khám phá (`/recipes`): Bổ sung Banner thông báo Bộ lọc an toàn theo tài khoản khi `appliedConstraints.authenticated = true`, hiển thị chi tiết chế độ ăn (`Thuần chay`, `Có trứng sữa`...), số lượng chất dị ứng và nguyên liệu kiêng kỵ được bảo vệ. Cập nhật `EmptyState` giải thích rõ lý do món bị ẩn và cung cấp lối tắt tới Cài đặt hồ sơ.
- File tạo/sửa:
  - Tạo mới: `src/features/recipe/components/recipe-ingredient-row.tsx`
  - Sửa đổi: `src/features/recipe/types/recipe.dto.ts`, `src/features/recipe/types/recipe.model.ts`, `src/features/recipe/mappers/recipe.mapper.ts`, `src/features/recipe/mappers/recipe.mapper.test.ts`, `src/features/recipe/api/recipe.api.ts`, `src/features/recipe/components/recipe-editor-form.tsx`, `src/app/(site)/recipes/page.tsx`, `docs/WORK-LOG.md`
- Verify: `npx tsc --noEmit` (0 lỗi), `npm test` (17/17 test files passed, 139/139 unit tests passed), `npm run build` (Next.js 16 build thành công toàn bộ 29 routes).
- PROGRESS: Module Công thức & Bộ lọc cá nhân hóa đạt 100% về độ minh bạch UX và tương thích dữ liệu chuẩn với Backend.
- Còn lại / rủi ro: Không có.


## [2026-09-15] — Khởi tạo PROGRESS + WORK-LOG + rule ARCHITECTURE

- Mục tiêu: có 2 file theo dõi + rule bắt agent cập nhật sau mỗi task.
- Đã làm:
  - Tạo `docs/PROGRESS.md` (bảng % theo 7 bước scaffold + lịch sử cập nhật).
  - Tạo `docs/WORK-LOG.md` (file này + mẫu entry).
  - Thêm `ARCHITECTURE.md` mục 7 bắt cập nhật cả 2 file sau mỗi task.
- File tạo/sửa:
  - Tạo `frontend/docs/PROGRESS.md`
  - Tạo `frontend/docs/WORK-LOG.md`
  - Sửa `frontend/docs/ARCHITECTURE.md` (thêm mục 7)
- Verify: đọc lại 3 file sau sửa (chưa chạy `tsc`/`test` vì chỉ sửa docs).
- PROGRESS: task 11 (Docs) → 100%.
- Còn lại / rủi ro: % các task 0-10 là ước lượng từ UI mock, agent phải rà soát + hiệu chỉnh ở task code kế tiếp.

---

## [2026-09-15] — Tích hợp Auth API thật (spec 001-user-auth, T001–T038)

- Mục tiêu: thay UI auth mock bằng consumer API thật cho 5 endpoint đã `READY` (register/login/refresh/logout + `GET /users/me`), đúng kiến trúc DTO→Model→Mapper→API→Query.
- Đã làm:
  - Xác nhận 5 endpoint `READY` (catalog đã commit nguyên vẹn; BE local không chạy nên `sync:swagger` không regenerate được — ghi nhận, không chặn).
  - Sửa `api-endpoints.ts` (`AUTH.REFRESH=/auth/refresh`, bỏ `AUTH.ME`, thêm `USERS.ME`); enum canonical `MEMBER/CONTRIBUTOR/ADMIN`, `ACTIVE/LOCKED/BANNED/DELETED`, contributor, logout scope.
  - Nâng `types/api.ts` (envelope lồng `error.code`) + `api-error.ts` (`getApiErrorCode/getApiErrorFields`) + `axios.ts` (đọc envelope mới, bỏ `as any`, toast riêng `REFRESH_TOKEN_REUSED`).
  - Viết lại DTO/Model/Mapper auth theo contract thật (bỏ `refreshToken` khỏi body model, tách `toSessionModel`/`toProfileModel`/`toRefreshedTokenModel`/`toLogoutResultModel`/`toRegisterDto`) + mapper test 12 case.
  - Schema `displayName` + contributor conditional; `RegisterForm`/`LoginForm` xử lý theo `error.code` (lock/ban dùng thông báo chung, không CAPTCHA); `ContributorRequestFields` (shadcn select/checkbox/textarea).
  - Nối tab đăng ký/đăng nhập thật, redirect `from` chống open redirect; sửa header logout gọi API + về `/`; route handler refresh (`/auth/refresh` trước) và logout (`allDevices`, xóa 4 cookie).
  - OAuth Google/Apple giữ placeholder + ghi chú P3, không đánh dấu hoàn thành.
- File tạo/sửa:
  - Tạo: `src/features/auth/components/{register-form,login-form,contributor-request-fields}.tsx`, `src/features/auth/mappers/auth.mapper.test.ts`, `frontend/.prettierignore`, `frontend/specs/001-user-auth/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `types/api.ts`, `lib/{axios,api-error}.ts`, `features/auth/{types, mappers, api, queries, schemas, hooks}`, `app/(auth)/login/page.tsx`, `app/api/auth/{refresh-token,logout}/route.ts`, `components/{layout/site-header,providers/auth-provider*}`, `components/shared/auth-guard*`, `docs/{BACKEND_INTEGRATION,PROGRESS,WORK-LOG}.md` (* = verify tương thích, không đổi logic)
- Verify: `tsc --noEmit` sạch (0 lỗi, baseline đã sạch); `npm test` (mapper auth 12/12 pass, tổng 26/26); `npm run build` thành công; test tay VS-1..VS-8 **chưa làm được** vì BE local không chạy.
- PROGRESS: task #1 (Auth UC-01) 50% → 95% (còn 5% verify = test tay end-to-end).
- Còn lại / rủi ro: (1) test tay VS-1..VS-8 khi BE chạy ở `:4000`; (2) `sync:swagger` lại khi BE chạy để chắc catalog không lệch; (3) OTP/khôi phục mật khẩu và OAuth là Phase 2/P3, chưa làm; (4) trong lúc implement phát hiện `Set-Content` PowerShell làm hỏng encoding UTF-8 của `tasks.md` — đã viết lại toàn bộ file, từ nay chỉ flip checkbox bằng Edit tool.

---

## [2026-09-15] — Fix VS-4: redirect + toast khi refresh thất bại

- Mục tiêu: sau khi refresh thất bại phải có toast, về `/login?from=...` nếu đang ở route bảo vệ, và guest không bị gọi refresh vô ích.
- Nguyên nhân (soi `src/lib/axios.ts`): (1) interceptor không có code điều hướng nào; (2) toast hết hạn phiên bị chặn bởi cờ `silent` của request kích hoạt; (3) mọi 401 (kể cả guest) đều thử refresh.
- Đã làm trong `frontend/src/lib/axios.ts`:
  - Thêm guard `hadSession` (token memory/store hoặc user persist): guest gặp 401 thì reject ngay, không refresh, không toast.
  - Toast mất phiên luôn hiện 1 lần kể cả request `silent` (silent chỉ áp dụng lỗi nghiệp vụ của request đó).
  - Thêm `redirectToLoginIfProtected()`: về `/login?from=<path>` khi đang ở `/dashboard`, `/profile`, `/admin`; trang public giữ nguyên; không redirect khi đã ở `/login`.
- Verify: `tsc --noEmit` sạch; `npm test` 26/26 pass. Chưa test tay lại (chờ user retest VS-4).
- PROGRESS: không đổi (task #1 vẫn 95%, chờ T043).

---

## [2026-09-15] — Tích hợp User Profile + Diet (spec 002-user-profile, T001–T045)

- Mục tiêu: consumer API thật cho 6 endpoint users/diet đã `READY` (xem/sửa hồ sơ, sức khỏe BMI/BMR/TDEE, wizard diet 3 bước, lịch chay kỳ), đúng kiến trúc DTO→Model→Mapper→API→Query.
- Đã làm:
  - `sync:swagger` thành công với BE `:4000` (24 endpoints, 7 nhóm, 26 schemas; diff chỉ metadata, không lệch contract).
  - `api-endpoints.ts` (+4 path), `enums` (+6 enum diet/health), `bmi.ts` (+`EXTRA_ACTIVE` 1.9).
  - `features/profile` mới: DTO/Model/Mapper/test (profile, health), api, queries, schema, 4 components (view, basic form, health form, health summary).
  - `features/diet-preferences` mới: DTO/Model/Mapper/test, api (preview/preferences/schedule), queries, schema, 6 components (selector, rule-list, allergy, exclusion, wizard, schedule-editor).
  - Refactor `/ho-so`: banner + tab info/health dùng dữ liệu thật, thêm tab diet; xóa form mock (phone/bio/đổi mật khẩu/upload file) vì không có endpoint.
  - Sửa 3 lỗi type phát hiện khi viết (safeArray generic, toUpdateDto null, pickField literal).
- File tạo/sửa: xem tasks T003–T045 (2 feature folder mới + `ho-so/page.tsx` + constants/enums/bmi).
- Verify: `tsc` sạch; mapper test mới 15/15 pass; `npm test` full + `build` + `lint` ở T049; test tay VP-1..VP-7 ở T050.
- PROGRESS: task #9 (Sức khỏe UC-13) 20% → 90% (còn test tay).
- Còn lại / rủi ro: (1) test tay VP-1..VP-7; (2) wizard chưa prefill từ preference đã lưu (enhancement); (3) AuthGuard/middleware redirect ngay sau F5 trước khi silent-refresh xong — ngoài scope, cần xử lý ở task auth củng cố.

---

## [2026-09-15] — Contract verification diet bằng API thật (T050 một phần)

- Mục tiêu: xác thực shape thật của diet endpoints trước khi giao test tay UI.
- Đã làm (curl với tài khoản seed member): login ✓, `GET /users/me` ✓, `PATCH /users/me` ✓, `PUT health-profile` ✓ (`bmi=22.49/bmr=1567.5/tdee=2429.63` khớp công thức SRS), `POST preview` ✓ (v1, 2 rules), `PUT preferences` + `PUT schedule` ✓ (`tz=Asia/Ho_Chi_Minh`, dates đúng).
- Phát hiện và đã fix trong code:
  1. Preview rule có shape `{id, code, label, description, defaultEnabled, hardConstraint, source, version}` (không có `ruleDefinitionId` top-level) → mapper bổ sung candidates (`label`, `hardConstraint`), DTO bổ sung field, thêm test case shape thật; gửi `id` làm `ruleDefinitionId`.
  2. `PERIODIC` bắt buộc kèm `scheduleDates` trong preferences (thiếu → `DIET_SCHEDULE_REQUIRED`) → wizard thu ngày ngay ở bước review (component `ScheduleDatePicker` dùng chung) và chặn xác nhận khi chưa chọn ngày; cập nhật `contracts/diet-api.md`.
  3. Backend trả đúng `DIET_PREFERENCES_REQUIRED` khi lưu lịch chưa có preferences — khớp contract, UI đã xử lý.
- Verify: `tsc` sạch; diet mapper test 7/7 pass.
- Còn lại: test tay UI VP-1..VP-7 (T050) — API-level đã pass hết.

---

## [2026-09-15] — Fix hiển thị hồ sơ + VP-4 400 (test tay user báo)

- Mục tiêu: sửa 2 lỗi user phát hiện khi test tay (banner hiện "Người dùng" dù API 200 đúng dữ liệu; VP-4 báo 400 `ruleSetVersion`/`rules`/severity).
- Nguyên nhân:
  1. **Bọc envelope 2 tầng**: mọi DTO `*ResponseDto` đã là `{success,data,meta}` nhưng api layer lại bọc thêm `APIResponse<>`, khiến `res.data.data` thành object con và mapper đọc nhầm tầng → user/session/preview rỗng. Ảnh hưởng: `authApi.register/login/getMe/logout-fallback`, `profileApi` (2 hàm), `dietApi` (3 hàm). `healthApi` đúng do `HealthProfileDto` vốn là shape trong `data`.
  2. **Severity dị ứng**: editor gửi `severity: ''`, backend chỉ nhận `MILD|MODERATE|SEVERE`.
- Đã làm:
  - `auth.api.ts` (register/login/getMe/logout-fallback), `profile.api.ts` (2 hàm), `diet.api.ts` (3 hàm): dùng DTO envelope trực tiếp + đọc `res.data`; xóa import `APIResponse` thừa.
  - `AllergyEditor`: thêm select mức độ (Nhẹ/Trung bình/Nặng, mặc định Trung bình) + hiện severity trên chip; `toSaveDto` chuẩn hóa severity, lọc dị ứng rỗng code.
  - Thêm rule envelope vào `ARCHITECTURE.md` §3 checklist để ngăn tái diễn; thêm test severity.
- Verify: `tsc` sạch; `npm test` 43/43 pass. Cần user retest: đăng nhập form (trước đây bấm không phản hồi), banner `/ho-so`, VP-4.
- PROGRESS: không đổi (task #9 vẫn 90%, T050 vẫn mở).

---

## [2026-09-15] — Fix AUTH_REQUIRED noise + hiển thị ngày chay kỳ (test tay user báo)

- Mục tiêu: (1) query hồ sơ không bắn 401 khi chưa có phiên; (2) ngày chay kỳ đã lưu phải thấy được trên UI sau reload.
- Đã làm:
  - `useDetailedProfileQuery`: thêm `enabled: isAuthenticated` — guest không bắn request vô ích, sau F5 query chờ silent-refresh xong mới chạy (trước đây bắn ngay không token gây 401 trung gian trong Network).
  - `DietPreferenceSummary` thêm `scheduleDates: string[]` + `scheduleTimezone`; `profile.mapper` map từ `dietPreference.schedule` (lọc ngày sai định dạng); card tóm tắt tab diet hiện "Ngày chay kỳ (N): dd/mm, ...".
  - `DietWizard` thêm prop `initialSelection`: preselect radio theo tóm tắt hiện tại (không tự gọi preview).
- Verify: `tsc` sạch; `npm test` 44/44 pass. Cần user retest VP-4/VP-5.
- Lưu ý hỏi user: lỗi `AUTH_REQUIRED` thấy ở đâu (toast? màn hình? console? Network?) và thao tác nào trước đó — nếu vẫn còn sau fix, báo để soi tiếp.
- PROGRESS: không đổi (task #9 vẫn 90%, T050 vẫn mở).

---

## [2026-09-15] — Sửa ngày chay kỳ inline trong card tóm tắt (user yêu cầu)

- Mục tiêu: card "Chế độ ăn hiện tại" cho phép thêm/bớt ngày trực tiếp, không cần chạy lại wizard.
- Đã làm:
  - Tách `ScheduleDatePicker` (+ `SCHEDULE_DATE_RE`, `toDisplayDate`) ra file riêng `schedule-date-picker.tsx`; `ScheduleEditor` và wizard dùng lại.
  - Tạo `CurrentDietCard`: hiện tóm tắt + ngày chay kỳ; nút "Sửa ngày chay kỳ" (chỉ khi PERIODIC) mở chế độ sửa inline (thêm/xóa chip ngày, Lưu/Hủy); lưu qua `PUT diet-schedule`, mutation tự invalidate profile nên card refresh ngay.
  - `ho-so/page.tsx`: thay card tóm tắt tĩnh bằng `CurrentDietCard`.
- Verify: `tsc` sạch; `npm test` 44/44 pass; eslint 3 file mới sạch.
- PROGRESS: không đổi (task #9 vẫn 90%, T050 vẫn mở).

---

## [2026-09-15] — Tích hợp Catalog (spec 003-catalog, T001–T033)

- Mục tiêu: consumer API thật cho 13 endpoint catalog đã `READY` (cây public, tìm/phân giải nguyên liệu, admin CRUD + alias).
- Đã làm:
  - `sync:swagger` thành công (24 endpoints, chỉ đổi metadata).
  - `api-endpoints.ts` (+3 nhánh), `enums` (+5: `CategoryType`, `CatalogStatus` gộp 2 status giống nhau, `FoodGroup`, `ResolutionMatch`).
  - `features/category` (DTO/Model/Mapper/test, api, queries, tree, trang `/danh-muc`), `features/ingredient` (DTO/Model/Mapper/test, api, queries, search debounce, resolve-picker), `features/admin-catalog` (DTO tái export, api/query/schema ×2 domain, category-manager, replacement-picker, ingredient-manager, alias-editor).
  - Admin page: tab categories mock → `CategoryManager`, thêm tab ingredients → `IngredientManager`, bọc `AuthGuard ADMIN` toàn trang, xóa mock.
  - Sửa 3 lỗi type khi viết (safeArray generic, `toPaginationModel` đổi tên `toListModel` do khác signature base, Pagination prop `onChange`).
  - Test phát hiện mapper giữ phần tử null trong `children` → đã lọc trước khi map.
- File tạo/sửa: xem tasks T003–T033 (3 feature folder mới + `danh-muc/page.tsx` + admin page + constants/enums).
- Verify: `tsc` sạch; mapper test catalog 14/14 pass; `npm test` full + `build` ở T037; test tay VC-1..VC-6 ở T038.
- PROGRESS: task #4 (Tìm kiếm + Catalog) 30% → 75%.
- Còn lại / rủi ro: (1) test tay VC-1..VC-6; (2) `IngredientResponse` đơn và alias item shape `_truncated` trong catalog — mapper đã dùng candidates linh hoạt, verify bằng API thật ở T038.

---

## [2026-09-15] — Contract verification catalog bằng API thật (T038)

- Mục tiêu: xác thực shape thật 13 endpoint trước khi giao test tay UI.
- Đã làm (curl với tài khoản admin seed): login ADMIN ✓; `GET /categories` ✓ (6 roots, con 2 tầng); `GET /ingredients?q=dau` ✓ (không dấu ra, total=4); resolve `dau phong` → EXACT 1 candidate ✓, `dau` → AMBIGUOUS 2 candidates ✓, tên bịa → NONE ✓; `POST admin/categories` ✓ (tự sinh slug `test-cat-fe`); `POST admin/ingredients` ✓; `POST aliases` ✓ (count=1); `DELETE alias` (204) ✓; `DELETE ingredient` (archive) → public mất ✓; `DELETE category?replacementId=` ✓.
- Test data đã dọn (archive cả 2 item test, không còn rác active).
- Phát hiện: không lệch contract nào thêm; alias item có `id` dùng được cho xóa.
- Còn lại: test tay UI VC-1..VC-6 (T038) — API-level đã pass hết.

---

## [2026-09-16] — Nhúng cây danh mục làm filter ở `/cong-thuc` + `/bai-viet`

- Mục tiêu: thay `CATEGORIES` hard-code ở sidebar `/cong-thuc` và pills `/bai-viet` bằng dữ liệu catalog thật (`GET /categories` đã `READY`), không thêm mục nav mới (header đã 6 mục).
- Đã làm:
  - Tạo `features/category/utils/flatten-categories.ts`: `flattenCategories` (trải 2 tầng), `findCategoryById`, `matchesCategoryName` (so khớp tên best-effort cho dữ liệu mẫu).
  - Tạo `CategoryFilterList` (checkbox cha + con thụt đầu dòng) và `CategoryFilterPills` (chọn đơn + `Tất cả`); presentational, chỉ nhận `Model`, query/loading/error do page quản lý.
  - `/cong-thuc`: `useCategoryTreeQuery(RECIPE_GROUP)` + skeleton/error+retry/empty; chips "Đang lọc" theo lựa chọn thật; nút "Đặt lại" hoạt động (xóa chọn + query + thời gian).
  - `/bai-viet`: `useCategoryTreeQuery(CONTENT_TOPIC)` + pills thật; nút reset xóa cả chủ đề; fix `as any` ở sort select; xóa 5 import icon thừa.
  - Lọc danh sách mẫu hiện tại là best-effort theo tên (mock chưa có `categoryId`); ghi chú thay bằng filter server-side khi API công thức/bài viết `READY`.
- File tạo/sửa:
  - Tạo: `src/features/category/utils/flatten-categories.ts`, `src/features/category/components/{category-filter-list,category-filter-pills}.tsx`
  - Sửa: `src/app/(site)/cong-thuc/page.tsx`, `src/app/(site)/bai-viet/page.tsx`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `eslint` 5 file (0 error, 0 warning mới); `vitest` category 6/6 pass; `git diff --check` không lỗi mới ở file đổi. Chưa test tay với BE (cần seed có `RECIPE_GROUP`/`CONTENT_TOPIC`).
- PROGRESS: task #4 giữ 75% (không thêm endpoint mới; còn test tay VC + search Postgres); task #2 giữ 40% (blog vẫn thiếu upload + API thật).
- Còn lại / rủi ro: (1) tên seed BE có thể không khớp nhãn mock → filter best-effort có thể ra rỗng, hết khi API công thức/bài viết `READY` và lọc theo `categoryId`; (2) chips homepage + `INGREDIENTS`/`TIMES` ở `/cong-thuc` vẫn hard-code (ngoài scope yêu cầu).

---

## [2026-09-16] — Audit + fix UI quản trị catalog (tab admin)

- Mục tiêu: rà luồng catalog cho admin (VC-3/VC-4) ở mức code + smoke test public API (backend local đang chạy), fix lỗi UI phát hiện được trước khi test tay trình duyệt.
- Đã làm (audit phát hiện → fix):
  1. Archive danh mục không có bước xác nhận (bấm icon là `DELETE` ngay; item không ai dùng bị archive tức thì) → `ReplacementDialog` thành 2 bước: xác nhận trước, chỉ hiện picker khi backend trả `CATEGORY_REPLACEMENT_REQUIRED`; `startArchive` không còn gọi API trực tiếp.
  2. Archive nguyên liệu cũng không xác nhận → thêm dialog xác nhận riêng (đóng khi thành công, giữ mở để thử lại khi lỗi).
  3. List nguyên liệu hiện `foodGroup` enum thô (`LEGUMES`) → dùng `foodGroupLabel` tiếng Việt từ Model.
  4. Ô tìm nguyên liệu admin gọi API theo từng ký tự → debounce 400ms qua `useDebounce` có sẵn.
  5. Hàm `addAllergen` chết (chỉ Enter mới thêm được) → gắn vào nút "Thêm"; `addWarning` trùng logic inline → gom về một hàm.
  6. Select cha trong form danh mục chỉ hiện tên → thêm `typeLabel` + hint "chỉ gốc được làm cha, con cùng loại với cha".
  7. Xóa import thừa (`Plus`, `Table*`, `EmptyState`, `Badge`) ở 3 file.
- Smoke test BE local (public, không cần auth): `GET /categories?type=RECIPE_GROUP` 200 đúng cây 2 tầng. Admin API chưa test live được (password seed local là placeholder, không login lấy token được).
- File tạo/sửa:
  - Sửa: `src/features/admin-catalog/components/{category-manager,ingredient-manager,replacement-picker,alias-editor}.tsx`, `docs/WORK-LOG.md`
- Verify: `tsc --noEmit` sạch; `eslint` 4 file (0 error, 0 warning); `vitest` category+ingredient 14/14 pass. Chưa test tay trình duyệt (cần tài khoản admin seed thật).
- PROGRESS: task #4 giữ 75%.
- Còn lại / rủi ro: (1) bạn test tay trên trình duyệt theo VC-3/VC-4 trong `specs/003-catalog/quickstart.md` với tài khoản admin seed (BE đang chạy ở `:4000`); (2) form danh mục vẫn dùng state tay, chưa dùng `category.schema.ts` (zod) — nâng cấp sau nếu cần validate phức tạp hơn.

---

## [2026-09-16] — Gắn đường vào trang mồ côi + rule chống tái diễn

- Mục tiêu: route `/danh-muc` và `/admin` tồn tại nhưng không có link nào trỏ tới; gắn lối vào + ghi rule để lần sau không bị nữa (user yêu cầu).
- Đã làm:
  - Footer cột "Khám phá": thêm link "Danh mục món chay" → `/danh-muc`.
  - Sidebar `/cong-thuc`: link "Xem tất cả" → `/danh-muc?type=RECIPE_GROUP`; dòng chủ đề `/bai-viet`: link "Tất cả chủ đề" → `/danh-muc?type=CONTENT_TOPIC`.
  - `/danh-muc`: đọc `?type=` qua `useSearchParams` (validate theo `CategoryType`, sai → `ALL`) + bọc `Suspense` để link ngữ cảnh mở đúng loại.
  - Dropdown user ở header: thêm mục "Quản trị catalog" → `/admin`, chỉ hiện khi `user.role === ADMIN` (giữ nguyên `AuthGuard` ở route).
  - `docs/ARCHITECTURE.md`: thêm mục "Route — RULE BẮT BUỘC: cấm trang mồ côi" (mọi route phải có ≥1 entry point; header giữ ~6 mục; query param phải đọc; admin có lối vào theo role; checklist + ghi WORK-LOG).
- File tạo/sửa:
  - Sửa: `components/layout/{site-header,site-footer}.tsx`, `app/(site)/{danh-muc,cong-thuc,bai-viet}/page.tsx`, `docs/{ARCHITECTURE,PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `eslint` 5 file (0 error, 0 warning); `npm run build` thành công (`/danh-muc` prerender tĩnh OK).
- PROGRESS: task #4 giữ 75% (chỉ gắn link, không thêm endpoint).
- Còn lại / rủi ro: mobile menu header chưa có link danh mục (header mobile dùng chung `NAV_ITEMS` — chấp nhận được vì footer + link ngữ cảnh đã đủ; bổ sung sau nếu user muốn).

---

## [2026-09-16] — URL test nhanh trong quickstart + gắn ingredient search vào `/danh-muc`

- Mục tiêu (user yêu cầu): bổ sung đường dẫn test trực tiếp vào `specs/003-catalog/quickstart.md` để testing nhanh không cần đi tìm; phát hiện thêm `IngredientSearch`/`ResolvePicker` chưa gắn vào route nào nên VC-2 không test được bằng URL.
- Đã làm:
  - Tạo `IngredientResolveSearch` (ô nhập + debounce + `useIngredientResolveQuery` + `ResolvePicker` + xác nhận đã chọn), self-contained.
  - `/danh-muc` thành hub catalog: thêm section `#tra-cuu` (`IngredientSearch`) + `#phan-giai` (`IngredientResolveSearch`).
  - `/admin`: nhận `?tab=` (validate, sai → `queue`) + `Suspense` để link test mở đúng tab (`/admin?tab=categories`, `/admin?tab=ingredients`).
  - Quickstart: thêm §2 bảng URL test nhanh (VC ↔ URL ↔ tài khoản ↔ test gì) + lưu ý `AuthGuard`; đánh lại số §2→§3, §3→§4, §4→§5.
- File tạo/sửa:
  - Tạo: `src/features/ingredient/components/ingredient-resolve-search.tsx`
  - Sửa: `app/(site)/danh-muc/page.tsx`, `app/(admin)/admin/page.tsx`, `specs/003-catalog/quickstart.md`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `eslint` 3 file (0 error, 0 warning); `npm run build` thành công (`/admin`, `/danh-muc` trong route map).
- PROGRESS: task #4 giữ 75% (không endpoint mới).
- Còn lại / rủi ro: test tay trình duyệt VC-1..VC-6 vẫn cần bạn làm với tài khoản admin seed (BE `:4000` đang chạy).

---

## [2026-09-16] — Fix 3 lỗi auth khi test catalog (REFRESH_TOKEN_REUSED, không vào admin, không redirect)

- Mục tiêu: user báo (1) `REFRESH_TOKEN_REUSED`, (2) không vào được `/admin`, (3) login admin không tự vào admin — đều chặn test VC-3/VC-4.
- Nguyên nhân:
  1. `REFRESH_TOKEN_REUSED`: backend rotation + revoke family nếu 2 refresh song song cùng token cũ. Frontend có 2 nguồn race: `AuthProvider` silent-refresh on mount + `axios` interceptor refresh khi 401, không dedup, mỗi tab tự refresh riêng. Cross-tab càng dễ.
  2. Không vào admin: `AuthGuard` redirect ngay khi `isAuthenticated=false` (chưa đợi hydrate/silent-refresh); `axios` gọi thẳng `http://localhost:4000` nên `SameSite` + port khác làm cookie khó chia sẻ nhất quán, `middleware` đọc `accessToken` không thấy.
  3. Không redirect admin: `login/page.tsx` luôn `push('/')` khi không có `?from=`, không check role.
- Đã làm:
  - Tạo `lib/auth-refresh.ts`: singleton `sharedRefresh()` + Web Locks (`navigator.locks`) + localStorage lock + throttle 2s, dedup mọi caller, forward `getMe()` sau refresh.
  - `lib/axios.ts`: bỏ `isRefreshing`, dùng `sharedRefresh` + `queueProcessing` + `resetAxiosAuthState`, forward token mới vào retry, xóa lock khi REUSED.
  - `components/providers/auth-provider.tsx`: dùng `sharedRefresh`, chỉ refresh khi có `refreshToken` cookie, `eslint-disable` cho `setIsHydrated`.
  - Tạo proxy `app/api/auth/{login,register}/route.ts` (forward Set-Cookie như `refresh-token`); `features/auth/api/auth.api.ts` đổi `register`/`login` qua `/api/auth/*` (baseURL ''), để cookie về domain Next.
  - `lib/env.ts`: `API_BASE_URL` trả `/api/v1` khi `window` tồn tại (đi qua rewrites), server vẫn dùng `NEXT_PUBLIC_API_URL`.
  - `app/api/auth/refresh-token/route.ts`: forward Set-Cookie cả khi lỗi (để clear khi REUSED/EXPIRED).
  - `components/shared/auth-guard.tsx`: đợi `hydrated` 300ms trước khi redirect, tránh redirect nhầm.
  - `app/(auth)/login/page.tsx`: sau login, nếu không có `?from` tường minh và `role===ADMIN` thì `push('/admin?tab=categories')`.
  - `specs/003-catalog/quickstart.md` §2 thêm hướng dẫn recovery khi đã bị `REFRESH_TOKEN_REUSED` (xóa cookie + localStorage `auth-storage` + reload + login lại với password `SEED_ADMIN_PASSWORD` trong `backend/.env`).
- File tạo/sửa:
  - Tạo: `src/lib/auth-refresh.ts`, `src/app/api/auth/{login,register}/route.ts`
  - Sửa: `src/lib/{axios,env}.ts`, `src/components/providers/auth-provider.tsx`, `src/components/shared/auth-guard.tsx`, `src/app/api/auth/refresh-token/route.ts`, `src/features/auth/api/auth.api.ts`, `src/app/(auth)/login/page.tsx`, `specs/003-catalog/quickstart.md`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `eslint` 7 file (0 error, 0 warning); `npm run build` thành công.
- PROGRESS: task #1 Auth 95% → 95% (không đổi %, fix bug); task #4 giữ 75%.
- Còn lại / rủi ro: (1) bạn thử lại theo quickstart §2 sau khi xóa site data + login admin (password xem `backend/.env`); (2) family đã revoke trước đó cần 1 lần clear + login lại là hết; (3) `NEXT_PUBLIC_API_URL` tuyệt đối vẫn giữ trong `.env` để rewrites hoạt động, client đã force `/api/v1`.

---

## [2026-09-16] — Testing ingredient mapper (mở rộng 8 → 16 case)

- Mục tiêu: hoàn thiện phần testing của ingredients (`docs/api/ingredients.md` là file generated từ Swagger nên không có mục testing riêng; testing thật nằm ở `specs/003-catalog` T013/T037-T038 + mapper test). Bổ sung coverage cho các nhánh mapper chưa được test.
- Đã làm:
  - `toSingleModel`: bóc envelope `data` 1 item (đường admin create/update/addAlias dùng) + envelope/data null → defaults.
  - `toListModel` edge: envelope null → list rỗng + meta mặc định; meta thiếu → `totalItems` fallback theo số item.
  - `toModel` biến thể BE: đọc snake_case (`canonical_name`, `food_group`, `allergen_codes`, `diet_compatibilities`, `tradition_warnings`, `created_at`...); alias chuỗi trần + key `aliasId`/`alias_id` + `name`/`value`.
  - Phát hiện và ghi nhận (không đổi code): `safeArray` không lọc `null` với `dietCompatibilities`/`traditionWarnings` — phần tử null thành object rỗng đã sanitize (khác với aliases/allergen lọc chuỗi rỗng). Test assert đúng behavior thật.
  - `toResolutionModel`: đọc `normalized_query` snake_case.
- File tạo/sửa:
  - Sửa: `src/features/ingredient/mappers/ingredient.mapper.test.ts` (8 → 16 test), `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `npm test` 66/66 pass (ingredient 16/16, không regress); `eslint` file test sạch; `git diff --check` chỉ còn 3 blank-line-EOF có sẵn ở `(auth)/*` (baseline T002 đã ghi nhận, không lỗi mới).
- PROGRESS: task #4 giữ 75% (chỉ thêm test, không endpoint mới; còn test tay VC).
- Còn lại / rủi ro: (1) test tay trình duyệt VC-2 (`/danh-muc#tra-cuu`, `/danh-muc#phan-giai`) theo `specs/003-catalog/quickstart.md` §4 vẫn cần bạn làm với BE `:4000`; (2) compat/warnings giữ chỗ null-object có thể gây hiển thị dòng trống ở admin form nếu BE trả null trong mảng — theo dõi khi test tay VC-4, fix ở task riêng nếu cần.

---

## [2026-09-16] — Xóa mock trang `/recipes` (user yêu cầu test data thật)

- Mục tiêu: gỡ toàn bộ dữ liệu mẫu ở `/recipes` để không nhầm mock với data thật.
- Phát hiện trước khi xóa (soi swagger BE `:4000`): backend **chưa có endpoint công thức nào** (`/posts`, `/recipes` đều không tồn tại; swagger chỉ có auth/users/categories/ingredients/diet-rules/health). Đã hỏi user và user chọn phương án "xóa mock, hiện empty state".
- Đã làm:
  - `recipes/page.tsx`: xóa `MOCK_RECIPES` + lọc/tab/blog-video + toggle grid/list + phân trang giả (1-4, "28 công thức") + "Kho tàng 1,280+ món" + section "Nguyên liệu chính" (count giả) + hộp badge không dấu cứng; thay bằng `EmptyState` ("Chưa có công thức nào" + ghi rõ API chưa sẵn sàng, nút về `/categories?type=RECIPE_GROUP`). Giữ nguyên ô tìm kiếm, chips lọc + cây danh mục `RECIPE_GROUP` thật, lọc thời gian, card AI.
  - `recipes/[id]/page.tsx`: bỏ lookup mock (kể cả fallback `MOCK_RECIPES[0]`), gọi `notFound()` cho tới khi API READY.
- File tạo/sửa:
  - Sửa: `src/app/(site)/recipes/page.tsx`, `src/app/(site)/recipes/[id]/page.tsx`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch; `npm test` 66/66 pass; `eslint` 2 file sạch; `npm run build` pass (`/recipes`, `/recipes/[id]` trong route map); grep `MOCK|mock` trong route `recipes/` = 0 match.
- PROGRESS: task #4 giữ 75%.
- Còn lại / rủi ro: (1) trang hiện trống hoàn toàn cho tới khi BE có API công thức — đúng ý user nhưng cần expectativas: chưa test được "data thật" vì chưa có API; (2) mock còn ở trang chủ (`page.tsx` slice 4), `/search`, file `features/recipe/data/mock-recipes.ts` chưa xóa — dọn ở task riêng nếu user muốn; (3) khi API READY cần làm đủ 7 bước scaffold (DTO/Model/Mapper/API/Query) cho recipe.

---

## [2026-09-16] — Tích hợp bộ nhận diện logo thương hiệu VeggieConnect

- Mục tiêu: Tích hợp hình ảnh logo người dùng cung cấp (`public/logo/logo.png`) thành bộ nhận diện chính thức cho dự án VeggieConnect.
- Đã làm:
  - Phân tích và trích xuất các biến thể asset từ ảnh gốc với `sharp`:
    - `public/logo/logo.png`: Giữ nguyên ảnh gốc.
    - `public/logo/logo-mark.png`: Biểu tượng mầm lá chữ V vuông vắn (512x512, transparent background), tối ưu cho icon, avatar, favicon.
    - `public/logo/logo-horizontal.png`: Phiên bản lockup nằm ngang (Biểu tượng + Chữ VeggieConnect) cho Light Mode.
    - `public/logo/logo-horizontal-dark.png`: Phiên bản lockup nằm ngang cho Dark Mode (tự động điều chỉnh màu chữ "Connect" sang sáng màu trắng đục để tương phản cao).
    - `src/app/icon.png` (512x512) & `src/app/apple-icon.png` (180x180): Favicon tự động nhận diện bởi Next.js App Router.
  - Tạo component chuẩn hóa `src/components/layout/brand-logo.tsx`:
    - Hỗ trợ 3 biến thể: `horizontal`, `mark`, `full` với các kích thước `sm`, `md`, `lg`, `xl`.
    - Tự động chuyển đổi mượt mà giữa Light/Dark mode.
    - Hỗ trợ subtitle (ví dụ: "Admin Portal", "Viet Vegan Companion").
    - Tối ưu hiệu năng LCP với Next.js `<Image>`.
  - Cập nhật các vị trí hiển thị:
    - `src/components/layout/site-header.tsx`: Header chính dùng `BrandLogo`.
    - `src/components/layout/site-footer.tsx`: Footer dùng `BrandLogo` và thống nhất thương hiệu VeggieConnect.
    - `src/app/(auth)/layout.tsx`: Header và footer màn Auth dùng `BrandLogo` kèm subtitle.
    - `src/app/(admin)/admin/layout.tsx`: Sidebar Admin portal dùng `BrandLogo` (mark + subtitle).
    - `src/app/layout.tsx`: Cập nhật Title metadata và cấu hình icons/favicons.
- File tạo/sửa:
  - Tạo: `public/logo/{logo-mark,logo-horizontal,logo-horizontal-dark,logo-full}.png`, `src/app/{icon,apple-icon}.png`, `src/components/layout/brand-logo.tsx`
  - Sửa: `src/components/layout/{site-header,site-footer}.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`, `src/app/layout.tsx`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 66/66 test pass; dọn dẹp cache `.next`.
- PROGRESS: task #0 Nền tảng 60% → 65%.
- Còn lại / rủi ro: Không có. Logo hiển thị sắc nét, responsive và tương thích trọn vẹn cả 2 giao diện sáng/tối.

---

## [2026-09-16] — Rename route FE sang tiếng Anh (spec 004-fe-english-routes, T001–T029)

- Mục tiêu: đổi slug trang FE từ tiếng Việt sang tiếng Anh để đồng bộ tên chức năng BE, giữ UI tiếng Việt, không gãy bookmark/link cũ.
- Đã làm:
  - `next.config.ts`: thêm `redirects()` 20 rule 308 (tĩnh trước, động sau), giữ query/hash.
  - `git mv` route folders: `cong-thuc`→`recipes` (+`dang-cong-thuc`→`recipes/new`), `bai-viet`→`articles` (`tao-moi`→`new`, `chinh-sua`→`edit`), `video`→`videos` (+`dang-video`→`videos/new`, xóa `video/upload`), `danh-muc`→`categories`, `ban-do`→`restaurants`, `tim-kiem`→`search`, `ho-so`→`profile`, `ke-hoach-bua-an`→`meal-plans` (`da-luu`→`saved`), `tro-ly-ai`→`assistant`, `(auth)/xac-thuc-otp`→`verify-otp`.
  - Cập nhật ~76 link nội bộ: header/footer (nav, search form, dropdown), home CTAs, recipe/post/video/restaurant/category components, `router.push` editor/search, copy-link `/articles/[id]`.
  - Guards giữ nguyên logic: `middleware.ts` + `PROTECTED_PREFIXES` đã English (`/profile`), login `getSafeRedirectTarget` generic.
  - Docs: `BACKEND_INTEGRATION.md` v1.8 (§5 thêm cột Route FE + changelog), `ARCHITECTURE.md` ví dụ orphan-page, `UI_IMPLEMENTATION_PLAN.md` bảng route, `PROGRESS.md` ghi chú route.
- File tạo/sửa:
  - Sửa: `next.config.ts`, `src/components/layout/{site-header,site-footer}.tsx`, `src/app/(site)/{page,recipes/*,articles/*,videos/*,restaurants/*,categories,search,profile,meal-plans/*,assistant}/page.tsx`, `src/features/{recipe,post,restaurant,category}/components/*`, `src/components/shared/why-recommended-dialog.tsx`, `docs/{BACKEND_INTEGRATION,ARCHITECTURE,UI_IMPLEMENTATION_PLAN,PROGRESS,WORK-LOG}.md`, `specs/004-fe-english-routes/{tasks.md}`
  - Xóa: `src/app/(site)/videos/upload/page.tsx`
- Verify: grep old-slug 76 → 0 match; `tsc --noEmit` sạch; `npm test` 66/66 pass; `npm run build` pass (đủ routes Anh); dev-server: 12 URL cũ → 308 đúng Location giữ param/query, `/recipes`+`/articles`+`/restaurants` → 200; `git diff --check` sạch cho file scope (3 EOF warnings thuộc file session khác).
- PROGRESS: % giữ nguyên mọi task (rename không đổi scaffold); thêm dòng lịch sử.
- Còn lại / rủi ro: (1) test tay login (profile/meal-plans/create flows) cần BE `:4000` — user retest theo `specs/004-fe-english-routes/quickstart.md` §2 #2/#4/#7; (2) cây làm việc đang dirty chung với session khác (VD brand/logo, auth) — không commit khi chưa được yêu cầu; (3) `git mv` thư mục `ban-do`/`ke-hoach-bua-an` bị lock transient → đã move bằng filesystem + `git add -A`, rename vẫn detect đúng; (4) đã tắt nhầm mọi tiến trình node khi dọn dev-server — kiểm tra lại nếu session khác đang chạy `next dev`.

---

## [2026-09-16] — Hero Section Remotion 2D Food Animation (spec update-UI-herosection)

- Mục tiêu: Thay thế khối ảnh Unsplash tĩnh bên phải Hero Section trang Home/Landing page bằng animation 2D nghệ thuật cao cấp, hiện đại, nhẹ và đậm chất thương hiệu VeggieConnect theo đúng 9 phase trong `docs/update-UI-herosection.md`.
- Đã làm:
  - Phỏng vấn và thống nhất mọi nhánh thiết kế qua `/grill-me` và `/remotion-best-practices`: Remotion Player (@remotion/player), 240 frames @ 30 FPS (8s loop), đồ họa 2D SVG vector kết hợp gradient nghệ thuật (không phụ thuộc asset ảnh ngoài), món Buddha Bowl Cầu Vồng (bơ, đậu gà, cà chua bi, cà rốt, xà lách mầm), hybrid badges bên ngoài có reactive pulse sync ở Phase 7, âm thanh im lặng (silent).
  - Tạo bộ component vector trong `src/components/home/hero-food-animation/components/`:
    - `food-bowl-ceramic.tsx`: Tô gốm sứ thủ công men mờ với vành men ngọc thanh thoát và lòng tô sâu.
    - `ingredients-vectors.tsx`: 5 nguyên liệu vẽ tay vector chi tiết (Bơ tươi cắt nửa kèm hạt nâu, Cụm đậu gà nướng giòn & đậu hũ áp chảo, Cà chua bi đỏ mọng có cuống sao xanh, Cà rốt sợi cam tươi giòn, Rau mầm & xà lách xoăn tươi mát).
    - `completed-buddha-bowl.tsx`: Món Rainbow Buddha Bowl hoàn chỉnh thịnh soạn với đầy đủ 5 nhóm nguyên liệu xếp theo vòng tròn, hạt quinoa, xốt mè rang rưới mềm mại và hạt mè rang rắc trang trí.
    - `energy-connections.tsx`: Vòng hào quang hữu cơ và các đốm sáng mầm xanh kết nối giữa các nguyên liệu khi bung ra.
  - Tạo `hero-food-composition.tsx` (Remotion Composition):
    - 9 phase chặt chẽ: Phase 1 (Tô gốm floating), Phase 2 (Tô xoay 360 độ), Phase 3 (5 nguyên liệu bung ra với stagger delay và spring scale), Phase 4 (Nguyên liệu nhấp nhô nhẹ quanh quỹ đạo với kết nối năng lượng), Phase 5 & 6 (Xoay chuẩn bị và hội tụ xoáy ốc về tâm tô), Phase 7 (Món ăn hoàn chỉnh pop-in với pulse scale), Phase 8 (Giữ trọn vẹn món ăn khoe sắc), Phase 9 (Chuyển mượt về đầu vòng lặp).
  - Tạo `hero-food-player.tsx` & `hero-food-animation.tsx`:
    - Dynamic client loading với Next.js dynamic (ssr: false) và fallback `HeroFoodSkeleton` chống giật layout (CLS).
    - Hỗ trợ `prefers-reduced-motion` (tự động chuyển sang món ăn tĩnh khi người dùng bật giảm chuyển động).
    - Tích hợp 2 floating badge: Lịch Chay (trên-phải) và Thẻ Dinh Dưỡng Thực Vật 385 kcal / 18g Protein (dưới-trái) có hiệu ứng viền phát sáng (pulse glow ring) đồng bộ chính xác khi món ăn hoàn thành.
  - Cập nhật `src/app/(site)/page.tsx`: Gắn `<HeroFoodAnimation />` vào cột bên phải của Hero Section, dọn dẹp import `BedDouble` không dùng.
- File tạo/sửa:
  - Tạo: `src/components/home/hero-food-animation/{hero-food-constants.ts,hero-food-composition.tsx,hero-food-player.tsx,hero-food-animation.tsx,index.ts,components/food-bowl-ceramic.tsx,components/ingredients-vectors.tsx,components/completed-buddha-bowl.tsx,components/energy-connections.tsx}`
  - Sửa: `src/app/(site)/page.tsx`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify:
  - `node node_modules/typescript/bin/tsc --noEmit`: sạch (0 lỗi).
  - `npm test`: 66/66 unit tests pass.
  - `npm run build`: pass hoàn toàn (Compiled successfully in 43s, static generation 26/26 routes).
- PROGRESS: task #0 Nền tảng 65% → 70%.
- Còn lại / rủi ro: Không có. Animation hoàn toàn tự chủ (100% vector SVG), không phụ thuộc network tải ảnh ngoài, render siêu nhẹ và mượt mà trên cả desktop lẫn mobile.

---

## [2026-09-16] — Tích hợp ảnh thực tế vào Hero Food Animation (Remotion)

- Mục tiêu: Thay thế đồ họa vector SVG bằng bộ 7 ảnh thực tế của người dùng cung cấp trong `public/hero/`, xử lý loại bỏ nền caro giả, tối ưu dung lượng WebP và giữ vững 60 FPS theo tiêu chuẩn Remotion + motion performance.
- Đã làm:
  - Xử lý nén & tách nền asset bằng `sharp`:
    - `completed-dish.png` (gốc 7.4 MB, 2048x2048, nền caro dính liền RGB do AI sinh): tính toán tâm tô (1024, 1022.5) và bán kính 894px với feather 2px tạo circular mask, loại bỏ triệt để 100% nền caro giả, crop sát và nén sang `public/hero/optimized/completed-dish.webp` (640x640, 122 KB).
    - `bowl.png`: tối ưu và nén sang `bowl.webp` (640x640, 128.5 KB).
    - 5 nguyên liệu thực tế (`avocado.png`, `chickpeas.png` / khối đậu hũ cắt vuông, `tomato.png`, `carrot.png`, `greens.png`): tự động trim vùng trong suốt và nén sang WebP trong suốt (280x280, ~27–38 KB mỗi ảnh).
    - Tổng dung lượng bộ asset giảm hơn 97% từ ~18 MB xuống chỉ còn 412.2 KB.
  - Cập nhật code animation:
    - `hero-food-constants.ts`: Khai báo đường dẫn `hero/optimized/*.webp`, cập nhật kích thước chuẩn, tọa độ khoảng cách và xoay nhẹ cho 5 nguyên liệu.
    - `hero-food-composition.tsx`: Dùng `<Img src={staticFile('...')} />` của Remotion; chuyển toàn bộ animation sang 100% GPU Compositor properties (`translate3d`, `rotate`, `scale`, `opacity`) thay vì layout `left`/`top`, đạt 60 FPS mượt mà tuyệt đối.
    - `hero-food-player.tsx`: Nâng cấp fallback `prefers-reduced-motion` dùng `completed-dish.webp` kèm `priority`.
    - `hero-food-animation.tsx`: Nâng cấp skeleton placeholder dùng `bowl.webp` chống nhảy layout (CLS).
- File tạo/sửa:
  - Tạo: `public/hero/optimized/{completed-dish,bowl,avocado,chickpeas,tomato,carrot,greens}.webp`
  - Sửa: `src/components/home/hero-food-animation/{hero-food-constants.ts,hero-food-composition.tsx,hero-food-player.tsx,hero-food-animation.tsx}`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify:
  - `node node_modules/typescript/bin/tsc --noEmit`: 0 lỗi.
  - `npm test`: 66/66 unit tests pass.
  - `npm run build`: pass 26/26 routes tĩnh và động.
- PROGRESS: task #0 Nền tảng 70% → 70% (giữ nguyên).
- Còn lại / rủi ro: Không có. Ảnh thực tế hiển thị sắc nét, sống động, chân thực và tối ưu tốc độ tải trang cao.

---

## [2026-09-16] — Dời AGENTS.md ra root frontend + bổ sung rule dùng skills bắt buộc

- Mục tiêu: Di chuyển `frontend/docs/AGENTS.md` ra thư mục gốc frontend (`frontend/AGENTS.md`) để Antigravity tự động phát hiện và nạp làm `<user_rules>` trong mọi đoạn chat mới; bổ sung quy chuẩn bắt buộc áp dụng các bộ kỹ năng `.agents/skills/` theo ngữ cảnh.
- Đã làm:
  - Dùng `git mv` chuyển `frontend/docs/AGENTS.md` ra `frontend/AGENTS.md`.
  - Cập nhật nội dung `frontend/AGENTS.md`:
    - Giữ nguyên các quy chuẩn cốt lõi: 9 bước đọc bắt buộc, 3 câu hỏi xác nhận, kiến trúc DTO → Model → Mapper, cấm `any`, cấm trang mồ côi, 5 bước nhận task.
    - Thêm mục 2: **Quy tắc BẮT BUỘC sử dụng Skills (`.agents/skills/`) theo ngữ cảnh**:
      - UI / Component / Styling: Bắt buộc mở `shadcn`, `ui-ux-pro-max`, `baseline-ui`, `design-taste-frontend`/`impeccable`.
      - Hoạt cảnh & Motion: Bắt buộc mở `remotion-best-practices` và `fixing-motion-performance` (chỉ dùng GPU Compositor, 60 FPS, không dùng layout properties).
      - Kiến trúc Next.js: Bắt buộc mở `next-best-practices`.
      - Tracing & Blast Radius: Dùng `codegraph`.
      - Lập kế hoạch: Dùng bộ `speckit-*`.
      - Chất lượng sinh mã: Bắt buộc tuân thủ `full-output-enforcement` (chống cắt xén code).
  - Cập nhật file root `D:\Project\vegan-support-application\AGENTS.md`: Bổ sung tham chiếu `frontend/AGENTS.md` vào danh mục bắt buộc đọc và điều khoản tuân thủ skills trong Frontend Integration.
- File tạo/sửa:
  - Move + Sửa: `frontend/AGENTS.md` (từ `frontend/docs/AGENTS.md`)
  - Sửa: `AGENTS.md` (root), `frontend/docs/WORK-LOG.md`
- Verify: `git status` xác nhận di chuyển và cập nhật chính xác; đọc kiểm tra nội dung cả 2 file.
- PROGRESS: Không đổi % (task tài liệu & cấu hình quy chuẩn).

---

## [2026-09-16] — Audit API tích hợp + dọn phantom feature product

- Mục tiêu: Kiểm tra toàn bộ 24 operations trong `api-catalog.json` so với code frontend thực tế;
  xác định endpoint READY nào chưa được tích hợp; dọn dẹp phantom feature không có backend API.
- Đã làm:
  - Kiểm tra đối chiếu 24 operations (api-catalog.json) vs `api-endpoints.ts` + 9 API files + 9 query files.
  - **Kết quả:** 22/22 endpoint nghiệp vụ READY đã được FE tích hợp đầy đủ. Không có gap.
  - **Phát hiện phantom:** `features/product` + `API_ENDPOINTS.PRODUCTS` tham chiếu `/products` —
    endpoint không tồn tại trong backend OpenAPI.
  - Xóa `PRODUCTS` constant khỏi `api-endpoints.ts` (9 dòng, 5 endpoint phantom).
  - Xóa 2 constant `DETAIL` chưa dùng (admin categories + ingredients, backend không có GET detail route).
  - Viết lại `features/product/api/product.api.ts` thành mock-only template (bỏ axios import + API_ENDPOINTS ref).
  - Xóa orphan route `src/app/products/[id]/page.tsx` (vi phạm No Orphan Pages — không có link trỏ tới).
  - Cập nhật `docs/ARCHITECTURE.md`: sửa template reference từ `product` sang `auth/category/profile`
    (feature thật), ghi rõ product là scaffold demo; sửa import rule example.
- File tạo/sửa:
  - Sửa: `src/common/constants/api-endpoints.ts` (bỏ PRODUCTS + 2 DETAIL)
  - Sửa: `src/features/product/api/product.api.ts` (mock-only, bỏ axios/endpoint dep)
  - Xóa: `src/app/products/[id]/page.tsx` (orphan route)
  - Sửa: `docs/ARCHITECTURE.md` (template ref + import example)
  - Sửa: `docs/WORK-LOG.md` (entry này)
- Verify:
  - `npx tsc --noEmit` → 0 lỗi ✅
  - `npm test` → 52/52 pass (6 files) ✅
  - `npm run build` → exit 0, 26 pages generated, `/products` route đã biến mất ✅
- PROGRESS: Không đổi % (task audit + dọn dẹp kỹ thuật, không thêm tính năng mới).
- Còn lại / rủi ro:
  - 10+ feature modules (post, recipe, video, restaurant, meal-plan, chat...) đang dùng mock data —
    chờ backend chuyển endpoint sang READY mới tích hợp.
  - Test tay chưa chạy (VS-1..VS-8, VP-1..VP-7, VC-1..VC-6) vì cần backend local `:4000`.

---

## [2026-09-16] — Triển khai Content & Media (spec 005-content-media: Recipe, Blog Post, Video & Cloudinary Upload)

- Mục tiêu: Hiện thực hóa toàn diện tính năng Quản lý nội dung & Media (UC-02 cẩm nang, UC-05 video nấu ăn, Khám phá & Đóng góp công thức món ăn) theo đúng chuẩn kiến trúc 7 tầng scaffold, chuẩn bị sẵn sàng trước khi backend mở live API.
- Đã làm:
  - **Shared Constants & Enums**: Khai báo `API_ENDPOINTS.POSTS` (CRUD, related) và `API_ENDPOINTS.UPLOADS` (`/uploads/signature`); bổ sung domain enums `PostType`, `PostStatus`, `RecipeDifficulty`, `VideoSource`.
  - **Bộ dữ liệu mẫu chuẩn hóa (`__fixtures__`)**: Xây dựng 3 bộ fixture phong phú `post-fixtures.ts`, `recipe-fixtures.ts`, `video-fixtures.ts` đầy đủ thông tin dinh dưỡng, nguyên liệu định lượng và video duration.
  - **Tầng DTO & UI Model**: Định nghĩa phân tách rạch ròi DTO backend và Clean UI Model (`Article`, `Recipe`, `Video`) với các thuộc tính định dạng sẵn bằng tiếng Việt (`formattedPublishedAt`, `formattedDuration`, `difficultyLabel`).
  - **Tầng Mapper & Vitest Unit Tests**: Viết `PostMapper`, `RecipeMapper`, `VideoMapper` kế thừa `BaseMapper` với `pickField`, `safeString`, `safeDate`, `safeNumber`; viết 12 test cases kiểm thử null-safety, fallback và boundary cases — 64/64 tests toàn dự án pass 100%.
  - **API Clients & TanStack Query Layer**: Viết `post.api.ts`, `recipe.api.ts`, `video.api.ts`, `upload.api.ts`; Query Key Factories tập trung; hooks query phân trang & chi tiết kèm các mutation (`create`, `update`, `delete`) có toast tiếng Việt và cache invalidation.
  - **Media Upload Service**: Viết `media-validator.ts` kiểm soát ảnh ≤5MB, video ≤100MB; `ImageUploader` hỗ trợ kéo thả, preview tức thì và thanh phần trăm tiến trình; `VideoUploader` hỗ trợ cả tải lên Cloudinary và nhúng YouTube.
  - **Giao diện & Trình phát đa năng**:
    - `VideoPlayer` tự động nhận diện URL YouTube (nhúng không cookie) hoặc HTML5 video player trực tiếp mượt mà.
    - `RecipeEditorForm` nhập liệu trực quan: thông tin chung, nguyên liệu kèm định lượng, các bước nấu, bảng dinh dưỡng 6 chỉ số (calo, đạm, carbs, béo, xơ, B12) và `ImageUploader`.
    - `PostEditorForm` soạn thảo Markdown có Live Preview, tích hợp `ImageUploader` và cây danh mục động `flattenCategories`.
    - `DeletePostDialog` xác nhận xóa mềm kèm cảnh báo rõ ràng về liên kết xã hội & khả năng khôi phục.
  - **Trang ứng dụng (App Router)**:
    - Kho công thức: `/recipes`, `/recipes/[id]`, `/recipes/new`
    - Cẩm nang: `/articles`, `/articles/[id]`, `/articles/new`, `/articles/[id]/edit` (hiển thị thông báo kiểm duyệt revision)
    - Video nấu ăn: `/videos`, `/videos/[id]`, `/videos/new`
  - **Chống trang mồ côi (No Orphan Pages)**: Thêm link "Video nấu ăn" vào thanh điều hướng Header (`NAV_ITEMS`) và Footer (`COLUMNS`).
- File tạo/sửa:
  - Tạo: `features/post/{types,mappers,api,queries,schemas,utils,components}`, `features/recipe/{types,mappers,api,queries,schemas,components}`, `features/video/{types,mappers,api,queries,components}`, `specs/005-content-media/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `components/layout/{site-header,site-footer}.tsx`, `app/(site)/{recipes,articles,videos}/**`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify:
  - `npx tsc --noEmit` → 0 lỗi TypeScript ✅
  - `npm test` → 64/64 tests pass (9 test files) ✅
  - `npm run build` → Biên dịch thành công 26 routes tĩnh và động ✅
- PROGRESS: Task #2 (Blog/Post) 40% → 85%, Task #5 (Upload video) 30% → 80%.
- Còn lại / rủi ro:
  - Chờ backend chuyển các endpoint `/posts`, `/recipes`, `/videos`, `/uploads/signature` từ `PLANNED` sang `READY` để gỡ bỏ fallback fixture sang API live.
  - Test tay end-to-end khi có backend server local.

---

## [2026-09-16] — Fix review spec 005-content-media (F1–F9)

- Mục tiêu: khắc phục 9 lỗi phát hiện khi review plan + implement của agent Gemini (AuthGuard thiếu, detail trả mock giả, related sai contract, catch nuốt lỗi BE, form rò field, edit dùng Zustand, VideoPlayer gãy URL lỗi, videos/new còn mock cũ).
- Đã làm:
  - **F1**: bọc `AuthGuard` cho `/recipes/new`, `/articles/new`, `/articles/[id]/edit`, `/videos/new` (guest → `/login?from=...`).
  - **F2**: viết lại `/videos/new` (xóa mock 508 dòng: AI STT UC-10, 500MB/MOV, setTimeout giả): `AuthGuard` + `react-hook-form`/`zod` (`video-form.schema.ts` mới) + `VideoUploader` + `ImageUploader` cover + select danh mục `CONTENT_TOPIC` + `useCreateVideoMutation`.
  - **F3**: 3 detail API (`post/recipe/video`) throw `createNotFoundError` khi fixture không có id, thay vì trả `MOCK_*[0]`.
  - **F4**: `getRelatedPosts` map đúng contract object `{ recipes, blogs, videos }` qua `PostMapper.toRelatedGroup`; fallback trả nhóm rỗng (xóa 2 related hard-code); `useRelatedPostsQuery` trả `RelatedGroup`.
  - **F5**: helper mới `features/post/utils/api-fallback.ts` (`shouldFallbackToFixtures`: fallback khi lỗi mạng/404-list/5xx; rethrow 4xx nghiệp vụ; detail 404 luôn throw) + áp vào toàn bộ try/catch 3 api (list/detail/create/update/delete).
  - **F6**: `recipe-form.schema` (`prepTimeMinutes` + `cookTimeMinutes` thay `totalTimeMinutes`, `vitaminB12` thay `b12`, title max 200); form tách 2 ô nhập prep/cook (grid 3 cột); `recipes/new` map đủ `prep/cook`, `ingredientId` passthrough, `vitaminB12`; `post-form.schema` title max 200 / excerpt max 500 theo data-model.
  - **F7**: viết lại `articles/[id]/edit` chỉ đọc `Article` từ Query (bỏ `usePostStore` fallback) + bọc `AuthGuard`; `PostEditorForm` dùng `PostStatus.PENDING_REVIEW` thay literal `PENDING` không tồn tại.
  - **F8**: `VideoPlayer` hiện placeholder "Video không khả dụng hoặc liên kết bị lỗi" khi URL YouTube không trích được ID hoặc thiếu URL; xóa nhánh dead code.
  - **Tests**: thêm `toRelatedGroup` 2 case + `api-fallback.test.ts` 6 case.
- File tạo/sửa:
  - Tạo: `features/post/utils/api-fallback.ts`, `features/post/utils/api-fallback.test.ts`, `features/video/schemas/video-form.schema.ts`
  - Sửa: `features/{post,recipe,video}/api/*.api.ts`, `features/post/{mappers/post.mapper,mappers/post.mapper.test,queries/post.queries,types/post.model,components/post-editor-form}`, `features/recipe/{schemas/recipe-form.schema,components/recipe-editor-form}`, `features/post/schemas/post-form.schema.ts`, `features/video/components/video-player.tsx`, `app/(site)/{recipes/new,articles/new,articles/[id]/edit,videos/new}/page.tsx`, `docs/{PROGRESS,WORK-LOG}.md`
- Verify: `npx tsc --noEmit` sạch 0 lỗi; `npm test` **72/72 pass** (10 files, không regress); `npm run build` pass 26/26 routes.
- PROGRESS: UC-02 giữ 85%, UC-05 giữ 80% (ghi rõ là scaffold + fixture, chưa phải "tích hợp xong" theo BACKEND_INTEGRATION §12).
- Còn lại / rủi ro (để test tay + task sau):
  - Test tay theo `specs/005-content-media/quickstart.md` §2 (4 kịch bản) — user thực hiện.
  - `usePostStore` vẫn dùng ở articles list/search/profile + post-card/detail (dọn toàn bộ store là refactor riêng, ngoài scope F1–F9).
  - Form recipe chưa nối `useIngredientResolveQuery` vào UI chọn nguyên liệu (T043 claim nhưng code chưa có): `ingredientId` hiện luôn null → `mealPlannerEligible` false cho tới khi làm resolve-picker.
  - Khi BE chuyển `/posts`, `/uploads/signature` sang READY: chạy `sync:swagger`, thay fixture bằng live, đánh `FE integrated = Yes`.

---

## [2026-09-16] — Nối live-shape content + fix 3 lỗi user báo khi testing

- Mục tiêu: (1, 2) lọc danh mục gửi `categoryId` bị BE strict 400 `Unrecognized key`; (3) tự logout khi đăng video + cookie còn + đá về `/`.
- Nguyên nhân (soi BE `content.schemas.ts` + FE auth):
  1. `postListQuerySchema` strict chỉ nhận `category` (UUID/slug), không có `categoryId`/`tag`/`status`/`authorId`. Response thật lồng trong `revision`/`recipe`/`media`, không có counts/steps/title top-level; signature trả `uploadUrl` + camelCase; create/update cần `body`/`media`/`categoryIds`/`expectedVersion`; related `:id` phải là UUID.
  2. `AuthProvider` check `document.cookie.includes('refreshToken')` không bao giờ đúng với HttpOnly → sau F5 không silent-refresh (giả logout); access TTL chỉ 15 phút nên điền form lâu + submit 401 → refresh gãy → logout thật.
  3. Logout refresh-fail không gọi logout proxy → cookie mồ côi còn hạn → middleware đá `/login` → `/`.
- Đã làm:
  - Query: `categoryId` → `category` ở 3 api + 2 trang list; `tag` articles chuyển lọc client-side; `contracts/post-api.md` viết lại theo BE.
  - DTO/Mapper/fixtures viết lại theo `postSchema`: đọc `revision`/`recipe`/`media`, nutrition `*Grams`, ingredients BE, steps rỗng + `body`, stats 0 trung thực; `PostStatus` thêm `QUARANTINED/HIDDEN/DELETED` + nhãn Việt; related map từ postSchema.
  - Upload: request bỏ `folder`, response map `uploadUrl/apiKey/cloudName/maxBytes`, upload dùng `uploadUrl`; uploader trả metadata (`toUploadedMeta`) để ráp `media[]` qua validate strict.
  - Create/Update live-shape: `categoryIds`, `media[]`, `body` (recipe tổng hợp từ steps, blog min 100, video mô tả min 20), `expectedVersion`; delete `?expectedVersion` (dialog + 3 mutations); form truyền `coverMedia`/`videoMedia`/category UUID.
  - Auth: `AuthProvider` thử refresh khi còn user persist (bỏ check cookie); interceptor refresh-fail gọi logout proxy xóa cookies trước khi clear store.
  - UI: `RecipeDetailView` render `body` khi không có steps.
  - Tests: viết lại 3 mapper test theo shape BE (post 9, recipe 4, video 5) + giữ api-fallback 6.
- File tạo/sửa: xem diff (3 DTO, 3 fixtures, 3 mapper + tests, 4 api, 3 queries, 2 uploader, 3 editor/form/page, video schema, auth-provider/axios, delete dialog, recipe detail view, enums, models, contracts, docs).
- Verify: `npx tsc --noEmit` sạch; `npm test` **76/76 pass**; `npm run build` 26/26 routes; verify live BE `:4000`: `GET /posts?type=RECIPE&category=<uuid>` → 200 rỗng (chưa seed content), `categoryId` → 400 đúng như user báo.
- PROGRESS: UC-02 giữ 85%, UC-05 giữ 80% (BE chưa đánh READY chính thức).
- Còn lại / rủi ro:
  - BE chưa có dữ liệu content → list live rỗng, detail live 404: test tay tạo bài (login → `/recipes/new`, `/articles/new`, `/videos/new`) để có data thật rồi kiểm tra list/detail/related.
  - Nếu đăng video vẫn logout: báo lại toast hiện ra + thời gian từ lúc login tới lúc submit (nghi race REUSED revoke family — cần log BE `REFRESH_TOKEN_REUSED` để xác nhận).
  - `usePostStore` ở list/search/profile + resolve-picker nguyên liệu vẫn là follow-up riêng.

---

## [2026-09-16] — Fix log `EncodingError: The source image cannot be decoded` ở Hero

- Mục tiêu: dọn spam warn `[browser] EncodingError` bùng 6–7 lần mỗi khi mở trang chủ (UI vẫn hiển thị bình thường).
- Nguyên nhân (soi `node_modules/remotion/dist/cjs/Img.js` dòng 154–161 + `.next/dev/logs`): Remotion `<Img>` gọi `img.decode()` rồi `console.warn` khi fail, dù ảnh vẫn hiện qua fallback `onload`. File webp nguyên vẹn (RIFF/WEBP, đủ length, serve 200, optimizer decode được) — fail do race timing `decode()` sau khi gán `src` trong layout effect (dev StrictMode remount càng khiến几乎每次 đều warn).
- Đã làm:
  - `hero-food-composition.tsx`: preload 7 ảnh bằng `new Image()` + `delayRender`/`continueRender`, thay 3 `<Img>` bằng `<img>` thường (giữ nguyên transform GPU + `staticFile`).
  - `hero-food-player.tsx`: thêm `acknowledgeRemotionLicense` (dọn warn license cùng log).
- Verify: `npx tsc --noEmit` sạch; `npm run build` 26/26 routes. Cần user reload trang chủ (`/`), mở lại terminal dev để xác nhận hết warn.
- Còn lại: warn aspect-ratio `logo-horizontal.png` của `next/image` (tiền tồn, vô hại) — fix riêng nếu muốn dọn sạch log.

---

## [2026-09-16] — Nâng cấp Remotion Hero Food Animation: Chu trình biến đổi tuần hoàn liền mạch

- Mục tiêu: Nâng cấp hoạt cảnh Hero Section theo yêu cầu: sau khi thành hình món ăn hoàn chỉnh, tiếp tục xoay và chuyển hóa/tách ngược lại thành chiếc tô ở giữa cùng 5 nguyên liệu bay lượn xung quanh, tạo thành chu trình vô tận liền mạch (seamless loop) thay vì fade-out về trạng thái mặc định ban đầu.
- Đã làm:
  - Tái cấu trúc 5 pha chuyển động tuần hoàn trong `hero-food-constants.ts`:
    - Phase 1 (0–60): Orbit Harmony — Chiếc tô ở giữa với 5 nguyên liệu bay lượn điều hòa nhịp nhàng xung quanh, đường năng lượng mầm xanh tỏa sáng.
    - Phase 2 (60–95): Vortex Convergence — Tô xoay 360°, nguyên liệu xoáy ốc hội tụ vào lòng tô và hợp nhất.
    - Phase 3 (95–145): Dish Showcase — Món Rainbow Buddha Bowl hoàn chỉnh xuất hiện với hiệu ứng spring pop-in (0.85 → 1.06 → 1.0), khoe sắc thịnh soạn.
    - Phase 4 (145–205): Rotation & Transformation — Món ăn tiếp tục xoay 360° (tổng 720°), bung nở lực li tâm và chuyển hóa mượt mà (crossfade tô + 5 nguyên liệu bung tỏa ra từ lòng tô với spring overshoot).
    - Phase 5 (205–240): Seamless Loop Settle — Ổn định quỹ đạo và kết nối năng lượng, khớp chính xác 100% tọa độ, góc quay, độ mờ và vận tốc với frame 0 (loop không giật/khựng).
  - Cập nhật `hero-food-composition.tsx`:
    - Áp dụng toán học tuần hoàn: `idleFloatY` và các hàm dao động góc/khoảng cách nguyên liệu dùng chu kỳ điều hòa chuẩn $4\pi$ tại frame 240, đảm bảo giá trị tại frame 240 và frame 0 trùng khớp tuyệt đối.
    - Tô và món ăn dùng chung trục quay `totalRotation` (2 vòng 360° = 720°), triệt tiêu hoàn toàn hiện tượng lệch góc khi chuyển đổi.
    - 100% GPU Compositor properties (`translate3d`, `rotate`, `scale`, `opacity`), giữ vững 60 FPS mượt mà.
  - Cập nhật `hero-food-animation.tsx`:
    - Đồng bộ hiệu ứng phát sáng (glow pulse) của thẻ dinh dưỡng 385 kcal / 18g Protein chính xác theo thời điểm món hoàn chỉnh xuất hiện (~3.2s – 4.8s).
- File tạo/sửa:
  - Sửa: `src/components/home/hero-food-animation/{hero-food-constants.ts,hero-food-composition.tsx,hero-food-animation.tsx}`, `docs/WORK-LOG.md`
- Verify:
  - `git diff --check` trên component hoạt cảnh: 0 lỗi.
  - `npm test`: 76/76 unit tests pass.
- PROGRESS: task #0 Nền tảng giữ 70% (nâng cấp UX animation).
- Còn lại / rủi ro: Không có. Vòng lặp chuyển động mượt mà, không còn cảm giác bị ngắt quãng hay giật về trạng thái ban đầu.

---

## [2026-09-16] — Fix `INVALID_MEDIA_REFERENCE` + toast theo message BE

- Mục tiêu: (1) POST `/posts` 400 `MIME type của media không được hỗ trợ`; (2) toast hiện message generic thay vì message/fields BE.
- Nguyên nhân:
  1. `toUploadedMeta` suy MIME từ `format` Cloudinary (`jpg` thiếu `e`, `mov` thay `quicktime`) trong khi allowlist BE strict chỉ nhận `image/jpeg|png|webp|avif`, `video/mp4|webm|quicktime`. Đồng thời `ingredientId: null` tường minh cũng từng 400 (đã lược key ở đợt trước + BE đã nới null).
  2. Mọi mutation `onError` toast `err.message` của axios ("Request failed with status code 400").
- Đã làm:
  - `upload.api.ts`: ưu tiên MIME thật từ File API, chuẩn hóa `image/jpg` → `image/jpeg`, map `mov` → `video/quicktime`, chỉ suy từ `format` khi File API trống.
  - `lib/api-error.ts`: thêm `formatApiErrorFields` + `toastApiError` (message BE + tối đa 3 dòng fields); 9 mutations post/recipe/video dùng helper mới.
  - Tests: `upload.api.test.ts` 5 case, `api-error.test.ts` 4 case, thêm case lược `ingredientId` null.
- Verify: `npx tsc --noEmit` sạch; `npm test` **86/86 pass** (12 files); `npm run build` 26/26 routes.
- Test tay lại: upload ảnh/video rồi đăng bài — BE phải qua validate media, toast lỗi (nếu còn) hiện đúng message BE.

---

## [2026-09-16] — Đảm bảo upload qua chữ ký + chặn URL mock lọt payload

- Mục tiêu (user nhắc): upload ảnh/video bắt buộc qua `POST /api/v1/uploads/signature`; chống submit URL giả khi chữ ký fail.
- Đã kiểm tra live: `POST /api/v1/uploads/signature` chưa login → 401 `AUTH_REQUIRED` (route sống, đúng yêu cầu auth). Flow FE: xin chữ ký `{resourceType}` → upload trực tiếp `uploadUrl` (FormData `file/api_key/timestamp/signature/folder`, khớp cách BE ký SHA1 `folder&timestamp`) → ráp `secure_url`/`public_id` vào `media[]`.
- Đã làm:
  - `ImageUploader`/`VideoUploader`: khi rơi về mock signature thì toast warning rõ ("chỉ xem trước tạm thời") thay vì toast success gây hiểu nhầm.
  - `coverMediaInput` + `video.toCreateDto`: loại `blob:` URL và `publicId mock_` khỏi payload tạo bài.
- Verify: `npx tsc --noEmit` sạch; `npm test` **87/87 pass** (12 files).

---

## [2026-09-16] — Dọn số liệu giả ở recipe detail (rating 5.0, vote 128, badge chuyên gia)

- Mục tiêu (user báo `/recipes/f3edf895...` "hình như còn mock"): trang đã render data BE thật, nhưng mapper tự điền số giả khiến nhìn như mock.
- Đã kiểm tra live: `GET /posts/f3edf895...` 200 đầy đủ (Demo Admin seed BE, nutrition, ingredients, categories, media thật).
- Đã làm:
  - Mapper: `rating`/`ratingCount` → `undefined`, `verified`/`expertVerified` → `false`, `dietTag` → `undefined`; map thêm `allergenCodes`/`traditionWarnings`/`dietCompatibilities` thật từ BE (model bổ sung 3 fields + types).
  - Card: ẩn cụm sao khi chưa có rating, chỉ hiện kcal/protein/phút khi có số thật, tick xanh chỉ khi `verified === true`.
  - Detail: bỏ badge trường phái giả + badge "Kiểm chứng bởi Chuyên gia" giả, vote lấy `stats.likes` (bỏ 128 giả), ẩn khối rating/reviews khi chưa có data, thêm card "Tương thích & dị ứng" từ BE (allergen, meal-plan, tradition, diet).
- Verify: `npx tsc --noEmit` sạch; `npm test` **88/88 pass**; `npm run build` pass; eslint scope 0 errors.
- Lưu ý: avatar chim cánh cụt + tên "Demo Admin" là seed data của BE (data thật, chỉ nhìn lạ) — sẽ hết khi có user/content thật.

---

## [2026-09-16] — Fix tác giả demo cứng ở form sửa bài viết

- Mục tiêu (user báo trang `/articles/:id/edit` dư nội dung lạ "Tác giả: Nguyễn Lan Hương (Bạn)"): preview + logic duyệt bài dùng tác giả demo cứng thay vì dữ liệu thật.
- Nguyên nhân: `PostEditorForm` có thanh "Mô phỏng vai trò tác giả" (mock) quyết định PUBLISHED/PENDING_REVIEW, và preview render `getAuthorInfo().name` cứng.
- Đã làm:
  - Xóa thanh mô phỏng + `getAuthorInfo` (`expert-lan-anh`/`my-user` giả); quyền xuất bản lấy từ `useAuthStore().user.role` thật (CONTRIBUTOR/ADMIN → xuất bản ngay, MEMBER → chờ duyệt), hiển thị badge vai trò thật ở chế độ chỉ đọc.
  - Preview "Tác giả:" dùng tên tác giả gốc của bài đang sửa, bài mới dùng tên user đang login.
- Verify: `npx tsc --noEmit` sạch; `npm test` **88/88 pass**; eslint file 0 errors.

---

## [2026-09-16] — Motion Animation cho Header Nav & Hiệu ứng gợn sóng Dark/Light Mode

- Mục tiêu:
  1. Header Navigation: Motion animation cho pill indicator khi chuyển trang (active pill) và khi di chuột qua lại giữa các menu (hover pill).
  2. Dark/Light Mode: Hiệu ứng gợn sóng (circular wave ripple) lan tỏa từ nút toggle ra toàn màn hình khi chuyển đổi giao diện sáng/tối.
- Đã làm:
  - `src/components/layout/site-header.tsx`:
    - Tích hợp `motion/react` (`layoutId="header-active-pill"`, `layoutId="header-hover-pill"`).
    - Khi chuyển trang: Active pill (`bg-primary`) trượt mượt mà bằng spring animation từ trang cũ sang trang mới.
    - Khi di chuột: Hover pill (`bg-accent/80`) lướt nhẹ nhàng theo con trỏ chuột cho các mục chưa active.
    - Tích hợp `useReducedMotion()` và hỗ trợ mở/đóng mobile menu bằng `AnimatePresence`.
  - `src/components/layout/theme-toggle.tsx` & `src/app/globals.css`:
    - Ứng dụng native View Transition API (`document.startViewTransition`) kết hợp `clip-path: circle(0px at x y) -> circle(endRadius at x y)` mở rộng tâm sóng từ tọa độ chính xác của nút toggle ra tới góc xa nhất của màn hình trong 450ms.
    - Đồng bộ class `.dark` tức thì trước khi snapshot để loại bỏ độ trễ màu sắc.
    - Cấu hình CSS `::view-transition-old(root)` và `::view-transition-new(root)` để theme mới luôn là lớp sóng tràn lên trên.
  - `src/components/ui/inner-moon.tsx`:
    - Bổ sung hiệu ứng vòng sóng ripple rung nhẹ (`animate-ping`) cục bộ quanh nút toggle khi click, tăng cường phản hồi thị giác xúc giác (tactile feedback).
- File tạo/sửa:
  - Sửa: `src/components/layout/site-header.tsx`, `src/components/layout/theme-toggle.tsx`, `src/components/ui/inner-moon.tsx`, `src/app/globals.css`, `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 12/12 test files pass, 87/87 unit tests pass.

---

## [2026-09-16] — Thiết kế lại phần bên trái Hero Section với Text Animation VerticalCutReveal

- Mục tiêu: Nâng cấp toàn diện thiết kế phần bên trái Hero Section theo chuẩn UI/UX cao cấp, ứng dụng text animation `VerticalCutReveal` (từ hệ sinh thái `@fancy/vertical-cut-reveal` shadcn registry) cho tiêu đề chính, nâng tầm nhận diện thương hiệu VeggieConnect.
- Đã làm:
  - Tạo component chuẩn `src/components/ui/vertical-cut-reveal.tsx`:
    - Dựa trên registry chính thức của Fancy Components, tối ưu hóa cho stack `motion/react` (Motion v13) và Tailwind CSS.
    - Hỗ trợ phân đoạn `words`, `characters`, `lines`, tích hợp `Intl.Segmenter` hỗ trợ tiếng Việt có dấu và emoji trọn vẹn.
    - Animate 100% qua thuộc tính GPU compositor `translateY` trong container `overflow-hidden` tạo hiệu ứng lát cắt spring mượt mà.
    - Đảm bảo trọn vẹn accessibility (`sr-only` text cho screen readers, `prefers-reduced-motion` fallback).
  - Thiết kế lại layout bên trái `src/app/(site)/page.tsx`:
    - **Pill Badge**: Viền kính mờ, icon lá mầm cùng chấm ping xanh animated sống động (`Ứng dụng hỗ trợ ăn chay #1 tại Việt Nam`).
    - **Headline Hero**: Tiêu đề "Ăn chay đủ chất, dễ dàng mỗi ngày" chia nhịp hiển thị với hiệu ứng VerticalCutReveal; cụm từ "đủ chất," được cách điệu bằng dải màu gradient ngọc lục bảo (emerald-to-sprout).
    - **Copy Subtitle**: Typography `text-pretty`, nhịp chuyển động fade-in `motion.p` xuất hiện êm ái sau headline.
    - **Nút hành động CTAs**: Thiết kế lại với hiệu ứng hover nâng nhẹ (lift-up), bóng mờ tỏa màu thương hiệu, icon xoay nhẹ và mũi tên lướt ngang khi rê chuột.
    - **Micro Social Proof**: Cam kết "Miễn phí 100% • Không yêu cầu thẻ tín dụng • Cá nhân hóa theo thể trạng" kèm icon xác nhận tin cậy.
    - **Thẻ đo lường giá trị (Value Metric Cards)**: Chuyển đổi dãy số khô khan thành 3 card bento tinh tế có icon nền mờ và phụ đề định hướng (500+ Món thuần Việt, 50+ Quán verified, 100% Đo Calo & Đạm).
- File tạo/sửa:
  - Tạo: `src/components/ui/vertical-cut-reveal.tsx`
  - Sửa: `src/app/(site)/page.tsx`, `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 12/12 test files pass, 87/87 unit tests pass.
  - Chụp ảnh màn hình trực tiếp bằng browser: giao diện hiển thị sắc nét, cân đối hoàn hảo với khối đĩa thức ăn 3D ở bên phải.

---

## [2026-09-16] — Xóa mock pages chống nhầm data thật/giả

- Mục tiêu (user yêu cầu): dọn toàn bộ mock trực tiếp ở pages/components để không nhầm lẫn với data thật.
- Đã làm:
  - **P1a Home**: `MOCK_RECIPES` → `useRecipesQuery({limit: 4})` + skeleton/empty; xóa khối quán giả + const `RESTAURANTS`/`CATEGORIES` chết + imports thừa.
  - **P1b Search**: viết lại bằng 3 queries thật (`q`, `enabled` khi có từ khóa) + `PostCard`/`VideoCard`/`RecipeCard` chuẩn (xóa render inline legacy, link `/video/` sai → đúng); bỏ filter trường phái/sort điểm giả.
  - **P1c Restaurants**: list + `[id]` thành empty trung thực ("chờ API UC-12"), giữ khung map/filter/dialog đóng góp.
  - **P2a**: articles bỏ import store thừa; profile tab posts đọc `useArticlesQuery` + lọc theo user login (ghi chú tạm chờ filter `authorId`), xóa bài bằng `DeletePostDialog` (có `expectedVersion`).
  - **P2b**: vote/lưu → state local; editor bỏ `addPost`/`updatePost`; delete dialog bỏ `deletePost` store.
  - **P2c**: `git rm` `usePostStore`, 4 `data/mock-*.ts`, cả folder `restaurant` + `product` (orphan, không route nào dùng).
  - Giữ `__fixtures__` trong API clients (chỉ fallback khi lỗi mạng/404/5xx; BE 200 rỗng → empty thật) + cho tests.
- Verify: grep `usePostStore|/data/mock-|MOCK_(RECIPES|VIDEOS|RESTAURANTS|POSTS)|features/product` = 0 match; `npx tsc --noEmit` sạch; `npm test` **87/87 pass** (12 files); `npm run build` 26/26 routes; eslint scope 0 errors (chỉ warnings tiền tồn); fix thêm 2 errors `set-state-in-effect` + `any` + quotes phát hiện lúc lint.
- PROGRESS: % giữ nguyên (dọn mock, không endpoint mới).
- Lưu ý: có session khác sửa song song `page.tsx`/`WORK-LOG.md` (motion header, hero headline) — đã kiểm tra các sửa mock vẫn nguyên vẹn sau merge tay; user đối chiếu `git diff` trước khi commit.

---

## [2026-09-16] — Triển khai Content Review Queue (spec 006: T001–T020)

- Mục tiêu: trang kiểm duyệt cho Admin/Contributor (mở khóa luồng Member chờ duyệt), thay tab mock ở `/admin`.
- Đã làm:
  - **T001–T002**: `REVIEW_QUEUE` endpoints + enums `ReviewDecision`/`ReviewItemStatus`/`ModerationPriority`.
  - **T003–T006**: `features/review` DTO/Model/Mapper/test (5 tests: full field, null-safe, nhãn Việt, decision DTO, pagination).
  - **T007–T012 (US1)**: api strict 5 param (không fixture) + queries/mutations (toast Việt, `SELF_APPROVAL_FORBIDDEN` riêng, invalidate) + zod reason + `ReviewDecisionDialog` (đếm ký tự, disable + chú thích khi tự duyệt) + route `/review` (AuthGuard + gate ADMIN/CONTRIBUTOR, 403 thân thiện) + link header dropdown theo quyền.
  - **T013–T015 (US2)**: `ReviewQueueTable` (lọc status/type/priority + reset trang, skeleton/error/empty/phan trang, badge ưu tiên, cờ AI, số report, vô hiệu hóa nút bài của mình) + viết lại tab queue `/admin` (xóa mock QUEUE/dialog giả/đếm giả).
  - **T016–T017 (US3)**: profile đã hiện `statusLabel` đúng; ghi nhận gap BE — bài REJECTED không có trong list public và lý do từ chối chưa expose qua post detail (cần BE bổ sung mới hiện được).
  - **T018–T020**: orphan check pass; `tsc` sạch; `npm test` **93/93 pass** (13 files); `next build` pass; eslint scope 0 errors; `PROGRESS` task #10 20% → 70%; `BACKEND_INTEGRATION` review-queue `FE integrated` + changelog 2.5 (giữ `PLANNED`).
- Còn lại: test tay theo `specs/006-content-review-queue/quickstart.md` (cần 2 tài khoản Member + duyệt) — user thực hiện.

---

## [2026-09-16] — Fix triệt để loop cookie-mồ-côi khi submit video (đá về `/`)

- Mục tiêu (user báo): nhập đủ thông tin nhấn tạo video thì tự chuyển về trang `/`.
- Chẩn đoán: không có code nào trong flow video điều hướng `/`; chỉ có middleware (`/login` + cookie access còn hạn → `/`). Chuỗi đúng là: access hết hạn giữa lúc điền form/upload lâu → 401 → refresh gãy (family cũ từng bị revoke) → logout nhưng cookie còn → AuthGuard đá `/login` → middleware đá tiếp `/`.
- Verify bằng tài khoản test mới: register → refresh → `POST /posts` video → **201 `PENDING_REVIEW`** — code đúng với session sạch.
- Đã làm: thêm `forceLogout()` dùng chung (`lib/auth-refresh.ts`) — luôn gọi logout proxy xóa HttpOnly cookies trước khi clear store; interceptor và `AuthProvider` đều dùng (trước đó AuthProvider logout không xóa cookies).
- Verify: `npx tsc --noEmit` sạch; `npm test` **98/98 pass**.
- User cần làm 1 lần: xóa site data (`localhost:3000` cookies + localStorage `auth-storage`) rồi đăng nhập lại để lấy token family mới — phiên cũ đã bị revoke nên refresh mãi mãi gãy.

---

## [2026-09-16] — Avatar upload + fix hiển thị header/banner `/profile`

- Mục tiêu (user báo + ảnh chụp): form `/profile` tab info vẫn nhập URL tay; banner đầu trang và navbar dropdown không hiện ảnh dù đã lưu URL (chỉ hiện initials `DA`).
- Chẩn đoán: (1) `basic-profile-form.tsx` dùng `<Input type="url">`; (2) banner `app/(site)/profile/page.tsx:142-146` và `site-header.tsx:162-166` chỉ render `AvatarFallback`, thiếu `AvatarImage`; (3) URL canva ngoài allowlist `next.config.ts`/`safe-image.ts` nên không bền.
- Đã làm:
  - Tạo `features/profile/api/avatar-upload.api.ts` (DTO signature riêng trong profile để giữ biên feature độc lập, không import từ `features/post`; `getSignature` + `uploadToCloudinary` + fallback mock `isMock` khi `POST /uploads/signature` PLANNED).
  - Tạo `features/profile/components/avatar-uploader.tsx` (`'use client'`, shadcn Avatar/Button/Progress, validate JPG/PNG/WebP ≤5MB, progress %, toast Việt, nút Chọn/Thay/Xóa ảnh).
  - Sửa `basic-profile-form.tsx`: thay cụm URL bằng `AvatarUploader`, `setValue(..., {shouldDirty, shouldValidate:false})`, chặn submit `blob:`/mock bằng `formError` thân thiện.
  - Nới `profile.schema.ts` cho phép `blob:`/`data:image` ở tầng form để xem trước mock (BE vẫn chỉ nhận `http(s)` khi submit).
  - Thêm `AvatarImage` vào `site-header.tsx` (đọc `user.avatarUrl` từ `useAuthStore`) và banner `page.tsx`; cập nhật comment tab INFO.
  - Bổ sung mapper test URL Cloudinary `res.cloudinary.com` (không đổi logic mapper/API/queries/endpoints).
- File tạo/sửa:
  - Tạo: `src/features/profile/api/avatar-upload.api.ts`, `src/features/profile/components/avatar-uploader.tsx`
  - Sửa: `src/features/profile/components/basic-profile-form.tsx`, `src/features/profile/schemas/profile.schema.ts`, `src/components/layout/site-header.tsx`, `src/app/(site)/profile/page.tsx`, `src/features/profile/mappers/profile.mapper.test.ts`, `docs/PROGRESS.md`, `docs/WORK-LOG.md`
- Verify: `npx tsc --noEmit` sạch (0 lỗi); `npm test` **99/99 pass** (14 files, gồm profile mapper 6/6); `npm run build` pass (27 routes). Test tay còn lại: upload JPG → progress → preview tròn → Cập nhật → F5 vẫn hiện ở banner + header; Xóa ảnh → về initials; file >5MB/sai định dạng → lỗi tiếng Việt; mock signature → toast cảnh báo + chặn submit.
- PROGRESS: task #9 giữ 90% (không endpoint mới, chỉ hoàn thiện UI + verify).
- Còn lại / rủi ro: (1) `POST /uploads/signature` vẫn `PLANNED` nên môi trường chưa có BE sẽ rơi vào mock `blob:` và bị chặn submit — hết khi BE READY; (2) avatar URL host lạ (canva...) vẫn hiển thị qua `AvatarImage` nhưng nên upload lại về Cloudinary để bền + tối ưu.

---

## [2026-09-16] — Sửa lỗi click Đăng tải video bị reload trang không gọi API

- Mục tiêu (user báo): vào luồng tạo video (`/videos/new`), nhấn nút "Đăng tải video" thì bị reload (tải lại) toàn trang thay vì gọi API.
- Chẩn đoán:
  - Tại `src/app/(site)/videos/new/page.tsx:119`, thẻ form được viết: `<form onSubmit={void handleSubmit(onSubmit)} className="space-y-6">`.
  - Biểu thức `void handleSubmit(onSubmit)` bị thực thi ngay thời điểm component render và trả về `undefined`.
  - Kết quả là `onSubmit` của `<form>` nhận giá trị `undefined`, khiến việc nhấn button `type="submit"` kích hoạt hành vi mặc định của trình duyệt (native HTML form submit) dẫn tới reload toàn bộ trang web.
  - Tương tự phát hiện thêm file `src/features/review/components/review-decision-dialog.tsx:117` cũng gặp lỗi y hệt.
- Đã làm:
  - Sửa `src/app/(site)/videos/new/page.tsx`: chuyển thành `<form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6" noValidate>` để handler là callback và `handleSubmit` ngăn chặn sự kiện mặc định (`e.preventDefault()`).
  - Sửa `src/features/review/components/review-decision-dialog.tsx`: chuyển thành `<form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-2" noValidate>`.
- File tạo/sửa:
  - Sửa: `src/app/(site)/videos/new/page.tsx`
  - Sửa: `src/features/review/components/review-decision-dialog.tsx`
  - Sửa: `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit` đạt 0 lỗi type.
  - `npm test` toàn bộ 14 test files, 99/99 unit tests pass.
  - `npm run build` Next.js 16 build thành công toàn bộ 27 routes (exit code 0).

---

## [2026-09-16] — Fix lỗi upstream image response failed 404 (YouTube CDN) và cảnh báo LCP

- Mục tiêu (user báo):
  - Server log báo lỗi: `⨯ upstream image response failed for https://i.ytimg.com/vi/.../hqdefault.jpg 404` (các ID mẫu `veganDemo01`, `greenPrep01`, `mushroom001`).
  - Browser log báo: `Image with src "..." was detected as the Largest Contentful Paint (LCP). Please add the loading="eager" property if this image is above the fold.`
  - Rà soát toàn bộ các nguồn upload/nhúng ảnh & video trên web (Cloudinary, YouTube, Unsplash, Google, local).
- Chẩn đoán:
  1. Next.js image optimizer proxy `/_next/image` tải ảnh về server Next trước khi nén gửi về client. Với video YouTube có ID giả/demo từ seed data (`veganDemo01`, `greenPrep01`, `mushroom001`) hoặc link bị xóa, Google CDN trả về 404 khiến Next.js server văng lỗi "upstream image response failed 404".
  2. Thumbnail YouTube vốn đã được nén WebP/JPEG trên CDN toàn cầu của Google, việc ép đi qua proxy nén của Next.js là dư thừa và làm hỏng log server khi có link 404.
  3. Cảnh báo LCP xảy ra khi thẻ `<Image>` nằm ngay đầu trang (above-the-fold) bị lazy loading mặc định.
- Đã làm:
  - Sửa `src/components/shared/safe-image.tsx`:
    - Thêm prop `unoptimized?: boolean`.
    - Tự động bật `unoptimized` đối với thumbnail từ YouTube (`i.ytimg.com`, `img.youtube.com`). Trình duyệt sẽ tải trực tiếp từ Google CDN. Khi video ID không tồn tại, trình duyệt nhận 404 và tự động kích hoạt `onError` chuyển sang `fallbackSrc` (Unsplash) mà hoàn toàn KHÔNG gọi qua Next.js server, triệt tiêu 100% lỗi upstream 404 ở server console.
    - Bổ sung `loading={priority ? 'eager' : 'lazy'}` và `fetchPriority={priority ? 'high' : 'auto'}` cho nhánh `<img>` native fallback.
  - Sửa `src/features/video/components/video-card.tsx` và `src/app/(site)/videos/page.tsx`:
    - Nhận `priority?: boolean`, truyền `priority={index === 0}` cho video card đầu tiên nằm above the fold để tối ưu LCP.
  - Sửa `src/features/recipe/components/recipe-card.tsx` và `src/app/(site)/recipes/page.tsx`:
    - Nhận `priority?: boolean`, truyền `priority={index === 0}` cho công thức đầu tiên.
- File tạo/sửa:
  - Sửa: `src/components/shared/safe-image.tsx`
  - Sửa: `src/features/video/components/video-card.tsx`
  - Sửa: `src/app/(site)/videos/page.tsx`
  - Sửa: `src/features/recipe/components/recipe-card.tsx`
  - Sửa: `src/app/(site)/recipes/page.tsx`
  - Sửa: `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit` đạt 0 lỗi type.
  - `npm test` toàn bộ 14 test files, 99/99 unit tests pass.

---

## [2026-09-16] — Tạo route `/admin/dashboard`, `/contributor/dashboard` và đồng bộ điều hướng theo role

- Mục tiêu:
  - Tạo route `/admin/dashboard` và đưa hàng chờ kiểm duyệt (`/review`) vào bảng điều khiển admin cho role `ADMIN`.
  - Tạo route `/contributor/dashboard` cho role `CONTRIBUTOR` để người đóng góp có dashboard làm việc riêng.
  - Đồng bộ luồng điều hướng (Header dropdown, middleware, auto-redirect từ `/review`).
- Đã làm:
  - Tạo trang `/admin/dashboard` (`src/app/(admin)/admin/dashboard/page.tsx`) với đầy đủ các tab: Kiểm duyệt (`queue`), Người dùng (`users`), Cây danh mục (`categories`), Nguyên liệu (`ingredients`), Audit logs (`logs`), hỗ trợ query parameter `?tab=`.
  - Sửa `/admin` (`src/app/(admin)/admin/page.tsx`) tự động chuyển hướng sang `/admin/dashboard` giữ nguyên query parameters.
  - Sửa `AdminLayout` (`src/app/(admin)/admin/layout.tsx`) cập nhật toàn bộ links trỏ sang `/admin/dashboard`, đồng bộ active state theo URL tab và logo link.
  - Tạo trang `/contributor/dashboard` (`src/app/(site)/contributor/dashboard/page.tsx`) với `AuthGuard` cho `CONTRIBUTOR` và `ADMIN`, giao diện chuẩn thương hiệu VeggieConnect gồm: Banner chào mừng + Badge vai trò, Quick Metric Cards (Hàng chờ duyệt, Tiêu chuẩn thuần chay, Trách nhiệm phản hồi), Tab hàng chờ kiểm duyệt (`ReviewQueueTable`), Tab lối tắt đóng góp (`/recipes/new`, `/articles/new`, `/videos/new`), Tab tiêu chuẩn kiểm duyệt nội dung cộng đồng.
  - Sửa `/review` (`src/app/(site)/review/page.tsx`) thành trang điều hướng thông minh: `ADMIN` -> `/admin/dashboard?tab=queue`, `CONTRIBUTOR` -> `/contributor/dashboard`, `MEMBER` -> màn hình từ chối quyền truy cập.
  - Sửa `SiteHeader` (`src/components/layout/site-header.tsx`) cập nhật menu dropdown theo vai trò: Admin hiển thị Bảng điều khiển Quản trị (`/admin/dashboard`) và Kiểm duyệt bài viết (`/admin/dashboard?tab=queue`); Contributor hiển thị Bảng điều khiển Contributor (`/contributor/dashboard`).
  - Sửa `src/middleware.ts` bổ sung `matcher` và kiểm tra quyền truy cập cho `/contributor/:path*` (chỉ cho phép `CONTRIBUTOR` và `ADMIN`).
- File tạo/sửa:
  - Tạo: `src/app/(admin)/admin/dashboard/page.tsx`
  - Sửa: `src/app/(admin)/admin/page.tsx`
  - Sửa: `src/app/(admin)/admin/layout.tsx`
  - Tạo: `src/app/(site)/contributor/dashboard/page.tsx`
  - Sửa: `src/app/(site)/review/page.tsx`
  - Sửa: `src/components/layout/site-header.tsx`
  - Sửa: `src/middleware.ts`
  - Sửa: `docs/PROGRESS.md`
  - Sửa: `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit` đạt 0 lỗi type.
  - `npm test` toàn bộ 14 test files, 99/99 unit tests pass.
  - `npm run build` Next.js 16 build thành công toàn bộ 29 routes (exit code 0).
- PROGRESS: Task 10 (Moderation UC-11 + Contributor UC-16/17) 70% → 80%.

---

## [2026-09-16] — Tích hợp Meal Planner API thật (spec 007-meal-planner-integration, T001–T027)

- Mục tiêu: thay UI mock (`const PLAN`, `INITIAL_SAVED_PLANS`) ở `/meal-plans` + `/meal-plans/saved` bằng consumer API thật cho 5 endpoint đã `READY` (generate/list/detail/swap/delete), đúng kiến trúc DTO→Model→Mapper→API→Query.
- Đã làm:
  - `sync:swagger` thành công với BE `:4000` (71 endpoints, catalog hết stale) — `docs/api/meal-plans.md` không lệch contract.
  - `api-endpoints.ts` (+nhánh `MEAL_PLANS` 5 path), `enums` (+`MealPlanGoal`, `NutritionDataQuality`, `MealType`).
  - `features/meal-plan` mới: DTO/Model/Mapper/test (envelope đọc trực tiếp, `toListModel`/`toDetailModel` riêng, `pickField` + `safe*` mọi field), api 5 ops, queries (Key Factory + 5 hooks, toast + invalidate theo `error.code`), zod schema (weekStart Thứ Hai UTC + goal), util `newIdempotencyKey`, 7 components (generate-form, plan-card, day-grid, shopping-list, warnings-banner, swap-dialog, delete-dialog).
  - Viết lại `/meal-plans` (AuthGuard + form + 5 bản gần nhất), `/meal-plans/saved` (lịch sử + `?weekStart=` + phân trang), tạo `/meal-plans/[id]` (21 ô + đi chợ + warnings + B12 + swap/delete).
  - Contract verification live bằng tài khoản seed member: generate ✓ (21/21 FILLED, warnings `CALORIE_TOLERANCE_WIDENED/RECIPE_REPEATED/MICRONUTRIENT_DATA_PARTIAL`), list ✓ (summary không slots), detail ✓, swap ✓ (`expectedVersion` = `lockVersion`, món mới về), delete ✓ (`{deleted:true}`).
  - Phát hiện và đã fix từ shape thật: shopping item là `{ingredientId,canonicalName,amount,unit}` (không phải `name/quantity`); calories nằm ở slot-level, recipe không có nutrition (ẩn dòng macro khi = 0); thêm mapping `MICRONUTRIENT_DATA_PARTIAL`.
  - Test data đã dọn (xóa plan test vừa tạo, không còn rác).
- File tạo/sửa:
  - Tạo: `src/features/meal-plan/{types,mappers,api,queries,schemas,utils,components}`, `src/app/(site)/meal-plans/[id]/page.tsx`, `specs/007-meal-planner-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(site)/meal-plans/{page,saved/page}.tsx`, `docs/{BACKEND_INTEGRATION,PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 113/113 pass (meal-plan 14/14, không regress); `eslint` scope sạch (0 errors, 0 warnings — fix `set-state-in-effect` ở swap-dialog và `form.watch` memo warning ở generate-form); `npm run build` pass (27 routes, thêm `/meal-plans/[id]`).
- PROGRESS: task #6 (Menu UC-06) 30% → 95% (còn test tay trình duyệt MP-1..MP-6).
- Còn lại / rủi ro: (1) test tay trình duyệt MP-1..MP-6 theo quickstart 007 với tài khoản seed member; (2) `personalization` GET/PUT vắng trong registry BACKEND_INTEGRATION (có trong swagger) — cần BE bổ sung trước khi làm recommendations.

---

## [2026-09-17] — Khắc phục luồng hiển thị công thức mới tạo (PENDING_REVIEW) và đồng bộ trạng thái kiểm duyệt

- Mục tiêu (user báo):
  - Khi tạo công thức tại `/recipes/new` báo thành công, nhưng quay lại trang `/recipes` thì không thấy hiển thị, call API không có data.
- Chẩn đoán từ code Backend (`content.service.ts`, `content-publication.policy.ts`, `content.repository.ts`):
  1. Theo quy định nghiệp vụ Backend (`ModeratedPublicationPolicy`), mọi công thức do `MEMBER` (hoặc `CONTRIBUTOR` chưa duyệt chuyên môn) tạo ra đều được lưu vào CSDL với trạng thái `PENDING_REVIEW` (Chờ duyệt).
  2. Trang `/recipes` gọi `GET /api/v1/posts?type=RECIPE` (`listPublished`), backend truy vấn SQL bắt buộc `status = 'PUBLISHED'` và `published_revision_id IS NOT NULL`. Vì công thức vừa tạo đang ở `PENDING_REVIEW`, CSDL trả về 0 kết quả (`data: []`).
  3. Frontend trước đó không có thông báo rõ ràng sau khi gửi, trang chi tiết `/recipes/[id]` thiếu banner `PENDING_REVIEW`, trang `/recipes` chỉ hiện EmptyState thông thường gây hiểu nhầm API bị mất dữ liệu, và khi Admin duyệt bài ở review-queue thì chưa invalidate cache `recipes`.
- Đã làm:
  - Sửa `src/app/(site)/recipes/new/page.tsx`:
    - Thêm Dialog thông báo gửi công thức thành công khi trạng thái là `PENDING_REVIEW`, giải thích rõ bài viết đang chờ Ban kiểm định duyệt trước khi xuất bản công khai.
    - Cung cấp các nút điều hướng rõ ràng: "Xem bài viết của bạn", "Về kho công thức", và nút "Phê duyệt ngay" nếu tài khoản là Admin/Contributor.
  - Sửa `src/features/recipe/components/recipe-detail-view.tsx`:
    - Thêm Banner màu hổ phách cảnh báo công thức đang ở trạng thái `PENDING_REVIEW` (chỉ tác giả và người kiểm duyệt xem được).
    - Thêm Banner cảnh báo khi công thức bị `REJECTED` kèm thông tin từ chối.
  - Sửa `src/app/(site)/recipes/page.tsx`:
    - Cập nhật `EmptyState` giải thích rõ quy trình kiểm duyệt thuần chay 100% cho người dùng.
    - Thêm nút tắt đến "Hàng chờ duyệt bài" cho Admin/Contributor.
    - Thêm link hướng dẫn theo dõi bài viết tại "Hồ sơ › Bài viết của tôi".
  - Sửa `src/app/(site)/profile/page.tsx`:
    - Hợp nhất cả Công thức (`useRecipesQuery`) và Cẩm nang (`useArticlesQuery`) vào tab "Bài viết của tôi", cho phép tác giả xem danh sách tất cả các bài viết do mình tạo cùng trạng thái kiểm duyệt tương ứng.
  - Sửa `src/features/review/queries/review.queries.ts`:
    - Bổ sung invalidate query cache cho `['recipes']`, `['articles']`, `['videos']` khi duyệt bài thành công (`useApprovePostMutation`), giúp trang `/recipes` cập nhật ngay lập tức sau khi duyệt.
- File tạo/sửa:
  - Sửa: `src/app/(site)/recipes/new/page.tsx`
  - Sửa: `src/features/recipe/components/recipe-detail-view.tsx`
  - Sửa: `src/app/(site)/recipes/page.tsx`
  - Sửa: `src/app/(site)/profile/page.tsx`
  - Sửa: `src/features/review/queries/review.queries.ts`
  - Sửa: `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit` đạt 0 lỗi type.
  - `npm test` toàn bộ 15 test files, 113/113 unit tests pass.
  - `npm run build` Next.js 16 build thành công toàn bộ 29 routes (exit code 0).

---

## [2026-09-17] — Redesign toàn bộ giao diện Authentication VeggieConnect (SaaS Scandinavian Split 50/50)

- Mục tiêu:
  - Biến trang Authentication từ cảm giác "form đăng nhập + mockup điện thoại Remotion ở cột trái" thành trải nghiệm authentication premium, hiện đại, đậm chất thương hiệu VeggieConnect (Minimal Scandinavian + AI-Powered Plant-based Lifestyle).
  - Nghiêm cấm phá vỡ logic: bảo toàn 100% auth flow, API endpoints, DTO/Model/Mapper, hooks, Zod validation schemas, token/cookie handling, role-based redirect logic.
- Đã làm:
  - Cột trái: Loại bỏ Remotion video player và thay thế bằng `AuthEditorialHero`:
    - Eyebrow: `YOUR PLANT-BASED COMPANION` với botanical badge.
    - Headline: `Eat well. Connect deeply.` (Be Vietnam Pro, 48-60px, tương phản cao, nhịp nhàng).
    - Supporting text: "Khám phá công thức, địa điểm và những lựa chọn phù hợp với hành trình ăn chay của bạn."
    - Visual composition: Tận dụng ảnh ẩm thực thực tế WebP tối ưu (`/hero/optimized/completed-dish.webp`), nền organic shapes và 3 floating ecosystem feature cards (`✦ VEGGIE AI`, `📍 GẦN BẠN`, `♡ CỘNG ĐỒNG`) với GPU compositor micro-motion (`transform: translate3d`, `opacity`, hỗ trợ `prefers-reduced-motion`).
  - Cột phải: Nâng cấp `AuthCard` trong `src/app/(auth)/login/page.tsx`:
    - Bo góc lớn cao cấp `rounded-[28px]`, khoảng đệm `p-7 sm:p-9`, đổ bóng mịn màng đa tầng (`shadow-[0_20px_50px_rgba(29,43,34,0.06)]`).
    - Segmented control tabs hiện đại `[ Đăng nhập ] [ Tạo tài khoản ] [ Khôi phục ]` với hiệu ứng lò xo mượt mà (`layoutId="active-auth-tab"`).
    - Nút Google ID viền thanh lịch, chỉ báo an toàn dữ liệu và cộng đồng chuẩn mực.
  - Layout & Header/Footer (`src/app/(auth)/layout.tsx`):
    - Chia đôi tỷ lệ chuẩn 50/50 trên desktop (`lg:grid-cols-2`).
    - Header: Căn chỉnh logo thương hiệu, nút "← Về trang chủ" dạng pill thanh lịch kèm `ThemeToggle`.
    - Mobile: Bố cục dọc thông minh Logo → Auth Card (tiêu điểm chính) → `AuthCompactBrand` bên dưới, triệt tiêu 100% tràn viền ngang.
  - Form Fields (`login-form.tsx`, `register-form.tsx`):
    - Chuẩn hóa chiều cao ô nhập liệu `h-12` (48px), bo góc `rounded-xl` (12px), focus ring xanh thương hiệu (`#287D32`).
    - Chuẩn hóa nút submit `h-12` (48px), bo góc 12px, font-semibold với micro-interaction `active:scale-[0.99]`.
    - Nâng cấp bộ đo `PasswordStrength` trong `RegisterForm` với thanh tiến trình 4 nấc bo tròn.
    - Sửa type `SafeImageProps.src` cho phép `string | null | undefined` an toàn tuyệt đối với dữ liệu người dùng.
- File tạo/sửa:
  - Tạo:
    - `src/features/auth/components/auth-editorial-hero.tsx`
    - `src/features/auth/components/auth-compact-brand.tsx`
  - Sửa:
    - `src/app/(auth)/layout.tsx`
    - `src/app/(auth)/login/page.tsx`
    - `src/features/auth/components/login-form.tsx`
    - `src/features/auth/components/register-form.tsx`
    - `src/components/shared/safe-image.tsx`
    - `docs/PROGRESS.md`
    - `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type (hoàn toàn sạch).
  - `npm test`: Toàn bộ 15 test files, 113/113 tests pass (auth mapper 12/12 pass, không hồi quy).
  - `npm run build`: Next.js production build thành công 100% cả 29 routes tĩnh và dynamic.
  - Browser testing với `browser_subagent`: Kiểm tra trực tiếp trên Chrome ở độ phân giải Desktop (1280x800) và Mobile (390x844), xác nhận tab transition mượt mà, không có console errors, không tràn viền ngang, video recording đã lưu.
- PROGRESS: Task #1 (Auth UC-01) giữ 95% (hoàn thành nâng cấp giao diện toàn diện, bảo toàn toàn bộ logic nghiệp vụ).

---

## [2026-09-16] — Tích hợp Chat AI private (spec 008-ai-chat-integration, T001–T026)

- Mục tiêu: thay UI mock (`HISTORY`, `NUTRIENTS` cứng) ở `/assistant` bằng consumer API thật cho 5 endpoint chat private đã `READY` (sessions, history, SSE stream, feedback), khách dùng được không cần đăng nhập.
- Đã làm:
  - `sync:swagger` thành công với BE `:4000` (71 endpoints) — `docs/api/ai-chat.md` không lệch contract.
  - `api-endpoints.ts` (+nhánh `CHAT` 3 path), `enums` (+`ChatRole`, `ChatMessageStatus`, `FeedbackValue`, `ChatOwnerType`).
  - `features/chat` mới: DTO/Model/Mapper/test (envelope trực tiếp, `parseSseEvent` thuần test không mạng), api axios 4 ops + `chat-stream.ts` (`fetch` POST + `AbortController`, tách khỏi interceptor), queries (Key Factory, list sessions `enabled: isAuthenticated`, buffer stream ephemeral ở `useState`, commit khi `message_complete`), zod composer (rỗng/2000 ký tự), 7 components (bubble, composer, disclaimer, session-list, feedback-buttons, quota-banner, fallback-notice).
  - Viết lại `/assistant` (thread + composer + sidebar phiên + `?session=` deep-link, KHÔNG AuthGuard, đủ 4 trạng thái).
  - Contract verification live: guest tạo phiên ✓ (`owner=GUEST`, cookie `chatGuest` HttpOnly 7 ngày), member tạo/liệt kê phiên ✓, SSE stream ✓ (`message_start`/`content_delta`/`message_complete`/`quota`), history ✓ đúng shape DTO, feedback upsert ✓ (`UP`).
  - Phát hiện và đã fix từ shape thật: quota có `resetAt` ISO trong event `quota` (mapper format `HH:mm dd/MM` thay vì hiện ISO thô); `message_complete` kèm full message + quota inline.
- File tạo/sửa:
  - Tạo: `src/features/chat/{types,mappers,api,queries,schemas,components}`, `specs/008-ai-chat-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(site)/assistant/page.tsx`, `docs/{BACKEND_INTEGRATION,PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 125/125 pass (chat 12/12, không regress); `eslint` scope sạch (0 errors, 0 warnings); `npm run build` pass (gồm `/assistant` viết lại).
- PROGRESS: task #7 (Chatbot UC-07) 20% → 95% (còn test tay trình duyệt AC-1..AC-6).
- Còn lại / rủi ro: (1) test tay trình duyệt AC-1..AC-6 theo quickstart 008 (khách ẩn danh + member seed); (2) sharing công khai + verification chuyên gia vẫn `PLANNED` — UI không giới thiệu 2 khả năng này.

---

## [2026-09-17] — Sửa lỗi chữ bị xuống dòng trên Navbar khi chưa đăng nhập

- Mục tiêu: Khắc phục triệt để hiện tượng các mục điều hướng trên thanh Navbar ("Trang chủ", "Khám phá món", "Cẩm nang", "Video nấu ăn", "Thực đơn tuần", "Bản đồ quán") bị ngắt xuống 2 dòng trên màn hình desktop (1280px–1440px) khi người dùng chưa đăng nhập.
- Nguyên nhân:
  - Khi chưa đăng nhập, nút "Đăng nhập" chiếm chiều ngang lớn hơn (~95px) so với Avatar (~36px).
  - Mục `Thực đơn tuần` vừa được kích hoạt lại trong `NAV_ITEMS` (tổng 6 mục thay vì 5).
  - Các thẻ `Link` thiếu `whitespace-nowrap` và `shrink-0`, dẫn tới việc flexbox tự động bẻ chữ xuống 2 dòng khi không gian bị ép.
  - Ô tìm kiếm `<form>` mang `flex-1` không giới hạn `min-w` khiến trên màn hình `xl` (1280px) bị co rúm thành một nút tròn nhỏ.
- Đã làm:
  - Thêm `whitespace-nowrap` và `shrink-0` vào toàn bộ các `Link` trong `nav` (chữ không bao giờ bị gãy dòng).
  - Tinh chỉnh padding & typography responsive: `px-2.5 py-1.5 text-xs xl:text-[13px] 2xl:px-3.5 2xl:py-2 2xl:text-sm`.
  - Thêm `shrink-0` cho `<nav>`, bỏ `ml-2` dư thừa, thu gọn gap giữa các nav items `gap-0.5 2xl:gap-1`.
  - Chuẩn hóa container: `gap-2 xl:gap-3 2xl:gap-4`.
  - Cấu hình ô tìm kiếm responsive chính xác: `hidden items-center md:flex md:flex-1 md:max-w-xs xl:w-40 xl:flex-none 2xl:w-60 2xl:max-w-xs`, đổi placeholder ngắn gọn `Tìm món chay...` không bị xén chữ.
  - Chuẩn hóa nút "AI Trợ lý" thành `size="sm"` (`h-9`) đồng bộ với nút "Đăng nhập" và `ThemeToggle`.
  - Bổ sung nút tìm kiếm icon cho mobile view (`md:hidden`).
- File tạo/sửa:
  - Sửa `src/components/layout/site-header.tsx`
  - Sửa `docs/WORK-LOG.md`
- Verify:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 16 test files, 125/125 tests passed.
  - Kiểm tra trực quan bằng subagent ở các viewport 1280x800, 1366x768, 1440x900 ở cả Light mode và Dark mode: tất cả các mục điều hướng, ô tìm kiếm và các nút hành động hiển thị thẳng hàng, sang trọng, không còn bất kỳ hiện tượng xuống dòng hay vỡ giao diện nào.
- PROGRESS: Giữ nguyên tiến độ các module chức năng, hoàn thành tối ưu UX/UI Shell Header.

---

## [2026-09-16] — Tích hợp Recommendations (spec 009-recommendations-integration, T001–T026)

- Mục tiêu: gợi ý home đã lọc luật cứng + bật/tắt consent + ghi behavior event ngầm (fire-and-forget) cho 4 capability đã xác minh live.
- Đã làm:
  - `sync:swagger` thành công với BE `:4000` (71 endpoints) — `docs/api/recommendations.md` không lệch.
  - `api-endpoints.ts` (+nhánh `RECOMMENDATIONS` 3 path), `enums` (+`BehaviorEventType` 8 loại).
  - `features/recommendation` mới: DTO/Model/Mapper/test (7 nhãn lý do + fallback mã gốc, constraints gọn, 8 builders đúng shape từng loại, sai → null không gửi), api 4 ops (event nuốt lỗi), queries (home/consent `enabled: isAuthenticated`, set-consent mutation + invalidate), hook dùng chung `src/hooks/use-track-behavior-event.ts` (check consent cache, dedupe view 60s, UUID mới mỗi thao tác — đặt ở `src/hooks/` để không vi phạm biên feature).
  - US1: 4 components + `RecommendedForYou` gắn vào `page.tsx` (member only, skeleton chống CLS, thay vị trí mock slice).
  - US2: `ConsentSwitch` thật thay switch mock ở tab privacy `/profile` (gửi lại `consentVersion` từ GET).
  - US3: điểm chạm VIEW_RECIPE (`recipes/[id]`), SEARCH (`search`), RATE/BOOKMARK (cơ chế `entityId` optional ở `vote-control` — chưa caller nào truyền nên 0 traffic giả), CHAT_TOPIC (mã BE phân loại từ `message_complete`, mở rộng stream result + callback).
  - Contract verification live: personalization GET ✓ (`behavior-personalization-v1`), home ✓ (`behavioral-v1`, reasons thật), event SEARCH ✓, PUT off → home `personalized:false` + event bị `PERSONALIZATION_CONSENT_REQUIRED` ✓, restore on ✓ (không để lại rác trạng thái).
- File tạo/sửa:
  - Tạo: `src/features/recommendation/{types,mappers,api,queries,components}`, `src/hooks/use-track-behavior-event.ts`, `specs/009-recommendations-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(site)/{page.tsx,profile/page.tsx,search/page.tsx,recipes/[id]/page.tsx,assistant/page.tsx}`, `components/shared/vote-control.tsx`, `features/chat/{api/chat-stream.ts,queries/chat.queries.ts}`, `docs/{BACKEND_INTEGRATION,PROGRESS,WORK-LOG}.md`
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 137/137 pass (recommendation 12/12, không regress); `eslint` scope 0 errors (3 warnings có sẵn từ trước); `npm run build` pass.
- PROGRESS: task #12 mới (Recommendations) → 90% (còn test tay trình duyệt RC-1..RC-5).
- Còn lại / rủi ro: (1) test tay RC-1..RC-5 với 2 tài khoản seed khác khẩu vị; (2) `DELETE behavior-history` vẫn `PLANNED` — UI không giới thiệu; (3) `profile/page.tsx` + `search` + home đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-16] — Scaffold Community live-shape + fixture (spec 010-community-integration, T001–T029)

- Mục tiêu: đủ 7 tầng community theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; ngày nối live chỉ sửa 1 file api.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/community.md` không lệch.
  - `api-endpoints.ts` (+nhánh `COMMUNITY` 7 path kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`CommentStatus`).
  - `features/community` mới: DTO đủ 11 ops/Model/Mapper/test (ép reply 1 tầng ở mapper, placeholder null-safe, rating/bookmark null-safe) + 12 tests; 3 fixtures bám contract; api fixture 11 hàm (kho trong bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 8 hooks, invalidate đúng key); zod comment/rating; 7 components (item/form/thread/vote/summary/rating/bookmark/list).
  - Nâng cấp `comment-section` shared (xóa 404 dòng mock: bác sĩ Lan Anh, pravatar, setTimeout, rate-limit giả) thành wrapper `CommentThread`; gắn thread/summary/vote vào 3 detail (recipe/post/video) + rating/bookmark (recipe) + bookmark (video) + bookmarks list ở tab posts `/profile`.
  - KHÔNG truyền `entityId` vào `VoteControl` mock (tránh event giả từ vote giả); cơ chế `entityId` optional sẵn cho ngày community live.
  - Sự cố encoding: 1 lần dùng `Set-Content` qua shell làm hỏng UTF-8 file mapper — đã viết lại toàn bộ bằng Write tool, verify bytes + 12/12 tests; từ nay chỉ dùng Read/Edit/Write.
- File tạo/sửa:
  - Tạo: `src/features/community/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/010-community-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `components/shared/comment-section.tsx`, `app/(site)/profile/page.tsx`, `features/{recipe,post,video}/components/*-detail-view.tsx`, `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 151/151 pass (community 12/12, không regress); `eslint` scope 0 errors (1 warning `itemTitle` có sẵn); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong community api.
- PROGRESS: task #3 (Comment/Vote UC-03) 20% → 70% (scaffold live-shape; test tay CM + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CM-1..CM-4 + check Network 0 request; (2) nối live khi BE READY (task riêng: thay thân api, xóa fixtures khỏi bundle); (3) các file detail/profile đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-16] — Scaffold Moderation-admin live-shape + fixture (spec 011-moderation-admin-integration, T001–T026)

- Mục tiêu: đủ 7 tầng moderation-admin theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; 3 tabs mới trong `/admin/dashboard` hiện có.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/moderation-admin.md` không lệch.
  - `api-endpoints.ts` (+nhánh `MODERATION_ADMIN` 6 path kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`ModerationDecision`, `ReportStatus`, `ReportTargetType`).
  - `features/moderation` mới: DTO đủ 6 ops/Model/Mapper/test (label Việt, audit entry, null-safe) + 12 tests; 3 fixtures bám contract; api fixture 6 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 6 hooks, map sẵn `REPORT_REVIEW_CONFLICT`/`SELF_MODERATION_FORBIDDEN`/`PROTECTED_ADMIN_ACCOUNT`/`USER_STATUS_CONFLICT`/`COMMENT_NOT_MODERATABLE`); zod 3 schema (reason bắt buộc); 6 components (reports-table, resolve-dialog, mod-users-table, user-status-dialog, mod-comments-table, comment-status-dialog).
  - Mở rộng `Tab` union + `parseTabParam` + mảng tabs dashboard (`reports`/`mod-users`/`mod-comments`, icon Flag/UserCog/MessagesSquare); KHÔNG đụng tab `users` sẵn có; giữ `Suspense`/`?tab=`/RBAC hiện có.
  - Lỗi `eslint set-state-in-effect` ở dashboard là có sẵn (không thuộc diff) — không sửa, để session sở hữu xử lý.
- File tạo/sửa:
  - Tạo: `src/features/moderation/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/011-moderation-admin-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(admin)/admin/dashboard/page.tsx` (tabs only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 163/163 pass (moderation 12/12, không regress); `eslint` scope 0 errors (lỗi dashboard có sẵn, ngoài scope); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong moderation api.
- PROGRESS: task #10 (UC-11/16/17) 80% → 85% (scaffold moderation-admin; test tay MA + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay MA-1..MA-4 + check Network 0 request + verify MEMBER bị đá khỏi dashboard; (2) nối live khi BE READY; (3) dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-16] — Scaffold Contributors live-shape + fixture (spec 012-contributor-applications, T001–T025)

- Mục tiêu: đủ 7 tầng contributors theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; tuyệt đối không cấp quyền theo `requestedType`, không đụng luồng đăng ký của auth.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — 2 file contract không lệch.
  - `api-endpoints.ts` (+nhánh `CONTRIBUTOR`/`ADMIN_CONTRIBUTOR` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng lại enum `ContributorType`/`ContributorApplicationStatus` (T003 rà soát, không tạo mới).
  - `features/contributor` mới: DTO đủ 4 ops (review oneOf đúng BE)/Model/Mapper/test (label Việt, rút gọn experience, oneOf mapping) + 12 tests; fixtures (pending/history/cooldown/queue bám contract); api fixture 4 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 4 hooks, map sẵn PENDING/REAPPLY/NOT_ALLOWED/TYPE_UNCHANGED/ALREADY_REVIEWED); zod (submit min 20 + links URI ≤5, review discriminatedUnion).
  - US1: form nộp (chặn admin/PENDING/cooldown kèm ngày) + lịch sử + tab `contributor` ở `/profile` (query 1 lần truyền xuống, tránh setState-in-render).
  - US2: queue-table (lọc/tìm kiếm) + review dialog (oneOf qua safeParse, không RHF vì discriminated union) + tab `contrib-apps` dashboard.
  - US3: chặn đổi cùng nhóm (`CONTRIBUTOR_TYPE_UNCHANGED` ở form) + hiện người duyệt/ngày.
  - Fix eslint `react-hooks/purity` (Date.now trong render → useState initializer).
- File tạo/sửa:
  - Tạo: `src/features/contributor/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/012-contributor-applications/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(site)/profile/page.tsx` (tab only), `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 175/175 pass (contributor 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong contributor api.
- PROGRESS: task #10 (UC-11/16/17) 85% → 90% (scaffold contributors; test tay CA + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CA-1..CA-4 + check Network 0 request; (2) nối live khi BE READY; (3) profile/dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Trust-safety leftovers (spec 013-trust-safety-leftovers, T001–T024)

- Mục tiêu: quét sạch 2 endpoint còn sót (`POST /reports`, `DELETE behavior-history`) ở dạng scaffold fixture, 0 request live; thay nút toast giả ở privacy.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — 2 file contract không lệch.
  - `api-endpoints.ts` (+nhánh `SAFETY` kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`ReportReasonCode`, `ReportTargetKind` riêng, suýt ghi đè `CommentStatus` — đã khôi phục và kiểm kê đủ 37 enum).
  - `features/safety` mới: DTO đủ 2 ops/Model/Mapper/test (6 nhãn Việt + fallback, UUID guard) + 12 tests; fixtures; api fixture 2 hàm (kho trùng, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (2 hooks, map sẵn SELF/DUPLICATE, xóa xong invalidate home+consent cold-start); zod; 4 components (2 dialogs ở lại feature, nút báo cáo nâng lên `components/shared` để community dùng chéo đúng biên module).
  - Gắn `ReportButton` vào 3 detail (authorId chặn tự báo cáo; video không có author id nên bỏ qua chặn) + `CommentItem`; thay nút toast giả privacy bằng `DeleteHistoryButton` (giữ nút download-data ngoài phạm vi).
- File tạo/sửa:
  - Tạo: `src/features/safety/{types,mappers,api,queries,schemas,components,__fixtures__}`, `src/components/shared/report-{button,dialog}.tsx`, `specs/013-trust-safety-leftovers/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `features/{recipe,post,video}/components/*-detail-view.tsx`, `features/community/components/comment-item.tsx`, `app/(site)/profile/page.tsx` (nút xóa), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 187/187 pass (safety 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong safety api; grep 0 chuỗi toast giả cũ.
- PROGRESS: task #13 mới → 70% (scaffold; test tay TS + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay TS-1..TS-3 + check Network 0 request; (2) nối live khi BE READY; (3) detail/profile/comment đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Chat sharing/verification (spec 014-chat-sharing-verification, T001–T026)

- Mục tiêu: quét sạch 3 endpoint chat còn sót (share/public/verify) ở dạng scaffold fixture, 0 request live; DTO suy luận vì không có schema swagger.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/ai-chat.md` vẫn chỉ 5 private ops (3 endpoint mới vắng mặt, đúng PLANNED).
  - `api-endpoints.ts` (+nhánh `CHAT_SHARING` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng lại enum hiện có (T003 rà soát, không tạo mới).
  - Mở rộng `features/chat`: DTO suy luận/Model/Mapper/test (shareUrl `?share=`, ẩn danh hóa, vai trò) + 12 tests; fixtures (share mở/thu hồi/public gồm 1 đã verify); api fixture 3 hàm (share lại sinh shareId mới, tìm kiếm client, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (public KHÔNG gate auth, mutations + invalidate); zod (xác nhận phạm vi + note kiểm chứng).
  - US1: nút chia sẻ qua slot `actions` có sẵn + dialog (xác nhận phạm vi bắt buộc, copy clipboard + fallback, thu hồi) + link Khám phá ở header.
  - US2: route `/assistant/public` (list + view theo `?share=`, không AuthGuard, link 2 chiều).
  - US3: huy hiệu + dialog kiểm chứng + nút gate theo role thật (ADMIN/đơn duyệt, không suy từ requestedType); mở rộng stream result `topicCodes` cho behavior event.
  - Sự cố build giữa chừng: session khác refactor dashboard dở (mất const USERS/LOGS) — chờ họ sửa xong, build lại xanh; xác nhận tab wiring của mình còn nguyên (họ còn reuse moderation queries cho KPI).
- File tạo/sửa:
  - Tạo: `src/features/chat/{types/chat-sharing.*,mappers/chat-sharing.*,api/chat-sharing.api.ts,queries/chat-sharing.queries.ts,schemas/chat-sharing.schema.ts,components/share-*,public-*,verification-*,verify-* }`, `src/app/(site)/assistant/public/page.tsx`, `specs/014-chat-sharing-verification/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(site)/assistant/page.tsx` (nút share/verify + link Khám phá), `features/chat/{api/chat-stream.ts,queries/chat.queries.ts}` (topicCodes), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 200/200 pass (sharing 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass (gồm `/assistant/public`); kiểm tra tĩnh 0 axios/fetch trong sharing api.
- PROGRESS: task #7 (UC-07) giữ 95% (scaffold sharing/verify; test tay CS + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CS-1..CS-4 + check Network 0 request + 2 vai; (2) reconfirm shape 3 endpoint + nối live khi BE READY; (3) assistant page đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Notifications (spec 015-notifications, T001–T022)

- Mục tiêu: đủ 7 tầng notifications theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); chuông header + panel + đánh dấu, 0 request live.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có file tag notifications.
  - `api-endpoints.ts` (+nhánh `NOTIFICATIONS` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng string union + fallback, không tạo enum mới.
  - `features/notification` mới: DTO suy luận/Model/Mapper/test (4 nhãn loại + fallback, `timeAgo` Việt, đếm capped `9+`, link ngoài → null) + 12 tests; fixtures đa loại/trạng thái; api fixture 3 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory, list gate member + polling 60s dừng tab ẩn, mark-read lạc quan + rollback); 3 components (bell badge capped + dropdown panel, panel tìm điều hướng + mark-all, item).
  - Khôi phục chuông ở `site-header.tsx` thay khối comment-out (xóa import `Bell` thừa, giữ style); khách không thấy chuông/không request.
- File tạo/sửa:
  - Tạo: `src/features/notification/{types,mappers,api,queries,components,__fixtures__}`, `specs/015-notifications/**`
  - Sửa: `common/constants/api-endpoints.ts`, `components/layout/site-header.tsx` (chuông), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 212/212 pass (notification 12/12, không regress); `eslint` scope 0 errors (xóa helper chết + unused); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong notification api.
- PROGRESS: task #14 mới → 70% (scaffold; test tay NT + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay NT-1..NT-3 + check Network 0 request + 2 vai; (2) reconfirm shape 3 endpoint + nối live khi BE READY; (3) header đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Restaurants location (spec 016-restaurants-location, T001–T030)

- Mục tiêu: đủ 7 tầng restaurants/location theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); API đọc fixture, 0 request live, 0 gọi maps ngoài.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có tag restaurants/location.
  - `api-endpoints.ts` (+3 nhánh `RESTAURANTS`/`LOCATION`/`ADMIN_RESTAURANTS` kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`RestaurantStatus`; 1 lần ghi đè nhầm `ReportTargetKind` — đã khôi phục và kiểm kê đủ 38 enum).
  - `features/restaurant` mới: DTO suy luận/Model/Mapper/test (format `850 m`/`2,3 km`, nhãn nguồn, `isStale` 30 ngày) + 12 tests; fixtures (3 PUBLISHED + 1 PENDING + geocode 2 địa chỉ mẫu); api fixture 7 hàm (haversine sort ở tầng api, lọc món không dấu, kho submit/queue, delay 300ms, `USE_FIXTURES`, 0 axios/fetch/maps — kiểm tra tĩnh); queries (Key Factory + 7 hooks); zod (tọa độ/bán kính/địa chỉ/submit/review); 10 components (location/address/filters/card/list/map-placeholder/detail/submit/queue/review-dialog).
  - Viết lại `/restaurants` (vị trí + form fallback + filters + list + khung bản đồ CSS cùng tập kết quả) + `/restaurants/[id]`; tab `restaurants` dashboard (giữ `?tab=`/RBAC, không đụng tab khác).
  - Fix eslint unused (`LoadingState` ở list); đơn giản hóa submit (bỏ 2-bước giả).
- File tạo/sửa:
  - Tạo: `src/features/restaurant/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/016-restaurants-location/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(site)/restaurants/{page,[id]/page}.tsx`, `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 224/224 pass (restaurant 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch/maps trong restaurant.
- PROGRESS: task #8 (UC-12) 30% → 70% (scaffold; test tay RT + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay RT-1..RT-4 + check Network 0 request/maps + Sensors vị trí; (2) reconfirm shape 7 endpoint + SDK maps/key + nối live khi BE READY; (3) restaurants/dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold AI governance (spec 017-ai-governance, T001–T024)

- Mục tiêu: đủ 7 tầng AI governance theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); tuyệt đối không render nội dung thô/bí mật.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có tag ai-governance.
  - `api-endpoints.ts` (+nhánh `AI_GOVERNANCE` 5 path kèm `TODO(BE-READY)`, chưa import ở đâu); dùng string union + fallback, không tạo enum mới.
  - `features/ai-governance` mới: DTO suy luận/Model/Mapper/test (CHỈ pick field cho phép — redaction phòng thủ sâu, hash rút gọn 12 ký tự) + 12 tests gồm redaction chuyên biệt; fixtures (metrics/log che mờ/flags/features, 0 nội dung thô); api fixture 5 hàm (lọc khoảng/tính năng/trạng thái, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 5 hooks); zod (khoảng ngày from ≤ to + lý do toggle); 5 components (metrics-overview, flags-list, features-table, requests-table, feature-toggle-dialog).
  - Tab `ai-governance` dashboard (tổng quan + log + cờ + công tắc, giữ `?tab=`/RBAC, không đụng tab khác); nút toggle trong bảng (dialog lý do bắt buộc).
  - Fix eslint `react-hooks/purity` (Date trong render → useState initializer).
- File tạo/sửa:
  - Tạo: `src/features/ai-governance/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/017-ai-governance/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 236/236 pass (ai-governance 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong api + quét components 0 nội dung thô.
- PROGRESS: task #15 mới → 70% (scaffold; test tay AG + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay AG-1..AG-3 + check Network 0 request + quét DOM + 2 vai; (2) reconfirm shape 5 endpoint + nối live khi BE READY; (3) dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Converge 5 đợt scaffold (013→017) + khôi phục chuông thông báo (T023)

- Mục tiêu: kiểm tra lại toàn bộ 5 đợt theo `/speckit-converge`, append task còn thiếu, implement ngay.
- Đã làm:
  - Quét 5 `tasks.md` (013/014/015/016/017): 0 task mở — tất cả đã [X].
  - Đối chiếu wiring thực tế: 013 (report/delete-history) ✓, 014 (share/verify/public) ✓, 016 (routes + dashboard tab) ✓, 017 (dashboard tab + toggle) ✓.
  - Phát hiện 1 regression: `site-header.tsx` (session khác viết lại khi sửa navbar, 260 dòng) mất wiring `NotificationBell` của 015/T014 — bell/panel/item còn nguyên, chỉ mất import + mount.
  - Append `Phase 6: Convergence` + T023 vào `specs/015-notifications/tasks.md`; implement ngay: import + mount `<NotificationBell />` sau `ThemeToggle` (bell tự gate member, khách trả null).
- File tạo/sửa:
  - Sửa: `src/components/layout/site-header.tsx` (chuông), `specs/015-notifications/tasks.md` (T023 [X]), `docs/WORK-LOG.md`
- Verify: `tsc --noEmit` 0 lỗi; `npm test` 25 files, 236/236 pass (không regress).
- PROGRESS: task #14 giữ 70% (scaffold + converge sạch; test tay NT + BE READY còn lại).
- Còn lại / rủi ro: header vẫn là file tranh chấp giữa 2 session — phối hợp khi merge/commit.

---

## [2026-09-18] — Đồng bộ reviewed MVP, Backend Phases 12–27 và Roadmap Phase 2

- Mục tiêu: hợp nhất quyết định sau review Phase 11 thành một nguồn yêu cầu chuẩn và không làm sai trạng thái runtime hiện tại.
- Đã làm:
  - Tạo `/docs/SRS.md` canonical và `/docs/ROADMAP_PHASE_2.md` đầy đủ.
  - Viết lại `/docs/IMPLEMENTATION_PLAN.md` v4.0 với unified Contributor, canonical food data, cooking-aware nutrition, quota, video review parity, custom meals/tags, meal compatibility, multi-week, pantry, fridge multi-image, receipt và shopping gaps.
  - Mở rộng backend plan từ Phase 12 tới 27 và thay prompts 12–16 cũ bằng 16 prompt độc lập cho Phases 12–27.
  - Chuẩn hóa toàn bộ 28 prompt Phase 00–27 dùng “current repository root”/“thư mục gốc của repository hiện tại”; loại bỏ đường dẫn tuyệt đối của máy cá nhân để teammate có thể dùng trên mọi môi trường.
  - Cập nhật `BACKEND_INTEGRATION.md` bằng target contract `PLANNED`; giữ endpoint runtime hiện tại trung thực và ghi Phase 14 là future breaking migration.
  - Cập nhật UI plan/design prompt, `frontend/AGENTS.md`, PROGRESS; đánh dấu hai frontend SRS cũ là superseded/deprecated.
  - Ghi rõ user tag `shopee` chỉ là metadata; certificate/payment/DMCA/STT/wearable/additional traditions và các ý tưởng khác được giữ trong Roadmap Phase 2.
- Verify: docs-only; kiểm tra link/prompt index, legacy-term audit, `git diff --check`. Không chạy frontend typecheck/test/build vì không sửa source hoặc runtime contract.
- PROGRESS: không đổi % feature; thêm bảng backlog tích hợp Phases 12–27.
- Còn lại: mỗi backend phase phải cập nhật OpenAPI/integration registry và frontend chỉ tích hợp khi endpoint thật sự `READY`.

---

## [2026-09-23] — Phân tích khoảng cách FE ↔ BE (Gap Analysis) & Đồng bộ OpenAPI Catalog

- Mục tiêu: Thực thi phân tích khoảng cách toàn diện giữa tiến trình frontend (PROGRESS, WORK-LOG, BACKEND_INTEGRATION) và tiến trình backend (28 phase prompts, IMPLEMENTATION_PHASES.md, SRS.md, FOOD_DATA_SOURCES.md, ROADMAP_PHASE_2.md); giải quyết các mâu thuẫn trạng thái endpoint và đồng bộ tài nguyên tích hợp.
- Đã làm:
  - Khởi tạo đặc tả phân tích khoảng cách chuẩn `/speckit-specify` tại `specs/005-frontend-backend-gap-analysis/spec.md` kèm checklist chất lượng.
  - Phân loại rõ ràng 4 nhóm khoảng cách (Gap Groups A, B, C, D) với thứ tự ưu tiên hành động.
  - Chạy `sync:swagger` từ `../backend/openapi.json` (71 endpoints, 17 nhóm, 70 schemas), làm mới toàn bộ `API-CATALOG.md` và `docs/api/*.md`.
  - Phát hiện quan trọng: Backend Phases 00–11 đã `COMPLETED`; `features/community` đã chạy ở chế độ live (`USE_FIXTURES = false`); Content (`/posts`), Review Queue (`/review-queue/posts`) và Community (`/comments`, `/posts/:id/vote`, `/posts/:id/rating`, `/posts/:id/bookmark`) đều đã sẵn sàng trên backend.
  - Cập nhật `src/common/constants/api-endpoints.ts`: gỡ bỏ các chú thích `TODO(BE-READY)` lỗi thời cho Community, Moderation Admin, Contributors, Safety.
  - Cập nhật `docs/BACKEND_INTEGRATION.md` (v4.1): chuyển trạng thái 20 endpoints của Content, Community và Review Queue từ `PLANNED` sang `READY` và `FE integrated = Yes`.
  - Cập nhật `docs/PROGRESS.md`: đồng bộ % hoàn thành cho Task #2 (Blog/Post) 85% → 95%, Task #3 (Comment/Vote) 70% → 95%, Task #5 (Video) 80% → 95%, Task #13 (Trust-Safety) 70% → 95%.
- File tạo/sửa:
  - Tạo: `specs/005-frontend-backend-gap-analysis/{spec.md,checklists/requirements.md}`
  - Sửa: `src/common/constants/api-endpoints.ts`, `docs/BACKEND_INTEGRATION.md`, `docs/PROGRESS.md`, `docs/API-CATALOG.md`, `docs/api-catalog.json`, `docs/api/*.md`, `docs/WORK-LOG.md`
## [2026-09-16] — Scaffold Community live-shape + fixture (spec 010-community-integration, T001–T029)

- Mục tiêu: đủ 7 tầng community theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; ngày nối live chỉ sửa 1 file api.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/community.md` không lệch.
  - `api-endpoints.ts` (+nhánh `COMMUNITY` 7 path kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`CommentStatus`).
  - `features/community` mới: DTO đủ 11 ops/Model/Mapper/test (ép reply 1 tầng ở mapper, placeholder null-safe, rating/bookmark null-safe) + 12 tests; 3 fixtures bám contract; api fixture 11 hàm (kho trong bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 8 hooks, invalidate đúng key); zod comment/rating; 7 components (item/form/thread/vote/summary/rating/bookmark/list).
  - Nâng cấp `comment-section` shared (xóa 404 dòng mock: bác sĩ Lan Anh, pravatar, setTimeout, rate-limit giả) thành wrapper `CommentThread`; gắn thread/summary/vote vào 3 detail (recipe/post/video) + rating/bookmark (recipe) + bookmark (video) + bookmarks list ở tab posts `/profile`.
  - KHÔNG truyền `entityId` vào `VoteControl` mock (tránh event giả từ vote giả); cơ chế `entityId` optional sẵn cho ngày community live.
  - Sự cố encoding: 1 lần dùng `Set-Content` qua shell làm hỏng UTF-8 file mapper — đã viết lại toàn bộ bằng Write tool, verify bytes + 12/12 tests; từ nay chỉ dùng Read/Edit/Write.
- File tạo/sửa:
  - Tạo: `src/features/community/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/010-community-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `components/shared/comment-section.tsx`, `app/(site)/profile/page.tsx`, `features/{recipe,post,video}/components/*-detail-view.tsx`, `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 151/151 pass (community 12/12, không regress); `eslint` scope 0 errors (1 warning `itemTitle` có sẵn); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong community api.
- PROGRESS: task #3 (Comment/Vote UC-03) 20% → 70% (scaffold live-shape; test tay CM + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CM-1..CM-4 + check Network 0 request; (2) nối live khi BE READY (task riêng: thay thân api, xóa fixtures khỏi bundle); (3) các file detail/profile đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-16] — Scaffold Moderation-admin live-shape + fixture (spec 011-moderation-admin-integration, T001–T026)

- Mục tiêu: đủ 7 tầng moderation-admin theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; 3 tabs mới trong `/admin/dashboard` hiện có.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/moderation-admin.md` không lệch.
  - `api-endpoints.ts` (+nhánh `MODERATION_ADMIN` 6 path kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`ModerationDecision`, `ReportStatus`, `ReportTargetType`).
  - `features/moderation` mới: DTO đủ 6 ops/Model/Mapper/test (label Việt, audit entry, null-safe) + 12 tests; 3 fixtures bám contract; api fixture 6 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 6 hooks, map sẵn `REPORT_REVIEW_CONFLICT`/`SELF_MODERATION_FORBIDDEN`/`PROTECTED_ADMIN_ACCOUNT`/`USER_STATUS_CONFLICT`/`COMMENT_NOT_MODERATABLE`); zod 3 schema (reason bắt buộc); 6 components (reports-table, resolve-dialog, mod-users-table, user-status-dialog, mod-comments-table, comment-status-dialog).
  - Mở rộng `Tab` union + `parseTabParam` + mảng tabs dashboard (`reports`/`mod-users`/`mod-comments`, icon Flag/UserCog/MessagesSquare); KHÔNG đụng tab `users` sẵn có; giữ `Suspense`/`?tab=`/RBAC hiện có.
  - Lỗi `eslint set-state-in-effect` ở dashboard là có sẵn (không thuộc diff) — không sửa, để session sở hữu xử lý.
- File tạo/sửa:
  - Tạo: `src/features/moderation/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/011-moderation-admin-integration/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(admin)/admin/dashboard/page.tsx` (tabs only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 163/163 pass (moderation 12/12, không regress); `eslint` scope 0 errors (lỗi dashboard có sẵn, ngoài scope); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong moderation api.
- PROGRESS: task #10 (UC-11/16/17) 80% → 85% (scaffold moderation-admin; test tay MA + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay MA-1..MA-4 + check Network 0 request + verify MEMBER bị đá khỏi dashboard; (2) nối live khi BE READY; (3) dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-16] — Scaffold Contributors live-shape + fixture (spec 012-contributor-applications, T001–T025)

- Mục tiêu: đủ 7 tầng contributors theo đúng contract dù BE còn `PLANNED`; API đọc fixture, 0 request live; tuyệt đối không cấp quyền theo `requestedType`, không đụng luồng đăng ký của auth.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — 2 file contract không lệch.
  - `api-endpoints.ts` (+nhánh `CONTRIBUTOR`/`ADMIN_CONTRIBUTOR` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng lại enum `ContributorType`/`ContributorApplicationStatus` (T003 rà soát, không tạo mới).
  - `features/contributor` mới: DTO đủ 4 ops (review oneOf đúng BE)/Model/Mapper/test (label Việt, rút gọn experience, oneOf mapping) + 12 tests; fixtures (pending/history/cooldown/queue bám contract); api fixture 4 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 4 hooks, map sẵn PENDING/REAPPLY/NOT_ALLOWED/TYPE_UNCHANGED/ALREADY_REVIEWED); zod (submit min 20 + links URI ≤5, review discriminatedUnion).
  - US1: form nộp (chặn admin/PENDING/cooldown kèm ngày) + lịch sử + tab `contributor` ở `/profile` (query 1 lần truyền xuống, tránh setState-in-render).
  - US2: queue-table (lọc/tìm kiếm) + review dialog (oneOf qua safeParse, không RHF vì discriminated union) + tab `contrib-apps` dashboard.
  - US3: chặn đổi cùng nhóm (`CONTRIBUTOR_TYPE_UNCHANGED` ở form) + hiện người duyệt/ngày.
  - Fix eslint `react-hooks/purity` (Date.now trong render → useState initializer).
- File tạo/sửa:
  - Tạo: `src/features/contributor/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/012-contributor-applications/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(site)/profile/page.tsx` (tab only), `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 175/175 pass (contributor 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong contributor api.
- PROGRESS: task #10 (UC-11/16/17) 85% → 90% (scaffold contributors; test tay CA + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CA-1..CA-4 + check Network 0 request; (2) nối live khi BE READY; (3) profile/dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Trust-safety leftovers (spec 013-trust-safety-leftovers, T001–T024)

- Mục tiêu: quét sạch 2 endpoint còn sót (`POST /reports`, `DELETE behavior-history`) ở dạng scaffold fixture, 0 request live; thay nút toast giả ở privacy.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — 2 file contract không lệch.
  - `api-endpoints.ts` (+nhánh `SAFETY` kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`ReportReasonCode`, `ReportTargetKind` riêng, suýt ghi đè `CommentStatus` — đã khôi phục và kiểm kê đủ 37 enum).
  - `features/safety` mới: DTO đủ 2 ops/Model/Mapper/test (6 nhãn Việt + fallback, UUID guard) + 12 tests; fixtures; api fixture 2 hàm (kho trùng, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (2 hooks, map sẵn SELF/DUPLICATE, xóa xong invalidate home+consent cold-start); zod; 4 components (2 dialogs ở lại feature, nút báo cáo nâng lên `components/shared` để community dùng chéo đúng biên module).
  - Gắn `ReportButton` vào 3 detail (authorId chặn tự báo cáo; video không có author id nên bỏ qua chặn) + `CommentItem`; thay nút toast giả privacy bằng `DeleteHistoryButton` (giữ nút download-data ngoài phạm vi).
- File tạo/sửa:
  - Tạo: `src/features/safety/{types,mappers,api,queries,schemas,components,__fixtures__}`, `src/components/shared/report-{button,dialog}.tsx`, `specs/013-trust-safety-leftovers/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `features/{recipe,post,video}/components/*-detail-view.tsx`, `features/community/components/comment-item.tsx`, `app/(site)/profile/page.tsx` (nút xóa), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 187/187 pass (safety 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong safety api; grep 0 chuỗi toast giả cũ.
- PROGRESS: task #13 mới → 70% (scaffold; test tay TS + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay TS-1..TS-3 + check Network 0 request; (2) nối live khi BE READY; (3) detail/profile/comment đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Chat sharing/verification (spec 014-chat-sharing-verification, T001–T026)

- Mục tiêu: quét sạch 3 endpoint chat còn sót (share/public/verify) ở dạng scaffold fixture, 0 request live; DTO suy luận vì không có schema swagger.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — `docs/api/ai-chat.md` vẫn chỉ 5 private ops (3 endpoint mới vắng mặt, đúng PLANNED).
  - `api-endpoints.ts` (+nhánh `CHAT_SHARING` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng lại enum hiện có (T003 rà soát, không tạo mới).
  - Mở rộng `features/chat`: DTO suy luận/Model/Mapper/test (shareUrl `?share=`, ẩn danh hóa, vai trò) + 12 tests; fixtures (share mở/thu hồi/public gồm 1 đã verify); api fixture 3 hàm (share lại sinh shareId mới, tìm kiếm client, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (public KHÔNG gate auth, mutations + invalidate); zod (xác nhận phạm vi + note kiểm chứng).
  - US1: nút chia sẻ qua slot `actions` có sẵn + dialog (xác nhận phạm vi bắt buộc, copy clipboard + fallback, thu hồi) + link Khám phá ở header.
  - US2: route `/assistant/public` (list + view theo `?share=`, không AuthGuard, link 2 chiều).
  - US3: huy hiệu + dialog kiểm chứng + nút gate theo role thật (ADMIN/đơn duyệt, không suy từ requestedType); mở rộng stream result `topicCodes` cho behavior event.
  - Sự cố build giữa chừng: session khác refactor dashboard dở (mất const USERS/LOGS) — chờ họ sửa xong, build lại xanh; xác nhận tab wiring của mình còn nguyên (họ còn reuse moderation queries cho KPI).
- File tạo/sửa:
  - Tạo: `src/features/chat/{types/chat-sharing.*,mappers/chat-sharing.*,api/chat-sharing.api.ts,queries/chat-sharing.queries.ts,schemas/chat-sharing.schema.ts,components/share-*,public-*,verification-*,verify-* }`, `src/app/(site)/assistant/public/page.tsx`, `specs/014-chat-sharing-verification/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(site)/assistant/page.tsx` (nút share/verify + link Khám phá), `features/chat/{api/chat-stream.ts,queries/chat.queries.ts}` (topicCodes), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 200/200 pass (sharing 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass (gồm `/assistant/public`); kiểm tra tĩnh 0 axios/fetch trong sharing api.
- PROGRESS: task #7 (UC-07) giữ 95% (scaffold sharing/verify; test tay CS + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay CS-1..CS-4 + check Network 0 request + 2 vai; (2) reconfirm shape 3 endpoint + nối live khi BE READY; (3) assistant page đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Notifications (spec 015-notifications, T001–T022)

- Mục tiêu: đủ 7 tầng notifications theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); chuông header + panel + đánh dấu, 0 request live.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có file tag notifications.
  - `api-endpoints.ts` (+nhánh `NOTIFICATIONS` kèm `TODO(BE-READY)`, chưa import ở đâu); dùng string union + fallback, không tạo enum mới.
  - `features/notification` mới: DTO suy luận/Model/Mapper/test (4 nhãn loại + fallback, `timeAgo` Việt, đếm capped `9+`, link ngoài → null) + 12 tests; fixtures đa loại/trạng thái; api fixture 3 hàm (kho bộ nhớ, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory, list gate member + polling 60s dừng tab ẩn, mark-read lạc quan + rollback); 3 components (bell badge capped + dropdown panel, panel tìm điều hướng + mark-all, item).
  - Khôi phục chuông ở `site-header.tsx` thay khối comment-out (xóa import `Bell` thừa, giữ style); khách không thấy chuông/không request.
- File tạo/sửa:
  - Tạo: `src/features/notification/{types,mappers,api,queries,components,__fixtures__}`, `specs/015-notifications/**`
  - Sửa: `common/constants/api-endpoints.ts`, `components/layout/site-header.tsx` (chuông), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 212/212 pass (notification 12/12, không regress); `eslint` scope 0 errors (xóa helper chết + unused); `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong notification api.
- PROGRESS: task #14 mới → 70% (scaffold; test tay NT + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay NT-1..NT-3 + check Network 0 request + 2 vai; (2) reconfirm shape 3 endpoint + nối live khi BE READY; (3) header đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold Restaurants location (spec 016-restaurants-location, T001–T030)

- Mục tiêu: đủ 7 tầng restaurants/location theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); API đọc fixture, 0 request live, 0 gọi maps ngoài.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có tag restaurants/location.
  - `api-endpoints.ts` (+3 nhánh `RESTAURANTS`/`LOCATION`/`ADMIN_RESTAURANTS` kèm `TODO(BE-READY)`, chưa import ở đâu), `enums` (+`RestaurantStatus`; 1 lần ghi đè nhầm `ReportTargetKind` — đã khôi phục và kiểm kê đủ 38 enum).
  - `features/restaurant` mới: DTO suy luận/Model/Mapper/test (format `850 m`/`2,3 km`, nhãn nguồn, `isStale` 30 ngày) + 12 tests; fixtures (3 PUBLISHED + 1 PENDING + geocode 2 địa chỉ mẫu); api fixture 7 hàm (haversine sort ở tầng api, lọc món không dấu, kho submit/queue, delay 300ms, `USE_FIXTURES`, 0 axios/fetch/maps — kiểm tra tĩnh); queries (Key Factory + 7 hooks); zod (tọa độ/bán kính/địa chỉ/submit/review); 10 components (location/address/filters/card/list/map-placeholder/detail/submit/queue/review-dialog).
  - Viết lại `/restaurants` (vị trí + form fallback + filters + list + khung bản đồ CSS cùng tập kết quả) + `/restaurants/[id]`; tab `restaurants` dashboard (giữ `?tab=`/RBAC, không đụng tab khác).
  - Fix eslint unused (`LoadingState` ở list); đơn giản hóa submit (bỏ 2-bước giả).
- File tạo/sửa:
  - Tạo: `src/features/restaurant/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/016-restaurants-location/**`
  - Sửa: `common/constants/api-endpoints.ts`, `common/enums/index.ts`, `app/(site)/restaurants/{page,[id]/page}.tsx`, `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 224/224 pass (restaurant 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch/maps trong restaurant.
- PROGRESS: task #8 (UC-12) 30% → 70% (scaffold; test tay RT + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay RT-1..RT-4 + check Network 0 request/maps + Sensors vị trí; (2) reconfirm shape 7 endpoint + SDK maps/key + nối live khi BE READY; (3) restaurants/dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Scaffold AI governance (spec 017-ai-governance, T001–T024)

- Mục tiêu: đủ 7 tầng AI governance theo suy luận contract dù BE còn `PLANNED` (không có schema swagger); tuyệt đối không render nội dung thô/bí mật.
- Đã làm:
  - `sync:swagger` thành công (71 endpoints) — xác nhận vẫn chưa có tag ai-governance.
  - `api-endpoints.ts` (+nhánh `AI_GOVERNANCE` 5 path kèm `TODO(BE-READY)`, chưa import ở đâu); dùng string union + fallback, không tạo enum mới.
  - `features/ai-governance` mới: DTO suy luận/Model/Mapper/test (CHỈ pick field cho phép — redaction phòng thủ sâu, hash rút gọn 12 ký tự) + 12 tests gồm redaction chuyên biệt; fixtures (metrics/log che mờ/flags/features, 0 nội dung thô); api fixture 5 hàm (lọc khoảng/tính năng/trạng thái, delay 300ms, `USE_FIXTURES`, 0 axios/fetch — kiểm tra tĩnh); queries (Key Factory + 5 hooks); zod (khoảng ngày from ≤ to + lý do toggle); 5 components (metrics-overview, flags-list, features-table, requests-table, feature-toggle-dialog).
  - Tab `ai-governance` dashboard (tổng quan + log + cờ + công tắt, giữ `?tab=`/RBAC, không đụng tab khác); nút toggle trong bảng (dialog lý do bắt buộc).
  - Fix eslint `react-hooks/purity` (Date trong render → useState initializer).
- File tạo/sửa:
  - Tạo: `src/features/ai-governance/{types,mappers,api,queries,schemas,components,__fixtures__}`, `specs/017-ai-governance/**`
  - Sửa: `common/constants/api-endpoints.ts`, `app/(admin)/admin/dashboard/page.tsx` (tab only), `docs/{PROGRESS,WORK-LOG}.md` (+ `BACKEND_INTEGRATION.md` ghi chú scaffold)
- Verify: `tsc --noEmit` sạch (0 lỗi); `npm test` 236/236 pass (ai-governance 12/12, không regress); `eslint` scope 0 errors; `npm run build` pass; kiểm tra tĩnh 0 axios/fetch trong api + quét components 0 nội dung thô.
- PROGRESS: task #15 mới → 70% (scaffold; test tay AG + BE READY còn lại).
- Còn lại / rủi ro: (1) test tay AG-1..AG-3 + check Network 0 request + quét DOM + 2 vai; (2) reconfirm shape 5 endpoint + nối live khi BE READY; (3) dashboard đang có session khác sửa — phối hợp khi merge.

---

## [2026-09-17] — Converge 5 đợt scaffold (013→017) + khôi phục chuông thông báo (T023)

- Mục tiêu: kiểm tra lại toàn bộ 5 đợt theo `/speckit-converge`, append task còn thiếu, implement ngay.
- Đã làm:
  - Quét 5 `tasks.md` (013/014/015/016/017): 0 task mở — tất cả đã [X].
  - Đối chiếu wiring thực tế: 013 (report/delete-history) ✓, 014 (share/verify/public) ✓, 016 (routes + dashboard tab) ✓, 017 (dashboard tab + toggle) ✓.
  - Phát hiện 1 regression: `site-header.tsx` (session khác viết lại khi sửa navbar, 260 dòng) mất wiring `NotificationBell` của 015/T014 — bell/panel/item còn nguyên, chỉ mất import + mount.
  - Append `Phase 6: Convergence` + T023 vào `specs/015-notifications/tasks.md`; implement ngay: import + mount `<NotificationBell />` sau `ThemeToggle` (bell tự gate member, khách trả null).
- File tạo/sửa:
  - Sửa: `src/components/layout/site-header.tsx` (chuông), `specs/015-notifications/tasks.md` (T023 [X]), `docs/WORK-LOG.md`
- Verify: `tsc --noEmit` 0 lỗi; `npm test` 25 files, 236/236 pass (không regress).
- PROGRESS: task #14 giữ 70% (scaffold + converge sạch; test tay NT + BE READY còn lại).
- Còn lại / rủi ro: header vẫn là file tranh chấp giữa 2 session — phối hợp khi merge/commit.

---

## [2026-09-18] — Đồng bộ reviewed MVP, Backend Phases 12–27 và Roadmap Phase 2

- Mục tiêu: hợp nhất quyết định sau review Phase 11 thành một nguồn yêu cầu chuẩn và không làm sai trạng thái runtime hiện tại.
- Đã làm:
  - Tạo `/docs/SRS.md` canonical và `/docs/ROADMAP_PHASE_2.md` đầy đủ.
  - Viết lại `/docs/IMPLEMENTATION_PLAN.md` v4.0 với unified Contributor, canonical food data, cooking-aware nutrition, quota, video review parity, custom meals/tags, meal compatibility, multi-week, pantry, fridge multi-image, receipt và shopping gaps.
  - Mở rộng backend plan từ Phase 12 tới 27 và thay prompts 12–16 cũ bằng 16 prompt độc lập cho Phases 12–27.
  - Chuẩn hóa toàn bộ 28 prompt Phase 00–27 dùng “current repository root”/“thư mục gốc của repository hiện tại”; loại bỏ đường dẫn tuyệt đối của máy cá nhân để teammate có thể dùng trên mọi môi trường.
  - Cập nhật `BACKEND_INTEGRATION.md` bằng target contract `PLANNED`; giữ endpoint runtime hiện tại trung thực và ghi Phase 14 là future breaking migration.
  - Cập nhật UI plan/design prompt, `frontend/AGENTS.md`, PROGRESS; đánh dấu hai frontend SRS cũ là superseded/deprecated.
  - Ghi rõ user tag `shopee` chỉ là metadata; certificate/payment/DMCA/STT/wearable/additional traditions và các ý tưởng khác được giữ trong Roadmap Phase 2.
- Verify: docs-only; kiểm tra link/prompt index, legacy-term audit, `git diff --check`. Không chạy frontend typecheck/test/build vì không sửa source hoặc runtime contract.
- PROGRESS: không đổi % feature; thêm bảng backlog tích hợp Phases 12–27.
- Còn lại: mỗi backend phase phải cập nhật OpenAPI/integration registry và frontend chỉ tích hợp khi endpoint thật sự `READY`.

---

## [2026-09-23] — Phân tích khoảng cách FE ↔ BE (Gap Analysis) & Đồng bộ OpenAPI Catalog

- Mục tiêu: Thực thi phân tích khoảng cách toàn diện giữa tiến trình frontend (PROGRESS, WORK-LOG, BACKEND_INTEGRATION) và tiến trình backend (28 phase prompts, IMPLEMENTATION_PHASES.md, SRS.md, FOOD_DATA_SOURCES.md, ROADMAP_PHASE_2.md); giải quyết các mâu thuẫn trạng thái endpoint và đồng bộ tài nguyên tích hợp.
- Đã làm:
  - Khởi tạo đặc tả phân tích khoảng cách chuẩn `/speckit-specify` tại `specs/005-frontend-backend-gap-analysis/spec.md` kèm checklist chất lượng.
  - Phân loại rõ ràng 4 nhóm khoảng cách (Gap Groups A, B, C, D) với thứ tự ưu tiên hành động.
  - Chạy `sync:swagger` từ `../backend/openapi.json` (71 endpoints, 17 nhóm, 70 schemas), làm mới toàn bộ `API-CATALOG.md` và `docs/api/*.md`.
  - Phát hiện quan trọng: Backend Phases 00–11 đã `COMPLETED`; `features/community` đã chạy ở chế độ live (`USE_FIXTURES = false`); Content (`/posts`), Review Queue (`/review-queue/posts`) và Community (`/comments`, `/posts/:id/vote`, `/posts/:id/rating`, `/posts/:id/bookmark`) đều đã sẵn sàng trên backend.
  - Cập nhật `src/common/constants/api-endpoints.ts`: gỡ bỏ các chú thích `TODO(BE-READY)` lỗi thời cho Community, Moderation Admin, Contributors, Safety.
  - Cập nhật `docs/BACKEND_INTEGRATION.md` (v4.1): chuyển trạng thái 20 endpoints của Content, Community và Review Queue từ `PLANNED` sang `READY` và `FE integrated = Yes`.
  - Cập nhật `docs/PROGRESS.md`: đồng bộ % hoàn thành cho Task #2 (Blog/Post) 85% → 95%, Task #3 (Comment/Vote) 70% → 95%, Task #5 (Video) 80% → 95%, Task #13 (Trust-Safety) 70% → 95%.
- File tạo/sửa:
  - Tạo: `specs/005-frontend-backend-gap-analysis/{spec.md,checklists/requirements.md}`
  - Sửa: `src/common/constants/api-endpoints.ts`, `docs/BACKEND_INTEGRATION.md`, `docs/PROGRESS.md`, `docs/API-CATALOG.md`, `docs/api-catalog.json`, `docs/api/*.md`, `docs/WORK-LOG.md`
- Verify:
  - `node node_modules/typescript/bin/tsc --noEmit`: 0 lỗi type.
  - `npm test`: 25 test files, 236/236 unit tests pass 100%.
  - `npm run build`: pass thành công toàn bộ 30 routes tĩnh và động.
- PROGRESS: Task #2: 85% → 95%, Task #3: 70% → 95%, Task #5: 80% → 95%, Task #13: 70% → 95%.
- Còn lại / rủi ro:
  - Cần chạy kịch bản kiểm thử tích hợp thực tế (test tay) với Backend server local (`:4000`) cho các kịch bản VS, VP, VC, MP, AC, RC, CM, MA, CA, TS.
  - Sẵn sàng đón đầu Backend Phase 12 (`Food & Nutrient Knowledge Base`) khi backend bắt đầu triển khai.

---

## [2026-09-23] — Rà soát toàn diện sau khi nhánh `dev` merge PR #19 `be-fix` (Phases 12–16)

- Mục tiêu: Kiểm tra và đánh giá lại toàn bộ hệ thống sau khi user cập nhật code mới về nhánh `dev` từ PR #19 `be-fix`.
- Đã làm:
  - Kiểm tra `git log`: PR #19 mang về 5 commits lớn của backend (`feat: add food data and recipe nutrition`, `docs: update backend integration`, `refactor: unify contributor permissions`, `feat(storage): enforce user media quotas`, `feat(video): align review and moderation lifecycle`).
  - Chạy `sync:swagger`: OpenAPI tăng từ 71 endpoints (17 nhóm) lên **103 endpoints (24 nhóm, 95 schemas)**. Đã làm mới toàn bộ `API-CATALOG.md` và `docs/api/*.md`.
  - Phân tích trạng thái Backend:
    - Phase 12 (`Food Data`): Đã `COMPLETED` (11 endpoints).
    - Phase 13 (`Recipe Nutrition`): Đang `IN_PROGRESS` (5 endpoints).
    - Phase 14 (`Unified Contributor`): Đang `IN_PROGRESS` / `CHANGING` (6 endpoints).
    - Phase 15 (`Storage Quota`): Đã `COMPLETED` (10 endpoints) — **BREAKING**: Xóa `/uploads/signature`, thay bằng luồng reservation 3 bước.
    - Phase 16 (`Video Review Parity`): Đã `COMPLETED` (5 endpoints) — **BREAKING**: Chuyển quy trình duyệt sang explicit submit & `/admin/content-review*`.
  - Cập nhật tài liệu:
    - `specs/005-frontend-backend-gap-analysis/spec.md`: Bổ sung phân tích chi tiết PR #19, phân loại 2 breaking changes và lập kế hoạch hành động 3 sprint.
    - `docs/PROGRESS.md`: Cập nhật bảng backlog backend Phases 12–27 và nhật ký.
- Verify:
  - `node node_modules/typescript/bin/tsc --noEmit`: 0 lỗi type.
  - `npm test`: 25 test files, 236/236 unit tests pass 100%.
  - `npm run build`: pass thành công toàn bộ 30 routes tĩnh và động (exit code 0).
- PROGRESS: % giữ nguyên (đợt audit đồng bộ code dev).
- Còn lại / rủi ro:
  - Cần lên kế hoạch thực thi cho Sprint 1: Migrate luồng upload sang reservation (Phase 15) và submit bài (Phase 16).

---

## [2026-09-23] — Khởi tạo thư mục task chuẩn bị theo thứ tự 28 Phase của Backend

- Mục tiêu: Tạo ra thư mục ghi nhận các task cần làm và checklist chuẩn bị trước khi vào làm từng task, bám sát thứ tự 28 phase trong `backend/docs/prompts/`.
- Đã làm:
  - Tạo thư mục `frontend/docs/tasks/`.
  - Tạo `frontend/docs/tasks/README.md`: Bảng ma trận tiến độ 28 phases (BE ↔ FE), quy trình chuẩn bị bắt buộc 5 bước (Pre-flight Checklist) tuân thủ `ARCHITECTURE.md` và `AGENTS.md`.
  - Tạo 28 file task chi tiết tương ứng 1:1 với 28 prompts của Backend:
    - `phase-00-foundation.md` đến `phase-11-ai-chat.md`: Các phase đã live, bổ sung danh sách kịch bản test tay chi tiết (VS, VP, VC, MP, AC, RC, CM, MA, TS).
    - `phase-12-food-data.md`: Kế hoạch scaffold 7 tầng cho 11 endpoints dinh dưỡng mới của Phase 12 READY.
    - `phase-13-recipe-nutrition.md`: Kế hoạch chuẩn bị DTO/Model/Mapper cho ước tính dinh dưỡng nấu nướng.
    - `phase-14-unified-contributors.md`: Kế hoạch chuẩn bị migration bỏ subtype RBAC sang `approvalBasis`.
    - `phase-15-storage-quota.md`: Checklist cấp bách migrate luồng upload sang Reservation Flow 3 bước.
    - `phase-16-video-review.md`: Checklist cấp bách migrate nộp duyệt `POST /posts/:id/submit` và `/admin/content-review*`.
    - `phase-17-custom-meals.md` đến `phase-27-hardening.md`: Kế hoạch chuẩn bị cho các phase tương lai (Custom meals, Pantry, Fridge vision, Receipts, Maps, Notifications, AI governance, Hardening release gate).
- File tạo/sửa:
  - Tạo mới: `frontend/docs/tasks/{README.md, phase-00-foundation.md ... phase-27-hardening.md}` (tổng cộng 29 files).
  - Sửa: `frontend/docs/WORK-LOG.md`.
- Verify:
  - `node node_modules/typescript/bin/tsc --noEmit`: 0 lỗi type.
  - `npm test`: 25 test files, 236/236 unit tests pass 100%.
- PROGRESS: Giữ nguyên (tạo task guide & documentation scaffolding).
- Còn lại: Lần lượt chọn task trong `frontend/docs/tasks/` để thực thi (ưu tiên Phase 15 và Phase 16).

## [2026-10-06] — Khu vực Quản lý nội dung admin recipes/articles/video (spec 029-admin-content-crud)

- Mục tiêu:
  - Quản trị viên tạo/sửa/xoá/gửi duyệt công thức, bài viết và video của chính mình ngay trong dashboard, không rời sang khu vực thành viên.
  - Danh sách đầy đủ có bộ lọc tác giả/trạng thái/thời gian; ẩn/khôi phục kèm lý do.
- Đã làm:
  - **Khung 7 tầng `src/features/admin-content/`**: `types/` (DTO riêng + `AdminContentRow` 26 trường + `source: published-only/admin-list` + options 8 trạng thái **không `ARCHIVED`**), `schemas/admin-content.schema.ts` (dùng thật qua react-hook-form), `mappers/` + 47 unit tests, `api/` (7 hàm, chỉ dùng `API_ENDPOINTS.POSTS.*` + `CONTENT_REVIEW.*`, không fixture fallback), `queries/` (8 hooks, invalidate cả key công khai).
  - **Điều hướng**: tab `content` trong `dashboard/page.tsx` (union + parseTabParam + mảng tabs + khối render) và mục "Nội dung" trong `NAV_MAIN` của `admin/layout.tsx` — không trang mồ côi.
  - **Bốn trạng thái**: skeleton + `ErrorState` (thử lại) + `EmptyState` (phân biệt rỗng/lỗi) + bảng. Tiêu đề bảng ghi rõ "nội dung đã xuất bản"; bộ lọc Trạng thái/Tác giả/Thời gian vô hiệu hoá kèm lý do.
  - **Tạo/sửa**: `admin-content-editor-dialog.tsx` 3 nhánh. RECIPE tái dùng `RecipeEditorForm` (uỷ quyền `onSubmit`, không điều hướng). BLOG/VIDEO dùng schema gốc `postFormSchema`/`videoFormSchema` với biểu mẫu riêng — `PostEditorForm` sở hữu mutation và `router.push()` nên không tái dùng được. `expectedVersion` trong thân PATCH / tham số query DELETE.
  - **Xoá mềm** có xác nhận nêu hậu quả không hoàn tác; **không** viết nút Ẩn/Khôi phục giả (CG-02).
  - **Gửi duyệt** kèm chặn tự duyệt (`AdminContentSelfReviewNotice` + `SELF_APPROVAL_FORBIDDEN`); lịch sử duyệt timeline; tín hiệu kiểm duyệt chỉ hiển thị dạng tham chiếu.
  - **Media/quota**: `ImageUploader`/`VideoUploader` trong biểu mẫu, `StorageQuotaWidget` compact, nút Gửi duyệt vô hiệu hoá khi video chưa có nguồn.
  - **Hợp đồng**: `specs/029-admin-content-crud/contracts/cg-01-admin-content-list.md` và `cg-02-author-hide-restore.md` (phát hiện qua đọc mã nguồn BE, có DoD và kế hoạch FE sau READY).
- File tạo/sửa:
  - Tạo: `src/features/admin-content/**` (15 tệp), 8 tài liệu spec (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `tasks.md`, 2 contracts).
  - Sửa: `src/app/(admin)/admin/dashboard/page.tsx`, `src/app/(admin)/admin/layout.tsx`, `frontend/docs/BACKEND_INTEGRATION.md` (changelog v5.4), `docs/PROGRESS.md`, `docs/WORK-LOG.md`.
- Verify:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 47/47 mapper tests mới pass; toàn suite 572 pass / 2 fail (2 fail là `pantry.mapper.test.ts` phụ thuộc ngày hiện tại, có từ nền, không liên quan).
  - `npm run build`: thành công.
  - `npm run lint`: 0 lỗi/0 cảnh báo trong file mới (repo có 91 lỗi nền sẵn, không chạm).
- PROGRESS: Task #16: 0% → 85%.
- Còn lại / rủi ro: V-01..V-15 cần backend có phiên admin để chạy tay; Phase 9 (US1 đầy đủ) chặn bởi CG-01; Ẩn/Khôi phục chặn bởi CG-02. Nhánh `029-admin-content-crud` đã tạo.
