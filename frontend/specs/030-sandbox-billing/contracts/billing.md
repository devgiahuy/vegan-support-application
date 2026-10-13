# Contract plan

Authenticated: GET /billing/products, POST /billing/orders, GET /billing/orders, GET /billing/orders/{id}, POST /billing/orders/{id}/reconcile, GET /entitlements/me.

Public provider callbacks: GET /billing/vnpay/ipn and GET /billing/vnpay/return. Only IPN/verified query grants benefits.

Development-only local checkout: GET /billing/sandbox/{id} with an expiring order-bound capability; POST to settle with the same capability. No external money is collected. Capabilities are not authentication tokens and cannot read account data.

Business errors: BILLING_DISABLED, BILLING_PRODUCT_UNAVAILABLE, BILLING_ORDER_NOT_FOUND, BILLING_IDEMPOTENCY_CONFLICT, BILLING_PROVIDER_UNAVAILABLE, BILLING_SIGNATURE_INVALID, BILLING_PAYMENT_MISMATCH, ENTITLEMENT_QUOTA_EXCEEDED, PANTRY_CAPACITY_EXCEEDED, SCAN_RETRY_LIMIT_EXCEEDED.

Generated OpenAPI/tag documentation is the final contract authority after implementation.
