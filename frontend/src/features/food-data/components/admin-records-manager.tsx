'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  RotateCcw,
  Pencil,
  Archive,
  AlertTriangle,
  Upload,
  Database,
  Search,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRecordsQuery, useArchiveAdminRecordMutation } from '../queries/food-data.queries';
import type { FoodDataRecordKind, AdminRecordItem } from '../types/food-data.model';
import { AdminRecordDialog } from './admin-record-dialog';
import { AdminImportManager } from './admin-import-manager';

const KIND_OPTIONS: { value: FoodDataRecordKind; label: string }[] = [
  { value: 'NUTRIENT', label: 'Vi chất (NUTRIENT)' },
  { value: 'SOURCE', label: 'Nguồn dữ liệu (SOURCE)' },
  { value: 'COOKING_METHOD', label: 'Phương pháp nấu (COOKING_METHOD)' },
  { value: 'INTERACTION_RULE', label: 'Quy tắc kiêng kỵ (INTERACTION_RULE)' },
  { value: 'REFERENCE_INTAKE', label: 'Nhu cầu khuyến nghị (REFERENCE_INTAKE)' },
  { value: 'INGREDIENT_GUIDELINE', label: 'Hướng dẫn an toàn (INGREDIENT_GUIDELINE)' },
  { value: 'HOUSEHOLD_CONVERSION', label: 'Quy đổi khẩu phần (HOUSEHOLD_CONVERSION)' },
  { value: 'RETENTION_FACTOR', label: 'Hệ số bảo tồn (RETENTION_FACTOR)' },
  { value: 'YIELD_FACTOR', label: 'Hệ số hao hụt (YIELD_FACTOR)' },
  { value: 'INGREDIENT_PROFILE', label: 'Hồ sơ nguyên liệu (INGREDIENT_PROFILE)' },
  { value: 'NUTRIENT_VALUE', label: 'Giá trị dinh dưỡng (NUTRIENT_VALUE)' },
];

export const AdminRecordsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'import'>('records');
  const [selectedKind, setSelectedKind] = useState<FoodDataRecordKind>('NUTRIENT');
  const [page, setPage] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AdminRecordItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminRecordsQuery({
    kind: selectedKind,
    page,
    limit: 20,
  });

  const archiveMutation = useArchiveAdminRecordMutation();

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (record: AdminRecordItem) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleArchive = async (record: AdminRecordItem) => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn lưu trữ / đánh dấu thay thế bản ghi "${record.displayName || record.id}" không?`
    );
    if (!confirm) return;

    try {
      await archiveMutation.mutateAsync({
        id: record.id,
        kind: selectedKind,
      });
      toast.success(`Đã lưu trữ bản ghi ${record.displayName || record.id}`);
      void refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lưu trữ bản ghi thất bại.';
      toast.error(msg);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đang hoạt động
          </Badge>
        );
      case 'STAGED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Chờ duyệt
          </Badge>
        );
      case 'ARCHIVED':
      case 'SUPERSEDED':
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
            <Ban className="h-3 w-3" />
            Đã lưu trữ
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredItems = (data?.items || []).filter((item: AdminRecordItem) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase().trim();
    return (
      item.displayName.toLowerCase().includes(term) ||
      item.codeOrId.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'records' | 'import')}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Quản trị Dữ liệu Dinh dưỡng Chuẩn (Food & Nutrient Records)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toàn quyền quản trị danh mục dưỡng chất, nguồn tài liệu, quy tắc kiêng kỵ và nhập dữ
              liệu tự động.
            </p>
          </div>

          <TabsList>
            <TabsTrigger value="records" className="gap-1.5">
              <Database className="h-4 w-4" />
              Danh mục bản ghi
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Gói nhập dữ liệu (Import)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Records Table */}
        <TabsContent value="records" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <div className="w-64">
                    <Select
                      value={selectedKind}
                      onValueChange={(val) => {
                        setSelectedKind(val as FoodDataRecordKind);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại bản ghi" />
                      </SelectTrigger>
                      <SelectContent>
                        {KIND_OPTIONS.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Tìm theo tên hoặc mã..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Làm mới
                  </Button>
                  <Button size="sm" onClick={handleOpenCreate} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Thêm bản ghi
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading && (
                <div className="space-y-2 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )}

              {isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Không thể tải danh sách bản ghi</AlertTitle>
                  <AlertDescription className="flex items-center justify-between mt-2">
                    <span>{error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}</span>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && !isError && filteredItems.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                  <Database className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h4 className="font-semibold text-base">Chưa có bản ghi nào cho phân loại này</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhấn nút &ldquo;Thêm bản ghi&rdquo; để khởi tạo dữ liệu chuẩn đầu tiên.
                  </p>
                  <Button size="sm" className="mt-3 gap-1" onClick={handleOpenCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Tạo bản ghi mới
                  </Button>
                </div>
              )}

              {!isLoading && !isError && filteredItems.length > 0 && (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[140px]">Mã / Code</TableHead>
                          <TableHead>Tên hiển thị</TableHead>
                          <TableHead className="w-[120px]">Trạng thái</TableHead>
                          <TableHead className="w-[130px]">Ngày hiệu lực</TableHead>
                          <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((record: AdminRecordItem) => (
                          <TableRow key={record.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs font-semibold">
                              {record.codeOrId}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm text-foreground">
                                {record.displayName || '—'}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {record.id}
                              </div>
                            </TableCell>
                            <TableCell>{renderStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {record.effectiveFrom || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenEdit(record)}
                                  title="Chỉnh sửa thay thế"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleArchive(record)}
                                  title="Lưu trữ / Thay thế (Archive)"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {data?.metadata && data.metadata.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-xs text-muted-foreground">
                        Trang {data.metadata.page} / {data.metadata.totalPages} (Tổng số{' '}
                        {data.metadata.totalItems} bản ghi)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.metadata.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Trang trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.metadata.page >= data.metadata.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Trang sau
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Automatic Data Import (US5) */}
        <TabsContent value="import" className="mt-4">
          <AdminImportManager
            onImportCommitted={() => {
              void refetch();
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Admin Record Dialog */}
      <AdminRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialKind={selectedKind}
        record={editingRecord}
        onSuccess={() => {
          void refetch();
        }}
      />
    </div>
  );
};
