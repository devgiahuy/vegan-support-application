# payOS billing and usage allowances

Updated: 2026-10-14. Backend: `codex/sandbox-billing`; web/mobile clients: `codex/sandbox-billing-ui` in a separate worktree.

## Scope and payment mode

New purchases use payOS exclusively. Hosted checkout offers bank transfer/QR with integer VND prices. **payOS has no sandbox: transfers are real money, including when checkout is opened from this development application.** Credentialed checkout and PENDING reconciliation were verified on 2026-10-14; no bank transfer was performed. See [verification record](BILLING_PAYOS_VERIFICATION_20261014.md).

One-time packages retain the existing snapshotted credits/capacity. Default trial: three fridge/receipt jobs each and Pantry baseline 20 items. Purchased demo allowances accumulate without expiry. Free daily chat is consumed first; one bounded successful/partially successful scan job consumes one credit; total failure releases it. Results still require confirmation. Package purchases do not change roles or media storage.

App production rollout remains disabled by configuration; subscriptions, invoices, automatic refunds, media purchases and app-store distribution remain deferred. Historical local/VNPAY orders retain their provider identity and balances, but cannot resume checkout or receive new settlements. Their routes have been removed.

## Run without credentials

Dependencies: Node 22+, npm, Docker/Mongo replica set. Backend commands run in the primary checkout; web/mobile commands run in the UI checkout (`git worktree list`).

```bash
cd backend
npm ci
docker compose up -d mongodb mongo-init
npm run prisma:generate
npm run billing:demo
```

The helper provisions/seeds isolated `vegan_billing_demo` on localhost:27018 and starts API 4100. It opts in to existing allowance enforcement but only enables catalog purchases when all payOS keys exist. With no credentials the page displays balances/history and disabled purchase actions; there is no simulated checkout fallback.

Public local login: `billing-demo@example.test` / `DemoBilling2026!`.

Web in UI worktree:

```bash
cd frontend
npm ci
BACKEND_API_URL=http://localhost:4100/api/v1 NEXT_PUBLIC_API_URL=http://localhost:3100/api/v1 npm run dev -- --port 3100
```

Open http://localhost:3100/billing.

Mobile web in UI worktree:

```bash
cd mobile
npm ci
EXPO_PUBLIC_API_URL=http://127.0.0.1:4100/api/v1 EXPO_PUBLIC_ENABLE_DEV_SCANS=true EXPO_PUBLIC_SCAN_PROVIDER=fake npx expo start --web --port 8090
```

Open http://127.0.0.1:8090/billing, or Profile → Gói tiện ích. Keep mobile UI/API on 127.0.0.1 and web on localhost; different ports alone do not isolate refresh cookies. Native requires LAN/API URLs and appropriate allowed development origins. Fake AI/scan fixtures are independent of payOS and do not establish image-recognition quality.

## Configure payOS

Create/verify a payOS account and payment channel at https://my.payos.vn. Put the channel's values in untracked `backend/.env`:

```dotenv
BILLING_PROVIDER=payos
PAYOS_CLIENT_ID=<channel-client-id>
PAYOS_API_KEY=<channel-api-key>
PAYOS_CHECKSUM_KEY=<channel-checksum-key>
```

Remove old `BILLING_PROVIDER=sandbox|vnpay` and VNPAY settings. Blank/missing keys leave purchases unavailable. Regular backend requires `BILLING_ENABLED=true`; the isolated demo helper sets it. Configure a public HTTPS API via `BILLING_DEMO_PUBLIC_URL` (or `BILLING_PUBLIC_URL` in regular startup), and the app return via `BILLING_DEMO_RETURN_URL` / `BILLING_RETURN_URL`.

Register the channel webhook URL `https://<api-host>/api/v1/billing/payos/webhook` in payOS. A signed registration sample is acknowledged without a grant. Native opens the system browser; close it to return to the app and refresh account state. Web returns to its selected order; mobile web's default checkout return is the web page, so reopen the mobile preview afterward. For mobile-only preview set the helper return URL to http://127.0.0.1:8090/billing.

The public URL lets payOS call your backend after payment. Localhost is accessible only on your machine; a development HTTPS tunnel forwards public requests to port 4100. For the demo helper set BILLING_DEMO_PUBLIC_URL to the tunnel origin, restart the API and register that origin plus /api/v1/billing/payos/webhook on the payment channel. Do not use the example placeholder as an actual URL. The manual “Kiểm tra thanh toán” action can query payOS from a local backend without a public webhook.

Docker ngrok setup (2026-10-14): see the [backend tunnel guide](../backend/README.md#https-webhook-tunnel-with-ngrok-2026-10-14).
For this host-based demo, set `NGROK_AUTHTOKEN`, optionally `NGROK_URL`, and
`NGROK_UPSTREAM=http://host.docker.internal:4100` in `backend/.env`, then run
`docker compose --profile webhook up -d --no-deps ngrok` from `backend/`.
Inspect the HTTPS origin at `http://localhost:4040`; pass it as `BILLING_DEMO_PUBLIC_URL`
when starting the demo helper. The regular container backend instead uses `BILLING_PUBLIC_URL`
and the default upstream `http://backend:4000`.

The live payOS channel-confirmation sample can omit the unsigned success envelope field. The endpoint accepts that shape, verifies the original data/signature with the SDK and acknowledges an unknown sample without granting benefits. Do not return blanket 200 for unsigned or invalid payloads to bypass channel verification.

Do not put merchant keys in frontend/mobile environment or commit them. The agent does not create a merchant account or perform a real payment.

## Settlement and retry behavior

Backend uses official `@payos/node@2.0.5` for signed create/get/webhook. A distinct persisted numeric provider code prevents duplicate links on retry. Checkout descriptions use ≤9 characters; links expire after 15 minutes by default. Recovery after a timed-out create queries the same reference.

Signed webhook data maps the local order, then an authenticated signed payOS query confirms amount/reference/link before granting. UNDERPAID/PROCESSING remain PENDING; PAID only grants after sufficient money is received. Excess transferred money does not increase benefits or trigger an automatic refund. Late verified full payment can grant an unfulfilled expired/cancelled order once. PAID never downgrades.

Browser return/cancel parameters are ignored for settlement. “Kiểm tra thanh toán” queries payOS with a 30-second cooldown and visible result/error. It can recover an unfinished checkout after a response/persistence failure using the same provider code; no duplicate application order is allocated. Historic providers are read-only.

## Mongo schema migration and verification

Run `npm run prisma:generate`, then `npm run prisma:push`. This applies native validators and partial unique indexes for optional provider order code/link ID; old documents need no conversion. Existing catalog seeding preserves configured prices and order snapshots. Never rewrite old provider identities into payOS or grant migration credits.

Internal acceptance uses an isolated database and controlled SDK transport, not payOS sandbox:

```bash
cd backend
DATABASE_URL='mongodb://localhost:27018/vegan_billing_payos_20261014?replicaSet=rs0&directConnection=true' npm run prisma:push
DATABASE_URL='mongodb://localhost:27018/vegan_billing_payos_20261014?replicaSet=rs0&directConnection=true' npm run seed
DATABASE_URL='mongodb://localhost:27018/vegan_billing_payos_20261014?replicaSet=rs0&directConnection=true' npm run billing:acceptance
```

Acceptance leaves disposable fixtures in that isolated database. It verifies owner/idempotency, signed payOS SDK create/query/webhook, partial/excess payments, replay, unknown samples, provider/signature errors, cooldown, ambiguous create recovery, historical records and existing quota/capacity/auth behavior. Credentialed hosted checkout and PENDING query passed separately on 2026-10-14; bank transfer/webhook delivery and native-device acceptance remain manual gates.

Maintenance: `BILLING_ENABLED=true npm run billing:cleanup` recovers stale usage reservations; `BILLING_ENABLED=true npm run billing:reconcile` queries unfulfilled payOS orders from the last 24 hours when keys are configured.

References: [payOS API](https://payos.vn/docs/api/), [no sandbox](https://payos.vn/docs/moi-truong-test/), [Node SDK](https://payos.vn/docs/sdks/back-end/node/), [return semantics](https://payos.vn/docs/du-lieu-tra-ve/return-url/). Previous VNPAY/local screenshots and [BILLING_RETEST_20261014.md](BILLING_RETEST_20261014.md) are historical evidence, not payOS acceptance.
