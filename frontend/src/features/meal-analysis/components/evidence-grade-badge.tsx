'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EvidenceGrade } from '../types/meal-analysis.model';
import { EVIDENCE_GRADE_LABELS } from '../mappers/meal-analysis.mapper';

interface EvidenceGradeBadgeProps {
  grade: EvidenceGrade;
  showIcon?: boolean;
  className?: string;
}

const GRADE_STYLES: Record<EvidenceGrade, string> = {
  GRADE_A: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  GRADE_B: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  GRADE_C: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  GRADE_D: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
};

/**
 * Huy hiệu trực quan thể hiện Cấp độ bằng chứng khoa học (Grade A -> D).
 */
export function EvidenceGradeBadge({
  grade,
  showIcon = true,
  className = '',
}: EvidenceGradeBadgeProps) {
  const style = GRADE_STYLES[grade] ?? GRADE_STYLES.GRADE_B;
  const label = EVIDENCE_GRADE_LABELS[grade] ?? 'Bằng chứng tham khảo';

  return (
    <Badge variant="outline" className={`${style} ${className}`}>
      {showIcon && <ShieldCheck className="mr-1 size-3" />}
      {label}
    </Badge>
  );
}
