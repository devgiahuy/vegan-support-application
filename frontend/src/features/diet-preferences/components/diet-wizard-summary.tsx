'use client';

import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PracticeSchedule } from '@/common/enums';
import {
  PATTERN_OPTIONS,
  SCHEDULE_OPTIONS,
  TRADITION_OPTIONS,
  optionLabel,
  type DietSelection,
} from './diet-selector';
import { severityLabel } from './allergy-editor';
import { toDisplayDate } from './schedule-date-picker';
import type {
  Allergy,
  DietRule,
  IngredientAllergy,
  IngredientExclusion,
} from '../types/diet.model';

export type SummarySection = 'diet' | 'rules' | 'restrictions';

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">{title}</h3>
        {onEdit && (
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
        )}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

/** Tóm tắt lựa chọn hiện tại của wizard — dùng ở cột bên và bước xác nhận. */
export function DietWizardSummary({
  selection,
  scheduleDates,
  rules,
  allergies,
  ingredientAllergies,
  exclusions,
  onEdit,
  compact = false,
}: {
  selection: DietSelection;
  scheduleDates: string[];
  rules: DietRule[] | null;
  allergies: Allergy[];
  ingredientAllergies: IngredientAllergy[];
  exclusions: IngredientExclusion[];
  onEdit?: (section: SummarySection) => void;
  compact?: boolean;
}) {
  const isPeriodic = selection.practiceSchedule === PracticeSchedule.PERIODIC;
  const enabledOptional = rules?.filter((rule) => !rule.isHard && rule.enabled) ?? [];
  const hardCount = rules?.filter((rule) => rule.isHard).length ?? 0;
  const allergyCount = allergies.length + ingredientAllergies.length;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Chế độ ăn" onEdit={onEdit && (() => onEdit('diet'))}>
        {selection.dietPattern ? (
          <div className="flex flex-wrap gap-1.5">
            <Badge>{optionLabel(PATTERN_OPTIONS, selection.dietPattern)}</Badge>
            {selection.practiceSchedule && (
              <Badge variant="secondary">
                {optionLabel(SCHEDULE_OPTIONS, selection.practiceSchedule)}
              </Badge>
            )}
            {selection.tradition && (
              <Badge variant="secondary">
                {optionLabel(TRADITION_OPTIONS, selection.tradition)}
              </Badge>
            )}
          </div>
        ) : (
          <Empty>Chưa chọn.</Empty>
        )}
        {isPeriodic && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {scheduleDates.length > 0
              ? `${scheduleDates.length} ngày chay: ${scheduleDates
                  .slice(0, compact ? 3 : 8)
                  .map(toDisplayDate)
                  .join(', ')}${scheduleDates.length > (compact ? 3 : 8) ? '…' : ''}`
              : 'Chưa chọn ngày chay.'}
          </p>
        )}
      </Section>

      <Separator />

      <Section title="Quy tắc" onEdit={onEdit && rules ? () => onEdit('rules') : undefined}>
        {rules ? (
          <>
            <p className="text-sm tabular-nums">
              {hardCount} quy tắc bắt buộc · {enabledOptional.length} tùy chọn đang bật
            </p>
            {!compact && enabledOptional.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {enabledOptional.map((rule) => (
                  <li key={rule.ruleDefinitionId}>• {rule.name}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Empty>Hiện sau khi chọn chế độ ăn.</Empty>
        )}
      </Section>

      <Separator />

      <Section
        title="Dị ứng & kiêng"
        onEdit={onEdit && rules ? () => onEdit('restrictions') : undefined}
      >
        {allergyCount === 0 && exclusions.length === 0 ? (
          <Empty>Không khai báo.</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {allergyCount > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm tabular-nums">Dị ứng ({allergyCount})</p>
                <ul className="flex flex-wrap gap-1.5">
                  {allergies.map((entry) => (
                    <li key={entry.allergenCode}>
                      <Badge variant="outline">
                        {entry.label} · {severityLabel(entry.severity)}
                      </Badge>
                    </li>
                  ))}
                  {ingredientAllergies.map((entry) => (
                    <li key={entry.ingredientId}>
                      <Badge variant="outline">
                        {entry.ingredientName} · {severityLabel(entry.severity)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exclusions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm tabular-nums">Không ăn ({exclusions.length})</p>
                <ul className="flex flex-wrap gap-1.5">
                  {exclusions.map((entry) => (
                    <li key={entry.ingredientId ?? entry.ingredientName}>
                      <Badge variant="outline">{entry.ingredientName}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
