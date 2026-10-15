# Billing persistence

BillingProduct stores versioned VND catalog and four nonnegative benefit counts. PaymentOrder snapshots the catalog, owner, provider, expiry and original checkout date. PENDING may become PAID/CANCELLED/FAILED/EXPIRED; verified late success may become PAID; PAID never downgrades.

PaymentEvent has a unique provider transaction key and order relation. EntitlementAccount has one owner and chat/fridge/receipt balances plus Pantry expansion. UsageReservation has a unique resource key, source, lease and HELD/SPENT/RELEASED status. EntitlementLedger has unique operation key, owner, feature, signed delta and reason; existing entries are never rewritten.

All persistence models include internal referenceVersion. Monetary values use integer VND. Native Mongo constraints reject negative balances, invalid prices and invalid quantities.
