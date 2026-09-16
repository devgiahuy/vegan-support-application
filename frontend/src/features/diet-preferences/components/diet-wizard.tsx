'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { DietSelector, type DietSelection } from './diet-selector';
import { DietRuleList } from './diet-rule-list';
import { AllergyEditor } from './allergy-editor';
import { ExclusionEditor } from './exclusion-editor';
import { ScheduleDatePicker } from './schedule-date-picker';
import { useDietPreviewQuery, useSaveDietPreferencesMutation } from '../queries/diet.queries';
import type { DietRulePreviewRequestDto } from '../types/diet.dto';
import type { Allergy, DietPreference, DietRule, IngredientExclusion } from '../types/diet.model';
import { PracticeSchedule } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';

type Step = 'select' | 'review' | 'done';

function sameSelection(
  a: DietRulePreviewRequestDto | null,
  b: { dietPattern: string; practiceSchedule: string; tradition: string } | null | undefined
): boolean {
  if (!a || !b) return false;
  return (
    a.dietPattern === b.dietPattern &&
    a.practiceSchedule === b.practiceSchedule &&
    a.tradition === b.tradition
  );
}

/**
 * Wizard 3 bước: chọn bộ ba → xem trước + toggle + dị ứng/kiêng → xác nhận lưu.
 * Xử lý mã lỗi diet theo contracts/diet-errors.md.
 */
export function DietWizard({
  initial,
  initialSelection,
  onSaved,
  scheduleSlot,
}: {
  initial?: DietPreference | null;
  /** Bộ ba chọn sẵn (vd từ tóm tắt hồ sơ) — chỉ preselect radio, không tự gọi preview. */
  initialSelection?: DietSelection | null;
  onSaved?: (preference: DietPreference) => void;
  /** Slot lịch chay kỳ (US5) — hiện sau khi lưu với PERIODIC. */
  scheduleSlot?: (preference: DietPreference) => React.ReactNode;
}) {
  const [step, setStep] = React.useState<Step>('select');
  const [selection, setSelection] = React.useState<Partial<DietRulePreviewRequestDto>>({
    dietPattern: initialSelection?.dietPattern ?? initial?.dietPattern,
    practiceSchedule: initialSelection?.practiceSchedule ?? initial?.practiceSchedule,
    tradition: initialSelection?.tradition ?? initial?.tradition,
  });
  const [confirmed, setConfirmed] = React.useState<DietRulePreviewRequestDto | null>(null);
  const [ruleOverrides, setRuleOverrides] = React.useState<Record<string, boolean>>({});
  const [allergies, setAllergies] = React.useState<Allergy[]>(initial?.allergies ?? []);
  const [exclusions, setExclusions] = React.useState<IngredientExclusion[]>(
    initial?.ingredientExclusions ?? []
  );
  // Ngày chay kỳ chọn trong bước review. Backend bắt buộc `scheduleDates` kèm
  // trong preferences khi PERIODIC (đã verify: thiếu → `DIET_SCHEDULE_REQUIRED`).
  const [scheduleDates, setScheduleDates] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<DietPreference | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [configUnavailable, setConfigUnavailable] = React.useState(false);

  const previewQuery = useDietPreviewQuery(confirmed);
  const saveMutation = useSaveDietPreferencesMutation();

  const preview = previewQuery.data ?? null;

  const startPreview = () => {
    if (!selection.dietPattern || !selection.practiceSchedule || !selection.tradition) return;
    const next = {
      dietPattern: selection.dietPattern,
      practiceSchedule: selection.practiceSchedule,
      tradition: selection.tradition,
    };
    setSaveError(null);
    setConfigUnavailable(false);
    setSaved(null);
    // Đổi sang bộ ba mới → reset toggle/editors về mặc định của preview sắp về.
    if (!sameSelection(next, confirmed)) {
      setRuleOverrides({});
      if (!sameSelection(next, initial)) {
        setAllergies([]);
        setExclusions([]);
      }
    }
    setConfirmed(next);
    setStep('review');
  };

  const toggleRule = (id: string, enabled: boolean) => {
    setRuleOverrides((prev) => ({ ...prev, [id]: enabled }));
  };

  const mergedRules: DietRule[] = (preview?.rules ?? []).map((r) => ({
    ...r,
    enabled: r.isHard ? true : (ruleOverrides[r.ruleDefinitionId] ?? r.enabled),
  }));

  const isPeriodic = confirmed?.practiceSchedule === PracticeSchedule.PERIODIC;

  const handleSave = async () => {
    if (!confirmed || !preview) return;
    // Backend bắt buộc `scheduleDates` kèm preferences khi PERIODIC (đã verify).
    if (isPeriodic && scheduleDates.length === 0) {
      setSaveError('Lịch chay kỳ cần ít nhất một ngày. Hãy chọn ngày bên dưới rồi xác nhận.');
      return;
    }
    setSaveError(null);
    try {
      const result = await saveMutation.mutateAsync({
        dietPattern: confirmed.dietPattern,
        practiceSchedule: confirmed.practiceSchedule,
        tradition: confirmed.tradition,
        ruleSetVersion: preview.ruleSetVersion,
        rules: mergedRules.map((r) => ({
          ruleDefinitionId: r.ruleDefinitionId,
          enabled: r.enabled,
        })),
        ...(isPeriodic ? { scheduleDates } : {}),
        allergies: allergies.map((a) => ({
          allergenCode: a.allergenCode,
          label: a.label,
          severity: a.severity,
        })),
        ingredientExclusions: exclusions.map((e) => ({
          ...(e.ingredientId ? { ingredientId: e.ingredientId } : {}),
          ingredientName: e.ingredientName,
          reason: e.reason,
        })),
      });
      setSaved(result);
      setStep('done');
      onSaved?.(result);
      if (result.requiresRuleReview) {
        // Backend yêu cầu xem lại — quay về màn preview giữ nguyên lựa chọn.
        setStep('review');
        void previewQuery.refetch();
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DIET_RULE_RECONFIRMATION_REQUIRED') {
        setSaveError('Bộ quy tắc đã thay đổi. Vui lòng xem lại trước khi xác nhận.');
        setStep('review');
        void previewQuery.refetch();
        return;
      }
      if (code === 'INVALID_DIET_RULE_SELECTION') {
        setSaveError(
          'Lựa chọn chưa khớp bộ quy tắc mới. Đã tải lại, vui lòng xác nhận lại toàn bộ.'
        );
        void previewQuery.refetch();
        return;
      }
      if (code === 'DIET_RULES_UNAVAILABLE') {
        setConfigUnavailable(true);
        setSaveError('Cấu hình diet chưa sẵn sàng. Vui lòng thử lại sau.');
        return;
      }
      if (code === 'DIET_SCHEDULE_REQUIRED') {
        setSaveError('Lịch chay kỳ cần chọn ngày. Hãy xác nhận rồi sang bước chọn ngày.');
        return;
      }
      if (code === 'INVALID_INGREDIENT_EXCLUSIONS') {
        setSaveError('Danh sách kiêng có mục rỗng hoặc trùng. Vui lòng kiểm tra lại.');
        return;
      }
      setSaveError('Lưu lựa chọn thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-4">
      {step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn chế độ ăn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DietSelector value={selection} onChange={setSelection} />
            <Button
              className="gap-2 rounded-xl"
              disabled={
                !selection.dietPattern || !selection.practiceSchedule || !selection.tradition
              }
              onClick={startPreview}
            >
              Xem trước quy tắc <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Xem trước và xác nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewQuery.isLoading && <LoadingState message="Đang tải bộ quy tắc..." />}
            {previewQuery.isError && (
              <ErrorState
                title="Không tải được bộ quy tắc."
                error={previewQuery.error}
                onRetry={() => void previewQuery.refetch()}
              />
            )}
            {preview && (
              <>
                <DietRuleList rules={mergedRules} onToggle={toggleRule} />
                <AllergyEditor value={allergies} onChange={setAllergies} />
                <ExclusionEditor value={exclusions} onChange={setExclusions} />
                {isPeriodic && (
                  <div className="space-y-2 rounded-xl border p-4">
                    <p className="text-sm font-medium">Ngày chay kỳ (bắt buộc)</p>
                    <ScheduleDatePicker dates={scheduleDates} onChange={setScheduleDates} />
                  </div>
                )}
              </>
            )}
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {configUnavailable && (
              <Alert>
                <AlertDescription>
                  Cấu hình diet chưa sẵn sàng từ phía hệ thống. Nút lưu đã bị khóa.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={() => setStep('select')}
              >
                <ArrowLeft className="h-4 w-4" /> Chọn lại
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={() => void previewQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" /> Tải lại quy tắc
              </Button>
              <Button
                className="gap-2 rounded-xl"
                disabled={!preview || configUnavailable || saveMutation.isPending}
                onClick={() => void handleSave()}
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Xác nhận lưu'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && saved && (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Đã lưu lựa chọn chế độ ăn
              {saved.practiceSchedule === PracticeSchedule.PERIODIC
                ? '. Tiếp tục chọn ngày chay kỳ bên dưới.'
                : ' cho trường chay.'}
            </AlertDescription>
          </Alert>
          {saved.practiceSchedule === PracticeSchedule.PERIODIC && scheduleSlot?.(saved)}
        </div>
      )}
    </div>
  );
}
