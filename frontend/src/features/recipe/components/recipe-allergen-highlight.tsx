import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RecipeAllergyWarning } from '../types/recipe.model';

export interface RecipeAllergenHighlightProps {
  warnings?: RecipeAllergyWarning[];
  className?: string;
}

/** Only backend-confirmed matches to the viewer's saved allergies may produce this warning. */
export function RecipeAllergenHighlight({
  warnings = [],
  className,
}: RecipeAllergenHighlightProps) {
  if (warnings.length === 0) return null;

  return (
    <Alert
      variant="destructive"
      aria-label="Cảnh báo dị ứng theo hồ sơ của bạn"
      className={cn('rounded-2xl bg-destructive/5 p-4 sm:p-5', className)}
    >
      <AlertTriangle aria-hidden="true" />
      <AlertTitle className="line-clamp-none text-balance font-bold">
        Cảnh báo dị ứng theo hồ sơ của bạn
      </AlertTitle>
      <AlertDescription className="text-pretty">
        <p>Công thức có thành phần trùng với dị ứng bạn đã khai báo:</p>
        <ul className="mt-3 flex flex-col gap-2" aria-label="Dị ứng trùng với hồ sơ">
          {warnings.map((warning) => (
            <li
              key={`${warning.kind}:${warning.identifier}`}
              className="flex flex-wrap items-baseline gap-2"
            >
              <Badge variant="outline">{warning.label}</Badge>
              {warning.ingredientNames.length > 0 && (
                <span>Trong nguyên liệu: {warning.ingredientNames.join(', ')}.</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3">Hãy kiểm tra thành phần trước khi dùng hoặc chọn công thức khác.</p>
      </AlertDescription>
    </Alert>
  );
}
