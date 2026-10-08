'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncompleteDataBannerProps {
  confidence: number;
  notes?: string | null;
  className?: string;
}

/**
 * Banner thông báo độ bao phủ dữ liệu dinh dưỡng chưa hoàn thiện.
 * Tuân thủ quy tắc: "Incomplete data is NOT zero".
 * Tự động gom gọn các mã kỹ thuật UUID thành thông điệp thân thiện cho người dùng.
 */
export function IncompleteDataBanner({
  confidence,
  notes,
  className = '',
}: IncompleteDataBannerProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const percent = Math.round(confidence * 100);

  // Phân tích nếu notes chứa danh sách món cần lưu ý từ backend
  const parsedItems = React.useMemo(() => {
    if (!notes) return [];
    return notes
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) =>
        item
          .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            (uuid) => `#${uuid.slice(0, 6)}`
          )
          .replace(/Recipe item /gi, 'Món ăn ')
      );
  }, [notes]);

  const hasRawRecipeItems = parsedItems.length > 0;

  return (
    <div
      className={`rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300 transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <HelpCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              Dữ liệu dinh dưỡng ước tính (Độ tin cậy: {percent}%)
            </span>
            {hasRawRecipeItems && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="h-6 px-2 text-[11px] text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
              >
                {showTechnicalDetails ? (
                  <>
                    <ChevronUp className="size-3 mr-1" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3 mr-1" />
                    Xem danh sách ({parsedItems.length} món)
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="leading-relaxed text-muted-foreground">
            {hasRawRecipeItems ? (
              <>
                Thực đơn có{' '}
                <strong className="text-foreground font-semibold">
                  {parsedItems.length} món ăn
                </strong>{' '}
                chưa có đủ dữ liệu để ước tính đầy đủ chất đạm, chất xơ, chất béo và tinh bột. Chỉ
                số dinh dưỡng tuần hiện được tính dựa trên các thành phần đã có dữ liệu chuẩn.
              </>
            ) : (
              (notes ??
              'Thực đơn tuần có chứa món ăn cá nhân hoặc nguyên liệu tự do chưa được chuẩn hóa với cơ sở dữ liệu thực phẩm.')
            )}
          </p>

          {hasRawRecipeItems && showTechnicalDetails && (
            <div className="mt-2 rounded border border-amber-500/20 bg-background/60 p-2.5 max-h-36 overflow-y-auto space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1">
                <Info className="size-3" />
                Danh sách món cần lưu ý:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground font-sans">
                {parsedItems.map((item, idx) => (
                  <li key={idx} className="break-all">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 pt-0.5">
            ⚠️ Hệ thống tính toán chỉ số dựa trên các thành phần đã kiểm định và{' '}
            <strong>tuyệt đối không coi các nguyên liệu còn thiếu là 0 calo/0 dinh dưỡng</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
