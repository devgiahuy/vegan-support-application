import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AllergyEditor } from '@/features/diet-preferences/components/allergy-editor';
import { ExclusionEditor } from '@/features/diet-preferences/components/exclusion-editor';
import { FoodAllowanceSwitches } from '@/features/diet-preferences/components/food-allowance-switches';
import type {
  DraftAllergy,
  DraftIngredientAllergy,
  DraftIngredientExclusion,
} from '@/features/diet-preferences/types/diet-preferences.model';
import type { FoodAllowanceSelection } from '@/features/diet-preferences/types/food-allowances.model';

/** Phần nhập liệu dùng UI Models, không tự lưu khi người dùng đổi một lựa chọn. */
export function FoodPreferencesForm({
  allowances,
  onAllowancesChange,
  allergies,
  onAllergiesChange,
  ingredientAllergies,
  onIngredientAllergiesChange,
  exclusions,
  onExclusionsChange,
  allergySearch,
  onAllergySearchChange,
  exclusionSearch,
  onExclusionSearchChange,
  busy,
  error,
  onReview,
  onCancel,
}: {
  allowances: FoodAllowanceSelection;
  onAllowancesChange: (value: FoodAllowanceSelection) => void;
  allergies: DraftAllergy[];
  onAllergiesChange: (value: DraftAllergy[]) => void;
  ingredientAllergies: DraftIngredientAllergy[];
  onIngredientAllergiesChange: (value: DraftIngredientAllergy[]) => void;
  exclusions: DraftIngredientExclusion[];
  onExclusionsChange: (value: DraftIngredientExclusion[]) => void;
  allergySearch: string;
  onAllergySearchChange: (value: string) => void;
  exclusionSearch: string;
  onExclusionSearchChange: (value: string) => void;
  busy: boolean;
  error: string | null;
  onReview: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="gap-6" pointerEvents={busy ? 'none' : 'auto'} accessibilityState={{ busy }}>
      <FoodAllowanceSwitches value={allowances} onChange={onAllowancesChange} disabled={busy} />
      <View className="gap-6 rounded-xl border border-border bg-card p-4">
        <View className="gap-1">
          <Text className="text-lg font-semibold text-foreground">Dị ứng và nguyên liệu kiêng</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Những thực phẩm này luôn được loại khỏi gợi ý, kể cả khi bạn cho phép nhóm tương ứng ở trên.
          </Text>
        </View>
        <AllergyEditor
          allergies={allergies}
          onAllergiesChange={onAllergiesChange}
          ingredientAllergies={ingredientAllergies}
          onIngredientAllergiesChange={onIngredientAllergiesChange}
          search={allergySearch}
          onSearchChange={onAllergySearchChange}
        />
        <ExclusionEditor
          value={exclusions}
          onChange={onExclusionsChange}
          search={exclusionSearch}
          onSearchChange={onExclusionSearchChange}
        />
      </View>
      {error ? (
        <View accessibilityRole="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Text className="text-sm leading-5 text-destructive">{error}</Text>
        </View>
      ) : null}
      <Text className="text-xs leading-5 text-muted-foreground">
        Trước khi lưu, hệ thống sẽ kiểm tra ảnh hưởng tới các thực đơn hiện tại và sắp tới của bạn.
      </Text>
      <PrimaryButton label="Xem lại và lưu" loading={busy} onPress={onReview} />
      <PrimaryButton label="Hủy thay đổi" variant="outline" disabled={busy} onPress={onCancel} />
    </View>
  );
}
