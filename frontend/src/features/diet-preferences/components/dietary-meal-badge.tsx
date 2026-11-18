import { Badge } from '@/components/ui/badge';
import type { DietaryImpactItem } from '../types/diet-impact.model';

export function DietaryMealBadge({ item }: { item?: DietaryImpactItem }) {
  if (!item) return null;
  return (
    <Badge variant="outline" title={item.reasonLabels.join('; ')}>
      {item.unverified ? 'Chưa đủ dữ liệu' : 'Không hợp thiết lập hiện tại'}
      <span className="sr-only">: {item.reasonLabels.join('; ')}</span>
    </Badge>
  );
}
