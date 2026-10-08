import * as React from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarRange, CheckCircle2, Lock, Pencil, RefreshCw } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { programStatusStyle } from '@/features/meal-program/components/program-card';
import { ProgramAnalysisPanel } from '@/features/meal-program/components/program-analysis-panel';
import { ProgramTimeline } from '@/features/meal-program/components/program-timeline';
import { ProgramWeekPanel } from '@/features/meal-program/components/program-week-panel';
import {
  useMealProgramDetailQuery,
  useUpdateMealProgramMutation,
} from '@/features/meal-program/queries/meal-program.queries';
import type {
  MealProgram,
  MealProgramAction,
  ProgramAlternative,
  ProgramWeek,
} from '@/features/meal-program/types/meal-program.model';
import {
  getMealProgramErrorMessage,
  isMealProgramVersionConflict,
} from '@/features/meal-program/utils/meal-program-errors';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type DetailTab = 'weeks' | 'timeline' | 'analysis';

const TABS: { value: DetailTab; label: string }[] = [
  { value: 'weeks', label: 'Thực đơn tuần' },
  { value: 'timeline', label: 'Dòng thời gian' },
  { value: 'analysis', label: 'Phân tích' },
];

function RenameModal({
  initialTitle,
  isPending,
  onClose,
  onSubmit,
}: {
  initialTitle: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}) {
  const colors = useIconColors();
  const [title, setTitle] = React.useState(initialTitle);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-card p-5">
          <Text className="text-base font-bold text-foreground">Đổi tên lộ trình</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            autoFocus
            placeholder="Tên lộ trình"
            placeholderTextColor={colors.mutedForeground}
            className="mt-3 h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground"
          />
          <View className="mt-4 flex-row gap-2">
            <PrimaryButton label="Hủy" variant="outline" className="flex-1" onPress={onClose} />
            <PrimaryButton
              label="Lưu"
              className="flex-1"
              loading={isPending}
              disabled={title.trim().length < 1}
              onPress={() => onSubmit(title)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Chi tiết lộ trình nhiều tuần — đồng bộ `meal-programs/[id]` của web (header + 3 tab) theo đúng hợp đồng
 * backend: chọn phương án, sinh thêm phương án cho tuần, phân tích lại, đổi tên và xác nhận (khóa nội dung).
 * Mọi thay đổi gửi kèm `expectedVersion`; nếu có xung đột phiên bản thì tải lại lộ trình.
 */
export default function MealProgramDetailScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = typeof id === 'string' ? id : '';
  const { data: program, error, isLoading, isError, refetch, isRefetching } = useMealProgramDetailQuery(programId);
  const updateMutation = useUpdateMealProgramMutation(programId);

  const [tab, setTab] = React.useState<DetailTab>('weeks');
  const [selectedWeekIndex, setSelectedWeekIndex] = React.useState(0);
  const [renameOpen, setRenameOpen] = React.useState(false);

  const run = async (program: MealProgram, action: MealProgramAction, successMessage?: string): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ action, expectedVersion: program.version });
      if (successMessage) Alert.alert('Đã cập nhật', successMessage);
      return true;
    } catch (mutationError) {
      Alert.alert('Không thực hiện được', getMealProgramErrorMessage(mutationError));
      if (isMealProgramVersionConflict(mutationError)) void refetch();
      return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để xem lộ trình</Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-6">
          <LoadingState message="Đang tải lộ trình..." />
        </View>
      </SiteScreen>
    );
  }

  if (isError || !program) {
    return (
      <SiteScreen>
        <View className="gap-3 px-5 pt-6">
          <Link href={'/meal-programs' as Href} asChild>
            <Pressable className="flex-row items-center gap-1.5">
              <ArrowLeft size={15} color={colors.foreground} />
              <Text className="text-xs font-semibold text-foreground">Danh sách lộ trình</Text>
            </Pressable>
          </Link>
          <ErrorState
            title="Không tìm thấy lộ trình."
            description={getMealProgramErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        </View>
      </SiteScreen>
    );
  }

  const busy = updateMutation.isPending;
  const style = programStatusStyle(program.status);
  const allWeeksChosen =
    program.weeks.length > 0 && program.weeks.every((week) => week.status === 'READY' && week.selectedRank !== null);
  const staleFrom = program.analysis?.isStale ? program.analysis.invalidatedFromWeekNumber : null;
  const hasStaleWeeks = program.weeks.some((week) => week.isProjectionStale) || Boolean(program.analysis?.isStale);

  const selectAlternative = (week: ProgramWeek, alternative: ProgramAlternative) => {
    void run(program, { type: 'SELECT_ALTERNATIVE', weekIndex: week.weekIndex, alternativeRank: alternative.rank });
  };

  const regenerate = (week: ProgramWeek) => {
    Alert.alert(
      `Sinh thêm phương án cho tuần ${week.weekNumber}?`,
      'Hệ thống tạo một phương án mới cho tuần này. Mỗi tuần chỉ được sinh thêm một số lượt giới hạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Sinh phương án', onPress: () => void run(program, { type: 'REGENERATE_WEEK', weekIndex: week.weekIndex }) },
      ]
    );
  };

  const confirmProgram = () => {
    Alert.alert(
      'Xác nhận lộ trình?',
      'Sau khi xác nhận, các phương án đã chọn được khóa lại và không thể chỉnh sửa. Muốn đổi nội dung bạn cần tạo lộ trình mới.',
      [
        { text: 'Xem lại', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => void run(program, { type: 'CONFIRM' }, 'Lộ trình đã được xác nhận và khóa nội dung.'),
        },
      ]
    );
  };

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <Link href={'/meal-programs' as Href} asChild>
            <Pressable className="flex-row items-center gap-1.5">
              <ArrowLeft size={15} color={colors.foreground} />
              <Text className="text-xs font-semibold text-foreground">Danh sách lộ trình</Text>
            </Pressable>
          </Link>
          <Pressable
            disabled={busy || isRefetching}
            onPress={() => void refetch()}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <RefreshCw size={15} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-foreground">{program.title}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <CalendarRange size={13} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">
                  {program.rangeLabel} · {program.goalLabel} · {program.horizonWeeks} tuần
                </Text>
              </View>
            </View>
            <View className={cn('rounded-full px-2.5 py-1', style.badge)}>
              <Text className={cn('text-xs font-semibold', style.text)}>{program.statusLabel}</Text>
            </View>
          </View>

          <Text className="text-xs text-muted-foreground">
            {program.readyWeeks}/{program.horizonWeeks} tuần sẵn sàng
            {program.failedWeeks > 0 ? ` · ${program.failedWeeks} tuần lỗi` : ''} · bản {program.version}
          </Text>

          {program.isConfirmed ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-emerald-500/10 p-3">
              <Lock size={14} color="#059669" />
              <Text className="flex-1 text-xs text-emerald-700">
                Lộ trình đã xác nhận và khóa nội dung. Muốn thay đổi, hãy tạo lộ trình mới.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Pressable
                  disabled={busy}
                  onPress={() => setRenameOpen(true)}
                  className="flex-row items-center gap-1.5 rounded-xl border border-input px-3 py-2.5">
                  <Pencil size={14} color={colors.foreground} />
                  <Text className="text-xs font-semibold text-foreground">Đổi tên</Text>
                </Pressable>
                <PrimaryButton
                  label="Xác nhận lộ trình"
                  className="h-10 flex-1"
                  loading={busy}
                  disabled={!allWeeksChosen}
                  icon={<CheckCircle2 size={15} color={colors.primaryForeground} />}
                  onPress={confirmProgram}
                />
              </View>
              {!allWeeksChosen ? (
                <Text className="text-[11px] leading-relaxed text-muted-foreground">
                  Cần xử lý các tuần bị lỗi và chọn một phương án cho mọi tuần trước khi xác nhận.
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {hasStaleWeeks && !program.isConfirmed ? (
          <View className="gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <Text className="text-sm font-semibold text-amber-900">Một số tuần cần được phân tích lại</Text>
            <Text className="text-xs leading-relaxed text-amber-800">
              {staleFrom !== null ? `Từ tuần ${staleFrom} trở đi dữ liệu đã cũ vì phương án trước đó thay đổi. ` : ''}
              Phân tích lại để cập nhật số liệu cho các tuần sau.
            </Text>
            <PrimaryButton
              label="Phân tích lại ngay"
              loading={busy}
              className="h-10"
              onPress={() => void run(program, { type: 'REANALYZE' })}
            />
          </View>
        ) : null}

        <View className="flex-row gap-2">
          {TABS.map((item) => {
            const selected = tab === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setTab(item.value)}
                className={cn('flex-1 items-center rounded-xl py-2.5', selected ? 'bg-primary' : 'bg-muted')}>
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    selected ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'weeks' ? (
          <ProgramWeekPanel
            weeks={program.weeks}
            selectedWeekIndex={selectedWeekIndex}
            onSelectWeek={setSelectedWeekIndex}
            locked={program.isConfirmed}
            busy={busy}
            onSelectAlternative={selectAlternative}
            onRegenerate={regenerate}
          />
        ) : null}

        {tab === 'timeline' ? (
          <ProgramTimeline
            weeks={program.weeks}
            selectedWeekIndex={selectedWeekIndex}
            onSelectWeek={(weekIndex) => {
              setSelectedWeekIndex(weekIndex);
              setTab('weeks');
            }}
          />
        ) : null}

        {tab === 'analysis' ? (
          <ProgramAnalysisPanel
            program={program}
            busy={busy}
            onReanalyze={() => void run(program, { type: 'REANALYZE' }, 'Đã phân tích lại lộ trình.')}
          />
        ) : null}
      </View>

      {renameOpen ? (
        <RenameModal
          initialTitle={program.title}
          isPending={busy}
          onClose={() => setRenameOpen(false)}
          onSubmit={async (title) => {
            const ok = await run(program, { type: 'UPDATE_METADATA', title });
            if (ok) setRenameOpen(false);
          }}
        />
      ) : null}
    </SiteScreen>
  );
}
