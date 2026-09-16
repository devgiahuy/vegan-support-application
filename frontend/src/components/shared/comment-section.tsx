'use client';

import * as React from 'react';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Heart,
  Smile,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoteControl } from './vote-control';

export interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  roleBadge?: 'EXPERT_VERIFIED' | 'EXPERIENCED_COOK' | 'AUTHOR' | 'USER';
  roleTitle?: string;
  content: string;
  createdAt: string;
  score: number;
  replies?: CommentItem[];
}

interface CommentSectionProps {
  initialComments?: CommentItem[];
  itemTitle?: string;
  itemType?: 'bài viết' | 'công thức' | 'video';
  className?: string;
}

const DEFAULT_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    authorName: 'Bác sĩ Lan Anh',
    authorAvatar: 'https://i.pravatar.cc/80?img=47',
    roleBadge: 'EXPERT_VERIFIED',
    roleTitle: 'Chuyên gia Y học cổ truyền',
    content:
      'Bài viết cung cấp kiến thức rất chuẩn xác về việc cân bằng ngũ vị theo y lý đông y. Việc phối hợp nấm và các loại củ ngọt tự nhiên giúp dưỡng tỳ vị rất tốt cho người cao tuổi ăn chay.',
    createdAt: '2 giờ trước',
    score: 18,
    replies: [
      {
        id: 'c1-1',
        authorName: 'HuongLan.Vegan',
        authorAvatar: 'https://i.pravatar.cc/80?img=32',
        roleBadge: 'AUTHOR',
        roleTitle: 'Tác giả bài viết',
        content: 'Dạ con cảm ơn lời nhận xét và góp ý quý báu của Bác sĩ ạ! 🙏',
        createdAt: '1 giờ trước',
        score: 6,
      },
    ],
  },
  {
    id: 'c2',
    authorName: 'Minh Tuấn Nutri',
    authorAvatar: 'https://i.pravatar.cc/80?img=15',
    roleBadge: 'EXPERIENCED_COOK',
    roleTitle: 'Người nấu chay 8 năm kinh nghiệm',
    content:
      'Mình áp dụng mẹo khía nấm đùi gà theo hướng dẫn này nấu cho cả nhà ngày rằm vừa rồi, nấm thấm gia vị đậm đà không hề bị nhạt ruột!',
    createdAt: 'Hôm qua',
    score: 9,
  },
];

export function CommentSection({
  initialComments = DEFAULT_COMMENTS,
  itemTitle,
  itemType = 'bài viết',
  className,
}: CommentSectionProps) {
  const [comments, setComments] = React.useState<CommentItem[]>(initialComments);
  const [newCommentText, setNewCommentText] = React.useState('');
  const [replyingToId, setReplyingToId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Rate-limiting simulation (SRS UC-03: chống spam >10 comment/phút)
  const commentTimestamps = React.useRef<number[]>([]);
  const [isRateLimited, setIsRateLimited] = React.useState(false);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    // Giữ lại các lần gửi trong vòng 60 giây qua
    commentTimestamps.current = commentTimestamps.current.filter((t) => now - t < 60000);

    if (commentTimestamps.current.length >= 10) {
      setIsRateLimited(true);
      toast.error(
        'Cảnh báo chống spam: Bạn đã gửi quá nhiều bình luận. Vui lòng thử lại sau 15 phút.'
      );
      setTimeout(() => setIsRateLimited(false), 15000);
      return false;
    }

    commentTimestamps.current.push(now);
    return true;
  };

  const handleSendComment = () => {
    if (!newCommentText.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận.');
      return;
    }

    if (!checkRateLimit()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newComment: CommentItem = {
        id: `c-${Date.now()}`,
        authorName: 'HuongLan.Vegan',
        authorAvatar: 'https://i.pravatar.cc/80?img=32',
        roleBadge: 'USER',
        roleTitle: 'Thành viên cộng đồng',
        content: newCommentText.trim(),
        createdAt: 'Vừa xong',
        score: 1,
      };

      setComments((prev) => [newComment, ...prev]);
      setNewCommentText('');
      setIsSubmitting(false);
      toast.success('Bình luận của bạn đã được đăng công khai!');
    }, 400);
  };

  const handleSendReply = (parentId: string) => {
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }

    if (!checkRateLimit()) return;

    const newReply: CommentItem = {
      id: `rep-${Date.now()}`,
      authorName: 'HuongLan.Vegan',
      authorAvatar: 'https://i.pravatar.cc/80?img=32',
      roleBadge: 'USER',
      roleTitle: 'Thành viên',
      content: replyText.trim(),
      createdAt: 'Vừa xong',
      score: 1,
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply],
          };
        }
        return c;
      })
    );

    setReplyText('');
    setReplyingToId(null);
    toast.success('Đã gửi phản hồi bình luận!');
  };

  const totalCommentCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <Card className={cn('border-border/70 shadow-sm overflow-hidden', className)}>
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Bình luận &amp; Thảo luận ({totalCommentCount})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chia sẻ ý kiến và bỏ phiếu Up/Downvote cho các phản hồi hữu ích (UC-03)
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs font-normal">
            Bảo mật &amp; Kiểm duyệt tự động
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* New Comment Input Box */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-border shrink-0 mt-1">
            <AvatarImage src="https://i.pravatar.cc/80?img=32" alt="Avatar" />
            <AvatarFallback>HL</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={isRateLimited}
              maxLength={500}
              placeholder={`Viết bình luận hoặc đặt câu hỏi về ${itemType}...`}
              className="resize-none text-sm bg-background border-border/80 focus:border-primary"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{newCommentText.length}/500 ký tự</span>

              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={isSubmitting || isRateLimited || !newCommentText.trim()}
                className="gap-1.5 font-semibold text-xs px-4"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
              </Button>
            </div>

            {isRateLimited && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Bạn đang gửi quá nhanh. Chức năng tạm khóa trong 15 giây để chống spam.
              </div>
            )}
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 pt-2 border-t divide-y divide-border/60">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-4 first:pt-0 space-y-3">
              {/* Parent comment */}
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                  <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                  <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.authorName}
                    </span>

                    {comment.roleBadge === 'EXPERT_VERIFIED' && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 py-0 px-2 font-medium"
                      >
                        <ShieldCheck className="h-3 w-3 text-primary" /> Chuyên gia Dinh dưỡng
                      </Badge>
                    )}
                    {comment.roleBadge === 'EXPERIENCED_COOK' && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] gap-1 py-0 px-2 font-medium"
                      >
                        <BadgeCheck className="h-3 w-3 text-amber-600" /> Bếp chay có kinh nghiệm
                      </Badge>
                    )}
                    {comment.roleBadge === 'AUTHOR' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-primary border-primary/40 py-0 px-2"
                      >
                        Tác giả
                      </Badge>
                    )}

                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {comment.createdAt}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>

                  {/* Actions under comment */}
                  <div className="flex items-center gap-3 pt-1">
                    <VoteControl initialScore={comment.score} orientation="horizontal" size="sm" />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setReplyingToId(replyingToId === comment.id ? null : comment.id)
                      }
                      className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2"
                    >
                      <CornerDownRight className="h-3 w-3" /> Trả lời
                    </Button>
                  </div>

                  {/* Inline Reply Input */}
                  {replyingToId === comment.id && (
                    <div className="flex items-start gap-2 pt-2 mt-2 border-t">
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src="https://i.pravatar.cc/80?img=32" alt="You" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1.5">
                        <Textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Trả lời ${comment.authorName}...`}
                          className="resize-none text-xs bg-background"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            className="h-7 text-xs"
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="h-7 text-xs px-3 font-semibold"
                          >
                            Gửi phản hồi
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nested Replies (1 level) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-11 space-y-3 pt-1 border-l-2 border-muted ml-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarImage src={reply.authorAvatar} alt={reply.authorName} />
                        <AvatarFallback>{reply.authorName[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {reply.authorName}
                          </span>
                          {reply.roleBadge === 'AUTHOR' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-primary border-primary/40 py-0 px-1.5"
                            >
                              Tác giả
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {reply.createdAt}
                          </span>
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {reply.content}
                        </p>

                        <div className="pt-0.5">
                          <VoteControl
                            initialScore={reply.score}
                            orientation="horizontal"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
