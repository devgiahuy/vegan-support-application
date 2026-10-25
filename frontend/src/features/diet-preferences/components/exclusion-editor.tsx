'use client';

import * as React from 'react';
import { Plus, ShieldAlert, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IngredientExclusion } from '../types/diet.model';

/**
 * Quản lý nguyên liệu kiêng. Danh sách kiêng luôn là ràng buộc cứng ở backend.
 * Tên chuẩn hóa trim + lowercase để dedupe trùng.
 */
export function ExclusionEditor({
  value,
  onChange,
}: {
  value: IngredientExclusion[];
  onChange: (v: IngredientExclusion[]) => void;
}) {
  const [name, setName] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const add = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Vui lòng nhập tên nguyên liệu.');
      return;
    }
    if (value.some((e) => e.ingredientName.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('Nguyên liệu này đã có trong danh sách.');
      return;
    }
    setError(null);
    onChange([...value, { ingredientId: null, ingredientName: trimmed, reason: reason.trim() }]);
    setName('');
    setReason('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Label>Nguyên liệu kiêng</Label>
        <Badge variant="secondary" className="gap-1 rounded-full text-[11px]">
          <ShieldAlert className="h-3 w-3" /> Luôn là ràng buộc cứng
        </Badge>
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((e) => (
            <li
              key={e.ingredientName.toLowerCase()}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-secondary-foreground/10 px-3 py-1 text-xs text-secondary-foreground"
            >
              <span className="font-medium">{e.ingredientName}</span>
              {e.reason && (
                <span className="text-[10px] text-muted-foreground bg-background/60 rounded px-1.5 py-0.5">
                  {e.reason}
                </span>
              )}
              <button
                type="button"
                aria-label={`Xóa kiêng ${e.ingredientName}`}
                onClick={() =>
                  onChange(
                    value.filter(
                      (x) => x.ingredientName.toLowerCase() !== e.ingredientName.toLowerCase()
                    )
                  )
                }
                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-background/80 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Chưa có nguyên liệu kiêng nào. Nhập tên nguyên liệu bạn muốn loại trừ hoàn toàn bên dưới.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nguyên liệu, vd: mắm tôm"
          aria-label="Tên nguyên liệu kiêng"
        />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do (tùy chọn)"
          aria-label="Lý do kiêng"
        />
        <Button type="button" variant="outline" className="gap-1 rounded-xl" onClick={add}>
          <Plus className="h-4 w-4" /> Thêm
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
