'use client';

import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { DietRule } from '../types/diet.model';

/**
 * Danh sách quy tắc với công tắc bật/tắt. Quy tắc cứng (`isHard`)
 * bị disabled kèm nhãn "Luôn bật" — backend luôn enforce.
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
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Chưa có quy tắc nào cho lựa chọn này.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rules.map((rule) => (
        <li
          key={rule.ruleDefinitionId}
          className="flex items-center justify-between gap-3 rounded-xl border p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{rule.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {rule.source && (
                <span className="text-xs text-muted-foreground">Nguồn: {rule.source}</span>
              )}
              {rule.isHard ? (
                <Badge variant="secondary" className="gap-1 rounded-full text-[11px]">
                  <Lock className="h-3 w-3" /> Luôn bật
                </Badge>
              ) : (
                rule.isDefault && (
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    Mặc định bật
                  </Badge>
                )
              )}
            </div>
          </div>
          <Switch
            checked={rule.isHard ? true : rule.enabled}
            disabled={rule.isHard}
            onCheckedChange={(checked) => onToggle(rule.ruleDefinitionId, checked)}
            aria-label={`Bật/tắt quy tắc ${rule.name}`}
          />
        </li>
      ))}
    </ul>
  );
}
