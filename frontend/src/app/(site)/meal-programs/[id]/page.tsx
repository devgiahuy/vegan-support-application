'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, CalendarDays, LineChart, RefreshCw } from 'lucide-react';
import {
  useMealProgramDetailQuery,
  useUpdateMealProgramMutation,
} from '@/features/meal-program/queries/meal-program.queries';
import { ProgramHeader } from '@/features/meal-program/components/program-header';
import { ProgramTimelineView } from '@/features/meal-program/components/program-timeline-view';
import { WeekPlanView } from '@/features/meal-program/components/week-plan-view';
import { DayMealChecklist } from '@/features/meal-program/components/day-meal-checklist';
import { ProgramAnalysisTab } from '@/features/meal-program/components/program-analysis-tab';
import { ProgramConfirmDialog } from '@/features/meal-program/components/program-confirm-dialog';
import { RegenerateWeekDialog } from '@/features/meal-program/components/regenerate-week-dialog';
import { DownstreamInvalidationBanner } from '@/features/meal-program/components/downstream-invalidation-banner';
import { VersionConflictModal } from '@/features/meal-program/components/version-conflict-modal';

interface MealProgramDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MealProgramDetailPage({ params }: MealProgramDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const programId = resolvedParams.id;

  const {
    data: program,
    isLoading,
    isError,
    error,
    refetch,
  } = useMealProgramDetailQuery(programId);

  const updateMutation = useUpdateMealProgramMutation(programId);

  // States
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [regenerateWeekNumber, setRegenerateWeekNumber] = useState<number | null>(null);
  const [versionConflictOpen, setVersionConflictOpen] = useState<boolean>(false);

  const handleArchiveProgram = async () => {
    if (!program) return;
    try {
      await updateMutation.mutateAsync({
        status: 'ARCHIVED',
        version: program.version,
      });
      toast.success('Đã lưu trữ lộ trình dinh dưỡng.');
      router.push('/meal-programs');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu trữ lộ trình.';
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-80 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-4">
        <div className="p-8 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
          <p className="text-destructive font-medium text-lg">Không tìm thấy lộ trình dinh dưỡng</p>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : 'Lộ trình không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
          <button
            onClick={() => router.push('/meal-programs')}
            className="text-xs text-primary font-semibold hover:underline block mx-auto pt-2"
          >
            Quay lại danh sách lộ trình
          </button>
        </div>
      </div>
    );
  }

  const selectedWeek =
    program.weeks.find((w) => w.weekNumber === selectedWeekNumber) || program.weeks[0];
  const isDraft = program.status === 'DRAFT';
  const hasInvalidatedWeeks = program.weeks.some((w) => w.isDownstreamInvalidated);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Tiêu đề & Thông tin tổng quan lộ trình */}
      <ProgramHeader
        program={program}
        onOpenConfirmDialog={() => setConfirmDialogOpen(true)}
        onArchiveProgram={handleArchiveProgram}
        isArchiving={updateMutation.isPending}
      />

      {/* Cảnh báo vô hiệu hóa hạ lưu */}
      <DownstreamInvalidationBanner
        programId={program.id}
        version={program.version}
        isInvalidated={hasInvalidatedWeeks || Boolean(program.cumulativeAnalysis?.isInvalidated)}
      />

      {/* Tabs điều hướng chính */}
      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList className="grid w-full sm:w-[480px] grid-cols-3">
          <TabsTrigger value="menu" className="flex items-center gap-1.5 text-xs">
            <Utensils className="w-3.5 h-3.5" />
            Thực đơn tuần
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5" />
            Dòng thời gian
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1.5 text-xs">
            <LineChart className="w-3.5 h-3.5" />
            Phân tích tích lũy
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Thực đơn các tuần */}
        <TabsContent value="menu" className="space-y-6">
          {/* Thanh chọn tuần */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 font-medium">Chọn tuần:</span>
              {program.weeks.map((w) => (
                <button
                  key={w.weekNumber}
                  type="button"
                  onClick={() => setSelectedWeekNumber(w.weekNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedWeekNumber === w.weekNumber
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tuần {w.weekNumber}
                  {w.status === 'COMPLETED' && ' ✓'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRegenerateWeekNumber(selectedWeekNumber)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                <span>Sinh lại tuần {selectedWeekNumber}</span>
              </button>
            </div>
          </div>

          {/* Chi tiết thực đơn tuần đã chọn */}
          {selectedWeek && (
            <WeekPlanView
              week={selectedWeek}
              isDraft={isDraft}
              onOpenRegenerateModal={(wNum) => setRegenerateWeekNumber(wNum)}
            />
          )}

          {/* Checklist đánh dấu bữa ăn (nếu lộ trình đang hoạt động) */}
          {program.status === 'CONFIRMED' && selectedWeek && (
            <DayMealChecklist
              programId={program.id}
              week={selectedWeek}
              version={program.version}
            />
          )}
        </TabsContent>

        {/* Tab 2: Dòng thời gian tuần */}
        <TabsContent value="timeline" className="space-y-6">
          <ProgramTimelineView
            weeks={program.weeks}
            selectedWeekNumber={selectedWeekNumber}
            onSelectWeek={(wNum) => {
              setSelectedWeekNumber(wNum);
            }}
          />
        </TabsContent>

        {/* Tab 3: Phân tích dinh dưỡng tích lũy & Lặp món */}
        <TabsContent value="analysis" className="space-y-6">
          <ProgramAnalysisTab program={program} />
        </TabsContent>
      </Tabs>

      {/* Modals & Dialogs */}
      <ProgramConfirmDialog
        program={program}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
      />

      <RegenerateWeekDialog
        programId={program.id}
        version={program.version}
        weekNumber={regenerateWeekNumber}
        open={regenerateWeekNumber !== null}
        onOpenChange={(open) => {
          if (!open) setRegenerateWeekNumber(null);
        }}
      />

      <VersionConflictModal
        open={versionConflictOpen}
        onOpenChange={setVersionConflictOpen}
        onReload={() => refetch()}
      />
    </div>
  );
}
