import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { CircleAlert, CircleCheck, Pencil, RefreshCw, Salad, Sparkles, Undo2 } from 'lucide-react-native';

import { ErrorState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import {
  useRecalculateReviewNutritionMutation,
  useReviewNutritionPanelQuery,
  useUpdateReviewNutritionMutation,
} from '../queries/content-review.queries';
import {
  ReviewNutritionJobState,
  ReviewNutritionOrigin,
  type ReviewNutritionJob,
  type ReviewNutritionMetric,
  type ReviewNutritionPanel as ReviewNutritionPanelModel,
} from '../types/review-nutrition.model';
import { getReviewNutritionErrorMessage } from '../utils/content-review-errors';
import {
  diffNutritionDrafts,
  formatNutritionNumber,
  formatNutritionValue,
  initialNutritionDrafts,
  parseNutritionDraft,
  type NutritionDrafts,
} from '../utils/review-nutrition-draft';

const ORIGIN_TONE: Record<ReviewNutritionOrigin, { box: string; text: string }> = {
  [ReviewNutritionOrigin.CANONICAL_CALCULATED]: { box: 'border-emerald-500/30 bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  [ReviewNutritionOrigin.AI_ESTIMATED]: { box: 'border-amber-500/30 bg-amber-500/10', text: 'text-amber-800 dark:text-amber-300' },
  [ReviewNutritionOrigin.VERIFIED_OVERRIDE]: { box: 'border-sky-500/30 bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300' },
  [ReviewNutritionOrigin.USER_PROVIDED]: { box: 'border-border bg-muted', text: 'text-muted-foreground' },
  [ReviewNutritionOrigin.UNKNOWN]: { box: 'border-border bg-muted', text: 'text-muted-foreground' },
};

function JobStatus({ job }: { job: ReviewNutritionJob | null }) {
  const colors = useIconColors();
  if (!job) return null;
  const tone = job.isFailed
    ? 'border-destructive/30 bg-destructive/10'
    : job.isActive
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-border bg-muted';
  const textTone = job.isFailed ? 'text-destructive' : job.isActive ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground';
  return (
    <View accessibilityLiveRegion="polite" className={cn('gap-1 rounded-xl border p-3', tone)}>
      <View className="flex-row flex-wrap items-center gap-2">
        {job.isActive ? (
          <ActivityIndicator size="small" color={colors.cta} />
        ) : job.isFailed ? (
          <CircleAlert size={14} color={colors.destructive} />
        ) : (
          <Sparkles size={14} color={colors.mutedForeground} />
        )}
        <Text className={cn('text-xs font-semibold', textTone)}>
          {job.stateLabel} (lượt {job.attemptCount}/{job.maxAttempts})
        </Text>
      </View>
      {job.state === ReviewNutritionJobState.RETRY_SCHEDULED ? (
        <Text className={cn('text-xs', textTone)}>Thử lại lúc {job.formattedNextAttemptAt}.</Text>
      ) : null}
      {job.errorLabel && job.state !== ReviewNutritionJobState.SUCCEEDED ? (
        <Text className={cn('text-xs', textTone)}>Lý do: {job.errorLabel}.</Text>
      ) : null}
      {job.isActive ? (
        <Text className={cn('text-xs opacity-80', textTone)}>Bạn vẫn có thể nhập tay và duyệt khi đủ chỉ số, không cần chờ AI.</Text>
      ) : null}
    </View>
  );
}

function MetricRow({
  metric,
  editing,
  draft,
  onDraftChange,
  onClearOverride,
  clearing,
}: {
  metric: ReviewNutritionMetric;
  editing: boolean;
  draft: string | undefined;
  onDraftChange: (value: string) => void;
  onClearOverride: () => void;
  clearing: boolean;
}) {
  const colors = useIconColors();
  const invalid = editing && parseNutritionDraft(draft) === 'invalid';
  const origin = metric.finalOrigin ? ORIGIN_TONE[metric.finalOrigin] : null;
  return (
    <View className={cn('gap-2 rounded-xl border p-3', metric.isMissing ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/20')}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground">{metric.label}</Text>
          <View className="flex-row flex-wrap items-center gap-1.5">
            {origin ? (
              <View className={cn('rounded-full border px-2 py-0.5', origin.box)}>
                <Text className={cn('text-[10px] font-semibold', origin.text)}>{metric.finalOriginLabel}</Text>
              </View>
            ) : (
              <View className="rounded-full bg-destructive/10 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-destructive">Còn trống</Text>
              </View>
            )}
            {metric.confidencePercent !== null && !metric.override ? (
              <Text className="text-[11px] text-muted-foreground">Tin cậy {metric.confidencePercent}%</Text>
            ) : null}
          </View>
        </View>
        {editing ? (
          <View className="shrink-0 flex-row items-center gap-1.5">
            <TextInput
              value={draft ?? ''}
              onChangeText={onDraftChange}
              keyboardType="numeric"
              inputMode="decimal"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel={`${metric.label} (${metric.unit})`}
              selectTextOnFocus
              maxLength={9}
              textAlignVertical="center"
              style={{ paddingVertical: 0 }}
              className={cn('h-11 w-28 rounded-lg border bg-background px-3 text-right text-base text-foreground', invalid ? 'border-destructive' : 'border-input')}
            />
            <Text className="w-9 text-xs text-muted-foreground">{metric.unit}</Text>
          </View>
        ) : (
          <Text className="text-base font-bold text-foreground">{formatNutritionValue(metric.finalValue, metric.unit)}</Text>
        )}
      </View>
      {metric.override ? (
        <Text className="text-[11px] leading-4 text-muted-foreground">
          Sửa bởi {metric.override.updatedBy.displayName} lúc {metric.override.formattedUpdatedAt}. Ước tính gốc: {formatNutritionValue(metric.estimateValue, metric.unit)}
        </Text>
      ) : null}
      {metric.isMissing && metric.partialValue !== null ? (
        <Text className="text-[11px] leading-4 text-muted-foreground">
          Tổng một phần (chưa đủ nguyên liệu, không dùng làm giá trị): {formatNutritionValue(metric.partialValue, metric.unit)}
        </Text>
      ) : null}
      {invalid ? <Text className="text-[11px] text-destructive">Số không âm và nhỏ hơn 100.000.</Text> : null}
      {metric.override && !editing ? (
        <Pressable accessibilityRole="button" disabled={clearing} onPress={onClearOverride} className={cn('flex-row items-center gap-1 self-start py-1', clearing && 'opacity-50')}>
          <Undo2 size={12} color={colors.primary} />
          <Text className="text-[11px] font-semibold text-primary">Bỏ sửa tay</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PanelBody({ panel, revisionId }: { panel: ReviewNutritionPanelModel; revisionId: string }) {
  const colors = useIconColors();
  const [editing, setEditing] = React.useState(false);
  const [drafts, setDrafts] = React.useState<NutritionDrafts>({});
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');
  const updateMutation = useUpdateReviewNutritionMutation(revisionId);
  const recalculateMutation = useRecalculateReviewNutritionMutation(revisionId);
  const busy = updateMutation.isPending || recalculateMutation.isPending;
  const { changes, hasInvalid } = diffNutritionDrafts(panel.metrics, drafts);
  const changeCount = Object.keys(changes).length;

  const startEditing = () => {
    setDrafts(initialNutritionDrafts(panel.metrics));
    setReason('');
    setError('');
    setEditing(true);
  };

  const save = async () => {
    if (hasInvalid || changeCount === 0) return;
    setError('');
    try {
      await updateMutation.mutateAsync({ values: changes, reason });
      setEditing(false);
    } catch (value) {
      setError(getReviewNutritionErrorMessage(value));
    }
  };

  const clearOverride = async (metric: ReviewNutritionMetric) => {
    setError('');
    try {
      await updateMutation.mutateAsync({ values: { [metric.key]: null } });
    } catch (value) {
      setError(getReviewNutritionErrorMessage(value));
    }
  };

  const recalculate = async () => {
    setError('');
    try {
      await recalculateMutation.mutateAsync();
    } catch (value) {
      setError(getReviewNutritionErrorMessage(value));
    }
  };

  return (
    <View className="gap-3">
      <Text className="text-xs leading-5 text-muted-foreground">
        Giá trị trên <Text className="font-semibold text-foreground">mỗi khẩu phần</Text> (công thức {panel.servings} khẩu phần)
        {panel.estimateConfidencePercent !== null ? ` · Độ tin cậy chung ${panel.estimateConfidencePercent}%` : ''}
      </Text>

      {panel.canEdit && !editing ? (
        <View className="flex-row gap-2">
          <PrimaryButton
            label="AI tính lại"
            variant="outline"
            className="h-10 flex-1"
            loading={recalculateMutation.isPending}
            disabled={busy}
            icon={<RefreshCw size={14} color={colors.foreground} />}
            onPress={() => void recalculate()}
          />
          <PrimaryButton label="Sửa tay" variant="outline" className="h-10 flex-1" disabled={busy} icon={<Pencil size={14} color={colors.foreground} />} onPress={startEditing} />
        </View>
      ) : null}

      {error ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <CircleAlert size={14} color={colors.destructive} />
          <Text accessibilityRole="alert" className="flex-1 text-xs leading-5 text-destructive">{error}</Text>
        </View>
      ) : null}

      {!panel.hasEstimate ? (
        <View className="rounded-xl border border-dashed border-border p-3">
          <Text className="text-xs leading-5 text-muted-foreground">Chưa có bản ước tính cho bản nộp này. Bấm “AI tính lại” để tính từ dữ liệu chuẩn hoặc nhập tay đủ 5 chỉ số.</Text>
        </View>
      ) : null}

      <JobStatus job={panel.aiJob} />

      <View className="gap-2">
        {panel.metrics.map((metric) => (
          <MetricRow
            key={metric.key}
            metric={metric}
            editing={editing}
            draft={drafts[metric.key]}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, [metric.key]: value }))}
            onClearOverride={() => void clearOverride(metric)}
            clearing={busy || !panel.canEdit}
          />
        ))}
      </View>

      {editing ? (
        <View className="gap-2 rounded-xl border border-border p-3">
          <Text className="text-xs font-semibold text-foreground">Lý do chỉnh sửa (không bắt buộc)</Text>
          <TextInput
            value={reason}
            onChangeText={(text) => setReason(text.slice(0, 500))}
            placeholder="Ví dụ: đối chiếu lại bảng thành phần thực phẩm"
            placeholderTextColor={colors.mutedForeground}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          />
          <Text className="text-[11px] leading-4 text-muted-foreground">Để trống một ô để quay về giá trị tính toán. Mọi thay đổi đều được ghi lại.</Text>
          <View className="flex-row gap-2">
            <PrimaryButton label="Huỷ" variant="outline" className="h-10 flex-1" disabled={updateMutation.isPending} onPress={() => setEditing(false)} />
            <PrimaryButton
              label={changeCount > 0 ? `Lưu ${changeCount} thay đổi` : 'Lưu'}
              className="h-10 flex-1"
              loading={updateMutation.isPending}
              disabled={hasInvalid || changeCount === 0}
              onPress={() => void save()}
            />
          </View>
        </View>
      ) : null}

      {panel.missingMetricLabels.length > 0 ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <CircleAlert size={14} color={colors.destructive} />
          <Text accessibilityRole="alert" className="flex-1 text-xs leading-5 text-destructive">
            Còn thiếu: {panel.missingMetricLabels.join(', ')}. Chưa thể duyệt cho tới khi đủ 5 chỉ số.
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <CircleCheck size={14} color="#059669" />
          <Text className="flex-1 text-xs leading-5 text-emerald-700 dark:text-emerald-300">Đủ 5 chỉ số. Khi duyệt, các giá trị này trở thành chính thức.</Text>
        </View>
      )}

      {panel.uncoveredIngredients.length > 0 ? (
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-foreground">Nguyên liệu chưa tính được từ dữ liệu chuẩn ({panel.uncoveredIngredients.length})</Text>
          {panel.uncoveredIngredients.map((item) => (
            <View key={`${item.position}-${item.displayName}`} className="gap-0.5 rounded-lg border border-border bg-muted/20 px-2.5 py-2">
              <Text className="text-xs font-medium text-foreground">
                {item.displayName}
                {item.aiEstimated ? ' · AI đã ước tính' : ''}
              </Text>
              <Text className="text-[11px] text-muted-foreground">{item.reasonLabel}</Text>
              {item.missingMetricLabels.length > 0 ? <Text className="text-[11px] text-destructive">Còn thiếu: {item.missingMetricLabels.join(', ')}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {panel.previousApproved ? (
        <View className="gap-1.5 rounded-xl border border-border p-3">
          <Text className="text-xs font-semibold text-foreground">Giá trị đã duyệt ở bản trước (v{panel.previousApproved.revisionVersion}) — chỉ để tham khảo</Text>
          <Text className="text-[11px] leading-4 text-muted-foreground">Duyệt lúc {panel.previousApproved.formattedReviewedAt}. Các giá trị này không được mang sang bản nộp mới.</Text>
          {panel.previousApproved.values.map((item) => (
            <Text key={item.key} className="text-xs text-foreground">
              {item.label}
              {item.overridden ? ' (đã sửa tay)' : ''}: {formatNutritionValue(item.value, item.unit)}
            </Text>
          ))}
        </View>
      ) : null}

      {panel.audit.length > 0 ? (
        <View className="gap-1.5 rounded-xl border border-border p-3">
          <Text className="text-xs font-semibold text-foreground">Lịch sử chỉnh sửa ({panel.audit.length})</Text>
          {panel.audit.map((entry) => (
            <View key={entry.id} className="gap-0.5 rounded-lg bg-muted/30 px-2.5 py-2">
              <Text className="text-xs leading-5 text-foreground">
                {entry.actor.displayName} · {entry.actionLabel} <Text className="font-semibold">{entry.metricLabel}</Text>: {formatNutritionNumber(entry.previousValue)} ({entry.previousOriginLabel}) → {formatNutritionNumber(entry.newValue)} ({entry.newOriginLabel})
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                {entry.formattedCreatedAt}
                {entry.reason ? ` · Lý do: ${entry.reason}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text className="text-[11px] italic leading-4 text-muted-foreground">
        Số liệu dinh dưỡng chỉ mang tính tham khảo; cách nấu và nguyên liệu thực tế có thể làm giá trị thay đổi. Ước tính AI chỉ áp dụng cho bản nộp này, không thay đổi dữ liệu chuẩn của nguyên liệu.
      </Text>
    </View>
  );
}

/** Panel dinh dưỡng chờ duyệt của bản nộp công thức (đồng bộ `review-nutrition-panel.tsx` của web). */
export function ReviewNutritionPanel({ revisionId }: { revisionId: string }) {
  const colors = useIconColors();
  const { data, isLoading, isError, error, refetch } = useReviewNutritionPanelQuery(revisionId);
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-1.5">
        <Salad size={16} color={colors.mutedForeground} />
        <Text className="text-xs font-bold uppercase text-muted-foreground">Dinh dưỡng chờ duyệt</Text>
      </View>
      {isLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError || !data ? (
        <ErrorState title="Không tải được dữ liệu dinh dưỡng của bản nộp." description={getReviewNutritionErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <PanelBody panel={data} revisionId={revisionId} />
      )}
    </View>
  );
}
