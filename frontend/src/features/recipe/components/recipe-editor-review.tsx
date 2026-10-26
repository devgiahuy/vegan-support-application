'use client';

import * as React from 'react';
import { AlertCircle, Check, CheckCircle2, Circle, ImageOff, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { RecipeDifficulty } from '@/common/enums';
import { SafeImage } from '@/components/shared/safe-image';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';
import {
  RECIPE_EDITOR_STEPS,
  issueLocation,
  stepTitle,
  type RecipeContentStep,
  type RecipeFieldIssue,
} from './recipe-editor-steps';

export const DIFFICULTY_OPTIONS: Array<{
  value: RecipeDifficulty;
  label: string;
  description: string;
}> = [
  { value: RecipeDifficulty.EASY, label: 'Dễ', description: 'Người mới vào bếp làm được.' },
  { value: RecipeDifficulty.MEDIUM, label: 'Trung bình', description: 'Cần chút kinh nghiệm.' },
  { value: RecipeDifficulty.HARD, label: 'Nâng cao', description: 'Nhiều công đoạn, kỹ thuật.' },
];

export function difficultyLabel(value: RecipeDifficulty | undefined): string {
  return DIFFICULTY_OPTIONS.find((o) => o.value === value)?.label ?? 'Chưa chọn';
}

function formatNumber(value: number | undefined, suffix: string): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value} ${suffix}` : '—';
}

const CONTENT_STEPS = RECIPE_EDITOR_STEPS.filter(
  (s): s is (typeof RECIPE_EDITOR_STEPS)[number] & { id: RecipeContentStep } => s.id !== 'review'
);

/** Một dòng trạng thái ngắn cho từng phần — chỉ đếm, không lặp lại nội dung. */
function sectionStatus(step: RecipeContentStep, values: RecipeFormValues, categoryName?: string) {
  switch (step) {
    case 'basics':
      return values.title?.trim() || 'Chưa có tên món';
    case 'ingredients': {
      const filled = values.ingredients.filter((i) => i.name?.trim());
      const linked = filled.filter((i) => i.ingredientId).length;
      return filled.length ? `${filled.length} nguyên liệu · ${linked} đã liên kết` : 'Chưa có';
    }
    case 'steps': {
      const filled = values.steps.filter((s) => s.instruction?.trim()).length;
      return filled ? `${filled} bước` : 'Chưa có';
    }
    case 'classify':
      return categoryName ?? 'Chưa chọn danh mục';
  }
}

/** Cột tiến độ bên phải các bước nhập liệu. */
export function RecipeEditorProgress({
  values,
  issues,
  categoryName,
  currentStep,
  onSelect,
}: {
  values: RecipeFormValues;
  issues: RecipeFieldIssue[];
  categoryName?: string;
  currentStep: RecipeContentStep;
  onSelect: (step: RecipeContentStep) => void;
}) {
  const done = CONTENT_STEPS.filter((s) => !issues.some((i) => i.step === s.id)).length;
  return (
    <aside
      aria-label="Tiến độ công thức"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:sticky lg:top-24"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Tiến độ</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{CONTENT_STEPS.length} phần
          </span>
        </div>
        <Progress value={(done / CONTENT_STEPS.length) * 100} aria-label="Phần đã hoàn tất" />
      </div>
      <ul className="flex flex-col gap-1">
        {CONTENT_STEPS.map((s) => {
          const complete = !issues.some((i) => i.step === s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={s.id === currentStep ? 'step' : undefined}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted',
                  s.id === currentStep && 'bg-muted'
                )}
              >
                {complete ? (
                  <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {sectionStatus(s.id, values, categoryName)}
                  </span>
                </span>
                <span className="sr-only">{complete ? 'Đã đủ' : 'Còn thiếu'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onEdit}
          aria-label={`Sửa ${title.toLowerCase()}`}
        >
          <Pencil data-icon="inline-start" />
          Sửa
        </Button>
      </div>
      {children}
    </section>
  );
}

/** Bước cuối: hiển thị toàn bộ công thức một lần duy nhất, kèm danh sách mục còn thiếu. */
export function RecipeEditorReview({
  values,
  issues,
  categoryName,
  onEdit,
  onFixIssue,
}: {
  values: RecipeFormValues;
  issues: RecipeFieldIssue[];
  categoryName?: string;
  onEdit: (step: RecipeContentStep) => void;
  onFixIssue: (issue: RecipeFieldIssue) => void;
}) {
  const ingredients = values.ingredients.filter((i) => i.name?.trim());
  const steps = values.steps.filter((s) => s.instruction?.trim());
  const cover = values.coverImageUrl?.trim() || null;

  return (
    <div className="flex flex-col gap-6">
      {issues.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertTitle>Còn {issues.length} mục cần bổ sung trước khi gửi</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 flex flex-col gap-1">
              {issues.slice(0, 6).map((issue) => {
                const location = issueLocation(issue.path);
                return (
                  <li key={issue.path}>
                    <button
                      type="button"
                      onClick={() => onFixIssue(issue)}
                      className="text-left underline-offset-2 hover:underline"
                    >
                      {stepTitle(issue.step)}
                      {location ? ` · ${location}` : ''}: {issue.message}
                    </button>
                  </li>
                );
              })}
              {issues.length > 6 && <li>… và {issues.length - 6} mục khác</li>}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Check aria-hidden />
          <AlertTitle>Công thức đã đủ thông tin bắt buộc</AlertTitle>
          <AlertDescription>
            Sau khi gửi, công thức vào hàng chờ duyệt. Hệ thống tự tính dinh dưỡng từ nguyên liệu.
          </AlertDescription>
        </Alert>
      )}

      <ReviewSection title="Thông tin cơ bản" onEdit={() => onEdit('basics')}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:w-40">
            {cover ? (
              <SafeImage
                src={cover}
                fallbackSrc="/logo/logo-mark.png"
                alt="Ảnh bìa món ăn"
                fill
                sizes="160px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                <ImageOff aria-hidden className="size-5" />
                Chưa có ảnh bìa
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-base font-semibold text-balance">
              {values.title?.trim() || (
                <span className="text-muted-foreground">Chưa có tên món</span>
              )}
            </p>
            {values.description?.trim() && (
              <p className="text-sm text-pretty whitespace-pre-line text-muted-foreground">
                {values.description}
              </p>
            )}
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Khẩu phần:</dt>
                <dd className="tabular-nums">{formatNumber(values.servings, 'người')}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Sơ chế:</dt>
                <dd className="tabular-nums">{formatNumber(values.prepTimeMinutes, 'phút')}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Nấu:</dt>
                <dd className="tabular-nums">{formatNumber(values.cookTimeMinutes, 'phút')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </ReviewSection>

      <Separator />

      <ReviewSection
        title={`Nguyên liệu (${ingredients.length})`}
        onEdit={() => onEdit('ingredients')}
      >
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có nguyên liệu.</p>
        ) : (
          <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {ingredients.map((ing, idx) => (
              <li key={`${ing.name}-${idx}`} className="flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate">{ing.name}</span>
                  {!ing.ingredientId && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] text-amber-700 dark:text-amber-400"
                    >
                      Chưa liên kết
                    </Badge>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {Number.isFinite(ing.amount) ? ing.amount : '—'} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ReviewSection>

      <Separator />

      <ReviewSection title={`Các bước nấu (${steps.length})`} onEdit={() => onEdit('steps')}>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bước nấu.</p>
        ) : (
          <ol className="flex flex-col gap-2.5 text-sm">
            {steps.map((st, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                  {idx + 1}
                </span>
                <p className="pt-0.5 text-pretty whitespace-pre-line">{st.instruction}</p>
              </li>
            ))}
          </ol>
        )}
      </ReviewSection>

      <Separator />

      <ReviewSection title="Phân loại" onEdit={() => onEdit('classify')}>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Danh mục:</dt>
            <dd>{categoryName ?? 'Chưa chọn'}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Độ khó:</dt>
            <dd>{difficultyLabel(values.difficulty)}</dd>
          </div>
        </dl>
      </ReviewSection>
    </div>
  );
}
