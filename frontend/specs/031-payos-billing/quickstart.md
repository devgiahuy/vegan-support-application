# Validation guide

1. Backend: install dependencies, generate Prisma, apply native Mongo schema and seed to an isolated billing_* database. Run existing billing acceptance with mocked payOS transport; no external bank call.
2. Run `npm run billing:demo` without keys: catalog provider payos, purchase disabled, existing balances/history readable. Web localhost:3100; mobile UI/API use 127.0.0.1 to isolate cookies.
3. Configure PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in backend/.env; start helper with BILLING_ENABLED=true. Register public HTTPS `/api/v1/billing/payos/webhook` in the payment channel. Keys never go into client env or Git.
4. External checkout QR and settlement acceptance require the user's channel and a real transfer. Do not call mocked acceptance payOS sandbox. Follow docs/BILLING_DEMO.md for exact runtime commands.
