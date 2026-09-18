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

## [2026-09-17] — Bản đồ quán chay Google-direct FE-only (spec 018, T001–T017 + T019–T022 + T024–T025 + T028 + T030–T032)

- Mục tiêu: Thay khung bản đồ CSS bằng Google Maps tương tác thật qua `PlaceProvider` (đổi nguồn không sửa màn hình), giữ toàn bộ đầu tư spec 016.
- Đã làm:
  - Setup: cài `@googlemaps/js-api-loader` + `@googlemaps/markerclusterer`; `.env.example` thêm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` + `PLACE_PROVIDER=mock`; ghi chú luồng Google-direct trong `BACKEND_INTEGRATION.md` (giữ 7 endpoint `PLANNED`).
  - Foundation: `providers/place-provider.ts` (interface + `PlaceErrorCode` + message Việt + composition), `providers/maps-bootstrap.ts` (setOptions 1 lần), `providers/google-place.provider.ts` (Places New: searchNearby/searchByText/fetchFields/geocode, field mask, map lỗi → mã ứng dụng), `providers/mock-place.provider.ts` (fixture + kho cộng đồng), `providers/place-distance.ts` (haversine dùng chung), `GooglePlaceDto` suy luận, mở rộng `Restaurant` (rating/reviewCount/photos/dietType/dietLabel/openingStatus/providerId/googleMapsUri), `GooglePlaceMapper` + 10 tests (heuristic + qualifier "Có thể..."), facade `restaurantApi` (giữ chữ ký, gom trùng tên+địa chỉ/100m, nhãn "Nội bộ · Google"), zod radius 3000/10000, nhãn diet/GOOGLE.
  - US1: `restaurant-map.tsx` (loader singleton, cluster, marker↔card 2 chiều, skeleton, reduced-motion, fallback placeholder + caption mới), viết lại `/restaurants` (selectedPlaceId, lọc chung cho map+list, công khai), highlight card + tóm tắt sao/giờ/nhãn chay.
  - US2: filters loại chay/mở cửa/sao + `applyPlaceFilters` (UNKNOWN bị loại khi lọc), quy tắc món (mock lọc dishes, Google tin server), detail ảnh + attribution + đánh giá + "Chỉ đường"; `next.config.ts` đã có sẵn `lh3.googleusercontent.com`.
  - US3: giữ kết quả cũ khi lỗi + báo nhẹ (RATE_LIMITED), text 4 trạng thái chuẩn spec.
  - US4: test swap provider (mock vs fake đảo thứ tự + trùng → cùng tập đã gom/sắp) + hook `__overrideActiveProviderForTests`.
  - Khắc phục: regex strip dấu verify codepoint U+0300–U+036F; js-api-loader 2.x dùng functional API (không có `Loader.load()`); `SearchNearbyRequest` không có `textQuery` (lọc chay client-side); `OpeningHours` không có `isOpen()` (giữ UNKNOWN trung thực); Marker cổ điển (không cần Map ID); `cn` import từ package `cn`.
- File tạo/sửa: xem `specs/018-vegetarian-place-map/tasks.md` T001–T032 (28/32 code xong); `docs/PROGRESS.md`, `docs/BACKEND_INTEGRATION.md`, `.env.example`, `package.json`.
- Verify: `npx tsc --noEmit` 0 lỗi, `npm test` 248/248 pass, `npm run build` pass, eslint scope sạch.
- PROGRESS: task #8 (UC-12) 70% → 85% (xong code + gates tự động; còn QA tay).
- Còn lại / rủi ro: T018/T023/T026/T029 (QS-1..QS-6, cần key Google giới hạn referrer + trình duyệt), T027 usability SC-003 (cần 5–6 người thật), T031 Network thủ công; `.env` local chưa có key nên provider đang ở `mock`.

## [2026-09-17] — Refactor giao diện chờ suy nghĩ (Thinking State) của Chatbot AI Trợ lý Dinh dưỡng

- Mục tiêu: Tái thiết kế toàn diện giao diện chờ suy nghĩ của chatbot AI VeggieConnect từ trạng thái thô sơ (icon robot xoay giật cục kèm con trỏ nhảy dòng lỗi) sang giao diện chuẩn AI hiện đại, tinh tế, mượt mà và trực quan.
- Đã làm:
  - Tách component chuyên biệt `AssistantThinking` (`src/features/chat/components/assistant-thinking.tsx`):
    - Badge icon AI phát sáng với quầng sáng thở nhẹ (`animate-ping` mờ kết hợp `Sparkles` icon ngọc lục bảo `animate-pulse`).
    - Gợi ý trạng thái động (Dynamic Stage Hints): luân phiên chuyển đổi thông minh theo thời gian xử lý ("Đang suy nghĩ..." → "Đang phân tích thông tin dinh dưỡng..." → "Đang tổng hợp câu trả lời cho bạn..."), giúp người dùng có phản hồi liên tục khi chờ backend xử lý.
    - Sóng chấm động (3 Bouncing Dots Wave) nhịp nhàng thay cho icon quay giật cục.
    - Sóng phác thảo câu trả lời (Shimmer Skeleton Wave) với dải gradient ngọc bích mô phỏng luồng suy nghĩ đang được chuẩn bị.
    - Hỗ trợ đầy đủ chuẩn a11y (`role="status"`, `aria-live="polite"`, `sr-only`) và `motion-reduce:animate-none` tuân thủ nghiêm ngặt `fixing-motion-performance`.
  - Tinh chỉnh `MessageBubble` (`src/features/chat/components/message-bubble.tsx`):
    - Khắc phục triệt để lỗi con trỏ streaming (`span` cursor) bị hiển thị khi `text.length === 0` gây rớt dòng thành một vạch xanh cô lập.
    - Đặt con trỏ streaming strictly inline vào khối markdown khi và chỉ khi đang stream có nội dung (`text.length > 0 && isStreaming`).
    - Nâng cấp style bong bóng tin nhắn ở trạng thái chờ với viền và nền gradient ngọc lục bảo dịu mắt (`border-emerald-500/25 bg-gradient-to-br ...`).
- File tạo/sửa:
  - Tạo mới: `src/features/chat/components/assistant-thinking.tsx`.
  - Sửa đổi: `src/features/chat/components/message-bubble.tsx`, `docs/WORK-LOG.md`.
- Verify: `npx vitest run src/features/chat` (24/24 tests passed), kiểm tra trực quan trên browser subagent qua route `/assistant` (chụp screenshot xác nhận UI hiển thị chuẩn đẹp, không còn giật cục hay rớt con trỏ).
- PROGRESS: Hoàn thiện trải nghiệm trò chuyện với Trợ lý AI.
- Còn lại / rủi ro: Không có.

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

## [2026-09-17] — Đổi nhãn Cẩm nang → Tin tức (spec 019-articles-to-news-labels, T001–T019)

- Mục tiêu: đổi toàn bộ nhãn "Cẩm nang" thành "Tin tức" trong FE; giữ route, redirect, enum, API nguyên vẹn (FE-only).
- Đã làm:
  - Spec 019 (3 user story P1–P3, 9 FR, 4 SC) → plan (label map + inventory 13 điểm) → tasks 19 task; checklist requirements 16/16 pass.
  - Đổi 22 điểm nhãn trong 11 file: nav header, list (badge), detail/new/edit (breadcrumb + nút quay lại), form (placeholder + thông báo + label chuyên mục + message zod), profile (nhãn loại + mô tả tab + nút viết), search (h1 + gợi ý từ khóa + nút xem thêm + tên nhóm), contributor (card + nút viết + hint form), tiêu đề fixture mẫu.
  - Phát hiện thêm 9 điểm biến thể hoa/thường ngoài kiểm kê ban đầu (nút "Viết cẩm nang", mô tả tab, message zod...) — đã đổi hết.
  - Baseline T003 đối chiếu T019: `next.config.ts`, `api-endpoints.ts` 0 diff — route/redirect/API bất biến (xác nhận bằng `git diff`).
- File tạo/sửa:
  - Tạo: `specs/019-articles-to-news-labels/**`
  - Sửa nhãn: `components/layout/site-header.tsx`, `app/(site)/articles/{page,[id]/page,[id]/edit/page,new/page}.tsx`, `app/(site)/{profile,search}/page.tsx`, `app/(site)/contributor/dashboard/page.tsx`, `features/post/{components/post-detail-view,components/post-editor-form,__fixtures__/post-fixtures,schemas/post-form.schema}.tsx|.ts`, `features/contributor/components/application-form.tsx`
  - Sửa docs: `docs/{PROGRESS,WORK-LOG}.md`
- Verify: grep 0 chuỗi cũ trong `src/` (mọi biến thể hoa/thường); `tsc --noEmit` 0 lỗi; `npm test` 27 files, 248/248 pass (suite tăng từ 236 do session khác thêm test — không regress); `npm run build` pass 30/30 routes.
- PROGRESS: task #2 giữ % (thuần nhãn, không endpoint mới).
- Còn lại / rủi ro: (1) T018 test tay trình duyệt theo quickstart mục 3 (nav/list/detail/form/profile/search/contributor + URL cũ/bookmark) — CHƯA làm (không có browser trong phiên này; trang prerender là shell client nên check HTML build không kết luận được); (2) `site-header.tsx`/`profile/page.tsx`/`search/page.tsx` đang có session khác sửa — phối hợp khi merge (diff của tôi thuần nhãn, dễ rebase).


