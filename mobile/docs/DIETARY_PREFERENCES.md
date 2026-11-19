# Mobile daily food allowances

Updated: 2026-11-19. Implemented; authenticated native E2E pending tooling.

The Expo client saves `allowEggs`, `allowDairy`, `allowHoney`, `allowFivePungent` with policyVersion=1 and expectedDietaryRevision. True means allowed every day. Profile diet pattern, tradition and practice-calendar setup/route are removed. Allergies and canonical ingredient exclusions remain independent hard constraints. Failed loading must not save a fabricated all-false profile or silently drop unresolved allergy selections.

Before save, POST /users/me/diet-preferences/impact-preview assesses the full draft. Both actions remain available: save then preview/apply replacements, or save and keep existing meals with persistent warnings. `impactUnavailable` means profile saved but assessment unavailable, with retry; it is distinct from no impact. Plan/program list/detail and affected meal badges use backend compatibility. Profile and repair mutations invalidate dietary-dependent caches, including analysis and shopping state.

The diet-repair route explicitly batches at most 20 plan IDs per proposal. It preserves unresolved/per-plan outcomes, supports conflicts/retry and never labels a partial repair as complete. Confirmed programs require a linked DRAFT revision, review and explicit confirmation; original source links remain visible. Pantry and purchases are not automatically edited.

Verification: TypeScript, Expo lint and 166 tests pass; iOS export at /tmp/veggie-mobile-food-ios succeeded. Native guest/login gate rendered without runtime errors. Authenticated native iOS/Android E2E and web↔native UI checks were not run: full Simulator.app GUI/native driver and Android adb/emulator are unavailable. These are explicit verification limits; export and responsive web are not native E2E proof.

Start the backend with the new Mongo schema and seed before `npm start`; configure the mobile API base URL for the target device's access to that backend. See [full verification report](../../docs/DIETARY_PREFERENCES_VERIFICATION.md) and [backend contract](../../frontend/docs/BACKEND_INTEGRATION.md).

## Device Hub login recovery — 2026-11-19

The default development backend/MongoDB were stopped, mobile had no `.env`, and the previously opened app bundle did not call the new ngrok tunnel. After restoring services, default-db login returned 200 but /users/me returned 500 with the old schema. The local `vegan_support` dev database was archived to `/tmp/vegan-support-before-food-preferences-20261119.archive.gz`, recreated with the 112-collection schema and reseeded using the existing configured seed credentials, as authorized for disposable old dev data. No legacy mapper was added.

Mobile `.env` (ignored) now points to the active HTTPS ngrok backend with `/api/v1`; Metro restarted with `npx expo start --tunnel --clear`. A new Expo tunnel is opened in Device Hub so the bundle contains the current API URL. Public-ngrok login and /users/me return 200 for Member and organization Contributor, including all four allowances. Login UI now distinguishes transport failure and timeout from invalid credentials. Mobile typecheck/lint/166 tests pass. Backend code and auth contract are unchanged.

Keep MongoDB, backend, backend ngrok and Metro running while testing. On tunnel replacement, update `EXPO_PUBLIC_API_URL` in mobile/.env and restart Metro/fully reload the app. An already loaded JS bundle continues using its embedded old URL. Device Hub is available through the native computer-control surface in this session; earlier native-driver limitations describe the previous verification attempt.

Device Hub follow-up result: the native iPhone16/iOS26.1 app was opened from the new Expo tunnel, signed in through the ngrok backend using a temporary QA Member, and displayed the four native food switches and authenticated profile. Captured ngrok request statuses were login200, users/me200 and allergens200. The QA session was signed out, its temporary account/direct owned records removed, and the login screen restored with expert@example.com ready for the user's own password. No password was saved to the OS. Backend/MongoDB/ngrok/Metro remain running for the user. This verifies native iOS login/profile, while full native impact/repair and Android coverage remain unrun.
