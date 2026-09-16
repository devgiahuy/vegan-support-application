---

description: "Task list for feature implementation"
---

# Tasks: User Profile (hồ sơ, sức khỏe, diet)

**Input**: Design documents from `/specs/002-user-profile/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Repo governance yêu cầu **bắt buộc mapper test** cho mỗi API consumer mới. Không áp dụng TDD đầy đủ; các test khác chỉ chạy khi được yêu cầu.

**Organization**: Task nhóm theo user story (P1 → P2) để mỗi story có thể implement và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story tương ứng (US1..US5)
- Mọi task đều có đường dẫn file cụ thể

## Path Conventions

Repo root làm việc là `frontend/` (AGENTS.md §5). Path trong task ghi theo workspace root `vegan-support-application/` để khớp [plan.md](./plan.md):

- Feature code: `frontend/src/features/profile/**`, `frontend/src/features/diet-preferences/**`
- Shared: `frontend/src/common/**`, `frontend/src/lib/**`, `frontend/src/types/**`
- Docs: `frontend/docs/**`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận contract sẵn sàng và chốt baseline.

- [X] T001 [P] Chạy `npm run sync:swagger` trong `frontend/` (backend `:4000` đang chạy được) và xác nhận 6 endpoint (`GET/PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`) đều `READY` trong `frontend/docs/BACKEND_INTEGRATION.md` §6.2 và có schema trong `frontend/docs/api/users.md`, `frontend/docs/api/diet-rules.md`.
- [X] T002 [P] Chạy baseline trong `frontend/`: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint`. Ghi lại lỗi có sẵn (đã biết: lint còn lỗi baseline cũ ở pages/lib cũ) để không quy sai cho feature này.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mà **mọi** user story phụ thuộc: constant, enum, DTO/Model/Mapper + test.

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong.

- [X] T003 Cập nhật `frontend/src/common/constants/api-endpoints.ts`: thêm `USERS.HEALTH_PROFILE = '/users/me/health-profile'`, `USERS.DIET_PREFERENCES = '/users/me/diet-preferences'`, `USERS.DIET_SCHEDULE = '/users/me/diet-schedule'`, nhánh `DIET_RULES: { PREVIEW: '/diet-rules/preview' }`. Tái dùng `USERS.ME` cho cả GET và PATCH (không tạo constant trùng). (research R2)
- [X] T004 Cập nhật `frontend/src/common/enums/index.ts`: thêm `DietPattern` (`VEGAN`, `LACTO_OVO`), `PracticeSchedule` (`PERMANENT`, `PERIODIC`), `Tradition` (`NONE`, `BUDDHIST`, `CHRISTIAN`), `BiologicalSex` (`MALE`, `FEMALE`), `ActivityLevel` (`SEDENTARY`, `LIGHTLY_ACTIVE`, `MODERATELY_ACTIVE`, `VERY_ACTIVE`, `EXTRA_ACTIVE`), `HealthDataSource` (`MANUAL`). Không sửa enum auth đã có. (data-model.md §1)
- [X] T005 Bổ sung mức `EXTRA_ACTIVE` (factor `1.9`, nhãn "Vận động rất nhiều (Lao động nặng / tập 2 buổi mỗi ngày)") vào `ACTIVITY_LEVELS` trong `frontend/src/features/health/lib/bmi.ts`. Không đổi công thức `calcBmi`/`calcBmr`/`calcTdee`. (research R3)
- [X] T006 [P] Tạo `frontend/src/features/profile/types/profile.dto.ts`: `ProfileResponseDto` (`{ success?: boolean; data?: (UserDto mở rộng + healthProfile?: object | null + dietPreference?: object | null) | null; meta?: null }`), `UpdateBasicProfileRequestDto` (`{ displayName?: string; avatarUrl?: string | null }`). Import `UserDto` từ `features/auth` cho phần user. (data-model.md §2.1/§3.1)
- [X] T007 [P] Tạo `frontend/src/features/profile/types/profile.model.ts`: `DetailedProfile` (`{ user: User (dùng lại từ features/auth); health: HealthProfile | null; diet: DietPreferenceSummary | null; memberSince: string }`), `DietPreferenceSummary` (`{ dietPattern: DietPattern; dietPatternLabel: string; practiceSchedule: PracticeSchedule; practiceScheduleLabel: string; tradition: Tradition; traditionLabel: string; requiresRuleReview: boolean; confirmedAt: Date | null }`). (data-model.md §2.1)
- [X] T008 [P] Tạo `frontend/src/features/profile/types/health.dto.ts`: `HealthProfileDto` (`heightCm?`, `weightKg?`, `age?`, `sex?`, `activityLevel?`, `height_cm?`, `activity_level?`, `bmi?`, `bmr?`, `tdee?`, `dataSource?`, `data_source?`, `updatedAt?`, `updated_at?`), `HealthProfileRequestDto` (`{ heightCm: number; weightKg: number; age: number; sex: string; activityLevel: string }` — cả 5 bắt buộc). (data-model.md §3.2)
- [X] T009 [P] Tạo `frontend/src/features/profile/types/health.model.ts`: `HealthProfile` (`heightCm: number`, `weightKg: number`, `age: number`, `sex: BiologicalSex` + `sexLabel: string`, `activityLevel: ActivityLevel` + `activityLevelLabel: string`, `bmi: number`, `bmiCategory: string`, `hasAbnormalBmi: boolean` (`bmi < 12 || bmi > 45`), `needsDisclaimer: boolean` (`bmi < 16 || bmi > 35`), `bmr: number`, `tdee: number`, `dataSource: HealthDataSource`, `updatedAt: Date | null`). (data-model.md §2.2)
- [X] T010 [P] Tạo `frontend/src/features/diet-preferences/types/diet.dto.ts`: `DietRulePreviewRequestDto` (`{ dietPattern: string; practiceSchedule: string; tradition: string }` — cả 3 bắt buộc), `DietRulePreviewResponseDto` (`{ success?: boolean; data?: { ruleSetVersion?: number; selection?: { dietPattern?: string; practiceSchedule?: string; tradition?: string }; rules?: DietRuleDto[] } | null; meta?: null }`), `DietRuleDto` (`ruleDefinitionId?`, `rule_definition_id?`, `id?`, `name?`, `source?`, `isDefault?`, `is_default?`, `isHard?`, `is_hard?`, `hard?`, `required?`, `enabled?`, `isEnabled?`), `SaveDietPreferencesRequestDto` (`{ dietPattern: string; practiceSchedule: string; tradition: string; ruleSetVersion: number; rules: Array<{ ruleDefinitionId: string; enabled: boolean }>; scheduleDates?: string[]; allergies?: Array<{ allergenCode: string; label?: string; severity?: string }>; ingredientExclusions?: Array<{ ingredientId?: string; ingredientName: string; reason?: string }> }`), `UpdateDietScheduleRequestDto` (`{ dates: string[] }`). (data-model.md §3.3–§3.5)
- [X] T011 [P] Tạo `frontend/src/features/diet-preferences/types/diet.model.ts`: `DietPattern`, `PracticeSchedule`, `Tradition` dùng lại từ `@/common/enums`; `DietRule` (`ruleDefinitionId: string`, `name: string` fallback `'Quy tắc'`, `source: string` fallback `''`, `isDefault: boolean`, `isHard: boolean`, `enabled: boolean`), `DietPreview` (`{ ruleSetVersion: number; selection: { dietPattern; practiceSchedule; tradition }; rules: DietRule[] }`), `Allergy` (`allergenCode: string` bắt buộc, `label: string` fallback code, `severity: string` fallback `''`), `IngredientExclusion` (`ingredientId: string | null`, `ingredientName: string` bắt buộc, `reason: string` fallback `''`), `DietPreference` (đủ 9 field §2.4 gồm `rules: DietRule[]`, `allergies: Allergy[]`, `ingredientExclusions: IngredientExclusion[]`, `effectiveConstraints: { always: string[]; scheduledTradition: string | null }`), `DietSchedule` (`practiceSchedule`, `timezone: string`, `dates: string[]` mỗi phần tử `YYYY-MM-DD`). (data-model.md §2.3–§2.5)
- [X] T012 Tạo `frontend/src/features/profile/mappers/profile.mapper.ts` (extends `BaseMapper`): `toModel` dùng lại `authMapper.toModel` cho 8 field user đầu; `health`/`diet` tóm tắt map bằng mapper mới, `null` khi backend trả `null`; `memberSince` derived qua `formatDate` (`'-'` khi null); `toUpdateDto` chỉ gửi field đã đổi (`displayName`/`avatarUrl`, avatar `''` → `null`). Dùng `pickField` + `safe*` cho mọi field, không `any`. (data-model.md §6)
- [X] T013 Tạo `frontend/src/features/profile/mappers/health.mapper.ts` (extends `BaseMapper`/`BaseBidirectionalMapper`): `toModel` giữ nguyên số backend (`bmi`/`bmr`/`tdee`), `bmiCategory` qua `calcBmi(...).category`, `hasAbnormalBmi`/`needsDisclaimer` theo ngưỡng SRS, label enum tiếng Việt; `toRequestDto` gửi đúng 5 field bắt buộc. (data-model.md §6, research R3)
- [X] T014 Tạo `frontend/src/features/diet-preferences/mappers/diet.mapper.ts`: `toPreviewModel` (giữ `ruleSetVersion` + toàn bộ rules, `isHard` từ `['isHard','is_hard','hard','required']` fallback `false`), `toPreferenceModel` (đủ 9 field, `effectiveConstraints` fallback `{ always: [], scheduledTradition: null }`), `toScheduleModel` (`dates` lọc regex `^\d{4}-\d{2}-\d{2}$`), `toSaveDto` (loại rule rỗng ID, `scheduleDates`/`allergies`/`exclusions` nguyên văn), `toScheduleDto`. (data-model.md §6)
- [X] T015 [P] Tạo `frontend/src/features/profile/mappers/profile.mapper.test.ts` (Vitest): response đủ health/diet; `healthProfile: null`; `avatarUrl: null`; `role`/`status` lạ; `toUpdateDto` chỉ gửi field đổi và map avatar `''` → `null`. (research R10)
- [X] T016 [P] Tạo `frontend/src/features/profile/mappers/health.mapper.test.ts` (Vitest): số backend giữ nguyên (kể cả dạng chuỗi số); ngưỡng `hasAbnormalBmi`/`needsDisclaimer` đúng biên 12/45/16/35; `sex`/`activityLevel` lạ → fallback `MALE`/`SEDENTARY`; ngày sai → `updatedAt: null`. (research R10)
- [X] T017 [P] Tạo `frontend/src/features/diet-preferences/mappers/diet.mapper.test.ts` (Vitest): preview giữ `ruleSetVersion` + rule cứng; `rules: null` → `[]`; enum lạ → fallback; `dates` lẫn định dạng sai bị lọc; `toSaveDto` loại rule rỗng ID và giữ đủ rule đã preview. (research R10)

**Checkpoint**: Foundation ready — các user story có thể bắt đầu.

---

## Phase 3: User Story 1 - Xem hồ sơ của tôi (Priority: P1) 🎯 MVP

**Goal**: Người dùng đã đăng nhập xem đầy đủ hồ sơ của mình; khối trống hiện lời mời nhập, không lỗi.

**Independent Test**: Đăng nhập, mở `/ho-so`, thấy tên + email + ảnh + vai trò của mình trong < 3s; `GET /users/me` 200 trong Network.

### Implementation for User Story 1

- [X] T018 [US1] Tạo `frontend/src/features/profile/api/profile.api.ts`: `getDetailedProfile(): Promise<DetailedProfile>` qua `api.get<APIResponse<ProfileResponseDto>>(API_ENDPOINTS.USERS.ME)` → `profileMapper.toDetailedModel(res.data.data)`. Không leak DTO. (contracts/profile-api.md §1)
- [X] T019 [US1] Tạo `frontend/src/features/profile/queries/profile.queries.ts`: `PROFILE_QUERY_KEYS = { all: ['profile'], detail: () => [...all, 'detail'] }`, `useDetailedProfileQuery` gọi `profileApi.getDetailedProfile`. (ARCHITECTURE §4)
- [X] T020 [US1] Tạo `frontend/src/features/profile/components/profile-view.tsx`: nhận `DetailedProfile` (Model, không DTO), hiển thị tên/email/ảnh/vai trò/ngày tham gia + đơn contributor (nếu có) + slot cho khối sức khỏe/diet; xử lý đủ loading/error/empty/success bằng `components/shared/*` + shadcn, tiếng Việt. (FR-001)
- [X] T021 [US1] Refactor `frontend/src/app/(site)/ho-so/page.tsx`: đọc kỹ file hiện tại (~914 dòng mock), thay khối hồ sơ mock bằng `ProfileView` + `useDetailedProfileQuery`, giữ nguyên layout/style/token, bọc `AuthGuard` nếu chưa có. (research R9)

**Checkpoint**: User Story 1 hoạt động và kiểm thử độc lập (VP-1 trong quickstart.md).

---

## Phase 4: User Story 2 - Cập nhật tên hiển thị và ảnh đại diện (Priority: P1)

**Goal**: Đổi tên/ảnh, lưu thành công, thấy ngay ở hồ sơ và header, giữ sau F5.

**Independent Test**: Đổi tên → lưu → tên mới ở cả hồ sơ và header; F5 vẫn giữ; URL ảnh sai bị chặn tại client.

### Implementation for User Story 2

- [X] T022 [US2] Tạo `frontend/src/features/profile/schemas/profile.schema.ts`: `basicProfileSchema` gồm `displayName` (2–100 ký tự) optional, `avatarUrl` (rỗng hoặc URL HTTP(S) — `z.string().url()` + refine `startsWith('http://') || startsWith('https://')`, `''` cho phép để xóa ảnh) optional, `superRefine` yêu cầu ít nhất một trong hai có giá trị; thông điệp tiếng Việt. (data-model.md §5 V1–V3)
- [X] T023 [US2] Thêm `patchBasicProfile(payload: { displayName?: string; avatarUrl?: string | null }): Promise<DetailedProfile>` vào `frontend/src/features/profile/api/profile.api.ts`: `api.patch<APIResponse<ProfileResponseDto>>(API_ENDPOINTS.USERS.ME, body)` → `profileMapper.toDetailedModel`. (contracts/profile-api.md §2)
- [X] T024 [US2] Thêm `useUpdateBasicProfileMutation` vào `frontend/src/features/profile/queries/profile.queries.ts`: `onSuccess` gọi `useAuthStore.setUser(detailed.user)` + invalidate `PROFILE_QUERY_KEYS.detail` **và** `AUTH_QUERY_KEYS.me()` (import key từ `features/auth`). (research R6)
- [X] T025 [US2] Tạo `frontend/src/features/profile/components/basic-profile-form.tsx`: react-hook-form + `zodResolver(basicProfileSchema)` với default từ `DetailedProfile`, preview ảnh từ URL, nút lưu disabled khi form không dirty, map `VALIDATION_ERROR.fields` vào input, toast thành công tiếng Việt. (FR-002, FR-010)
- [X] T026 [US2] Tích hợp `BasicProfileForm` vào `frontend/src/app/(site)/ho-so/page.tsx` (khối hồ sơ), giữ layout. (FR-002)

**Checkpoint**: US1 và US2 cùng hoạt động độc lập (VP-2).

---

## Phase 5: User Story 3 - Nhập chỉ số sức khỏe và xem BMI/BMR/TDEE (Priority: P1)

**Goal**: Nhập đủ 5 chỉ số, lưu, thấy ngay BMI + phân loại + BMR + TDEE; cảnh báo ngưỡng đúng SRS.

**Independent Test**: Nhập đủ 5 chỉ số hợp lệ → lưu → thấy kết quả ngay không cần F5; số khớp response trong Network.

### Implementation for User Story 3

- [X] T027 [US3] Thêm `healthProfileSchema` vào `frontend/src/features/profile/schemas/` (file mới `health.schema.ts` hoặc mở rộng `profile.schema.ts`): `heightCm` (> 0), `weightKg` (> 0), `age` (nguyên, 1–120), `sex` (enum `MALE`/`FEMALE`), `activityLevel` (enum 5 mức), tất cả bắt buộc, thông điệp tiếng Việt. (data-model.md §5 V4–V5)
- [X] T028 [US3] Tạo `frontend/src/features/profile/api/health.api.ts`: `saveHealthProfile(payload: HealthProfileRequestDto): Promise<HealthProfile>` qua `api.put<APIResponse<HealthProfileResponseDto>>(API_ENDPOINTS.USERS.HEALTH_PROFILE, payload)` → `healthMapper.toModel`. Không leak DTO. (contracts/profile-api.md §3)
- [X] T029 [US3] Tạo `frontend/src/features/profile/queries/health.queries.ts`: `HEALTH_QUERY_KEYS = { all: ['health-profile'], detail: () => [...all, 'detail'] }`, `useSaveHealthProfileMutation` (onSuccess invalidate `HEALTH_QUERY_KEYS.detail` + `PROFILE_QUERY_KEYS.detail`), và `useHealthProfileQuery` nếu cần đọc độc lập. (ARCHITECTURE §4)
- [X] T030 [US3] Tạo `frontend/src/features/profile/components/health-profile-form.tsx`: form 5 trường (số + select giới tính/mức vận động với nhãn tiếng Việt từ model), validate client chặn trước khi gửi, map `VALIDATION_ERROR.fields` (`heightCm`, `weightKg`, `age`...), disable khi pending. (FR-003, FR-010)
- [X] T031 [US3] Tạo `frontend/src/features/profile/components/health-summary.tsx`: nhận `HealthProfile | null` — null → empty state + CTA nhập; có dữ liệu → hiển thị BMI + phân loại + BMR + TDEE + nguồn `MANUAL` + thời điểm cập nhật; cảnh báo khi `hasAbnormalBmi`, disclaimer khi `needsDisclaimer`; số hiển thị đúng backend trả (không tính lại). (FR-003, FR-004)
- [X] T032 [US3] Tích hợp `HealthProfileForm` + `HealthSummary` vào `frontend/src/app/(site)/ho-so/page.tsx` (khối sức khỏe), giữ layout. (FR-003)

**Checkpoint**: US3 hoạt động độc lập (VP-3).

---

## Phase 6: User Story 4 - Xem trước và xác nhận chế độ ăn (Priority: P2)

**Goal**: Chọn bộ ba → xem trước từng rule (cứng không tắt được) → xác nhận kèm dị ứng/kiêng → lưu đúng ID rule + version.

**Independent Test**: Chọn thuần chay + chay kỳ + Phật giáo → preview → toggle rule thường → thêm dị ứng/kiêng → xác nhận → F5 giữ nguyên; request đủ `rules[]` + `ruleSetVersion`.

### Implementation for User Story 4

- [X] T033 [US4] Tạo `frontend/src/features/diet-preferences/schemas/diet.schema.ts`: `dietSelectionSchema` (bộ ba enum bắt buộc), `dietConfirmSchema` (rules đủ `ruleDefinitionId` + `enabled`, `allergies[]` có `allergenCode`, `exclusions[]` có `ingredientName` không rỗng; dedupe kiêng trùng bằng trim+lowercase ở client theo V8), thông điệp tiếng Việt. (data-model.md §5 V7–V9)
- [X] T034 [US4] Tạo `frontend/src/features/diet-preferences/api/diet.api.ts`: `previewDietRules(payload): Promise<DietPreview>` qua `api.post<APIResponse<DietRulePreviewResponseDto>>(API_ENDPOINTS.DIET_RULES.PREVIEW, payload)` → `toPreviewModel`; `saveDietPreferences(payload: SaveDietPreferencesRequestDto): Promise<DietPreference>` qua `api.put<...>(API_ENDPOINTS.USERS.DIET_PREFERENCES, payload)` → `toPreferenceModel`. Không leak DTO. (contracts/diet-api.md §1–§2)
- [X] T035 [US4] Tạo `frontend/src/features/diet-preferences/queries/diet.queries.ts`: `DIET_QUERY_KEYS = { all: ['diet'], preview: (sel) => [...all, 'preview', sel], preference: () => [...all, 'preference'], schedule: () => [...all, 'schedule'] }`; `useDietPreviewQuery(selection, { enabled })` chỉ gọi khi đủ bộ ba; `useSaveDietPreferencesMutation` (onSuccess invalidate preference + profile detail). (ARCHITECTURE §4)
- [X] T036 [P] [US4] Tạo `frontend/src/features/diet-preferences/components/diet-selector.tsx`: 3 nhóm radio/select (pattern/schedule/tradition) với nhãn tiếng Việt từ model, dùng shadcn, nhận value + onChange, không gọi API. (FR-005)
- [X] T037 [P] [US4] Tạo `frontend/src/features/diet-preferences/components/diet-rule-list.tsx`: nhận `DietRule[]`, mỗi rule có toggle (shadcn switch); rule `isHard` → disabled + nhãn "Luôn bật"; hiển thị tên/nguồn/mặc định; không format logic trong JSX. (FR-005, FR-006)
- [X] T038 [P] [US4] Tạo `frontend/src/features/diet-preferences/components/allergy-editor.tsx`: thêm/xóa dị ứng (`allergenCode` bắt buộc + label + severity), nhãn "luôn là ràng buộc cứng", validate không trùng code. (FR-007)
- [X] T039 [P] [US4] Tạo `frontend/src/features/diet-preferences/components/exclusion-editor.tsx`: thêm/xóa kiêng (`ingredientName` bắt buộc + `ingredientId` optional + reason), dedupe trim+lowercase, nhãn "luôn là ràng buộc cứng". (FR-007, V8)
- [X] T040 [US4] Tạo `frontend/src/features/diet-preferences/components/diet-wizard.tsx`: điều phối 3 bước (chọn → preview/toggle + dị ứng/kiêng → xác nhận) theo flow §7.2; xử lý mã lỗi theo [contracts/diet-errors.md](./contracts/diet-errors.md) (`DIET_RULE_RECONFIRMATION_REQUIRED` → về preview giữ lựa chọn; `DIET_RULES_UNAVAILABLE` → khóa nút lưu; `INVALID_DIET_RULE_SELECTION` → sync preview + xác nhận lại); sau save: `PERMANENT` → xong, `PERIODIC` → chuyển lịch, `requiresRuleReview` → về preview. (FR-005–FR-009)
- [X] T041 [US4] Tích hợp `DietWizard` (+ tóm tắt `effectiveConstraints`) vào `frontend/src/app/(site)/ho-so/page.tsx` (khối chế độ ăn) hoặc route diet riêng nếu trang quá lớn — quyết định khi đọc file, giữ layout. (FR-005)

**Checkpoint**: US4 hoạt động độc lập (VP-4).

---

## Phase 7: User Story 5 - Đặt ngày chay kỳ (Priority: P2)

**Goal**: Lịch chay kỳ chọn/lưu ngày `YYYY-MM-DD`; trường chay không cần bước này; chưa có preferences thì bị chặn có hướng dẫn.

**Independent Test**: Chọn vài ngày → lưu → F5 đúng các ngày; chuyển trường chay → màn lịch khóa, không gửi `dates`.

### Implementation for User Story 5

- [X] T042 [US5] Thêm `saveDietSchedule(dates: string[]): Promise<DietSchedule>` vào `frontend/src/features/diet-preferences/api/diet.api.ts`: `api.put<APIResponse<DietScheduleResponseDto>>(API_ENDPOINTS.USERS.DIET_SCHEDULE, dietMapper.toScheduleDto(dates))` → `toScheduleModel`. (contracts/diet-api.md §3)
- [X] T043 [US5] Thêm `useSaveDietScheduleMutation` vào `frontend/src/features/diet-preferences/queries/diet.queries.ts`: onSuccess invalidate `DIET_QUERY_KEYS.schedule` + preference + profile detail. (ARCHITECTURE §4)
- [X] T044 [US5] Tạo `frontend/src/features/diet-preferences/components/schedule-editor.tsx`: thêm ngày qua `input type="date"` + chip list có nút xóa, validate regex `YYYY-MM-DD`, cho phép lưu mảng rỗng (xóa hết ngày), gửi mảng string nguyên văn không convert timezone, dùng shadcn + tiếng Việt. (FR-008, research R8)
- [X] T045 [US5] Tích hợp `ScheduleEditor` vào wizard/trang diet: chỉ hiện khi `practiceSchedule === 'PERIODIC'` (ẩn/khóa khi `PERMANENT`, không gửi `dates`); chặn khi chưa có preferences (`DIET_PREFERENCES_REQUIRED` → hướng dẫn quay lại lưu diet trước). (FR-008, contracts/diet-errors.md)

**Checkpoint**: US5 hoạt động độc lập (VP-5).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Đồng bộ tài liệu và xác thực cuối.

- [X] T046 [P] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`: đặt `FE integrated` = `Yes` (kèm ngày) cho `GET/PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`; thêm entry changelog nếu behavior/contract thay đổi.
- [X] T047 [P] Cập nhật `frontend/docs/PROGRESS.md`: tăng `%` task #9 (Sức khỏe UC-13) theo 7 bước scaffold (và task #6 nếu diet ảnh hưởng thực đơn) + append lịch sử cập nhật.
- [X] T048 [P] Append entry vào `frontend/docs/WORK-LOG.md` theo mẫu (mục tiêu, đã làm, file tạo/sửa, kết quả `tsc`/`npm test`/`build`/test tay, PROGRESS đổi ra sao, còn lại/rủi ro).
- [X] T049 Chạy gate cuối trong `frontend/`: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint` (so với baseline T002 — chỉ quan tâm lỗi mới), `git diff --check`. (quickstart.md §2)
- [ ] T050 Chạy xác thực thủ công VP-1 → VP-7 (API-level đã pass hết bằng curl 2026-09-15 — xem WORK-LOG; còn test tay UI)
- [X] T052 Fix bọc envelope 2 tầng ở `auth.api.ts` (register/login/getMe/logout-fallback), `profile.api.ts` (2 hàm), `diet.api.ts` (3 hàm): dùng DTO envelope trực tiếp + đọc `res.data`; thêm rule vào `ARCHITECTURE.md` §3
- [X] T053 Fix severity dị ứng: `AllergyEditor` thêm select MILD/MODERATE/SEVERE (mặc định MODERATE) + `toSaveDto` chuẩn hóa; thêm test case
- [X] T054 Fix AUTH_REQUIRED noise: `useDetailedProfileQuery` thêm `enabled: isAuthenticated`
- [X] T055 Hiển thị ngày chay kỳ: summary thêm `scheduleDates/timezone`, card tóm tắt hiện ngày, wizard preselect từ `initialSelection`; thêm test case
- [X] T056 Sửa ngày inline: tách `ScheduleDatePicker` dùng chung; tạo `CurrentDietCard` (Sửa/Lưu/Hủy ngày trong card tóm tắt, chỉ khi PERIODIC); thay card tĩnh ở `ho-so/page.tsx` trong `frontend/specs/002-user-profile/quickstart.md` với backend local; ghi lại kết quả từng kịch bản. (quickstart.md §3)
- [X] T051 [P] Rà soát bất biến kiến trúc bằng `rg` trong `frontend/src/features/profile` và `frontend/src/features/diet-preferences`: không `any`/`as any`/`@ts-ignore`; không hardcode endpoint (dùng `API_ENDPOINTS`); component không đọc `*Dto`; không cache server-state trong Zustand; không gửi ngày khi `PERMANENT`; rule cứng không tắt được. (ARCHITECTURE §2/§3, AGENTS.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc — chạy ngay.
- **Foundational (Phase 2)**: Phụ thuộc Setup — **CHẶN mọi user story**.
- **User Stories (Phase 3–7)**: Đều phụ thuộc Foundational; sau đó tuần tự P1 → P2 (US4/US5 chạm file diet dùng chung nên không song song với nhau).
- **Polish (Phase 8)**: Phụ thuộc các story mong muốn đã xong.

### User Story Dependencies

- **US1 (P1)**: sau Foundational, không phụ thuộc story khác.
- **US2 (P1)**: sau Foundational; chạm `profile.api.ts`/`profile.queries.ts` dùng chung với US1 → làm sau US1.
- **US3 (P1)**: sau Foundational; độc lập file với US1/US2 (health.* riêng) → có thể song song với US2 nếu đủ người.
- **US4 (P2)**: sau Foundational; nên sau US1 (dùng `DetailedProfile`/trang `/ho-so` chung).
- **US5 (P2)**: sau US4 (chạm `diet.api.ts`/`diet.queries.ts` + wizard chung).

### Within Each User Story

- Schema/DTO → API → Query → UI → tích hợp (đúng scaffold ARCHITECTURE §5).
- Mapper + test xong ở Foundational trước khi story dùng.
- Không bắt đầu story mới khi story ưu tiên trước chưa qua checkpoint.

### Parallel Opportunities

- **Setup**: T001, T002 song song.
- **Foundational**: T006∥T007∥T008∥T009∥T010∥T011 (6 file DTO/Model khác nhau); T015∥T016∥T017 sau khi mapper tương ứng xong; T003∥T004∥T005 song song với nhóm DTO/Model.
- **US4**: T036∥T037∥T038∥T039 (4 component khác file).
- **Polish**: T046∥T047∥T048∥T051 (khác file); T049/T050 sau khi code xong.
- **Lưu ý**: T012 cần T006+T007; T013 cần T008+T009; T014 cần T010+T011; US2/US4/US5 chạm file dùng chung nên tuần tự.

---

## Parallel Example: Foundational DTO/Model

```text
# Song song được (khác file):
Task: "T006 Create frontend/src/features/profile/types/profile.dto.ts"
Task: "T007 Create frontend/src/features/profile/types/profile.model.ts"
Task: "T008 Create frontend/src/features/profile/types/health.dto.ts"
Task: "T009 Create frontend/src/features/profile/types/health.model.ts"
Task: "T010 Create frontend/src/features/diet-preferences/types/diet.dto.ts"
Task: "T011 Create frontend/src/features/diet-preferences/types/diet.model.ts"

# Tuần tự (phụ thuộc):
Task: "T014 Create frontend/src/features/diet-preferences/mappers/diet.mapper.ts"  # cần T010 + T011
Task: "T017 Create frontend/src/features/diet-preferences/mappers/diet.mapper.test.ts"  # cần T014
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (bắt buộc).
2. Phase 3 US1 (xem hồ sơ) → **STOP & VALIDATE** VP-1.
3. Demo MVP nếu đạt.

### Incremental Delivery

1. Setup + Foundational → nền tảng sẵn sàng.
2. US1 → VP-1 → demo.
3. US2 (tên/ảnh) → VP-2 → demo.
4. US3 (sức khỏe) → VP-3 → demo.
5. US4 (diet) → VP-4 → demo.
6. US5 (lịch) → VP-5 → demo.
7. Polish → VP-6/VP-7 + gates + docs.

### Parallel Team Strategy

- Setup + Foundational làm chung.
- Sau Foundational: dev A = US1→US2, dev B = US3 (file health.* độc lập), dev C = US4→US5 sau khi US1 xong.
- Polish chạy song song theo file.

---

## Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- Nhãn [Story] chỉ dùng ở phase user story (Phase 3–7).
- Test bắt buộc: mapper test ở T015/T016/T017 (repo governance). Các test khác chỉ thêm khi được yêu cầu.
- Không commit/push khi chưa được yêu cầu (AGENTS.md).
- Điểm dễ sai: `ruleSetVersion` phải gửi lại nguyên vẹn; đủ `rules[]` kể cả rule tắt; không gửi `dates` khi `PERMANENT`; BMI hiển thị đúng số backend (không tính lại); PATCH cần ít nhất 1 field.
- Flip checkbox trong file này **chỉ bằng Edit tool** (không dùng `Set-Content` PowerShell để tránh hỏng encoding UTF-8).
