'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRatingMutation } from '../queries/community.queries';

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${label}: ${score} điểm`}
            onClick={() => onChange(score)}
            className="rounded-md p-0.5 transition-colors hover:bg-muted"
          >
            <Star
              className={cn(
                'size-5',
                score <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Chấm điểm vị + độ khó cho công thức (bắt buộc cả 2, 1–5).
 * Chỉ render khi loại nội dung là recipe (caller đảm bảo).
 */
export function RatingInput({
  postId,
  initialTaste = 0,
  initialDifficulty = 0,
}: {
  postId: string;
  initialTaste?: number;
  initialDifficulty?: number;
}) {
  const [taste, setTaste] = React.useState(initialTaste);
  const [difficulty, setDifficulty] = React.useState(initialDifficulty);
  const [formError, setFormError] = React.useState<string | null>(null);
  const ratingMutation = useRatingMutation();

  React.useEffect(() => {
    if (initialTaste > 0) setTaste(initialTaste);
  }, [initialTaste]);

  React.useEffect(() => {
    if (initialDifficulty > 0) setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  const submit = () => {
    if (taste < 1 || difficulty < 1) {
      setFormError('Vui lòng chấm cả vị ngon và độ khó (1–5 điểm).');
      return;
    }
    setFormError(null);
    ratingMutation.mutate({ postId, taste, difficulty });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <ScorePicker label="Vị ngon" value={taste} onChange={setTaste} />
        <ScorePicker label="Độ khó" value={difficulty} onChange={setDifficulty} />
      </div>
      {formError && <p className="text-xs text-destructive">{formError}</p>}
      <div>
        <Button size="sm" onClick={submit} disabled={ratingMutation.isPending}>
          {ratingMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </div>
    </div>
  );
}
