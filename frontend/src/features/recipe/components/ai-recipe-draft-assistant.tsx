'use client';

import * as React from 'react';
import { ChevronDown, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { TagInput } from './tag-input';
import { RecipeDraftPreviewDialog } from './recipe-draft-preview-dialog';
import { useGenerateRecipeDraftMutation } from '../queries/recipe-draft.queries';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';

const POPULAR_VEGAN_INGREDIENTS = [
  'Đậu hũ',
  'Nấm đông cô',
  'Cà rốt',
  'Nước cốt dừa',
  'Hành boa-rô',
  'Sả cây',
  'Nấm đùi gà',
  'Khoai tây',
  'Bột cà ri',
  'Rau mùi',
];

export interface AiRecipeDraftSeed {
  /** Tên món và mô tả lấy thẳng từ bước "Thông tin cơ bản" — không hỏi lại. */
  title: string;
  description: string;
  /** Tên nguyên liệu đã nhập trong form, dùng làm danh sách khởi đầu. */
  ingredientNames: string[];
}

export interface AiRecipeDraftAssistantProps {
  seed: AiRecipeDraftSeed;
  onApplyDraft: (suggestion: RecipeDraftSuggestion) => void;
  /** Quay về bước thông tin cơ bản khi thiếu tên món hoặc mô tả. */
  onEditBasics?: () => void;
}

/**
 * Trợ lý AI gợi ý định lượng và bước nấu. Nằm trong bước "Nguyên liệu" của form
 * nên dùng `div` thay vì `<form>` lồng nhau, và tái dùng tên món/mô tả đã nhập.
 */
export function AiRecipeDraftAssistant({
  seed,
  onApplyDraft,
  onEditBasics,
}: AiRecipeDraftAssistantProps) {
  const [open, setOpen] = React.useState(false);
  const [ingredientNames, setIngredientNames] = React.useState<string[]>(seed.ingredientNames);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<RecipeDraftSuggestion | null>(null);

  const generateDraftMutation = useGenerateRecipeDraftMutation({
    onSuccess: (data) => {
      setSuggestion(data);
      setPreviewOpen(true);
      setValidationError(null);
    },
  });

  const cleanTitle = seed.title.trim();
  const cleanDesc = seed.description.trim();
  const missingBasics = cleanTitle.length < 3 || !cleanDesc;

  const handleOpenChange = (next: boolean) => {
    // Mỗi lần mở lại, lấy danh sách nguyên liệu mới nhất từ form làm điểm khởi đầu.
    if (next && seed.ingredientNames.length > 0) setIngredientNames(seed.ingredientNames);
    setOpen(next);
  };

  const handleGenerate = () => {
    setValidationError(null);
    if (missingBasics) {
      setValidationError('Cần tên món (tối thiểu 3 ký tự) và mô tả ngắn ở bước 1 để AI gợi ý.');
      return;
    }
    if (ingredientNames.length === 0) {
      setValidationError('Thêm ít nhất 1 nguyên liệu chính để AI định lượng.');
      return;
    }
    generateDraftMutation.mutate({
      title: cleanTitle,
      description: cleanDesc,
      ingredientNames,
    });
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApplyDraft(suggestion);
    setPreviewOpen(false);
    setOpen(false);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="rounded-xl border border-primary/25 bg-primary/[0.03]"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-primary/5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles aria-hidden className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold">Để AI gợi ý định lượng và các bước nấu</span>
            <span className="text-xs text-pretty text-muted-foreground">
              Tùy chọn. AI điền sẵn nguyên liệu, bước nấu, khẩu phần và thời gian; bạn vẫn sửa được
              mọi thứ trước khi gửi.
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-4 border-t border-primary/15 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <p className="min-w-0 text-pretty">
            <span className="text-muted-foreground">Món: </span>
            {cleanTitle ? (
              <span className="font-medium">{cleanTitle}</span>
            ) : (
              <span className="text-muted-foreground italic">chưa có tên món</span>
            )}
          </p>
          {onEditBasics && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={onEditBasics}
            >
              Sửa tên & mô tả
            </Button>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="ai-ingredient-names">Nguyên liệu chính bạn có</FieldLabel>
          <TagInput
            id="ai-ingredient-names"
            aria-describedby="ai-ingredient-names-help"
            value={ingredientNames}
            onChange={setIngredientNames}
            placeholder="Gõ tên nguyên liệu rồi nhấn Enter, vd: Đậu hũ"
            disabled={generateDraftMutation.isPending}
            quickSuggestions={POPULAR_VEGAN_INGREDIENTS}
          />
          <FieldDescription id="ai-ingredient-names-help" className="text-xs">
            Đã thêm {ingredientNames.length} nguyên liệu. AI chỉ nhận chữ, không nhận ảnh.
          </FieldDescription>
        </Field>

        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generateDraftMutation.isPending}
            className="w-full sm:w-auto"
          >
            {generateDraftMutation.isPending ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                AI đang gợi ý…
              </>
            ) : (
              <>
                <Wand2 data-icon="inline-start" />
                Tạo gợi ý
              </>
            )}
          </Button>
        </div>
      </CollapsibleContent>

      <RecipeDraftPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        suggestion={suggestion}
        onApply={handleApply}
      />
    </Collapsible>
  );
}
