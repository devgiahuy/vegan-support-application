# Feature Specification: payOS billing conversion

**Feature Branch**: `codex/sandbox-billing` (backend), `codex/sandbox-billing-ui` (clients)
**Created**: 2026-10-14
**Status**: Approved by user instruction
**Input**: “chuyển đổi hết sang PayOS đi”; credentials will be configured later.

## User Scenarios & Testing

### User Story 1 - Purchase usage packages through payOS (Priority: P1)

Signed-in members choose an existing usage package and open payOS checkout to pay by bank transfer/QR.
**Why this priority**: replaces the local outcome simulator with an external checkout.
**Independent Test**: a configured member creates/replays one intent and receives one checkout for one snapshotted package.
**Acceptance Scenarios**:
1. Given a configured payment channel, when a member buys a package, then they open payOS checkout with the server's price.
2. Given missing channel credentials, when viewing packages, then purchase actions are disabled with an explanation; account history stays available.

### User Story 2 - Receive benefits once and inspect payment (Priority: P1)

Members see confirmation only after provider settlement, with visible status-check feedback.
**Why this priority**: prevents duplicate or unverified grants.
**Independent Test**: replaying ten confirmations grants the package once; a forged or underpaid confirmation grants nothing.
**Acceptance Scenarios**:
1. Given a fully paid order, when repeated notifications arrive, then benefits are credited once.
2. Given a partial payment or processing transfer, when checking status, then the order stays pending with no grant.
3. Given an expired/cancelled order and a later verified full payment, then grant once rather than losing a settled payment.

### User Story 3 - Preserve historical orders (Priority: P2)

Members retain VNPAY/mocked purchases and existing balances as historical records, without resuming their old checkouts.
**Why this priority**: preserves truthful accounting during migration.
**Independent Test**: historical records retain their provider and benefits while new purchases use payOS exclusively.

### Edge Cases

- Concurrent purchase/retry, provider timeout after link creation, mismatched price/link/currency, unknown signed webhook confirmation samples, insufficient/extra transferred amounts, duplicate notifications and invalid return parameters.

## Requirements

### Functional Requirements

- FR-001: New purchases MUST use payOS exclusively; old settlement/checkout routes MUST be removed.
- FR-002: Catalog and order prices/benefits MUST be snapshotted on the server; browser return MUST NOT grant benefits.
- FR-003: Status checks MUST confirm the provider's total settlement before grants; partial payments remain pending; excess payment does not increase package benefits or cause automatic refunds.
- FR-004: Credits, Pantry capacity and all existing quota/confirmation safeguards MUST remain intact.
- FR-005: Web/mobile MUST disclose that payOS transfers real money and has no independent sandbox; missing credentials MUST NOT fall back to a mock checkout.
- FR-006: Historical provider labels and balances MUST remain truthful and readable.

### Key Entities

- Payment order: owner, intent, snapshotted package, provider order reference/link, settlement state and expiry.
- Payment event and entitlement ledger: deduplicated settlement and once-only grants.

## Success Criteria

### Measurable Outcomes

- SC-001: Ten repeats of one paid order produce exactly one package grant.
- SC-002: Invalid and partial payments produce zero grants.
- SC-003: All new purchase paths open payOS; all historical records keep their original provider.
- SC-004: Both clients display a visible result for unchanged status and a clear unavailable state without credentials.

## Assumptions

- User will configure payOS credentials later; live bank-transfer acceptance is deferred until then.
- Application production rollout, subscriptions, storage purchase and automatic refunds remain outside this conversion.
