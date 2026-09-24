'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Eye,
  Flag,
  Loader2,
  ShieldAlert,
  User,
  Utensils,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostType } from '@/common/enums';
import { useAdminContentReviewDetailQuery } from '../queries/review.queries';
import { VideoPreviewPlayer } from './video-preview-player';
import { ReviewDecisionEnum } from '../types/content-review.model';

interface ReviewDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId: string;
  onDecide: (decision: ReviewDecisionEnum) => void;
}

export function ReviewDetailModal({
  open,
  onOpenChange,
  revisionId,
  onDecide,
}: ReviewDetailModalProps) {
  const { data, isLoading, isError, error } = useAdminContentReviewDetailQuery(
    revisionId,
    open && Boolean(revisionId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="gap-2 pb-3 border-b">
          <div className="flex flex-wrap items-center gap-2">
            {data && (
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20"
              >
                {data.typeLabel}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-mono font-medium">
              v{data?.revisionVersion ?? 1}
            </Badge>
            {data?.isHighPriority && (
              <Badge
                variant="destructive"
                className="text-xs px-2.5 py-0.5 rounded-full gap-1"
              >
                <ShieldAlert className="h-3 w-3" /> Ưu tiên cao
              </Badge>
            )}
            {data?.isPublishedRevision && (
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                Bản xuất bản hiện hành
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl font-bold text-foreground leading-snug">
            {isLoading
              ? 'Đang tải chi tiết kiểm duyệt...'
              : data?.title || 'Chi tiết bản nháp nộp duyệt'}
          </DialogTitle>

          {data && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <strong className="text-foreground font-medium">
                  {data.author.displayName}
                </strong>
                {data.author.role !== 'MEMBER' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {data.author.role}
                  </Badge>
                )}
              </span>

              {data.formattedSubmittedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Nộp: {data.formattedSubmittedAt}
                </span>
              )}

              {data.activeReporterCount > 0 && (
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <Flag className="h-3.5 w-3.5" />
                  {data.activeReporterCount} báo cáo vi phạm
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto pr-1 py-4 flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Đang tải toàn bộ dữ liệu bản nháp...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-destructive">
              Không thể tải chi tiết kiểm duyệt:{' '}
              {error instanceof Error ? error.message : 'Lỗi không xác định'}
            </div>
          ) : data ? (
            <>
              {/* Tín hiệu Cảnh báo AI (nếu có) */}
              {data.hasAiFlags && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Cảnh báo từ hệ thống AI Moderation</span>
                    <Badge variant="outline" className="text-[10px]">
                      {data.aiFlags.length} tín hiệu
                    </Badge>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300">
                    {data.aiFlags.map((flag) => (
                      <li key={flag.id}>
                        {flag.provider} ({flag.model}): Lý do [
                        {flag.reasonCodes.join(', ')}] — Mức độ: {flag.riskLevel}{' '}
                        (Điểm rủi ro: {flag.riskScore})
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground italic">
                    * Lưu ý: Tín hiệu AI chỉ phục vụ mục đích hỗ trợ đánh giá,
                    quyết định phê duyệt hoàn toàn do Quản trị viên quyết định.
                  </p>
                </div>
              )}

              {/* Xem trước Video (nếu là bài Video) */}
              {data.type === PostType.VIDEO && data.video && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <VideoIcon className="h-4 w-4" /> Xem trước Video
                  </h4>
                  <VideoPreviewPlayer
                    source={data.video.source}
                    url={data.video.videoPlayerUrl}
                    durationFormatted={data.video.durationFormatted}
                  />
                </div>
              )}

              {/* Tóm tắt nội dung */}
              {data.excerpt && (
                <div className="rounded-xl bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed italic border border-muted">
                  &quot;{data.excerpt}&quot;
                </div>
              )}

              {/* Chi tiết Công thức nấu ăn (nếu là Recipe) */}
              {data.type === PostType.RECIPE && data.recipe && (
                <div className="space-y-4 rounded-2xl border p-4 bg-card/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Utensils className="h-4 w-4" /> Chi tiết Công thức
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">
                        Chuẩn bị:
                      </span>
                      <strong className="text-foreground">
                        {data.recipe.prepTimeMinutes} phút
                      </strong>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">
                        Nấu:
                      </span>
                      <strong className="text-foreground">
                        {data.recipe.cookTimeMinutes} phút
                      </strong>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">
                        Khẩu phần:
                      </span>
                      <strong className="text-foreground">
                        {data.recipe.servings} người
                      </strong>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">
                        Độ khó:
                      </span>
                      <strong className="text-foreground">
                        {data.recipe.difficulty}
                      </strong>
                    </div>
                  </div>

                  {/* Nguyên liệu */}
                  {data.recipe.ingredients.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-semibold text-foreground">
                        Nguyên liệu ({data.recipe.ingredients.length}):
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {data.recipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-muted/40"
                          >
                            <span className="font-medium text-foreground">
                              {ing.name}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {ing.amount} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hướng dẫn thực hiện */}
                  {data.recipe.instructions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-semibold text-foreground">
                        Các bước thực hiện ({data.recipe.instructions.length}):
                      </h5>
                      <div className="space-y-2">
                        {data.recipe.instructions.map((inst, idx) => (
                          <div
                            key={idx}
                            className="flex gap-3 text-xs p-2.5 rounded-xl bg-muted/20 border border-muted/30"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                              {inst.stepNumber}
                            </span>
                            <p className="leading-relaxed text-foreground flex-1">
                              {inst.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nội dung bài viết đầy đủ */}
              {data.body && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nội dung toàn văn
                  </h4>
                  <div className="rounded-2xl border p-4 bg-muted/10 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {data.body}
                  </div>
                </div>
              )}

              {/* Danh mục và Thẻ */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {data.categories.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-[11px]">
                    📁 {c.name}
                  </Badge>
                ))}
                {data.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[11px] text-muted-foreground"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Thanh công cụ ra quyết định */}
        <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
          {!data?.canDecide && data && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Bạn không thể tự duyệt bài viết của chính mình (chỉ xem).
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Đóng
            </Button>

            {data?.canDecide && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDecide(ReviewDecisionEnum.REJECT)}
                  className="rounded-xl text-xs gap-1.5 font-semibold"
                >
                  <X className="h-3.5 w-3.5" /> Từ chối
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onDecide(ReviewDecisionEnum.APPROVE)}
                  className="rounded-xl text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-3.5 w-3.5" /> Phê duyệt
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
