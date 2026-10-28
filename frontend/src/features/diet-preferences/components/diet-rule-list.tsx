'use client';

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import type { DietRule } from '../types/diet.model';

const SOURCE_LABELS: Record<string, string> = {
  DIET_PATTERN: 'Kiểu ăn',
  TRADITION: 'Truyền thống',
};
const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;

/**
 * Danh sách quy tắc chia 2 nhóm: quy tắc cứng (`isHard`) luôn bật vì backend luôn
 * enforce, và quy tắc tùy chọn người dùng bật/tắt.
 */
export function DietRuleList({
  rules,
  onToggle,
}: {
  rules: DietRule[];
  onToggle: (ruleDefinitionId: string, enabled: boolean) => void;
}) {
  if (rules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Chưa có quy tắc nào cho lựa chọn này.
      </p>
    );
  }

  const hard = rules.filter((rule) => rule.isHard);
  const optional = rules.filter((rule) => !rule.isHard);

  return (
    <div className="flex flex-col gap-8">
      {hard.length > 0 && (
        <FieldSet>
          <FieldLegend>Luôn áp dụng ({hard.length})</FieldLegend>
          <FieldDescription>
            Đây là định nghĩa của kiểu ăn bạn chọn nên không thể tắt.
          </FieldDescription>
          <ul className="flex flex-col divide-y rounded-xl border">
            {hard.map((rule) => (
              <li key={rule.ruleDefinitionId} className="flex items-center gap-3 p-3">
                <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm font-medium text-pretty">{rule.name}</p>
                  {rule.source && (
                    <p className="text-xs text-muted-foreground">
                      Theo: {sourceLabel(rule.source)}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Luôn bật</Badge>
              </li>
            ))}
          </ul>
        </FieldSet>
      )}

      {optional.length > 0 && (
        <FieldSet>
          <FieldLegend>Tùy chọn ({optional.length})</FieldLegend>
          <FieldDescription>
            Bật những quy tắc bạn muốn hệ thống áp dụng thêm khi lọc món và lập thực đơn.
          </FieldDescription>
          <ul className="flex flex-col divide-y rounded-xl border">
            {optional.map((rule) => {
              const switchId = `diet-rule-${rule.ruleDefinitionId}`;
              return (
                <li key={rule.ruleDefinitionId} className="flex items-center gap-3 p-3">
                  <label htmlFor={switchId} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-pretty">{rule.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {rule.source && <span>Theo: {sourceLabel(rule.source)}</span>}
                      {rule.isDefault && <Badge variant="outline">Gợi ý bật</Badge>}
                    </span>
                  </label>
                  <Switch
                    id={switchId}
                    checked={rule.enabled}
                    onCheckedChange={(checked) => onToggle(rule.ruleDefinitionId, checked)}
                  />
                </li>
              );
            })}
          </ul>
        </FieldSet>
      )}
    </div>
  );
}
