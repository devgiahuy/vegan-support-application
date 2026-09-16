# WORK-LOG — Nhật ký làm việc (agent cập nhật sau mỗi task)

> Agent BẮT BUỘC append 1 entry sau mỗi task xong (xem `ARCHITECTURE.md` mục 7).
> Mỗi entry ghi: đã làm gì, file đổi, cách verify, % PROGRESS đổi ra sao.

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

---

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
