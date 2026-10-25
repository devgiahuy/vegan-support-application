'use client';

import * as React from 'react';
import { Plus, ShieldAlert, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Allergy } from '../types/diet.model';

/** Mức độ dị ứng theo contract backend (bắt buộc, không để trống). */
const SEVERITY_OPTIONS = [
  { value: 'MILD', label: 'Nhẹ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'SEVERE', label: 'Nặng' },
] as const;

const SEVERITY_LABELS: Record<string, string> = {
  MILD: 'Nhẹ',
  MODERATE: 'Trung bình',
  SEVERE: 'Nặng',
};

/**
 * Quản lý dị ứng. Dị ứng luôn là ràng buộc cứng ở backend — UI chỉ thêm/xóa,
 * không có công tắc tắt.
 */
export function AllergyEditor({
  value,
  onChange,
}: {
  value: Allergy[];
  onChange: (v: Allergy[]) => void;
}) {
  const [code, setCode] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [severity, setSeverity] = React.useState<string>('MODERATE');
  const [error, setError] = React.useState<string | null>(null);

  const add = () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length === 0) {
      setError('Vui lòng nhập mã chất gây dị ứng.');
      return;
    }
    if (value.some((a) => a.allergenCode.toUpperCase() === normalized)) {
      setError('Chất này đã có trong danh sách.');
      return;
    }
    setError(null);
    onChange([...value, { allergenCode: normalized, label: label.trim() || normalized, severity }]);
    setCode('');
    setLabel('');
    setSeverity('MODERATE');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Label>Dị ứng của bạn</Label>
        <Badge variant="secondary" className="gap-1 rounded-full text-[11px]">
          <ShieldAlert className="h-3 w-3" /> Luôn là ràng buộc cứng
        </Badge>
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li
              key={a.allergenCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-secondary-foreground/10 px-3 py-1 text-xs text-secondary-foreground"
              title={
                a.severity ? `Mức độ: ${SEVERITY_LABELS[a.severity] ?? a.severity}` : undefined
              }
            >
              <span className="font-medium">{a.label || a.allergenCode}</span>
              {a.severity && (
                <span className="text-[10px] text-muted-foreground bg-background/60 rounded px-1.5 py-0.5">
                  {SEVERITY_LABELS[a.severity] ?? a.severity}
                </span>
              )}
              <button
                type="button"
                aria-label={`Xóa dị ứng ${a.label || a.allergenCode}`}
                onClick={() => onChange(value.filter((x) => x.allergenCode !== a.allergenCode))}
                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-background/80 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Chưa có dị ứng nào. Thêm dị ứng bên dưới nếu bạn có kiêng kỵ dị ứng thực phẩm.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã, vd: PEANUT"
          aria-label="Mã chất gây dị ứng"
        />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên hiển thị (tùy chọn)"
          aria-label="Tên hiển thị dị ứng"
        />
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger aria-label="Mức độ dị ứng">
            <SelectValue placeholder="Mức độ" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" className="gap-1 rounded-xl" onClick={add}>
          <Plus className="h-4 w-4" /> Thêm
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
