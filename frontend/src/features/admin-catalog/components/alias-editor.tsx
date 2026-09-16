'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';
import { useAddAliasMutation, useDeleteAliasMutation } from '../queries/admin-ingredient.queries';
import { getApiErrorCode } from '@/lib/api-error';

/**
 * Quản lý tên gọi khác của 1 nguyên liệu: thêm (validate trùng trim+lowercase)
 * và xóa (xác nhận trước). Xóa thành công (204) cập nhật ngay qua invalidate.
 */
export function AliasEditor({ ingredient }: { ingredient: Ingredient }) {
  const [alias, setAlias] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const addMutation = useAddAliasMutation();
  const deleteMutation = useDeleteAliasMutation();

  const handleAdd = async () => {
    const normalized = alias.trim();
    if (normalized.length === 0) {
      setError('Vui lòng nhập tên gọi khác.');
      return;
    }
    if (
      ingredient.aliases.some((a) => a.alias.trim().toLowerCase() === normalized.toLowerCase()) ||
      ingredient.canonicalName.trim().toLowerCase() === normalized.toLowerCase()
    ) {
      setError('Tên này đã tồn tại (kể cả khác dấu cách viết).');
      return;
    }
    setError(null);
    try {
      await addMutation.mutateAsync({ id: ingredient.id, alias: normalized });
      setAlias('');
    } catch (err) {
      if (getApiErrorCode(err) === 'INGREDIENT_ALIAS_CONFLICT') {
        setError('Tên gọi khác đã tồn tại trên nguyên liệu này.');
        return;
      }
      setError('Thêm tên gọi khác thất bại. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (aliasId: string) => {
    if (!aliasId) {
      setError('Tên gọi này chưa có định danh để xóa. Hãy tải lại danh sách.');
      return;
    }
    setError(null);
    try {
      await deleteMutation.mutateAsync({ id: ingredient.id, aliasId });
      setConfirmId(null);
    } catch {
      setError('Xóa tên gọi khác thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-3">
      <Label>Tên gọi khác ({ingredient.aliases.length})</Label>

      {ingredient.aliases.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {ingredient.aliases.map((a, i) => {
            const key = a.id || `${a.alias}-${i}`;
            const confirming = confirmId === key;
            return (
              <li
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
              >
                {confirming ? (
                  <>
                    <span>Xóa tên gọi: {a.alias}?</span>
                    <button
                      type="button"
                      className="font-semibold text-destructive hover:underline"
                      disabled={deleteMutation.isPending}
                      onClick={() => void handleDelete(a.id)}
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setConfirmId(null)}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    {a.alias}
                    <button
                      type="button"
                      aria-label={`Xóa tên gọi ${a.alias}`}
                      onClick={() => setConfirmId(key)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Thêm tên gọi khác, vd: lạc"
          aria-label="Tên gọi khác mới"
          maxLength={200}
        />
        <Button
          type="button"
          variant="outline"
          className="gap-1 rounded-xl"
          disabled={addMutation.isPending}
          onClick={() => void handleAdd()}
        >
          <Plus className="h-4 w-4" /> Thêm
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
