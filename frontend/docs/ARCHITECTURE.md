# ARCHITECTURE & CODING RULES — Frontend (`src/`)

> Đối tượng: dev mới + AI agent. Đọc file này trước khi code.
> Stack: Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui +
> Axios + TanStack Query v5 + Zustand + Mapper Layer. Ngôn ngữ UI mặc định: **tiếng Việt**.

---

## 1. Cây thư mục `src/` và trách nhiệm

```
src/
├── app/                  # Route + layout. Server Component mặc định. Chỉ ghép providers/pages.
│   ├── layout.tsx        # QueryProvider > ThemeController > AuthProvider > Header + Toaster
│   ├── page.tsx, error.tsx, not-found.tsx
│   └── api/auth/*/route.ts  # Route Handler proxy BE (refresh-token, logout). Không viết business ở đây.
├── middleware.ts         # Edge: check HttpOnly cookie accessToken/access_token, redirect /login.
│                         # KHÔNG đọc localStorage (server không thấy).
├── common/
│   ├── constants/api-endpoints.ts  # MỌI endpoint tập trung ở đây. Cấm hardcode string URL trong feature.
│   └── enums/            # Enum dùng chung (StatusEnum, UserRole...).
├── components/
│   ├── ui/               # shadcn nguyên bản (button, card, input...). Không sửa logic, chỉ style via cn().
│   ├── layout/           # Header, sidebar... dùng chung.
│   └── providers/        # query-provider, auth-provider, theme-controller. Client Component.
├── features/<domain>/    # Đơn vị chính. Mỗi domain 1 folder độc lập:
│   ├── types/*.dto.ts    # Dữ liệu THÔ từ BE (optional, union, nullable). BẮT BUỘC.
│   ├── types/*.model.ts  # Dữ liệu SẠCH cho UI (camelCase, non-null, typed). BẮT BUỘC.
│   ├── mappers/*.mapper.ts # DTO -> Model (và ngược lại khi create/update). BẮT BUỘC.
│   ├── api/*.api.ts      # Gọi axios/serverFetch + map qua mapper. Không trả DTO ra ngoài.
│   ├── queries/*.queries.ts # TanStack hooks + Query Key Factory. Component chỉ gọi tầng này.
│   ├── hooks/            # (optional) hook gom store + queries, vd useAuth.
│   ├── schemas/          # (khi có form) zod schema. Nên có nếu dùng react-hook-form.
│   └── components/       # UI của feature, chỉ nhận Model, không nhận DTO.
├── lib/
│   ├── axios.ts          # Client fetch: Bearer từ memory, refresh-queue, toast. withCredentials:true.
│   ├── auth-token.ts     # Single Source of Truth cho accessToken (in-memory). Cấm đọc localStorage trong interceptor.
│   ├── server-fetch.ts   # Server fetch: đọc HttpOnly cookie, BACKEND_API_URL, revalidate/tags.
│   ├── query-client.ts   # staleTime 1m, gcTime 5m, không retry 4xx.
│   ├── api-error.ts      # getApiErrorMessage/handleApiError/isAxiosError... Dùng khi cần toast thủ công.
│   ├── utils.ts          # cn(), formatCurrency(), formatDate().
│   └── mapper/           # Core: base-mapper.ts (BaseMapper/BaseBidirectionalMapper), field-helpers.ts
│                         # (pickField, safeString/Number/Boolean/Date/Array/Enum).
├── store/                # Zustand client-state ONLY: useAuthStore (token memory + persist user),
│                         # useUIStore (theme/sidebar). Cấm để server-state (list, detail) ở đây.
├── hooks/                # Hook dùng chung (useDebounce, useMediaQuery).
└── types/api.ts          # Khung chung: APIResponse<T>, ErrorResponse, PaginationResult<T>, PaginationMetadata.
```

**Luồng chuẩn:**

```
Client: Component -> queries/*.queries.ts -> api/*.api.ts (axios) -> mapper.toModel/toPaginationModel -> Model -> render
Server: Server Component -> lib/server-fetch.ts (+ mapper) -> Model -> render
```

---

## 2. Quy tắc import & biên module

1. Alias duy nhất: `@/*` -> `./src/*` (xem `tsconfig.json`). Không dùng relative `../../../`.
2. Feature độc lập: `features/product` **không import** từ `features/auth` (trừ `common/lib/types/store`).
   Muốn dùng chéo -> nâng lên `common/` hoặc `components/`.
3. `components/ui` không import `features/*`, `store/*`. Chỉ nhận props.
4. `app/` không gọi trực tiếp `axios`/`fetch`. Gọi qua `features/*/queries` (client) hoặc `lib/server-fetch` (server).
5. Endpoint mới -> thêm vào `common/constants/api-endpoints.ts` trước, rồi mới dùng.

---

## 3. ⭐ RULE BẮT BUỘC: gọi API phải có Interface + Mapper, cấm `any`

> **Mọi API call đều phải đi qua bộ 3: `DTO interface` + `Model interface` + `Mapper class`. Cấm `any`, cấm `as any`,
> cấm `(res.data as any)`, cấm component xài trực tiếp DTO.**

### 3.1. Tại sao

BE đổi tên field (`product_name` -> `item_title`), đổi kiểu (`"380000"` string thay vì number),
trả `null` thay vì `[]` -> UI crash hàng loạt nếu component đọc DTO trực tiếp.
Mapper cô lập rủi ro tại 1 file duy nhất.

### 3.2. Mẫu chuẩn (copy khi tạo feature mới)

```ts
// features/order/types/order.dto.ts — thô, chấp nhận biến thể BE
export interface OrderDto {
  id?: string | number; order_id?: string | number; _id?: string;
  total?: number | string; total_amount?: number | string;
  status?: string | number;
  created_at?: string; createdAt?: string;
}
export interface CreateOrderReqDto {
  items: Array<{ product_id: string; qty: number }>;
}

// features/order/types/order.model.ts — sạch, UI chỉ dùng file này
export interface Order {
  id: string;
  total: number;
  formattedTotal: string;
  status: string;
  createdAt: Date | null;
}

// features/order/mappers/order.mapper.ts
import { BaseBidirectionalMapper, pickField, safeNumber, safeString, safeDate } from '@/lib/mapper';
import { formatCurrency } from '@/lib/utils';
import type { OrderDto, CreateOrderReqDto } from '../types/order.dto';
import type { Order } from '../types/order.model';

export class OrderMapper extends BaseBidirectionalMapper<OrderDto, Order, CreateOrderReqDto, Partial<CreateOrderReqDto>> {
  toModel(dto: OrderDto | null | undefined): Order {
    const total = safeNumber(pickField(dto, ['total', 'total_amount'], 0));
    return {
      id: safeString(pickField(dto, ['id', 'order_id', '_id'], '')),
      total,
      formattedTotal: formatCurrency(total),
      status: safeString(pickField(dto, ['status'], 'PENDING')),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }
  toCreateDto(domain: Partial<Order>): CreateOrderReqDto {
    return { items: [] }; // map từ domain sang payload BE yêu cầu
  }
  toUpdateDto(domain: Partial<Order>): Partial<CreateOrderReqDto> { return {}; }
}
export const orderMapper = new OrderMapper();

// features/order/api/order.api.ts — KHÔNG trả DTO
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { APIResponse, PaginationResult } from '@/types/api';
import type { OrderDto } from '../types/order.dto';
import type { Order } from '../types/order.model';
import { orderMapper } from '../mappers/order.mapper';

export const orderApi = {
  getOrders: async (params?: { page?: number; limit?: number }): Promise<PaginationResult<Order>> => {
    const res = await api.get<APIResponse<PaginationResult<OrderDto>>>('/orders', { params, silent: true });
    return orderMapper.toPaginationModel(res.data.data);
  },
};
```

### 3.3. Cấm

```ts
// ❌ SAI
const res = await api.get('/products');
const list = res.data.data as any;
return <div>{item.product_title /* đọc DTO trực tiếp */}</div>;

// ✅ ĐÚNG
const res = await api.get<APIResponse<PaginationResult<ProductDto>>>(API_ENDPOINTS.PRODUCTS.LIST);
return productMapper.toPaginationModel(res.data.data); // trả PaginationResult<Product>
```

Checklist review PR/API mới:

- [ ] Có `types/*.dto.ts` + `types/*.model.ts` riêng, không dùng chung, không `any`.
- [ ] Có `mappers/*.mapper.ts` extends `BaseMapper`/`BaseBidirectionalMapper`, dùng
      `pickField` + `safe*` cho **mọi field** (kể cả khi tin BE).
- [ ] `api/*.api.ts` typed `api.get<APIResponse<...>>`, dùng hằng số endpoint, trả về `Model`, không leak DTO.
- [ ] Chạy `node node_modules/typescript/bin/tsc --noEmit` không lỗi mới.

---

## 4. Quy tắc các tầng còn lại

### API client (`lib/axios.ts`)

- Token lấy từ `lib/auth-token.ts` + `useAuthStore.getState().token`. **Cấm `localStorage.getItem('auth-storage')`.**
- `withCredentials: true` để gửi HttpOnly cookie. Refresh qua `POST /api/auth/refresh-token`
  (Route Handler proxy BE), có `failedQueue` chống race. Request refresh/logout tự bỏ qua retry (`_retry`).
- Toast: mặc định `silent: true` cho GET list; mutation truyền `{ showErrorToast: true }` hoặc
  `errorToastMessage`. Lỗi 500/403/429 đã có toast toàn cục — đừng toast đè.

### API server (`lib/server-fetch.ts`)

- Dùng trong Server Component/Route Handler. Ưu tiên `BACKEND_API_URL`, fallback `NEXT_PUBLIC_API_URL`.
- Tự gắn `Bearer` từ cookie (`accessToken`/`access_token`) + `Accept-Language: vi`.
- Hỗ trợ `{ cache, revalidate, tags }`. Lỗi trả `null`; cần `notFound()/redirect()` thì dùng `serverFetchOrThrow`.

### TanStack Query (`queries/`)

- Key Factory bắt buộc: `export const X_QUERY_KEYS = { all: ['x'], list: (p) => [...all,'list',p], detail: (id) => [...] }`.
- `queryFn` gọi `xxxApi`, không fetch trực tiếp. Mutation xong `invalidateQueries({ queryKey: X_QUERY_KEYS.all })`.
- Không retry 4xx (đã cấu hình global). Component xử lý đủ 3 trạng thái `isLoading/isError/isSuccess` + empty.

### Auth & middleware

- `useAuthStore`: token **in-memory only** (`partialize: user`), `setSession/setToken/logout` đồng bộ `auth-token.ts`.
  Sau F5, `AuthProvider` silent-refresh bằng cookie để khôi phục session.
- `middleware.ts` đọc cookie, check `exp` (+10s skew). Bảo vệ `/dashboard/*`, `/profile/*`; `/login` đá về `/` nếu đã login.
- Login/logout/refresh đi qua `app/api/auth/*` để forward `Set-Cookie` cùng-domain.

### State

- Server-state (list/detail/mutation) -> TanStack. Client-state (token/user/theme/sidebar) -> Zustand.
  Cấm cache API response trong Zustand.

### Lỗi (`lib/api-error.ts`)

- Trong `catch` cần message: `getApiErrorMessage(error, fallback)`. Cần toast thủ công: `handleApiError(error)`
  (tự bỏ qua mã đã toast global). Check loại lỗi: `isAxiosError`, `isNetworkError`, `getApiErrorStatus`.

### UI & style

- Dùng component `components/ui/*`, gộp class bằng `cn()`. Tiền/ngày dùng `formatCurrency/formatDate` trong `lib/utils.ts`.
- UI chỉ nhận `Model` (camelCase, đã format). Mọi `formattedX`, label enum xử lý trong mapper/model, không format trong JSX.

### TypeScript

- `strict: true`. Cấm `any`/`as any` (kể cả `catch (e: any)`, dùng `unknown` + type guard).
  Cấm `@ts-ignore`; cần thì `@ts-expect-error` kèm lý do.
- Mọi response/request BE đều có `interface` riêng. Không `Record<string, any>`, không `object`.
- Verify: `node node_modules/typescript/bin/tsc --noEmit`.

---

## 5. Scaffold feature mới (làm theo thứ tự)

1. Thêm endpoint vào `common/constants/api-endpoints.ts`.
2. Tạo `features/<d>/types/<d>.dto.ts` + `types/<d>.model.ts`.
3. Tạo `mappers/<d>.mapper.ts` (full `pickField` + `safe*`).
4. Tạo `api/<d>.api.ts` (typed + mapper, không leak DTO).
5. Tạo `queries/<d>.queries.ts` (Key Factory + hooks).
6. Tạo `components/` nhận `Model` + xử lý loading/error/empty.
7. Cần form -> thêm `schemas/<d>.schema.ts` (zod) + `react-hook-form`.
8. Chạy `tsc --noEmit`, tự test BE đổi tên field/`null`/số-dạng-chuỗi mà UI không vỡ.

Tham khảo mẫu hoàn chỉnh: `features/product/*`, `features/auth/*`.

---

## 6. Workflow với Swagger BE (đỡ tốn token cho agent)

Chi tiết: `docs/API-WORKFLOW.md`. Tóm tắt:

1. `npm run sync:swagger` (hoặc `SWAGGER_URL=<be-/api-docs.json> npm run sync:swagger`)
   để chẻ swagger gốc thành `docs/API-CATALOG.md` + `docs/api-catalog.json` + `docs/api/<tag>.md`.
2. Khi cần 1 API: đọc `API-CATALOG.md` tìm tag/path → chỉ mở `docs/api/<tag>.md`.
   **Cấm đọc swagger gốc trong lúc code.**
3. Viết DTO theo schema trong file tag, rồi làm tiếp các bước mục 5 (Mapper → API → Queries).
