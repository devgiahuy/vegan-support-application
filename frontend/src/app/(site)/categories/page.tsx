'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryTree } from '@/features/category/components/category-tree';
import { IngredientSearch } from '@/features/ingredient/components/ingredient-search';
import { IngredientResolveSearch } from '@/features/ingredient/components/ingredient-resolve-search';
import { CategoryType } from '@/common/enums';

function parseTypeParam(value: string | null): CategoryType | 'ALL' {
  if (
    value === CategoryType.FOOD_TYPE ||
    value === CategoryType.RECIPE_GROUP ||
    value === CategoryType.CONTENT_TOPIC
  ) {
    return value;
  }
  return 'ALL';
}

/**
 * Trang duyệt cây danh mục public (không cần đăng nhập).
 * Nhận `?type=` để link ngữ cảnh (vd từ sidebar công thức) mở đúng loại.
 */
function CategoriesContent() {
  const searchParams = useSearchParams();
  const [type, setType] = React.useState<CategoryType | 'ALL'>(() =>
    parseTypeParam(searchParams.get('type'))
  );
  const { data, isLoading, isError, refetch } = useCategoryTreeQuery(
    type === 'ALL' ? undefined : type
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Khám phá món ăn, công thức và bài viết theo từng nhóm danh mục.
        </p>
      </div>

      {isLoading && <LoadingState message="Đang tải danh mục..." />}
      {isError && <ErrorState title="Không tải được danh mục." onRetry={() => void refetch()} />}
      {!isLoading && !isError && (
        <CategoryTree tree={data ?? []} type={type} onTypeChange={setType} />
      )}

      <section id="tra-cuu" className="space-y-3 border-t pt-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Tra cứu nguyên liệu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm trong danh sách chuẩn theo từ khóa có hoặc không dấu, lọc theo nhóm thực phẩm.
          </p>
        </div>
        <IngredientSearch />
      </section>

      <section id="phan-giai" className="space-y-3 border-t pt-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Phân giải tên nguyên liệu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập 1 tên để nhận trạng thái: không trùng khớp, trùng duy nhất, hoặc mơ hồ (tự chọn ứng
            viên).
          </p>
        </div>
        <IngredientResolveSearch />
      </section>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<LoadingState message="Đang tải danh mục..." />}>
      <CategoriesContent />
    </Suspense>
  );
}
