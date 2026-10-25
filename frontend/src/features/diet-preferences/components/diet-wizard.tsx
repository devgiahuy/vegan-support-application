'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { DietSelector, type DietSelection } from './diet-selector';
import { DietRuleList } from './diet-rule-list';
import { AllergyEditor } from './allergy-editor';
import { ExclusionEditor } from './exclusion-editor';
import { ScheduleDatePicker } from './schedule-date-picker';
import { DietWizardSummary } from './diet-wizard-summary';
import { useAllergenCatalogQuery } from '../queries/allergen.queries';
import { useDietPreviewQuery, useSaveDietPreferencesMutation } from '../queries/diet.queries';
import { dietMapper } from '../mappers/diet.mapper';
import type { DietRulePreviewRequestDto } from '../types/diet.dto';
import type {
  Allergy,
  DietPreference,
  DietRule,
  IngredientAllergy,
  IngredientExclusion,
} from '../types/diet.model';
import { PracticeSchedule } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';

type Step = 'diet' | 'rules' | 'restrictions' | 'confirm';

const STEPS: Array<{ id: Step; title: string; description: string }> = [
  {
    id: 'diet',
    title: 'Chế độ ăn',
    description: 'Chọn kiểu ăn, thời gian thực hành và truyền thống bạn theo.',
  },
  {
    id: 'rules',
    title: 'Quy tắc',
    description: 'Xem những gì hệ thống sẽ lọc và bật thêm quy tắc tùy chọn.',
  },
  {
    id: 'restrictions',
    title: 'Dị ứng & kiêng',
    description: 'Khai báo thực phẩm gây dị ứng và nguyên liệu bạn không muốn ăn.',
  },
  {
    id: 'confirm',
    title: 'Xác nhận',
    description: 'Kiểm tra lại toàn bộ thiết lập trước khi lưu.',
  },
];

function toPreviewRequest(selection: DietSelection): DietRulePreviewRequestDto | null {
  if (!selection.dietPattern || !selection.practiceSchedule || !selection.tradition) return null;
  return {
    dietPattern: selection.dietPattern,
    practiceSchedule: selection.practiceSchedule,
    tradition: selection.tradition,
  };
}

function sameSelection(a: DietRulePreviewRequestDto | null, b: DietRulePreviewRequestDto | null) {
  return (
    !!a &&
    !!b &&
    a.dietPattern === b.dietPattern &&
    a.practiceSchedule === b.practiceSchedule &&
    a.tradition === b.tradition
  );
}

/**
 * Wizard thiết lập chế độ ăn 4 bước:
 * 1. Chế độ ăn (bộ ba + ngày chay kỳ) → 2. Quy tắc từ preview → 3. Dị ứng & kiêng → 4. Xác nhận lưu.
 * Cột tóm tắt bên phải cập nhật theo từng lựa chọn.
 */
export function DietWizard({
  initial,
  initialSelection,
  onSaved,
  onCancel,
  scheduleSlot,
}: {
  initial?: DietPreference | null;
  /** Bộ ba chọn sẵn (vd từ tóm tắt hồ sơ) — chỉ preselect, không tự gọi preview. */
  initialSelection?: DietSelection | null;
  onSaved?: (preference: DietPreference) => void;
  onCancel?: () => void;
  /** Slot lịch chay kỳ — hiện sau khi lưu với PERIODIC. */
  scheduleSlot?: (preference: DietPreference) => React.ReactNode;
}) {
  const [step, setStep] = React.useState<Step>('diet');
  const [selection, setSelection] = React.useState<DietSelection>({
    dietPattern: initialSelection?.dietPattern ?? initial?.dietPattern,
    practiceSchedule: initialSelection?.practiceSchedule ?? initial?.practiceSchedule,
    tradition: initialSelection?.tradition ?? initial?.tradition,
  });
  const [confirmed, setConfirmed] = React.useState<DietRulePreviewRequestDto | null>(null);
  const [ruleOverrides, setRuleOverrides] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries((initial?.rules ?? []).map((r) => [r.ruleDefinitionId, r.enabled]))
  );
  const [allergies, setAllergies] = React.useState<Allergy[]>(initial?.allergies ?? []);
  const [allergySearch, setAllergySearch] = React.useState('');
  const [ingredientAllergies, setIngredientAllergies] = React.useState<IngredientAllergy[]>(
    initial?.ingredientAllergies ?? []
  );
  const [exclusions, setExclusions] = React.useState<IngredientExclusion[]>(
    initial?.ingredientExclusions ?? []
  );
  const [exclusionSearch, setExclusionSearch] = React.useState('');
  // Backend bắt buộc `scheduleDates` kèm preferences khi PERIODIC (thiếu → `DIET_SCHEDULE_REQUIRED`).
  const [scheduleDates, setScheduleDates] = React.useState<string[]>(
    initial?.schedule?.dates ?? []
  );
  const [stepError, setStepError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<DietPreference | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [configUnavailable, setConfigUnavailable] = React.useState(false);

  const allergenCatalog = useAllergenCatalogQuery();
  const previewQuery = useDietPreviewQuery(confirmed);
  const saveMutation = useSaveDietPreferencesMutation();
  const preview = previewQuery.data ?? null;

  const request = toPreviewRequest(selection);
  const isPeriodic = selection.practiceSchedule === PracticeSchedule.PERIODIC;
  const dietStepValid = !!request && (!isPeriodic || scheduleDates.length > 0);

  const mergedRules: DietRule[] | null = preview
    ? preview.rules.map((r) => ({
        ...r,
        enabled: r.isHard
          ? true
          : (ruleOverrides[r.ruleDefinitionId] ?? (r.isDefault || r.enabled)),
      }))
    : null;

  const restrictionIssue = (() => {
    if (allergenCatalog.isPending) return 'Đang tải danh mục dị ứng, vui lòng chờ.';
    if (allergenCatalog.isError)
      return 'Không tải được danh mục dị ứng. Hãy thử lại trước khi lưu.';
    if (allergies.some((a) => !allergenCatalog.data?.some((o) => o.code === a.allergenCode)))
      return 'Có nhóm dị ứng không còn trong danh mục. Hãy bỏ mục đó trước khi lưu.';
    if (ingredientAllergies.some((a) => !a.ingredientActive))
      return 'Có nguyên liệu dị ứng đã ngừng hoạt động. Hãy bỏ mục đó trước khi lưu.';
    return null;
  })();

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canReach = (target: Step) => {
    if (target === 'diet') return true;
    if (!dietStepValid) return false;
    if (target === 'rules') return true;
    return !!preview;
  };

  const goTo = (target: Step) => {
    setStepError(null);
    if (target !== 'diet') {
      if (!request) {
        setStepError('Vui lòng chọn đủ kiểu ăn, thời gian và truyền thống.');
        return;
      }
      if (isPeriodic && scheduleDates.length === 0) {
        setStepError('Chay kỳ cần ít nhất một ngày. Hãy thêm ngày ở bên trên.');
        return;
      }
      if (!sameSelection(request, confirmed)) {
        // Đổi bộ ba → bộ quy tắc mới, bỏ lựa chọn bật/tắt cũ.
        if (confirmed) setRuleOverrides({});
        setConfigUnavailable(false);
        setConfirmed(request);
        setStep('rules');
        return;
      }
    }
    setStep(target);
  };

  const handleSave = async () => {
    if (!confirmed || !preview || !mergedRules) return;
    if (restrictionIssue) {
      setSaveError(restrictionIssue);
      return;
    }
    setSaveError(null);
    try {
      const result = await saveMutation.mutateAsync(
        dietMapper.toSaveDto({
          ...confirmed,
          ruleSetVersion: preview.ruleSetVersion,
          rules: mergedRules,
          ...(confirmed.practiceSchedule === PracticeSchedule.PERIODIC ? { scheduleDates } : {}),
          allergies,
          ingredientAllergies,
          ingredientExclusions: exclusions,
        })
      );

      if (result.requiresRuleReview) {
        // Backend yêu cầu xem lại — quay về bước quy tắc, giữ nguyên lựa chọn.
        setSaveError('Bộ quy tắc vừa được cập nhật. Vui lòng xem lại trước khi lưu.');
        setStep('rules');
        void previewQuery.refetch();
        return;
      }
      setSaved(result);
      onSaved?.(result);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'INVALID_ALLERGEN_SELECTION') {
        setSaveError('Danh mục dị ứng đã thay đổi. Vui lòng chọn lại thực phẩm từ danh sách.');
        void allergenCatalog.refetch();
        return;
      }
      if (code === 'INVALID_INGREDIENT_ALLERGIES') {
        setSaveError(
          'Một số nguyên liệu dị ứng không còn hoạt động. Vui lòng bỏ chúng và chọn lại từ danh mục chuẩn.'
        );
        return;
      }
      if (code === 'DIET_RULE_RECONFIRMATION_REQUIRED') {
        setSaveError('Bộ quy tắc đã thay đổi. Vui lòng xem lại trước khi xác nhận.');
        setStep('rules');
        void previewQuery.refetch();
        return;
      }
      if (code === 'INVALID_DIET_RULE_SELECTION') {
        setSaveError('Lựa chọn chưa khớp bộ quy tắc mới. Đã tải lại, vui lòng xem lại quy tắc.');
        setStep('rules');
        void previewQuery.refetch();
        return;
      }
      if (code === 'DIET_RULES_UNAVAILABLE') {
        setConfigUnavailable(true);
        setSaveError('Cấu hình chế độ ăn chưa sẵn sàng. Vui lòng thử lại sau.');
        return;
      }
      if (code === 'DIET_SCHEDULE_REQUIRED') {
        setSaveError('Chay kỳ cần ít nhất một ngày. Hãy quay lại bước 1 để thêm ngày.');
        return;
      }
      if (code === 'INVALID_INGREDIENT_EXCLUSIONS') {
        setSaveError('Danh sách kiêng có mục rỗng hoặc trùng. Vui lòng kiểm tra lại.');
        return;
      }
      setSaveError('Lưu chế độ ăn thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  if (saved) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <CardTitle className="text-balance">Đã lưu chế độ ăn của bạn</CardTitle>
              <CardDescription className="text-pretty">
                {saved.dietPatternLabel} · {saved.practiceScheduleLabel} · {saved.traditionLabel}.
                Gợi ý công thức và thực đơn từ giờ sẽ tuân theo thiết lập này.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {saved.practiceSchedule === PracticeSchedule.PERIODIC && scheduleSlot && (
          <CardContent>{scheduleSlot(saved)}</CardContent>
        )}
        {onCancel && (
          <CardFooter>
            <Button type="button" onClick={onCancel}>
              Hoàn tất
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  const current = STEPS[stepIndex]!;
  const summary = (
    <DietWizardSummary
      selection={selection}
      scheduleDates={scheduleDates}
      rules={mergedRules}
      allergies={allergies}
      ingredientAllergies={ingredientAllergies}
      exclusions={exclusions}
      onEdit={step === 'confirm' ? (section) => goTo(section) : undefined}
      compact={step !== 'confirm'}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-balance">Thiết lập chế độ ăn</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Hệ thống dùng thiết lập này để lọc món, gợi ý công thức và lập thực đơn an toàn cho bạn.
          </p>
        </div>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X data-icon="inline-start" />
            Hủy
          </Button>
        )}
      </div>

      <nav aria-label="Các bước thiết lập">
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, index) => {
            const active = s.id === step;
            const done = index < stepIndex;
            const reachable = canReach(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable || saveMutation.isPending}
                  aria-current={active ? 'step' : undefined}
                  onClick={() => goTo(s.id)}
                  className="group flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-1 w-full rounded-full bg-muted transition-colors',
                      (active || done) && 'bg-primary'
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                        active && 'border-primary bg-primary text-primary-foreground',
                        done && 'border-primary text-primary',
                        !active && !done && 'text-muted-foreground'
                      )}
                    >
                      {done ? <Check aria-hidden className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        'hidden truncate text-sm sm:inline',
                        active ? 'font-semibold' : 'text-muted-foreground',
                        reachable && !active && 'group-hover:text-foreground'
                      )}
                    >
                      {s.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-sm font-medium sm:hidden">
          Bước {stepIndex + 1}/{STEPS.length}: {current.title}
        </p>
      </nav>

      <div
        className={cn(
          'grid items-start gap-6',
          step !== 'confirm' && 'lg:grid-cols-[minmax(0,1fr)_18rem]'
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">{current.title}</CardTitle>
            <CardDescription className="text-pretty">{current.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {step === 'diet' && (
              <DietSelector
                value={selection}
                onChange={(next) => {
                  setStepError(null);
                  setSelection(next);
                }}
                scheduleSlot={
                  isPeriodic && (
                    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">Ngày chay trong năm</p>
                        <p className="text-xs text-muted-foreground">
                          Cần ít nhất một ngày. Thực đơn và gợi ý chỉ lọc chay vào các ngày này.
                        </p>
                      </div>
                      <ScheduleDatePicker
                        dates={scheduleDates}
                        onChange={(dates) => {
                          setStepError(null);
                          setScheduleDates(dates);
                        }}
                      />
                    </div>
                  )
                }
              />
            )}

            {step === 'rules' && (
              <>
                {previewQuery.isPending && (
                  <div className="flex flex-col gap-2" aria-label="Đang tải bộ quy tắc">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                )}
                {previewQuery.isError && (
                  <ErrorState
                    title="Không tải được bộ quy tắc."
                    error={previewQuery.error}
                    onRetry={() => void previewQuery.refetch()}
                  />
                )}
                {mergedRules && (
                  <DietRuleList
                    rules={mergedRules}
                    onToggle={(id, enabled) =>
                      setRuleOverrides((prev) => ({ ...prev, [id]: enabled }))
                    }
                  />
                )}
              </>
            )}

            {step === 'restrictions' && (
              <>
                <AllergyEditor
                  value={allergies}
                  onChange={setAllergies}
                  search={allergySearch}
                  onSearchChange={setAllergySearch}
                  catalog={allergenCatalog.data ?? []}
                  loading={allergenCatalog.isPending}
                  failed={allergenCatalog.isError}
                  onRetry={() => void allergenCatalog.refetch()}
                  ingredientValue={ingredientAllergies}
                  onIngredientChange={setIngredientAllergies}
                />
                <ExclusionEditor
                  value={exclusions}
                  onChange={setExclusions}
                  search={exclusionSearch}
                  onSearchChange={setExclusionSearch}
                />
              </>
            )}

            {step === 'confirm' && (
              <>
                {summary}
                {restrictionIssue && (
                  <Alert>
                    <AlertDescription>{restrictionIssue}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {(saveError || configUnavailable) && (
              <Alert variant="destructive">
                <AlertTitle>Chưa lưu được</AlertTitle>
                <AlertDescription>
                  {saveError ?? 'Cấu hình chế độ ăn chưa sẵn sàng. Nút lưu tạm thời bị khóa.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-stretch gap-3 border-t">
            {stepError && (
              <p role="alert" className="text-sm text-destructive">
                {stepError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(STEPS[stepIndex - 1]!.id)}
                  disabled={saveMutation.isPending}
                >
                  <ArrowLeft data-icon="inline-start" />
                  Quay lại
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {step === 'rules' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void previewQuery.refetch()}
                    disabled={previewQuery.isFetching}
                  >
                    <RefreshCw data-icon="inline-start" />
                    Tải lại
                  </Button>
                )}
                {step === 'confirm' ? (
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={
                      !preview || configUnavailable || saveMutation.isPending || !!restrictionIssue
                    }
                  >
                    {saveMutation.isPending ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    {saveMutation.isPending ? 'Đang lưu…' : 'Lưu chế độ ăn'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => goTo(STEPS[stepIndex + 1]!.id)}
                    disabled={step === 'rules' && !preview}
                  >
                    Tiếp tục
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>

        {step !== 'confirm' && (
          <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Tóm tắt thiết lập">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent>{summary}</CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
