'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CircleCheck,
  History,
  Loader2,
  Pencil,
  RefreshCw,
  Salad,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useRecalculateReviewNutritionMutation,
  useReviewNutritionPanelQuery,
  useUpdateReviewNutritionMutation,
} from '../queries/review.queries';
import {
  ReviewNutritionJobState,
  ReviewNutritionOrigin,
  type ReviewNutritionJob,
  type ReviewNutritionMetric,
  type ReviewNutritionMetricKey,
  type ReviewNutritionOverrideValues,
  type ReviewNutritionPanel as ReviewNutritionPanelModel,
} from '../types/review-nutrition.model';

interface ReviewNutritionPanelProps {
  revisionId: string;
}

type DraftValues = Partial<Record<ReviewNutritionMetricKey, string>>;

const ORIGIN_BADGE_CLASSES: Record<ReviewNutritionOrigin, string> = {
  [ReviewNutritionOrigin.CANONICAL_CALCULATED]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  [ReviewNutritionOrigin.AI_ESTIMATED]:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  [ReviewNutritionOrigin.VERIFIED_OVERRIDE]:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  [ReviewNutritionOrigin.USER_PROVIDED]: 'border-muted bg-muted/40 text-muted-foreground',
  [ReviewNutritionOrigin.UNKNOWN]: 'border-muted bg-muted/40 text-muted-foreground',
};

function formatNumber(value: number | null, maximumFractionDigits = 2): string {
  return value === null ? '—' : value.toLocaleString('vi-VN', { maximumFractionDigits });
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—';
  return `${formatNumber(value, unit === 'kcal' ? 0 : 2)} ${unit}`;
}

function parseDraft(raw: string | undefined): number | null | 'invalid' {
  if (raw === undefined) return 'invalid';
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 && value < 100_000 ? value : 'invalid';
}

function JobStatus({ job }: { job: ReviewNutritionJob | null }) {
  if (!job) return null;
  const tone = job.isFailed
    ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : job.isActive
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
      : 'border-muted bg-muted/30 text-muted-foreground';
  return (
    <div className={cn('rounded-xl border p-3 text-xs space-y-1', tone)} role="status">
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        {job.isActive ? (
          <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : job.isFailed ? (
          <AlertTriangle className="size-3.5" aria-hidden />
        ) : (
          <Sparkles className="size-3.5" aria-hidden />
        )}
        <span>{job.stateLabel}</span>
        <span className="font-normal tabular-nums">
          (lượt {job.attemptCount}/{job.maxAttempts})
        </span>
      </div>
      {job.state === ReviewNutritionJobState.RETRY_SCHEDULED && (
        <p className="text-pretty">Thử lại lúc {job.formattedNextAttemptAt}.</p>
      )}
      {job.errorLabel && job.state !== ReviewNutritionJobState.SUCCEEDED && (
        <p className="text-pretty">Lý do: {job.errorLabel}.</p>
      )}
      {job.isActive && (
        <p className="text-pretty opacity-80">
          Bạn vẫn có thể nhập tay và phê duyệt khi đủ chỉ số, không cần chờ AI.
        </p>
      )}
    </div>
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
  const inputId = `review-nutrition-${metric.key}`;
  const invalid = editing && parseDraft(draft) === 'invalid';
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-xl border p-3',
        metric.isMissing ? 'border-destructive/40 bg-destructive/5' : 'border-muted bg-muted/10'
      )}
    >
      <div className="min-w-0 space-y-1">
        <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
          {metric.label}
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {metric.finalOrigin ? (
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0', ORIGIN_BADGE_CLASSES[metric.finalOrigin])}
            >
              {metric.finalOriginLabel}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Còn trống
            </Badge>
          )}
          {metric.confidencePercent !== null && !metric.override && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Tin cậy {metric.confidencePercent}%
            </span>
          )}
        </div>
        {metric.override && (
          <p className="text-[11px] text-muted-foreground text-pretty">
            Sửa bởi {metric.override.updatedBy.displayName} lúc {metric.override.formattedUpdatedAt}
            . Ước tính gốc:{' '}
            <span className="tabular-nums">{formatValue(metric.estimateValue, metric.unit)}</span>
          </p>
        )}
        {metric.isMissing && metric.partialValue !== null && (
          <p className="text-[11px] text-muted-foreground text-pretty">
            Tổng một phần (chưa đủ nguyên liệu, không dùng làm giá trị):{' '}
            <span className="tabular-nums">{formatValue(metric.partialValue, metric.unit)}</span>
          </p>
        )}
      </div>
      <div className="flex flex-col items-end justify-center gap-1">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              id={inputId}
              inputMode="decimal"
              value={draft ?? ''}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Nhập số"
              aria-invalid={invalid}
              className="h-8 w-24 text-right text-xs tabular-nums"
            />
            <span className="w-8 text-[11px] text-muted-foreground">{metric.unit}</span>
          </div>
        ) : (
          <strong className="text-sm tabular-nums text-foreground">
            {formatValue(metric.finalValue, metric.unit)}
          </strong>
        )}
        {metric.override && !editing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearOverride}
            disabled={clearing}
            className="h-6 gap-1 px-1.5 text-[11px]"
          >
            <Undo2 className="size-3" aria-hidden /> Bỏ sửa tay
          </Button>
        )}
        {invalid && <span className="text-[11px] text-destructive">Số không âm, &lt; 100.000</span>}
      </div>
    </div>
  );
}

function PanelBody({
  panel,
  revisionId,
}: {
  panel: ReviewNutritionPanelModel;
  revisionId: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [drafts, setDrafts] = React.useState<DraftValues>({});
  const [reason, setReason] = React.useState('');
  const updateMutation = useUpdateReviewNutritionMutation(revisionId);
  const recalculateMutation = useRecalculateReviewNutritionMutation(revisionId);

  const startEditing = () => {
    setDrafts(
      Object.fromEntries(
        panel.metrics.map((metric) => [
          metric.key,
          metric.finalValue === null ? '' : String(metric.finalValue),
        ])
      )
    );
    setReason('');
    setEditing(true);
  };

  const changes: ReviewNutritionOverrideValues = {};
  let hasInvalid = false;
  for (const metric of panel.metrics) {
    const parsed = parseDraft(drafts[metric.key]);
    if (parsed === 'invalid') {
      hasInvalid = true;
      continue;
    }
    // Ô để trống: chỉ bỏ sửa tay nếu đang có, không tạo giá trị rỗng mới
    if (parsed === null) {
      if (metric.override) changes[metric.key] = null;
      continue;
    }
    if (parsed !== metric.finalValue) changes[metric.key] = parsed;
  }
  const changeCount = Object.keys(changes).length;

  const save = () => {
    if (hasInvalid || changeCount === 0) return;
    updateMutation.mutate({ values: changes, reason }, { onSuccess: () => setEditing(false) });
  };

  const busy = updateMutation.isPending || recalculateMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground text-pretty">
          Giá trị trên <strong className="text-foreground">mỗi khẩu phần</strong> (công thức{' '}
          <span className="tabular-nums">{panel.servings}</span> khẩu phần)
          {panel.estimateConfidencePercent !== null && (
            <>
              {' '}
              · Độ tin cậy chung{' '}
              <span className="tabular-nums">{panel.estimateConfidencePercent}%</span>
            </>
          )}
        </p>
        {panel.canEdit && !editing && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => recalculateMutation.mutate()}
              disabled={busy}
              className="h-8 gap-1.5 rounded-xl text-xs"
            >
              {recalculateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              AI tính lại
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={busy}
              className="h-8 gap-1.5 rounded-xl text-xs"
            >
              <Pencil className="size-3.5" aria-hidden /> Sửa tay
            </Button>
          </div>
        )}
      </div>

      {!panel.hasEstimate && (
        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground text-pretty">
          Chưa có bản ước tính cho bản nộp này. Bấm “AI tính lại” để tính từ dữ liệu chuẩn hoặc nhập
          tay đủ 5 chỉ số.
        </div>
      )}

      <JobStatus job={panel.aiJob} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {panel.metrics.map((metric) => (
          <MetricRow
            key={metric.key}
            metric={metric}
            editing={editing}
            draft={drafts[metric.key]}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, [metric.key]: value }))}
            onClearOverride={() => updateMutation.mutate({ values: { [metric.key]: null } })}
            clearing={busy || !panel.canEdit}
          />
        ))}
      </div>

      {editing && (
        <div className="space-y-2 rounded-xl border p-3">
          <label htmlFor="review-nutrition-reason" className="text-xs font-semibold">
            Lý do chỉnh sửa (không bắt buộc)
          </label>
          <Input
            id="review-nutrition-reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ví dụ: đối chiếu lại bảng thành phần thực phẩm"
            className="h-8 text-xs"
          />
          <p className="text-[11px] text-muted-foreground text-pretty">
            Để trống một ô để quay về giá trị tính toán. Mọi thay đổi đều được ghi lại.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={updateMutation.isPending}
              className="h-8 rounded-xl text-xs"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={hasInvalid || changeCount === 0 || updateMutation.isPending}
              className="h-8 gap-1.5 rounded-xl text-xs"
            >
              {updateMutation.isPending && (
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              )}
              Lưu {changeCount > 0 ? `${changeCount} thay đổi` : ''}
            </Button>
          </div>
        </div>
      )}

      {panel.missingMetricLabels.length > 0 ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p className="text-pretty">
            Còn thiếu: {panel.missingMetricLabels.join(', ')}. Chưa thể phê duyệt cho tới khi đủ 5
            chỉ số.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="size-3.5 shrink-0" aria-hidden />
          <p className="text-pretty">
            Đủ 5 chỉ số. Khi phê duyệt, các giá trị này trở thành chính thức.
          </p>
        </div>
      )}

      {panel.uncoveredIngredients.length > 0 && (
        <div className="space-y-1.5">
          <h5 className="text-xs font-semibold text-foreground">
            Nguyên liệu chưa tính được từ dữ liệu chuẩn ({panel.uncoveredIngredients.length})
          </h5>
          <ul className="space-y-1.5">
            {panel.uncoveredIngredients.map((item) => (
              <li
                key={`${item.position}-${item.displayName}`}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-muted bg-muted/10 px-2.5 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{item.displayName}</span>
                <span className="text-muted-foreground">{item.reasonLabel}</span>
                {item.aiEstimated && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      ORIGIN_BADGE_CLASSES[ReviewNutritionOrigin.AI_ESTIMATED]
                    )}
                  >
                    AI đã ước tính
                  </Badge>
                )}
                {item.missingMetricLabels.length > 0 && (
                  <span className="text-destructive">
                    Còn thiếu: {item.missingMetricLabels.join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {panel.previousApproved && (
        <details className="rounded-xl border border-muted p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-foreground">
            Giá trị đã duyệt ở bản trước (v{panel.previousApproved.revisionVersion}) — chỉ để tham
            khảo
          </summary>
          <p className="mt-2 text-[11px] text-muted-foreground text-pretty">
            Duyệt lúc {panel.previousApproved.formattedReviewedAt}. Các giá trị này không được mang
            sang bản nộp mới.
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {panel.previousApproved.values.map((item) => (
              <div key={item.key} className="rounded-lg bg-muted/20 px-2 py-1.5">
                <dt className="text-[11px] text-muted-foreground">
                  {item.label}
                  {item.overridden ? ' (đã sửa tay)' : ''}
                </dt>
                <dd className="font-medium tabular-nums">{formatValue(item.value, item.unit)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {panel.audit.length > 0 && (
        <details className="rounded-xl border border-muted p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-foreground">
            <History className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
            Lịch sử chỉnh sửa ({panel.audit.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {panel.audit.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-muted/20 px-2.5 py-2 text-pretty">
                <span className="font-medium">{entry.actor.displayName}</span> · {entry.actionLabel}{' '}
                <strong>{entry.metricLabel}</strong>:{' '}
                <span className="tabular-nums">
                  {formatNumber(entry.previousValue)} ({entry.previousOriginLabel}) →{' '}
                  {formatNumber(entry.newValue)} ({entry.newOriginLabel})
                </span>
                <span className="text-muted-foreground"> · {entry.formattedCreatedAt}</span>
                {entry.reason && (
                  <span className="block text-muted-foreground">Lý do: {entry.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] italic text-muted-foreground text-pretty">
        Số liệu dinh dưỡng chỉ mang tính tham khảo; cách nấu và nguyên liệu thực tế có thể làm giá
        trị thay đổi. Ước tính AI chỉ áp dụng cho bản nộp này, không thay đổi dữ liệu chuẩn của
        nguyên liệu.
      </p>
    </div>
  );
}

export function ReviewNutritionPanel({ revisionId }: ReviewNutritionPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } =
    useReviewNutritionPanelQuery(revisionId);

  return (
    <section
      className="space-y-3 rounded-2xl border bg-card/60 p-4"
      aria-labelledby="review-nutrition-title"
    >
      <h4
        id="review-nutrition-title"
        className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"
      >
        <Salad className="size-4" aria-hidden /> Dinh dưỡng chờ duyệt
      </h4>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <span>Không tải được dữ liệu dinh dưỡng của bản nộp.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-7 rounded-xl text-xs"
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <PanelBody panel={data} revisionId={revisionId} />
      )}
    </section>
  );
}
