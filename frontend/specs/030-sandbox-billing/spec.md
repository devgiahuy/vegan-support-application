# Feature Specification: Sandbox purchases and account allowances

**Feature Branch:** `codex/sandbox-billing`
**Created:** 2026-10-13
**Status:** Approved implementation scope by user instruction on 2026-10-13

## User Scenarios & Testing

### User Story 1 — Buy additional allowances (P1)

A signed-in member buys a displayed package on web or development mobile and sees the additional allowances on both clients.

Acceptance: a verified successful payment grants the displayed package once; duplicate notifications and page reloads never grant again. Another member cannot inspect the order. Cancellation and failed payments grant nothing.

### User Story 2 — Spend allowances safely (P1)

Free daily chat is used before purchased chat credits. Pantry expansion increases simultaneous inventory capacity. Fridge and receipt jobs use their own allowances.

Acceptance: failed/fallback chat releases credit; replay is free; concurrent operations cannot spend the final credit twice. Full and partial successful scan jobs cost one job credit, total failure costs none; retries of a charged job are free and bounded. Confirmation still requires explicit user action and available Pantry space.

### User Story 3 — Review without merchant registration (P2)

The developer runs the full flow without external account setup using an explicitly labeled local simulation. VNPAY sandbox can be selected with merchant credentials.

Acceptance: no-credential demo supports successful/canceled/failed payments; simulation is disabled in production; no automatic fallback disguises a misconfigured external provider.

### Edge Cases

Payment success arrives after cancel/expiry; signature/amount/merchant mismatch; stale worker returns after recovery; free quota exhausted during a purchased turn; confirmation creates more items than capacity; existing accounts already exceed the new baseline.

## Requirements

- FR-001: Server determines price and snapshots package benefits.
- FR-002: Only verified server settlement grants allowances, atomically and idempotently.
- FR-003: Owner-only orders, balances and ledger; purchases never modify roles.
- FR-004: Purchased allowances accumulate without expiry in this demo scope.
- FR-005: Pantry counts all undeleted items, including zero quantity; deletion/merge frees capacity. Existing over-limit inventory remains readable/editable/deletable.
- FR-006: One scan job, bounded by existing image caps, costs one credit after any successful image result (including valid empty detection). Retrying the same charged job does not charge again; attempts are capped by configuration.
- FR-007: Results remain advisory; confirmation and dietary constraints are unchanged.
- FR-008: Every simulated purchase is labeled and never represented as real money received.
- FR-009: Recovery fences expired processing attempts before releasing held credits.
- FR-010: Return pages only display order state; provider reconciliation uses verified results.

## Key Entities

Package, immutable order snapshot, payment event, allowance account, usage reservation and immutable allowance ledger.

## Success Criteria

- Ten duplicate notifications grant exactly one package.
- Two operations competing for one credit produce at most one successful paid consumption.
- All three Pantry creation paths enforce the same capacity.
- Web and development mobile show the same server balance after payment.
- The local demo requires no merchant registration.

## Assumptions

VND, one-time purchases, no recurring billing or automatic refunds. Scan billing uses a bounded job rather than per-image billing to preserve existing multi-image deduplication and correction behavior. Prices are demonstration catalog values. VNPAY is sandbox-only; App Store/Play distribution is outside this scope. Live-image validation remains IN_PROGRESS.
