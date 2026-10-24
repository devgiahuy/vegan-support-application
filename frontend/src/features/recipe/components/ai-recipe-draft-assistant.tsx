'use client';

import * as React from 'react';
import { Sparkles, Loader2, Wand2, ArrowDown, HelpCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

export interface AiRecipeDraftAssistantProps {
  onApplyDraft: (suggestion: RecipeDraftSuggestion) => void;
  onScrollToManualForm?: () => void;
}

export function AiRecipeDraftAssistant({
  onApplyDraft,
  onScrollToManualForm,
}: AiRecipeDraftAssistantProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [ingredientNames, setIngredientNames] = React.useState<string[]>([]);
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

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      setValidationError('Vui lòng nhập tên món ăn (tối thiểu 3 ký tự).');
      return;
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setValidationError('Vui lòng nhập mô tả ngắn hoặc cảm hứng ẩm thực.');
      return;
    }

    if (ingredientNames.length === 0) {
      setValidationError('Vui lòng nhập ít nhất 1 nguyên liệu chính để AI định lượng.');
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
  };

  return (
    <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-primary/[0.02] shadow-sm mb-8 overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Trợ lý AI Khởi tạo Nhanh
            </div>
            <CardTitle className="text-lg sm:text-xl font-black text-foreground pt-1">
              Nhập ý tưởng món — AI tự sinh định lượng &amp; bước nấu
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Tiết kiệm thời gian tính toán gam, muỗng hay gõ từng bước. Bạn chỉ cần nhập món bạn
              muốn làm và nguyên liệu có sẵn.
            </CardDescription>
          </div>

          {onScrollToManualForm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onScrollToManualForm}
              className="text-xs text-muted-foreground hover:text-foreground rounded-full gap-1 self-start sm:self-center"
            >
              <span>Nhập biểu mẫu thủ công</span>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-title" className="text-xs font-semibold text-foreground">
                Tên món ăn bạn muốn nấu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ai-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Cà ri chay nấm đông cô, Canh chua đậu hũ..."
                disabled={generateDraftMutation.isPending}
                className="h-11 rounded-xl bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-desc" className="text-xs font-semibold text-foreground">
                Mô tả ngắn cảm hứng / phong cách <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ai-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Vị ngọt thanh cốt dừa, ăn kèm bún tươi ngày mưa..."
                disabled={generateDraftMutation.isPending}
                className="h-11 rounded-xl bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Các nguyên liệu chính bạn có sẵn (nhập tên rồi gõ Enter){' '}
                <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Đã thêm {ingredientNames.length} nguyên liệu
              </span>
            </div>
            <TagInput
              value={ingredientNames}
              onChange={setIngredientNames}
              placeholder="Gõ tên nguyên liệu (vd: Đậu hũ, Nấm rơm, Khoai lang) rồi nhấn Enter..."
              disabled={generateDraftMutation.isPending}
              quickSuggestions={POPULAR_VEGAN_INGREDIENTS}
            />
          </div>

          {validationError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              💡 Gợi ý AI là bản nháp giúp bạn điền nhanh form. Bạn giữ toàn quyền tùy chỉnh sau khi
              áp dụng.
            </p>
            <Button
              type="submit"
              disabled={generateDraftMutation.isPending}
              className="w-full sm:w-auto rounded-full gap-2 px-6 shadow-sm"
            >
              {generateDraftMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI đang tính toán định lượng...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Gợi ý định lượng &amp; bước nấu bằng AI</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      <RecipeDraftPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        suggestion={suggestion}
        onApply={handleApply}
      />
    </Card>
  );
}
