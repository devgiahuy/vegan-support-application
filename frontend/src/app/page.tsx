import React from 'react';
import { ProductList } from '@/features/product/components/product-list';
import { MapperTestPanel } from '@/features/product/components/mapper-test-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Database, Shield, Zap, RefreshCw, GitBranch } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-6 md:p-8">
        <div className="max-w-3xl space-y-4">
          <Badge variant="default" className="gap-1.5 py-1 px-3">
            <Zap className="h-3.5 w-3.5" /> Next.js 16 + React 19 + TypeScript
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Cấu Trúc Frontend Chuẩn Enterprise Kèm{' '}
            <span className="text-primary underline decoration-primary/40">Type Mapper Layer</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Dự án được khởi tạo hoàn chỉnh dựa trên cấu trúc modular của <code>smart-wardrobe-fe</code>.
            Tích hợp sẵn Axios Interceptor (Auto Refresh Token Queue, Toast sonner), TanStack Query v5, Zustand Store,
            và đặc biệt nâng cấp tầng <strong>Mapper Type</strong> giúp Frontend hoàn toàn miễn nhiễm khi Backend đổi tên trường hoặc sai lệch kiểu dữ liệu.
          </p>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Network className="h-4 w-4" />
              <span>Axios Interceptors</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Tự động gắn Bearer token, bắt mã 401 với hàng đợi <code>failedQueue</code> chống race condition, hiển thị Sonner toast cho mã lỗi 500, 403, 429, timeout.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Zap className="h-4 w-4" />
              <span>TanStack Query v5</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Quản lý server state, cache data, tự động retry thông minh, hỗ trợ Query Key Factory pattern dễ quản lý và invalidate.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Database className="h-4 w-4" />
              <span>Zustand Stores</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            State management siêu nhẹ, lưu trữ session người dùng và trạng thái UI (sidebar, theme) với middleware <code>persist</code>.
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Shield className="h-4 w-4" />
              <span>Type Mapper Layer</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Bảo vệ UI với <code>pickField()</code>, <code>safeNumber()</code>, <code>safeArray()</code>, tách biệt hoàn toàn Backend DTO với Domain Model.
          </CardContent>
        </Card>
      </div>

      {/* Interactive Mapper Test Panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Live Test: Type Mapper Trong Thực Tế
            </h2>
            <p className="text-xs text-muted-foreground">
              Nhấn các kịch bản bên dưới để xem Mapper chuyển đổi payload lỗi/thiếu trường từ Backend thành dữ liệu sạch.
            </p>
          </div>
        </div>
        <MapperTestPanel />
      </section>

      {/* Demo Feature: Products with TanStack Query */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Feature Mẫu: Danh Sách Sản Phẩm (TanStack Query + Mapper)
            </h2>
            <p className="text-xs text-muted-foreground">
              Dữ liệu được lấy qua API Service, lọc qua Mapper chuyển về Domain Model, và render bởi UI Component.
            </p>
          </div>
        </div>
        <ProductList />
      </section>
    </div>
  );
}
