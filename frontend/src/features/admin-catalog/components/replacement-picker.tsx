'use client';

import * as React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/features/category/types/category.model';
import { CatalogStatus } from '@/common/enums';

/**
 * Danh sách ứng viên thay thế: cùng loại, cùng tầng (gốc/con) với item bị
 * archive, đang ACTIVE và khác chính nó.
 */
export function filterReplacementCandidates(tree: Category[], target: Category): Category[] {
  const out: Category[] = [];
  const sameLevel = (c: Category) => (c.parentId === null) === (target.parentId === null);

  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (
        node.id !== target.id &&
        node.status === CatalogStatus.ACTIVE &&
        node.type === target.type &&
        sameLevel(node)
      ) {
        out.push(node);
      }
      if (node.children.length > 0) walk(node.children);
    }
  };
  walk(tree);
  return out;
}

/**
 * Dialog lưu trữ 2 bước: xác nhận trước, chỉ hiện picker thay thế khi backend
 * báo `CATEGORY_REPLACEMENT_REQUIRED` (item đang được nội dung dùng).
 * Gọi `onConfirm(replacementId?)`; parent tự gọi lại archive và xử lý mã lỗi
 * (`INVALID_CATEGORY_REPLACEMENT` → chọn lại, `CATEGORY_REPLACEMENT_CONFLICT` → refresh cây).
 */
export function ReplacementDialog({
  open,
  target,
  tree,
  pending,
  serverError,
  replacementRequired,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  target: Category | null;
  tree: Category[];
  pending: boolean;
  serverError: string | null;
  /** true = bắt buộc chọn thay thế (backend đã từ chối archive trực tiếp). */
  replacementRequired: boolean;
  onConfirm: (replacementId?: string) => void;
  onCancel: () => void;
}) {
  const [replacementId, setReplacementId] = React.useState('');
  // Reset lựa chọn mỗi khi dialog mở (pattern adjust-during-render, không dùng effect).
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReplacementId('');
  }
  const candidates = React.useMemo(
    () => (target ? filterReplacementCandidates(tree, target) : []),
    [tree, target]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {replacementRequired ? 'Chọn danh mục thay thế' : `Lưu trữ "${target?.name}"?`}
          </DialogTitle>
          <DialogDescription>
            {replacementRequired ? (
              <>
                Danh mục {target?.name} đang được nội dung sử dụng. Hãy chọn danh mục cùng loại,
                cùng tầng để thay thế trước khi lưu trữ.
              </>
            ) : (
              <>
                Danh mục sẽ biến mất khỏi cây public nhưng vẫn còn trong danh sách admin với trạng
                thái đã lưu trữ. Thao tác này không thể hoàn tác ở MVP.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {replacementRequired && (
          <div className="space-y-1.5">
            <Label>Danh mục thay thế</Label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục thay thế" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Không có ứng viên cùng loại/cùng tầng đang hoạt động.
              </p>
            )}
          </div>
        )}

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Hủy
          </Button>
          <Button
            disabled={
              pending || (replacementRequired && (!replacementId || candidates.length === 0))
            }
            onClick={() => onConfirm(replacementRequired ? replacementId : undefined)}
          >
            {pending ? 'Đang lưu trữ...' : 'Xác nhận lưu trữ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
