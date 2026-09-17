import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShoppingListItem } from '../types/meal-plan.model';

/** Danh sách đi chợ đã gộp. Chỉ nhận Model (`displayLine` ghép sẵn ở mapper). */
export function ShoppingList({ items }: { items: ShoppingListItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="size-4" />
          Danh sách đi chợ
          <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có nguyên liệu nào.</p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {items.map((item, index) => (
              <li
                key={`${item.ingredientId ?? item.name}-${index}`}
                className="rounded-lg bg-muted/60 px-3 py-1.5 text-sm"
              >
                {item.displayLine}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
