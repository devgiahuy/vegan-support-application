import { Badge } from '@/components/ui/badge';

/** Tối đa 2 badges lý do; mã lạ hiện nguyên văn (mapper đã fallback). */
export function ReasonBadges({ codes, labels }: { codes: string[]; labels: string[] }) {
  if (codes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.slice(0, 2).map((code, index) => (
        <Badge
          key={code}
          variant="secondary"
          className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-medium"
        >
          {labels[index] ?? code}
        </Badge>
      ))}
    </div>
  );
}
