'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useDietRepairApply,
  useDietProgramRevision,
  useDietRepairProposal,
} from '../queries/diet-impact.queries';
import { DietRepairDialog } from './diet-repair-dialog';
import { repairPlanViews, repairOutcome } from '../utils/diet-impact-view';
import {
  keptRepairBatch,
  repairBatchSummary,
  repairPlanBatches,
  type DietRepairBatchRecord,
} from '../utils/diet-repair-batches';
import { getApiErrorMessage } from '@/lib/api-error';
import { newIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';

export function DietRepairPanel({
  planIds,
  dietaryRevision,
  onClose,
}: {
  planIds: string[];
  dietaryRevision: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const revisionKeys = useRef(new Map<string, string>());
  const [revision, setRevision] = useState(dietaryRevision);
  const [activeBatch, setActiveBatch] = useState(0);
  const [records, setRecords] = useState<DietRepairBatchRecord[]>([]);
  const batches = repairPlanBatches(planIds);
  const batchIndex = Math.min(activeBatch, Math.max(0, batches.length - 1));
  const currentPlanIds = batches[batchIndex] ?? [];
  const hasNextBatch = batchIndex + 1 < batches.length;
  const summary = repairBatchSummary(batches, records);
  const profile = useDetailedProfileQuery();
  const preview = useDietRepairProposal({
    planIds: currentPlanIds,
    expectedDietaryRevision: revision,
  });
  const apply = useDietRepairApply();
  const revise = useDietProgramRevision();
  const busy = apply.isPending || revise.isPending;
  const storeRecord = (record: DietRepairBatchRecord) => {
    const next = [...records.filter((item) => item.batchIndex !== record.batchIndex), record];
    setRecords(next);
    return next;
  };
  const retry = async () => {
    setError(null);
    const latest = await profile.refetch();
    if (latest.isError || !latest.data?.diet) {
      setError('Không tải lại được thiết lập hiện tại. Vui lòng thử lại.');
      return;
    }
    const currentRevision = latest.data.diet.dietaryRevision;
    if (currentRevision !== revision) {
      setRevision(currentRevision);
      setRecords([]);
      setActiveBatch(0);
      toast.info('Thiết lập đã thay đổi. Đang kiểm tra lại các nhóm từ đầu.');
    } else await preview.refetch();
  };
  const nextBatch = () => {
    if (!hasNextBatch || busy || preview.isPending) return;
    if (!records.some((record) => record.batchIndex === batchIndex)) {
      storeRecord(keptRepairBatch(batchIndex, currentPlanIds, revision, preview.data));
    }
    setError(null);
    setActiveBatch(batchIndex + 1);
  };
  const applyNow = async () => {
    if (!preview.data || busy) return;
    setError(null);
    try {
      const result = await apply.mutateAsync({
        proposalId: preview.data.proposalId,
        idempotencyKey: 'diet-repair:' + preview.data.proposalId,
      });
      const outcome = repairOutcome(result);
      const updatedRecords = storeRecord({ batchIndex, planIds: currentPlanIds, result });
      const aggregate = repairBatchSummary(batches, updatedRecords);
      if (aggregate.allResolved) {
        toast.success(
          batches.length === 1
            ? outcome.message
            : 'Đã xử lý toàn bộ ' + aggregate.total + ' thực đơn theo thiết lập hiện tại.'
        );
        onClose();
      } else if (outcome.success && hasNextBatch) {
        toast.success(
          'Đã xử lý nhóm ' + (batchIndex + 1) + '. Hãy xem phương án cho nhóm tiếp theo.'
        );
        setActiveBatch(batchIndex + 1);
      } else if (!outcome.success) setError(outcome.message);
      else
        setError(
          'Đã xử lý nhóm này. Còn ' +
            aggregate.unresolvedPlanIds.length +
            ' thực đơn ở các nhóm trước cần xử lý; hãy xem lại kết quả bên trên hoặc chọn giữ để xử lý sau.'
        );
    } catch (failure) {
      setError(getApiErrorMessage(failure));
    }
  };
  const createRevision = async (id: string, expectedVersion: number) => {
    setError(null);
    const signature = id + ':' + expectedVersion;
    if (!revisionKeys.current.has(signature))
      revisionKeys.current.set(signature, 'diet-revision:' + newIdempotencyKey());
    try {
      const program = await revise.mutateAsync({
        id,
        expectedVersion,
        idempotencyKey: revisionKeys.current.get(signature)!,
      });
      router.push('/meal-programs/' + encodeURIComponent(program.id));
    } catch (failure) {
      setError(getApiErrorMessage(failure));
    }
  };
  const progress =
    batches.length > 1 ? (
      <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
        <p role="status" className="font-medium tabular-nums">
          Nhóm {batchIndex + 1}/{batches.length} · {currentPlanIds.length} thực đơn trong nhóm ·{' '}
          {summary.total} thực đơn tổng cộng
        </p>
        <p className="text-pretty text-muted-foreground">
          Mỗi lần xem trước và áp dụng tối đa 20 thực đơn. Đã điều chỉnh {summary.updated} thực đơn;
          {summary.unresolvedPlanIds.length} thực đơn đã đi qua còn cần xử lý;{' '}
          {summary.pendingPlanIds.length} thực đơn chưa xử lý.
        </p>
        {records.length > 0 && (
          <details>
            <summary className="cursor-pointer">Kết quả các nhóm đã xử lý</summary>
            <ul className="mt-2 flex flex-col gap-3">
              {[...records]
                .sort((a, b) => a.batchIndex - b.batchIndex)
                .map((record) => (
                  <li key={record.batchIndex} className="flex flex-col gap-1">
                    <p>
                      Nhóm {record.batchIndex + 1}: {repairOutcome(record.result).message}
                    </p>
                    {record.result.results
                      .filter(
                        (item) =>
                          !['UPDATED', 'UNCHANGED'].includes(item.status) ||
                          item.remainingAffectedMeals > 0
                      )
                      .map((item) => (
                        <p key={item.planId} className="text-xs text-muted-foreground">
                          {item.message || 'Thực đơn vẫn cần xử lý.'}
                          {item.remainingAffectedMeals > 0
                            ? ' Còn ' + item.remainingAffectedMeals + ' bữa.'
                            : ''}
                        </p>
                      ))}
                    <Button
                      type="button"
                      variant="link"
                      className="w-fit px-0"
                      disabled={busy}
                      onClick={() => {
                        setActiveBatch(record.batchIndex);
                        setError(null);
                      }}
                    >
                      Xem lại nhóm {record.batchIndex + 1}
                    </Button>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    ) : undefined;
  return (
    <DietRepairDialog
      open
      loading={preview.isPending}
      applying={busy}
      error={error ?? (preview.error ? getApiErrorMessage(preview.error) : null)}
      plans={repairPlanViews(preview.data ?? null)}
      progress={progress}
      onApply={() => void applyNow()}
      onRetry={() => void retry()}
      onClose={onClose}
      onNextBatch={hasNextBatch ? nextBatch : undefined}
      onCreateRevision={(id, version) => void createRevision(id, version)}
    />
  );
}
