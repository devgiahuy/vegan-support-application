# Contract: Error Envelope & Business Error Codes (frontend)

**Feature**: `001-user-auth` | **Nguồn**: `BACKEND_INTEGRATION.md` §3.2 + §8, OpenAPI `ErrorResponse`, Clarifications spec 2026-09-15

## 1. Envelope

Backend trả (nested):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không đúng.",
    "fields": { "email": ["..."] },
    "requestId": "req_abc123"
  }
}
```

Frontend contract sau nâng cấp `src/types/api.ts`:

```ts
interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, unknown>;
  requestId?: string;
}

interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

interface ValidationErrorItem { field: string; message: string; }

interface ErrorResponse {          // giữ tương thích ngược với consumer cũ
  success?: false;
  error?: ApiErrorBody;            // shape mới
  status?: number;                 // shape cũ (fallback)
  statusCode?: number;
  title?: string;
  message?: string;
  detail?: string;
  Detail?: string;
  errors?: ValidationErrorItem[];
}
```

## 2. Helper contract (`src/lib/api-error.ts`)

| Helper | Input | Output | Quy tắc |
| --- | --- | --- | --- |
| `isAxiosError` | `unknown` | type guard | giữ nguyên |
| `isNetworkError` | `unknown` | `boolean` | giữ nguyên |
| `getApiErrorStatus` | `unknown` | `number \| undefined` | giữ nguyên |
| `getApiErrorData` | `unknown` | `ErrorResponse \| undefined` | giữ nguyên |
| `getApiErrorCode` | `unknown` | `string \| undefined` | **mới** — đọc `error.error.code`, fallback `error.code`, không branch theo `message` |
| `getApiErrorFields` | `unknown` | `Record<string, unknown> \| undefined` | **mới** — đọc `error.error.fields` |
| `getApiErrorMessage` | `unknown, fallback?` | `string` | **sửa** — ưu tiên `error.error.message`, rồi `errors[]`, rồi shape cũ |
| `handleApiError` | `unknown, fallback?` | `void` | giữ nguyên hành vi skip code đã toast global |

## 3. Business codes frontend PHẢI xử lý (phạm vi auth)

| Code | HTTP | Hành vi UI | Trạng thái trong spec |
| --- | --- | --- | --- |
| `AUTH_REQUIRED` | 401 | Đi qua refresh-queue; nếu refresh fail → logout + điều hướng `/login?from=<path>` | FR-009 |
| `INVALID_CREDENTIALS` | 401 | Inline error form login: "Email hoặc mật khẩu không đúng." | FR-003, FR-009 |
| `ACCOUNT_LOCKED` | 423 | **Thông báo lỗi đăng nhập thất bại chung**; không CAPTCHA, không đếm ngược | Clarifications 2026-09-15 |
| `ACCOUNT_BANNED` | 403 | **Thông báo lỗi đăng nhập thất bại chung** | Clarifications 2026-09-15 |
| `EMAIL_ALREADY_EXISTS` | 409 | Inline error field email form register | FR-002 |
| `VALIDATION_ERROR` | 400 | Map `error.fields` vào từng input; không retry | FR-010 |
| `INVALID_JSON` | 400 | Alert "Yêu cầu không hợp lệ"; không retry tự động | ngoài core auth nhưng dùng chung interceptor |
| `INVALID_ACCESS_TOKEN` | 401 | Clear auth state; yêu cầu đăng nhập lại | FR-009 |
| `TOKEN_EXPIRED` | 401 | Để refresh queue xử lý | FR-005, FR-009 |
| `INVALID_REFRESH_TOKEN` | 401 | Clear auth state; toast "Phiên đăng nhập đã hết hạn"; về login | FR-005, FR-009 |
| `REFRESH_TOKEN_REUSED` | 403 | Clear auth state; toast "Phiên đã bị thu hồi"; về login | FR-005, FR-009 |
| `FORBIDDEN` | 403 | Trang/thông báo không đủ quyền | BACKEND_INTEGRATION §8 |
| `INTERNAL_SERVER_ERROR` | 500 | Toast hệ thống (interceptor global) | interceptor |

## 4. Quy tắc bắt buộc

1. **Không** branch theo `message`/`detail` — chỉ theo `code`. `message` chỉ làm fallback hiển thị.
2. Toast global đã có cho 5xx/403/429/network trong `lib/axios.ts` → tránh toast đè trong feature (`handleApiError` tự skip).
3. Refresh/logout request phải bỏ qua retry (`_retry`) để không lặp vô hạn.
4. Request login không được kích hoạt refresh-queue (`url.includes('/auth/login')` — giữ điều kiện sẵn có).

## 5. Definition of Done

- [ ] `getApiErrorCode`/`getApiErrorFields` có test hoặc được dùng thực tế trong form login/register.
- [ ] `ACCOUNT_LOCKED`/`ACCOUNT_BANNED` không tạo UI đặc biệt nào.
- [ ] Không còn `branch` theo chuỗi message ở `features/auth`.
- [ ] `npx tsc --noEmit` sạch; không `any` trong các helper mới.
