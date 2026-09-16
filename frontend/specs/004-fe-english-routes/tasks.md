# Tasks: FE English Routes Rename

**Input**: Design documents from `/specs/004-fe-english-routes/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks requested in spec — verification via `tsc`, `vitest`, `next build`, grep regression and manual quickstart validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, docs in `frontend/docs/` and `frontend/specs/`
- All commands run with workdir `frontend/`, shell PowerShell, OS Windows

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline snapshot before any rename, so regressions are provable

- [X] T001 Record route baseline by listing `frontend/src/app` page files and counting old-URL references with grep in `frontend/src`
- [X] T002 [P] Verify clean git tree and tooling (`git status`, `node --version`) for work in `frontend/specs/004-fe-english-routes`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New English route folders + 308 redirect table — MUST complete before ANY link update

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Add `redirects()` with 20 permanent (308) old→new rules, static rules before dynamic ones, in `frontend/next.config.ts`
- [X] T004 [P] Git-move site route folders to English names in `frontend/src/app/(site)` (cong-thuc→recipes, bai-viet→articles with tao-moi→new and chinh-sua→edit, video→videos, dang-video→videos/new, dang-cong-thuc→recipes/new, danh-muc→categories, ban-do→restaurants, tim-kiem→search, ho-so→profile, ke-hoach-bua-an→meal-plans with da-luu→saved, tro-ly-ai→assistant)
- [X] T005 [P] Git-move `frontend/src/app/(auth)/xac-thuc-otp` to `frontend/src/app/(auth)/verify-otp` and delete alias page `frontend/src/app/(site)/video/upload/page.tsx`

**Checkpoint**: Foundation ready — `frontend/src/app` contains only English slugs; user story implementation can now begin

---

## Phase 3: User Story 1 - Truy cập trang bằng URL tiếng Anh (Priority: P1) ⭐ MVP

**Goal**: Every main page renders under its new English URL with all internal navigation pointing at English URLs and VI labels unchanged

**Independent Test**: Open each new URL (`/recipes`, `/articles`, `/videos`, `/categories`, `/restaurants`, `/search`, `/profile`, `/meal-plans`, `/assistant`) as guest and logged-in user; content matches the old URL; every header/footer/breadcrumb/CTA click lands on an English URL

### Implementation for User Story 1

- [X] T006 [US1] Update nav items, search form action, AI button and user dropdown to English URLs in `frontend/src/components/layout/site-header.tsx`
- [X] T007 [P] [US1] Update explore column and contribute link to English URLs in `frontend/src/components/layout/site-footer.tsx`
- [X] T008 [P] [US1] Update all CTA and contextual links to English URLs in `frontend/src/app/(site)/page.tsx`
- [X] T009 [P] [US1] Update card, detail breadcrumb and internal links to `/recipes` and `/recipes/[id]` in `frontend/src/features/recipe/components/recipe-card.tsx` and `frontend/src/features/recipe/components/recipe-detail-view.tsx`
- [X] T010 [P] [US1] Update card links, detail breadcrumb, editor `router.push` targets to `/articles`, `/articles/new`, `/articles/[id]`, `/articles/[id]/edit`, `/profile?tab=posts` in `frontend/src/features/post/components/post-card.tsx`, `frontend/src/features/post/components/post-detail-view.tsx` and `frontend/src/features/post/components/post-editor-form.tsx`
- [X] T011 [P] [US1] Update list, detail and create links to `/videos`, `/videos/[id]`, `/videos/new` in `frontend/src/app/(site)/videos/page.tsx`, `frontend/src/app/(site)/videos/[id]/page.tsx` and `frontend/src/app/(site)/videos/new/page.tsx`
- [X] T012 [P] [US1] Update map/list links to `/restaurants` and `/restaurants/[id]` in `frontend/src/features/restaurant/components/restaurant-detail-view.tsx` and `frontend/src/features/restaurant/components/restaurant-detail-sheet.tsx`, and filter links to `/categories?type=` in `frontend/src/features/category/components/category-tree.tsx`
- [X] T013 [P] [US1] Update internal links to English URLs in `frontend/src/app/(site)/profile/page.tsx`, `frontend/src/app/(site)/meal-plans/page.tsx`, `frontend/src/app/(site)/meal-plans/saved/page.tsx`, `frontend/src/app/(site)/search/page.tsx` and `frontend/src/app/(site)/assistant/page.tsx`
- [X] T014 [US1] Align auth guards with English URLs in `frontend/src/middleware.ts` and `frontend/src/lib/axios.ts`, and verify open-redirect guard still holds in `frontend/src/app/(auth)/login/page.tsx`
- [X] T015 [P] [US1] Update remaining profile link to `/profile` in `frontend/src/components/shared/why-recommended-dialog.tsx` and any leftover old-URL strings found by grep in `frontend/src`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (all new URLs render, all nav is English, VI labels unchanged)

---

## Phase 4: User Story 2 - URL tiếng Việt cũ không gây lỗi (Priority: P1)

**Goal**: Every old Vietnamese URL 308-redirects to its English counterpart preserving params/query/hash; no duplicate content; friendly 404 for invalid URLs

**Independent Test**: Open each old URL from the contract (including `/danh-muc?type=RECIPE_GROUP`, `/tim-kiem?q=chay`, `/cong-thuc/123`) and confirm 308 to the English URL with query intact and correct content; open a malformed URL and confirm friendly VI 404

### Implementation for User Story 2

- [X] T016 [US2] Verify redirect order and 308 behaviour for all 20 rules in `frontend/next.config.ts` via dev server, including query preservation (`?type=`, `?q=`, `?tab=posts`) and hash
- [X] T017 [P] [US2] Switch share/copy-link and canonical metadata to `/articles/[id]` in `frontend/src/features/post/components/post-card.tsx` and article/recipe detail views in `frontend/src/app/(site)/articles/[id]/page.tsx` and `frontend/src/app/(site)/recipes/[id]/page.tsx`
- [X] T018 [P] [US2] Verify friendly Vietnamese 404 with home link for unknown URLs in `frontend/src/app/not-found.tsx`
- [X] T019 [US2] Confirm single canonical create-video URL by verifying `/video/upload` and `/dang-video` both 308 to `/videos/new` with no redirect chain, per `frontend/next.config.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (new URLs render; old URLs never 404 when valid)

---

## Phase 5: User Story 3 - Developer tra cứu FE/BE nhanh (Priority: P2)

**Goal**: Docs and module mapping use English route names matching backend tags so a new dev finds any FE page from a BE function name without a VI–EN translation table

**Independent Test**: Give a new dev a BE endpoint (e.g. `GET /restaurants/nearby`) and confirm they locate `/restaurants` page and its source files in under 2 minutes using only docs and filename search

### Implementation for User Story 3

- [X] T020 [P] [US3] Update frontend module mapping, route examples and changelog to English URLs in `frontend/docs/BACKEND_INTEGRATION.md`
- [X] T021 [P] [US3] Update route examples in the orphan-page rule to English URLs in `frontend/docs/ARCHITECTURE.md`
- [X] T022 [US3] Run the 5-sample-function lookup acceptance (restaurant, meal plan, assistant, article, category) against `frontend/docs/BACKEND_INTEGRATION.md` and `frontend/src/app`, and fix any unfindable mapping

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression proof, project-required logs, and final gates

- [X] T023 Prove zero old-URL references by re-running the old-slug grep over `frontend/src` until it returns 0 matches
- [X] T024 [P] Run typecheck with no new errors via `node node_modules/typescript/bin/tsc --noEmit` in `frontend/` (config `frontend/tsconfig.json`)
- [X] T025 [P] Run unit tests via `npm test` in `frontend/` (`frontend/vitest.config.ts`)
- [X] T026 Run production build via `npm run build` in `frontend/` (`frontend/next.config.ts`)
- [X] T027 Execute the full manual validation table in `frontend/specs/004-fe-english-routes/quickstart.md` on desktop and mobile viewports
- [X] T028 Append PROGRESS entry and WORK-LOG entry for the rename in `frontend/docs/PROGRESS.md` and `frontend/docs/WORK-LOG.md` per ARCHITECTURE.md §7
- [X] T029 Run `git diff --check` in `frontend/` and review the final diff for accidental content or label changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and should land together as the MVP (US2 is the safety net for US1)
  - US3 (P2 docs) can proceed in parallel with US1/US2 verification once Foundation is done
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — shares `frontend/next.config.ts` with Foundation; independently testable via old URLs
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — docs only; independently testable via lookup exercise

### Within Each User Story

- Core route/file changes before link updates that reference them
- `frontend/next.config.ts` static rules before dynamic rules
- Story complete before moving to next priority
- No new tests requested in spec; verification tasks live in Phase 6

### Parallel Opportunities

- T002 can run alongside T001 (different concerns, no shared files)
- T003, T004, T005 can run in parallel (respectively `frontend/next.config.ts`, `frontend/src/app/(site)`, `frontend/src/app/(auth)` + upload page)
- Within US1: T007–T013 and T015 can run in parallel (different files); T006 (header) and T014 (middleware) coordinate only at the final nav check
- Within US2: T017 and T018 can run in parallel (different files)
- Within US3: T020 and T021 can run in parallel (different docs)
- T024 and T025 can run in parallel (typecheck vs unit tests)

---

## Parallel Example: User Story 1

```bash
# Launch all link-update tasks for User Story 1 together (different files, no dependencies):
Task: "Update explore column and contribute link in frontend/src/components/layout/site-footer.tsx"
Task: "Update CTA and contextual links in frontend/src/app/(site)/page.tsx"
Task: "Update card and breadcrumb links in frontend/src/features/recipe/components/recipe-card.tsx"
Task: "Update editor router.push targets in frontend/src/features/post/components/post-editor-form.tsx"
Task: "Update map/list links in frontend/src/features/restaurant/components/restaurant-detail-view.tsx"
```

## Parallel Example: Foundation

```bash
# Launch all foundational tasks together after Setup:
Task: "Add redirects() in frontend/next.config.ts"
Task: "Git-move site route folders in frontend/src/app/(site)"
Task: "Git-move auth OTP folder and delete upload alias page"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (baseline)
2. Complete Phase 2: Foundational (redirects + English folders — blocks everything)
3. Complete Phase 3: User Story 1 (new URLs + all links)
4. Complete Phase 4: User Story 2 (old-URL safety net + SEO)
5. **STOP and VALIDATE**: Test US1 + US2 independently per quickstart (new URLs render, old URLs 308, 0 grep matches)
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → foundation ready
2. Add US1 → test new-URL navigation independently → MVP core
3. Add US2 → test old-URL redirects independently → safe to ship
4. Add US3 → test dev lookup → docs complete
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (routes + links)
   - Developer B: User Story 2 (redirects + SEO/canonical)
   - Developer C: User Story 3 (docs)
3. Stories complete and integrate independently; converge in Phase 6 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- `frontend/src/common/constants/api-endpoints.ts` (BE API) is intentionally untouched — this feature renames FE page slugs only
- VI display labels stay unchanged — only URL slugs change
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
