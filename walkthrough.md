# Khởi Tạo Dự Án Frontend WDP301 & Upgraded Type Mapper Layer

Dự án frontend mới đã được khởi tạo hoàn tất tại thư mục `C:\FPT\Project\WDP301` với kiến trúc modular tương đồng với `smart-wardrobe-fe`, tích hợp đầy đủ hệ sinh thái hiện đại và đặc biệt nâng cấp tầng **Type Mapper** chuyên biệt.

---

## 1. Cấu Trúc Dự Án Đã Tạo Tại `C:\FPT\Project\WDP301`

```
C:\FPT\Project\WDP301/
├── public/
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── error.tsx                       # Global runtime error boundary
│   │   ├── globals.css                     # Tailwind CSS v4 & theme variables
│   │   ├── layout.tsx                      # Root layout bọc Providers & Sonner
│   │   ├── not-found.tsx                   # Trang 404
│   │   └── page.tsx                        # Dashboard & Live Mapper Playground
│   ├── common/
│   │   ├── constants/api-endpoints.ts      # Quản lý tập trung các route API
│   │   └── enums/index.ts                  # StatusEnum, UserRole
│   ├── components/
│   │   ├── layout/
│   │   │   └── header.tsx                  # Header responsive kèm dark mode switch
│   │   ├── providers/
│   │   │   ├── auth-provider.tsx           # Client hydration check cho Zustand
│   │   │   ├── query-provider.tsx          # TanStack QueryClientProvider
│   │   │   └── theme-controller.tsx        # Light / Dark mode controller
│   │   └── ui/
│   │       ├── badge.tsx                   # Badge component
│   │       ├── button.tsx                  # Radix Slot button component
│   │       ├── card.tsx                    # Card component
│   │       ├── input.tsx                   # Input component
│   │       └── sonner.tsx                  # Sonner Toast component
│   ├── features/
│   │   ├── auth/                           # Feature xác thực người dùng
│   │   │   ├── api/auth.api.ts             # API login, logout, getMe, refresh
│   │   │   ├── hooks/useAuth.ts            # Tiện ích gọi nhanh state & mutations
│   │   │   ├── mappers/auth.mapper.ts      # Mapper chuẩn hóa UserDto -> User
│   │   │   ├── queries/auth.queries.ts     # useLoginMutation, useLogoutMutation
│   │   │   └── types/
│   │   │       ├── auth.dto.ts             # DTO Backend
│   │   │       └── auth.model.ts           # Domain Entity Frontend
│   │   └── product/                        # Feature sản phẩm mẫu hoàn chỉnh
│   │       ├── api/product.api.ts          # API với fallback Mock Data
│   │       ├── components/
│   │       │   ├── mapper-test-panel.tsx   # Live Interactive Playground
│   │       │   ├── product-card.tsx        # Card hiển thị sản phẩm
│   │       │   └── product-list.tsx        # Danh sách query với TanStack
│   │       ├── mappers/product.mapper.ts   # Mapper xử lý biến thể đa trường
│   │       ├── queries/product.queries.ts  # useProductsQuery, useCreateProduct
│   │       └── types/
│   │           ├── product.dto.ts          # DTO đa dạng biến thể
│   │           └── product.model.ts        # Model sạch sẽ cho Frontend
│   ├── hooks/
│   │   ├── useDebounce.ts                  # Hook debounce tìm kiếm
│   │   └── useMediaQuery.ts                # Hook kiểm tra responsive
│   ├── lib/
│   │   ├── api-error.ts                    # Trích xuất message lỗi & Toast sonner
│   │   ├── axios.ts                        # Axios instance, Bearer Token, Refresh Queue
│   │   ├── query-client.ts                 # Cấu hình QueryClient & retry logic
│   │   ├── utils.ts                        # cn(), formatCurrency(), formatDate()
│   │   └── mapper/                         # ⭐ UPGRADED CORE MAPPER SYSTEM
│   │       ├── base-mapper.ts              # IMapper, IBidirectionalMapper, BaseMapper
│   │       ├── field-helpers.ts            # pickField, safeString, safeNumber, safeArray
│   │       └── index.ts                    # Entrypoint export
│   ├── middleware.ts                       # Edge Runtime JWT validation
│   ├── store/
│   │   ├── useAuthStore.ts                 # Zustand store có localStorage persist
│   │   ├── useUIStore.ts                   # Quản lý theme và sidebar
│   │   └── index.ts
│   └── types/
│       ├── api.ts                          # APIResponse, ErrorResponse, PaginationResult
│       └── index.ts
├── .env.example
├── .env.local
├── .gitignore
├── components.json                         # Cấu hình shadcn/ui
├── next.config.ts                          # Next.js config (rewrites, images)
├── package.json                            # Next 16, React 19, TanStack v5, Tailwind v4
├── postcss.config.mjs
├── README.md                               # Hướng dẫn chi tiết sử dụng
└── tsconfig.json                           # TypeScript path alias @/* -> ./src/*
```

---

## 2. Điểm Nổi Bật Của Hệ Thống

### ⭐ Tầng Type Mapper Nâng Cấp (`src/lib/mapper/`)
1. **`pickField(dto, candidateKeys, fallback)`**:
   Quét tìm trường theo thứ tự ưu tiên (hỗ trợ cả lồng nhau như `category.name` lẫn phẳng `category_name`). Khi Backend đổi tên trường, Frontend **chỉ cần thêm tên mới vào danh sách `candidateKeys`** trong Mapper, không cần sửa lại bất kỳ Component, Hook hay Store nào.
2. **Safe Cast Helpers**:
   - `safeString()`: Đảm bảo luôn trả về chuỗi, không bao giờ `null`/`undefined`.
   - `safeNumber()`: Tự động chuyển chuỗi `"380000"` sang số `380000`, loại bỏ `NaN`.
   - `safeArray()`: Nếu Backend trả về `null` hoặc `undefined`, tự động gán `[]` để ngăn chặn lỗi `Cannot read properties of undefined (reading 'map')`.
   - `safeEnum()`: Map giá trị linh hoạt về TypeScript enum.
3. **`BaseMapper<TDto, TModel>` & `BaseBidirectionalMapper`**:
   - Có sẵn các phương thức `toModel()`, `toModelList()`, `toPaginationModel()`, `toCreateDto()`, `toUpdateDto()`.

### 🌐 Axios Interceptors Hoàn Chỉnh (`src/lib/axios.ts`)
- **Request Interceptor**: Tự động inject token Bearer từ Zustand store.
- **Response Interceptor**:
  - Hàng đợi `failedQueue` tự động giữ và thử lại các request đồng thời khi token hết hạn mà không gọi refresh nhiều lần.
  - Tích hợp Sonner Toast thông minh cho các mã lỗi 403, 500, timeout, và hỗ trợ các cờ `silent`, `showErrorToast`, `errorToastMessage`.

### ⚡ TanStack Query v5 (`src/lib/query-client.ts`, `src/features/*/queries`)
- `QueryClient` cấu hình sẵn `staleTime`, `gcTime`, bỏ qua retry với mã lỗi 4xx.
- Quản lý theo chuẩn **Query Key Factory Pattern** giúp dễ dàng `invalidateQueries` khi mutate dữ liệu.

### 💾 Zustand Store (`src/store/`)
- Quản lý `useAuthStore` lưu vào `localStorage` qua middleware `persist`.
- Quản lý `useUIStore` hỗ trợ chuyển đổi Light/Dark mode tức thì.

---

## 3. Cách Bắt Đầu Chạy Thử Dự Án

Mở terminal tại máy của bạn và chạy các lệnh sau:

```bash
# 1. Di chuyển vào thư mục dự án
cd C:\FPT\Project\WDP301

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy server phát triển
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm giao diện dashboard và bảng **Live Interactive Mapper Test Playground**.
