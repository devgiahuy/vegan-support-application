import { PostStatus } from '@/common/enums';

/**
 * Kết quả của `POST /posts/:id/submit`, suy ra từ trạng thái của revision vừa gửi.
 * Không dùng `post.status` vì bài đã xuất bản vẫn giữ `PUBLISHED` khi revision mới đang chờ duyệt.
 * - `PUBLISHED`: Contributor đã được duyệt tự xuất bản ngay.
 * - `IN_REVIEW`: vào hàng đợi (`PENDING_REVIEW`) hoặc bị tín hiệu kiểm duyệt giữ lại (`FLAGGED`/`QUARANTINED`).
 * - `DRAFT`: gửi chưa thành công hoặc chỉ lưu nháp.
 */
export type SubmitOutcome = 'PUBLISHED' | 'IN_REVIEW' | 'DRAFT';

export function getSubmitOutcome(revisionStatus: PostStatus): SubmitOutcome {
  if (revisionStatus === PostStatus.PUBLISHED) return 'PUBLISHED';
  if (revisionStatus === PostStatus.DRAFT) return 'DRAFT';
  return 'IN_REVIEW';
}

export type SubmitSubject = 'công thức' | 'bài viết' | 'video';

export interface SubmitFeedback {
  title: string;
  message: string;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Thông báo sau khi lưu + gửi; `isUpdate` phân biệt tạo mới và cập nhật bản của chính mình. */
export function getSubmitFeedback(
  outcome: SubmitOutcome,
  subject: SubmitSubject,
  isUpdate = false
): SubmitFeedback {
  const noun = capitalize(subject);
  switch (outcome) {
    case 'PUBLISHED':
      return {
        title: 'Đã xuất bản',
        message: isUpdate
          ? `${noun} đã được cập nhật và xuất bản ngay.`
          : `${noun} đã được xuất bản ngay vì tài khoản Cộng tác viên của bạn đã được duyệt.`,
      };
    case 'IN_REVIEW':
      return {
        title: isUpdate ? 'Đã lưu' : 'Đã gửi duyệt',
        message: isUpdate
          ? `${noun} đã được cập nhật và gửi lại để duyệt.`
          : `${noun} đã được gửi vào hàng đợi kiểm duyệt.`,
      };
    default:
      return {
        title: 'Đã lưu bản nháp',
        message: `${noun} đã được lưu nhưng chưa gửi được. Hãy kiểm tra rồi gửi lại.`,
      };
  }
}
