# Billing retest — 2026-10-14

## Findings and fix

At the start of this session MongoDB was healthy, but demo API/web/mobile processes were not running. They were restarted using the dedicated billing database and explicit API URLs.

The original historical failure response is unavailable. It is not established that checkout expiry caused that failure. A reproducible usability issue was found: a valid expired local checkout token was classified as `BILLING_SIGNATURE_INVALID`/403 and browsers received raw JSON. The backend now distinguishes expiry as `BILLING_CHECKOUT_EXPIRED`/410. Browser GET and POST show a readable return/new-order page; API callers receive the typed error. Tampered signatures remain 403. Expired requests cannot grant benefits; verified VNPAY late-success settlement rules are unchanged.

## Verification

- The new expiry acceptance failed on the old implementation (403 instead of 410), then passed after the correction.
- Extended billing acceptance passed: expired access token, six consecutive refresh rotations with billing access, expiry/replacement order, duplicate notifications, ownership, amount validation, late success, free/paid chat SSE/replay, cross-midnight/stale workers, final-credit and final-slot races, Pantry insertion paths, scan failure/partial/empty/retry/recovery, signed VNPAY protocol fixtures and production guards.
- Backend lint, typecheck, build, generated OpenAPI and synchronized API catalogs passed. No persistence schema changed in this retest; no backend test infrastructure was introduced.
- Real browser session used a temporary 60-second access TTL. Logs show a 401 after expiry followed by refresh 200; the UI then created and paid a new order, adding fridge credits from 33 to 43. Reload retained 43 and the paid state without another grant.
- Web/mobile simultaneous reload retained authentication and identical balances. Mobile checkout opened successfully; cancellation returned to the selected order without extra benefits. Expiry recovery and its return link were verified in the browser.
- UI-branch frontend typecheck, all 600 tests across 50 files, Next build and scoped billing/auth lint passed. Mobile typecheck/lint, three billing mapper tests, web export (64 routes) and Android Hermes export passed. Native device, real VNPAY merchant and live-image quality acceptance remain open.
- After session-expiry verification, the running demo was restored to the normal 900-second access TTL. Shared `.env` files were not edited.

## Branch separation

The primary checkout remains on `codex/sandbox-billing`. Relative to the original `dev` baseline, `frontend/src`, `frontend/AGENTS.md` and `mobile` have no runtime-code changes. Required frontend API contract/catalog documentation remains with backend changes.

The attached `codex/sandbox-billing-ui` worktree retains the web/mobile implementation and includes the backend correction and backend-only branch in its ancestry, so later merging the UI branch will restore the clients normally. Its checkout is `/Users/thienel/.codex/worktrees/sandbox-billing-ui/vegan-support-application` on this workstation.

Billing UI is implemented for the development/demo scope: authenticated catalog, one-time purchases, pending/paid/cancelled/failed/expired states, checkout return, owner history/pagination, allowances/held balances/ledger, entry points, business errors and loading/error/empty/success handling. This is not a production-payment or physical-device completion claim.

Setup: [BILLING_DEMO.md](BILLING_DEMO.md). Screenshot evidence is retained on the UI branch under `docs/billing-evidence/`.
