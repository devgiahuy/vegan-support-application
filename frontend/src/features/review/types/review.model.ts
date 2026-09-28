import { ModerationPriority, PostType, ReviewItemStatus } from '@/common/enums';

// Re-export toàn bộ types của Phase 16
export * from './content-review.model';

// Types tương thích cho các component legacy và unit test hiện tại
export interface AiFlag {
  id: string;
  reasonCodes: string[];
  riskScore: number;
  riskLevel: string;
}

export interface ReviewQueueItem {
  postId: string;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string;
  status: ReviewItemStatus;
  statusLabel: string;
  revisionVersion: number;
  author: {
    id: string;
    name: string;
  };
  aiFlags: AiFlag[];
  priority: ModerationPriority;
  priorityLabel: string;
  activeReporterCount: number;
  canDecide: boolean;
  createdAt: Date | null;
  formattedCreatedAt: string;
}
