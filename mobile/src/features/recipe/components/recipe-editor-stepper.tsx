import { Pressable, Text, View } from 'react-native';
import { Check, CircleAlert } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import {
  RECIPE_EDITOR_STEPS,
  type RecipeContentStep,
  type RecipeEditorStep,
  type RecipeFieldIssue,
} from '../utils/recipe-editor';

/**
 * Thanh 5 bước ở đầu form (đoạn xanh = đang ở/đã đủ, đỏ = có lỗi sau khi bấm Tiếp), chạm để nhảy bước,
 * kèm dòng "Bước x/5: <tên bước>" như bản web trên màn hình nhỏ.
 */
export function RecipeEditorStepper({
  current,
  issues,
  attempted,
  disabled,
  onSelect,
}: {
  current: RecipeEditorStep;
  issues: RecipeFieldIssue[];
  attempted: ReadonlySet<RecipeContentStep>;
  disabled?: boolean;
  onSelect: (step: RecipeEditorStep) => void;
}) {
  const colors = useIconColors();
  const index = RECIPE_EDITOR_STEPS.findIndex((step) => step.id === current);
  return (
    <View accessibilityRole="tablist" className="gap-2">
      <View className="flex-row gap-2">
        {RECIPE_EDITOR_STEPS.map((step, position) => {
          const active = step.id === current;
          const content = step.id !== 'review';
          const complete = content && !issues.some((issue) => issue.step === step.id);
          const hasError = content && attempted.has(step.id as RecipeContentStep) && !complete;
          return (
            <Pressable
              key={step.id}
              accessibilityRole="tab"
              accessibilityLabel={`${step.title}${hasError ? ' (có lỗi)' : complete ? ' (đã đủ)' : ''}`}
              accessibilityState={{ selected: active }}
              disabled={disabled}
              onPress={() => onSelect(step.id)}
              className="flex-1 gap-1.5">
              <View className={cn('h-1 rounded-full bg-muted', (active || complete) && 'bg-primary', hasError && 'bg-destructive')} />
              <View
                className={cn(
                  'size-6 items-center justify-center self-start rounded-full border',
                  active ? 'border-primary bg-primary' : hasError ? 'border-destructive' : complete ? 'border-primary' : 'border-input'
                )}>
                {hasError && !active ? (
                  <CircleAlert size={13} color={colors.destructive} />
                ) : complete && !active ? (
                  <Check size={13} color={colors.primary} />
                ) : (
                  <Text className={cn('text-[11px] font-semibold', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{position + 1}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-sm font-medium text-foreground">
        Bước {index + 1}/{RECIPE_EDITOR_STEPS.length}: {RECIPE_EDITOR_STEPS[index]?.title}
      </Text>
    </View>
  );
}
