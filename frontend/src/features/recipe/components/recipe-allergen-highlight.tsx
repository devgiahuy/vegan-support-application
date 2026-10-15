import * as React from 'react';
import { AlertTriangle, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAllergenName } from '@/common/constants/diet-labels';
import type { RecipeAllergen } from '../types/recipe.model';

export interface RecipeAllergenHighlightProps {
  allergens?: RecipeAllergen[];
  allergenCodes?: string[];
  className?: string;
}

/**
 * Component highlight nổi bật phần cảnh báo dị ứng thực phẩm trên trang chi tiết công thức.
 * Tuân thủ quy chuẩn an toàn thực phẩm, màu cảnh báo có độ tương phản cao, dễ nhận biết.
 */
export function RecipeAllergenHighlight({
  allergens: propAllergens,
  allergenCodes = [],
  className,
}: RecipeAllergenHighlightProps) {
  const allergens: RecipeAllergen[] = React.useMemo(() => {
    if (propAllergens && propAllergens.length > 0) {
      return propAllergens;
    }
    return allergenCodes.map((code) => ({
      code,
      name: getAllergenName(code),
    }));
  }, [propAllergens, allergenCodes]);

  if (allergens.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3.5 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300',
          className
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          <strong>An toàn dinh dưỡng:</strong> Không phát hiện thành phần gây dị ứng phổ biến đã ghi
          nhận trong công thức này.
        </span>
      </div>
    );
  }

  return (
    <section
      aria-label="Cảnh báo dị ứng thực phẩm"
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-amber-50/30 p-4 sm:p-5 shadow-sm dark:border-amber-500/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent',
        className
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="h-4 w-4 fill-current" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                Cảnh báo dị ứng thực phẩm
              </h3>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                Công thức có chứa thành phần có thể gây dị ứng cho người mẫn cảm:
              </p>
            </div>
          </div>
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-full px-2.5 py-0.5 shadow-xs">
            Lưu ý an toàn
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {allergens.map((allergen) => (
            <Badge
              key={allergen.code}
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-950 shadow-2xs dark:bg-amber-900/50 dark:text-amber-100"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{allergen.name || allergen.code}</span>
            </Badge>
          ))}
        </div>

        <div className="border-t border-amber-500/20 pt-2 text-[11px] sm:text-xs text-amber-900/70 dark:text-amber-200/70">
          💡 Vui lòng kiểm tra kỹ hoặc chủ động thay thế bằng nguyên liệu an toàn nếu bạn có tiền sử
          mẫn cảm với các chất trên.
        </div>
      </div>
    </section>
  );
}
