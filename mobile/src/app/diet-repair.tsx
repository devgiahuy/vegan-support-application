import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { DietRepairPreview } from '@/features/diet-preferences/components/diet-repair-preview';
import { DietRepairResult } from '@/features/diet-preferences/components/diet-repair-result';
import { useDietaryProgramRevisionMutation, useDietaryRepairApplyMutation, useDietaryRepairPreviewMutation } from '@/features/diet-preferences/queries/diet-preferences.queries';
import type { DietaryImpactedProgram, DietaryRepairPreview, DietaryRepairResult } from '@/features/diet-preferences/types/diet-impact.model';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { createIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';

const BATCH_SIZE = 20;

export default function DietRepairScreen() {
  const params = useLocalSearchParams<{ planIds?: string; revision?: string }>();
  const router = useRouter();
  const colors = useIconColors();
  const profile = useDetailedProfileQuery();
  const [planIds, setPlanIds] = React.useState(() => [...new Set((params.planIds ?? '').split(',').filter(Boolean))]);
  const [batchIndex, setBatchIndex] = React.useState(0);
  const [preview, setPreview] = React.useState<DietaryRepairPreview | null>(null);
  const [result, setResult] = React.useState<DietaryRepairResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [newProgramId, setNewProgramId] = React.useState<string | null>(null);
  const requestNumber = React.useRef(0);
  const operationKeys = React.useRef<Record<string, string>>({});
  const previewMutation = useDietaryRepairPreviewMutation();
  const applyMutation = useDietaryRepairApplyMutation();
  const revisionMutation = useDietaryProgramRevisionMutation();
  const requestPreview = previewMutation.mutateAsync;
  const revision = profile.data?.diet?.dietaryRevision ?? 0;
  const batchKey = planIds.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE).join(',');
  const batchCount = Math.ceil(planIds.length / BATCH_SIZE);
  const busy = previewMutation.isPending || applyMutation.isPending || revisionMutation.isPending;

  const loadPreview = React.useCallback(async () => {
    if (!batchKey || revision <= 0) return;
    const request = ++requestNumber.current;
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const next = await requestPreview({ planIds: batchKey.split(','), expectedDietaryRevision: revision });
      if (request === requestNumber.current) setPreview(next);
    } catch (cause) {
      if (request === requestNumber.current) setError(getApiErrorMessage(cause, 'Chưa tìm được phương án thay món. Thực đơn của bạn vẫn được giữ nguyên.'));
    }
  }, [batchKey, revision, requestPreview]);

  React.useEffect(() => {
    if (!batchKey || revision <= 0) return;
    const request = ++requestNumber.current;
    void requestPreview({ planIds: batchKey.split(','), expectedDietaryRevision: revision }).then(
      (next) => { if (request === requestNumber.current) setPreview(next); },
      (cause: unknown) => { if (request === requestNumber.current) setError(getApiErrorMessage(cause, 'Chưa tìm được phương án thay món. Thực đơn vẫn được giữ nguyên.')); },
    );
    return () => { requestNumber.current += 1; };
  }, [batchKey, revision, requestPreview]);

  const apply = async () => {
    if (!preview || busy) return;
    setError(null);
    const idempotencyKey = operationKeys.current[preview.proposalId] ?? createIdempotencyKey('diet-repair');
    operationKeys.current[preview.proposalId] = idempotencyKey;
    try {
      const next = await applyMutation.mutateAsync({ proposalId: preview.proposalId, idempotencyKey });
      setResult(next);
      setPreview(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Chưa xác định được kết quả áp dụng. Hãy tải lại thực đơn hoặc tìm lại phương án trước khi tiếp tục.'));
    }
  };
  const createRevision = async (program: DietaryImpactedProgram) => {
    if (busy) return;
    setError(null);
    const operation = `program-${program.id}-${program.expectedVersion}`;
    const key = operationKeys.current[operation] ?? createIdempotencyKey('diet-program');
    operationKeys.current[operation] = key;
    try {
      const next = await revisionMutation.mutateAsync({ programId: program.id, expectedVersion: program.expectedVersion, idempotencyKey: key });
      const selected = next.weeks.flatMap((week) => week.alternatives.filter((alternative) => alternative.selected).map((alternative) => alternative.mealPlanId));
      setNewProgramId(next.id);
      setResult(null);
      setPreview(null);
      setBatchIndex(0);
      setPlanIds([...new Set(selected)]);
      if (selected.length === 0) setError('Đã tạo bản điều chỉnh. Hãy mở lộ trình, chọn phương án cho các tuần rồi xem lại thực đơn.');
    } catch (cause) { setError(getApiErrorMessage(cause, 'Không tạo được bản điều chỉnh. Lộ trình nguồn vẫn được giữ nguyên.')); }
  };

  if (profile.isError) return <SiteScreen><View className="px-5 pt-6"><ErrorState title="Không tải được hồ sơ ăn uống" onRetry={() => void profile.refetch()} /></View></SiteScreen>;

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-bold text-foreground">Điều chỉnh thực đơn</Text>
        {batchCount > 1 ? <Text className="text-sm leading-5 text-muted-foreground">Đợt {batchIndex + 1}/{batchCount}. Mỗi đợt xử lý tối đa {BATCH_SIZE} thực đơn; các đợt còn lại chưa được thay đổi.</Text> : null}
        {newProgramId ? (
          <View className="gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <Text className="text-sm leading-5 text-foreground">Đã tạo bản điều chỉnh dạng nháp. Sau khi xem và thay món, bạn cần xác nhận lại lộ trình mới.</Text>
            <Link href={`/meal-programs/${newProgramId}` as Href} asChild><PrimaryButton label="Mở bản điều chỉnh" variant="outline" /></Link>
          </View>
        ) : null}
        {profile.isPending || previewMutation.isPending ? (
          <View className="items-center gap-3 p-6"><ActivityIndicator color={colors.primary} /><Text className="text-sm text-muted-foreground">Đang tìm các món phù hợp...</Text></View>
        ) : null}
        {preview && !previewMutation.isPending ? <DietRepairPreview preview={preview} busy={busy} error={error} onApply={() => void apply()}
          onKeep={() => router.replace('/(tabs)/meal-plans' as Href)} onCreateProgramRevision={(program) => void createRevision(program)} /> : null}
        {result ? <DietRepairResult result={result} onRetry={() => void loadPreview()} /> : null}
        {result && batchIndex + 1 < batchCount ? <PrimaryButton label="Xử lý đợt tiếp theo" onPress={() => { setResult(null); setPreview(null); setError(null); setBatchIndex((value) => value + 1); }} /> : null}
        {!preview && error ? <View className="gap-3"><Text accessibilityRole="alert" className="text-sm leading-5 text-destructive">{error}</Text><PrimaryButton label="Thử kiểm tra lại" disabled={busy} onPress={() => void loadPreview()} /></View> : null}
        {!profile.isPending && revision <= 0 ? <Text className="text-sm text-muted-foreground">Hãy lưu thiết lập ăn uống trước khi điều chỉnh thực đơn.</Text> : null}
        {planIds.length === 0 ? <Text className="text-sm text-muted-foreground">Không có thực đơn nào được chọn để điều chỉnh.</Text> : null}
        <Link href={'/(tabs)/meal-plans' as Href} asChild><PrimaryButton label="Về danh sách thực đơn" variant="outline" disabled={busy} /></Link>
      </View>
    </SiteScreen>
  );
}
