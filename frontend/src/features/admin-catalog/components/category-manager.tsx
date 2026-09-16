'use client';

import * as React from 'react';
import { Pencil, Archive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useAdminCategoriesQuery,
  useArchiveCategoryMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '../queries/admin-category.queries';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import type { Category } from '@/features/category/types/category.model';
import { CatalogStatus, CategoryType } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { ReplacementDialog } from './replacement-picker';

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Mọi loại' },
  { value: CategoryType.FOOD_TYPE, label: 'Loại thực phẩm' },
  { value: CategoryType.RECIPE_GROUP, label: 'Nhóm công thức' },
  { value: CategoryType.CONTENT_TOPIC, label: 'Chủ đề nội dung' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Mọi trạng thái' },
  { value: CatalogStatus.ACTIVE, label: 'Đang hoạt động' },
  { value: CatalogStatus.ARCHIVED, label: 'Đã lưu trữ' },
];

/**
 * Quản trị danh mục: list (gồm archived) + tạo/sửa + archive qua replacement.
 * Mọi lỗi nghiệp vụ đọc theo `error.code`.
 */
export function CategoryManager() {
  const [type, setType] = React.useState<string>('ALL');
  const [status, setStatus] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<Category | null>(null);
  const [replacementRequired, setReplacementRequired] = React.useState(false);
  const [archiveError, setArchiveError] = React.useState<string | null>(null);

  // Form state (đơn giản, validate khi submit; schema zod dùng ở tầng refine sau).
  const [name, setName] = React.useState('');
  const [formType, setFormType] = React.useState<CategoryType>(CategoryType.FOOD_TYPE);
  const [slug, setSlug] = React.useState('');
  const [parentId, setParentId] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState('0');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const listQuery = useAdminCategoriesQuery({
    page,
    limit: 10,
    ...(type !== 'ALL' ? { type } : {}),
    ...(status !== 'ALL' ? { status } : {}),
  });
  const treeQuery = useCategoryTreeQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const archiveMutation = useArchiveCategoryMutation();

  const openCreate = () => {
    setEditing(null);
    setName('');
    setFormType(CategoryType.FOOD_TYPE);
    setSlug('');
    setParentId('');
    setSortOrder('0');
    setFormError(null);
    setFieldError(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setFormType(c.type);
    setSlug(c.slug);
    setParentId(c.parentId ?? '');
    setSortOrder(String(c.sortOrder));
    setFormError(null);
    setFieldError(null);
    setDialogOpen(true);
  };

  const mapBackendError = (error: unknown): boolean => {
    const code = getApiErrorCode(error);
    if (code === 'CATEGORY_SLUG_CONFLICT' || code === 'INVALID_CATALOG_NAME') {
      setFieldError(
        code === 'CATEGORY_SLUG_CONFLICT'
          ? 'Slug/tên đã tồn tại trong cùng danh mục cha và loại.'
          : 'Tên không chuẩn hóa được slug hợp lệ. Hãy nhập tên khác.'
      );
      return true;
    }
    if (
      code === 'CATEGORY_TYPE_MISMATCH' ||
      code === 'CATEGORY_DEPTH_EXCEEDED' ||
      code === 'INVALID_CATEGORY_PARENT'
    ) {
      setFormError(
        code === 'CATEGORY_TYPE_MISMATCH'
          ? 'Danh mục con phải cùng loại với danh mục cha.'
          : code === 'CATEGORY_DEPTH_EXCEEDED'
            ? 'Không tạo/chuyển vượt quá hai tầng.'
            : 'Danh mục cha không hợp lệ. Hãy chọn cha đang hoạt động.'
      );
      return true;
    }
    if (code === 'VALIDATION_ERROR') {
      const fields = getApiErrorFields(error);
      const first = fields
        ? Object.values(fields)
            .flat()
            .find((v) => typeof v === 'string')
        : undefined;
      setFormError(
        typeof first === 'string' ? first : 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.'
      );
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFieldError(null);
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setFieldError('Vui lòng nhập tên danh mục.');
      return;
    }
    // Validate cùng-loại ở client khi biết cha (ràng buộc V2).
    if (parentId) {
      const findIn = (nodes: Category[]): Category | null => {
        for (const n of nodes) {
          if (n.id === parentId) return n;
          const found = findIn(n.children);
          if (found) return found;
        }
        return null;
      };
      const parent = findIn(treeQuery.data ?? []);
      if (parent && parent.type !== formType) {
        setFormError('Danh mục con phải cùng loại với danh mục cha.');
        return;
      }
    }
    const payload = {
      name: trimmedName,
      type: formType,
      ...(slug.trim().length > 0 ? { slug: slug.trim() } : {}),
      ...(parentId.length > 0 ? { parentId } : { parentId: null }),
      sortOrder: Number.isNaN(Number(sortOrder)) ? 0 : Number(sortOrder),
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (error) {
      if (!mapBackendError(error)) setFormError('Lưu danh mục thất bại. Vui lòng thử lại.');
    }
  };

  const doArchive = async (target: Category, replacementId?: string) => {
    setArchiveError(null);
    try {
      await archiveMutation.mutateAsync({ id: target.id, replacementId });
      setArchiveTarget(null);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'CATEGORY_REPLACEMENT_REQUIRED') {
        // Item đang được dùng: chuyển dialog sang bước chọn replacement.
        setReplacementRequired(true);
        setArchiveError('Danh mục đang được sử dụng. Hãy chọn danh mục thay thế bên dưới.');
        return;
      }
      if (code === 'INVALID_CATEGORY_REPLACEMENT') {
        setArchiveError('Thay thế không hợp lệ: phải đang hoạt động, cùng loại và cùng tầng.');
        return;
      }
      if (code === 'CATEGORY_REPLACEMENT_CONFLICT') {
        setArchiveError('Thay thế gây xung đột. Đã tải lại cây, vui lòng chọn lại.');
        void treeQuery.refetch();
        return;
      }
      setArchiveError('Lưu trữ thất bại. Vui lòng thử lại.');
    }
  };

  const startArchive = (target: Category) => {
    setArchiveError(null);
    setReplacementRequired(false);
    setArchiveTarget(target);
  };

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.metadata;
  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Danh mục ({meta?.totalItems ?? 0})</CardTitle>
            <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}>
              Tạo danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
          {listQuery.isError && <ErrorFallback onRetry={() => void listQuery.refetch()} />}
          {!listQuery.isLoading && !listQuery.isError && items.length === 0 && (
            <EmptyState
              title="Chưa có danh mục nào."
              description="Tạo danh mục đầu tiên bằng nút bên trên."
            />
          )}

          {items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.slug}</code>
                      </TableCell>
                      <TableCell className="text-xs">{c.typeLabel}</TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === CatalogStatus.ACTIVE ? 'secondary' : 'outline'}
                          className="rounded-full text-[11px]"
                        >
                          {c.status === CatalogStatus.ACTIVE ? 'Đang hoạt động' : 'Đã lưu trữ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Sửa ${c.name}`}
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {c.status === CatalogStatus.ACTIVE && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Lưu trữ ${c.name}`}
                              disabled={archiveMutation.isPending}
                              onClick={() => startArchive(c)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <PaginationNav page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa danh mục' : 'Tạo danh mục mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Tên danh mục</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Món cuốn dinh dưỡng"
              />
              {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Loại</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as CategoryType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.filter((o) => o.value !== 'ALL').map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug (để trống để tự sinh)</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mon-cuon-dinh-duong"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục cha (để trống = gốc)</Label>
              <Select
                value={parentId || 'root'}
                onValueChange={(v) => setParentId(v === 'root' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">-- Danh mục gốc (Cấp 1) --</SelectItem>
                  {(treeQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.typeLabel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chỉ danh mục gốc được chọn làm cha (cây tối đa 2 tầng); con phải cùng loại với cha.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Thứ tự sắp xếp</Label>
              <Input
                id="cat-sort"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={pending}>
              {pending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReplacementDialog
        open={archiveTarget !== null}
        target={archiveTarget}
        tree={treeQuery.data ?? []}
        pending={archiveMutation.isPending}
        serverError={archiveError}
        replacementRequired={replacementRequired}
        onConfirm={(replacementId) => {
          if (archiveTarget) void doArchive(archiveTarget, replacementId);
        }}
        onCancel={() => {
          setArchiveTarget(null);
          setReplacementRequired(false);
          setArchiveError(null);
        }}
      />
    </div>
  );
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between gap-2">
        Không tải được danh sách.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function PaginationNav({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </Button>
      <span className="text-muted-foreground">
        Trang {page}/{totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
