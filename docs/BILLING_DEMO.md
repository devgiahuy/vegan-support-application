# Payment and allowances demo

Updated: 2026-10-14. Backend branch: `codex/sandbox-billing`. Web/mobile UI branch: `codex/sandbox-billing-ui`, created from the backend branch at its original billing commit. The UI worktree runs the clients while the primary checkout remains for backend work.

## What is implemented

One-time packages for chat, fridge jobs, receipt jobs and Pantry capacity. Default trial: three jobs of each scan type; Pantry baseline: 20 undeleted items. Existing daily chat quotas remain unchanged. Demo packages are cumulative and do not expire. Prices are sample catalog data.

VNPAY Sandbox is the external adapter. The local sandbox is explicitly simulated and needs no registration. Neither performs production billing; enabling billing in production fails configuration validation. No subscriptions, real-money refunds, storage upgrades or role changes are implemented.

## Quick start without merchant registration

Prerequisites: Node 22+, npm, Docker, dependencies installed in backend/frontend/mobile. Commands run from the indicated directory.

Run backend commands in the primary checkout. Run all web/mobile commands below in the separate `codex/sandbox-billing-ui` checkout (locate it with `git worktree list`). The backend branch has no `/billing` client route after the user-requested split. The attached UI checkout is `/Users/thienel/.codex/worktrees/sandbox-billing-ui/vegan-support-application` on this workstation; relative `cd frontend` / `cd mobile` below refer to that checkout.

Backend:

```bash
cd backend
npm ci
docker compose up -d mongodb mongo-init
npm run prisma:generate
npm run billing:demo
```

The helper provisions and seeds a separate `vegan_billing_demo` database, then starts API port 4100. It never targets the existing application database. This workspace's MongoDB host port is 27018; if your MongoDB uses another port, set `BILLING_DEMO_DATABASE_URL=mongodb://localhost:27017/vegan_billing_demo?replicaSet=rs0&directConnection=true`.

Web, in a second terminal:

```bash
cd frontend
npm ci
BACKEND_API_URL=http://localhost:4100/api/v1 NEXT_PUBLIC_API_URL=http://localhost:3100/api/v1 npm run dev -- --port 3100
```

Open http://localhost:3100/billing. Demo login: `billing-demo@example.test` / `DemoBilling2026!`. These public credentials are local demonstration data only.

Mobile development, in a third terminal:

```bash
cd mobile
npm ci
EXPO_PUBLIC_API_URL=http://127.0.0.1:4100/api/v1 EXPO_PUBLIC_ENABLE_DEV_SCANS=true EXPO_PUBLIC_SCAN_PROVIDER=fake npx expo start --web --port 8090
```

Open http://127.0.0.1:8090/billing or enter through Profile → Gói tiện ích. Use the same demo login. Keep web on `localhost` and mobile web plus its API on `127.0.0.1`: cookies are scoped by hostname, not port. Using `localhost` for both clients can make concurrent refresh rotations reuse the same cookie and revoke the session. Do not open mobile via Expo's printed localhost URL for this two-client demo. Native devices require the computer's LAN IP in the mobile API URL and `BILLING_DEMO_PUBLIC_URL`; allow the applicable web development origin via `BILLING_DEMO_ORIGINS`. Do not expose the no-auth local MongoDB service publicly.

Expo web opens checkout in the same tab to avoid popup blocking. The default backend returns to the web billing page on port 3100; reopen http://127.0.0.1:8090/billing to continue the mobile web preview. A mobile-only demo can set `BILLING_DEMO_RETURN_URL=http://127.0.0.1:8090/billing`. Native uses the system browser; close it to return to the application, which refreshes balances on focus.

## Review scenarios

Checkout links expire after 15 minutes by default. After expiry the server returns HTTP 410 / `BILLING_CHECKOUT_EXPIRED`; browsers receive a readable recovery page with a return link. Create a new order from the catalog instead of reusing an old checkout URL. Tampered tokens still return 403 and no expired request grants benefits. This intentional order expiry is separate from access-token expiry, which refreshes the signed-in session.

1. Buy the combo and choose “Mô phỏng thanh toán thành công”. Return to the selected order; chat +100, fridge +10, receipts +10 and Pantry +50 appear.
2. Reload the result page: benefits stay unchanged. Repeat a success notification: no extra grant.
3. Create another order and cancel/fail it: no benefits are granted.
4. Open mobile with the same account: its balance and history match web.
5. Use free daily chat first, then paid credits; provider failure/fallback/replay does not spend another credit.
6. One scan job uses one credit after any successful image; total failure releases the credit. Retries of a charged job are free; default maximum three processing attempts. Results still need confirmation.
7. At Pantry capacity, manual creation and both confirmations fail atomically. Existing data remains available; deletion/merge frees space.

Fake AI/scan providers in this helper are deterministic development simulations. They do not establish real recognition accuracy. Camera/upload still uses the existing storage/Cloudinary flow and requires its configured credentials; billing acceptance uses owned seeded fixtures.

## Switch to external VNPAY Sandbox

Register at https://sandbox.vnpayment.vn/devreg/; integration credentials are sent by email. Registration/CAPTCHA and external merchant credentials were not performed or obtained by the agent.

Start the helper with `BILLING_PROVIDER=vnpay VNPAY_TMN_CODE=<merchant-code> VNPAY_HASH_SECRET=<merchant-secret> npm run billing:demo`. Configure a public HTTPS API URL for `BILLING_DEMO_PUBLIC_URL` and an accessible web return URL for `BILLING_DEMO_RETURN_URL`. Register IPN URL `https://<api-host>/api/v1/billing/vnpay/ipn`. Frontend/native clients must target that API.

Checkout uses VNPAY's sandbox endpoint, integer VND ×100 and GMT+7 timestamps. IPN validates HMAC-SHA512, merchant, reference, amount and both success codes before an atomic grant. Browser return verifies the payload and redirects only. Querydr uses the original order date and its distinct request/response pipe signatures. “Kiểm tra thanh toán” reconciles with a five-minute cooldown; network/no-final-result errors keep the order unconfirmed.

References: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html and https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html.

## Persistence and maintenance

Use `npm run prisma:push`, not raw Prisma db push/Migrate. It installs new collection validators/indexes and adds missing queued timestamps from original creation dates without overwriting existing values. Catalog seed is idempotent and preserves existing configured products and snapshotted order benefits.

`BILLING_ENABLED=true npm run billing:cleanup` recovers expired usage leases, fencing stale attempts first. Owned job/balance reads also recover that owner's stale jobs. `BILLING_ENABLED=true BILLING_PROVIDER=vnpay npm run billing:reconcile` checks unconfirmed VNPAY orders from the last 24 hours; use deployment scheduling for recurring maintenance. Production billing remains intentionally disabled.

## Verification

Latest repeat verification and branch/UI status: [BILLING_RETEST_20261014.md](BILLING_RETEST_20261014.md).

Backend acceptance runs only against a separate database whose name contains `billing_`:

```bash
cd backend
DATABASE_URL='mongodb://localhost:27018/vegan_billing_20261013?replicaSet=rs0&directConnection=true' npm run prisma:push
DATABASE_URL='mongodb://localhost:27018/vegan_billing_20261013?replicaSet=rs0&directConnection=true' npm run seed
DATABASE_URL='mongodb://localhost:27018/vegan_billing_20261013?replicaSet=rs0&directConnection=true' npm run billing:acceptance
```

The script leaves fixtures in this isolated database for inspection. It exercises HTTP checkout/auth/SSE and transactional provider/quota/capacity cases. External VNPAY sandbox and native camera/payment device acceptance require separate credentials/devices; signed protocol fixtures are not claimed as external end-to-end validation.

### Verified on 2026-10-13

- Mongo schema/validators/indexes/backfill and seed succeeded in separate demo/acceptance databases; the shared application database was not changed.
- Backend lint, typecheck, build, OpenAPI generation and billing acceptance passed. Existing vision/receipt acceptance also passed with fake providers.
- Swagger sync: 178 endpoints, 40 groups, 154 schemas. Frontend typecheck, 600 tests across 50 files and Next build passed. Changed frontend consumers: zero lint errors, three existing warnings. Full frontend lint still reports 89 baseline errors and 347 warnings outside this feature.
- Mobile typecheck/lint, three billing mapper tests, web export (64 routes) and Android Hermes export passed with the demo API configured. No physical-device or iOS build acceptance is claimed.
- Browser: demo login, successful combo purchase, cancellation and failure with no extra grants, return/reload session restoration preserving the selected order, mobile Profile entry, mobile checkout and shared balances/history passed. Mobile web has no horizontal overflow at 390px.
- Demo account ends with 100 purchased chat credits, 13 fridge jobs, 13 receipt jobs and 70 Pantry slots (three scan trials plus purchased benefits). The paid, cancelled and failed orders remain inspectable.

Screenshots are retained on the UI branch under `docs/billing-evidence/web-paid.png` and `docs/billing-evidence/mobile-390.png`. Historical 2026-10-13 balances above describe that run; later demo purchases may increase them.
