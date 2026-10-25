'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Sparkles, X } from 'lucide-react';
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
 * Wizard thiết lập chế độ ăn 2 bước:
 * Bước 1: Chọn bộ ba (Kiểu ăn, Lịch thực hành, Truyền thống)
 * Bước 2: Xem trước quy tắc, dị ứng & nguyên liệu kiêng -> Xác nhận lưu
 */
export function DietWizard({
  initial,
  initialSelection,
  onSaved,
  onCancel,
  scheduleSlot,
}: {
  initial?: DietPreference | null;
  /** Bộ ba chọn sẵn (vd từ tóm tắt hồ sơ) — chỉ preselect radio, không tự gọi preview. */
  initialSelection?: DietSelection | null;
  onSaved?: (preference: DietPreference) => void;
  onCancel?: () => void;
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
  const [ruleOverrides, setRuleOverrides] = React.useState<Record<string, boolean>>(() => {
    if (!initial?.rules) return {};
    const map: Record<string, boolean> = {};
    for (const r of initial.rules) {
      map[r.ruleDefinitionId] = r.enabled;
    }
    return map;
  });
  const [allergies, setAllergies] = React.useState<Allergy[]>(initial?.allergies ?? []);
  const [exclusions, setExclusions] = React.useState<IngredientExclusion[]>(
    initial?.ingredientExclusions ?? []
  );
  // Ngày chay kỳ chọn trong bước review. Backend bắt buộc `scheduleDates` kèm
  // trong preferences khi PERIODIC (đã verify: thiếu -> `DIET_SCHEDULE_REQUIRED`).
  const [scheduleDates, setScheduleDates] = React.useState<string[]>(
    initial?.schedule?.dates ??
      (initial as unknown as { scheduleDates?: string[] })?.scheduleDates ??
      []
  );
  const [saved, setSaved] = React.useState<DietPreference | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [configUnavailable, setConfigUnavailable] = React.useState(false);

  // Đồng bộ lại khi `initial` được truyền vào hoặc nạp xong từ query
  React.useEffect(() => {
    if (initial) {
      if (initial.allergies && initial.allergies.length > 0) {
        setAllergies(initial.allergies);
      }
      if (initial.ingredientExclusions && initial.ingredientExclusions.length > 0) {
        setExclusions(initial.ingredientExclusions);
      }
      const dates =
        initial.schedule?.dates ??
        (initial as unknown as { scheduleDates?: string[] })?.scheduleDates ??
        [];
      if (dates.length > 0) {
        setScheduleDates(dates);
      }
      if (initial.dietPattern && initial.practiceSchedule && initial.tradition) {
        setSelection((prev) => ({
          dietPattern: prev.dietPattern ?? initial.dietPattern,
          practiceSchedule: prev.practiceSchedule ?? initial.practiceSchedule,
          tradition: prev.tradition ?? initial.tradition,
        }));
      }
      if (initial.rules && initial.rules.length > 0) {
        setRuleOverrides((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const map: Record<string, boolean> = {};
          for (const r of initial.rules) {
            map[r.ruleDefinitionId] = r.enabled;
          }
          return map;
        });
      }
    }
  }, [initial]);

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
    if (!sameSelection(next, confirmed)) {
      setRuleOverrides({});
    }
    setConfirmed(next);
    setStep('review');
  };

  const toggleRule = (id: string, enabled: boolean) => {
    setRuleOverrides((prev) => ({ ...prev, [id]: enabled }));
  };

  const mergedRules: DietRule[] = (preview?.rules ?? []).map((r) => ({
    ...r,
    enabled: r.isHard ? true : (ruleOverrides[r.ruleDefinitionId] ?? (r.isDefault || r.enabled)),
  }));

  const isPeriodic = confirmed?.practiceSchedule === PracticeSchedule.PERIODIC;

  const handleSave = async () => {
    if (!confirmed || !preview) return;
    // Backend bắt buộc `scheduleDates` kèm preferences khi PERIODIC.
    if (isPeriodic && scheduleDates.length === 0) {
      setSaveError(
        'Bạn đang chọn chế độ Chay kỳ: Cần chọn ít nhất một ngày trong lịch. Hãy chọn ngày bên dưới rồi bấm xác nhận lại.'
      );
      return;
    }
    setSaveError(null);
    try {
      // Làm sạch danh sách kiêng: chỉ gửi ingredientName hợp lệ, bỏ reason rỗng để tuân thủ Zod min(1) strict
      const cleanExclusions = exclusions
        .filter((e) => e.ingredientName && e.ingredientName.trim().length > 0)
        .map((e) => {
          const item: { ingredientId?: string; ingredientName: string; reason?: string } = {
            ingredientName: e.ingredientName.trim(),
          };
          if (e.ingredientId) item.ingredientId = e.ingredientId;
          if (e.reason && e.reason.trim().length > 0) item.reason = e.reason.trim();
          return item;
        });

      // Làm sạch danh sách dị ứng: bỏ qua allergy rỗng
      const cleanAllergies = allergies
        .filter((a) => a.allergenCode && a.allergenCode.trim().length > 0)
        .map((a) => {
          const item: { allergenCode: string; label?: string; severity?: (typeof a)['severity'] } =
            {
              allergenCode: a.allergenCode.trim(),
            };
          if (a.label && a.label.trim().length > 0) item.label = a.label.trim();
          if (a.severity) item.severity = a.severity;
          return item;
        });

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
        allergies: cleanAllergies,
        ingredientExclusions: cleanExclusions,
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
        setSaveError('Lịch chay kỳ cần chọn ngày. Hãy chọn ít nhất 1 ngày bên dưới rồi lưu.');
        return;
      }
      if (code === 'INVALID_INGREDIENT_EXCLUSIONS') {
        setSaveError('Danh sách kiêng có mục rỗng hoặc trùng. Vui lòng kiểm tra lại.');
        return;
      }
      setSaveError('Lưu lựa chọn chế độ ăn thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stepper chỉ dẫn các bước rõ ràng */}
      <div className="flex items-center justify-between border-b pb-3 mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('select')}
            className="flex items-center gap-2 cursor-pointer text-left"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'select'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              1
            </span>
            <span
              className={`text-xs sm:text-sm font-medium ${
                step === 'select' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Chọn bộ ba chế độ ăn
            </span>
          </button>

          <span className="text-muted-foreground/40 text-xs">→</span>

          <button
            type="button"
            onClick={() => {
              if (selection.dietPattern && selection.practiceSchedule && selection.tradition) {
                startPreview();
              }
            }}
            disabled={!selection.dietPattern || !selection.practiceSchedule || !selection.tradition}
            className={`flex items-center gap-2 text-left ${
              selection.dietPattern && selection.practiceSchedule && selection.tradition
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'review'
                  ? 'bg-primary text-primary-foreground'
                  : step === 'done'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </span>
            <span
              className={`text-xs sm:text-sm font-medium ${
                step === 'review' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Tùy chỉnh quy tắc &amp; kiêng kỵ
            </span>
          </button>
        </div>

        {onCancel && step !== 'done' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Hủy bỏ
          </Button>
        )}
      </div>

      {step === 'select' && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Thiết lập chế độ ăn của bạn
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chọn kiểu ăn, lịch thực hành và truyền thống tâm linh. Hệ thống sẽ căn cứ vào lựa chọn
              này để gợi ý thực đơn và lọc món ăn an toàn.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <DietSelector value={selection} onChange={setSelection} />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {!selection.dietPattern || !selection.practiceSchedule || !selection.tradition
                  ? 'Vui lòng chọn đủ 3 mục ở trên để tiếp tục.'
                  : 'Sẵn sàng xem trước quy tắc áp dụng.'}
              </p>
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="rounded-xl"
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  className="gap-2 rounded-xl px-5"
                  disabled={
                    !selection.dietPattern || !selection.practiceSchedule || !selection.tradition
                  }
                  onClick={startPreview}
                >
                  Xem trước quy tắc <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              Xem trước và xác nhận quy tắc chế độ ăn
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Kiểm tra các quy tắc dinh dưỡng sẽ áp dụng, khai báo dị ứng hoặc thêm nguyên liệu bạn
              muốn loại trừ hoàn toàn.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {previewQuery.isLoading && <LoadingState message="Đang tải bộ quy tắc từ máy chủ..." />}
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
                  <div className="space-y-3 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        Ngày chay kỳ trong năm <span className="text-destructive">*</span>
                      </p>
                      <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                        Bắt buộc chọn ít nhất 1 ngày
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Chế độ ăn sẽ tự động áp dụng vào các ngày này trên kế hoạch bữa ăn và đề xuất
                      quán.
                    </p>
                    <ScheduleDatePicker dates={scheduleDates} onChange={setScheduleDates} />
                  </div>
                )}
              </>
            )}

            {saveError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertDescription className="text-xs font-medium">{saveError}</AlertDescription>
              </Alert>
            )}

            {configUnavailable && (
              <Alert>
                <AlertDescription className="text-xs">
                  Cấu hình diet chưa sẵn sàng từ phía hệ thống. Nút lưu đã bị khóa tạm thời.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Button
                variant="outline"
                className="gap-2 rounded-xl text-xs sm:text-sm"
                onClick={() => setStep('select')}
                disabled={saveMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại bước 1
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void previewQuery.refetch()}
                  disabled={saveMutation.isPending}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Tải lại quy tắc
                </Button>

                <Button
                  className="gap-2 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  disabled={!preview || configUnavailable || saveMutation.isPending}
                  onClick={() => void handleSave()}
                >
                  {saveMutation.isPending ? 'Đang lưu chế độ ăn...' : 'Xác nhận & Lưu chế độ ăn'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && saved && (
        <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Thiết lập chế độ ăn thành công!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hệ thống đã lưu chế độ {saved.dietPatternLabel} ({saved.practiceScheduleLabel} ·{' '}
                {saved.traditionLabel}). Mọi gợi ý công thức và kế hoạch bữa ăn sẽ tự động tuân thủ.
              </p>
            </div>
          </div>
          {saved.practiceSchedule === PracticeSchedule.PERIODIC && scheduleSlot?.(saved)}
          {onCancel && (
            <div className="pt-2">
              <Button size="sm" onClick={onCancel} className="rounded-xl">
                Hoàn tất
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
