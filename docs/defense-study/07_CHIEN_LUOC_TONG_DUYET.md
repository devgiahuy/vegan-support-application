# 7. Chiến lược tổng duyệt trước hội đồng 2 giảng viên

**Cập nhật:** 2026-11-16 · **Đối chiếu:** `dev` @ `3c6c59c`, SRS 1.8, IMPLEMENTATION_PLAN 4.23, BACKEND_INTEGRATION 4.78.
Tài liệu này bổ sung cho [Chiến lược 5 buổi](04_CHIEN_LUOC_BAO_VE.md): phần dưới tập trung vào **cách trình bày trước 2 người hỏi khác nhau** và **cách dẫn chứng bằng code**.

---

## 1. Hội đồng thực chất kiểm tra 3 điều

1. **Em có hiểu bài toán không?** Ai dùng, vì sao cần, phạm vi tới đâu, cái gì cố tình không làm.
2. **Quyết định thiết kế có lý do không?** Vì sao backend giữ luật, vì sao AI chỉ đề xuất, vì sao có confirm, vì sao idempotent.
3. **Em có bằng chứng không?** File nào, endpoint nào, trạng thái nào, lỗi nào, giới hạn nào.

> Không cần chứng minh "mọi thứ hoàn hảo". Cần chứng minh **em biết chỗ nào chưa hoàn hảo và vì sao**.

## 2. Định vị project trong 20 giây

**Bản nghiệp vụ:**
> "Đây là nền tảng hỗ trợ người ăn chay ở Việt Nam, gồm web, mobile và backend. Điểm cốt lõi không phải là 'có nhiều màn hình', mà là **an toàn ăn uống được backend thực thi**: hồ sơ dị ứng/chế độ ăn lọc cứng trước khi gợi ý; công thức và video phải qua kiểm duyệt; AI chỉ đề xuất và người dùng phải xác nhận trước khi dữ liệu tủ bếp thay đổi."

**Bản kỹ thuật:**
> "Backend là Express + TypeScript + MongoDB, OpenAPI-first, mọi route đi qua Zod validation, service và repository. Frontend Next.js đi theo 7 tầng: endpoint → DTO → Model → Mapper → API → Query → Component, nên UI không bao giờ đọc payload thô. Ba luồng khó nhất là SSE chat có quota, pipeline quét ảnh bất đồng bộ có bước confirm, và tính dinh dưỡng công thức có provenance."

## 3. Bộ slide tối thiểu (7 slide)

| # | Slide | Nội dung | Câu chốt |
|---|---|---|---|
| 1 | Bài toán | 3 pain point: ăn chay đủ chất, tìm quán, nội dung thiếu kiểm chứng | "Vấn đề là niềm tin và an toàn, không chỉ là công thức." |
| 2 | Tác nhân & phạm vi | Guest/Member/Contributor/Admin; MVP 00–27 | "Mỗi vai trò có ranh giới quyền rõ ràng." |
| 3 | Kiến trúc | 3 app, backend authoritative, provider adapter | "Backend quyết định, client chỉ thu nhận ý định." |
| 4 | Luồng xương sống | diet → search → plan → pantry → shopping | "Ràng buộc cứng chạy trước mọi xếp hạng." |
| 5 | Luồng tin cậy | draft → submit → review → publish; audit | "AI là tín hiệu, người duyệt là quyết định." |
| 6 | AI có kiểm soát | chat quota, recipe draft, scan confirm, governance | "AI không tự ghi dữ liệu chuẩn." |
| 7 | Giới hạn & bài học | scan IN_PROGRESS, provider thật, mobile parity | "Em biết chính xác cái gì chưa xong và vì sao." |

## 4. Hai giảng viên hỏi hai kiểu — chuẩn bị hai bộ đạn

| | Giảng viên nghiệp vụ | Giảng viên kỹ thuật |
|---|---|---|
| Câu mở đầu thường gặp | "Vì sao cần chức năng này?" "Ai được làm?" | "Code nằm đâu?" "Hai request đồng thời thì sao?" |
| Điều họ muốn nghe | actor → rule → state → rủi ro | entry → validate → transaction → error |
| Bằng chứng nên mở | SRS, implementation plan, state machine | service/repository, OpenAPI, error code |
| Bẫy hay dùng | "Nếu AI sai thì sao?" "Nếu người dùng cố tình?" | "Nếu provider timeout?" "Nếu client retry?" |
| Câu trả lời chuẩn | "Backend chặn vì…" | "Transaction/idempotency nằm ở…" |

**Chiến thuật:** trả lời câu nghiệp vụ bằng **quyết định**, rồi chủ động nối sang kỹ thuật bằng một câu: "Cơ chế thực thi nằm ở `X`, em có thể mở nếu thầy/cô muốn." Ngược lại, câu kỹ thuật luôn kết bằng **lý do nghiệp vụ**: "…vì vậy người dùng không thể vô tình ghi đè dữ liệu."

## 5. Công thức trả lời C-A-R-E (45–60 giây)

1. **C — Context (1 câu):** "Ở luồng X, actor là Y…"
2. **A — Answer (1 câu):** "…backend chặn/cho phép vì Z."
3. **R — Reason (1–2 câu):** cơ chế: validate, transaction, idempotency, state machine.
4. **E — Evidence (1 câu):** "Nằm ở `file`, trạng thái `READY/IN_PROGRESS`."

Ví dụ:
> "Ở luồng duyệt công thức, Contributor không được tự duyệt bài mình. Điều kiện `canDecide` trong moderation yêu cầu người duyệt không phải tác giả, bài không có AI flag đang mở, dưới 5 người report và revision đang `PENDING_REVIEW`; nếu là Admin thì được quyền cao hơn. Cơ chế này nằm ở `backend/src/modules/moderation/moderation.service.ts`."

## 6. Ba phương án demo — chọn theo thế mạnh, không cố show hết

### Phương án A — "An toàn dữ liệu" (ổn định nhất, khuyên dùng)
`login Member → diet/allergy → search thấy món bị loại → meal plan 21 slot → pantry → shopping gap`
- Chứng minh: hard constraints, backend target, confirm boundary.
- Rủi ro: thấp, chỉ phụ thuộc dữ liệu seed.

### Phương án B — "AI có kiểm soát" (nếu provider đã kiểm tra trước)
`AI recipe draft → preview → áp vào form (không tự publish) → chat SSE + quota → scan tủ lạnh/hóa đơn → confirm`
- Chứng minh: AI không ghi dữ liệu chuẩn; SSE; pipeline job.
- Rủi ro: provider/Cloudinary. **Bắt buộc** có job chuẩn bị trước + nói rõ scan `IN_PROGRESS`.

### Phương án C — "Tin cậy & vận hành" (nếu hội đồng thiên nghiệp vụ)
`Member submit draft → Contributor khác duyệt → publish → Admin xem audit → billing order history/payOS disabled`
- Chứng minh: RBAC, revision, audit, webhook không grant qua return URL.
- Rủi ro: cần 2 tài khoản; không bấm thanh toán thật.

> Nếu hội đồng chỉ cho 8 phút: **A + một đoạn của C**. Nếu 12–15 phút: A + B, và nói rõ giới hạn provider.

## 7. Kịch bản 12 phút tối ưu (A + B)

| Phút | Thao tác | Câu nói | File mở khi bị hỏi |
|---|---|---|---|
| 0–1 | Slide 1–3 | "Backend giữ luật và transaction; client chỉ gửi ý định." | `backend/src/app.ts` |
| 1–3 | Login Member, mở diet, chỉ allergy | "Lưu xong, mọi tìm kiếm/plan dùng constraint này." | `content/search-constraints.ts` |
| 3–5 | Search: 1 món hợp lệ, 1 món bị loại | "Lọc cứng trước ranking; ranking không thể đưa lại." | `recommendation.service.ts` |
| 5–7 | Generate plan, chỉ 21 slot + 1 UNFILLED | "Thiếu ứng viên hợp lệ thì để trống có lý do, không hạ chuẩn." | `meal-plan.service.ts` |
| 7–9 | AI recipe draft → preview → áp form | "AI chỉ tạo draft; lưu vẫn qua submit/review." | `recipe-draft.service.ts`, `ai-recipe-draft-assistant.tsx` |
| 9–11 | Chat hỏi 1 câu, chỉ stream + quota | "Quota giữ chỗ trước khi gọi provider; lỗi thì hoàn." | `chat.service.ts`, `chat-stream.ts` |
| 11–12 | Tóm tắt giới hạn | "Scan còn IN_PROGRESS vì chưa validate ảnh Việt Nam thật; payOS không có sandbox." | `IMPLEMENTATION_PHASES.md` |

## 8. Fallback matrix khi demo lỗi

| Tình huống | Không làm | Làm |
|---|---|---|
| AI chat fallback/tĩnh | Không giả vờ là AI thật | Nói "provider đang fallback an toàn", mở `FallbackNotice`, chỉ event SSE |
| Scan job chậm/lỗi | Không bấm confirm dữ liệu chuẩn bị trước vào cùng Pantry | Mở job đã chuẩn bị, nói rõ "job tạo trước", chỉ trạng thái + candidate |
| Cloudinary lỗi | Không tự sửa DB | Mở Network/response, phân loại `BLOCKED`, chuyển sang pantry thủ công |
| UI lệch backend | Không cãi UI | Mở response backend/`error.code`, nói "đây là gap frontend" |
| Không nhớ enum | Không đoán | "Em kiểm tra contract hiện tại" → mở OpenAPI |
| Hội đồng hỏi ngoài phạm vi | Không bịa | "Phần này nằm trong Roadmap Phase 2, em chưa triển khai" |

## 9. Sáu sơ đồ nên vẽ được bằng tay trong 60 giây

1. **Kiến trúc 3 app:** Web/Mobile → REST `/api/v1` → Express (router → controller → service → repository) → Mongo; provider adapters (OpenAI, Cloudinary, SerpApi, payOS).
2. **Vòng đời nội dung:** `DRAFT → PENDING_REVIEW → PUBLISHED/REJECTED`; sửa bài publish tạo revision mới.
3. **Diet precedence:** Allergy/Exclusion > DietPattern > Tradition > Health limits > Ranking.
4. **Scan pipeline:** upload asset → job QUEUED → PROCESSING → READY/PARTIAL → user edit → CONFIRM (transaction) → Pantry.
5. **Chat SSE:** reserve quota → moderate → provider stream → delta → complete → commit quota; lỗi → release.
6. **Billing:** order PENDING → payOS checkout → webhook signed → verify query → settle transaction → grant once.

## 10. Lịch 7 ngày (mỗi ngày 2–3 giờ)

| Ngày | Việc | Đầu ra |
|---|---|---|
| D-6 | Đọc 07 + 08; vẽ tay 6 sơ đồ | 6 ảnh sơ đồ, không cần đẹp |
| D-5 | Học nhóm câu A–D (nghiệp vụ, auth, diet, content) | Tự trả lời 30 câu, đánh dấu câu yếu |
| D-4 | Học nhóm E–H (plan, scan, chat, billing) | Trả lời 30 câu + mở đúng file |
| D-3 | Học nhóm I–L (restaurant, frontend, backend, bẫy) | Trả lời 25 câu |
| D-2 | Chạy demo A 2 lần, demo B 1 lần; ghi lỗi gặp phải | Fallback matrix đã điền |
| D-1 | Phản biện 45 phút với bạn cùng nhóm, mỗi người một vai | Sửa 5 câu trả lời yếu nhất |
| D-0 | Chạy checklist mục 11, không học thêm kiến thức mới | Tự tin, tỉnh táo |

## 11. Checklist 24 giờ trước bảo vệ

- [ ] `git status` sạch; biết chính xác commit đang demo (`3c6c59c`).
- [ ] Backend chạy; `/api/v1/health` 200; `/api-docs.json` mở được.
- [ ] Mongo replica set sống; seed đã chạy; 3 tài khoản: Member, Contributor, Admin.
- [ ] Member có allergy + diet + lịch; có 1 recipe hợp lệ và 1 recipe bị loại.
- [ ] Có 1 meal plan đã tạo (không phụ thuộc generate live nếu máy chậm).
- [ ] Pantry có 2 item confirmed + ledger; shopping preview mở được.
- [ ] Nếu demo AI: provider đã test bằng đúng ảnh/câu hỏi sẽ dùng; có job dự phòng.
- [ ] Nếu demo billing: chỉ mở order history; **không** bấm thanh toán thật.
- [ ] Mở sẵn 6 tab: SRS, OpenAPI, `app.ts`, `chat.service.ts`, `meal-plan.service.ts`, `BACKEND_INTEGRATION.md`.
- [ ] Điện thoại chụp ảnh màn hình các bước quan trọng (backup).
- [ ] Không để token/secret/ảnh hóa đơn thật trên slide.

## 12. Mở bài & kết bài nên thuộc

**Mở:**
> "Em xin trình bày trong 3 phần: bài toán và phạm vi; ba luồng xương sống; và giới hạn trung thực của sản phẩm. Trong mỗi phần em sẽ chỉ ra quyết định thiết kế và file chứng minh."

**Kết:**
> "Tóm lại: backend giữ ràng buộc an toàn, AI chỉ đề xuất, người dùng xác nhận trước khi dữ liệu thay đổi, và mọi quyết định quan trọng đều có audit. Phần chưa hoàn tất là đánh giá ảnh thật cho scan và parity mobile — em ghi rõ trong release checklist thay vì tuyên bố READY."

## 13. Câu nên tránh

- "Cái này AI làm hết." → Sai bản chất, hội đồng sẽ hỏi ngay AI sai thì sao.
- "Bên em có test rồi" khi chưa chạy. → Chỉ nói con số đã chạy gần nhất.
- "Chắc là…/em nghĩ là…" cho enum, status, quota. → Mở contract.
- "Phần này của bạn khác em." → Nói "theo registry hiện tại…" và mở file.
- "Bảo mật tuyệt đối." → Nói "đã giảm thiểu rủi ro bằng…", không tuyên bố tuyệt đối.

## 14. Cách xử lý khi không biết

1. Cảm ơn + xác nhận câu hỏi: "Ý thầy là trường hợp hai request confirm cùng lúc đúng không ạ?"
2. Nói phần mình biết: "Em biết confirm chạy trong transaction và kiểm tra version."
3. Nói phần chưa chắc: "Phần khoá document cụ thể em không nhớ tên hàm, em mở file để trả lời chính xác."
4. Mở source. Nếu vẫn không có: "Hiện chưa có, đây là khoảng trống em ghi trong release checklist."

> Thà mở file 10 giây còn hơn đoán sai một enum.

## 15. Tự chấm sau mỗi lần luyện (thang 5)

| Tiêu chí | 1 | 3 | 5 |
|---|---|---|---|
| Trả lời đúng trọng tâm | Lan man | Đúng nhưng dài | 1 câu chốt trước |
| Có lý do thiết kế | Chỉ mô tả | Có lý do | Lý do + đánh đổi |
| Bằng chứng | Không biết file | Biết module | Mở đúng file/dòng |
| Trung thực giới hạn | Giấu | Nói chung | Nói rõ + tác động |
| Thời lượng | >90s | 60–90s | 30–60s |
