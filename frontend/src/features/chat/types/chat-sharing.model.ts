/** Câu trả lời chia sẻ dùng cho UI. */
export interface SharedAnswer {
  messageId: string;
  /** Định danh liên kết công khai (khác messageId). */
  shareId: string;
  shareUrl: string;
  shared: boolean;
  sharedAt: Date | null;
}

/** Mục công khai (tác giả ẩn danh hóa). */
export interface PublicAnswer {
  shareId: string;
  /** UUID tin nhắn gốc (dùng cho kiểm chứng). */
  messageId: string;
  question: string;
  answer: string;
  disclaimer: string | null;
  authorLabel: string;
  sharedAt: Date | null;
  verification: AnswerVerification | null;
}

/** Kiểm chứng chuyên gia. */
export interface AnswerVerification {
  messageId: string;
  verifierName: string;
  verifierRole: string;
  verifierRoleLabel: string;
  note: string | null;
  verifiedAt: Date | null;
}

/** Tham số query danh sách công khai. */
export interface PublicAnswerQueryParams {
  page?: number;
  limit?: number;
  q?: string;
}
