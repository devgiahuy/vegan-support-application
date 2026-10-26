# Contract changes

- Catalog/entitlement provider: `payos`; simulated false. Catalog enabled requires billing opt-in plus complete merchant credentials. Domain quotas still use billing opt-in independently of checkout readiness.
- Orders retain provider enum `payos|sandbox|vnpay` to read history; old providers cannot receive checkout URLs or new settlement.
- POST `/billing/payos/webhook`: public signed JSON notification, SDK verification and authoritative query. Signed unknown sample ACK; mismatch/invalid signature reject; transient provider failure requests retry.
- GET `/billing/payos/return/:id`: display-only redirect to configured application billing URL; ignores provider query claims for settlement.
- Removed VNPAY IPN/return and local sandbox GET/POST routes. Reconcile owner-only, 30-second throttle for payOS; historical orders return unchanged state.
- Existing envelopes and typed errors retained, with missing configuration → BILLING_PROVIDER_UNAVAILABLE and removed old configuration values rejected.
