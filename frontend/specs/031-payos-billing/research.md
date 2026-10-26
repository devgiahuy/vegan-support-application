# payOS decisions — 2026-10-14

- Decision: use official SDK 2.0.5 for create/get and async webhook verification. Rationale: response signatures and array/null canonicalization differ from create's five-field signature. Alternative: manual HMAC rejected as unnecessary protocol duplication.
- Decision: provider order code is a persisted positive safe-integer string, unique; description ≤9 ASCII characters; expiresAt converted to Unix seconds. Provider reference is distinct from application UUID.
- Decision: webhook verifies signed data, maps known order then queries payment request. `PAID` plus amountPaid ≥ snapshotted amount grants once; UNDERPAID/PROCESSING stay pending. Excess money does not change benefits or trigger automatic refunds. Signed unknown samples ACK without grants; invalid signatures reject.
- Decision: no runtime simulation/VNPAY fallback. Historical records remain untouched. Missing credentials disable checkout while preserving readable usage/history.
- Sources: [API](https://payos.vn/docs/api/), [SDK](https://github.com/payOSHQ/payos-lib-node), [return](https://payos.vn/docs/du-lieu-tra-ve/return-url/), [no sandbox](https://payos.vn/docs/moi-truong-test/).
