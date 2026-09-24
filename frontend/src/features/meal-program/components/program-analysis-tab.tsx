'use client';

import React from 'react';
import { toast } from 'sonner';
import { RefreshCw, Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CumulativeNutritionChart } from './cumulative-nutrition-chart';
import { RepeatedPatternWarnings } from './repeated-pattern-warnings';
import { useReanalyzeMealProgramMutation } from '../queries/meal-program.queries';
import type { MealProgram } from '../types/meal-program.model';

interface ProgramAnalysisTabProps {
  program: MealProgram;
}

export const ProgramAnalysisTab: React.FC<ProgramAnalysisTabProps> = ({ program }) => {
  const reanalyzeMutation = useReanalyzeMealProgramMutation(program.id);
  const analysis = program.cumulativeAnalysis;

  const handleReanalyze = async () => {
    try {
      await reanalyzeMutation.mutateAsync({ expectedVersion: program.version });
      toast.success('Đã cập nhật phân tích dinh dưỡng tích lũy mới nhất!');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi khi phân tích lại. Vui lòng thử lại sau.';
      toast.error(errorMsg);
    }
  };

  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center space-y-4">
        <Sparkles className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Chưa có dữ liệu phân tích tích lũy</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Hệ thống phân tích xu hướng dinh dưỡng dài hạn và kiểm tra tần suất lặp món xuyên suốt
            toàn bộ lộ trình {program.horizonWeeks} tuần.
          </p>
        </div>
        <Button onClick={handleReanalyze} disabled={reanalyzeMutation.isPending}>
          {reanalyzeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Kích hoạt phân tích ngay
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thanh công cụ phân tích */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>Thời điểm phân tích: {analysis.analyzedAtFormatted || analysis.analyzedAt}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleReanalyze}
          disabled={reanalyzeMutation.isPending}
          className="text-xs"
        >
          {reanalyzeMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Đang tính toán lại...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Cập nhật phân tích mới
            </>
          )}
        </Button>
      </div>

      {/* Biểu đồ phân bổ dinh dưỡng tích lũy */}
      <CumulativeNutritionChart analysis={analysis} weeks={program.weeks} />

      {/* Cảnh báo lặp món */}
      <RepeatedPatternWarnings warnings={analysis.repeatedPatternWarnings} />
    </div>
  );
};
