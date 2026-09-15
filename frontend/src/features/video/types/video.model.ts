export interface VideoTimestampStep {
  timeSeconds: number;
  timeLabel: string;
  title: string;
  desc: string;
}

export interface VideoAiSummary {
  dishName: string;
  summaryText: string;
  confidenceScore: number;
  detectedIngredients: string[];
  timelineSteps: VideoTimestampStep[];
}

export interface VideoAuthor {
  name: string;
  avatar: string;
  verified?: boolean;
  roleBadge?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  durationLabel: string;
  durationSeconds: number;
  views: number;
  likes: number;
  uploadedAt: string;
  dietSchool: 'PHAT_GIAO' | 'DAO_GIAO' | 'THUAN_CHAY';
  category: string;
  author: VideoAuthor;
  aiSummary: VideoAiSummary;
}
