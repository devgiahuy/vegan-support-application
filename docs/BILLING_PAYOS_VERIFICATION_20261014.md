# payOS conversion verification — 2026-10-14

User selected payOS and configured merchant keys locally. New purchases exclusively use payOS; VNPAY/local checkout routes and configuration are removed. Existing orders/balances retain their original provider. payOS has no sandbox and its checkout transfers real money; app production rollout remains disabled.

## Verified

- Backend lint/typecheck/build and served/generated OpenAPI pass. OpenAPI contains payOS webhook/return and no retired checkout/IPN routes (176 operations).
- Additive Mongo schema/partial unique provider-reference/link indexes provisioned; isolated seed is idempotent and existing demo history is preserved.
- Existing billing acceptance script passes with controlled SDK transport, no external request: signed create/query/webhook, owner/intent, ten webhook replays, wrong amount/link/currency/signature, insufficient/extra payments, unknown signed registration sample, provider failure, 30-second cooldown and same-code ambiguous creation/recovery.
- Existing auth/refresh, free-first chat/SSE/replay, concurrent last-credit/slot, full-failure refund, bounded scan retry, stale-worker fencing and Pantry confirmation checks also pass.
- Web scoped lint/typecheck, 602 tests/50 files and Next build pass. Mobile typecheck/lint, 6 billing mapper tests, 64-route web export and Android Hermes export pass.
- Browser web/mobile show payOS and real-transfer disclosure, disabled buy without keys and read-only legacy history. Demo balances preserved: chat 100, fridge 53, receipts 13, Pantry capacity 70. Mobile viewport/content width both 390px; saved screenshots in this UI branch's `docs/billing-evidence/`.

## Open acceptance gates

- Actual payment/provider settlement notification and native-device acceptance remain unverified. A user-requested ngrok HTTPS tunnel now forwards to the isolated demo API; its origin is configured locally in BILLING_PUBLIC_URL and BILLING_DEMO_PUBLIC_URL.
- Mocked SDK acceptance is not payOS sandbox. No bank transfer, merchant-account registration or deployment was performed.
- Full frontend lint still has previously documented baseline findings; changed billing scope is clean. Existing assistant animation remains outside scope without manual suppression.

Setup: [BILLING_DEMO.md](BILLING_DEMO.md). Backend branch `codex/sandbox-billing`; clients on `codex/sandbox-billing-ui`.

## Credentialed local retest — 17:03 ICT

- Restarted the isolated demo API after the user configured all three keys; no secrets were printed or committed. Catalog purchases are enabled.
- Created one actual payOS link for the 19,000 VND / ten fridge scans package through the web UI. Hosted payOS checkout rendered VietQR and the correct amount. No bank transfer was performed.
- Back in the application, signed provider reconciliation returned PENDING. The web button displayed loading, a result timestamp and the pending explanation; a repeat within 30 seconds displayed the cooldown message.
- Mobile web loaded the same order and balances, displayed the shared reconciliation cooldown, and returned the timestamped PENDING explanation after waiting. Balances stayed chat 100, fridge 53, receipts 13, Pantry 0/70; no grant was issued for the unpaid order.
- Reran the isolated billing acceptance command successfully, including signed transport fixtures, idempotency, quota/capacity and auth scenarios. This command mocks payOS transport; the credentialed checkout/query above were separate live requests.
- No source code changed during this retest. Earlier lint/typecheck/build and client test results above were not rerun. Browser evidence is saved in the UI worktree's docs/billing-evidence/ directory.

## Live channel-confirmation compatibility fix

The actual payOS verification request reached the tunnel but returned 400 because it omitted success. Its data/signature verified successfully with the configured SDK/checksum key. The schema now accepts optional boolean success; the SDK adapter supplies a false envelope hint when absent, leaving signed data unchanged. Settlement never trusts this unsigned field. Existing acceptance adds the missing-success sample, invalid-signature and invalid-field-type cases with unchanged balances.

- Replayed the original captured payOS sample through the public HTTPS tunnel: 200, success=true. Replayed with a tampered signature: 400, BILLING_SIGNATURE_INVALID. No blanket webhook bypass or real bank transfer.
- Backend lint, typecheck, build, OpenAPI generation and extended billing acceptance all pass. Generated frontend contract catalogs are synchronized. No persistence or UI consumer change.
- API restarted with the fix; the user can retry saving the same webhook URL on the payOS channel. The agent did not overwrite merchant-channel configuration through confirm-webhook.
