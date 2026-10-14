# Data model

- PaymentOrder adds nullable `providerOrderCode` (unique numeric string; positive safe integer), `providerLinkId` (unique string), `providerCheckoutUrl` (HTTPS pay.payos.vn URL). Nullable fields use partial unique Mongo indexes; legacy documents remain readable.
- New provider is `payos`; `sandbox`/`vnpay` remain historical strings only.
- Existing owner/intent uniqueness, VND snapshot, status and ledger/event dedup remain unchanged.
- PENDING → PAID/CANCELLED/FAILED/EXPIRED according to signed query. UNDERPAID/PROCESSING map to PENDING. Verified late PAID may supersede a terminal unfulfilled order once. PAID never downgrades.
