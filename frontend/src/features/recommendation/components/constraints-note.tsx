import type { RecommendationMeta } from '../types/recommendation.model';

/** Dòng ngữ cảnh chấm điểm gọn: phiên bản + ràng buộc đã lọc / ghi chú cold-start. */
export function ConstraintsNote({ meta }: { meta: RecommendationMeta }) {
  return (
    <p className="text-xs text-muted-foreground">
      {meta.personalized ? (
        <>
          Gợi ý dành riêng cho bạn
          {meta.scoringVersion && ` · ${meta.scoringVersion}`}
          {meta.constraintsSummary && ` · ${meta.constraintsSummary}`}
        </>
      ) : (
        <>Gợi ý phổ biến cho mọi người {meta.scoringVersion && `· ${meta.scoringVersion}`}</>
      )}
    </p>
  );
}
