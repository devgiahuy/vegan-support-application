# Implementation Plan: payOS billing conversion

**Branch**: backend `codex/sandbox-billing`, clients `codex/sandbox-billing-ui` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

## Summary

Replace active billing providers with official payOS SDK. Persist a numeric-string provider order code and unique link ID; create outside the DB transaction and recover ambiguous retries by querying the same reference. Verify signed provider query results before once-only settlement. Keep owner locking, accounting and historical records.

## Technical Context

- TypeScript/Node 22+, Express, Prisma/Mongo replica set; official `@payos/node@2.0.5`.
- Next.js web and Expo mobile retain DTO → Mapper → Model → API → Query → UI layers.
- Existing backend acceptance script with controlled transport fixtures; no new backend test infrastructure. Frontend mapper tests remain mandatory.
- Scope: five one-time packages, payOS QR/transfer checkout, read-only old providers. Bounded provider timeout and 30-second reconcile cooldown.

## Constitution Check

The existing constitution is an unfilled template. Root AGENTS/SRS/business plan are authoritative: owner enforcement, atomic grants, no fake readiness, generated OpenAPI and all gates. Backend/client branches remain separate. No exceptions required.

## Project Structure

- `backend/src/modules/billing/`, `backend/src/config/env.ts`, Prisma/native validators, OpenAPI and living contract docs.
- UI branch: `frontend/src/features/billing/`, `mobile/src/features/billing/`, `mobile/src/app/billing.tsx`.
- Feature artifacts: this directory's spec, research, data-model, contracts, quickstart and tasks.
