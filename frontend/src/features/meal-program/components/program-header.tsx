'use client';

import React from 'react';
import { Calendar, Target, Clock, CheckCircle2, Archive, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MealProgram } from '../types/meal-program.model';

interface ProgramHeaderProps {
  program: MealProgram;
  onOpenConfirmDialog: () => void;
  onArchiveProgram?: () => void;
  isArchiving?: boolean;
}

export const ProgramHeader: React.FC<ProgramHeaderProps> = ({
  program,
  onOpenConfirmDialog,
  onArchiveProgram,
  isArchiving,
}) => {
  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      case 'secondary':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <Link
          href="/meal-programs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách lộ trình</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Phiên bản: v{program.version}</span>
          <Badge
            variant={getBadgeVariant(program.statusBadgeVariant)}
            className="text-xs px-2.5 py-0.5"
          >
            {program.statusLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {program.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{program.goal}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {program.formattedDateRange || `${program.horizonWeeks} tuần`}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Múi giờ: {program.timezone}
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              Quy mô: {program.horizonWeeks} tuần ({program.weeks.length} tuần đã tạo)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 shrink-0">
          {program.status === 'DRAFT' && (
            <Button
              onClick={onOpenConfirmDialog}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Xác nhận tham gia lộ trình
            </Button>
          )}

          {program.status === 'CONFIRMED' && onArchiveProgram && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchiveProgram}
              disabled={isArchiving}
              className="text-xs text-muted-foreground"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Lưu trữ lộ trình
            </Button>
          )}

          {program.status !== 'DRAFT' && (
            <div className="w-full sm:w-48 space-y-1.5 bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between text-xs font-medium">
                <span>Tuân thủ tổng thể</span>
                <span className="text-primary font-semibold">{program.overallComplianceRate}%</span>
              </div>
              <Progress value={program.overallComplianceRate} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
