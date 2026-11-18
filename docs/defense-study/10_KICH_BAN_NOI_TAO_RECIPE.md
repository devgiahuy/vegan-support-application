# 10. Kịch bản nói 2 phút — luồng tạo công thức

**Cập nhật:** 2026-11-17 · **Đối chiếu:** `dev` @ `3c6c59c`.
Dùng cho phần trình bày luồng tạo recipe trước hội đồng. Mỗi đoạn có:
- **Lời nói** (đọc gần như nguyên văn, câu ngắn).
- **Chỗ dừng** (chỉ mở file khi bị hỏi, không mở trước).
- **Câu chuyển** nếu hội đồng cắt ngang.

---

## 1. Mục tiêu và thời lượng

| Phần | Thời lượng | Điều phải cắm cờ |
|---|---:|---|
| Mở | 0:00–0:15 | 5 bước, 2 state machine |
| Bước 1 | 0:15–0:35 | field nào bắt buộc, field nào không |
| Bước 2 + AI | 0:35–1:05 | AI được làm gì, không được làm gì |
| Bước 3–5 | 1:05–1:20 | category bắt buộc, 6 chỉ số |
| Submit + trạng thái | 1:20–1:45 | 2 request, pending vs published |
| Dinh dưỡng async | 1:45–2:05 | canonical trước, AI fallback |
| Duyệt + kết | 2:05–2:20 | reject giữ bản cũ |

> Nếu bị giới hạn 1 phút, dùng bản rút gọn ở mục 6.

---

## 2. Lời nói từng câu

### 2.1 Mở (15 giây)

> "Em xin trình bày luồng tạo công thức. Đây là luồng dài nhất của phần nội dung, gồm **năm bước trên một form**, và điểm quan trọng nhất là sau khi gửi, hệ thống tách **trạng thái của bài** khỏi **trạng thái của từng phiên bản**."

**Chỗ dừng:** nếu hội đồng hỏi "năm bước nào?" → mở `frontend/src/features/recipe/components/recipe-editor-steps.ts` dòng 7–37.
> "Năm bước là: thông tin cơ bản, nguyên liệu, các bước nấu, phân loại, xem lại."

---

### 2.2 Bước 1 — thông tin cơ bản (20 giây)

> "Bước một nhập tên món, mô tả, khẩu phần, thời gian sơ chế, thời gian nấu và ảnh bìa. Trong đó **tên món bắt buộc**; **mô tả và ảnh bìa là tuỳ chọn**. Khẩu phần và thời gian có thể để trống tạm ở bước này, nhưng **lúc gửi thì bắt buộc** — nếu người dùng không nhập thì AI hoặc chính họ phải điền trước khi submit."

**Chỗ dừng:** nếu bị hỏi "optional hay không?" → mở `frontend/src/features/recipe/schemas/recipe-form.schema.ts` dòng 47–81.
> "Thầy/cô xem dòng 53: `categoryId` bắt buộc; dòng 54: `coverImageUrl` optional; dòng 65–76: khẩu phần và thời gian là số bắt buộc. Ở UI bước 1 em cho bấm tiếp để nhập nguyên liệu trước, nhưng schema cuối vẫn chặn nếu thiếu."

**Câu chuyển nếu bị cắt:** "Đúng ạ, nó chỉ 'trống tạm', không phải optional ở thời điểm gửi."

---

### 2.3 Bước 2 — nguyên liệu và AI (30 giây)

> "Bước hai là nguyên liệu. Đây là **chỗ duy nhất có AI**. Người dùng nhập tên nguyên liệu, có thể bấm tạo gợi ý; frontend gọi `POST /recipe-drafts/generate`. AI trả một draft gồm định lượng, đơn vị, bước nấu, độ khó và thời gian gợi ý. Nó **giữ đúng số lượng và thứ tự nguyên liệu**, không bịa thêm nguyên liệu mới. Draft hiện trong popup; nếu form đã có nguyên liệu hoặc bước nấu thì hỏi xác nhận ghi đè. Khi áp dụng, hệ thống **chỉ điền các field AI trả**, giữ nguyên tên, mô tả, khẩu phần, thời gian người dùng đã nhập và giữ danh mục, ảnh bìa hiện có. AI **không chọn danh mục, không tạo ảnh bìa, không khai dinh dưỡng**."

**Chỗ dừng 1:** nếu bị hỏi "AI điền những gì?" → mở `frontend/src/features/recipe/mappers/recipe-draft.mapper.ts` dòng 143–162.
> "Hàm `toFormValues` chỉ trả title, description, servings, thời gian, difficulty, ingredients và steps. Không có `categoryId`, `coverImageUrl` hay `nutrition`."

**Chỗ dừng 2:** nếu bị hỏi "áp vào form thế nào?" → mở `frontend/src/features/recipe/components/recipe-editor-form.tsx` dòng 198–223.
> "`setDraftValues` gọi `form.reset`, nhưng dòng 216–218 giữ nguyên category và cover hiện có; dòng 206–215 giữ liên kết nguyên liệu theo tên."

**Câu chuyển:** "AI ở đây là trợ lý soạn nháp, không phải người quyết định nội dung."

---

### 2.4 Bước 3–5 (15 giây)

> "Bước ba là các bước nấu. Bước bốn là phân loại: **chọn danh mục là bắt buộc**, chọn độ khó, và với Contributor/Admin là sáu chỉ số dinh dưỡng. Bước năm là xem lại toàn bộ rồi gửi."

**Chỗ dừng:** nếu bị hỏi "vì sao category bắt buộc?" → mở `recipe-form.schema.ts` dòng 53.
> "Vì danh mục là dữ liệu bắt buộc của contract, thiếu là không tạo được bài."

---

### 2.5 Submit và trạng thái (25 giây)

> "Khi bấm gửi, frontend **không gọi một API duy nhất**. Nó tạo nháp bằng `POST /posts`, rồi gọi `POST /posts/:id/submit` với `revisionId` và `version`. Vì vậy nếu chỉ nhìn sau khi tạo, trạng thái là `DRAFT`; sau khi submit thành công, với **Member**, cả revision và bài đều sang `PENDING_REVIEW`. Đây là lý do trên demo thấy pending review — **không phải lỗi**. Còn nếu tài khoản là **Contributor hoặc Admin**, công thức đã khai đủ sáu chỉ số và không có moderation flag, backend publish ngay, trạng thái là `PUBLISHED`."

**Chỗ dừng 1:** nếu bị hỏi "sao biết là hai request?" → mở `frontend/src/features/recipe/queries/recipe.queries.ts` dòng 145–153 và 66–98.
> "Hook `useCreateAndSubmitRecipeMutation` gọi `createRecipe` rồi `submitSavedRecipe`; hàm sau gọi `POST /posts/:id/submit`."

**Chỗ dừng 2:** nếu bị hỏi "backend đổi trạng thái ở đâu?" → mở `backend/src/modules/content/content.repository.ts` dòng 711–722 và 726–766.
> "Backend đọc lại role từ database, không tin claim trong request; dòng 729 đặt revision thành PUBLISHED hoặc PENDING_REVIEW, dòng 761–766 đặt trạng thái bài."

**Câu chuyển:** "Nếu submit lỗi sau khi đã tạo, bản nháp `DRAFT` vẫn còn và UI đưa người dùng sang trang sửa."

---

### 2.6 Dinh dưỡng chạy nền (20 giây)

> "Sau submit, backend tính dinh dưỡng **canonical trước**. Chỉ khi thiếu dữ liệu — thiếu một chỉ số hoặc bước nấu chưa map được cooking method — mới tạo job AI nền. Job chạy một lần, retry tối đa ba lần sau 1, 5 và 15 phút; kết quả gắn nhãn `AI_ESTIMATED`, **không ghi đè dữ liệu chuẩn**. Job **không chặn submit**, nhưng **chặn duyệt** nếu thiếu năm chỉ số. B12 là trường thứ sáu, không bắt buộc và không do AI ước lượng."

**Chỗ dừng:** nếu bị hỏi "AI ghi vào đâu?" → mở `backend/src/modules/recipe-nutrition/recipe-nutrition-review.service.ts` dòng 246–270.
> "Canonical được build và persist trước; chỉ khi `needsAi` mới tạo job. Kết quả nằm trong estimate của revision, không ghi vào bảng dữ liệu chuẩn."

---

### 2.7 Duyệt và kết (15 giây)

> "Reviewer approve thì revision sang `PUBLISHED`, bài sang `PUBLISHED` và cập nhật `publishedRevisionId`. Reject thì revision `REJECTED`, còn bài chỉ `REJECTED` nếu **chưa từng publish** — nếu đang sửa bài đã publish thì bài vẫn public với bản cũ. Sửa bài đã publish tạo revision mới `DRAFT`, không rút bản cũ. Tóm lại: AI chỉ hỗ trợ phần nguyên liệu; danh mục, ảnh bìa và dinh dưỡng vẫn là của tác giả và reviewer; trạng thái tách giữa bài và phiên bản."

**Chỗ dừng:** nếu bị hỏi "reject xong bài thế nào?" → mở `backend/src/modules/moderation/moderation.repository.ts` dòng 241–257.
> "Approve cập nhật `publishedRevisionId`; reject chỉ đặt bài thành REJECTED khi chưa có bản publish trước đó."

---

## 3. Ba nơi nên chủ động mở (không chờ hỏi)

1. **Schema form** (`recipe-form.schema.ts` 47–81) — chứng minh field nào bắt buộc.
2. **Mapper AI** (`recipe-draft.mapper.ts` 143–162) — chứng minh AI không chạm category/cover/nutrition.
3. **Repository submit** (`content.repository.ts` 711–766) — chứng minh trạng thái và role đọc từ DB.

> Mỗi lần mở chỉ 5–7 giây, chỉ vào đúng dòng, đọc một câu, rồi quay lại kịch bản.

---

## 4. Nếu hội đồng hỏi ngay sau script

| Câu hỏi | Trả lời ngắn | File |
|---|---|---|
| "Vì sao submit xong là pending, không phải draft?" | Vì UI đã gọi submit; draft chỉ tồn tại trước submit hoặc khi submit lỗi | `recipe.queries.ts` 145–153 |
| "Sao không cho lưu draft trước?" | UI hiện gộp create+submit; nếu cần tách, backend đã có `POST /posts` tạo DRAFT | `content.service.ts` 272–304 |
| "AI có điền 5 chỉ số không?" | Không. Canonical tính trước; AI chỉ fallback khi thiếu và gắn nhãn AI_ESTIMATED | `recipe-nutrition-review.service.ts` 246–270 |
| "Reject xong bài có mất không?" | Không. Revision rejected; nếu có bản cũ thì bài vẫn public bản cũ | `moderation.repository.ts` 252–257 |
| "Category có bắt buộc không?" | Có, schema `min(1)`; ảnh bìa optional | `recipe-form.schema.ts` 53–54 |
| "Nếu AI trả thiếu nguyên liệu?" | Service pad/cắt cho khớp input; người dùng vẫn review | `recipe-draft.service.ts` 30–43 |
| "Nếu hai tab submit cùng lúc?" | `expectedVersion` chặn; một bên nhận `CONTENT_VERSION_CONFLICT` | `content.service.ts` 372–376 |
| "Nếu AI job fail?" | Submit vẫn thành công; duyệt bị chặn tới khi đủ 5 chỉ số; reviewer có thể sửa hoặc chạy lại | `recipe-nutrition-review.service.ts` 360+ |
| "Vì sao Contributor được publish ngay?" | Rule đã duyệt: role + profile active từ DB + đủ 6 chỉ số + không flag | `content.repository.ts` 711–722 |
| "B12 có bắt buộc không?" | Không; 5 chỉ số mới là điều kiện duyệt | `recipe-form.schema.ts` 89–102 |

---

## 5. Câu chữ tuyệt đối tránh

| Không nói | Nói thay |
|---|---|
| "Khẩu phần/thời gian là optional" | "Có thể để trống tạm ở bước 1, nhưng bắt buộc trước khi gửi" |
| "AI điền toàn bộ dữ liệu còn lại" | "AI chỉ điền định lượng, bước nấu, độ khó, thời gian gợi ý" |
| "Submit xong luôn pending_review" | "Member vào pending; Contributor/Admin đủ điều kiện được publish ngay" |
| "5 chỉ số do AI điền" | "Hệ thống tính canonical trước; AI chỉ bổ sung phần thiếu" |
| "Reject là bài thành rejected" | "Revision rejected; bài giữ bản cũ nếu đã từng publish" |
| "Form có 3 bước" | "Năm bước, category ở bước Phân loại" |
| "Chắc là/em nghĩ là" (khi nói enum) | "Em kiểm tra contract hiện tại" rồi mở file |

---

## 6. Bản rút gọn 45 giây (nếu bị giới hạn thời gian)

> "Luồng tạo công thức có năm bước: thông tin cơ bản, nguyên liệu, bước nấu, phân loại, xem lại. Bước nguyên liệu có AI hỗ trợ định lượng và bước nấu, nhưng AI không chọn danh mục, không tạo ảnh bìa và không khai dinh dưỡng. Khi gửi, frontend tạo nháp `POST /posts` rồi submit `POST /posts/:id/submit`. Member sang `PENDING_REVIEW`; Contributor/Admin đủ sáu chỉ số và không flag thì publish ngay. Dinh dưỡng tính canonical trước, AI chỉ fallback khi thiếu; job không chặn submit nhưng chặn duyệt nếu thiếu năm chỉ số. Approve thì revision và bài sang `PUBLISHED`; reject thì revision `REJECTED`, bài giữ bản cũ nếu đã từng publish."

---

## 7. Checklist trước khi nói

- [ ] Mở sẵn 3 file: schema form, mapper AI, repository submit.
- [ ] Biết tài khoản demo là Member hay Contributor (quyết định câu pending/published).
- [ ] Có sẵn một recipe `PENDING_REVIEW` và một `PUBLISHED` để so.
- [ ] Nhớ 2 con số: **5 bước**, **5 chỉ số bắt buộc + B12 optional**.
- [ ] Không mở quá 3 file; mỗi file chỉ đọc đúng dòng.
