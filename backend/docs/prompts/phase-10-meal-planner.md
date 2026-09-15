# Prompt — Phase 10: Meal Planner

Triển khai Phase 10 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Session độc lập, repository là nguồn trạng thái.

Đọc `AGENTS.md`, BL-02/03/04/07/08 trong implementation plan, phase map, related modules, OpenAPI và integration guide. Xác minh phases 02, 03, 04, 09.

## Mục tiêu

Triển khai Weekly Meal Planner deterministic: generate, save version, regenerate, swap và shopping list.

## Scope bắt buộc

- Models/migrations: meal plans, items, version/supersedes, warnings và shopping-list representation.
- Yêu cầu health profile đủ field; target MAINTAIN=TDEE, LOSE=90%, GAIN=110% qua config.
- 7 ngày × 3 bữa; calorie split 25/40/35.
- Candidate hard filters theo allergies, exclusions, diet pattern, enabled tradition và periodic date rules.
- Calorie tolerance ±15%, chỉ nới ±20% kèm warning.
- Ingredient overlap/behavior chỉ scoring; không override hard constraints.
- Không lặp nếu pool đủ; thiếu pool lặp tối đa hai lần; không có candidate thì slot UNFILLED.
- Regenerate tạo version mới, không overwrite; swap giữ hard constraints và calorie rules.
- Shopping list cộng canonical ingredients chỉ khi unit compatible/conversion chắc chắn.
- Micronutrient warning chỉ dựa dữ liệu thực có quality flag.
- Ownership, idempotency và deterministic seeded mode.

## Acceptance

- Constraints, distribution, repeat fallback, periodic dates, swap và shopping totals được triển khai deterministic.
- Xử lý đầy đủ incomplete profile, no candidate, allergy never relaxed, ownership/versioning.
- Response trả warnings/reason codes có schema rõ.
- OpenAPI/integration guide/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không gọi LLM để chọn món. AI explanation nếu chưa có Phase 11 phải dùng deterministic template hoặc để extension field nullable theo contract.

Commit duy nhất:

```text
feat(meal-plans): implement weekly planner
```

Final báo hash, algorithm/fallback, endpoint READY và gate.
