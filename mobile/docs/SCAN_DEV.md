# Scan Development

Updated: 2026-10-03

The user approved a development-only exception to the READY-only integration rule for fridge and receipt jobs, first for fake-provider testing and subsequently requested switching the development preview to real OpenAI. Backend endpoints remain IN_PROGRESS and production integration stays disabled. OpenAI previously returned `429 credit_balance_exhausted`; selecting the real provider does not replenish credits. Fake providers remain an explicitly selected test option only.

## Start

Use two PowerShell terminals. Dependencies, database migrations and seed must already be available. Do not change the shared backend `.env` to switch providers.

From `backend/`:

```powershell
$env:NODE_ENV = 'development'
$env:PORT = '4003'
$env:FRONTEND_ORIGIN = 'http://localhost:8084,http://localhost:3000'
$env:VISION_ENABLED = 'true'
$env:RECEIPT_ENABLED = 'true'
$env:VISION_PROVIDER = 'openai'
$env:RECEIPT_PROVIDER = 'openai'
npm.cmd start
```

From `mobile/`:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://localhost:4003/api/v1'
$env:EXPO_PUBLIC_ENABLE_DEV_SCANS = 'true'
$env:EXPO_PUBLIC_SCAN_PROVIDER = 'openai'
npx.cmd expo start --web --port 8084
```

Use unused ports if these are occupied, and update both API URL and FRONTEND_ORIGIN consistently. The existing preview started by this task is at `http://localhost:8084/pantry` with real OpenAI backend `http://localhost:4003/api/v1`. Do not start duplicate servers while that preview is running. Existing jobs retain their original provider/model identity; create a new job after switching providers rather than retrying an old fake-provider job. The public mobile provider setting changes the label only, never backend behavior. For fake testing explicitly set both backend providers and `EXPO_PUBLIC_SCAN_PROVIDER` to `fake`.

For Android Emulator use `http://10.0.2.2:4003/api/v1` as API URL. For a physical device use the development machine's LAN IP, allow the backend port through the local firewall, and use the native Expo run workflow. Native camera/permission acceptance is still pending.

## Behavior

- Pantry links open `/fridge-scan` and `/receipt-scan` only when the dev flag is explicitly true and the Expo development runtime is active. API functions enforce the same guard; production builds remain disabled even if the flag is true.
- Select up to six fridge images or four receipt images; reorder/remove before submission. JPEG/PNG/WebP and the backend upload policy are enforced.
- Upload is real: reserve, signed Cloudinary upload, commit, then create the job from committed asset IDs. Successfully committed images are retained on create retry; lost commit responses retry the original reservation rather than reupload.
- The job ID remains in the URL so refresh can resume progress. Polling stops at terminal states. Owner-scoped query keys and a session-keyed workspace prevent another account inheriting previous scan state.
- Correct canonical identity/name, quantity/unit, freshness observations, and receipt line/pricing fields; reject unwanted candidates. Unknown quantities remain unknown and cannot be selected for confirmation.
- Confirmation lists the selected quantities and sends their expected versions. Only this operation updates Pantry and invalidates Pantry/shopping-preview caches. Lost-response retries reuse operation keys.
- Cancel and retry call the backend job APIs. Cancellation does not reclaim committed images; these remain quota-accounted. Retry regenerates candidates, so old selections are cleared.
- Confirmation with fake results still changes the local development database. Treat the resulting inventory as demo data, not the contents of the uploaded photo.

## Verification

2026-10-03: HTTP checks pass for both groups: create/replay, edit/version conflict, explicit confirm/replay, partial failure, retry and cancel. Browser checks pass for seed login, real upload/commit, create, edit, selection and confirmation at mobile and desktop widths. No browser runtime errors or horizontal page overflow observed. Native camera/library permissions and successful OpenAI recognition remain unverified.
