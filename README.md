# WDP301 Frontend Architecture Template

Dự án Frontend được xây dựng dựa trên cấu trúc chuẩn modular của **smart-wardrobe-fe**, tích hợp sẵn:
- **Next.js 16 (App Router)** & **React 19** & **TypeScript**
- **Tailwind CSS v4** & **tw-animate-css** & Theme controller
- **Axios Interceptor**: Tự động inject Bearer Token, hàng đợi refresh token chống race condition, bắt lỗi toast toàn diện với **Sonner**
- **TanStack Query v5**: Server State, Cache, Retry logic, Query Key Factory
- **Zustand Store**: Quản lý Auth và UI State với middleware `persist`
- ⭐ **TẦNG TYPE MAPPER NÂNG CẤP**: Giải quyết triệt để vấn đề Backend thay đổi trường, sai lệch kiểu dữ liệu hoặc trả về null/undefined.

---

## 📁 Cấu Trúc Thư Mục Chuẩn

```
src/
├── app/                  # Next.js App Router (Layouts, Pages, Global CSS)
│   ├── globals.css       # Tailwind CSS v4 design tokens
│   ├── layout.tsx        # Providers bọc toàn cục
│   └── page.tsx          # Showcase & Live Mapper Playground
├── common/               # Hằng số, API endpoints, Enums dùng chung
├── components/
│   ├── layout/           # Header, Sidebar, Shell components
│   ├── providers/        # QueryProvider, AuthProvider, ThemeController
│   └── ui/               # Button, Card, Badge, Input, Sonner, v.v.
├── features/             # Feature-based modular architecture
│   ├── auth/             # DTO, Model, Mapper, API, Queries, Hooks
│   └── product/          # Mẫu minh họa Feature hoàn chỉnh tích hợp Mapper
├── hooks/                # Custom React Hooks
├── lib/
│   ├── api-error.ts      # Xử lý lỗi API & Sonner toast
│   ├── axios.ts          # Axios Instance + Request/Response Interceptors
│   ├── query-client.ts   # TanStack QueryClient options
│   ├── utils.ts          # Helper cn(), formatCurrency(), formatDate()
│   └── mapper/           # ⭐ CORE MAPPER ENGINE
│       ├── base-mapper.ts
│       ├── field-helpers.ts
│       └── index.ts
├── middleware.ts         # Edge Runtime Middleware xác thực route
├── store/                # Zustand stores (useAuthStore, useUIStore)
└── types/                # Global API types (APIResponse, PaginationResult, etc.)
```

---

## ⭐ Hướng Dẫn Sử Dụng Tầng Type Mapper

### 1. Tại sao cần Mapper?
Thông thường Frontend hay dùng trực tiếp DTO từ Backend:
```ts
// CÁCH CŨ: Dễ gãy khi Backend đổi trường
export function ProductCard({ item }: { item: BackendProductDto }) {
  // Khi Backend đổi item.product_title sang item.title -> Toàn bộ component bị hỏng!
  return <h3>{item.product_title}</h3>;
}
```

### 2. Cách Mapper mới bảo vệ Frontend:
Ta tách biệt thành 2 tầng rõ ràng:
1. `*.dto.ts`: Định nghĩa dữ liệu thô Backend (chấp nhận biến thể, optional, null).
2. `*.model.ts`: Định nghĩa Domain Model sạch của Frontend (camelCase, bắt buộc có giá trị an toàn).
3. `*.mapper.ts`: Dùng `pickField`, `safeString`, `safeNumber`, `safeArray` để chuyển đổi.

### 3. Ví dụ tạo 1 Mapper mới:
```ts
import { BaseMapper, pickField, safeNumber, safeString } from '@/lib/mapper';
import { CustomerDto } from '../types/customer.dto';
import { Customer } from '../types/customer.model';

export class CustomerMapper extends BaseMapper<CustomerDto, Customer> {
  toModel(dto: CustomerDto | null | undefined): Customer {
    return {
      // Tìm theo thứ tự: id -> customer_id -> _id. Không có thì trả về ''
      id: safeString(pickField(dto, ['id', 'customer_id', '_id'], '')),
      
      // Tìm theo: full_name -> name -> username. Không có thì dùng fallback
      name: safeString(pickField(dto, ['full_name', 'name', 'username'], 'Khách hàng')),
      
      // Ép kiểu số an toàn kể cả khi Backend trả về "500000"
      totalSpent: safeNumber(pickField(dto, ['total_spent', 'totalSpent', 'spending'], 0)),
    };
  }
}

export const customerMapper = new CustomerMapper();
```

Khi Backend thay đổi tên trường, bạn **CHỈ CẦN THÊM TÊN MỚI VÀO `pickField`** trong file mapper. Tất cả các Hooks, Store, Components và Tests giữ nguyên 100%!

---

## 🚀 Khởi Chạy Dự Án

1. Di chuyển vào thư mục dự án:
```bash
cd C:\FPT\Project\WDP301
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Khởi động môi trường phát triển:
```bash
npm run dev
```

4. Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)
