# Đánh giá cấu trúc và luồng frontend

Ngày: 15/10/2026 · Phiên bản: 1.0 · Source: HEAD `894b875` và working tree hiện tại.

## Nhận định

Nền tảng kiến trúc phù hợp để tiếp tục phát triển: chia feature rõ, có API client, DTO/Model/Mapper, Query hooks, endpoint constants, auth proxy và bộ test mapper đáng kể. Phần cần củng cố là tính nhất quán khi session/hồ sơ thay đổi, cách thể hiện dữ liệu chưa biết, xử lý lỗi thật và kiểm soát ranh giới module.

Nên giữ cấu trúc feature hiện tại, sửa các vấn đề vận hành bên dưới rồi refactor các trang/component lớn theo từng luồng. Mức sẵn sàng production còn phụ thuộc acceptance nghiệp vụ, dịch vụ ngoài và thiết bị; build/test qua không chứng minh các đường đó đều đúng.

## Phạm vi và bằng chứng

- Kiểm kê 685 file `.ts`/`.tsx` dưới `src` (bao gồm test), 33 feature, 50 page; 37 page có `use client`.
- Đọc app shell, auth/middleware/refresh, Query client, env/config, mapper nền; lần luồng profile, diet, recipe, recommendation, Pantry/storage/billing và upload scan đại diện.
- Quét AST import alias giữa feature: 125 import declarations chéo feature ngoài test, trong đó 31 khai báo `import type`. Đây là phép kiểm tra ranh giới kiến trúc, không tự chứng minh có vòng phụ thuộc JavaScript.
- Bộ Vitest có 50 file, 36 file nằm trong thư mục mappers. Việc nằm dưới components không đồng nghĩa có test DOM/browser; environment suite hiện là node.
- Không phải mọi component/route được đọc thủ công. Các kịch bản browser về đổi tài khoản, đổi allergy và refresh race bên dưới cần kiểm chứng thêm.
- Working tree đã có thay đổi ở `src/features/auth/components/login-form.tsx` khi bắt đầu review; snapshot này bao gồm nội dung đang có của file.
- Đã đọc skill `next-best-practices` và `codegraph`. Không có CodeGraph tool/CLI trong phiên làm việc nên dùng tìm kiếm, AST imports và đọc source. Next.js local docs được dùng để kiểm tra deprecation middleware.

| Kiểm tra | Kết quả ngày 15/10/2026 |
|---|---|
| TypeScript | PASS: `node node_modules/typescript/bin/tsc --noEmit --incremental false` |
| Vitest | PASS: 602 tests / 50 files |
| ESLint toàn frontend | FAIL: 89 errors, 347 warnings, 715 file trong báo cáo |
| Production build | PASS: Next.js 16.3.4, Turbopack; còn warning middleware → proxy |
| HTML prerender trang `/` | Có thông báo khôi phục phiên; không có phần tử `<main>`/`<h1>` trong HTML build đã kiểm tra |

Lượt Vitest đầu lỗi ENOENT ở thư mục temp của sandbox; chạy lại với TEMP/TMP riêng trong cache workspace cho lệnh đó thì toàn bộ suite qua. Lượt build đầu SWC bị sandbox chặn canonicalize đường dẫn Windows; build ngoài sandbox thành công. Hai lỗi môi trường này không được tính là lỗi source. Không đổi config project để làm các kiểm tra qua.

## Những phần nên giữ

| Phần | Vì sao phù hợp | Source đại diện |
|---|---|---|
| Tổ chức theo feature | Gom API/types/mappers/queries/UI của từng domain, dễ theo luồng | `features/category`, `features/profile`, `features/billing` |
| DTO → Mapper → Model | Tạo một nơi xử lý hình dạng backend và dữ liệu hiển thị | [profile.api.ts](../src/features/profile/api/profile.api.ts), [profile.mapper.ts](../src/features/profile/mappers/profile.mapper.ts) |
| TanStack Query và Zustand | Có phân biệt server state với session/UI state | [query-provider.tsx](../src/components/providers/query-provider.tsx), [useAuthStore.ts](../src/store/useAuthStore.ts) |
| Endpoint constants | Phần lớn consumer đi qua danh mục tập trung | [api-endpoints.ts](../src/common/constants/api-endpoints.ts) |
| Auth proxy và token memory | Có cơ chế cookie cùng domain, refresh, memory token và backend quyền riêng | [auth.api.ts](../src/features/auth/api/auth.api.ts), [auth-refresh.ts](../src/lib/auth-refresh.ts) |
| Query có owner/cancellation ở một số domain | Đã có mẫu tốt để chuẩn hóa sang các domain khác | [billing.queries.ts](../src/features/billing/queries/billing.queries.ts), [restaurant.queries.ts](../src/features/restaurant/queries/restaurant.queries.ts) |
| Bộ test mapper | Đã có nền tảng kiểm tra envelope, null, enum và contract mapping | 602 tests hiện chạy qua; cần bổ sung coverage luồng thay đổi state |
| Config cơ bản | TS strict, image allowlist, font tiếng Việt, Query client không khởi tạo lại mỗi render | `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, QueryProvider |

## Các điểm cần cải thiện, theo ưu tiên

### F01 — P1: Fallback fixture có thể biến lỗi ghi thật thành thành công

**Source:** [api-fallback.ts](../src/features/post/utils/api-fallback.ts:19), [recipe.api.ts](../src/features/recipe/api/recipe.api.ts:109), [recipe.queries.ts](../src/features/recipe/queries/recipe.queries.ts:43).

`shouldFallbackToFixtures` trả true với network errors trước khi xét context; lỗi HTTP 5xx cũng có thể trả true. `createRecipe`/`updateRecipe` dùng kết quả này để trả fixture; `deleteRecipe` có thể hoàn tất mà không throw. Query mutation từ đó chạy nhánh onSuccess, toast thành công hoặc invalidate list dù backend chưa xác nhận ghi/xóa.

List/detail cũng có thể hiển thị recipe mẫu khi backend lỗi, không giữ được metadata constraints của response thật. Fixture đó chưa qua bộ lọc profile ở backend nên không thể mô tả là danh sách đã được lọc theo allergy. Helper chưa có gate production/demo ở source đang đọc. Comment nói endpoint PLANNED đã không theo kịp registry READY.

Đây là hành vi thấy trực tiếp trong source. Test `api-fallback.test.ts` hiện còn kỳ vọng mutation network error được fallback; suite pass không phát hiện vấn đề về kỳ vọng nghiệp vụ này.

**Cải thiện:** API live phải throw lỗi mạng/provider/contract; UI có retry và giữ dữ liệu đã lưu gần nhất với trạng thái rõ ràng. Mock transport chỉ bật bằng chế độ demo explicit; mutation live chỉ thành công khi backend xác nhận. Cập nhật các test đang hợp thức hóa fallback cũ.

**Ca kiểm chứng cần có:** simulate lỗi mạng/500 cho create/update/delete recipe → không có success toast, không có record giả, lỗi được hiển thị; list lỗi không được giả thành danh sách đạt hard constraints.

### F02 — P1: Chưa có một ranh giới cache thống nhất khi session đổi

**Source:** [forceLogout](../src/lib/auth-refresh.ts:151), [auth.queries.ts](../src/features/auth/queries/auth.queries.ts:43), [profile.queries.ts](../src/features/profile/queries/profile.queries.ts:7), [recommendation.queries.ts](../src/features/recommendation/queries/recommendation.queries.ts:7).

Logout thủ công có `queryClient.clear()`, nhưng `forceLogout()` chỉ xóa token/store và refresh state. Login/register chỉ set auth session và key `auth/me`; không dọn các cache của user trước. Nhiều private keys là `['profile','detail']`, notification/meal-plan/recommendation cũng chưa có owner trong key.

Đường đáng kiểm tra: A đã có dữ liệu riêng trong cache → mất phiên khi đang ở trang public → `forceLogout` không reload trang public → đăng nhập B qua client navigation → query có key cũ và còn fresh có thể dùng dữ liệu A. `enabled=false` không xóa cache. Redirect cứng từ trang được bảo vệ có thể làm mất QueryClient và giảm khả năng gặp; không bao phủ đường trang public. Đây là rủi ro hiển thị dữ liệu phía client, không phải bằng chứng bypass quyền API backend.

**Cải thiện:** một session lifecycle chịu trách nhiệm cancel requests, dọn private cache khi logout/forced logout/chuyển identity; private query keys có userId. Billing và restaurant đã có ví dụ key theo identity để tham khảo. Public response có nội dung tùy user cũng cần phân biệt guest/member/owner trong key.

**Ca kiểm chứng:** A → forced logout trên `/` → login B trong cùng tab → profile/notifications/plan không được hiện dữ liệu A, kể cả trong staleTime. Kiểm tra thêm request của A đang bay khi login B để ngăn response cũ ghi cache sau khi clear.

### F03 — P1: Lưu diet/allergy chưa invalidation đầy đủ dữ liệu phụ thuộc

**Source:** [diet.queries.ts](../src/features/diet-preferences/queries/diet.queries.ts:31), [recipe.queries.ts](../src/features/recipe/queries/recipe.queries.ts:7), [recommendation.queries.ts](../src/features/recommendation/queries/recommendation.queries.ts:7), [diet-wizard.tsx](../src/features/diet-preferences/components/diet-wizard.tsx:122).

Save preferences gửi cả allergies/exclusions nhưng onSuccess chỉ cập nhật diet/profile/restaurant. Recipe lists và home recommendations không được invalidate. Recipe key chỉ chứa params; recommendations home key cố định. Recipe staleTime 1 phút, recommendation 2 phút, global tắt refetchOnWindowFocus.

Khi người dùng cập nhật allergy rồi quay lại màn hình đã cache, kết quả trước thay đổi có thể tiếp tục được xem là fresh. Backend chỉ áp constraints khi có request mới; nó không cập nhật được dữ liệu đang nằm trong cache browser.

**Cải thiện:** xác định các dependencies của profile changes; sau save diet/allergy/schedule invalidate/refetch recipe lists, recommendations và các preview phụ thuộc liên quan. Có thể thêm profile/constraints revision vào key nếu backend cung cấp. Plan lịch sử cần theo snapshot/reanalysis policy, không tự ghi đè lịch sử chỉ vì profile đổi.

**Ca kiểm chứng:** có recipe chứa allergen trong cache → khai báo allergy → quay lại list/recommendations trong vòng staleTime → kết quả phải được làm mới theo hồ sơ mới; kiểm tra loading trước khi dữ liệu an toàn mới được trả.

### F04 — P1: Mapper đang làm mất ý nghĩa “chưa biết” của dinh dưỡng

**Source:** [recipe.dto.ts](../src/features/recipe/types/recipe.dto.ts:29), [recipe.mapper.ts](../src/features/recipe/mappers/recipe.mapper.ts:97), [recipe.model.ts](../src/features/recipe/types/recipe.model.ts:56), [recipe-card.tsx](../src/features/recipe/components/recipe-card.tsx:85).

DTO chấp nhận nutrient null/missing, nhưng mapper dùng `safeNumber(..., 0)` cho calories/protein/carbs/fat/fiber/B12 và Model yêu cầu number. Card/detail có thể hiển thị 0 kcal/0 g vì kiểm tra `typeof value === 'number'` vẫn qua. UI không còn biết đâu là số 0 có dữ liệu và đâu là chưa có dữ liệu.

Quy tắc “Model sạch/non-null” trong ARCHITECTURE cần giới hạn lại theo semantics: mảng có thể chuẩn hóa `[]`, nhưng số dinh dưỡng thiếu phải được giữ nullable hoặc có coverage/status riêng. Các fallback thuận tiện như mặc định thời gian nấu 15+20 phút cũng cần phân biệt dữ liệu thật với giá trị hiển thị mặc định.

**Cải thiện:** dùng nullable nutrient values hoặc một model biểu diễn known/unknown; format “Chưa có dữ liệu” khi unknown. Parse/validate contract theo version cho field quan trọng, không silently default để che contract drift. Test cả null và zero như hai ca khác nhau.

**Ca kiểm chứng:** calories=null, protein=0 → UI hiển thị calories chưa biết và protein 0 g; không tạo calories 0 khi payload không có dữ liệu. Mapper tests hiện kỳ vọng calories=0 cho null DTO nên cần thay kỳ vọng khi sửa policy.

### F05 — P2: AuthProvider đang chặn HTML nội dung của trang public

**Source:** [app/layout.tsx](../src/app/layout.tsx:35), [auth-provider.tsx](../src/components/providers/auth-provider.tsx:10), [home page](../src/app/(site)/page.tsx:1).

Root layout bọc mọi trang trong AuthProvider. Provider khởi tạo `isHydrated=false` rồi trả LoadingState thay children; `useEffect` mới chuyển true ở client. Đã xác minh HTML build của `/`: có thông báo khôi phục phiên, không có `<main>` hoặc `<h1>`. Metadata vẫn có thể được xuất; vấn đề ở HTML nội dung chính và thời điểm user nhìn thấy nó.

37/50 page là client component; `serverFetch` có helper nhưng tìm kiếm chưa thấy consumer bên ngoài chính file helper. Không phải mọi client page đều sai: Pantry/planner/form có lý do tương tác. Với trang public như home, recipe/article detail, cấu trúc hiện tại chưa tận dụng tốt server rendering và data loading ban đầu.

**Cải thiện:** auth provider cung cấp trạng thái `restoring/authenticated/guest`; public shell có thể render trước, chỉ protected subtree/queries cần đợi. Đưa nội dung public quan trọng vào Server Components, giữ interactive islands ở client. Nếu hydrate Query cache từ server, phải thống nhất key/envelope/identity và không cache chia sẻ dữ liệu cá nhân.

**Ca kiểm chứng:** HTML public có nội dung chính trước JavaScript; session restore vẫn hoạt động; trang private không render dữ liệu chưa xác thực. Đo thêm LCP/bundle sau thay đổi; review này chưa đo hiệu năng browser.

### F06 — P2: Refresh coordination cần một cơ chế chịu trách nhiệm rõ ràng

**Source:** [auth-refresh.ts](../src/lib/auth-refresh.ts:87), [axios.ts](../src/lib/axios.ts:119), [auth-guard.tsx](../src/components/shared/auth-guard.tsx:35).

Hiện có interceptor queue, shared refresh promise, Web Locks, localStorage lock/polling và guard timeout 300 ms. `refreshPromise` được gán trong callback Web Lock; các caller đến trước callback có thể cùng xếp hàng rồi refresh tuần tự, không recheck token/throttle trong callback. Nhánh fallback localStorage check/set không nguyên tử; chờ 10×300 ms xong có thể fetch dù TTL lock là 15 giây, chưa có giao thức chuyển token giữa tab trong file đang đọc.

Đây là rủi ro cạnh tranh cần stress trên browser; chưa tái hiện refresh reuse trong lượt review này. Không suy backend rotation có lỗi từ việc client coordination phức tạp. `doFetchRefresh` còn chờ `getMe` qua axios interceptor; cần kiểm tra tình huống `getMe` trả 401 để tránh vòng chờ refresh/queue.

**Cải thiện:** một coordinator single-flight cho trong tab, một giao thức cross-tab có recheck và token/session notification phù hợp; tách refresh transport khỏi interceptor có thể tự refresh. Guard đợi trạng thái auth thật thay vì timer 300 ms. Phân biệt refresh bị reject với network outage trước khi quyết định logout.

**Ca kiểm chứng:** nhiều API 401 cùng lúc, nhiều tab, browser không có Web Locks, mạng chậm >3 giây, refresh lỗi, `getMe` lỗi sau refresh và logout trong lúc refresh. Không ghi token vào báo cáo/log công khai.

### F07 — P2: Quy tắc kiến trúc chưa có gate thực thi đủ chặt

**Source:** [eslint.config.mjs](../../frontend/eslint.config.mjs), [package.json](../../frontend/package.json:17), [query-client.ts](../src/lib/query-client.ts:10), [vitest.config.ts](../../frontend/vitest.config.ts:6).

Full lint còn 89 errors/347 warnings; ngay QueryClient nền tảng có `error: any`. ESLint dùng presets Next/TS nhưng chưa có rule riêng cho feature boundaries/deep imports. lint-staged hiện chỉ chạy Prettier. Không thấy `.github` ở checkout này để chứng minh CI bắt buộc các gate.

602 test pass là tín hiệu tốt nhưng suite chủ yếu kiểm tra mapping/helper, chưa chứng minh browser session/cache/user flows. `vitest.config.ts` chỉ chọn `.test.ts` trong environment node. Test fallback cũ minh họa rằng test pass vẫn có thể giữ một policy đã không còn phù hợp.

**Cải thiện:** xử lý lint errors ở nền tảng trước, tách debt còn lại thành nhóm/owner và chặn phát sinh mới; bổ sung script typecheck và CI checks phù hợp hệ thống CI được chọn. Dùng restricted imports/boundary rules để kiểm tra quy ước. Chỉ bổ sung test có ý nghĩa ở auth lifecycle, invalidation, unknown nutrient và error paths, cùng vài browser flows quan trọng.

### F08 — P2: Feature boundaries đang khác với tài liệu

**Source:** [profile.mapper.ts](../src/features/profile/mappers/profile.mapper.ts), [admin-content.mapper.ts](../src/features/admin-content/mappers/admin-content.mapper.ts), [video.mapper.ts](../src/features/video/mappers/video.mapper.ts), [pantry.queries.ts](../src/features/pantry/queries/pantry.queries.ts:1).

ARCHITECTURE cấm feature import feature khác, nhưng quét alias tìm thấy 125 import declarations chéo feature ngoài test. Nhiều dependency có lý: profile dùng auth user mapper, video dùng post types/mappers, Pantry invalidate billing balance. Cấm tuyệt đối mà không có mô hình chia sẻ thực tế khiến guideline khó thực thi.

**Cải thiện:** xác định rõ tầng nền và dependency được phép. Khái niệm dùng chung ổn định như session user, content metadata, upload transport có public API hoặc module nền nhỏ; orchestration giữa domain đặt ở tầng composition phù hợp. Nếu cho phép feature-to-feature thì công bố dependency direction và import qua public entry point. Không chuyển mọi thứ sang common chỉ để đạt một rule hình thức.

Các form còn import request DTO/DTO enum trực tiếp: custom-meal-form, diet-wizard, program-create-form. Đây là coupling UI với contract, chưa phải bằng chứng component đang render raw response DTO. Có thể dùng FormValues/domain types và mapper request để giữ biên rõ hơn.

### F09 — P2: Trang và component lớn đang gom nhiều trách nhiệm

**Source:** [profile page](../src/app/(site)/profile/page.tsx), [fridge-upload-zone.tsx](../src/features/ingredient-vision/components/fridge-upload-zone.tsx), [receipt-upload-zone.tsx](../src/features/receipt/components/receipt-upload-zone.tsx), [post-editor-form.tsx](../src/features/post/components/post-editor-form.tsx).

Profile page khoảng 940 dòng, home khoảng 596 dòng; upload fridge/receipt khoảng 848/841 dòng với cấu trúc chọn file, preview, progress, rotation/zoom và xử lý upload gần nhau. Post editor khoảng 805 dòng. Số dòng không tự chứng minh bug nhưng các file này thực sự chứa nhiều tab/state/effect/workflow, trái định hướng app chỉ ghép page/providers.

**Cải thiện:** profile page giữ orchestration và các ProfileInfo/Health/Diet/Content/Privacy/Contributor sections ở feature; tách hook điều khiển state và presentation. Chia sẻ một upload controller và preview components cho file handling, giữ quy tắc MAX_IMAGES/kind/create-job riêng từng domain. Với editor, tách schema/defaults/media workflow/form sections; tránh tạo component cực nhỏ chỉ để giảm số dòng.

**Ca kiểm chứng sau refactor:** retry upload không upload lại asset đã commit, object URL được revoke, cancel/resume/version/idempotency đúng, lỗi từng file không làm mất lựa chọn khác; profile tabs giữ URL và trạng thái form.

### F10 — P2: Env lỗi có thể âm thầm trở về localhost ở production

**Source:** [env.ts](../src/lib/env.ts:22), [next.config.ts](../../frontend/next.config.ts).

Khi một biến không hợp lệ, `loadEnv` warn rồi `envSchema.parse({})` trả toàn bộ defaults, có thể làm mất cả BACKEND_API_URL hợp lệ trong cùng object parse. Không có nhánh fail-fast production. Rewrites còn tự chọn process.env trực tiếp, nên có hai đường quyết định backend URL với cách kiểm tra khác nhau.

**Cải thiện:** tách server/public env schema, báo thiếu/sai cấu hình khi production startup/build thay vì tiếp tục dùng localhost; dùng một config contract nhất quán cho rewrites/proxy/server fetch. Fallback development cần được ghi rõ. Không log secret value trong thông báo lỗi.

**Ca kiểm chứng:** production có một biến URL sai phải dừng với lỗi cấu hình dễ hiểu; biến public sai không được làm backend URL hợp lệ biến mất rồi gửi request sang localhost.

### F11 — P2/P3: Dọn phần mô phỏng và đồng bộ hướng dẫn với source

**Source:** [verify-otp](../src/app/(auth)/verify-otp/page.tsx:84), [onboarding](../src/app/(auth)/onboarding/page.tsx:135), [ARCHITECTURE](ARCHITECTURE.md:29), [middleware.ts](../src/middleware.ts).

OTP/onboarding còn timer/toast success, chưa có request tương ứng ở handler; các route vẫn có trong build. Cần gắn trạng thái capability rõ hoặc nối API theo scope được duyệt trước khi coi là flow thật. Với buổi bảo vệ, đây là ưu tiên cao nếu người dùng/giảng viên đi vào hai route đó.

ARCHITECTURE cần bổ sung nullable domain values, owner query keys/session cleanup và invalidation dependencies; sửa ví dụ `/orders` hard-code dù cùng tài liệu cấm hard-code endpoint. Helper server fetch hiện gom lỗi/204/JSON sai thành null và `serverFetchOrThrow` chỉ ném generic Error; trước khi áp dụng SSR rộng cần giữ status/code/requestId để phân biệt 401/404/5xx.

Next.js local docs và build cảnh báo `middleware.ts` deprecated, chuyển `proxy.ts`/export proxy theo migration phù hợp. Đây là debt cập nhật convention, chưa phải lỗi build. Vitest cũng có warning config module/plugin path, có thể dọn sau các vấn đề P1. Chưa thay config hay behavior trong review này.

## Thứ tự cải thiện đề xuất

| Đợt | Phạm vi | Điều kiện hoàn tất |
|---|---|---|
| 1 | F01 + F02 + F03 + F04 | Lỗi ghi không trả success giả; đổi user không còn cache của người trước; đổi allergy làm mới kết quả; null khác zero |
| 2 | F06 + F07 + F10 | Refresh có coordinator và ca cạnh tranh; lint/gates có chính sách bắt buộc; production config sai dừng rõ ràng |
| 3 | F05 + F08 + F09 | Public HTML có nội dung chính; dependency direction được lint; profile/upload/editor đã tách trách nhiệm với behavior được kiểm tra |
| 4 | F11 và đo hiệu năng | Capability/demo rõ ràng; docs khớp source; hoàn tất migration convention; có LCP/bundle evidence khi tối ưu |

Mỗi đợt nên chia thành thay đổi nhỏ theo một luồng, giữ OpenAPI/consumer contracts đồng bộ khi hành vi observable thay đổi. Sau mỗi sửa, chạy typecheck, test liên quan, lint và build theo repository policy; không coi số file scaffold là bằng chứng nghiệp vụ đã hoàn tất.

## Giới hạn của đánh giá

Review này xác nhận source paths, cấu hình, kết quả kiểm tra và HTML build nêu trên. Chưa thực hiện browser reproduction cho account switching, allergy invalidation, refresh race, chưa đo bundle/LCP/accessibility và chưa gọi provider/payments/AI. Các tình huống đó là tiêu chí xác minh cho đợt sửa tiếp theo, không được ghi là đã chạy pass.
