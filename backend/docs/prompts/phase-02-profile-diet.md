# Prompt — Phase 02: Profile, Health & Diet Rules

Triển khai Phase 02 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Không dựa vào hội thoại cũ.

Đọc `AGENTS.md`, đặc biệt BL-02/03/07/13 trong `docs/IMPLEMENTATION_PLAN.md`, phase map và frontend integration guide. Xác minh Phase 01 bằng code/OpenAPI. Bảo toàn thay đổi không liên quan.

## Mục tiêu

Triển khai profile, health inputs thủ công, BMI/BMR/TDEE và diet rule preview/confirmation/toggle với tradition MVP `NONE`, `BUDDHIST`, `CHRISTIAN`.

## Scope bắt buộc

- Models/migration: `health_profiles`, `diet_preferences`, `diet_rule_definitions`, `diet_preference_rules`, `diet_schedule_dates`, `user_allergies`, `user_ingredient_exclusions` theo schema khả thi tại phase này.
- Seed versioned rule definitions cho `VEGAN`, `LACTO_OVO`, `BUDDHIST`, `CHRISTIAN`; nội dung rule phải rõ là configurable và không tuyên bố mọi người cùng tradition giống nhau.
- `PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`.
- BMI/BMR/TDEE service deterministic; validate age/sex/height/weight/activity level.
- Rule preview trả code/label/description/defaultEnabled/hardConstraint/source/version.
- Save chỉ chấp nhận rule IDs thuộc preview/version hợp lệ; backend tính effective constraints.
- `PERIODIC` lưu date-only theo Asia/Ho_Chi_Minh; không tự tính lịch âm.
- Allergies/explicit exclusions không bị tradition toggle vô hiệu hóa.
- Không đưa dữ liệu sức khỏe nhạy cảm vào log.

## Acceptance

- Công thức, boundary inputs, ownership, invalid rule ID/version, toggle persistence, periodic schedule required và rule priority được xử lý đầy đủ.
- Response `/users/me` không lộ field nội bộ/PII không cần thiết.
- OpenAPI và integration guide cập nhật endpoint/error codes; chỉ READY khi lint/typecheck/build pass.
- Phase 02 completion record cập nhật.
- Lint/typecheck/build pass.

Không làm HealthKit, Health Connect, cảm biến hoặc Meal Planner.

Commit duy nhất:

```text
feat(profile): add health and diet preferences
```

Final báo hash, migration, seeded rule version, API READY và gate.
