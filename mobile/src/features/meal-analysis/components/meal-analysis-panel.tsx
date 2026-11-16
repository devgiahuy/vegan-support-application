import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ChevronRight, FlaskConical, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { getMealAnalysisErrorMessage } from '@/features/meal-plan/utils/meal-plan-errors';
import { useAnalyzeMealPlanMutation, useMealAnalysisQuery } from '../queries/meal-analysis.queries';
import type { MealAnalysisWarning, MealWarningSeverity } from '../types/meal-analysis.model';
import { AnalysisWarningModal } from './analysis-warning-modal';
import { IncompleteDataNotice } from './incomplete-data-notice';

const SEVERITY_STYLES: Record<MealWarningSeverity, { box: string; text: string }> = {
  HIGH: { box: 'bg-destructive/10 border-destructive/30', text: 'text-destructive' },
  CAUTION: { box: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-800 dark:text-amber-300' },
  INFO: { box: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-800 dark:text-sky-300' },
};

const VISIBLE_WARNINGS = 5;

/**
 * Khối "Phân tích dinh dưỡng & an toàn" của thực đơn tuần — đồng bộ các thành phần `meal-analysis` của web:
 * tóm tắt mức độ, danh sách cảnh báo (bấm để xem căn cứ và gợi ý), dữ liệu chưa đầy đủ và nút phân tích lại.
 * Kết quả chỉ mang tính tham khảo; bản cũ (STALE) được báo rõ và yêu cầu phân tích lại theo phiên bản thực đơn.
 */
export function MealAnalysisPanel({ planId, planVersion }: { planId: string; planVersion: number }) {
  const colors = useIconColors();
  const query = useMealAnalysisQuery(planId);
  const analyze = useAnalyzeMealPlanMutation(planId, planVersion);
  const [selected, setSelected] = React.useState<MealAnalysisWarning | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  const analysis = query.data;
  const notFound = query.isError && Boolean(getApiErrorCode(query.error)?.includes('NOT_FOUND'));
  const stale = Boolean(analysis && (analysis.isStale || analysis.planVersion !== planVersion));
  const warnings = analysis?.warnings ?? [];
  const shown = showAll ? warnings : warnings.slice(0, VISIBLE_WARNINGS);

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-xl bg-primary/10">
          <FlaskConical size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">Phân tích dinh dưỡng & an toàn</Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            Đối chiếu thực đơn với mục tiêu dinh dưỡng, ngưỡng an toàn và tương tác nguyên liệu.
          </Text>
        </View>
      </View>

      {query.isLoading ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-sm text-muted-foreground">Đang tải kết quả phân tích...</Text>
        </View>
      ) : null}

      {query.isError && !notFound ? (
        <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <Text className="text-sm text-destructive">{getMealAnalysisErrorMessage(query.error)}</Text>
          <PrimaryButton label="Thử lại" variant="outline" onPress={() => void query.refetch()} />
        </View>
      ) : null}

      {notFound && !analysis ? (
        <View className="rounded-xl border border-dashed border-border p-3">
          <Text className="text-sm text-muted-foreground">Thực đơn này chưa được phân tích.</Text>
        </View>
      ) : null}

      {analysis ? (
        <View className="gap-3">
          {stale ? (
            <View className="flex-row items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <TriangleAlert size={15} color="#b45309" />
              <Text className="flex-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Thực đơn đã thay đổi sau lần phân tích gần nhất. Hãy phân tích lại để có kết quả mới.
              </Text>
            </View>
          ) : null}

          <View className="gap-1 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={15} color={colors.primary} />
              <Text className="flex-1 text-sm font-semibold text-foreground">
                {analysis.summary.statusTitle || (warnings.length === 0 ? 'Không có cảnh báo' : `${warnings.length} cảnh báo`)}
              </Text>
            </View>
            {analysis.summary.statusDetail ? (
              <Text className="text-xs leading-5 text-muted-foreground">{analysis.summary.statusDetail}</Text>
            ) : null}
            <View className="mt-1 flex-row flex-wrap gap-2">
              {analysis.summary.highCount > 0 ? (
                <Text className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  {analysis.summary.highCount} mức cao
                </Text>
              ) : null}
              {analysis.summary.cautionCount > 0 ? (
                <Text className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  {analysis.summary.cautionCount} cần lưu ý
                </Text>
              ) : null}
              {analysis.summary.infoCount > 0 ? (
                <Text className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                  {analysis.summary.infoCount} thông tin
                </Text>
              ) : null}
              <Text className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                Tin cậy {analysis.confidencePercent}%
              </Text>
            </View>
          </View>

          {shown.map((warning) => {
            const style = SEVERITY_STYLES[warning.severity] ?? SEVERITY_STYLES.INFO;
            return (
              <Pressable
                key={warning.id}
                accessibilityRole="button"
                accessibilityLabel={`Xem chi tiết cảnh báo ${warning.title}`}
                onPress={() => setSelected(warning)}
                className={cn('flex-row items-center gap-2 rounded-xl border p-3 active:opacity-80', style.box)}>
                <View className="flex-1">
                  <Text className={cn('text-[11px] font-semibold uppercase', style.text)}>
                    {warning.severityLabel} · {warning.scopeLabel}
                  </Text>
                  <Text className="mt-0.5 text-sm font-semibold text-foreground">{warning.title}</Text>
                  {warning.explanation ? (
                    <Text numberOfLines={2} className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {warning.explanation}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
          {warnings.length > VISIBLE_WARNINGS ? (
            <Pressable onPress={() => setShowAll((value) => !value)} className="items-center py-1">
              <Text className="text-xs font-semibold text-primary">
                {showAll ? 'Thu gọn' : `Xem thêm ${warnings.length - VISIBLE_WARNINGS} cảnh báo`}
              </Text>
            </Pressable>
          ) : null}

          <IncompleteDataNotice notes={analysis.incompleteData} />
          <Text className="text-[11px] italic leading-4 text-muted-foreground">
            {analysis.disclaimer || 'Kết quả chỉ mang tính tham khảo dinh dưỡng, không thay thế tư vấn của chuyên gia y tế.'}
          </Text>
        </View>
      ) : null}

      {analyze.isError ? <Text className="text-xs text-destructive">{getMealAnalysisErrorMessage(analyze.error)}</Text> : null}

      {!query.isLoading ? (
        <PrimaryButton
          label={analyze.isPending ? 'Đang phân tích...' : analysis ? 'Phân tích lại' : 'Phân tích thực đơn'}
          variant={analysis && !stale ? 'outline' : 'primary'}
          loading={analyze.isPending}
          disabled={analyze.isPending}
          icon={<RefreshCw size={15} color={analysis && !stale ? colors.foreground : colors.primaryForeground} />}
          onPress={() => analyze.mutate()}
        />
      ) : null}

      <AnalysisWarningModal warning={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
