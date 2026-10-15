# Implementation Plan: Sandbox billing

**Branch:** `codex/sandbox-billing` | **Date:** 2026-10-13 | **Spec:** [spec.md](spec.md)

## Summary

Implement one-time catalog purchases with VNPAY sandbox and an explicit no-registration local sandbox. Add transactional allowances to chat, scan jobs and Pantry; integrate web and development mobile.

## Technical Context

TypeScript, Express 5, Node 22+, Prisma 6.12/MongoDB replica set, Next.js 16/React 19, Expo 57, TanStack Query. Native crypto signs VNPAY; no billing SDK dependency. Backend acceptance scripts only; frontend mapper tests.

## Constitution Check

Root SRS scope extension is authorized by the user. Preserve Contributor permissions, confirmation, source data and dietary constraints. Use createPrismaClient callback transactions; keep external calls outside retried callbacks. Integrate only verified READY billing endpoints after OpenAPI sync. Keep scan capability IN_PROGRESS.

## Project Structure

- backend/src/modules/billing: catalog, schemas, providers, service, routes, OpenAPI, acceptance and maintenance
- backend/src/modules/entitlements: account, ledger, reservations and capacity
- backend/prisma: schema, seed and Mongo validators
- frontend/src/features/billing: DTO/Model/Mapper/API/Query/UI and mapper tests
- frontend/src/app/(site)/billing: authenticated billing view
- mobile/src/features/billing and mobile/src/app/billing.tsx

## Sequencing

1. Persistence/config/catalog and transactional entitlement domain.
2. Checkout, signed IPN, owner operations, reconciliation and guarded simulation.
3. Atomic chat/scan/capacity integration and fenced recovery.
4. Backend gates/OpenAPI and READY contract registry.
5. Swagger sync, frontend/mobile consumers, natural entry points and business errors.
6. Acceptance, UI verification, documentation and commit.

## Complexity Tracking

Local simulation is required to make the requested result runnable without merchant credentials. It is a separate provider with explicit labels and environment guards.
