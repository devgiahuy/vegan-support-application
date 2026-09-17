'use client';

import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeRecommendationsQuery } from '../queries/recommendation.queries';
import { RecommendationCard } from './recommendation-card';
import { ConstraintsNote } from './constraints-note';

/**
 * Khối gợi ý trang chủ (member only — guest trả null để giữ khối phổ biến sẵn có).
 * Skeleton đúng kích thước chống CLS; empty khi không còn món hợp lệ.
 */
export function RecommendedForYou() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError } = useHomeRecommendationsQuery();

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <section className="py-10" aria-label="Đang tải gợi ý">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dành riêng cho bạn</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[380px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) return null;

  if (data.items.length === 0) {
    return (
      <section className="py-10">
        <EmptyState
          title="Chưa có gợi ý phù hợp"
          description="Không còn món nào hợp với luật ăn hiện tại của bạn. Hãy nới lỏng bộ lọc hoặc khám phá danh mục món chay."
        />
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="size-4" /> Dành riêng cho bạn
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Món chay hợp khẩu vị
          </h2>
          <div className="mt-1">
            <ConstraintsNote meta={data.meta} />
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.items.slice(0, 4).map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
