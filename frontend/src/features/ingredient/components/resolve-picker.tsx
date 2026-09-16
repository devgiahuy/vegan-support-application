'use client';

import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import type { Ingredient, IngredientResolution } from '../types/ingredient.model';
import { ResolutionMatch } from '@/common/enums';

/**
 * Hiển thị kết quả phân giải tên nguyên liệu.
 * AMBIGUOUS bắt buộc người dùng tự chọn ứng viên — không tự quyết hộ.
 */
export function ResolvePicker({
  resolution,
  onSelect,
}: {
  resolution: IngredientResolution;
  onSelect: (ingredient: Ingredient) => void;
}) {
  if (resolution.match === ResolutionMatch.NONE) {
    return (
      <EmptyState
        title="Không trùng khớp nguyên liệu nào."
        description="Không tìm thấy nguyên liệu khớp với từ khóa đã nhập. Hãy thử từ khóa khác (có hoặc không dấu)."
      />
    );
  }

  if (resolution.match === ResolutionMatch.EXACT && resolution.candidates.length === 1) {
    const only = resolution.candidates[0];
    return (
      <button
        type="button"
        onClick={() => onSelect(only)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-left"
      >
        <span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Trùng khớp: {only.canonicalName}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {only.foodGroupLabel}
            {only.aliases.length > 0 &&
              ` · Còn gọi: ${only.aliases.map((a) => a.alias).join(', ')}`}
          </span>
        </span>
        <Badge className="rounded-full">Chọn</Badge>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Tìm thấy {resolution.candidates.length} ứng viên cho từ khóa {resolution.query} — vui lòng
        chọn đúng nguyên liệu:
      </p>
      <ul className="space-y-2">
        {resolution.candidates.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left hover:border-primary hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm font-medium">{c.canonicalName}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {c.foodGroupLabel}
                  {c.aliases.length > 0 &&
                    ` · Còn gọi: ${c.aliases.map((a) => a.alias).join(', ')}`}
                </span>
              </span>
              <Badge variant="outline" className="rounded-full">
                Chọn
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
