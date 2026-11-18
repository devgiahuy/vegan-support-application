# 15. Luồng Scan tủ lạnh (fridge recognition)

**Cập nhật:** 2026-11-17 · **Đối chiếu:** `dev` @ `3c6c59c`.
Trạng thái capability: **`IN_PROGRESS`** — source + UI + fake provider chạy; OpenAI adapter đã có nhưng **chưa đánh giá ảnh tủ lạnh Việt Nam thật**.

---

## 1. Một câu đúng bản chất

> "Scan tủ lạnh là pipeline **bất đồng bộ**: ảnh được upload thành asset trước, job nền gọi AI để **đề xuất** nguyên liệu, người dùng sửa/từ chối, và chỉ khi bấm **xác nhận** thì Pantry mới thay đổi trong một transaction."

AI **không** ghi Pantry. Không có confirm = không có thay đổi kho.

---

## 2. Sáu hiểu nhầm thường gặp

| Cách nói dễ sai | Thực tế |
|---|---|
| "AI đọc ảnh xong tự thêm vào kho" | Không. Chỉ tạo candidate; confirm mới ghi Pantry |
| "Mỗi ảnh là một job" | Một job nhận **nhiều ảnh** (tối đa 6) |
| "Số lượng cộng dồn giữa các ảnh" | Không. Cùng nguyên liệu chỉ gộp evidence, **không cộng** |
| "Một ảnh lỗi là mất hết" | Không. Job `PARTIAL_FAILED` giữ kết quả ảnh thành công |
| "Retry tính thêm lượt" | Không. Retry dùng lại reservation của job; tối đa 3 lần |
| "Scan đã production READY" | Không. Phase 21 `IN_PROGRESS`; chưa validate ảnh thật |

---

## 3. Sơ đồ luồng

```
[User chọn ảnh]
   │ tối đa 6 ảnh, ≤10MB, JPEG/PNG/WebP (AVIF chỉ fake)
   ▼
[Validate client] → [Reserve dung lượng] → [Upload Cloudinary] → [Commit MediaAsset]
   │
   ▼
POST /api/v1/ingredient-recognition/jobs
   { imageAssetIds, idempotencyKey }
   │
   ├─ verify asset: owner, kind=FRIDGE_IMAGE, ACTIVE
   ├─ dedupe ảnh trùng nội dung (ETag/hash)
   ├─ transaction: tạo job QUEUED + reserve credit FRIDGE
   └─ setImmediate → xử lý nền
          │
          ▼
   QUEUED → PROCESSING (attempt +1)
          ├─ provider đọc từng ảnh
          ├─ dedupe candidate theo nguyên liệu
          └─ saveResults:
               input PROCESSED/FAILED
               job READY / PARTIAL_FAILED / FAILED
               settle credit (success nếu ≥1 ảnh thành công)
          │
          ▼
[FE poll 2 giây/lần khi QUEUED/PROCESSING]
          │
          ▼
[User review]
   ├─ sửa tên/số lượng/đơn vị
   ├─ liên kết canonical ingredient
   ├─ reject từng món
   └─ xem evidence ảnh
          │
          ▼
POST /jobs/:id/confirm
   { candidates: [{id, expectedVersion}], idempotencyKey }
          │
          ├─ transaction:
          │    ├─ kiểm tra owner/status/version/rejected/quantity
          │    ├─ Pantry có item cùng nguyên liệu + đơn vị?
          │    │    ├─ có → cộng số lượng + ledger ADJUST
          │    │    └─ chưa → check capacity + tạo item + ledger CREATE
          │    ├─ candidate CONFIRMED, món không chọn → REJECTED
          │    └─ job CONFIRMED + confirmationKey/hash
          ▼
[FE nhận pantryChanges] → invalidate Pantry + billing → màn hình tổng kết
```

---

## 4. Bảng bước end-to-end

| # | Nơi xử lý | File · dòng | Dữ liệu / việc xảy ra | Trạng thái |
|---:|---|---|---|---|
| 1 | Chọn ảnh | `fridge-upload-zone.tsx` 43, 83–156 | tối đa 6 ảnh | — |
| 2 | Validate file | `storage-upload.ts` 43–90 | MIME/extension/size | — |
| 3 | Reserve dung lượng | `storage-upload.ts` 120–128 | `POST /uploads/reservations` | reservation HELD |
| 4 | Upload CDN | `storage-upload.ts` 153–174 | Cloudinary FormData | — |
| 5 | Commit asset | `storage-upload.ts` 190–200 | `POST /uploads/reservations/:id/commit` | MediaAsset ACTIVE |
| 6 | Tạo job | `fridge-upload-zone.tsx` 143–145; `ingredient-recognition.api.ts` 19–32 | `POST /jobs` | — |
| 7 | Verify asset | `ingredient-recognition.service.ts` 118–143 | owner/kind/ACTIVE, dedupe nội dung | — |
| 8 | Tạo job + credit | `ingredient-recognition.repository.ts` 70–108 | transaction | **QUEUED** |
| 9 | Xử lý nền | `ingredient-recognition.service.ts` 327–368 | `startProcessing` | **PROCESSING** |
| 10 | Gọi AI | `ingredient-vision.provider.ts` 164–222 | JSON schema, từng ảnh | — |
| 11 | Dedupe | `ingredient-recognition.service.ts` 50–109 | gộp theo canonical/unknown | — |
| 12 | Lưu kết quả | `ingredient-recognition.repository.ts` 200–311 | input + candidate + settle credit | **READY / PARTIAL_FAILED / FAILED** |
| 13 | Poll | `ingredient-recognition.queries.ts` 19–47 | 2 giây/lần khi đang chạy | — |
| 14 | Sửa candidate | `ingredient-recognition.service.ts` 178–256; repository 393–419 | `expectedVersion` | **PROPOSED / EDITED / REJECTED** |
| 15 | Confirm | `candidate-review-screen.tsx` 226–307; service 258–298 | transaction Pantry | **CONFIRMED** |
| 16 | Ghi Pantry | `ingredient-recognition.repository.ts` 494–688 | create/update + ledger + capacity | Pantry CONFIRMED |
| 17 | UI tổng kết | `fridge-scan-client-view.tsx` 130–155 | `pantryChanges` | success |

---

## 5. State machine

### 5.1 Job `RecognitionJobStatus`

```
QUEUED ──► PROCESSING ──► READY
                     ├──► PARTIAL_FAILED
                     ├──► FAILED
                     └──► CANCELLED (user, trước confirm)
READY / PARTIAL_FAILED ──► CONFIRMED (confirm)
READY / PARTIAL_FAILED / FAILED ──► QUEUED (add images hoặc retry)
```

| Trạng thái | Nghĩa | Ai set |
|---|---|---|
| `QUEUED` | Đã tạo, chờ xử lý | create / add images / retry |
| `PROCESSING` | Đang gọi provider | `startProcessing` |
| `READY` | Tất cả ảnh xử lý xong | `saveResults` |
| `PARTIAL_FAILED` | Một số ảnh lỗi, còn kết quả | `saveResults` |
| `FAILED` | Tất cả ảnh lỗi / provider lỗi | `saveResults` / `markFailed` |
| `CONFIRMED` | Đã ghi Pantry | `confirm` |
| `CANCELLED` | User huỷ trước confirm | `cancel` |

### 5.2 Input `RecognitionInputStatus`

`PENDING → PROCESSED` hoặc `PENDING → FAILED`. Retry chỉ đưa `FAILED` về `PENDING`.

### 5.3 Candidate `RecognitionCandidateStatus`

`PROPOSED → EDITED` (user sửa) → `CONFIRMED` (confirm) hoặc `REJECTED` (user bỏ / không chọn khi confirm).

---

## 6. Lớp AI

### 6.1 Provider
- `FakeIngredientVisionProvider` (demo): trả candidate cố định, có nhánh `partial-failure`.
- `OpenAiIngredientVisionProvider`: gọi Responses/vision với **strict JSON schema**:
  - `name`, `quantity` (nullable), `unit` (nullable), `freshnessObservation` (nullable), `confidence` 0–1, `uncertaintyNote` (nullable).
  - Tối đa 100 candidate/ảnh.
  - `detail: high`; output tiếng Việt; không được claim an toàn thực phẩm.
  - Ảnh không có đồ ăn → mảng rỗng vẫn là thành công.
- Ảnh lỗi riêng lẻ → `IMAGE_PROCESSING_FAILED` cho ảnh đó, không làm hỏng cả job.

### 6.2 Dedupe
`deduplicateVisionCandidates` (`service.ts` 50–109):
- Normalize tiếng Việt.
- Resolve canonical ingredient theo tên/alias đã duyệt.
- Key: `ingredient:<id>` hoặc `unknown:<normalizedName>`.
- Cùng key: giữ quantity/unit của candidate **confidence cao hơn**, **không cộng**.
- Ghi note giải thích trùng ảnh; giữ evidence từng ảnh.
- Nguyên liệu chưa xác định vẫn là candidate (`ingredientId: null`), user có thể liên kết sau.

---

## 7. Credit / quota

- Reserve **khi tạo job** (`repository.ts` 105), không phải khi confirm.
- Thứ tự: **daily free → subscription period → permanent credits** (`entitlement.service.ts` 41–115).
- `settle` khi có kết quả:
  - Có **ít nhất 1 ảnh thành công** → tính 1 lượt (kể cả kết quả rỗng).
  - Tất cả ảnh lỗi / provider lỗi / cancel → hoàn lượt (`settle(false)`).
- Retry và add images dùng lại reservation key `FRIDGE:<jobId>` → **không trừ thêm**.
- `BILLING_SCAN_MAX_ATTEMPTS` mặc định 3; vượt → `SCAN_RETRY_LIMIT_EXCEEDED`.
- Hết lượt → `ENTITLEMENT_QUOTA_EXCEEDED` (429, có CTA mua gói).

---

## 8. Confirm — ranh giới duy nhất ghi Pantry

`repository.ts` 494–688, một transaction:

1. Lock user; tìm job owner.
2. Nếu job đã `CONFIRMED`:
   - Cùng `idempotencyKey` + cùng `requestHash` → replay diff.
   - Khác key/hash → conflict.
3. Chỉ confirm khi `READY` hoặc `PARTIAL_FAILED`.
4. Mỗi candidate phải:
   - Thuộc job, `expectedVersion` khớp.
   - Không `REJECTED`.
   - Có quantity > 0 và unit.
5. Pantry:
   - Tìm item `CONFIRMED` cùng owner + `ingredientId` (hoặc normalized text) + cùng unit.
   - Có → cộng quantity, cập nhật confidence/freshness, tăng version, ghi ledger `ADJUST`.
   - Chưa → `assertPantryCapacity`, tạo item source `FRIDGE_RECOGNITION`, ghi ledger `CREATE`.
6. Candidate được chọn → `CONFIRMED`; candidate không chọn → `REJECTED`.
7. Job → `CONFIRMED`, lưu confirmationKey/hash.
8. Trả `pantryChanges` (CREATED/UPDATED) để UI hiển thị.

**Quy đổi khối lượng:** `g`, `kg`, `mg`; đơn vị khác → `normalizedGrams = null`, `conversionStatus = UNKNOWN`. Không tự bịa quy đổi.

**Chống cộng đôi:** idempotency key + confirmation hash + trạng thái job + ledger key `vision:<job>:<candidate>`.

---

## 9. Lỗi, retry, add images

| Tình huống | Hành vi |
|---|---|
| Một ảnh lỗi | Job `PARTIAL_FAILED`; giữ candidate ảnh khác; nút "Thử lại ảnh lỗi" |
| Tất cả ảnh lỗi | `FAILED`; hoàn credit |
| Provider/model đổi giữa job | `FAILED RECOGNITION_PROVIDER_UNAVAILABLE` |
| Retry | Chỉ ảnh `FAILED`; candidate cũ và edit được giữ; cùng credit |
| Add images | Chỉ job `READY/PARTIAL_FAILED/FAILED`, còn slot (<6); ảnh mới merge, **không cộng quantity**, giữ edit/reject |
| Cancel | Trước confirm; job `CANCELLED`; credit hoàn; ảnh đã commit vẫn tính dung lượng |
| Worker cũ trả kết quả muộn | `saveResults` fence theo status + attempt; không ghi đè |
| Confirm sai version | `RECOGNITION_VERSION_CONFLICT` / `RECOGNITION_CANDIDATE_VERSION_CONFLICT` |
| Confirm khi thiếu quantity/unit | `RECOGNITION_CANDIDATE_INCOMPLETE` |

**Rủi ro nhỏ cần biết:** upload nhiều ảnh tuần tự; nếu ảnh thứ N lỗi, các ảnh trước đã commit vẫn chiếm dung lượng nhưng job chưa được tạo. Người dùng phải chọn lại; chưa có cơ chế tái dùng asset đã upload trong UI.

---

## 10. Frontend render & polling

- `pantry/scan/page.tsx`: RSC + Suspense skeleton → `FridgeScanClientView`.
- `FridgeUploadZone`: chọn/kéo thả, camera, preview, xoá, sắp xếp; upload **tuần tự**; progress tổng.
- `useRecognitionJobQuery`: poll **2 giây** khi `QUEUED/PROCESSING`; dừng khi trạng thái cuối; invalidate billing khi xong.
- `RecognitionProgressTracker`: đang chạy, partial, failed, retry, cancel.
- `CandidateReviewScreen`: sửa inline, tab all/active/rejected, evidence ảnh, confirm.
- Chỉ gửi PATCH cho candidate **thay đổi**; lưu version mới nhất rồi mới confirm.
- Confirm lọc bỏ `isRejected`; nếu không còn candidate → chặn.
- `RecognitionConfirmationSummary`: hiển thị CREATED/UPDATED.
- `FreshnessDisclaimerBanner`: luôn hiển thị; không claim an toàn thực phẩm.
- Lỗi map tiếng Việt: `RECOGNITION_IMAGE_LIMIT_EXCEEDED`, `RECOGNITION_STATE_CONFLICT`, `RECOGNITION_CANDIDATE_VERSION_CONFLICT`…

---

## 11. Giới hạn demo / production

- Phase 21 **`IN_PROGRESS`**: OpenAI adapter đã viết nhưng **chưa đánh giá ảnh tủ lạnh Việt Nam thật**.
- Compose mặc định có thể tắt `VISION_ENABLED`; fake provider chỉ là fixture state machine.
- AVIF: service cho phép nhưng OpenAI chỉ nhận JPEG/PNG/WebP; AVIF thực tế chỉ fake.
- Ảnh Cloudinary phải là asset đã commit, đúng owner/kind.
- Không kết luận an toàn thực phẩm từ ảnh; freshness chỉ là quan sát.
- Không claim accuracy khi chưa có bộ ảnh đánh giá.

---

## 12. Kịch bản 90 giây

> "Scan tủ lạnh gồm hai nửa: upload ảnh và xử lý nền.
>
> Trước hết ảnh phải được tải lên kho an toàn: frontend xin giữ dung lượng, upload lên Cloudinary, rồi commit để có asset. Sau đó frontend tạo một job nhận nhiều ảnh, tối đa sáu.
>
> Backend kiểm tra ảnh thuộc đúng người dùng, đúng loại, loại ảnh trùng nội dung, rồi tạo job ở trạng thái chờ và giữ một lượt sử dụng. Job chạy nền: gọi AI đọc từng ảnh, chuẩn hóa tên, gộp các nguyên liệu trùng nhưng **không cộng số lượng** vì có thể là cùng một vật thể trong nhiều ảnh. Kết quả là danh sách ứng viên kèm độ tin cậy, ghi chú và bằng chứng ảnh.
>
> Người dùng sửa số lượng, liên kết nguyên liệu chuẩn hoặc từ chối. Chỉ khi bấm xác nhận, backend mới mở một transaction: cộng vào món đã có hoặc tạo món mới, kiểm tra sức chứa tủ, ghi sổ điều chỉnh, rồi đánh dấu job hoàn tất.
>
> Nếu một ảnh lỗi, job ở trạng thái một phần và chỉ retry ảnh lỗi; không mất kết quả đã có. Nếu tất cả ảnh lỗi hoặc người dùng huỷ, lượt sử dụng được hoàn. Hiện chức năng vẫn ở trạng thái in-progress vì chưa đánh giá ảnh Việt Nam thật."

---

## 13. Câu hỏi nối tiếp

| Câu hỏi | Trả lời ngắn |
|---|---|
| AI có ghi Pantry không? | Không; chỉ confirm trong transaction |
| Vì sao không cộng số lượng giữa ảnh? | Cùng vật thể có thể xuất hiện nhiều ảnh; cộng sẽ sai |
| Ảnh trùng upload 2 lần? | Dedupe theo ETag/nội dung, chỉ phân tích một lần |
| Một ảnh lỗi thì sao? | `PARTIAL_FAILED`, giữ kết quả ảnh khác, retry ảnh lỗi |
| Retry có mất tiền/lượt? | Không; cùng reservation, tối đa 3 lần |
| Confirm 2 lần? | Transaction + idempotency + confirmation hash; không cộng đôi |
| Nguyên liệu lạ? | Vẫn là candidate `ingredientId: null`; user liên kết hoặc lưu text |
| Đơn vị lạ? | `normalizedGrams = null`, conversion UNKNOWN; không tự quy đổi |
| Tủ đầy? | `ENTITLEMENT_QUOTA_EXCEEDED` / capacity error; item cũ vẫn đọc/sửa/xoá được |
| Vì sao IN_PROGRESS? | Chưa validate ảnh thật; provider/accuracy chưa đủ bằng chứng |
