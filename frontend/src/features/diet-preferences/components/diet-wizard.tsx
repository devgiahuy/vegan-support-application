'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FoodPreferenceFields } from './food-preference-fields';
import { AllergyEditor } from './allergy-editor';
import { ExclusionEditor } from './exclusion-editor';
import { DietImpactDialog } from './diet-impact-dialog';
import { DietImpactNotice } from './diet-impact-notice';
import { useAllergenCatalogQuery } from '../queries/allergen.queries';
import { useSaveDietPreferencesMutation, useDietPreviewQuery } from '../queries/diet.queries';
import { useDietImpactPreview } from '../queries/diet-impact.queries';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { impactMealViews } from '../utils/diet-impact-view';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import type { FoodAllowances } from '../types/food-allowances.model';
import type {
  DietPreference,
  DietPreferenceDraft,
  Allergy,
  IngredientAllergy,
  IngredientExclusion,
} from '../types/diet.model';
import type { DietaryImpact } from '../types/diet-impact.model';

function selectionOf(preference: FoodAllowances | null | undefined): FoodAllowances {
  return {
    allowEggs: preference?.allowEggs ?? false,
    allowDairy: preference?.allowDairy ?? false,
    allowHoney: preference?.allowHoney ?? false,
    allowFivePungent: preference?.allowFivePungent ?? false,
  };
}
export function DietWizard({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: DietPreference | null;
  onSaved?: (preference: DietPreference) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [base, setBase] = useState(initial ?? null);
  const [selection, setSelection] = useState<FoodAllowances>(() => selectionOf(initial));
  const [allergies, setAllergies] = useState<Allergy[]>(initial?.allergies ?? []);
  const [ingredientAllergies, setIngredientAllergies] = useState<IngredientAllergy[]>(
    initial?.ingredientAllergies ?? []
  );
  const [exclusions, setExclusions] = useState<IngredientExclusion[]>(
    initial?.ingredientExclusions ?? []
  );
  const [allergySearch, setAllergySearch] = useState('');
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [impact, setImpact] = useState<DietaryImpact | null>(null);
  const [pending, setPending] = useState<DietPreferenceDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState<DietPreference | null>(null);
  const catalog = useAllergenCatalogQuery();
  const policy = useDietPreviewQuery(selection);
  const profile = useDetailedProfileQuery();
  const preview = useDietImpactPreview();
  const save = useSaveDietPreferencesMutation();
  const busy = preview.isPending || save.isPending;
  const fail = (failure: unknown) => {
    const code = getApiErrorCode(failure);
    setConflict(code === 'DIET_PREFERENCES_CONFLICT');
    if (code === 'DIET_RULE_RECONFIRMATION_REQUIRED') void policy.refetch();
    if (code === 'INVALID_ALLERGEN_SELECTION') void catalog.refetch();
    setError(getApiErrorMessage(failure));
  };
  const reload = async () => {
    const fresh = await profile.refetch();
    if (fresh.isError) {
      setError('Không tải lại được thiết lập. Vui lòng thử lại.');
      return;
    }
    const preference = fresh.data?.diet ?? null;
    setBase(preference);
    setSelection(selectionOf(preference));
    setAllergies(preference?.allergies ?? []);
    setIngredientAllergies(preference?.ingredientAllergies ?? []);
    setExclusions(preference?.ingredientExclusions ?? []);
    setImpact(null);
    setPending(null);
    setSaved(null);
    setConflict(false);
    setError(null);
  };
  const repair = (preference: DietPreference, assessment: DietaryImpact) => {
    const params = new URLSearchParams({
      plans: assessment.plans.map((plan) => plan.planId).join(','),
      revision: String(preference.dietaryRevision),
    });
    router.push('/meal-plans/diet-repair?' + params.toString());
  };
  const persist = async (replace: boolean, input: DietPreferenceDraft) => {
    setError(null);
    try {
      const preference = await save.mutateAsync(input);
      setSaved(preference);
      setBase(preference);
      setImpact(null);
      setPending(null);
      if (preference.impactUnavailable || !preference.impact) {
        setSaved({ ...preference, impactUnavailable: true });
        toast.warning('Đã lưu thiết lập, chưa kiểm tra được ảnh hưởng lên thực đơn.');
        return;
      }
      toast.success('Đã lưu thiết lập ăn uống.');
      if (replace && preference.impact.affectedMealCount > 0) repair(preference, preference.impact);
      else onSaved?.(preference);
    } catch (failure) {
      fail(failure);
    }
  };
  const review = async () => {
    setError(null);
    if (catalog.isPending || catalog.isError || !catalog.data) {
      setError('Hãy tải lại danh mục dị ứng trước khi lưu.');
      return;
    }
    if (
      allergies.some((item) => !catalog.data.some((option) => option.code === item.allergenCode))
    ) {
      setError(
        'Có dị ứng không còn trong danh mục. Hãy kiểm tra và chọn lại; lựa chọn đã lưu chưa bị xóa.'
      );
      return;
    }
    if (ingredientAllergies.some((item) => !item.ingredientActive)) {
      setError('Có nguyên liệu dị ứng đã ngừng hoạt động. Hãy bỏ hoặc chọn lại trước khi lưu.');
      return;
    }
    if (allergySearch.trim() || exclusionSearch.trim()) {
      setError('Hãy chọn kết quả tìm kiếm hoặc xóa nội dung đang nhập trước khi lưu.');
      return;
    }
    if (policy.isError || !policy.data?.policyVersion) {
      setError('Chưa tải được chính sách ăn uống. Vui lòng thử lại.');
      return;
    }
    if (base && !base.selectionValid) {
      setError('Thiết lập hiện tại chưa đủ dữ liệu. Hãy tải lại trước khi lưu.');
      setConflict(true);
      return;
    }
    const input: DietPreferenceDraft = {
      ...selection,
      policyVersion: policy.data.policyVersion,
      expectedDietaryRevision: base?.dietaryRevision ?? 0,
      allergies,
      ingredientAllergies,
      ingredientExclusions: exclusions,
    };
    try {
      const assessment = await preview.mutateAsync(input);
      if (assessment.affectedMealCount > 0) {
        setPending(input);
        setImpact(assessment);
      } else await persist(false, input);
    } catch (failure) {
      fail(failure);
    }
  };
  const recheck = async () => {
    if (!saved) return;
    setError(null);
    try {
      const assessment = await preview.mutateAsync({
        ...selectionOf(saved),
        policyVersion: saved.policyVersion,
        expectedDietaryRevision: saved.dietaryRevision,
        allergies: saved.allergies,
        ingredientAllergies: saved.ingredientAllergies,
        ingredientExclusions: saved.ingredientExclusions,
      });
      const preference = { ...saved, impact: assessment, impactUnavailable: false };
      setSaved(preference);
      if (assessment.affectedMealCount > 0) {
        setImpact(assessment);
        setPending(null);
      } else {
        toast.success('Không có thực đơn nào bị ảnh hưởng.');
        onSaved?.(preference);
      }
    } catch (failure) {
      setError('Thiết lập đã được lưu. ' + getApiErrorMessage(failure));
    }
  };
  const selectAction = (replace: boolean) => {
    if (pending) void persist(replace, pending);
    else if (saved && impact) {
      if (replace) repair(saved, impact);
      else {
        setImpact(null);
        onSaved?.(saved);
      }
    }
  };
  return (
    <>
      {saved ? (
        <Card>
          <CardHeader>
            <CardTitle>Đã lưu thiết lập ăn uống</CardTitle>
            <CardDescription>
              Thiết lập mới đã có hiệu lực. Thực đơn chỉ thay đổi khi bạn áp dụng phương án thay
              món.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DietImpactNotice
              affectedCount={saved.impact?.affectedMealCount ?? 0}
              assessmentUnavailable={saved.impactUnavailable}
              onRecheck={() => void recheck()}
              onRepair={saved.impact ? () => repair(saved, saved.impact!) : undefined}
              pending={busy}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => onSaved?.(saved)} disabled={busy}>
              Hoàn tất
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập ăn uống</CardTitle>
            <CardDescription>
              Chọn thực phẩm bạn ăn. Mọi giới hạn được áp dụng mỗi ngày.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <fieldset disabled={busy} className="flex flex-col gap-7">
              <FoodPreferenceFields value={selection} onChange={setSelection} disabled={busy} />
              <AllergyEditor
                value={allergies}
                onChange={setAllergies}
                search={allergySearch}
                onSearchChange={setAllergySearch}
                catalog={catalog.data ?? []}
                loading={catalog.isPending}
                failed={catalog.isError}
                onRetry={() => void catalog.refetch()}
                ingredientValue={ingredientAllergies}
                onIngredientChange={setIngredientAllergies}
              />
              <ExclusionEditor
                value={exclusions}
                onChange={setExclusions}
                search={exclusionSearch}
                onSearchChange={setExclusionSearch}
              />
            </fieldset>
            {policy.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Không tải được chính sách ăn uống.{' '}
                  <Button variant="link" onClick={() => void policy.refetch()}>
                    Thử lại
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {conflict && (
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => void reload()}
                disabled={profile.isFetching}
              >
                Tải lại thiết lập hiện tại
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button
              disabled={busy || catalog.isPending || policy.isPending}
              onClick={() => void review()}
            >
              {busy ? 'Đang kiểm tra…' : 'Xem lại và lưu'}
            </Button>
            {onCancel && (
              <Button variant="outline" disabled={busy} onClick={onCancel}>
                Hủy
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      <DietImpactDialog
        open={!!impact}
        profileAlreadySaved={!!saved}
        planCount={impact?.affectedPlanCount ?? 0}
        meals={impact ? impactMealViews(impact) : []}
        busy={busy}
        error={error}
        onReplace={() => selectAction(true)}
        onKeep={() => selectAction(false)}
        onBack={() => {
          setImpact(null);
          setPending(null);
        }}
      />
    </>
  );
}
