# Implementation Plan: User Profile (hồ sơ, sức khỏe, diet)

**Branch**: `002-user-profile` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-user-profile/spec.md`
**Backend contract**: `/api/v1` — `docs/api/users.md` + `docs/api/diet-rules.md` (riêng preview) + `docs/BACKEND_INTEGRATION.md` §6.2/§7.2
**Feature owner modules**: `src/features/profile` (hồ sơ + sức khỏe) và `src/features/diet-preferences` (diet flow) — theo mapping `BACKEND_INTEGRATION.md` §5
**Phụ thuộc**: spec `001-user-auth` đã xong (session, `User` cơ bản, `USERS.ME` constant, envelope lỗi, `error.code` helpers)

## Summary

Tích hợp 5 endpoint đã `READY` (`GET/PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`) thành 2 feature folder độc lập, đúng kiến trúc DTO → Model → Mapper → API → Query. Trọng tâm kỹ thuật:

1. **Tái dùng, không viết lại**: `USERS.ME` constant, envelope `{success,data,meta}`, `getApiErrorCode/getApiErrorFields`, refresh-queue đã có từ `001-user-auth` — spec này chỉ thêm constant mới và consumer mới.
2. **Sức khỏe**: backend tính BMI/BMR/TDEE (làm tròn 2 decimals); frontend hiển thị + phân loại châu Á bằng `features/health/lib/bmi.ts` có sẵn (bổ sung mức vận động `EXTRA_ACTIVE` 1.9 còn thiếu), cảnh báo BMI <12/>45, disclaimer <16/>35.
3. **Diet flow đúng §7.2**: chọn bộ ba → `preview` → toggle từng rule (quy tắc cứng không cho tắt) → xác nhận `diet-preferences` kèm dị ứng/kiêng → nếu PERIODIC thì `diet-schedule` với ngày `YYYY-MM-DD`. Chỉ gửi ID quy tắc + trạng thái, không tự chế ràng buộc.
4. **Xử lý mã lỗi diet**: `DIET_RULE_RECONFIRMATION_REQUIRED` → về màn review; `DIET_SCHEDULE_REQUIRED` → yêu cầu chọn ngày; `DIET_PREFERENCES_REQUIRED` → chặn lưu lịch đơn lẻ; `HEALTH_PROFILE_INCOMPLETE` → link về nhập sức khỏe.
5. **UI**: refactor trang `/ho-so` (hiện ~914 dòng mock) sang consumer thật, giữ layout; avatar chỉ là URL HTTP(S), không tải file.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) trên Next.js 16 (App Router, React 19)

**Primary Dependencies**: Kế thừa `001-user-auth` (Axios, TanStack Query v5, Zustand, react-hook-form + resolvers, zod 4, shadcn/ui, sonner, lucide-react). Không thêm thư viện mới.

**Storage**: Không persist thêm. Sức khỏe/diet là server-state qua TanStack; profile cơ bản đồng bộ vào Zustand `user` (đã có) sau `PATCH` thành công để header cập nhật ngay.

**Testing**: Vitest mapper test bắt buộc cho mỗi consumer mới (`profile`, `health-profile`, `diet-preferences`, `diet-schedule`, `diet-preview`); `tsc --noEmit`; `npm run build`. Test tay theo `quickstart.md` với backend `:4000`.

**Target Platform**: Web, trình duyệt hiện đại, UI tiếng Việt, múi giờ hiển thị `Asia/Ho_Chi_Minh`.

**Project Type**: Web frontend (single project) — `frontend/` Next.js App Router.

**Performance Goals**: Mở hồ sơ thấy đủ thông tin < 3s (mạng ổn định); lưu sức khỏe hiện kết quả ngay không tải lại (SRS: hiển thị < 500ms ở phía client sau khi có response).

**Constraints**: Cùng repo governance với `001-user-auth` (không `any`, endpoint tập trung, component chỉ nhận Model, alias `@/*`, ưu tiên shadcn). Thêm: không gửi ngày khi `PERMANENT`; không tắt quy tắc cứng; ngày chỉ `YYYY-MM-DD` (không giờ).

**Scale/Scope**: 2 feature folder (`profile`, `diet-preferences`), 5 endpoint backend + 1 preview, 1 route refactor (`/ho-so`), 0 Route Handler mới (không cần proxy — đi qua rewrite `/api/v1/*` với Bearer từ memory).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` vẫn là template chưa ratify (đã ghi nhận ở `001-user-auth`). Áp dụng de-facto governance của repo:

| Gate (nguồn) | Yêu cầu | Trạng thái plan |
| --- | --- | --- |
| `AGENTS.md` — chỉ tích hợp `READY` | 5 endpoint + preview đều `READY` (2026-09-15) | PASS |
| `AGENTS.md` — DTO/Model/Mapper/Query/test mỗi consumer | Mỗi consumer có đủ 7 tầng | PASS |
| `BACKEND_INTEGRATION.md` §5 mapping | `features/profile` + `features/diet-preferences` | PASS |
| `BACKEND_INTEGRATION.md` §7.2 flow | preview → preferences → schedule (PERIODIC) | PASS |
| Business-rule safety | Allergy/exclusion + quy tắc cứng do backend enforce; frontend chỉ hiển thị | PASS |
| Documentation accuracy | Không mô tả mock `/ho-so` là tích hợp xong | PASS — DoD yêu cầu consumer thật |

Không vi phạm → bỏ trống Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-profile/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── profile-api.md   # Contract GET/PATCH /users/me + health-profile
│   ├── diet-api.md      # Contract preview + preferences + schedule
│   └── diet-errors.md   # Contract mã lỗi diet + hành vi UI
└── tasks.md             # Phase 2 (/speckit-tasks — không tạo ở bước này)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── common/
│   │   ├── constants/api-endpoints.ts   # SỬA: thêm USERS.UPDATE_ME/HEALTH_PROFILE/DIET_* + DIET_RULES.PREVIEW
│   │   └── enums/index.ts               # SỬA: DietPattern, PracticeSchedule, Tradition, Sex, ActivityLevel (+ EXTRA_ACTIVE vào lib health)
│   ├── features/profile/                # TẠO
│   │   ├── types/{profile.dto,profile.model,health.dto,health.model}.ts
│   │   ├── mappers/{profile.mapper,health.mapper}.ts (+ .test.ts)
│   │   ├── api/{profile.api,health.api}.ts
│   │   ├── queries/{profile.queries,health.queries}.ts
│   │   ├── schemas/profile.schema.ts
│   │   └── components/{profile-view,basic-profile-form,health-profile-form,health-summary}.tsx
│   ├── features/diet-preferences/       # TẠO
│   │   ├── types/{diet.dto,diet.model}.ts
│   │   ├── mappers/diet.mapper.ts (+ .test.ts)
│   │   ├── api/diet.api.ts              # preview + savePreferences + saveSchedule
│   │   ├── queries/diet.queries.ts
│   │   ├── schemas/diet.schema.ts
│   │   └── components/{diet-selector,diet-rule-list,allergy-editor,exclusion-editor,schedule-editor}.tsx
│   ├── features/health/lib/bmi.ts       # SỬA NHỎ: thêm EXTRA_ACTIVE 1.9 (không đổi công thức)
│   ├── features/auth/                   # SỬA NHỎ: đồng bộ Zustand user sau PATCH me (qua setUser đã có)
│   ├── app/(site)/ho-so/page.tsx        # REFACTOR: dùng consumer thật, giữ layout
│   └── store/useAuthStore.ts            # GIỮ (setUser đã có)
└── docs/
    ├── BACKEND_INTEGRATION.md           # SỬA: FE integrated + changelog
    ├── PROGRESS.md                      # SỬA: % task #9 (+ liên quan #6 nếu có)
    └── WORK-LOG.md                      # SỬA: append entry
```

**Structure Decision**: 2 feature folder độc lập theo đúng mapping §5 (`profile`, `diet-preferences`); dùng chung `User` từ `features/auth` cho phần hiển thị cơ bản, `features/profile` sở hữu `DetailedProfile` mở rộng (không import ngược từ auth sang profile). Không Route Handler mới.

## Complexity Tracking

> Không có vi phạm Constitution Check cần justify.
