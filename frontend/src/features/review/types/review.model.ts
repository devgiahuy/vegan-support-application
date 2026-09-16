import { ModerationPriority, PostType, ReviewItemStatus } from '@/common/enums';

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

export interface ReviewQueueQueryParams {
  page?: number;
  limit?: number;
  status?: ReviewItemStatus;
  type?: PostType;
  priority?: ModerationPriority;
}
