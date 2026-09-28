'use client';

import React, { useState, useMemo } from 'react';
import { useInteractionRulesQuery } from '../queries/food-data.queries';
import type {
  InteractionScope,
  FoodRuleSeverity,
  FoodInteractionRuleItem,
} from '../types/food-data.model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface FoodInteractionTableProps {
  initialIngredientId?: string;
  initialScope?: InteractionScope;
  className?: string;
}

export const FoodInteractionTable: React.FC<FoodInteractionTableProps> = ({
  initialIngredientId,
  initialScope,
  className,
}) => {
  const [selectedScope, setSelectedScope] = useState<InteractionScope | 'ALL'>(
    initialScope ?? 'ALL'
  );
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const queryParams = useMemo(() => {
    return {
      ...(selectedScope !== 'ALL' ? { scope: selectedScope } : {}),
      ...(initialIngredientId ? { ingredientId: initialIngredientId } : {}),
      page,
      limit: 20,
    };
  }, [selectedScope, initialIngredientId, page]);

  const { data, isLoading, isError, error, refetch } = useInteractionRulesQuery(queryParams);

  // Client-side filter by keyword (searching both ingredients)
  const filteredRules = useMemo(() => {
    if (!data?.items) return [];
    if (!searchKeyword.trim()) return data.items;

    const term = searchKeyword.toLowerCase().trim();
    return data.items.filter(
      (rule: FoodInteractionRuleItem) =>
        rule.ingredientA.name.toLowerCase().includes(term) ||
        rule.ingredientB.name.toLowerCase().includes(term) ||
        rule.explanation.toLowerCase().includes(term) ||
        (rule.suggestedAction && rule.suggestedAction.toLowerCase().includes(term))
    );
  }, [data?.items, searchKeyword]);

  const renderSeverityBadge = (severity: FoodRuleSeverity, label: string) => {
    switch (severity) {
      case 'WARNING':
        return (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 flex items-center gap-1 font-medium hover:bg-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            {label || 'Cảnh báo'}
          </Badge>
        );
      case 'NOTICE':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 font-medium">
            <Info className="h-3 w-3" />
            {label || 'Lưu ý'}
          </Badge>
        );
      case 'COMPATIBLE':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 font-medium hover:bg-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            {label || 'Hợp khẩu vị'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  const renderScopeBadge = (scope: InteractionScope, label: string) => {
    switch (scope) {
      case 'SAME_DISH':
        return (
          <Badge variant="outline" className="border-rose-400 text-rose-700 dark:text-rose-300">
            Cùng món
          </Badge>
        );
      case 'SAME_MEAL':
        return (
          <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-300">
            Cùng bữa
          </Badge>
        );
      case 'SAME_DAY':
        return (
          <Badge
            variant="outline"
            className="border-purple-400 text-purple-700 dark:text-purple-300"
          >
            Cùng ngày
          </Badge>
        );
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Tra cứu Kiêng kỵ & Tương tác Thực phẩm
            </CardTitle>
            <CardDescription className="mt-1">
              Quy tắc phối hợp nguyên liệu khoa học theo 3 cấp độ phạm vi: Cùng món, Cùng bữa ăn
              hoặc Cùng ngày.
            </CardDescription>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo tên nguyên liệu (vd: Cải bó xôi, Đậu hũ, Trà xanh...)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={selectedScope}
            onValueChange={(val) => {
              setSelectedScope(val as InteractionScope | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Phạm vi kiêng kỵ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phạm vi</SelectItem>
              <SelectItem value="SAME_DISH">Cùng món (SAME_DISH)</SelectItem>
              <SelectItem value="SAME_MEAL">Cùng bữa (SAME_MEAL)</SelectItem>
              <SelectItem value="SAME_DAY">Cùng ngày (SAME_DAY)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Không thể tải dữ liệu quy tắc tương tác</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>
                {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi kết nối máy chủ.'}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                <RotateCcw className="h-3 w-3 mr-1" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredRules.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-muted/20">
            <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold text-base">Không tìm thấy quy tắc tương tác phù hợp</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Không có dữ liệu kiêng kỵ nào khớp với từ khóa tìm kiếm hoặc phạm vi đã chọn. Hãy thử
              tìm từ khóa khác.
            </p>
          </div>
        )}

        {/* Desktop Table View */}
        {!isLoading && !isError && filteredRules.length > 0 && (
          <>
            <div className="hidden md:block rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[220px]">Cặp nguyên liệu</TableHead>
                    <TableHead className="w-[110px]">Phạm vi</TableHead>
                    <TableHead className="w-[130px]">Mức độ</TableHead>
                    <TableHead>Cơ chế khoa học & Khuyến nghị</TableHead>
                    <TableHead className="w-[140px] text-right">Nguồn tài liệu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule: FoodInteractionRuleItem) => (
                    <TableRow key={rule.id} className="hover:bg-muted/30">
                      <TableCell className="align-top font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {rule.ingredientA.name}
                          </span>
                          <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground">
                            {rule.ingredientB.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {renderScopeBadge(rule.scope, rule.scopeLabel)}
                      </TableCell>
                      <TableCell className="align-top">
                        {renderSeverityBadge(rule.severity, rule.severityLabel)}
                      </TableCell>
                      <TableCell className="align-top space-y-1.5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {rule.explanation}
                        </p>
                        {rule.suggestedAction && (
                          <div className="flex items-start gap-1.5 text-xs text-primary font-medium bg-primary/5 p-2 rounded border border-primary/15">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>Gợi ý chế biến:</strong> {rule.suggestedAction}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right text-xs text-muted-foreground">
                        {rule.sourceName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {filteredRules.map((rule: FoodInteractionRuleItem) => (
                <div
                  key={rule.id}
                  className="p-4 border rounded-lg bg-card text-card-foreground shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-base flex-wrap">
                      <span>{rule.ingredientA.name}</span>
                      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{rule.ingredientB.name}</span>
                    </div>
                    {renderSeverityBadge(rule.severity, rule.severityLabel)}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderScopeBadge(rule.scope, rule.scopeLabel)}
                    <span className="text-xs text-muted-foreground">Nguồn: {rule.sourceName}</span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rule.explanation}
                  </p>

                  {rule.suggestedAction && (
                    <div className="flex items-start gap-1.5 text-xs text-primary font-medium bg-primary/5 p-2.5 rounded border border-primary/15">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Gợi ý:</strong> {rule.suggestedAction}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {data?.metadata && data.metadata.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Trang {data.metadata.page} / {data.metadata.totalPages} (Tổng số{' '}
                  {data.metadata.totalItems} quy tắc)
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
  );
};
