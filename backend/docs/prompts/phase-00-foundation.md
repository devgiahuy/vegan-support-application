# Prompt — Phase 00: Backend Foundation

Bạn đang triển khai Phase 00 cho repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Đây là session độc lập; không dựa vào lịch sử chat.

Trước khi sửa file, đọc đầy đủ `AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md`, `backend/docs/IMPLEMENTATION_PHASES.md` và `frontend/docs/BACKEND_INTEGRATION.md`. Kiểm tra `git status`, giữ nguyên mọi thay đổi không liên quan và không stage `.DS_Store`.

## Mục tiêu

Khởi tạo backend production-shaped bằng Node.js, Express, TypeScript, PostgreSQL, Prisma, Zod và OpenAPI; chưa triển khai feature nghiệp vụ.

## Scope bắt buộc

- Tạo `backend/package.json`, TypeScript strict config, lint/format/build scripts và `.env.example`.
- Thiết lập Express app/server tách rời, graceful shutdown, JSON/body limits, CORS cấu hình, request ID, 404 và centralized error handler.
- Config validation fail-fast cho port, database URL, frontend origin và environment.
- Khởi tạo Prisma schema, migration nền tảng cần thiết và seed runner; không tạo domain tables của phase sau ngoài phần tối thiểu phục vụ bootstrap.
- Không tạo hoặc duy trì automated unit/integration test suite.
- Thiết lập một nguồn schema dùng chung cho runtime validation và OpenAPI; tránh mô tả request/response thủ công lệch Zod.
- Serve Swagger UI ở `/api-docs`, JSON ở `/api-docs.json` và health check `GET /api/v1/health`.
- Health response không lộ secret; có request ID và trạng thái database rõ ràng.
- Tạo local development instructions, bao gồm cách chạy PostgreSQL/Redis-compatible service nếu dùng.

## Acceptance

- `npm run lint`, `npm run typecheck`, `npm run build` pass.
- Server start được từ build output.
- Health, 404 và validation/error envelope được triển khai đầy đủ theo contract.
- OpenAPI JSON sinh/serve được và chứa health endpoint.
- Cập nhật endpoint health/OpenAPI sang `READY` trong `frontend/docs/BACKEND_INTEGRATION.md`, cập nhật changelog và ngày backend.
- Cập nhật Phase 00 thành `COMPLETED` trong `backend/docs/IMPLEMENTATION_PHASES.md`.

Không triển khai auth hoặc business feature. Không hard-code secret.

Cuối cùng chạy `git diff --check`, xem staged diff và tạo đúng một commit chỉ cho phase này với message:

```text
chore(backend): bootstrap service foundation
```

Trong kết quả cuối session, báo commit hash, file chính đã tạo, gate đã chạy và bất kỳ kiểm tra nào chưa chạy.
