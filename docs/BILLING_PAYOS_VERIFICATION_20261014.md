# payOS conversion verification — 2026-10-14

User selected payOS and will configure merchant keys later. New purchases exclusively use payOS; VNPAY/local checkout routes and configuration are removed. Existing orders/balances retain their original provider. payOS has no sandbox and its checkout transfers real money; app production rollout remains disabled.

## Verified

- Backend lint/typecheck/build and served/generated OpenAPI pass. OpenAPI contains payOS webhook/return and no retired checkout/IPN routes (176 operations).
- Additive Mongo schema/partial unique provider-reference/link indexes provisioned; isolated seed is idempotent and existing demo history is preserved.
- Existing billing acceptance script passes with controlled SDK transport, no external request: signed create/query/webhook, owner/intent, ten webhook replays, wrong amount/link/currency/signature, insufficient/extra payments, unknown signed registration sample, provider failure, 30-second cooldown and same-code ambiguous creation/recovery.
- Existing auth/refresh, free-first chat/SSE/replay, concurrent last-credit/slot, full-failure refund, bounded scan retry, stale-worker fencing and Pantry confirmation checks also pass.
- Web scoped lint/typecheck, 602 tests/50 files and Next build pass. Mobile typecheck/lint, 6 billing mapper tests, 64-route web export and Android Hermes export pass.
- Browser web/mobile show payOS and real-transfer disclosure, disabled buy without keys and read-only legacy history. Demo balances preserved: chat 100, fridge 53, receipts 13, Pantry capacity 70. Mobile viewport/content width both 390px; saved screenshots in this UI branch's `docs/billing-evidence/`.

## Open acceptance gates

- User configures PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY and a public HTTPS webhook URL. Credentialed hosted QR checkout, actual transfer/provider webhook delivery and native-device acceptance have not been run.
- Mocked SDK acceptance is not payOS sandbox. No real transaction, account registration or deployment was performed.
- Full frontend lint still has previously documented baseline findings; changed billing scope is clean. Existing assistant animation remains outside scope without manual suppression.

Setup: [BILLING_DEMO.md](BILLING_DEMO.md). Backend branch `codex/sandbox-billing`; clients on `codex/sandbox-billing-ui`.
