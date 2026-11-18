# 8. Bản đồ luồng code chi tiết (frontend + backend)

**Cập nhật:** 2026-11-16 · **Đối chiếu:** `dev` @ `3c6c59c`, BACKEND_INTEGRATION 4.78.
Mục đích: khi hội đồng hỏi "luồng này chạy thế nào trong code", trả lời theo **entry → validate → quyết định → ghi dữ liệu → response**, và mở đúng file.

> Quy ước: đường dẫn tính từ gốc repo. Số dòng có thể lệch sau này; hãy tìm theo tên hàm/class.

---

## 0. Ba câu để định vị mọi luồng

1. **Ai được gọi?** Route có `authentication.authenticate` hay `optionalAuthenticate`, hoặc public.
2. **Ai quyết định?** Luật nằm ở `service` (và policy), **không** ở controller/UI.
3. **Ghi gì, trong transaction nào?** Tìm `repository`, `$transaction`, `expectedVersion`, `idempotencyKey`.

---

## 1. Khung chung backend: một request đi qua đâu

```
HTTP
 → app.ts (mount route, helmet/CORS/pino/cookie/json)
 → router: authentication.authenticate + validateParams/Query/Body(zod)
 → controller: lấy dữ liệu đã validate, gọi service, parse response schema
 → service: luật nghiệp vụ, quyền, state, transaction điều phối
 → repository: Prisma/Mongo; provider: AI/Cloudinary/Maps/payOS
 → controller: { success, data, meta } | lỗi → error-handler
```

Bằng chứng:
- `backend/src/app.ts` — composition root, mount toàn bộ router.
- `backend/src/modules/pantry/pantry.router.ts` — mẫu router: `authenticate` → `validateParams` → `validateBody` → controller.
- `backend/src/common/validation/validate-request.ts` — gắn dữ liệu đã parse vào request.
- `backend/src/common/errors/app-error.ts` + `common/middleware/error-handler.ts` — chuẩn hoá lỗi, message tiếng Việt, `requestId`.

**Error envelope:**
```json
{ "success": false, "error": { "code": "PANTRY_VERSION_CONFLICT", "message": "…", "fields": {}, "requestId": "…" } }
```
Nếu hội đồng hỏi "vì sao FE bắt được lỗi nghiệp vụ?": vì FE đọc `error.code` (`lib/api-error.ts`), không parse message.

---

## 2. Khung chung frontend: một click → render

### Client Component
```
Component
 → useXxxQuery()/useXxxMutation()      (queries/*.queries.ts, Query Key Factory)
 → xxxApi.getXxx()                     (api/*.api.ts, axios)
 → res.data.data (DTO envelope)        (đọc envelope MỘT lần tại API)
 → xxxMapper.toModel(dto)              (mappers/*.mapper.ts)
 → Model (camelCase, non-null, formatted)
 → render loading / error / empty / success
```

### Server Component
```
page.tsx (RSC)
 → lib/server-fetch.ts (đọc cookie HttpOnly, gắn Bearer, revalidate/tags)
 → mapper → Model → render
```
Bằng chứng: `frontend/src/lib/server-fetch.ts`, `frontend/src/lib/axios.ts`, `frontend/src/lib/mapper/field-helpers.ts`.

**Vì sao phải có Mapper** (câu rất dễ bị hỏi):
- BE đổi tên field, trả `null` thay `[]`, số dạng chuỗi → UI không vỡ.
- `pickField(dto, ['id','_id'], '')` + `safeNumber/safeString/safeDate/safeArray`.
- UI **không bao giờ** đọc DTO; nếu vi phạm là lỗi kiến trúc.

**Ví dụ thật:** `frontend/src/app/(site)/pantry/page.tsx` (RSC + Suspense skeleton) → `pantry-client-view.tsx` (`'use client'`, gọi `usePantryItemsQuery`) → `pantry.queries.ts` → `pantry.api.ts` → `pantry.mapper.ts`.

---

## 3. Auth & refresh (luồng bị hỏi nhiều nhất)

### Đăng nhập
1. `POST /api/v1/auth/login` → `AuthService.login`: so hash mật khẩu, tạo **access token JWT** (mặc định 900s) + **refresh token** (30 ngày, hash lưu DB, thuộc `familyId`).
2. Backend trả access token trong body + refresh token trong **HttpOnly cookie**.
3. Web đi qua Route Handler `frontend/src/app/api/auth/login/route.ts` để `Set-Cookie` cùng domain.
4. Client lưu access token **in-memory** (`lib/auth-token.ts`), user vào Zustand.

### Refresh
- `frontend/src/lib/axios.ts`: request 401 → nếu từng có phiên → `sharedRefresh()`; các request khác xếp hàng chờ, rồi retry bằng token mới.
- `frontend/src/lib/auth-refresh.ts`: singleton promise + **Web Locks cross-tab** (fallback localStorage lock) để **không bao giờ** gửi 2 refresh song song.
- `backend/src/modules/auth/auth.service.ts` (`refresh`): xoay token; nếu phát hiện refresh token đã dùng → **revoke cả family** và trả `REFRESH_TOKEN_REUSED`.
- `AuthenticationMiddleware`: verify JWT, đọc lại user từ DB; `role` trong token khác role hiện tại → `STALE_ACCESS_TOKEN` (buộc đăng nhập lại sau khi đổi quyền).

**Câu nói 20s:**
> "Access token ngắn hạn giữ trong memory để giảm XSS; refresh token HttpOnly + rotation + phát hiện reuse. Vì backend revoke cả family khi reuse, frontend phải dedup refresh trong tab và cross-tab bằng Web Locks."

**Bẫy:** "Vì sao không lưu token localStorage?" → Vì XSS đọc được; cookie HttpOnly + memory là lựa chọn có đánh đổi (CSRF được xử lý bằng CORS/credentials + same-site).

---

## 4. Chat SSE — luồng khó nhất, nên nắm chắc

### Backend
`backend/src/modules/chat/chat.controller.ts` → `sendMessage`:
1. Tạo `AbortController`; gắn `request.aborted` và `response.close` để huỷ khi client rời.
2. `service.prepareStream(...)` trả `AsyncIterable<ChatSseEvent>`.
3. Set header `text/event-stream`, `no-cache`, `no-transform`, `X-Accel-Buffering: no`; `flushHeaders()`.
4. `for await` từng event → `response.write('event: …\ndata: …\n\n')`.
5. Lỗi giữa stream → ghi event `error` với `partial: true`; `finally` đóng response.

`backend/src/modules/chat/chat.service.ts` — `prepareStream`:
1. `ai.chatEnabled` false → `503 AI_FEATURE_DISABLED`.
2. Guest: purge lịch sử hết hạn + rate limit theo phút.
3. `prepareTurn`: idempotency key + hash payload; trùng key khác payload → `409 CHAT_IDEMPOTENCY_CONFLICT`; request đang xử lý → `409 CHAT_REQUEST_IN_PROGRESS`; đã xong → **replay** kết quả, không gọi lại AI.
4. Câu hỏi khẩn cấp/ngoài phạm vi → trả câu an toàn **không trừ quota**.
5. **Reserve quota trước khi gọi provider** (`reserveQuota`), có thể lấy từ gói mua (`paidReservation`).
6. Ghi `AiRequestLog` đã redact (prompt hash, topic codes, không lưu prompt thô).
7. `providerStream`: moderate trước → nếu flagged trả `SAFETY_RESPONSE`; nếu provider lỗi → fallback tĩnh, **không trừ quota**; stream delta; xong → `message_complete` + `quota`; lỗi → **release quota**.

**Event SSE:** `message_start`, `content_delta`, `quota`, `message_complete`, `error`.

### Frontend
`frontend/src/features/chat/api/chat-stream.ts`:
- Dùng `fetch` + `ReadableStream`, **không dùng axios** (để interceptor refresh/toast không chen vào stream).
- Gửi `Authorization` + `credentials: include`; nếu 401 thì `sharedRefresh()` **một lần** rồi gửi lại.
- Đọc `reader.read()`, cộng `buffer`, tách block bằng `\n\n`, parse `event:`/`data:`.
- `content_delta` → callback `onDelta`; `message_complete` → đánh dấu completed; `error` → dừng và báo code.
- Trả `{ content, topicCodes, aborted, completed }`.

`frontend/src/features/chat/queries/chat.queries.ts`:
- Buffer stream giữ ở `useState` (`streamingContent`) — **ephemeral**, không nhét vào cache.
- Chỉ khi `message_complete` mới `invalidateQueries(messages)`.
- `AbortController` huỷ khi unmount; `onQuota` invalidate billing.
- Map `error.code` → thông điệp tiếng Việt (`AI_QUOTA_EXCEEDED`, `AI_FEATURE_DISABLED`, `AI_RATE_LIMITED`, `CHAT_REQUEST_IN_PROGRESS`).

#### Vì sao dùng `fetch` + `ReadableStream` thay vì axios?

**Bản chất:** SSE là một HTTP response **giữ mở và trả dần**. Axios được thiết kế cho chu kỳ request → response hoàn chỉnh: promise chỉ resolve khi body đã nhận xong. Với SSE, ta cần đọc từng chunk ngay khi header tới.

**Với cấu hình hiện tại của repo:**
1. `frontend/src/lib/axios.ts` dùng adapter mặc định của trình duyệt (XHR). Adapter này **buffer toàn bộ body**; `responseType: 'stream'` không được hỗ trợ trong browser; `onDownloadProgress` chỉ cho biết tiến độ, **không phải reader** để tách từng event.
2. Response interceptor của axios chỉ chạy khi request kết thúc. Success handler `return response` — lúc đó không còn stream để đọc.
3. Error interceptor có tác dụng phụ toàn cục:
   - 401 → `sharedRefresh()` rồi **retry lại nguyên request** (gửi lại body chat).
   - Lỗi mạng giữa stream → toast "Không thể kết nối đến máy chủ" đè lên UI chat.
   - Session hết hạn → toast toàn cục + `forceLogout()` + redirect, kể cả khi request đặt `silent`.
   - Timeout mặc định 15s của instance áp cho **toàn bộ** request; câu trả lời dài sẽ bị cắt dù server vẫn đang stream.
4. `silent: true` chỉ tắt toast nghiệp vụ của request đó, **không** tắt toast session-expired toàn cục.

**Vì vậy `fetch` phù hợp hơn:**
- `fetch` trả `Response` ngay khi header đến; `response.body.getReader()` cho từng chunk.
- Tự kiểm soát `AbortController` (đóng tab/dừng) và chỉ refresh **một lần** khi 401, không retry mù.
- Không đi qua interceptor nên không có toast/forceLogout chen vào giữa hội thoại.
- Vẫn tái dùng đúng các primitive auth: `getAccessToken`, `useAuthStore`, `sharedRefresh`, `API_BASE_URL` (`chat-stream.ts` dòng 8–10, 44–61).

**Đánh đổi phải nói rõ:** bỏ axios thì phải tự làm 4 việc — gắn `Authorization`, `credentials: 'include'`, đọc envelope lỗi khi non-2xx, refresh một lần + abort. Đây là lý do `chat-stream.ts` dài hơn một lời gọi axios, nhưng đổi lại luồng stream minh bạch và không bị side-effect toàn cục.

**Vì sao không dùng `EventSource`?** `EventSource` chỉ GET, không gửi được `Authorization` header và không có body — không phù hợp để gửi câu hỏi + idempotency key. Nó cũng tự reconnect, có thể replay tin nhắn ngoài ý muốn.
**Vì sao không WebSocket?** Nhu cầu một chiều server→client; SSE nhẹ hơn, đi qua HTTP/proxy/ngrok sẵn có, không cần handshake/room.

> Nếu bị hỏi "axios 1.x có fetch adapter mà?": đúng, có thể cấu hình để stream, nhưng khi đó vẫn phải đổi adapter + `responseType`, vẫn đi qua interceptor và vẫn phải tự parse SSE. Gọi `fetch` trực tiếp ngắn hơn, ít phụ thuộc hành vi nội bộ của axios hơn.

**Câu nói 20s:**
> "Chat là POST stream, không phải EventSource, vì cần body + Authorization. Backend giữ chỗ quota trước khi gọi provider; lỗi/fallback thì hoàn. Frontend đọc stream bằng buffer `\n\n`, chỉ commit vào cache khi `message_complete` để tránh nửa câu bị lưu."


**Bẫy:** "Nếu client đóng tab giữa stream?" → `AbortController` ở controller abort provider; quota được release; message đánh dấu failed. "Nếu retry cùng idempotency key?" → replay, không trừ thêm.

---

## 5. AI recipe draft — "gen AI" nhưng không được publish

### Backend
`backend/src/modules/content/recipe-draft.router.ts` → controller → `recipe-draft.service.ts`:
1. Kiểm tra `config.ai.recipeEnabled` + `governance.allowed('RECIPE_DRAFT', provider)`; không đạt → `503 RECIPE_DRAFT_UNAVAILABLE`.
2. `provider.suggest(input)` — `recipe-draft.provider.ts`:
   - OpenAI **Responses API**, `text.format = json_schema` strict.
   - Schema bắt buộc: title, description, body, servings, prep/cook, difficulty, ingredients[], steps[], confidence, assumptions.
   - Instruction: **giữ đúng số lượng/thứ tự nguyên liệu**, không bịa nguyên liệu mới; user text chỉ là dữ liệu.
   - `store: false`; không gửi ảnh.
3. Chuẩn hoá: nếu provider trả thiếu/thừa ingredient → pad/cắt cho khớp input; lọc `affectedIngredientPositions` hợp lệ.
4. Validate lại bằng `createRecipePostRequestSchema` → trả `draft` + `confidence` + `assumptions` + `suggestedTiming` + `provenance`.
5. Lỗi → `RECIPE_DRAFT_GENERATION_FAILED` (503) và ghi governance `FAILED`.
6. **Không** tạo Post, **không** publish, **không** ghi canonical nutrition.

### Frontend
- `frontend/src/features/recipe/api/recipe-draft.api.ts`: `POST` timeout 60s, `silent: true`; map qua `recipeDraftMapper`.
- `queries/recipe-draft.queries.ts`: mutation + toast theo `error.code`.
- `components/ai-recipe-draft-assistant.tsx`: nhận `seed` (title/description/servings/times + tên nguyên liệu đã nhập), gọi mutation, mở `RecipeDraftPreviewDialog`.
- `onApplyDraft` đổ vào `RecipeEditorForm`; **tác giả vẫn phải chọn category, ảnh bìa và bấm lưu/submit**.

#### Đường đi chính xác của `onApplyDraft` → `RecipeEditorForm`

```
AiRecipeDraftAssistant (bước "Nguyên liệu")
  └─ useGenerateRecipeDraftMutation()  → POST /api/v1/recipe-drafts/generate
      └─ RecipeDraftPreviewDialog → nút "Áp dụng" → onApply()
          └─ page.handleApplyDraft(draft)
              ├─ editorRef.current.hasUserContent() === true
              │    → OverwriteConfirmDialog → handleConfirmOverwrite → applyDraftToEditor
              └─ false → applyDraftToEditor
                  └─ recipeDraftMapper.toFormValues(draft)
                      └─ editorRef.current.setDraftValues(formVals)
                          └─ RecipeEditorForm: form.reset({...})
  └─ Tác giả: chọn danh mục, upload ảnh bìa, kiểm tra dinh dưỡng
      └─ handleSubmit → useCreateAndSubmitRecipeMutation (POST /posts + POST /posts/:id/submit)
```

**Từng mắt xích:**

1. `frontend/src/features/recipe/components/recipe-editor-form.tsx`
   - Tính `seed` từ `form.watch()` (title, description, servings, prep/cook, tên nguyên liệu) — khoảng dòng 345.
   - Chỉ render slot AI ở `step === 'ingredients'`: `renderAssistant?.(seed, { editBasics: () => goTo('basics') })` — khoảng dòng 545. Vì vậy AI nằm đúng bước nguyên liệu, không phải một trang riêng.
   - `useImperativeHandle` mở 3 hàm: `setDraftValues`, `isDirty`, `hasUserContent`.
   - `setDraftValues` gọi `form.reset({...current, ...values, ...applyDraftBasics(current, values), ingredients: map giữ ingredientId theo tên trùng, categoryId: values.categoryId || current.categoryId, coverImageUrl: values.coverImageUrl || current.coverImageUrl, coverMedia: values.coverMedia ?? current.coverMedia}, { keepDefaultValues: true })`.
   - `hasUserContent` chỉ trả true nếu đã có tên/định lượng nguyên liệu hoặc nội dung bước nấu — dùng để bảo vệ dữ liệu người dùng.

2. `frontend/src/app/(site)/recipes/new/page.tsx`
   - `editorRef = useRef<RecipeEditorFormHandle>(null)`.
   - Truyền `renderAssistant` → `<AiRecipeDraftAssistant onApplyDraft={handleApplyDraft} />`.
   - `handleApplyDraft`: nếu `hasUserContent()` → mở `OverwriteConfirmDialog`; ngược lại `applyDraftToEditor`.
   - `applyDraftToEditor`: `recipeDraftMapper.toFormValues(draft)` → `editorRef.current?.setDraftValues(formVals)` → toast nhắc "kiểm tra định lượng, liên kết nguyên liệu chuẩn rồi chọn danh mục".

3. `frontend/src/features/recipe/components/ai-recipe-draft-assistant.tsx`
   - Nhận `seed`, gọi mutation; thành công → `setSuggestion(data)` + mở `RecipeDraftPreviewDialog`.

4. `frontend/src/features/recipe/components/recipe-draft-preview-dialog.tsx`
   - Nút "Áp dụng" gọi `onApply`; dialog hiển thị confidence, assumptions và cảnh báo "định lượng gợi ý ban đầu, có thể chỉnh sau".

5. `frontend/src/features/recipe/mappers/recipe-draft.mapper.ts#toFormValues`
   - Chỉ trả: `title`, `description`, `servings`, `prepTimeMinutes`, `cookTimeMinutes`, `difficulty`, `ingredients` (**`ingredientId: null`**), `steps`.
   - **Không** trả `categoryId`, `coverImageUrl`, `coverMedia`, `nutrition`.
   - Đây là bằng chứng trực tiếp: AI không thể chọn danh mục, không thể tạo ảnh bìa, không thể khai dinh dưỡng thay tác giả.

6. `frontend/src/features/recipe/utils/recipe-form-values.ts#applyDraftBasics`
   - Title/description/servings/prep/cook: nếu người dùng đã nhập thì **giữ của người dùng**, chỉ điền khi trống. Vì vậy AI không ghi đè thông tin cơ bản tác giả đã nhập.

7. `frontend/src/features/recipe/schemas/recipe-form.schema.ts`
   - `categoryId: z.string().min(1, 'Chọn danh mục món ăn')` → **bắt buộc**.
   - `coverImageUrl` optional; UI ghi "Ảnh bìa món ăn — Khuyến khích" (khoảng dòng 513), upload qua `ImageUploader`.
   - `ingredients`/`steps` tối thiểu 1.
   - `buildRecipeFormSchema({ requireNutrition })`: Contributor/Admin phải nhập đủ 6 chỉ số; Member để trống được (backend tính).

8. Submit
   - `page.handleSubmit` → `recipeFormToRecipe(values)` (map form → domain) → `useCreateAndSubmitRecipeMutation` (`recipe.queries.ts`): `recipeApi.createRecipe` rồi `submitSavedRecipe` = `POST /posts` + `POST /posts/:id/submit`.
   - Modal thành công đọc `revisionStatus/status` **backend trả về** để phân biệt `PUBLISHED` (Contributor/Admin sạch) và chờ duyệt.

**Kết luận để trả lời hội đồng:**
> "AI chỉ điền phần nội dung có thể suy ra từ danh sách nguyên liệu: định lượng, bước nấu, độ khó, thời gian. Nó **không** chọn danh mục, không tạo ảnh bìa và không ghi dinh dưỡng; ba phần đó vẫn là thao tác của tác giả. Form còn giữ nguyên title/mô tả/khẩu phần người dùng đã nhập, và chặn ghi đè nếu đã có nguyên liệu/bước nấu."

**Lưu ý chính xác hóa:** ảnh bìa hiện là **khuyến khích**, không bắt buộc bởi schema (`coverImageUrl` optional). Khi nói trước hội đồng nên nói "tác giả tự chọn danh mục (bắt buộc), tự tải ảnh bìa (khuyến khích, AI không tạo), và bấm gửi duyệt" — đừng nói "bắt buộc ảnh bìa" nếu chưa đổi schema.

**Câu nói 20s:**
> "AI recipe là endpoint sinh draft có JSON schema strict, chỉ điền phần thiếu và giữ nguyên input tác giả. Output được validate lại bằng schema tạo bài, nhưng không có quyền tạo hay publish bài — nó chỉ đổ vào form."


**Bẫy:** "Nếu AI bịa nguyên liệu?" → Prompt cấm + giữ đúng count/order + service pad/cắt + schema; cuối cùng tác giả review. "Vì sao không cho AI publish?" → Vì ranh giới an toàn: nội dung công khai phải qua review.

---

## 6. Scan tủ lạnh (fridge recognition)

### Trước job: ảnh phải là asset đã commit
Upload đi qua storage quota (reserve → Cloudinary → commit), trả `MediaAsset`. Job chỉ nhận `FRIDGE_IMAGE` **owner-scoped**.

### Tạo job
`ingredient-recognition.service.ts#create`:
1. `ensureEnabled()` — tắt cấu hình → lỗi rõ ràng.
2. Giới hạn số ảnh (`config.vision.maxImages`).
3. `loadValidAssets`: chỉ asset của owner, đúng loại, đã commit.
4. **Dedup theo nội dung**: ảnh trùng ETag chỉ phân tích một lần (`common/media/asset-dedup.ts`).
5. `repository.createJob`: idempotency key + `requestHash`; trùng key khác ảnh → `409 RECOGNITION_IDEMPOTENCY_CONFLICT`.
6. `schedule()` chạy nền `setImmediate` (job đã persist; GET job `QUEUED` sẽ schedule lại).

### Xử lý
`process()`:
1. `startProcessing` (transaction, fencing) — job đã bị job khác xử lý thì bỏ.
2. Provider đổi model/template so với lúc tạo → `FAILED RECOGNITION_PROVIDER_UNAVAILABLE`.
3. Gọi provider cho từng ảnh `PENDING`; lỗi từng ảnh được ghi `error`.
4. `deduplicate`: normalize tiếng Việt, gom theo canonical ingredient hoặc unknown name; **không cộng dồn số lượng** giữa các ảnh (có thể chụp trùng vật thể); giữ evidence từng ảnh + confidence cao hơn + note.
5. `saveResults`: candidates + trạng thái input; thành công một phần → `PARTIAL_FAILED`.

### Người dùng sửa
`PATCH /jobs/:id/candidates/:candidateId`: sửa tên/số lượng/đơn vị, gán canonical ingredient, hoặc reject; kiểm tra **expectedVersion** để tránh ghi đè.

### Confirm — ranh giới duy nhất ghi Pantry
`confirm()`:
1. Hash request + idempotency.
2. `repository.confirm` chạy trong **một `$transaction`**: kiểm tra job chưa confirm, candidate thuộc job, version khớp; tạo/cộng Pantry item; ghi ledger adjustment; đánh dấu job `CONFIRMED`.
3. Trả `pantryChanges` để UI hiển thị diff.
4. Sai version → `RECOGNITION_VERSION_CONFLICT`; confirm lặp → replay/không cộng đôi.

### Retry / cancel
- `retry`: chỉ job `FAILED`/`PARTIAL_FAILED`, chỉ ảnh lỗi; idempotent.
- `cancel`: trước confirm; ảnh đã commit vẫn tính dung lượng.
- Thêm ảnh: `POST /jobs/:id/images`, gộp candidate **không cộng dồn**, giữ chỉnh sửa/reject của user.

**Câu nói 20s:**
> "Scan là job bất đồng bộ: upload asset trước, tạo job idempotent, provider đọc ảnh, dedupe theo nguyên liệu và không cộng số lượng giữa các ảnh. Toàn bộ Pantry chỉ thay đổi ở một transaction confirm; trước đó user sửa/từ chối từng candidate."

**Bẫy:** "Vì sao không cộng số lượng từ 2 ảnh?" → Cùng một hũ có thể xuất hiện 2 ảnh; cộng sẽ sai. Hệ thống giữ estimate tin cậy hơn và bắt user xác nhận.

---

## 7. Scan hóa đơn + shopping gap

### Khác fridge ở đâu
- Ảnh `RECEIPT_IMAGE`, tối đa 4 ảnh.
- Có **metadata hóa đơn** (merchant, date, total, currency, receipt number) và **identity/dedup** (`receipt.dedup.ts`).
- Có phân loại **non-food** và exclusion notice.
- Confirm phải quy đổi đơn vị và xử lý trùng.

### Pipeline
`receipt.service.ts`:
1. `create`: idempotent, giới hạn ảnh, asset hợp lệ.
2. `process`: provider trích lines → `mapProviderLines` (tên, quantity, unit, price, confidence) → lưu candidate + metadata.
3. `updateCandidate`: sửa dòng, restore dòng bị loại, reject.
4. `confirm`:
   - Không cho confirm candidate `REJECTED && aiClassification=NON_FOOD` → `RECEIPT_CANDIDATE_EXCLUDED` (phải restore trước).
   - Thiếu quantity/unit → `RECEIPT_CANDIDATE_INCOMPLETE`.
   - `resolveConversion`: chỉ dùng household conversion **đã review/approved**; không có → giữ trạng thái chưa quy đổi.
   - `repository.confirm` transaction: idempotency + identity decision + tạo/cộng Pantry + ledger + job CONFIRMED; trả `duplicateCandidates` và `pantryChanges`.
5. Identity:
   - Khác số hóa đơn → **hai lần mua**, cộng dồn.
   - Không có số: trùng chính xác cần merchant + date + total + currency + **toàn bộ multiset dòng**.
   - Trùng một phần → `reviewRequired` / `identityDecisionRequired`; user chọn **cùng hóa đơn** hay **lần mua khác** (`receiptReviewDecision`).
   - Xác nhận trùng không cộng Pantry lần hai, kể cả qua job khác.

### Shopping gap
`GET/POST /shopping-lists/preview` → `receipt.service.ts#shoppingGap`:
```
required (recipe/custom meal + servings)
 - available (Pantry confirmed + quy đổi được + chưa hết hạn)
 = missing
```
- Chỉ trừ item `CONFIRMED`, còn hạn, quy đổi được.
- Free-text pantry chỉ khớp khi normalize **trùng chính xác** canonical name hoặc alias đã duyệt (không fuzzy).
- `unresolvedItems` tách riêng, không coi là 0.

**Câu nói 20s:**
> "Hóa đơn không chỉ là ảnh: còn identity để phân biệt cùng hóa đơn với lần mua khác. Dòng phi thực phẩm bị loại nhưng user restore được. Shopping gap chỉ trừ tồn kho confirmed, còn hạn và quy đổi được; phần không quy đổi thì báo riêng."

**Bẫy:** "Nếu hai ảnh chụp cùng hóa đơn?" → Không cộng đôi nhờ identity + transaction + idempotency. "Nếu ảnh một phần?" → merge để user review, quyết định trước confirm.

---

## 8. Meal plan generate

`backend/src/modules/meal-plans/meal-plan.service.ts#generate`:
1. **Idempotency**: key + `payloadHash`; trùng key khác payload → `MEAL_PLAN_IDEMPOTENCY_CONFLICT`; trùng payload → trả plan cũ.
2. Thiếu health profile → `409 HEALTH_PROFILE_INCOMPLETE`.
3. Kiểm tra lịch ăn chay định kỳ cho **toàn bộ tuần** trước khi tạo.
4. `targetCalories = round(TDEE × goalFactor)`; macro targets theo cấu hình.
5. Với từng ngày: build constraints từ profile (allergy/exclusion/diet/tradition) → `findMealPlannerCandidates` (đã lọc cứng) → `rankPublishedRecipes`.
6. Chọn tổ hợp bữa (`selectDailyCombination`) theo calorie/macro tolerance, độ lặp, nguyên liệu đã dùng; **không hạ chuẩn cứng**.
7. Sinh **21 slot** (7 ngày × sáng/trưa/tối) + slot phụ nếu có; slot không có ứng viên → `UNFILLED` + `reasonCodes:['NO_HARD_COMPATIBLE_CANDIDATE']`, `warningCodes:['UNFILLED_SLOT']`.
8. `outputWithAnalysis`: lấy analysis hiện tại; nếu stale/thiếu item → tính lại (`MealAnalysisService`), fingerprint theo thuật toán + constraint.
9. Swap/manual add: kiểm tra hard constraint trước, sau đó mới cảnh báo mềm (vượt calo/macro).

**Câu nói 20s:**
> "Generate không phải random: mỗi ngày lọc ứng viên bằng constraint cứng trước, xếp hạng sau, rồi chọn tổ hợp 3 bữa. Không đủ ứng viên thì để slot UNFILLED có lý do, không hạ chuẩn an toàn. Analysis có fingerprint nên sửa plan là tự stale."

**Bẫy:** "Vì sao không luôn đủ 21 món?" → Vì có thể không có món hard-compatible; che giấu bằng món vi phạm là sai.

---

## 9. Content submit, review và dinh dưỡng công thức

### Tạo/sửa
- `createPost`: tạo Post + Revision `DRAFT` (snapshot bất biến).
- `updatePost`: nếu revision mới nhất đang `PENDING_REVIEW/FLAGGED/QUARANTINED` → chặn; ngược lại tạo **revision mới**, bản publish cũ vẫn công khai.
- Slug: tiêu đề trùng vẫn OK; slug tự sinh unique; sửa không đổi URL trừ khi yêu cầu.

### Submit
`content.service.ts#submitPost`:
1. Post bị `HIDDEN/DELETED` → chặn.
2. Phải submit **đúng revision mới nhất** và đúng `version`.
3. Chỉ revision `DRAFT` được submit.
4. Recipe của Contributor/Admin đang hoạt động: bắt buộc đủ **6 chỉ số** (`RECIPE_NUTRITION_REQUIRED`).
5. `ModeratedPublicationPolicy.decideSubmission`:
   - `autoPublish` + **không có moderation flag** → `PUBLISHED` ngay, ghi audit.
   - có flag hoặc Member → `PENDING_REVIEW`.
6. Nếu là recipe: gọi `onRecipeSubmitted` (không được làm fail submit) để tính estimate + có thể tạo AI job.

### Duyệt
`moderation.service.ts`:
- `canDecide` = Admin **hoặc** (bài không phải Admin, người duyệt không phải tác giả, không có AI flag OPEN, dưới 5 reporter, revision PENDING_REVIEW).
- Duyệt recipe cần đủ **5 chỉ số cuối** (calories, protein, carbs, fat, fiber) — B12 không bắt buộc.
- Override của reviewer ghi audit (actor, role, reason, before/after); `SELF_APPROVAL_FORBIDDEN`.
- AI flag/report chỉ tạo signal; không auto-delete.

### Dinh dưỡng
`recipe-nutrition-review.service.ts`:
- `calculate` deterministic từ canonical data; thiếu dữ liệu → 1 job AI nền (1 lần + 3 retry), `AI_ESTIMATED`.
- Panel hiển thị estimate / author / override / final + confidence + uncovered + job state + previous approved.
- Auto-published recipe chỉ lưu **canonical-only**, không gọi AI.
- Approve ghi giá trị final vào `RecipeDetail` cho card/meal planner; cancel job.

**Câu nói 20s:**
> "Nội dung là revision bất biến. Submit kiểm tra đúng revision/version; Contributor có profile hợp lệ và không bị flag thì auto-publish, còn lại vào queue. Duyệt recipe bị khoá nếu thiếu 5 chỉ số; mọi sửa của reviewer đều có audit."

---

## 10. Pantry: version, ledger, capacity

- Mọi thay đổi số lượng đi qua `PantryAdjustment` (ledger), không sửa trực tiếp.
- `expectedVersion` bắt buộc cho update/delete → `PANTRY_VERSION_CONFLICT`.
- Trừ quá số lượng → `PANTRY_NEGATIVE_QUANTITY`.
- Capacity đếm **mọi item chưa xoá**, kể cả quantity 0; kiểm tra trong transaction ở cả 3 đường: tạo tay, confirm scan, confirm receipt.
- Item quá hạn không được tính vào shopping available.
- Merge có preview + transaction, khoá để tránh race.

**Câu nói 20s:**
> "Pantry là sổ cái: mỗi thay đổi là một adjustment, update dùng expectedVersion. Capacity kiểm tra trong transaction ở cả ba đường ghi, nên hai request đồng thời không thể vượt giới hạn."

---

## 11. Billing payOS

1. `POST /billing/orders`: idempotency + `expectedProductVersion`; giá/quyền lợi **snapshot** vào order.
2. Tạo checkout payOS; lưu order code/link/URL; TTL 15 phút.
3. User quay lại `BILLING_RETURN_URL` → **chỉ hiển thị**, không grant.
4. `POST /billing/payos/webhook`: verify chữ ký → **query lại provider** (authoritative) → khớp order/link/amount.
5. `settle` trong transaction:
   - `PaymentEvent.transactionKey` unique → chống grant trùng.
   - Order đã PAID → không làm gì (PAID không bao giờ downgrade).
   - Grant entitlement **một lần**, set PAID + `paidAt`.
6. UNDERPAID/PROCESSING → PENDING; thiếu tiền không cộng quyền lợi, không auto-refund.
7. Thiếu credential → checkout disabled, **không mock fallback**.

**Câu nói 20s:**
> "Chỉ webhook đã verify và query lại provider mới grant. Return URL không có quyền. Grant nằm trong transaction với transactionKey unique nên callback trùng không cộng hai lần."

---

## 12. Restaurant (ngắn)

- Adapter `MapsProvider` (fake/Google/SerpApi), không lưu vị trí liên tục.
- Discovery/details **không** áp hồ sơ ăn uống; chỉ filter người dùng chọn.
- `dietPattern` tường minh chỉ lọc claim nội bộ đã duyệt; provider place vẫn “chưa kiểm chứng”.
- SerpApi ≤5km dùng snapshot bounded + lọc khoảng cách thật; partial giữ kết quả đã có, báo degradation.
- Attribution hiển thị riêng.

---

## 13. Mẫu cắt ngang (nên thuộc lòng)

| Mẫu | Ở đâu | Trả lời 1 câu |
|---|---|---|
| Envelope | controller + `api-envelope.schemas.ts` | Mọi response `{success,data,meta}`; lỗi `{success,error{code,…}}`. |
| Idempotency | bảng có `idempotencyKey` + hash | Cùng key + cùng payload → replay; khác payload → 409. |
| Optimistic concurrency | `expectedVersion` | Ghi đè bị chặn; client refetch rồi tính lại. |
| Transaction | `prisma.$transaction` | Confirm/grant/quota/ledger nằm trong một transaction. |
| Provider adapter | `AiProvider`, `MapsProvider`, `MediaProvider`, payOS | Domain không phụ thuộc vendor; đổi provider bằng config. |
| Provenance | nutrition estimate | `CANONICAL_CALCULATED/AI_ESTIMATED/USER_PROVIDED/VERIFIED_OVERRIDE`. |
| Audit | moderation, contributor, billing, AI governance | Actor, thời gian, lý do, trước/sau. |
| Soft delete | chat session, pantry, post | Giữ dữ liệu theo retention; loại khỏi truy vấn. |

---

## 14. Tra nhanh: câu hỏi → file

| Câu hỏi | Mở |
|---|---|
| Toàn bộ route mount ở đâu? | `backend/src/app.ts` |
| Một module mẫu đầy đủ? | `backend/src/modules/pantry/*` |
| Validate request? | `common/validation/validate-request.ts`, `*.schemas.ts` |
| Lỗi chuẩn hoá? | `common/middleware/error-handler.ts` |
| Auth verify? | `modules/auth/authentication.middleware.ts`, `token.service.ts` |
| Refresh rotation? | `modules/auth/auth.service.ts#refresh` |
| SSE backend? | `modules/chat/chat.controller.ts`, `chat.service.ts#prepareStream` |
| SSE frontend? | `frontend/src/features/chat/api/chat-stream.ts` |
| AI recipe? | `modules/content/recipe-draft.*` |
| Fridge scan? | `modules/ingredient-recognition/*` |
| Receipt scan? | `modules/receipts/*` |
| Shopping gap? | `modules/receipts/receipt.service.ts#shoppingGap` |
| Meal plan? | `modules/meal-plans/meal-plan.service.ts` |
| Content publish? | `modules/content/content.service.ts`, `content-publication.policy.ts` |
| Duyệt & self-approval? | `modules/moderation/moderation.service.ts` |
| Nutrition estimate? | `modules/recipe-nutrition/*` |
| Pantry transaction? | `modules/pantry/pantry.repository.ts` |
| Billing webhook? | `modules/billing/billing.service.ts`, `billing.router.ts` |
| Hard constraints? | `modules/content/search-constraints.ts` |
| Mapper FE? | `frontend/src/lib/mapper/*` |
| Axios + refresh? | `frontend/src/lib/axios.ts`, `lib/auth-refresh.ts` |
| Render mẫu? | `frontend/src/app/(site)/pantry/*` |

---

## 15. Sai lệch tài liệu cần biết trước khi bị hỏi

| Điểm | Trạng thái đúng | Ghi chú |
|---|---|---|
| AI recipe draft | **READY** (2026-11-07) | README defense cũ ghi IN_PROGRESS; registry hiện READY. |
| Fridge/receipt jobs | **IN_PROGRESS** | Có source + UI + fake provider; chờ validate ảnh Việt Nam thật (P0). |
| Backend test | Không có unit/integration suite | Gate là lint/typecheck/build + acceptance script chạy tay. |
| Mobile | Có parity một phần | Bổ sung 4.78 (2026-11-16) cho các thay đổi gần đây; vẫn có màn/feature chưa bằng web. |
| Billing | Development/test only, real money | payOS không có sandbox; thiếu credential thì tắt checkout. |
| Admin billing catalog | IN_PROGRESS (2026-11-10) | Có UI/route; acceptance đầy đủ còn thiếu fixture. |
| `BACKEND_INTEGRATION.md` | Version 4.78, 16/11/2026 | Khi mâu thuẫn: đọc **bảng trạng thái**, không đọc changelog cũ. |

> Nếu bị hỏi "tài liệu ghi khác code?", trả lời: "Đúng, đây là changelog lịch sử; trạng thái hiện tại nằm ở bảng registry và source. Em ưu tiên source + OpenAPI khi trình bày."

---

## 16. Line map chính xác theo flow — commit `3c6c59c`

> Số dòng đúng tại thời điểm 2026-11-16. Sau khi sửa code, dòng có thể lệch; khi đó tìm theo tên hàm/class. Cách mở nhanh: `Ctrl+P` → gõ tên file → `Ctrl+G` → nhập số dòng.

### 16.1 SSE: vì sao `fetch` thay vì axios — dòng đối chứng

| Luận điểm cần chứng minh | File | Dòng | Nội dung tại dòng |
|---|---|---|---|
| Axios đặt timeout 15s cho **toàn bộ** request | `frontend/src/lib/axios.ts` | 17–25 | `axios.create({ baseURL, timeout: 15000, withCredentials: true })` |
| Request interceptor gắn Bearer | `frontend/src/lib/axios.ts` | 29–43 | đọc `getAccessToken()`/store, set `Authorization` |
| Response interceptor chỉ chạy khi request kết thúc | `frontend/src/lib/axios.ts` | 80–202 | `api.interceptors.response.use(success, error)` |
| 401 → refresh rồi **retry nguyên request** | `frontend/src/lib/axios.ts` | 96–168 | nhánh `isAuthError`; `sharedRefresh()` ở 139; `return api(originalRequest)` ở 145 |
| Refresh gãy → `forceLogout()` + redirect | `frontend/src/lib/axios.ts` | 146–163 | `await forceLogout()` (149), `redirectToLoginIfProtected()` (162) |
| Toast session-expired **kể cả khi `silent`** | `frontend/src/lib/axios.ts` | 150–161 | biến `silent` không chặn nhánh này |
| Toast lỗi 5xx/403/429/network | `frontend/src/lib/axios.ts` | 169–198 | các nhánh `toast.error` |
| Reset state interceptor | `frontend/src/lib/axios.ts` | 204–208 | `resetAxiosAuthState` |
| `sharedRefresh` singleton + throttle 2s | `frontend/src/lib/auth-refresh.ts` | 92–139 | `refreshPromise` (99), throttle (94–97) |
| Cross-tab lock bằng Web Locks | `frontend/src/lib/auth-refresh.ts` | 130–137 | `navigator.locks.request('auth-refresh', run)` |
| Logout phải gọi proxy trước | `frontend/src/lib/auth-refresh.ts` | 154–163 | `axios.post('/api/auth/logout')` rồi clear store |
| Access token chỉ trong memory | `frontend/src/lib/auth-token.ts` | 8–19 | `let _accessToken`, `get/set/clear` |
| Endpoint SSE | `frontend/src/features/chat/constants/chat.endpoints.ts` | 1–6 | `SESSION_MESSAGES: (id) => /chat/sessions/${id}/messages` |
| Fetch POST stream, không axios | `frontend/src/features/chat/api/chat-stream.ts` | 44–55 | `fetch(...)` + headers + `credentials: 'include'` + `signal` |
| Lấy token trước khi gửi | `frontend/src/features/chat/api/chat-stream.ts` | 56–57 | `getAccessToken() ?? useAuthStore...` |
| 401 refresh **một lần** | `frontend/src/features/chat/api/chat-stream.ts` | 58–61 | `if (status===401 && !signal.aborted)` → `sharedRefresh()` → gửi lại |
| Non-2xx đọc envelope lỗi | `frontend/src/features/chat/api/chat-stream.ts` | 69–79 | `response.ok`/`response.body`, gắn `responseBody` + `status` |
| Reader + decoder + buffer | `frontend/src/features/chat/api/chat-stream.ts` | 81–86 | `getReader()`, `TextDecoder`, `buffer` |
| Parse 5 loại event | `frontend/src/features/chat/api/chat-stream.ts` | 88–128 | `message_start` 91, `content_delta` 94, `quota` 102, `error` 105, `message_complete` 117 |
| Đọc chunk, tách `\n\n`, cancel | `frontend/src/features/chat/api/chat-stream.ts` | 130–153 | `reader.read()`, `split('\n\n')`, `reader.cancel()` |
| Abort trả trạng thái `aborted` | `frontend/src/features/chat/api/chat-stream.ts` | 154–158 | bắt `AbortError` |
| Giải phóng reader | `frontend/src/features/chat/api/chat-stream.ts` | 159–161 | `reader.releaseLock()` |
| Hook gửi chat | `frontend/src/features/chat/queries/chat.queries.ts` | 147–290 | `useSendChatMessage` |
| Abort khi unmount | `frontend/src/features/chat/queries/chat.queries.ts` | 162–166 | cleanup `controllerRef.current?.abort()` |
| Buffer stream ở state cục bộ | `frontend/src/features/chat/queries/chat.queries.ts` | 184–190 | `streamingContent`, `pendingUserContent` |
| Gọi `streamChatMessage` | `frontend/src/features/chat/queries/chat.queries.ts` | 192–216 | callbacks `onDelta`/`onQuota`/`onErrorEvent` |
| Chỉ commit khi hoàn tất | `frontend/src/features/chat/queries/chat.queries.ts` | 226–231 | `result.completed` → invalidate messages |
| Map `error.code` sang tiếng Việt | `frontend/src/features/chat/queries/chat.queries.ts` | 238–283 | quota/rate-limit/busy/feature-disabled |
| Mount router chat | `backend/src/app.ts` | 408 | `/api/v1/chat` |
| Guest được phép chat | `backend/src/modules/chat/chat.router.ts` | 24 | `router.use(authentication.optionalAuthenticate)` |
| Route POST message | `backend/src/modules/chat/chat.router.ts` | 39–44 | `validateParams` + `validateBody` + `sendMessage` |
| Controller viết SSE | `backend/src/modules/chat/chat.controller.ts` | 82–123 | abort 84–89; `prepareStream` 90–95; headers 97–102; loop 104–108; error event 109–119; end 120–122 |
| Chuẩn bị stream + quota | `backend/src/modules/chat/chat.service.ts` | 209–365 | `chatEnabled` 215–221; guest 223–224; idempotency 226–255; replay 257; urgent/out-of-scope 259–278; reserve 280–316; log 318–347; stream 348–359; release on setup error 360–364 |
| Sinh event SSE | `backend/src/modules/chat/chat.service.ts` | 367–575 | `message_start` 393–395; moderate 402; moderation-unavailable 406–424; flagged 427–445; delta/complete 446–489; release 494; provider-fail fallback 510–532; `error` 547–551; cleanup 559–573 |
| Schema event | `backend/src/modules/chat/chat.schemas.ts` | 147–195 | union 5 event: 150/162/168/172/175 |

**Cách nói khi mở file:** "Thầy/cô xem `axios.ts` dòng 17–25 là timeout toàn cục, dòng 96–168 là nhánh 401 retry cả request, dòng 169–198 là toast toàn cục. Vì stream chat có thể dài hơn 15s và không được tự retry/forceLogout giữa câu, em chuyển sang `fetch` ở `chat-stream.ts` dòng 44–55 và tự xử lý 401 một lần ở dòng 58–61."

### 16.2 AI recipe `onApplyDraft` → `RecipeEditorForm` — line map

| Bước | File | Dòng | Nội dung |
|---:|---|---|---|
| 1 | `frontend/src/app/(site)/recipes/new/page.tsx` | 56–58 | `editorRef`, `pendingDraft`, `overwriteConfirmOpen` |
| 2 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 85–90 | interface `RecipeEditorFormHandle`: `setDraftValues`, `isDirty`, `hasUserContent` |
| 3 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 343–352 | tạo `seed` từ `values` (title/mô tả/servings/thời gian/tên nguyên liệu) |
| 4 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 543–545 | chỉ render assistant ở `step === 'ingredients'` |
| 5 | `frontend/src/app/(site)/recipes/new/page.tsx` | 168–174 | `renderAssistant` → `<AiRecipeDraftAssistant onApplyDraft={handleApplyDraft} />` |
| 6 | `frontend/src/features/recipe/components/ai-recipe-draft-assistant.tsx` | 78–96 | `handleGenerate`: validate + `generateDraftMutation.mutate({...})` |
| 7 | `frontend/src/features/recipe/queries/recipe-draft.queries.ts` | 15–55 | mutation gọi API, toast theo `error.code` |
| 8 | `frontend/src/features/recipe/api/recipe-draft.api.ts` | 14–29 | `POST /recipe-drafts/generate`, timeout 60s, map Model |
| 9 | `backend/src/app.ts` | 411 | mount `/api/v1/recipe-drafts` |
| 10 | `backend/src/modules/content/recipe-draft.router.ts` | 12–17 | POST `/generate` + `authenticate` + `validateBody` |
| 11 | `backend/src/modules/content/recipe-draft.controller.ts` | 10–15 | `service.generate` + parse envelope |
| 12 | `backend/src/modules/content/recipe-draft.service.ts` | 15–123 | guard 17–26; gọi provider 28; chuẩn hoá ingredients 30–43; steps 45–56; validate 58–80; governance 81–89; trả draft 90–105; lỗi 106–122 |
| 13 | `backend/src/modules/content/recipe-draft.provider.ts` | 126–159 | Responses API + strict JSON schema (145–152) + parse (156–158) |
| 14 | `frontend/src/features/recipe/components/ai-recipe-draft-assistant.tsx` | 61–67 | `onSuccess`: `setSuggestion` + mở preview |
| 15 | `frontend/src/features/recipe/components/ai-recipe-draft-assistant.tsx` | 203–208 | render `RecipeDraftPreviewDialog` với `onApply={handleApply}` |
| 16 | `frontend/src/features/recipe/components/recipe-draft-preview-dialog.tsx` | 193–209 | nút "Áp dụng vào công thức" → `onApply` |
| 17 | `frontend/src/features/recipe/components/ai-recipe-draft-assistant.tsx` | 98–103 | `handleApply`: `onApplyDraft(suggestion)` + đóng dialog |
| 18 | `frontend/src/app/(site)/recipes/new/page.tsx` | 75–83 | `handleApplyDraft`: `hasUserContent()` → mở overwrite, ngược lại apply |
| 19 | `frontend/src/app/(site)/recipes/new/page.tsx` | 60–73 | `applyDraftToEditor`: `toFormValues` (61) → `setDraftValues` (62) → toast hướng dẫn chọn danh mục (65–72) |
| 20 | `frontend/src/features/recipe/mappers/recipe-draft.mapper.ts` | 143–162 | `toFormValues`: chỉ set title/description/servings/times/difficulty/ingredients/steps; `ingredientId: null` |
| 21 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 198–223 | `setDraftValues` → `form.reset`; giữ `categoryId` 216, `coverImageUrl` 217, `coverMedia` 218; giữ `ingredientId` theo tên 206–215 |
| 22 | `frontend/src/features/recipe/utils/recipe-form-values.ts` | 23–37 | `applyDraftBasics`: title/mô tả/servings/thời gian người dùng nhập được giữ |
| 23 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 225–232 | `hasUserContent`: có nguyên liệu/bước nấu thì true |
| 24 | `frontend/src/app/(site)/recipes/new/page.tsx` | 85–90 | `handleConfirmOverwrite`: áp `pendingDraft` sau khi xác nhận |
| 25 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 512–531 | ô ảnh bìa: label 513, mô tả "Khuyến khích" 515, `ImageUploader` 517 |
| 26 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 682–730 | chọn danh mục: value 687, `setValue` 689, placeholder 703, lỗi 730 |
| 27 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 768+ | khối dinh dưỡng 6 chỉ số |
| 28 | `frontend/src/features/recipe/schemas/recipe-form.schema.ts` | 47–81 | schema: `categoryId` bắt buộc 53; `coverImageUrl` optional 54; ingredients/steps min 1 ở 78–79 |
| 29 | `frontend/src/features/recipe/schemas/recipe-form.schema.ts` | 89–102 | Contributor/Admin bắt buộc đủ 6 chỉ số dinh dưỡng |
| 30 | `frontend/src/features/recipe/components/recipe-editor-form.tsx` | 358 | submit qua `form.handleSubmit(handleValid, handleInvalid)` |
| 31 | `frontend/src/app/(site)/recipes/new/page.tsx` | 104–121 | `handleSubmit` → `createRecipeMutation.mutateAsync(recipeFormToRecipe(values))` |
| 32 | `frontend/src/features/recipe/utils/recipe-form-values.ts` | 40–65 | `recipeFormToRecipe`: map category 43, cover 44–45, ingredients/steps, `authorNutrition` 63 |
| 33 | `frontend/src/features/recipe/queries/recipe.queries.ts` | 145–153 | `useCreateAndSubmitRecipeMutation`: `createRecipe` rồi `submitSavedRecipe` |
| 34 | `frontend/src/features/recipe/queries/recipe.queries.ts` | 66–98 | `submitSavedRecipe`: `POST /posts/:id/submit` với `revisionId` + `expectedVersion` (73–76) |
| 35 | `frontend/src/features/recipe/api/recipe.api.ts` | 61–66 | `createRecipe`: `POST /posts` + map Model |

**Cách nói khi mở file:** "AI trả draft, `toFormValues` ở mapper dòng 143–162 chỉ map nguyên liệu/bước nấu/thời gian — không có `categoryId`, `coverImageUrl` hay `nutrition`. `setDraftValues` ở form dòng 198–223 gọi `form.reset` nhưng giữ nguyên category/cover hiện có. Tác giả vẫn phải chọn danh mục ở dòng 682–730 (schema bắt buộc dòng 53), tải ảnh bìa ở dòng 512–531 (khuyến khích, dòng 54 optional), rồi submit ở dòng 358 → 104–121."

**Một điểm phải nói chính xác:** ảnh bìa là **khuyến khích**, không bắt buộc bởi schema. Chỉ `categoryId` là bắt buộc.

---

## 17. Tổng quan luồng dữ liệu tạo recipe + trạng thái

### 17.1 Sơ đồ 5 làn

```
BROWSER (React)                NEXT/API                 EXPRESS                        MONGODB
────────────────               ─────────                ───────                        ───────
RHF + zod                      recipe.api.ts            content.router                 posts
  │ validate                   │ POST /posts            │ authenticate + zod           post_revisions
  │ recipeFormToRecipe         │                        │ content.controller           recipe_details
  ▼                            ▼                        ▼                              recipe_ingredients
Partial<Recipe> ───────────► CreateRecipeDto ───────► buildSnapshot()                 recipe_steps
                                                        │ category/media/ingredients  post_media
                                                        ▼                              post_categories
                                                     $transaction                      post_tags
                                                        ├─ Post (DRAFT, v1)           ai_flags
                                                        ├─ Revision (DRAFT, v1)       moderation_actions
                                                        ├─ RecipeDetail               ai_governance_events
                                                        ├─ Ingredients/Steps          recipe_nutrition_*
                                                        └─ Media/Categories/Tags
                                                        │
  ◄──────────── Recipe Model ◄──── response envelope ◄──┘
  │
  │ bấm "Gửi duyệt"
  ▼
POST /posts/:id/submit  { revisionId, expectedVersion }
  │
  ├─ Member / có flag ──► Revision PENDING_REVIEW, Post PENDING_REVIEW (hoặc giữ PUBLISHED)
  │                          │
  │                          ├─ Reviewer approve ─► Revision PUBLISHED, Post PUBLISHED, publishedRevisionId
  │                          └─ Reviewer reject  ─► Revision REJECTED; Post REJECTED nếu chưa từng publish
  │
  └─ Contributor/Admin recipe đủ 6 chỉ số + không flag
        └─► Revision PUBLISHED, Post PUBLISHED ngay, audit auto-publish
              └─ nutrition estimate canonical-only (không gọi AI)
```

### 17.2 Bảng bước — dữ liệu vào/ra và trạng thái

| # | Nơi xử lý | File · dòng | Dữ liệu vào | Dữ liệu ra / ghi DB | Trạng thái sau bước |
|---:|---|---|---|---|---|
| 1 | Form validate | `recipe-editor-form.tsx` 358; `recipe-form.schema.ts` 47–81 | người dùng nhập | `RecipeFormValues` hợp lệ | UI hợp lệ |
| 2 | Map form → domain | `recipe-form-values.ts` 40–65 | form values | `Partial<Recipe>` (categoryId, cover, ingredients, steps, authorNutrition) | — |
| 3 | Gọi API tạo | `recipe.api.ts` 61–66 | `Partial<Recipe>` | `POST /api/v1/posts` | — |
| 4 | Router | `content.router.ts` 39–44; `app.ts` 410 | JSON body | Zod-validated body | — |
| 5 | Controller | `content.controller.ts` 111–116 | body đã validate | gọi service | — |
| 6 | Snapshot | `content.service.ts` 495–514, 580+ | input | category active, media đã commit, recipe snapshot, ingredient resolution | — |
| 7 | Ghi DB (transaction) | `content.repository.ts` 531–599 | snapshot | `Post` v1 + `Revision` v1 + detail/ingredients/steps/media/tags | **Post DRAFT / Revision DRAFT** |
| 8 | Response → Model | `recipe.api.ts` 61–66; mapper | envelope | `Recipe` Model | UI hiển thị bản nháp + revisionId/version |
| 9 | Submit | `page.tsx` 104–121; `recipe.queries.ts` 66–98, 145–153 | `revisionId`, `expectedVersion` | `POST /posts/:id/submit` | — |
| 10 | Kiểm tra submit | `content.service.ts` 362–447 | post + revision hiện tại | chặn nếu version/state sai; recipe Contributor/Admin cần đủ 6 chỉ số | — |
| 11 | Quyết định publish | `content-publication.policy.ts` 38–59 | title/body/tags + `autoPublish` | `SubmissionDecision` | — |
| 12 | Ghi DB (transaction) | `content.repository.ts` 685–790 | decision | update revision/post, `AiFlag` nếu flag, audit, governance | **PENDING_REVIEW** hoặc **PUBLISHED** |
| 13 | Nutrition (async) | `recipe-nutrition-review.service.ts` 80–92, 246–270 | revisionId | estimate + job | **estimate CURRENT**, job **QUEUED** |
| 14 | Worker | 289–358 | job | estimate mới / lỗi | **RUNNING → SUCCEEDED / RETRY_SCHEDULED / FAILED / CANCELLED** |
| 15 | Reviewer duyệt | `moderation.repository.ts` 190–295 | decision + reason | revision/post, nutrition final, audit | **Revision PUBLISHED / REJECTED** |

### 17.3 Bảng trạng thái

**Post (`PostStatus`)** — container của nhiều revision:

| Trạng thái | Nghĩa | Ai/đâu set |
|---|---|---|
| `DRAFT` | Chưa từng submit | `createPost` (policy `draft()`) |
| `PENDING_REVIEW` | Có revision chờ duyệt, chưa từng public | `submitRevision` khi chưa có `publishedRevisionId` |
| `PUBLISHED` | Có ít nhất một revision public | approve; auto-publish; submit bản sửa khi bản cũ vẫn public |
| `REJECTED` | Bị từ chối và chưa từng có bản public | reject khi `publishedRevisionId` null |
| `HIDDEN` | Admin ẩn | hành động admin |
| `DELETED` | Xoá mềm | owner/admin |
| `FLAGGED` / `QUARANTINED` | Có trong enum và được coi là “cần review” | **luồng submit hiện tại không set**; flag nằm ở `AiFlag` |

**Revision (`PostRevisionStatus`)** — phiên bản nội dung:

| Trạng thái | Nghĩa |
|---|---|
| `DRAFT` | Bản nháp; sửa được; submit được |
| `PENDING_REVIEW` | Đã submit; khoá sửa; chờ quyết định |
| `PUBLISHED` | Là bản public hiện tại (hoặc bản cũ vẫn public khi có bản mới) |
| `REJECTED` | Bị từ chối; không public |
| `FLAGGED` / `QUARANTINED` | Được chấp nhận trong review nhưng luồng hiện tại không tự set |

**Nutrition**

| Đối tượng | Trạng thái | Ý nghĩa |
|---|---|---|
| `RecipeNutritionEstimate.status` | `CURRENT` / `HISTORICAL` / `STALE` | Estimate hiện hành / bản cũ / lỗi thời |
| `RecipeNutritionEstimateLine.origin` | `CANONICAL_CALCULATED` / `AI_ESTIMATED` / `USER_PROVIDED` / `VERIFIED_OVERRIDE` | Nguồn từng dòng |
| `RecipeNutritionAiJob.state` | `QUEUED` → `RUNNING` → `RETRY_SCHEDULED` / `SUCCEEDED` / `FAILED` / `CANCELLED` | Job nền |
| `RecipeNutritionAiJob.status` | `IN_PROGRESS` / `SUCCESS` / `FALLBACK` / `BLOCKED` / `FAILED` / `ABORTED` | Kết quả gọi AI |
| `AiFlag.status` | `OPEN` / `REVIEWED` | Tín hiệu kiểm duyệt |

### 17.4 State machine (text)

```
TẠO
Post DRAFT + Rev v1 DRAFT
        │ submit
        ├── Member / có flag
        │      Rev v1 PENDING_REVIEW
        │      Post PENDING_REVIEW (chưa từng public)
        │         ├── approve ──► Rev v1 PUBLISHED; Post PUBLISHED; publishedRevisionId=v1
        │         └── reject  ──► Rev v1 REJECTED;  Post REJECTED
        │
        └── Contributor/Admin recipe đủ 6 chỉ số, không flag
               Rev v1 PUBLISHED; Post PUBLISHED; audit auto-publish
               (nutrition canonical-only, không AI)

SỬA BÀI ĐÃ PUBLISH
Post.version + 1; Rev v2 DRAFT; Post vẫn PUBLISHED
        │ submit
        ├── approve ──► Rev v2 PUBLISHED; publishedRevisionId=v2; v1 vẫn là lịch sử
        └── reject  ──► Rev v2 REJECTED; Post vẫn PUBLISHED với v1

XOÁ / ẨN
Post DELETED (soft delete)  |  Post HIDDEN (admin)
```

### 17.5 Dữ liệu biến đổi qua từng tầng

| Tầng | Hình dạng | Ghi chú |
|---|---|---|
| Form | `RecipeFormValues` | camelCase, số thật, `categoryId`, `coverMedia`, `nutrition` |
| Domain FE | `Partial<Recipe>` | `category` (id), `ingredients[]`, `steps[]`, `authorNutrition` |
| Request DTO | `CreateRecipeRequestDto` | `recipeMapper.toCreateDto` |
| Backend input | Zod input | chuẩn hoá tên, số, enum |
| Snapshot | `RevisionSnapshot` | category active, media đã commit, ingredient resolution, recipe snapshot |
| DB | `Post`, `PostRevision`, `RecipeDetail`, `RecipeIngredient`, `RecipeStep`, `PostMedia`, `PostCategory`, `PostTag` | transaction |
| Response | envelope `{success,data,meta}` | `status`, `version`, `revision`, `recipe.mealPlannerEligible` |
| Model FE | `Recipe` | mapper đổi tên/format; UI chỉ đọc Model |

### 17.6 Cạm bẫy phải nói đúng

1. **Post và Revision là hai state machine.** Post `PUBLISHED` không có nghĩa revision mới nhất đã publish; bản sửa có thể đang `PENDING_REVIEW`.
2. **Sửa bài đã publish không rút bản cũ.** `publishedRevisionId` vẫn trỏ bản cũ tới khi bản mới được duyệt.
3. **Flag không tự đổi status.** Luồng hiện tại tạo `AiFlag OPEN` và giữ `PENDING_REVIEW`; `FLAGGED/QUARANTINED` chỉ được chấp nhận nếu có trong dữ liệu.
4. **Job dinh dưỡng không chặn submit** nhưng **chặn approve** nếu thiếu 5 chỉ số (`RECIPE_NUTRITION_INCOMPLETE`).
5. **Auto-publish kiểm tra role từ DB**, không tin claim trong request (`content.repository.ts` 711–722).
6. **Media phải là asset đã commit, đúng owner/kind** trước khi gắn vào revision (`media.service.ts` 23–52).
7. **`mealPlannerEligible`** chỉ true khi post/revision đã publish, không còn ingredient unresolved và đủ 4 macro bắt buộc (`content.repository.ts` 810–820; `recipe-nutrition-review.repository.ts` 186–206).
8. **Concurrency:** mọi mutation dùng `version`/`expectedVersion`; submit sai version → `CONTENT_VERSION_CONFLICT`.

### 17.7 Câu trả lời 60 giây

> "Tạo recipe đi qua 4 tầng: form zod → mapper → `POST /posts` → service. Service validate category, media đã commit, nguyên liệu/canonical, rồi ghi một transaction gồm Post v1 DRAFT, Revision v1 DRAFT, RecipeDetail, ingredients, steps, media. Bấm gửi duyệt gọi `POST /posts/:id/submit` với revisionId + version; backend khoá document, kiểm tra role từ DB. Member hoặc nội dung có flag → Revision PENDING_REVIEW, Post PENDING_REVIEW; Contributor/Admin recipe đủ 6 chỉ số và không flag → publish ngay kèm audit. Duyệt thì Revision PUBLISHED + Post PUBLISHED + publishedRevisionId; từ chối thì Revision REJECTED, Post chỉ REJECTED nếu chưa từng publish. Sửa bài đã publish tạo Revision v+1 DRAFT nhưng bản cũ vẫn public. Dinh dưỡng tính async, job không chặn submit nhưng chặn duyệt nếu thiếu 5 chỉ số."

### 17.8 Đối chiếu cách mô tả thường gặp (dễ sai khi bảo vệ)

| Cách nói thường gặp | Thực tế trong code | Nên nói |
|---|---|---|
| "Khẩu phần/thời gian là optional" | `recipe-form.schema.ts` 65–76 bắt buộc số; bước 1 được bỏ qua validate (`recipe-editor-form.tsx` 293–297) nhưng submit vẫn chặn nếu trống | "Có thể để trống tạm ở bước 1, nhưng phải có trước khi gửi; AI có thể điền hộ." |
| "AI điền toàn bộ dữ liệu còn lại" | `recipe-draft.mapper.ts` 143–162 chỉ map title/description/servings/times/difficulty/ingredients/steps; không category/cover/nutrition; `ingredientId: null` | "AI điền định lượng, bước nấu, độ khó, thời gian gợi ý; không chọn danh mục/ảnh bìa/dinh dưỡng." |
| "Submit xong luôn pending_review" | Member/flag → `PENDING_REVIEW`; Contributor/Admin recipe đủ 6 chỉ số, không flag → `PUBLISHED` ngay (`content.repository.ts` 711–722) | "Member vào pending; Contributor/Admin đủ điều kiện được auto-publish." |
| "5 chỉ số do AI điền" | Canonical calculation chạy trước; AI chỉ fallback khi thiếu metric/thiếu cooking method (`recipe-nutrition-review.service.ts` 246–270); kết quả là `AI_ESTIMATED` | "Hệ thống tính trước; AI chỉ bổ sung phần thiếu và không ghi đè dữ liệu chuẩn." |
| "Reject là bài thành rejected" | Revision `REJECTED`; Post chỉ `REJECTED` nếu chưa từng publish (`moderation.repository.ts` 252–257) | "Reject bản mới; nếu đã có bản public cũ, bài vẫn public với bản cũ." |
| "Form có 3 bước" | 5 bước: basics → ingredients → steps → classify → review (`recipe-editor-steps.ts` 7–37) | "5 bước, category nằm ở bước Phân loại." |
| "Submit là một request" | UI gọi `POST /posts` rồi `POST /posts/:id/submit` (`recipe.queries.ts` 66–98, 145–153) | "Tạo nháp rồi submit ngay; nếu submit lỗi, nháp DRAFT còn lại." |
| "Duyệt xong là xong" | Recipe cần đủ 5 chỉ số; approval ghi final values vào `RecipeDetail`, tính `mealPlannerEligible`, cancel job (`recipe-nutrition-review.repository.ts` 186–206) | "Duyệt recipe là bước chốt dinh dưỡng và điều kiện vào meal planner." |


