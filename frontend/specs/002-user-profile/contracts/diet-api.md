# Contract: Diet API (`/api/v1`) — frontend consumer

**Feature**: `002-user-profile` | **Status nguồn**: `BACKEND_INTEGRATION.md` §6.2 + flow §7.2 — tất cả `READY` (2026-09-15)
**Nguồn schema**: `docs/api/diet-rules.md` (preview) + `docs/api/users.md` (preferences, schedule).

Luồng bắt buộc (§7.2): chọn bộ ba → `preview` → toggle rule → `preferences` → (PERIODIC) `schedule`.

---

## 1. `POST /diet-rules/preview`

- **Constant**: `API_ENDPOINTS.DIET_RULES.PREVIEW = '/diet-rules/preview'`
- **Auth**: bắt buộc
- **Request**: `DietRulePreviewRequestDto` — `{ dietPattern: VEGAN|LACTO_OVO; practiceSchedule: PERMANENT|PERIODIC; tradition: NONE|BUDDHIST|CHRISTIAN }`.
- **Success** `200` → `DietRulePreviewResponse`: `data = { ruleSetVersion: integer; selection: {dietPattern, practiceSchedule, tradition}; rules: [...] }`.
  → `dietMapper.toPreviewModel(res.data.data)`.
- **Giữ lại**: `ruleSetVersion` + toàn bộ `rules[]` (kể cả rule bị tắt) để gửi lại khi save.
- **Errors**: `400 VALIDATION_ERROR` (bộ ba thiếu/sai) · `401/403` luồng auth chung · `503 DIET_RULES_UNAVAILABLE` → vô hiệu hóa nút lưu diet + hiện "cấu hình chưa sẵn sàng".

## 2. `PUT /users/me/diet-preferences`

- **Constant**: `API_ENDPOINTS.USERS.DIET_PREFERENCES = '/users/me/diet-preferences'`
- **Auth**: bắt buộc
- **Request**: `SaveDietPreferencesRequestDto`:
  ```json
  {
    "dietPattern": "VEGAN",
    "practiceSchedule": "PERIODIC",
    "tradition": "BUDDHIST",
    "ruleSetVersion": 1,
    "rules": [{ "ruleDefinitionId": "<uuid>", "enabled": true }],
    "scheduleDates": ["2026-09-15"],
    "allergies": [{ "allergenCode": "PEANUT", "label": "...", "severity": "..." }],
    "ingredientExclusions": [{ "ingredientId": "<uuid>", "ingredientName": "...", "reason": "..." }]
  }
  ```
  Quy tắc: `rules[]` đủ mọi rule đã preview (kể cả `enabled: false`); loại bỏ rule rỗng ID trước khi gửi.
  **Đã verify với BE 2026-09-15**: preview rule có shape `{id, code, label, description, defaultEnabled, hardConstraint, source, version}` — gửi `id` làm `ruleDefinitionId`; khi `practiceSchedule` là `PERIODIC` thì **bắt buộc** kèm `scheduleDates` (thiếu → `DIET_SCHEDULE_REQUIRED`).
- **Success** `200` → `DietPreferenceResponse` (đủ: pattern/schedule/tradition/version/confirmedAt/requiresRuleReview/rules/schedule/allergies/ingredientExclusions/effectiveConstraints).
  → `dietMapper.toPreferenceModel(res.data.data)`.
- **Hành vi UI sau save**: nếu `practiceSchedule === 'PERMANENT'` → xong; nếu `'PERIODIC'` → chuyển sang màn lịch; nếu `requiresRuleReview === true` → quay về màn preview.
- **Errors**: xem [diet-errors.md](./diet-errors.md) (mã diet riêng).

## 3. `PUT /users/me/diet-schedule`

- **Constant**: `API_ENDPOINTS.USERS.DIET_SCHEDULE = '/users/me/diet-schedule'`
- **Auth**: bắt buộc
- **Request**: `UpdateDietScheduleRequestDto` — `{ dates: ["YYYY-MM-DD", ...] }` (mảng rỗng được phép).
- **Success** `200` → `DietScheduleResponse`: `data = { practiceSchedule, timezone: 'Asia/Ho_Chi_Minh', dates }`.
  → `dietMapper.toScheduleModel(res.data.data)`.
- **Ràng buộc client**: chỉ gọi khi `practiceSchedule === 'PERIODIC'` **và** đã lưu preferences (nếu chưa → `DIET_PREFERENCES_REQUIRED`, UI chặn trước + hướng dẫn quay lại).
- **Errors**: `400 VALIDATION_ERROR` (ngày sai định dạng) · `409` mã diet (xem diet-errors) · `401/403` luồng auth chung.

## 4. Tổng hợp constant (diet)

```ts
API_ENDPOINTS.DIET_RULES.PREVIEW    // '/diet-rules/preview' — POST
API_ENDPOINTS.USERS.DIET_PREFERENCES // '/users/me/diet-preferences' — PUT
API_ENDPOINTS.USERS.DIET_SCHEDULE    // '/users/me/diet-schedule' — PUT
```

## 5. Definition of Done cho contract này

- [ ] `diet.api.ts` có 3 hàm typed, trả `Model`, không leak DTO.
- [ ] `ruleSetVersion` + đủ `rules[]` được gửi lại nguyên vẹn khi save.
- [ ] Rule cứng không tắt được ở UI; dị ứng/kiêng luôn gửi và luôn hiển thị.
- [ ] Không gửi `dates` khi `PERMANENT`; chặn lưu lịch khi chưa có preferences.
- [ ] Mapper test phủ preview/preferences/schedule + biến thể null/enum lạ.
